/**
 * #19 Optimal Execution: TWAP / VWAP.
 */
export function twapSchedule(totalShares: number, intervals: number): number[] {
  const per = totalShares / intervals;
  return Array(intervals).fill(per);
}

export function vwapSchedule(totalShares: number, volumeProfile: number[]): number[] {
  const totalVol = volumeProfile.reduce((a, b) => a + b, 0);
  return volumeProfile.map((v) => (v / totalVol) * totalShares);
}