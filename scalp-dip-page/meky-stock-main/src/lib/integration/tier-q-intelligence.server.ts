/**
 * Tier-Q intelligence layer.
 * --------------------------------------------------------------------------
 * Eight self-contained learners that compound on top of Tier-O/P:
 *   Q.1  Regime-Switching HMM (3-state: bull / bear / sideways)
 *   Q.2  Bayesian Beta-Binomial posterior per pattern (with uncertainty)
 *   Q.3  SHAP-like feature contribution tracker
 *   Q.4  Adversarial validation (train-vs-prod drift)
 *   Q.5  Time-decay weighted learning (exponential, half-life 60d)
 *   Q.6  Outlier-robust confidence (Winsorization at ±2.5σ)
 *   Q.7  Multi-horizon predictions (3/5/10/20 day)
 *   Q.8  KNN similarity recommender (top-5 historical analogs)
 *
 * All state is in-memory with bounded TTL/capacity; no external IO.
 */

// ───────────────────────── Q.1 HMM regime ──────────────────────────────
/** Lightweight 3-state HMM via Viterbi-like greedy on standardised returns. */
export function hmmRegimeQ(returns: number[]): "bull" | "bear" | "sideways" {
  if (!returns || returns.length < 10) return "sideways";
  const tail = returns.slice(-30);
  const mean = tail.reduce((a, b) => a + b, 0) / tail.length;
  const sd = Math.sqrt(
    tail.reduce((a, b) => a + (b - mean) ** 2, 0) / tail.length,
  ) || 1e-9;
  const z = mean / (sd / Math.sqrt(tail.length));
  if (z > 0.6) return "bull";
  if (z < -0.6) return "bear";
  return "sideways";
}

const hmmStats: Record<string, { wins: number; total: number }> = {
  bull: { wins: 0, total: 0 },
  bear: { wins: 0, total: 0 },
  sideways: { wins: 0, total: 0 },
};

export function recordHmmOutcomeQ(state: string, won: boolean): void {
  const s = hmmStats[state] ?? hmmStats.sideways;
  s.total++;
  if (won) s.wins++;
}

export function hmmMultiplierQ(state: string): number {
  const s = hmmStats[state];
  if (!s || s.total < 10) return 1.0;
  const wr = s.wins / s.total;
  // Map win-rate around 0.5 → multiplier in [0.85, 1.15].
  return Math.max(0.85, Math.min(1.15, 0.85 + (wr - 0.4) * 0.75));
}

// ───────────────────────── Q.2 Bayesian Beta ───────────────────────────
const betaState = new Map<string, { alpha: number; beta: number }>();

export function recordBayesOutcomeQ(pattern: string, won: boolean): void {
  const s = betaState.get(pattern) ?? { alpha: 1, beta: 1 };
  if (won) s.alpha++; else s.beta++;
  betaState.set(pattern, s);
}

export function bayesianWinrateQ(
  pattern: string,
): { mean: number; lower: number; upper: number; n: number } {
  const s = betaState.get(pattern) ?? { alpha: 1, beta: 1 };
  const n = s.alpha + s.beta - 2;
  const mean = s.alpha / (s.alpha + s.beta);
  // Approximate 95% credible interval (normal approx of Beta).
  const v = (s.alpha * s.beta) / (((s.alpha + s.beta) ** 2) * (s.alpha + s.beta + 1));
  const sd = Math.sqrt(v);
  return {
    mean,
    lower: Math.max(0, mean - 1.96 * sd),
    upper: Math.min(1, mean + 1.96 * sd),
    n,
  };
}

/** Shrink confidence toward 50 when patterns have wide credible intervals. */
export function bayesShrinkMultiplierQ(patterns: string[]): number {
  if (!patterns.length) return 1.0;
  let widthAvg = 0;
  for (const p of patterns) {
    const w = bayesianWinrateQ(p);
    widthAvg += w.upper - w.lower;
  }
  widthAvg /= patterns.length;
  // Wider interval → more shrinkage. width in [0,1] → multiplier in [0.85,1.0].
  return Math.max(0.85, 1 - widthAvg * 0.15);
}

// ─────────────────── Q.3 SHAP-like feature importance ──────────────────
const featureContrib = new Map<string, { sum: number; abs: number; n: number }>();

export function recordFeatureContributionQ(
  feature: string, value: number, realisedPct: number,
): void {
  const s = featureContrib.get(feature) ?? { sum: 0, abs: 0, n: 0 };
  const c = Math.tanh(value) * Math.sign(realisedPct);
  s.sum += c;
  s.abs += Math.abs(c);
  s.n++;
  featureContrib.set(feature, s);
}

export function featureImpactMultiplierQ(features: string[]): number {
  if (!features.length) return 1.0;
  let score = 0, n = 0;
  for (const f of features) {
    const s = featureContrib.get(f);
    if (!s || s.n < 5) continue;
    score += s.sum / s.n;
    n++;
  }
  if (n === 0) return 1.0;
  const avg = score / n; // in [-1, 1]
  return Math.max(0.85, Math.min(1.15, 1 + avg * 0.15));
}

export function topFeaturesQ(k = 10): Array<{ name: string; importance: number }> {
  return Array.from(featureContrib.entries())
    .filter(([, s]) => s.n >= 5)
    .map(([name, s]) => ({ name, importance: s.abs / s.n }))
    .sort((a, b) => b.importance - a.importance)
    .slice(0, k);
}

// ─────────────────── Q.4 Adversarial validation ────────────────────────
const trainDist: Record<string, number[]> = {};
const prodDist: Record<string, number[]> = {};
const CAP = 500;

function pushBounded(arr: number[], v: number) {
  arr.push(v);
  if (arr.length > CAP) arr.splice(0, arr.length - CAP);
}

