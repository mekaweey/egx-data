/**
 * Inter-Market Analysis.
 * --------------------------------------------------------------------------
 * Compares the symbol's recent return to its sector and to the index. If the
 * stock outperforms its sector and the index → positive tilt; underperforming
 * both → negative tilt. Pure: caller supplies the reference returns.
 */
import type { Candle } from "@/lib/market-data/types";

function periodReturn(candles: Candle[], lookback = 10): number {
  if (candles.length < lookback + 1) return 0;
  const a = candles[candles.length - 1 - lookback].close;
  const b = candles[candles.length - 1].close;
  return a > 0 ? (b - a) / a : 0;
}

export function interMarketTilt(opts: {
  symbolCandles: Candle[];
  sectorCandles?: Candle[] | null;
  indexCandles?: Candle[] | null;
}): { value: number; vsSector: number; vsIndex: number } {
  const sret = periodReturn(opts.symbolCandles);
  const secRet = opts.sectorCandles ? periodReturn(opts.sectorCandles) : 0;
  const idxRet = opts.indexCandles ? periodReturn(opts.indexCandles) : 0;
  const vsSector = sret - secRet;
  const vsIndex = sret - idxRet;
  // tanh-bounded so single big moves don't dominate.
  const value = Math.tanh(vsSector * 30) * 0.6 + Math.tanh(vsIndex * 25) * 0.4;
  return { value: Math.max(-1, Math.min(1, value)), vsSector, vsIndex };
}