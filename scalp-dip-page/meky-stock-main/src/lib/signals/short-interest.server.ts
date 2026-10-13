/**
 * Short Interest & Days-to-Cover analysis.
 */
export interface ShortInterestSnapshot {
  sharesShort: number;
  floatShares: number;
  avgDailyVolume: number;
}

export function shortInterestRatio(s: ShortInterestSnapshot): number {
  if (s.floatShares === 0) return 0;
  return s.sharesShort / s.floatShares;
}

export function daysToCover(s: ShortInterestSnapshot): number {
  if (s.avgDailyVolume === 0) return Infinity;
  return s.sharesShort / s.avgDailyVolume;
}

export function squeezePotential(s: ShortInterestSnapshot): "low" | "moderate" | "high" {
  const sir = shortInterestRatio(s);
  const dtc = daysToCover(s);
  if (sir > 0.2 && dtc > 5) return "high";
  if (sir > 0.1 || dtc > 3) return "moderate";
  return "low";
}