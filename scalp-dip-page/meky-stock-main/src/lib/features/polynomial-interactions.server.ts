/**
 * Polynomial feature interactions: discover non-linear relationships.
 */

export function polynomialFeatures(
  features: Record<string, number>,
  degree: 2 | 3 = 2,
): Record<string, number> {
  const keys = Object.keys(features);
  const out: Record<string, number> = { ...features };

  // Squares
  for (const k of keys) out[`${k}_sq`] = features[k] * features[k];
  if (degree === 3) for (const k of keys) out[`${k}_cu`] = features[k] ** 3;

  // Pairwise interactions
  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      out[`${keys[i]}_x_${keys[j]}`] = features[keys[i]] * features[keys[j]];
    }
  }

  // Ratios (guarded)
  for (let i = 0; i < keys.length; i++) {
    for (let j = 0; j < keys.length; j++) {
      if (i === j) continue;
      const denom = features[keys[j]];
      if (Math.abs(denom) > 1e-6) out[`${keys[i]}_div_${keys[j]}`] = features[keys[i]] / denom;
    }
  }

  return out;
}

/** Compute mutual interaction strength: |corr(x*y, target)| - max(|corr(x, target)|, |corr(y, target)|). */
export function interactionStrength(
  x: number[],
  y: number[],
  target: number[],
): number {
  const corr = (a: number[], b: number[]) => {
    const ma = a.reduce((s, v) => s + v, 0) / a.length;
    const mb = b.reduce((s, v) => s + v, 0) / b.length;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < a.length; i++) {
      num += (a[i] - ma) * (b[i] - mb);
      dx += (a[i] - ma) ** 2;
      dy += (b[i] - mb) ** 2;
    }
    return dx * dy === 0 ? 0 : num / Math.sqrt(dx * dy);
  };
  const xy = x.map((v, i) => v * y[i]);
  return Math.abs(corr(xy, target)) - Math.max(Math.abs(corr(x, target)), Math.abs(corr(y, target)));
}