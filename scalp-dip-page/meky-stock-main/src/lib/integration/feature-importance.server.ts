/**
 * Feature Importance Tracker (SHAP-like, lightweight).
 * --------------------------------------------------------------------------
 * For every module signal contributing to a decision, we later record the
 * realised outcome. We compute correlation(signal, outcome) per feature in an
 * EWMA fashion; features whose |corr| stays near 0 get demoted (weight
 * multiplier < 1), features with strong predictive power get boosted.
 */

export interface FeatureStat {
  n: number;
  sumX: number; sumY: number;
  sumXX: number; sumYY: number; sumXY: number;
  /** Pearson correlation, refreshed on each update. */
  corr: number;
}

const stats = new Map<string, FeatureStat>();
const HALF_LIFE = 80;
const ALPHA = 1 - Math.pow(0.5, 1 / HALF_LIFE);

export function recordFeatureOutcome(name: string, signal: number, realisedReturn: number) {
  const s = stats.get(name) ?? { n: 0, sumX: 0, sumY: 0, sumXX: 0, sumYY: 0, sumXY: 0, corr: 0 };
  const x = Math.max(-1, Math.min(1, signal));
  const y = Math.max(-1, Math.min(1, realisedReturn * 20));
  const a = ALPHA;
  s.sumX = s.sumX * (1 - a) + x * a;
  s.sumY = s.sumY * (1 - a) + y * a;
  s.sumXX = s.sumXX * (1 - a) + x * x * a;
  s.sumYY = s.sumYY * (1 - a) + y * y * a;
  s.sumXY = s.sumXY * (1 - a) + x * y * a;
  s.n = Math.min(s.n + 1, 100000);
  const varX = s.sumXX - s.sumX * s.sumX;
  const varY = s.sumYY - s.sumY * s.sumY;
  const cov = s.sumXY - s.sumX * s.sumY;
  s.corr = varX > 1e-9 && varY > 1e-9 ? cov / Math.sqrt(varX * varY) : 0;
  stats.set(name, s);
}

/** Multiplier in [0.3, 1.6] derived from |corr|. */
export function importanceMultiplier(name: string): number {
  const s = stats.get(name);
  if (!s || s.n < 10) return 1.0;
  const strength = Math.min(1, Math.abs(s.corr) * 2);
  return 0.3 + 1.3 * strength;
}

export function importanceTable() {
  return Array.from(stats.entries())
    .map(([name, s]) => ({ name, corr: s.corr, n: s.n, multiplier: importanceMultiplier(name) }))
    .sort((a, b) => Math.abs(b.corr) - Math.abs(a.corr));
}