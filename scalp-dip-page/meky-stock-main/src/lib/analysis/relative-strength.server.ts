import type { Candle } from "@/lib/market-data/types";

/**
 * Relative Strength (RS) vs EGX30 — measures how the stock performed
 * relative to the market over the last N days. Strong RS = leader.
 */
export type RelativeStrength = {
  rs20: number;   // % outperformance over 20 days
  rs60: number;   // % outperformance over 60 days
  isLeader: boolean;
  isLaggard: boolean;
  label_ar: string;
  confidenceDelta: number;
};

function pctReturn(candles: Candle[] | undefined, days: number): number | null {
  if (!candles || candles.length < days + 1) return null;
  const recent = candles.slice(-days - 1);
  const start = recent[0].close;
  const end = recent[recent.length - 1].close;
  if (!start) return null;
  return ((end - start) / start) * 100;
}

export function computeRelativeStrength(
  stockCandles: Candle[] | undefined,
  marketCandles: Candle[] | undefined,
): RelativeStrength {
  const empty: RelativeStrength = {
    rs20: 0, rs60: 0, isLeader: false, isLaggard: false,
    label_ar: "", confidenceDelta: 0,
  };
  if (!stockCandles || !marketCandles) return empty;
  const s20 = pctReturn(stockCandles, 20);
  const m20 = pctReturn(marketCandles, 20);
  const s60 = pctReturn(stockCandles, 60);
  const m60 = pctReturn(marketCandles, 60);
  const rs20 = s20 != null && m20 != null ? +(s20 - m20).toFixed(2) : 0;
  const rs60 = s60 != null && m60 != null ? +(s60 - m60).toFixed(2) : 0;

  const combined = rs20 * 0.6 + rs60 * 0.4;
  const isLeader = combined > 5;
  const isLaggard = combined < -5;
  let confidenceDelta = 0;
  let label_ar = "";
  if (isLeader) {
    confidenceDelta = Math.min(8, Math.round(combined / 2));
    label_ar = `قوة نسبية قوية مقابل المؤشر (+${combined.toFixed(1)}%)`;
  } else if (isLaggard) {
    confidenceDelta = Math.max(-8, Math.round(combined / 2));
    label_ar = `ضعف نسبي مقابل المؤشر (${combined.toFixed(1)}%)`;
  }
  return { rs20, rs60, isLeader, isLaggard, label_ar, confidenceDelta };
}