/**
 * Tier-J Intelligence — final layer.
 * --------------------------------------------------------------------------
 * Self-contained, fail-open, in-memory state.
 *   J.1 Isotonic Regression calibration (non-parametric, better than Platt)
 *   J.2 Day-of-Week / Time-of-Day edge tracker
 *   J.3 Pairs Trading / Statistical Arbitrage detector
 *   J.4 Bayesian Hyperparameter Search (Tree-of-Parzen-Estimators lite)
 *   J.5 Stacking Meta-Learner enhancement (regime-conditional weights)
 */

/* ------------------------------------------------------------------ */
/* J.1 Isotonic Regression                                             */
/* ------------------------------------------------------------------ */
interface IsotonicPoint { x: number; y: number; w: number; }
const isoData: IsotonicPoint[] = [];
let isoFitted: { xs: number[]; ys: number[] } | null = null;

export function isotonicAdd(rawConfidence: number, won: boolean): void {
  if (!Number.isFinite(rawConfidence)) return;
  isoData.push({ x: rawConfidence, y: won ? 1 : 0, w: 1 });
  if (isoData.length > 2000) isoData.shift();
  if (isoData.length % 25 === 0) isotonicFit();
}

/** Pool Adjacent Violators Algorithm (PAVA). */
function isotonicFit(): void {
  if (isoData.length < 20) return;
  const sorted = [...isoData].sort((a, b) => a.x - b.x);
  const xs = sorted.map((p) => p.x);
  const ys = sorted.map((p) => p.y);
  const ws = sorted.map((p) => p.w);
  // PAVA
  const n = ys.length;
  const yhat = ys.slice();
  const what = ws.slice();
  let i = 0;
  while (i < n - 1) {
    if (yhat[i] > yhat[i + 1]) {
      const sw = what[i] + what[i + 1];
      const sy = (yhat[i] * what[i] + yhat[i + 1] * what[i + 1]) / sw;
      yhat[i] = sy; what[i] = sw;
      yhat.splice(i + 1, 1); what.splice(i + 1, 1); xs.splice(i + 1, 1);
      if (i > 0) i--;
    } else {
      i++;
    }
  }
  isoFitted = { xs, ys: yhat };
}

/** Returns calibrated probability in [0,1]. */
export function isotonicCalibrate(rawConfidence: number): number {
  if (!isoFitted || isoFitted.xs.length < 2) return rawConfidence / 100;
  const { xs, ys } = isoFitted;
  if (rawConfidence <= xs[0]) return ys[0];
  if (rawConfidence >= xs[xs.length - 1]) return ys[ys.length - 1];
  // Binary search + linear interpolate.
  let lo = 0, hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= rawConfidence) lo = mid; else hi = mid;
  }
  const t = (rawConfidence - xs[lo]) / (xs[hi] - xs[lo] || 1);
  return ys[lo] + t * (ys[hi] - ys[lo]);
}

/* ------------------------------------------------------------------ */
/* J.2 Day-of-Week edge                                                */
/* ------------------------------------------------------------------ */
const dowStats = new Map<number, { wins: number; total: number; pnlSum: number }>();

export function dowRecord(date: Date | string, won: boolean, pnlPct: number): void {
  const d = typeof date === "string" ? new Date(date) : date;
  const dow = d.getDay(); // 0=Sun
  const s = dowStats.get(dow) ?? { wins: 0, total: 0, pnlSum: 0 };
  s.total++;
  if (won) s.wins++;
  s.pnlSum += pnlPct;
  dowStats.set(dow, s);
}

/** Multiplier 0.9..1.1 based on historical win-rate edge for that day. */
export function dowMultiplier(date: Date | string): number {
  const d = typeof date === "string" ? new Date(date) : date;
  const dow = d.getDay();
  const s = dowStats.get(dow);
  if (!s || s.total < 10) return 1.0;
  const winRate = s.wins / s.total;
  const edge = winRate - 0.5; // vs random
  return Math.max(0.9, Math.min(1.1, 1 + edge * 0.4));
}

