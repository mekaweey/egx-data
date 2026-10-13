/**
 * #6 Smart Money Flow Index (SMFI) - تقريب يومي.
 */
export interface SMFISignal { value: number; trend: "ACCUMULATION" | "DISTRIBUTION" | "NEUTRAL" }

export function calcSMFI(candles: { open: number; close: number; high: number; low: number; volume: number }[]): SMFISignal {
  if (candles.length < 5) return { value: 0, trend: "NEUTRAL" };
  const recent = candles.slice(-10);
  let smfi = 0;
  for (const c of recent) {
    const closeStrength = (c.close - c.low) / Math.max(c.high - c.low, 0.0001);
    smfi += (closeStrength - 0.5) * c.volume;
  }
  const normalized = smfi / Math.max(recent.reduce((s, c) => s + c.volume, 0), 1);
  const trend = normalized > 0.1 ? "ACCUMULATION" : normalized < -0.1 ? "DISTRIBUTION" : "NEUTRAL";
  return { value: normalized, trend };
}