/**
 * Out-of-Distribution Detection (Mahalanobis-style).
 */
export interface DistributionStats {
  means: number[];
  stds: number[];
}

export function fitDistribution(samples: number[][]): DistributionStats {
  const dim = samples[0]?.length ?? 0;
  const means = new Array(dim).fill(0);
  const stds = new Array(dim).fill(0);
  for (const s of samples) for (let i = 0; i < dim; i++) means[i] += s[i];
  for (let i = 0; i < dim; i++) means[i] /= Math.max(1, samples.length);
  for (const s of samples)
    for (let i = 0; i < dim; i++) stds[i] += (s[i] - means[i]) ** 2;
  for (let i = 0; i < dim; i++)
    stds[i] = Math.sqrt(stds[i] / Math.max(1, samples.length)) || 1;
  return { means, stds };
}

export function mahalanobisDistance(x: number[], stats: DistributionStats): number {
  let s = 0;
  for (let i = 0; i < x.length; i++) {
    const z = (x[i] - stats.means[i]) / stats.stds[i];
    s += z * z;
  }
  return Math.sqrt(s);
}

export function isOOD(x: number[], stats: DistributionStats, threshold: number = 3.5): boolean {
  const d = mahalanobisDistance(x, stats);
  return d / Math.sqrt(x.length) > threshold;
}