export function dowSnapshot(): Record<number, { winRate: number; avgPnl: number; n: number }> {
  const out: Record<number, { winRate: number; avgPnl: number; n: number }> = {};
  for (const [dow, s] of dowStats) {
    out[dow] = {
      winRate: s.total > 0 ? s.wins / s.total : 0,
      avgPnl: s.total > 0 ? s.pnlSum / s.total : 0,
      n: s.total,
    };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* J.3 Pairs Trading                                                   */
/* ------------------------------------------------------------------ */
export interface PairSpread {
  symbolA: string;
  symbolB: string;
  correlation: number;
  spreadZ: number;     // z-score of current spread vs historical
  signal: "long_A_short_B" | "long_B_short_A" | "none";
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const meanA = a.slice(0, n).reduce((x, y) => x + y, 0) / n;
  const meanB = b.slice(0, n).reduce((x, y) => x + y, 0) / n;
  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < n; i++) {
    const xa = a[i] - meanA, xb = b[i] - meanB;
    num += xa * xb; dA += xa * xa; dB += xb * xb;
  }
  const denom = Math.sqrt(dA * dB);
  return denom > 0 ? num / denom : 0;
}

/** Detect cointegrated pairs that have diverged → mean-reversion trade. */
export function detectPair(
  symbolA: string, returnsA: number[],
  symbolB: string, returnsB: number[],
  zThreshold = 2.0,
): PairSpread {
  const corr = pearson(returnsA, returnsB);
  if (Math.abs(corr) < 0.7) {
    return { symbolA, symbolB, correlation: corr, spreadZ: 0, signal: "none" };
  }
  const n = Math.min(returnsA.length, returnsB.length);
  const spreads: number[] = [];
  for (let i = 0; i < n; i++) spreads.push(returnsA[i] - returnsB[i]);
  const mean = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const variance = spreads.reduce((a, b) => a + (b - mean) ** 2, 0) / spreads.length;
  const std = Math.sqrt(variance);
  if (std === 0) return { symbolA, symbolB, correlation: corr, spreadZ: 0, signal: "none" };
  const currentSpread = spreads[spreads.length - 1];
  const z = (currentSpread - mean) / std;
  let signal: PairSpread["signal"] = "none";
  if (z > zThreshold) signal = "long_B_short_A";        // A overpriced
  else if (z < -zThreshold) signal = "long_A_short_B";  // B overpriced
  return { symbolA, symbolB, correlation: corr, spreadZ: z, signal };
}

/* ------------------------------------------------------------------ */
/* J.4 Bayesian Hyperparameter Search                                  */
/* ------------------------------------------------------------------ */
export interface HyperTrial { params: Record<string, number>; score: number; }
const trialHistory: HyperTrial[] = [];

export function recordTrial(trial: HyperTrial): void {
  trialHistory.push(trial);
  if (trialHistory.length > 200) trialHistory.shift();
}

/**
 * Suggest next params using a simple Gaussian-perturbation around top-K.
 * (TPE-lite: explore around best historical trials with Gaussian noise.)
 */
export function suggestParams(
  bounds: Record<string, [number, number]>,
  exploreProb = 0.2,
): Record<string, number> {
  const keys = Object.keys(bounds);
  // Cold start or random exploration → uniform sample.
  if (trialHistory.length < 5 || Math.random() < exploreProb) {
    const out: Record<string, number> = {};
    for (const k of keys) {
      const [lo, hi] = bounds[k];
      out[k] = lo + Math.random() * (hi - lo);
    }
    return out;
  }
  // Pick from top 25% trials, perturb with Gaussian.
  const sorted = [...trialHistory].sort((a, b) => b.score - a.score);
  const topK = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.25)));
  const seed = topK[Math.floor(Math.random() * topK.length)];
  const out: Record<string, number> = {};
  for (const k of keys) {
    const [lo, hi] = bounds[k];
    const range = hi - lo;
    const center = seed.params[k] ?? (lo + range / 2);
    // Gaussian noise with sigma = 10% of range.
    const u1 = Math.max(1e-9, Math.random());
    const u2 = Math.random();
    const noise = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2) * range * 0.1;
    out[k] = Math.max(lo, Math.min(hi, center + noise));
  }
  return out;
}

export function bestParams(): HyperTrial | null {
  if (trialHistory.length === 0) return null;
  return [...trialHistory].sort((a, b) => b.score - a.score)[0];
}

/* ------------------------------------------------------------------ */
/* J.5 Regime-conditional stacking weights                             */
/* ------------------------------------------------------------------ */
const regimeStack = new Map<string, Map<string, { sumW: number; sumWY: number }>>();

/** Update per-regime weight for a tier based on its outcome contribution. */
export function regimeStackUpdate(
  regime: string, tierName: string, tierScore: number, won: boolean,
): void {
  if (!regime || !tierName) return;
  const r = regimeStack.get(regime) ?? new Map();
  const s = r.get(tierName) ?? { sumW: 0, sumWY: 0 };
  // Score is treated as a soft prediction; gradient = (won - score) * score.
  s.sumW += Math.abs(tierScore);
  s.sumWY += (won ? 1 : 0) * Math.abs(tierScore);
  r.set(tierName, s);
  regimeStack.set(regime, r);
}

/** Weight multiplier for a tier in a given regime (0.7..1.3). */
export function regimeStackWeight(regime: string, tierName: string): number {
  const r = regimeStack.get(regime);
  if (!r) return 1.0;
  const s = r.get(tierName);
  if (!s || s.sumW < 3) return 1.0;
  const winRate = s.sumWY / s.sumW;
  // 0.5 = neutral → 1.0 multiplier; 0.7 → 1.2; 0.3 → 0.8
  return Math.max(0.7, Math.min(1.3, 1 + (winRate - 0.5) * 0.6));
}