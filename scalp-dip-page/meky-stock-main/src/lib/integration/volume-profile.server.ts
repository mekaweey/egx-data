/**
 * Volume Profile + VWAP helpers.
 * --------------------------------------------------------------------------
 * Computes VWAP and the Point-of-Control (POC) — the price level with the
 * highest traded volume in the window. Returns a normalised signal:
 *  - price >> VWAP and far from POC → over-extended (negative tilt).
 *  - price near POC and above VWAP → healthy continuation (positive tilt).
 */
import type { Candle } from "@/lib/market-data/types";

export interface VolumeProfileSignal {
  vwap: number;
  poc: number;
  /** Signal in [-1, 1]: positive = bullish structure, negative = exhaustion. */
  value: number;
}

export function volumeProfile(candles: Candle[], bins = 24): VolumeProfileSignal | null {
  if (candles.length < 10) return null;
  let pv = 0, v = 0;
  let min = Infinity, max = -Infinity;
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    pv += typical * c.volume;
    v += c.volume;
    if (c.low < min) min = c.low;
    if (c.high > max) max = c.high;
  }
  if (v <= 0 || max <= min) return null;
  const vwap = pv / v;
  const step = (max - min) / bins;
  const buckets = new Array(bins).fill(0);
  for (const c of candles) {
    const typical = (c.high + c.low + c.close) / 3;
    const idx = Math.min(bins - 1, Math.max(0, Math.floor((typical - min) / step)));
    buckets[idx] += c.volume;
  }
  let bestIdx = 0, bestVol = -1;
  buckets.forEach((vv, i) => { if (vv > bestVol) { bestVol = vv; bestIdx = i; } });
  const poc = min + (bestIdx + 0.5) * step;
  const last = candles[candles.length - 1].close;
  const aboveVwap = (last - vwap) / vwap;
  const distPoc = Math.abs(last - poc) / poc;
  // bullish: above VWAP but still near POC; bearish: far above POC and stretched.
  const value = Math.max(-1, Math.min(1, aboveVwap * 8 - distPoc * 3));
  return { vwap, poc, value };
}