/**
 * Copula models: capture complex dependencies between assets beyond linear correlation.
 * Implements Gaussian and Clayton copulas.
 */

function rank(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length).fill(0);
  indexed.forEach((item, rank) => {
    ranks[item.i] = (rank + 1) / (values.length + 1);
  });
  return ranks;
}

/**
 * Empirical copula: transform marginals to uniform [0,1] via ranks.
 */
export function empiricalCopula(x: number[], y: number[]): { u: number[]; v: number[] } {
  return { u: rank(x), v: rank(y) };
}

/**
 * Kendall's tau (rank correlation, robust to outliers).
 */
export function kendallTau(x: number[], y: number[]): number {
  const n = x.length;
  let concordant = 0;
  let discordant = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const xd = x[i] - x[j];
      const yd = y[i] - y[j];
      if (xd * yd > 0) concordant++;
      else if (xd * yd < 0) discordant++;
    }
  }
  const total = (n * (n - 1)) / 2;
  return total === 0 ? 0 : (concordant - discordant) / total;
}

/**
 * Clayton copula parameter from Kendall's tau (captures lower-tail dependence).
 */
export function fitClaytonCopula(x: number[], y: number[]): { theta: number; tailDependence: number } {
  const tau = kendallTau(x, y);
  const theta = (2 * tau) / Math.max(1 - tau, 0.001);
  const tailDependence = theta > 0 ? Math.pow(2, -1 / theta) : 0;
  return { theta, tailDependence };
}

/**
 * Joint tail probability: P(X < q_x AND Y < q_y) using Clayton copula.
 */
export function jointTailProb(theta: number, u: number, v: number): number {
  if (theta <= 0) return u * v;
  return Math.pow(Math.pow(u, -theta) + Math.pow(v, -theta) - 1, -1 / theta);
}