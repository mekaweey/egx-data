/**
 * Wilson 95% confidence interval around a probability estimate.
 * Wider interval → less certainty → smaller position size.
 *
 * Returns lower/upper bounds in 0..100 and a `width` (uncertainty) in points.
 */

export type ConfidenceCI = {
  point: number;       // 0..100
  lower: number;       // 0..100
  upper: number;       // 0..100
  width: number;       // points (upper - lower)
  sizeMultiplier: number; // 0.5..1.0, used to scale position size
};

const Z = 1.96; // 95%

export function wilsonCI(probPct: number, sampleSize: number): ConfidenceCI {
  const n = Math.max(1, sampleSize);
  const p = Math.max(0, Math.min(1, probPct / 100));
  const denom = 1 + (Z * Z) / n;
  const center = (p + (Z * Z) / (2 * n)) / denom;
  const margin = (Z * Math.sqrt((p * (1 - p) + (Z * Z) / (4 * n)) / n)) / denom;
  const lower = Math.max(0, +(100 * (center - margin)).toFixed(1));
  const upper = Math.min(100, +(100 * (center + margin)).toFixed(1));
  const width = +(upper - lower).toFixed(1);
  // Scale position: width 0 → 1.0, width 60 → 0.5
  const sizeMultiplier = +Math.max(0.5, Math.min(1, 1 - width / 120)).toFixed(2);
  return { point: +probPct.toFixed(1), lower, upper, width, sizeMultiplier };
}