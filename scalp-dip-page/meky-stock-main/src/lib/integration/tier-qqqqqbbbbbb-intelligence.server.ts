/**
 * Tier QQQQQ–BBBBBB — Information theory, behavioral finance, production hardening.
 * Pure in-memory, JS-native. Snapshot/restore included.
 *
 *   QQQQQ mutualInformationFeatureSelection
 *   RRRRR transferEntropyDirection
 *   SSSSS signalToNoiseDecomposition
 *   TTTTT kolmogorovComplexity
 *   UUUUU prospectTheoryAsymmetry
 *   VVVVV herdingBehaviorDetection
 *   WWWWW anchoringBias52w
 *   XXXXX dispositionEffectAnalysis
 *   YYYYY shadowModelComparison
 *   ZZZZZ signalLatencyDecay
 *   AAAAAA catastrophicLossCircuitBreaker
 *   BBBBBB confidenceCalibrationPlatt
 */

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const mean = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const variance = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return a.reduce((s, v) => s + (v - m) * (v - m), 0) / (a.length - 1);
};
const std = (a: number[]) => Math.sqrt(variance(a));

// ═════════════ QQQQQ: Mutual Information feature selection ═══════════════════
const miSamples: Record<string, { feat: number; out: number }[]> = {};

export function recordMISampleQQQQQ(feature: string, value: number, outcome: number): void {
  if (!Number.isFinite(value) || !Number.isFinite(outcome)) return;
  const a = miSamples[feature] ?? (miSamples[feature] = []);
  a.push({ feat: value, out: outcome });
  if (a.length > 500) a.shift();
}

function discretize(vals: number[], bins = 5): number[] {
  if (vals.length === 0) return [];
  const sorted = [...vals].sort((a, b) => a - b);
  const thresholds: number[] = [];
  for (let i = 1; i < bins; i++) thresholds.push(sorted[Math.floor((i / bins) * sorted.length)]);
  return vals.map((v) => thresholds.filter((t) => v > t).length);
}

export function mutualInfoQQQQQ(feature: string): number {
  const arr = miSamples[feature];
  if (!arr || arr.length < 30) return 0;
  const X = discretize(arr.map((s) => s.feat));
  const Y = discretize(arr.map((s) => s.out));
  const n = X.length;
  const px: Record<number, number> = {}, py: Record<number, number> = {}, pxy: Record<string, number> = {};
  for (let i = 0; i < n; i++) {
    px[X[i]] = (px[X[i]] ?? 0) + 1;
    py[Y[i]] = (py[Y[i]] ?? 0) + 1;
    pxy[`${X[i]},${Y[i]}`] = (pxy[`${X[i]},${Y[i]}`] ?? 0) + 1;
  }
  let mi = 0;
  for (const k of Object.keys(pxy)) {
    const [x, y] = k.split(",").map(Number);
    const pXY = pxy[k] / n, pX = px[x] / n, pY = py[y] / n;
    if (pXY > 0 && pX > 0 && pY > 0) mi += pXY * Math.log2(pXY / (pX * pY));
  }
  return mi;
}

export function miMultiplierQQQQQ(features: string[]): number {
  if (features.length === 0) return 1;
  const scores = features.map(mutualInfoQQQQQ).filter((s) => s > 0);
  if (scores.length < 3) return 1;
  const avg = mean(scores);
  if (avg > 0.3) return 1.04;
  if (avg < 0.05) return 0.95;
  return 1;
}

// ═════════════ RRRRR: Transfer entropy direction ═════════════════════════════
const teSeries: Record<string, number[]> = {};

export function recordTESeriesRRRRR(symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = teSeries[symbol] ?? (teSeries[symbol] = []);
  a.push(ret);
  if (a.length > 200) a.shift();
}

export function transferEntropyRRRRR(source: string, target: string): number {
  const X = teSeries[source], Y = teSeries[target];
  if (!X || !Y || X.length < 30 || Y.length < 30) return 0;
  const n = Math.min(X.length, Y.length) - 1;
  const Xs = discretize(X.slice(-n - 1, -1), 3);
  const Ys = discretize(Y.slice(-n - 1, -1), 3);
  const Yf = discretize(Y.slice(-n), 3);
  let te = 0;
  for (let i = 0; i < n; i++) {
    const denom = Ys.filter((_, j) => Ys[j] === Ys[i]).length;
    const num = Ys.filter((_, j) => Ys[j] === Ys[i] && Xs[j] === Xs[i] && Yf[j] === Yf[i]).length;
    if (denom > 0 && num > 0) te += Math.log2((num / denom) || 1) / n;
  }
  return Math.abs(te);
}

