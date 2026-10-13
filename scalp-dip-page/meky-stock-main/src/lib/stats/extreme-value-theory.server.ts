/**
 * Extreme Value Theory (EVT): model tail risk via Generalized Pareto Distribution.
 */

export interface GPDParams {
  shape: number; // xi
  scale: number; // sigma
  threshold: number;
}

/**
 * Fit GPD to exceedances over threshold using method of moments.
 */
export function fitGPD(returns: number[], thresholdQuantile: number = 0.95): GPDParams {
  const sorted = [...returns].sort((a, b) => Math.abs(b) - Math.abs(a));
  const thresholdIdx = Math.floor(sorted.length * (1 - thresholdQuantile));
  const threshold = Math.abs(sorted[thresholdIdx] ?? 0);
  const exceedances = returns.filter((r) => Math.abs(r) > threshold).map((r) => Math.abs(r) - threshold);

  if (exceedances.length < 5) return { shape: 0, scale: 0.01, threshold };

  const mean = exceedances.reduce((a, b) => a + b, 0) / exceedances.length;
  const variance = exceedances.reduce((s, x) => s + (x - mean) ** 2, 0) / exceedances.length;

  const shape = 0.5 * (1 - (mean * mean) / variance);
  const scale = 0.5 * mean * (1 + (mean * mean) / variance);

  return { shape, scale, threshold };
}

/**
 * Conditional Value-at-Risk (Expected Shortfall) at quantile p using GPD.
 */
export function evtCVaR(params: GPDParams, p: number, sampleSize: number, exceedanceCount: number): number {
  const ratio = exceedanceCount / sampleSize;
  const var_p = params.threshold + (params.scale / params.shape) * (Math.pow((sampleSize * (1 - p)) / exceedanceCount, -params.shape) - 1);
  const cvar = var_p / (1 - params.shape) + (params.scale - params.shape * params.threshold) / (1 - params.shape);
  return Math.max(var_p, cvar);
}

/**
 * Probability of return exceeding a given threshold.
 */
export function tailProbability(params: GPDParams, x: number): number {
  if (x <= params.threshold) return 1;
  const z = (x - params.threshold) / params.scale;
  if (params.shape === 0) return Math.exp(-z);
  const base = 1 + params.shape * z;
  if (base <= 0) return 0;
  return Math.pow(base, -1 / params.shape);
}