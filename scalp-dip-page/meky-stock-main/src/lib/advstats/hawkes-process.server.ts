/**
 * Hawkes Process: self-exciting point process for volatility clustering.
 *   lambda(t) = mu + sum_{t_i < t} alpha * exp(-beta * (t - t_i))
 */

export interface HawkesParams {
  mu: number; // baseline intensity
  alpha: number; // jump size
  beta: number; // decay rate
}

export function intensity(t: number, eventTimes: number[], params: HawkesParams): number {
  let lambda = params.mu;
  for (const ti of eventTimes) {
    if (ti < t) lambda += params.alpha * Math.exp(-params.beta * (t - ti));
  }
  return lambda;
}

/** Fit via simple grid search maximizing log-likelihood. */
export function fitHawkes(eventTimes: number[], T: number): HawkesParams {
  let best: HawkesParams = { mu: 0.1, alpha: 0.5, beta: 1 };
  let bestLL = -Infinity;

  for (const mu of [0.01, 0.05, 0.1, 0.2]) {
    for (const alpha of [0.1, 0.3, 0.5, 0.8]) {
      for (const beta of [0.5, 1, 2, 5]) {
        if (alpha >= beta) continue; // stability
        let ll = 0;
        for (let i = 0; i < eventTimes.length; i++) {
          ll += Math.log(intensity(eventTimes[i], eventTimes.slice(0, i), { mu, alpha, beta }));
        }
        // integral term (approx)
        ll -= mu * T;
        for (const ti of eventTimes) ll -= (alpha / beta) * (1 - Math.exp(-beta * (T - ti)));
        if (ll > bestLL) {
          bestLL = ll;
          best = { mu, alpha, beta };
        }
      }
    }
  }
  return best;
}

/** Branching ratio: alpha/beta. If close to 1, system near criticality (high clustering). */
export function branchingRatio(params: HawkesParams): number {
  return params.alpha / params.beta;
}