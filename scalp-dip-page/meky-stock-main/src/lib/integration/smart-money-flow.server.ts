/**
 * Smart Money Flow Index (SMFI) — proxy.
 * --------------------------------------------------------------------------
 * Without intraday data, we approximate "smart money" by comparing close vs
 * open (institutional behaviour tends to dominate near close in mature
 * markets). Persistent positive (close > open) on rising volume = accumulation.
 */
import type { Candle } from "@/lib/market-data/types";

export function smartMoneyFlow(candles: Candle[], window = 20): { value: number; flow: number } {
  if (candles.length < window + 2) return { value: 0, flow: 0 };
  const recent = candles.slice(-window);
  let net = 0, volSum = 0;
  for (const c of recent) {
    const dir = c.close >= c.open ? 1 : -1;
    const body = Math.abs(c.close - c.open) / Math.max(1e-9, c.open);
    net += dir * body * c.volume;
    volSum += c.volume;
  }
  const flow = volSum > 0 ? net / volSum : 0;
  return { value: Math.max(-1, Math.min(1, Math.tanh(flow * 80))), flow };
}