export function transferEntropyMultiplierRRRRR(leader: string, target: string, leaderDir: number, dir: number): number {
  const te = transferEntropyRRRRR(leader, target);
  if (te < 0.05) return 1;
  const aligned = Math.sign(leaderDir) === Math.sign(dir) && Math.sign(dir) !== 0;
  if (aligned && te > 0.15) return 1.05;
  if (!aligned && te > 0.2) return 0.93;
  return 1;
}

// ═════════════ SSSSS: Signal-to-noise decomposition ══════════════════════════
export function snrSSSSS(series: number[]): number {
  if (series.length < 10) return 1;
  // Smooth via 3-point MA = "signal", residual = "noise"
  const sig: number[] = [];
  for (let i = 1; i < series.length - 1; i++) sig.push((series[i - 1] + series[i] + series[i + 1]) / 3);
  const noise = sig.map((s, i) => series[i + 1] - s);
  const sigPow = variance(sig);
  const noisePow = variance(noise);
  if (noisePow === 0) return 10;
  return sigPow / noisePow;
}

export function snrMultiplierSSSSS(series: number[]): number {
  const snr = snrSSSSS(series);
  if (snr > 3) return 1.04;     // clean signal
  if (snr < 0.5) return 0.92;   // very noisy
  return 1;
}

// ═════════════ TTTTT: Kolmogorov complexity proxy ════════════════════════════
export function complexityTTTTT(series: number[]): number {
  if (series.length < 10) return 1;
  // Lempel-Ziv-style compression ratio on sign sequence
  const signs = series.slice(1).map((v, i) => v > series[i] ? "1" : "0").join("");
  const dict = new Set<string>();
  let i = 0, w = "";
  while (i < signs.length) {
    w += signs[i];
    if (!dict.has(w)) { dict.add(w); w = ""; }
    i++;
  }
  return dict.size / signs.length;
}

export function complexityMultiplierTTTTT(series: number[]): number {
  const c = complexityTTTTT(series);
  if (c < 0.3) return 1.05;  // simple repeatable pattern → predictable
  if (c > 0.7) return 0.93;  // near-random
  return 1;
}

// ═════════════ UUUUU: Prospect theory asymmetry ══════════════════════════════
const LOSS_AVERSION = 2.25;
export function prospectMultiplierUUUUU(recentReturns: number[], dir: number): number {
  if (recentReturns.length < 10) return 1;
  const last5 = recentReturns.slice(-5);
  const losses = last5.filter((r) => r < 0);
  const gains = last5.filter((r) => r > 0);
  // Heavy recent losses + bearish dir = overreaction, mean revert
  const lossWeight = losses.reduce((s, r) => s + Math.abs(r) * LOSS_AVERSION, 0);
  const gainWeight = gains.reduce((s, r) => s + r, 0);
  if (lossWeight > gainWeight * 3 && dir > 0) return 1.05; // contrarian buy after panic
  if (gainWeight > lossWeight * 2 && dir < 0) return 1.03; // contrarian sell after euphoria
  return 1;
}

// ═════════════ VVVVV: Herding (CSAD) ═════════════════════════════════════════
const herdingDaily: Record<string, { symbol: string; ret: number }[]> = {};

export function recordHerdingVVVVV(date: string, symbol: string, ret: number): void {
  if (!Number.isFinite(ret)) return;
  const a = herdingDaily[date] ?? (herdingDaily[date] = []);
  a.push({ symbol, ret });
  const keys = Object.keys(herdingDaily);
  if (keys.length > 40) delete herdingDaily[keys[0]];
}

export function herdingMultiplierVVVVV(): number {
  const dates = Object.keys(herdingDaily).sort().slice(-20);
  if (dates.length < 10) return 1;
  const csads = dates.map((d) => {
    const rs = herdingDaily[d].map((x) => x.ret);
    const m = mean(rs);
    return mean(rs.map((r) => Math.abs(r - m)));
  });
  const recent = mean(csads.slice(-3));
  const baseline = mean(csads.slice(0, -3));
  if (baseline === 0) return 1;
  // Low CSAD = strong herding (everyone moves together) → reversal risk
  if (recent < baseline * 0.6) return 0.93;
  if (recent > baseline * 1.5) return 1.02;
  return 1;
}

