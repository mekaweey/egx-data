/**
 * Tier MM/OO/PP/QQ/RR/SS/TT — meta-diagnostic agent, regime-switching HMM-lite,
 * sentiment velocity, order-book replay proxy, anomaly auto-quarantine,
 * RL-over-weights, backtesting-in-production.
 * Pure in-memory + snapshot/restore. No IO.
 */

type Num = number;
const clamp = (x: Num, lo: Num, hi: Num) => Math.max(lo, Math.min(hi, x));

// ───────────────── MM: Self-Diagnostic Agent (heuristic mistake-pattern) ─────
type Decision = { regime: string; conf: number; won: boolean; realised: number };
const decisions: Decision[] = [];

export function recordDecisionMM(regime: string, conf: number, won: boolean, realised: number): void {
  decisions.push({ regime, conf, won, realised });
  if (decisions.length > 200) decisions.splice(0, decisions.length - 200);
}

export function selfDiagnosticAgentMultiplierMM(regime: string, conf: number): number {
  if (decisions.length < 30) return 1;
  // Inspect last 100 decisions for the same regime + similar confidence bucket.
  const bucket = decisions.filter(
    (d) => d.regime === regime && Math.abs(d.conf - conf) <= 12,
  );
  if (bucket.length < 8) return 1;
  const wr = bucket.filter((d) => d.won).length / bucket.length;
  const avgPnl = bucket.reduce((a, b) => a + b.realised, 0) / bucket.length;
  // High-conf + low-WR in this regime = repeated mistake pattern → shrink hard.
  if (conf > 65 && wr < 0.4) return 0.85;
  if (conf > 60 && wr < 0.45 && avgPnl < 0) return 0.92;
  if (wr > 0.65 && avgPnl > 0.5) return 1.05;
  return 1;
}

// ───────────────── OO: Regime Switching (HMM-lite transition matrix) ─────────
const regimeTrans: Record<string, Record<string, number>> = {};
let lastRegime: string | null = null;

export function recordRegimeTransitionOO(regime: string): void {
  if (lastRegime && lastRegime !== regime) {
    const row = regimeTrans[lastRegime] ?? (regimeTrans[lastRegime] = {});
    row[regime] = (row[regime] ?? 0) + 1;
  }
  lastRegime = regime;
}

export function regimeSwitchingMultiplierOO(regime: string): number {
  const row = regimeTrans[regime];
  if (!row) return 1;
  const total = Object.values(row).reduce((a, b) => a + b, 0);
  if (total < 10) return 1;
  // Stay-probability: how often this regime persists into itself.
  const stay = (row[regime] ?? 0) / total;
  // Unstable regimes (low stay-prob) → shrink confidence.
  if (stay < 0.3) return 0.9;
  if (stay < 0.5) return 0.96;
  if (stay > 0.8) return 1.04;
  return 1;
}

// ───────────────── PP: Sentiment Velocity (derivative of sentiment) ──────────
const sentSeries: Record<string, number[]> = {};

export function recordSentimentPP(symbol: string, sentiment: number): void {
  const s = sentSeries[symbol] ?? (sentSeries[symbol] = []);
  s.push(sentiment);
  if (s.length > 20) s.splice(0, s.length - 20);
  const keys = Object.keys(sentSeries);
  if (keys.length > 200) for (const k of keys.slice(0, keys.length - 200)) delete sentSeries[k];
}

export function sentimentVelocityMultiplierPP(symbol: string): number {
  const s = sentSeries[symbol];
  if (!s || s.length < 4) return 1;
  const recent = s.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const older = s.slice(-6, -3).reduce((a, b) => a + b, 0) / Math.max(1, s.slice(-6, -3).length);
  const velocity = recent - older;
  if (velocity > 0.3) return 1.06;
  if (velocity > 0.1) return 1.02;
  if (velocity < -0.3) return 0.9;
  if (velocity < -0.1) return 0.96;
  return 1;
}

// ───────────────── QQ: Order-Book Replay Proxy (sweep/spoof detection) ───────
export function orderBookReplayMultiplierQQ(
  close: number, atr14: number, volume: number, avgVolume: number,
): number {
  if (!close || !atr14 || !avgVolume) return 1;
  const atrRatio = atr14 / close;
  const volRatio = volume / avgVolume;
  // Sweep proxy: big move on big volume → confirmed flow.
  if (atrRatio > 0.05 && volRatio > 2) return 1.05;
  // Spoof proxy: big move on thin volume → fragile / likely reversion.
  if (atrRatio > 0.05 && volRatio < 0.6) return 0.86;
  if (atrRatio > 0.03 && volRatio < 0.7) return 0.94;
  return 1;
}

// ───────────────── RR: Anomaly Auto-Quarantine (Mahalanobis-lite) ────────────
const featStream: number[][] = [];

export function recordFeatureVectorRR(vec: number[]): void {
  if (!vec.length) return;
  featStream.push(vec.slice());
  if (featStream.length > 300) featStream.splice(0, featStream.length - 300);
}

