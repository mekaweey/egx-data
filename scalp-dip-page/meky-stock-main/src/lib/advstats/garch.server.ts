/**
 * GARCH(1,1) volatility forecasting:
 *   sigma^2_t = omega + alpha * eps^2_{t-1} + beta * sigma^2_{t-1}
 */

export interface GARCHParams {
  omega: number;
  alpha: number;
  beta: number;
}

/** Simple MLE-ish fit via grid search around method-of-moments. */
export function fitGARCH(returns: number[]): GARCHParams {
  const variance = returns.reduce((s, r) => s + r * r, 0) / returns.length;
  let best: GARCHParams = { omega: variance * 0.05, alpha: 0.1, beta: 0.85 };
  let bestLL = -Infinity;

  for (const a of [0.05, 0.1, 0.15, 0.2]) {
    for (const b of [0.7, 0.8, 0.85, 0.9]) {
      if (a + b >= 1) continue;
      const omega = variance * (1 - a - b);
      let sigma2 = variance;
      let ll = 0;
      for (const r of returns) {
        sigma2 = omega + a * r * r + b * sigma2;
        ll += -0.5 * (Math.log(sigma2) + (r * r) / sigma2);
      }
      if (ll > bestLL) {
        bestLL = ll;
        best = { omega, alpha: a, beta: b };
      }
    }
  }
  return best;
}

export function forecastVolatility(params: GARCHParams, returns: number[], horizon: number = 5): number[] {
  let sigma2 = returns.reduce((s, r) => s + r * r, 0) / returns.length;
  for (const r of returns) sigma2 = params.omega + params.alpha * r * r + params.beta * sigma2;

  const forecasts: number[] = [];
  const lastR2 = returns[returns.length - 1] ** 2;
  let curr = params.omega + params.alpha * lastR2 + params.beta * sigma2;
  forecasts.push(Math.sqrt(curr));
  for (let h = 1; h < horizon; h++) {
    curr = params.omega + (params.alpha + params.beta) * curr;
    forecasts.push(Math.sqrt(curr));
  }
  return forecasts;
}