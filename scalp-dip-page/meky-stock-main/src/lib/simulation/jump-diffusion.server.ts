/**
 * Merton Jump Diffusion: GBM + Poisson jumps (earnings, news shocks).
 *   dS = (mu - lambda*k) S dt + sigma S dW + (J - 1) S dN
 */

function gaussian(): number {
  const u1 = Math.max(Math.random(), 1e-12);
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export interface JumpDiffusionParams {
  mu: number;
  sigma: number;
  lambda: number; // jumps per unit time
  jumpMean: number; // mean of log-jump size
  jumpStd: number; // std of log-jump size
  dt: number;
}

export function estimateJumpParams(prices: number[], threshold: number = 3): JumpDiffusionParams {
  const logRets: number[] = [];
  for (let i = 1; i < prices.length; i++) logRets.push(Math.log(prices[i] / prices[i - 1]));
  const m = logRets.reduce((a, b) => a + b, 0) / logRets.length;
  const s = Math.sqrt(logRets.reduce((sum, r) => sum + (r - m) ** 2, 0) / logRets.length);

  const jumps = logRets.filter((r) => Math.abs(r - m) > threshold * s);
  const normal = logRets.filter((r) => Math.abs(r - m) <= threshold * s);

  const dt = 1 / 252;
  const normalMean = normal.reduce((a, b) => a + b, 0) / Math.max(normal.length, 1);
  const normalStd = Math.sqrt(normal.reduce((s2, r) => s2 + (r - normalMean) ** 2, 0) / Math.max(normal.length, 1));

  return {
    mu: normalMean / dt + 0.5 * (normalStd / Math.sqrt(dt)) ** 2,
    sigma: normalStd / Math.sqrt(dt),
    lambda: jumps.length / (logRets.length * dt),
    jumpMean: jumps.length > 0 ? jumps.reduce((a, b) => a + b, 0) / jumps.length : 0,
    jumpStd: jumps.length > 1 ? Math.sqrt(jumps.reduce((s2, j) => s2 + (j - normalMean) ** 2, 0) / jumps.length) : 0.05,
    dt,
  };
}

export function simulateJumpPath(s0: number, params: JumpDiffusionParams, steps: number): number[] {
  const path: number[] = [s0];
  let s = s0;
  const kappa = Math.exp(params.jumpMean + 0.5 * params.jumpStd ** 2) - 1;
  for (let i = 0; i < steps; i++) {
    const drift = (params.mu - params.lambda * kappa - 0.5 * params.sigma ** 2) * params.dt;
    const diffusion = params.sigma * Math.sqrt(params.dt) * gaussian();
    let jump = 0;
    if (Math.random() < params.lambda * params.dt) {
      jump = params.jumpMean + params.jumpStd * gaussian();
    }
    s = s * Math.exp(drift + diffusion + jump);
    path.push(s);
  }
  return path;
}