// ═════════════ WWWWW: Anchoring to 52-week high/low ══════════════════════════
export function anchoringMultiplierWWWWW(price: number, high52w: number, low52w: number, dir: number): number {
  if (!Number.isFinite(price) || high52w <= low52w) return 1;
  const range = high52w - low52w;
  const pctFromHigh = (high52w - price) / range;
  const pctFromLow = (price - low52w) / range;
  // Near 52w high acts as resistance; near 52w low as support
  if (pctFromHigh < 0.03 && dir > 0) return 0.92;
  if (pctFromLow < 0.03 && dir < 0) return 0.92;
  if (pctFromLow < 0.05 && dir > 0) return 1.04;
  if (pctFromHigh < 0.05 && dir < 0) return 1.04;
  return 1;
}

// ═════════════ XXXXX: Disposition effect ═════════════════════════════════════
const dispositionStats: Record<string, { winSells: number; lossSells: number; winHolds: number; lossHolds: number }> = {};

export function recordDispositionXXXXX(symbol: string, won: boolean, sold: boolean): void {
  const s = dispositionStats[symbol] ?? (dispositionStats[symbol] = { winSells: 0, lossSells: 0, winHolds: 0, lossHolds: 0 });
  if (won && sold) s.winSells++;
  else if (won && !sold) s.winHolds++;
  else if (!won && sold) s.lossSells++;
  else s.lossHolds++;
}

export function dispositionMultiplierXXXXX(symbol: string, dir: number): number {
  const s = dispositionStats[symbol];
  if (!s) return 1;
  const total = s.winSells + s.lossSells + s.winHolds + s.lossHolds;
  if (total < 10) return 1;
  // PGR = % gains realized, PLR = % losses realized
  const pgr = s.winSells / Math.max(1, s.winSells + s.winHolds);
  const plr = s.lossSells / Math.max(1, s.lossSells + s.lossHolds);
  // Strong disposition (pgr >> plr) → predictable selling pressure on winners
  if (pgr - plr > 0.3 && dir > 0) return 0.95;
  if (pgr - plr > 0.3 && dir < 0) return 1.03;
  return 1;
}

// ═════════════ YYYYY: Shadow model comparison ════════════════════════════════
const shadowResults: { primary: number; shadow: number; outcome: number }[] = [];

export function recordShadowYYYYY(primaryPred: number, shadowPred: number, realised: number): void {
  if (![primaryPred, shadowPred, realised].every(Number.isFinite)) return;
  shadowResults.push({ primary: primaryPred, shadow: shadowPred, outcome: realised });
  if (shadowResults.length > 300) shadowResults.shift();
}

export function shadowMultiplierYYYYY(): number {
  if (shadowResults.length < 30) return 1;
  const recent = shadowResults.slice(-50);
  const primaryErr = mean(recent.map((r) => (r.primary - r.outcome) ** 2));
  const shadowErr = mean(recent.map((r) => (r.shadow - r.outcome) ** 2));
  if (primaryErr === 0) return 1;
  // Shadow significantly better → primary is degraded → de-risk
  if (shadowErr < primaryErr * 0.7) return 0.88;
  if (shadowErr < primaryErr * 0.85) return 0.95;
  return 1;
}

// ═════════════ ZZZZZ: Signal latency decay ═══════════════════════════════════
export function latencyMultiplierZZZZZ(dataTimestamp: number, nowMs: number = Date.now()): number {
  const ageMin = (nowMs - dataTimestamp) / 60000;
  if (!Number.isFinite(ageMin) || ageMin < 0) return 1;
  if (ageMin < 5) return 1;
  if (ageMin < 15) return 0.98;
  if (ageMin < 60) return 0.93;
  if (ageMin < 240) return 0.85;
  return 0.75;
}

// ═════════════ AAAAAA: Catastrophic loss circuit breaker ═════════════════════
const dailyPnl: { day: string; pnl: number }[] = [];
let circuitOpen = false;
let circuitOpenedAt = 0;

export function recordDailyPnlAAAAAA(day: string, pnl: number): void {
  if (!Number.isFinite(pnl)) return;
  const existing = dailyPnl.find((d) => d.day === day);
  if (existing) existing.pnl = pnl;
  else dailyPnl.push({ day, pnl });
  if (dailyPnl.length > 30) dailyPnl.shift();
}