export function anomalyAutoQuarantineMultiplierRR(vec: number[]): number {
  if (featStream.length < 50 || !vec.length) return 1;
  const dim = Math.min(vec.length, featStream[0].length);
  const means: number[] = new Array(dim).fill(0);
  const vars: number[] = new Array(dim).fill(0);
  for (const v of featStream) for (let i = 0; i < dim; i++) means[i] += v[i] ?? 0;
  for (let i = 0; i < dim; i++) means[i] /= featStream.length;
  for (const v of featStream) for (let i = 0; i < dim; i++) {
    const d = (v[i] ?? 0) - means[i];
    vars[i] += d * d;
  }
  for (let i = 0; i < dim; i++) vars[i] = Math.max(1e-6, vars[i] / featStream.length);
  let dist = 0;
  for (let i = 0; i < dim; i++) {
    const d = (vec[i] ?? 0) - means[i];
    dist += (d * d) / vars[i];
  }
  dist = Math.sqrt(dist / dim);
  // Out-of-distribution → quarantine (very low confidence).
  if (dist > 4) return 0.6;
  if (dist > 3) return 0.8;
  if (dist > 2.2) return 0.92;
  return 1;
}

// ───────────────── SS: RL-over-Weights (epsilon-greedy bandit) ───────────────
type Arm = { scale: number; sumPnl: number; n: number };
const weightArms: Arm[] = [
  { scale: 0.85, sumPnl: 0, n: 0 },
  { scale: 0.95, sumPnl: 0, n: 0 },
  { scale: 1.00, sumPnl: 0, n: 0 },
  { scale: 1.05, sumPnl: 0, n: 0 },
  { scale: 1.15, sumPnl: 0, n: 0 },
];
let armIdx = 2;

export function recordRLWeightsOutcomeSS(realisedPct: number): void {
  const a = weightArms[armIdx];
  a.sumPnl += realisedPct; a.n += 1;
  const total = weightArms.reduce((s, x) => s + x.n, 0);
  if (total % 8 === 0) {
    if (Math.random() < 0.12) {
      armIdx = Math.floor(Math.random() * weightArms.length);
    } else {
      let best = armIdx, bestAvg = -Infinity;
      for (let i = 0; i < weightArms.length; i++) {
        const c = weightArms[i];
        if (c.n < 4) continue;
        const avg = c.sumPnl / c.n;
        if (avg > bestAvg) { bestAvg = avg; best = i; }
      }
      armIdx = best;
    }
  }
}

export function rlOverWeightsMultiplierSS(): number {
  const a = weightArms[armIdx];
  if (a.n < 4) return 1;
  return a.scale;
}

// ───────────────── TT: Backtesting-in-Production (3 parallel strategies) ─────
type Strat = { name: string; bias: number; returns: number[] };
const strats: Strat[] = [
  { name: "conservative", bias: 0.85, returns: [] },
  { name: "balanced", bias: 1.0, returns: [] },
  { name: "aggressive", bias: 1.18, returns: [] },
];

function sortino(rs: number[]): number {
  if (rs.length < 5) return 0;
  const mean = rs.reduce((a, b) => a + b, 0) / rs.length;
  const downside = rs.filter((r) => r < 0);
  if (!downside.length) return mean * 10;
  const dd = Math.sqrt(downside.reduce((a, b) => a + b * b, 0) / downside.length);
  return dd > 1e-6 ? mean / dd : 0;
}

export function recordBacktestOutcomeTT(currentConf: number, realisedPct: number): void {
  // Each strat would have "taken" the trade scaled by its bias on the signal.
  for (const s of strats) {
    const taken = ((currentConf - 50) / 50) * s.bias;
    // expected return contribution: realised * directional alignment
    s.returns.push(realisedPct * Math.tanh(taken));
    if (s.returns.length > 60) s.returns.splice(0, s.returns.length - 60);
  }
}

export function backtestingInProductionMultiplierTT(): number {
  const scores = strats.map((s) => ({ s, score: sortino(s.returns) }));
  scores.sort((a, b) => b.score - a.score);
  const best = scores[0];
  if (!best || best.s.returns.length < 8) return 1;
  // Pull global trust toward the winning strategy's bias.
  const target = best.s.bias;
  return clamp(0.85 + (target - 0.85) * 0.6, 0.85, 1.15);
}

// ───────────────────────── Snapshot / Restore ────────────────────────────────
export function snapshotTierMMTTState(): unknown {
  return {
    decisions: decisions.slice(-200),
    regimeTrans, lastRegime,
    sentSeries,
    featStream: featStream.slice(-300),
    weightArms, armIdx,
    strats,
  };
}

export function restoreTierMMTTState(s: unknown): void {
  try {
    const d = s as Partial<{
      decisions: Decision[];
      regimeTrans: typeof regimeTrans; lastRegime: string | null;
      sentSeries: typeof sentSeries;
      featStream: number[][];
      weightArms: typeof weightArms; armIdx: number;
      strats: typeof strats;
    }>;
    if (Array.isArray(d.decisions)) { decisions.length = 0; decisions.push(...d.decisions); }
    if (d.regimeTrans) Object.assign(regimeTrans, d.regimeTrans);
    if (typeof d.lastRegime === "string" || d.lastRegime === null) lastRegime = d.lastRegime ?? null;
    if (d.sentSeries) Object.assign(sentSeries, d.sentSeries);
    if (Array.isArray(d.featStream)) { featStream.length = 0; featStream.push(...d.featStream); }
    if (Array.isArray(d.weightArms) && d.weightArms.length === weightArms.length) {
      for (let i = 0; i < weightArms.length; i++) Object.assign(weightArms[i], d.weightArms[i]);
    }
    if (typeof d.armIdx === "number") armIdx = d.armIdx;
    if (Array.isArray(d.strats) && d.strats.length === strats.length) {
      for (let i = 0; i < strats.length; i++) {
        strats[i].returns = (d.strats[i].returns ?? []).slice(-60);
      }
    }
  } catch {}
}