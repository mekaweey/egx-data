/**
 * Volatility Term Structure — IV across maturities.
 */
export interface TermPoint {
  daysToExpiry: number;
  iv: number;
}

export function classify(points: TermPoint[]): "contango" | "flat" | "backwardation" {
  if (points.length < 2) return "flat";
  const sorted = [...points].sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  const diff = sorted[sorted.length - 1].iv - sorted[0].iv;
  if (diff > 0.01) return "contango";
  if (diff < -0.01) return "backwardation";
  return "flat";
}

export function slope(points: TermPoint[]): number {
  if (points.length < 2) return 0;
  const sorted = [...points].sort((a, b) => a.daysToExpiry - b.daysToExpiry);
  const n = sorted.length;
  const xs = sorted.map((p) => p.daysToExpiry);
  const ys = sorted.map((p) => p.iv);
  const mx = xs.reduce((s, v) => s + v, 0) / n;
  const my = ys.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  return den === 0 ? 0 : num / den;
}