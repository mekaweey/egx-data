/**
 * Time-series augmentation: jitter, scale, magnitude warp, mixup.
 */
function randn(): number {
  const u = 1 - Math.random();
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function jitter(series: number[], sigma: number = 0.01): number[] {
  return series.map((v) => v + randn() * sigma * Math.abs(v));
}

export function scale(series: number[], sigmaScale: number = 0.05): number[] {
  const factor = 1 + randn() * sigmaScale;
  return series.map((v) => v * factor);
}

export function magnitudeWarp(series: number[], knots: number = 4, sigma: number = 0.1): number[] {
  const warpers: number[] = [];
  for (let i = 0; i < knots + 2; i++) warpers.push(1 + randn() * sigma);
  return series.map((v, i) => {
    const pos = (i / Math.max(1, series.length - 1)) * (knots + 1);
    const lo = Math.floor(pos);
    const hi = Math.min(warpers.length - 1, lo + 1);
    const frac = pos - lo;
    const w = warpers[lo] * (1 - frac) + warpers[hi] * frac;
    return v * w;
  });
}

export function mixup(a: number[], b: number[], alpha: number = 0.2): number[] {
  const lambda = Math.max(0, Math.min(1, alpha + Math.random() * (1 - alpha)));
  return a.map((v, i) => lambda * v + (1 - lambda) * (b[i] ?? v));
}