export function recordTrainFeatureQ(name: string, value: number): void {
  (trainDist[name] ??= []).length;
  pushBounded(trainDist[name] ??= [], value);
}

export function recordProdFeatureQ(name: string, value: number): void {
  pushBounded(prodDist[name] ??= [], value);
}

/** Simple mean/std drift score → multiplier ≤1 when drift is high. */
export function driftAlarmMultiplierQ(): number {
  const names = Object.keys(trainDist).filter((n) => (prodDist[n]?.length ?? 0) >= 20);
  if (names.length === 0) return 1.0;
  let maxDrift = 0;
  for (const n of names) {
    const t = trainDist[n]!, p = prodDist[n]!;
    const mt = t.reduce((a, b) => a + b, 0) / t.length;
    const mp = p.reduce((a, b) => a + b, 0) / p.length;
    const sdT = Math.sqrt(t.reduce((a, b) => a + (b - mt) ** 2, 0) / t.length) || 1e-9;
    const d = Math.abs(mp - mt) / sdT;
    if (d > maxDrift) maxDrift = d;
  }
  if (maxDrift < 0.5) return 1.0;
  if (maxDrift < 1.0) return 0.95;
  if (maxDrift < 1.5) return 0.90;
  return 0.85;
}

// ─────────────────── Q.5 Time-decay weighting helper ───────────────────
const HALF_LIFE_DAYS = 60;
export function timeDecayWeightQ(ageMs: number): number {
  const days = Math.max(0, ageMs / 86_400_000);
  return Math.pow(0.5, days / HALF_LIFE_DAYS);
}

// ─────────────────── Q.6 Winsorisation ─────────────────────────────────
let confSamples: number[] = [];

export function recordConfidenceSampleQ(c: number): void {
  confSamples.push(c);
  if (confSamples.length > 1000) confSamples = confSamples.slice(-1000);
}

export function winsorizedConfidenceQ(c: number): number {
  if (confSamples.length < 50) return c;
  const mean = confSamples.reduce((a, b) => a + b, 0) / confSamples.length;
  const sd = Math.sqrt(
    confSamples.reduce((a, b) => a + (b - mean) ** 2, 0) / confSamples.length,
  ) || 1e-9;
  const lo = mean - 2.5 * sd;
  const hi = mean + 2.5 * sd;
  return Math.max(lo, Math.min(hi, c));
}

// ─────────────────── Q.7 Multi-horizon predictions ─────────────────────
export function multiHorizonForecastQ(
  returns: number[],
): { h3: number; h5: number; h10: number; h20: number } {
  if (!returns || returns.length < 5) {
    return { h3: 0, h5: 0, h10: 0, h20: 0 };
  }
  // EWMA mean per horizon (longer horizons get more weight on older data).
  const ewma = (alpha: number) => {
    let v = returns[0];
    for (let i = 1; i < returns.length; i++) v = alpha * returns[i] + (1 - alpha) * v;
    return v;
  };
  const h3 = ewma(0.6) * 3;
  const h5 = ewma(0.4) * 5;
  const h10 = ewma(0.2) * 10;
  const h20 = ewma(0.1) * 20;
  return { h3, h5, h10, h20 };
}

// ─────────────────── Q.8 KNN similarity recommender ────────────────────
type Case = { features: number[]; won: boolean; pct: number };
const caseBank: Case[] = [];
const CASE_CAP = 2000;

export function recordHistoricalCaseQ(
  features: number[], won: boolean, realisedPct: number,
): void {
  caseBank.push({ features: features.slice(0, 8), won, pct: realisedPct });
  if (caseBank.length > CASE_CAP) caseBank.splice(0, caseBank.length - CASE_CAP);
}

function dist(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let s = 0;
  for (let i = 0; i < n; i++) s += (a[i] - b[i]) ** 2;
  return Math.sqrt(s);
}

export function knnSimilarityMultiplierQ(
  features: number[], k = 5,
): { multiplier: number; analogs: number; winRate: number } {
  if (caseBank.length < 20) return { multiplier: 1.0, analogs: 0, winRate: 0.5 };
  const scored = caseBank
    .map((c) => ({ c, d: dist(c.features, features) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, k);
  const wins = scored.filter((s) => s.c.won).length;
  const wr = wins / scored.length;
  // Win-rate around 0.5 → no change; >0.6 boost; <0.4 dampen.
  const mult = Math.max(0.85, Math.min(1.15, 1 + (wr - 0.5) * 0.3));
  return { multiplier: mult, analogs: scored.length, winRate: wr };
}

// ─────────────────── State snapshot/restore for persistence ────────────
export function snapshotTierQState(): unknown {
  return {
    hmmStats,
    beta: Array.from(betaState.entries()),
    featureContrib: Array.from(featureContrib.entries()),
    confSamples: confSamples.slice(-500),
    caseBank: caseBank.slice(-500),
  };
}

export function restoreTierQState(s: unknown): void {
  const o = s as Partial<{
    hmmStats: typeof hmmStats;
    beta: Array<[string, { alpha: number; beta: number }]>;
    featureContrib: Array<[string, { sum: number; abs: number; n: number }]>;
    confSamples: number[];
    caseBank: Case[];
  }>;
  if (!o) return;
  if (o.hmmStats) Object.assign(hmmStats, o.hmmStats);
  if (o.beta) for (const [k, v] of o.beta) betaState.set(k, v);
  if (o.featureContrib) for (const [k, v] of o.featureContrib) featureContrib.set(k, v);
  if (o.confSamples) confSamples = o.confSamples.slice(-1000);
  if (o.caseBank) caseBank.push(...o.caseBank.slice(-CASE_CAP));
}