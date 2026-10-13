/**
 * Label smoothing, focal loss, class-balanced loss.
 */
export function labelSmooth(yOneHot: number[], epsilon: number = 0.1): number[] {
  const K = yOneHot.length;
  return yOneHot.map((y) => y * (1 - epsilon) + epsilon / K);
}

export function focalLossBinary(p: number, y: number, gamma: number = 2, alpha: number = 0.25): number {
  const eps = 1e-7;
  const pClipped = Math.max(eps, Math.min(1 - eps, p));
  if (y === 1) return -alpha * Math.pow(1 - pClipped, gamma) * Math.log(pClipped);
  return -(1 - alpha) * Math.pow(pClipped, gamma) * Math.log(1 - pClipped);
}

export function classBalancedWeight(classCounts: number[], beta: number = 0.999): number[] {
  return classCounts.map((n) => (1 - beta) / (1 - Math.pow(beta, n)));
}