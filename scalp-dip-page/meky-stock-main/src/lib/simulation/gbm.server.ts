/**
 * Geometric Brownian Motion: simulate thousands of future price paths.
 *   dS = mu * S * dt + sigma * S * dW
 */

function gaussian(): number {
  // Box-Muller
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface GBMParams {
  mu: number;
  sigma: number;
  dt: number;
}

export function estimateGBMParams(prices: number[], dt: number = 1 / 252): GBMParams {
  const logRets: number[] = [];
  for (let i = 1; i < prices.length; i++) logRets.push(Math.log(prices[i] / prices[i - 1]));
  const mean = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const variance = logRets.reduce((s, r) => s + (r - mean) ** 2, 0) / logRets.length;
  const sigma = Math.sqrt(variance / dt);
  const mu = mean / dt + 0.5 * sigma * sigma;
  return { mu, sigma, dt };
}

export function simulateGBMPath(s0: number, params: GBMParams, steps: number): number[] {
  const path: number[] = [s0];
  let s = s0;
  for (let i = 0; i < steps; i++) {
    const drift = (params.mu - 0.5 * params.sigma * params.sigma) * params.dt;
    const shock = params.sigma * Math.sqrt(params.dt) * gaussian();
    s = s * Math.exp(drift + shock);
    path.push(s);
  }
  return path;
}

export interface SimulationResult {
  paths: number[][];
  meanFinal: number;
  percentiles: { p5: number; p25: number; p50: number; p75: number; p95: number };
  probUp: number;
  probDown: number;
}

export function monteCarloGBM(
  s0: number,
  params: GBMParams,
  steps: number,
  numPaths: number = 1000,
  keepPaths: boolean = false,
): SimulationResult {
  const finals: number[] = [];
  const paths: number[][] = [];
  for (let i = 0; i < numPaths; i++) {
    const p = simulateGBMPath(s0, params, steps);
    finals.push(p[p.length - 1]);
    if (keepPaths && i < 100) paths.push(p);
  }
  finals.sort((a, b) => a - b);
  const pctl = (p: number) => finals[Math.floor((p / 100) * finals.length)];
  return {
    paths,
    meanFinal: finals.reduce((a, b) => a + b, 0) / finals.length,
    percentiles: { p5: pctl(5), p25: pctl(25), p50: pctl(50), p75: pctl(75), p95: pctl(95) },
    probUp: finals.filter((f) => f > s0).length / finals.length,
    probDown: finals.filter((f) => f < s0).length / finals.length,
  };
}