export function checkCircuitBreakerAAAAAA(): boolean {
  if (circuitOpen) {
    // Auto-reset after 24h
    if (Date.now() - circuitOpenedAt > 86400000) circuitOpen = false;
  }
  if (dailyPnl.length === 0) return circuitOpen;
  const today = dailyPnl[dailyPnl.length - 1];
  const last7 = dailyPnl.slice(-7).reduce((s, d) => s + d.pnl, 0);
  if (today.pnl < -5 || last7 < -12) {
    if (!circuitOpen) { circuitOpen = true; circuitOpenedAt = Date.now(); }
  }
  return circuitOpen;
}

export function circuitBreakerMultiplierAAAAAA(): number {
  return checkCircuitBreakerAAAAAA() ? 0.6 : 1;
}

export function isCircuitOpenAAAAAA(): boolean { return circuitOpen; }

// ═════════════ BBBBBB: Platt scaling confidence calibration ══════════════════
const plattData: { score: number; won: boolean }[] = [];
let plattA = -1, plattB = 0;

export function recordPlattBBBBBB(score: number, won: boolean): void {
  if (!Number.isFinite(score)) return;
  plattData.push({ score, won });
  if (plattData.length > 1000) plattData.shift();
  if (plattData.length % 50 === 0) fitPlattBBBBBB();
}

function fitPlattBBBBBB(): void {
  if (plattData.length < 50) return;
  // Simple gradient descent on logistic NLL
  let a = plattA, b = plattB;
  const lr = 0.001;
  for (let iter = 0; iter < 100; iter++) {
    let gA = 0, gB = 0;
    for (const d of plattData) {
      const p = 1 / (1 + Math.exp(a * d.score + b));
      const y = d.won ? 1 : 0;
      const err = p - y;
      gA += err * d.score;
      gB += err;
    }
    a -= lr * gA / plattData.length;
    b -= lr * gB / plattData.length;
  }
  plattA = a; plattB = b;
}

export function calibrateConfidenceBBBBBB(rawScore: number): number {
  if (plattData.length < 50) return rawScore;
  const z = plattA * rawScore + plattB;
  const p = 1 / (1 + Math.exp(z));
  return clamp(p * 100, 0, 100);
}

export function plattMultiplierBBBBBB(rawScore: number): number {
  if (plattData.length < 50) return 1;
  const calibrated = calibrateConfidenceBBBBBB(rawScore);
  const ratio = calibrated / Math.max(1, rawScore);
  // If calibration says model is overconfident, shrink
  if (ratio < 0.85) return 0.94;
  if (ratio > 1.15) return 1.03;
  return 1;
}

// ═════════════ Snapshot / Restore ════════════════════════════════════════════
export function snapshotTierQQQQQBBBBBBState(): unknown {
  return {
    miSamples, teSeries, herdingDaily, dispositionStats,
    shadowResults: shadowResults.slice(-300),
    dailyPnl: dailyPnl.slice(-30),
    circuitOpen, circuitOpenedAt,
    plattData: plattData.slice(-1000),
    plattA, plattB,
  };
}

export function restoreTierQQQQQBBBBBBState(s: unknown): void {
  try {
    const d = s as Partial<{
      miSamples: typeof miSamples;
      teSeries: typeof teSeries;
      herdingDaily: typeof herdingDaily;
      dispositionStats: typeof dispositionStats;
      shadowResults: typeof shadowResults;
      dailyPnl: typeof dailyPnl;
      circuitOpen: boolean; circuitOpenedAt: number;
      plattData: typeof plattData;
      plattA: number; plattB: number;
    }>;
    if (d.miSamples) Object.assign(miSamples, d.miSamples);
    if (d.teSeries) Object.assign(teSeries, d.teSeries);
    if (d.herdingDaily) Object.assign(herdingDaily, d.herdingDaily);
    if (d.dispositionStats) Object.assign(dispositionStats, d.dispositionStats);
    if (Array.isArray(d.shadowResults)) { shadowResults.length = 0; shadowResults.push(...d.shadowResults); }
    if (Array.isArray(d.dailyPnl)) { dailyPnl.length = 0; dailyPnl.push(...d.dailyPnl); }
    if (typeof d.circuitOpen === "boolean") circuitOpen = d.circuitOpen;
    if (typeof d.circuitOpenedAt === "number") circuitOpenedAt = d.circuitOpenedAt;
    if (Array.isArray(d.plattData)) { plattData.length = 0; plattData.push(...d.plattData); }
    if (typeof d.plattA === "number") plattA = d.plattA;
    if (typeof d.plattB === "number") plattB = d.plattB;
  } catch { /* noop */ }
  void std;
}