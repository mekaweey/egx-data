/**
 * Tier EE/FF/GG/HH/II/JJ/KK/LL — drift detection, ensemble disagreement,
 * feature-importance decay, counterfactual replay, multi-timeframe confluence,
 * microstructure proxy, self-diagnostic, meta-hyperparameter search.
 * Pure in-memory + snapshot/restore. No IO.
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));

// ───────────────────────── EE: Concept Drift (ADWIN + Page-Hinkley lite) ─────
const errBuf: number[] = [];        // |predicted_dir - realised_dir|
let phSum = 0, phMin = 0, phDriftFlag = false;

export function recordPredictionErrorEE(predConfidence: number, realisedPct: number): void {
  // prediction "direction" mapped to [-1,1], realised direction to [-1,1].
  const predDir = clamp((predConfidence - 50) / 50, -1, 1);
  const realDir = clamp(realisedPct / 5, -1, 1);
  const err = Math.abs(predDir - realDir);
  errBuf.push(err);
  if (errBuf.length > 300) errBuf.splice(0, errBuf.length - 200);
  // Page-Hinkley
  const mean = errBuf.reduce((a, b) => a + b, 0) / errBuf.length;
  phSum += err - mean - 0.005;
  if (phSum < phMin) phMin = phSum;
  phDriftFlag = (phSum - phMin) > 0.5;
}

export function driftMultiplierEE(): number {
  if (errBuf.length < 30) return 1;
  if (phDriftFlag) {
    // reset accumulator and shrink
    phSum = 0; phMin = 0; phDriftFlag = false;
    return 0.88;
  }
  // recent vs older error
  const recent = errBuf.slice(-30);
  const older = errBuf.slice(-90, -30);
  if (older.length < 30) return 1;
  const rMean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const oMean = older.reduce((a, b) => a + b, 0) / older.length;
  const delta = rMean - oMean;
  if (delta > 0.15) return 0.92;
  if (delta < -0.10) return 1.04;
  return 1;
}

// ───────────────────────── FF: Ensemble Disagreement Uncertainty ─────────────
// Proxy: dispersion across contributing-module signals.
export function ensembleDisagreementMultiplierFF(
  signals: Array<{ name: string; value: number }>,
): number {
  if (signals.length < 3) return 1;
  const vals = signals.map((s) => clamp(s.value, -2, 2));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  const std = Math.sqrt(variance);
  // Low std (all agree) → boost; high std (all over the place) → shrink.
  if (std < 0.25) return 1.06;
  if (std < 0.45) return 1.02;
  if (std > 0.9) return 0.9;
  if (std > 0.7) return 0.95;
  return 1;
}

// ───────────────────────── GG: Feature Importance Decay Tracking ─────────────
// Per-feature rolling IC (correlation between signal and realised).
type FeatStat = { recent: number[]; older: number[] };
const featStats: Record<string, FeatStat> = {};

export function recordFeatureOutcomeGG(
  features: Record<string, number>,
  realisedPct: number,
): void {
  for (const [k, v] of Object.entries(features)) {
    if (!Number.isFinite(v)) continue;
    const product = Math.tanh(v) * Math.tanh(realisedPct / 5);
    const f = featStats[k] ?? (featStats[k] = { recent: [], older: [] });
    f.recent.push(product);
    if (f.recent.length > 30) {
      f.older.push(...f.recent.splice(0, f.recent.length - 30));
      if (f.older.length > 90) f.older.splice(0, f.older.length - 90);
    }
  }
  const keys = Object.keys(featStats);
  if (keys.length > 150) {
    for (const k of keys.slice(0, keys.length - 150)) delete featStats[k];
  }
}

export function featureDecayMultiplierGG(
  features: Record<string, number>,
): number {
  if (Object.keys(featStats).length < 5) return 1;
  let alive = 0, dead = 0;
  for (const k of Object.keys(features)) {
    const f = featStats[k];
    if (!f || f.recent.length < 10 || f.older.length < 30) continue;
    const rMean = f.recent.reduce((a, b) => a + b, 0) / f.recent.length;
    const oMean = f.older.reduce((a, b) => a + b, 0) / f.older.length;
    if (Math.abs(oMean) < 0.05) continue;
    const decay = (Math.abs(rMean) - Math.abs(oMean)) / Math.abs(oMean);
    if (decay < -0.5) dead++; else alive++;
  }
  if (alive + dead < 3) return 1;
  const aliveRatio = alive / (alive + dead);
  if (aliveRatio < 0.3) return 0.9;   // most features have decayed
  if (aliveRatio > 0.7) return 1.04;
  return 1;
}

// ───────────────────────── HH: Counterfactual Replay ─────────────────────────
// Keep recent decision/realised pairs; expose "what if confidence were higher/lower?".
type Replay = { conf: number; realised: number };
const replayBuf: Replay[] = [];

export function recordReplayHH(predConfidence: number, realisedPct: number): void {
  replayBuf.push({ conf: predConfidence, realised: realisedPct });
  if (replayBuf.length > 500) replayBuf.splice(0, replayBuf.length - 300);
}

export function counterfactualMultiplierHH(currentConfidence: number): number {
  if (replayBuf.length < 40) return 1;
  // For samples near current confidence ±10, what's the avg outcome?
  const near = replayBuf.filter((r) => Math.abs(r.conf - currentConfidence) <= 10);
  if (near.length < 8) return 1;
  const avg = near.reduce((a, b) => a + b.realised, 0) / near.length;
  // Compare with global avg
  const global = replayBuf.reduce((a, b) => a + b.realised, 0) / replayBuf.length;
  const lift = avg - global;
  if (lift > 1.0) return 1.05;
  if (lift > 0.3) return 1.02;
  if (lift < -1.0) return 0.92;
  if (lift < -0.3) return 0.97;
  return 1;
}

// ───────────────────────── II: Multi-Timeframe Confluence ────────────────────
// Score agreement between short/medium/long signal buckets.
export function multiTimeframeConfluenceMultiplierII(
  signals: Array<{ name: string; value: number }>,
): number {
  if (signals.length < 3) return 1;
  const shortKeys = /rsi|stoch|macd|momentum|short/i;
  const longKeys = /ma200|sma|trend|long|hurst/i;
  let sShort = 0, nShort = 0, sLong = 0, nLong = 0;
  for (const s of signals) {
    if (shortKeys.test(s.name)) { sShort += s.value; nShort++; }
    else if (longKeys.test(s.name)) { sLong += s.value; nLong++; }
  }
  if (nShort < 1 || nLong < 1) return 1;
  const mShort = sShort / nShort, mLong = sLong / nLong;
  const sameDir = Math.sign(mShort) === Math.sign(mLong) && Math.sign(mShort) !== 0;
  if (sameDir && Math.abs(mShort) > 0.3 && Math.abs(mLong) > 0.3) return 1.06;
  if (sameDir) return 1.02;
  if (Math.sign(mShort) !== Math.sign(mLong) && Math.abs(mShort - mLong) > 0.8) return 0.9;
  return 1;
}

// ───────────────────────── JJ: Microstructure Proxy ──────────────────────────
// Without tick data: use ATR/price + volume divergence as liquidity-stress proxy.
export function microstructureMultiplierJJ(
  atr14: number, close: number, volume: number, avgVolume: number,
): number {
  if (!close || !atr14 || !avgVolume) return 1;
  const atrRatio = atr14 / close;          // higher = wider intraday range
  const volRatio = volume / avgVolume;     // >1 = active
  // Healthy: moderate ATR + above-avg volume → flow-supported move.
  if (atrRatio < 0.04 && volRatio > 1.3) return 1.05;
  if (atrRatio < 0.04 && volRatio > 1.0) return 1.02;
  // Stressed: huge ATR + thin volume → fragile.
  if (atrRatio > 0.08 && volRatio < 0.7) return 0.88;
  if (atrRatio > 0.06 && volRatio < 0.8) return 0.94;
  return 1;
}

// ───────────────────────── KK: Self-Diagnostic (heuristic) ───────────────────
// Periodic regime mistake-pattern detection from recent provenance.
type MistakeStat = { won: number; lost: number };
const regimeStats: Record<string, MistakeStat> = {};

export function recordRegimeOutcomeKK(regime: string, won: boolean): void {
  const s = regimeStats[regime] ?? (regimeStats[regime] = { won: 0, lost: 0 });
  if (won) s.won++; else s.lost++;
}

export function selfDiagnosticMultiplierKK(regime: string): number {
  const s = regimeStats[regime];
  if (!s || s.won + s.lost < 20) return 1;
  const winRate = s.won / (s.won + s.lost);
  // Distrust regimes where we lose often; trust where we win often.
  if (winRate < 0.35) return 0.88;
  if (winRate < 0.45) return 0.95;
  if (winRate > 0.65) return 1.06;
  if (winRate > 0.55) return 1.02;
  return 1;
}

// ───────────────────────── LL: Meta-Hyperparameter Search ────────────────────
// Simple grid over a global "trust" scaling — picks the value with best avg PnL.
const trustGrid: Array<{ scale: number; sumPnl: number; n: number }> = [
  { scale: 0.9, sumPnl: 0, n: 0 },
  { scale: 1.0, sumPnl: 0, n: 0 },
  { scale: 1.1, sumPnl: 0, n: 0 },
];
let trustIdx = 1;  // start neutral

export function recordHyperparamOutcomeLL(realisedPct: number): void {
  const cell = trustGrid[trustIdx];
  cell.sumPnl += realisedPct; cell.n += 1;
  // After every 10 samples, pick the best so far (epsilon-greedy 10%).
  const total = trustGrid.reduce((a, b) => a + b.n, 0);
  if (total % 10 === 0) {
    if (Math.random() < 0.1) {
      trustIdx = Math.floor(Math.random() * trustGrid.length);
    } else {
      let best = 0, bestAvg = -Infinity;
      for (let i = 0; i < trustGrid.length; i++) {
        const c = trustGrid[i];
        const avg = c.n >= 5 ? c.sumPnl / c.n : 0;
        if (avg > bestAvg) { bestAvg = avg; best = i; }
      }
      trustIdx = best;
    }
  }
}

export function hyperparamMultiplierLL(): number {
  const cell = trustGrid[trustIdx];
  if (cell.n < 5) return 1;
  return cell.scale;
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierEELMState(): unknown {
  return {
    errBuf: errBuf.slice(-200),
    phSum, phMin, phDriftFlag,
    featStats,
    replayBuf: replayBuf.slice(-300),
    regimeStats,
    trustGrid, trustIdx,
  };
}

export function restoreTierEELMState(s: unknown): void {
  try {
    const d = s as Partial<{
      errBuf: number[]; phSum: number; phMin: number; phDriftFlag: boolean;
      featStats: typeof featStats;
      replayBuf: typeof replayBuf;
      regimeStats: typeof regimeStats;
      trustGrid: typeof trustGrid; trustIdx: number;
    }>;
    if (Array.isArray(d.errBuf)) { errBuf.length = 0; errBuf.push(...d.errBuf); }
    if (typeof d.phSum === "number") phSum = d.phSum;
    if (typeof d.phMin === "number") phMin = d.phMin;
    if (typeof d.phDriftFlag === "boolean") phDriftFlag = d.phDriftFlag;
    if (d.featStats) Object.assign(featStats, d.featStats);
    if (Array.isArray(d.replayBuf)) { replayBuf.length = 0; replayBuf.push(...d.replayBuf); }
    if (d.regimeStats) Object.assign(regimeStats, d.regimeStats);
    if (Array.isArray(d.trustGrid) && d.trustGrid.length === trustGrid.length) {
      for (let i = 0; i < trustGrid.length; i++) Object.assign(trustGrid[i], d.trustGrid[i]);
    }
    if (typeof d.trustIdx === "number") trustIdx = d.trustIdx;
  } catch {}
}