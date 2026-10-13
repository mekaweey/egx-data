/**
 * Seasonality patterns (day-of-week and day-of-month).
 * --------------------------------------------------------------------------
 * Given historical candles, computes the average return for each weekday and
 * each "week-of-month" bucket, then estimates today's expected seasonal tilt.
 */
import type { Candle } from "@/lib/market-data/types";

function returns(candles: Candle[]): Array<{ d: Date; r: number }> {
  const out: Array<{ d: Date; r: number }> = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) out.push({ d: new Date(candles[i].date), r: (candles[i].close - prev) / prev });
  }
  return out;
}

export function seasonalTilt(candles: Candle[], today: Date = new Date()): { value: number; samples: number } {
  if (candles.length < 60) return { value: 0, samples: 0 };
  const rs = returns(candles);
  const dow = today.getDay();
  const wom = Math.floor((today.getDate() - 1) / 7); // 0..4
  let dowSum = 0, dowN = 0, womSum = 0, womN = 0;
  for (const { d, r } of rs) {
    if (d.getDay() === dow) { dowSum += r; dowN++; }
    if (Math.floor((d.getDate() - 1) / 7) === wom) { womSum += r; womN++; }
  }
  const dowMean = dowN > 0 ? dowSum / dowN : 0;
  const womMean = womN > 0 ? womSum / womN : 0;
  const blended = 0.6 * dowMean + 0.4 * womMean;
  return { value: Math.max(-1, Math.min(1, Math.tanh(blended * 80))), samples: Math.min(dowN, womN) };
}