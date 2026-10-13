/**
 * ESG Score Momentum — track governance/sustainability score changes.
 */
export interface ESGSnapshot {
  date: string;
  environment: number; // 0..100
  social: number;
  governance: number;
}

export function compositeScore(s: ESGSnapshot): number {
  return s.environment * 0.3 + s.social * 0.3 + s.governance * 0.4;
}

export function esgMomentum(history: ESGSnapshot[]): { trend: number; latest: number; rateOfChange: number } {
  if (history.length < 2) return { trend: 0, latest: 0, rateOfChange: 0 };
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const scores = sorted.map(compositeScore);
  const n = scores.length;
  // Linear regression slope
  const xs = scores.map((_, i) => i);
  const mx = (n - 1) / 2;
  const my = scores.reduce((s, v) => s + v, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (scores[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  const trend = den === 0 ? 0 : num / den;
  return { trend, latest: scores[n - 1], rateOfChange: scores[n - 1] - scores[0] };
}