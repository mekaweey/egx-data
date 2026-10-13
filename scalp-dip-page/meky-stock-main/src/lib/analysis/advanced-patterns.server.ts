/**
 * Advanced technical analysis: VWAP, Volume Profile, and stronger
 * candlestick patterns. All pure functions over Candle[] series.
 */

import type { Candle } from "@/lib/market-data/types";

export type AdvancedTechnical = {
  vwap20: number | null;                 // 20-day rolling VWAP
  vwapDistPct: number | null;            // (close - vwap) / vwap * 100
  pocPrice: number | null;               // Point of Control (most-traded price bucket)
  valueAreaLow: number | null;           // 70% volume area
  valueAreaHigh: number | null;
  inValueArea: boolean;
  strongPatterns: string[];              // detected high-conviction patterns
  bullishScore: number;                  // 0..100 composite of advanced signals
};

function safe(n: number): number {
  return Number.isFinite(n) ? n : 0;
}

/** Rolling VWAP over the last `n` candles (typical price * volume). */
export function vwap(candles: Candle[], n = 20): number | null {
  const slice = candles.slice(-n);
  if (slice.length < 5) return null;
  let pv = 0, v = 0;
  for (const c of slice) {
    const tp = (c.high + c.low + c.close) / 3;
    pv += tp * c.volume;
    v += c.volume;
  }
  return v > 0 ? +(pv / v).toFixed(3) : null;
}

/**
 * Volume Profile (simplified). Buckets price range into 20 bins, sums
 * volume per bin, returns Point of Control (highest-volume bin) and
 * the 70% Value Area around it.
 */
export function volumeProfile(candles: Candle[], lookback = 30): {
  poc: number | null;
  vaLow: number | null;
  vaHigh: number | null;
} {
  const slice = candles.slice(-lookback);
  if (slice.length < 10) return { poc: null, vaLow: null, vaHigh: null };
  const hi = Math.max(...slice.map((c) => c.high));
  const lo = Math.min(...slice.map((c) => c.low));
  if (hi <= lo) return { poc: null, vaLow: null, vaHigh: null };
  const BINS = 20;
  const step = (hi - lo) / BINS;
  const bins = new Array<number>(BINS).fill(0);
  for (const c of slice) {
    // Distribute candle volume across its bins (proportional, simple).
    const cLo = Math.max(lo, c.low);
    const cHi = Math.min(hi, c.high);
    const startIdx = Math.min(BINS - 1, Math.floor((cLo - lo) / step));
    const endIdx = Math.min(BINS - 1, Math.floor((cHi - lo) / step));
    const span = Math.max(1, endIdx - startIdx + 1);
    const each = c.volume / span;
    for (let i = startIdx; i <= endIdx; i++) bins[i] += each;
  }
  // Point of Control
  let pocIdx = 0;
  for (let i = 1; i < BINS; i++) if (bins[i] > bins[pocIdx]) pocIdx = i;
  // Value area = bins around POC covering 70% of total volume
  const total = bins.reduce((s, b) => s + b, 0);
  const target = total * 0.7;
  let acc = bins[pocIdx];
  let lowIdx = pocIdx, highIdx = pocIdx;
  while (acc < target && (lowIdx > 0 || highIdx < BINS - 1)) {
    const next = highIdx < BINS - 1 ? bins[highIdx + 1] : -1;
    const prev = lowIdx > 0 ? bins[lowIdx - 1] : -1;
    if (next >= prev) { highIdx++; acc += next; }
    else { lowIdx--; acc += prev; }
  }
  return {
    poc: +(lo + (pocIdx + 0.5) * step).toFixed(3),
    vaLow: +(lo + lowIdx * step).toFixed(3),
    vaHigh: +(lo + (highIdx + 1) * step).toFixed(3),
  };
}

/** High-conviction single/multi-candle patterns beyond what indicators.ts catches. */
export function detectStrongPatterns(candles: Candle[]): string[] {
  if (candles.length < 5) return [];
  const hits: string[] = [];
  const last3 = candles.slice(-3);
  const [c1, c2, c3] = last3;

  // Bullish engulfing
  if (c2 && c3 && c2.close < c2.open && c3.close > c3.open &&
      c3.close > c2.open && c3.open < c2.close) {
    hits.push("bullish_engulfing");
  }
  // Hammer (lower wick ≥ 2× body, small upper wick, near recent low)
  if (c3) {
    const body = Math.abs(c3.close - c3.open);
    const lowerWick = Math.min(c3.open, c3.close) - c3.low;
    const upperWick = c3.high - Math.max(c3.open, c3.close);
    if (body > 0 && lowerWick >= 2 * body && upperWick <= body * 0.5) {
      hits.push("hammer");
    }
  }
  // Morning star (3-candle reversal)
  if (c1 && c2 && c3 &&
      c1.close < c1.open &&                        // red
      Math.abs(c2.close - c2.open) < (c1.open - c1.close) * 0.4 &&  // small body
      c3.close > c3.open &&                        // green
      c3.close > (c1.open + c1.close) / 2) {       // closes above midpoint of c1
    hits.push("morning_star");
  }
  // Volume breakout: today's volume > 2× 10-day avg AND closed in upper third
  const last11 = candles.slice(-11);
  if (last11.length === 11 && c3) {
    const avg10 = last11.slice(0, 10).reduce((s, c) => s + c.volume, 0) / 10;
    const range = c3.high - c3.low;
    const closeInTop = range > 0 && (c3.close - c3.low) / range >= 0.66;
    if (avg10 > 0 && c3.volume >= 2 * avg10 && closeInTop) {
      hits.push("volume_breakout");
    }
  }
  return hits;
}

/** Aggregate everything into one summary with a bullish score 0..100. */
export function computeAdvancedTechnical(candles: Candle[] | undefined, close: number): AdvancedTechnical {
  const empty: AdvancedTechnical = {
    vwap20: null, vwapDistPct: null,
    pocPrice: null, valueAreaLow: null, valueAreaHigh: null, inValueArea: false,
    strongPatterns: [], bullishScore: 50,
  };
  if (!candles || candles.length < 10) return empty;
  const v = vwap(candles, 20);
  const vp = volumeProfile(candles, 30);
  const patterns = detectStrongPatterns(candles);

  const vwapDist = v && v > 0 ? +(((close - v) / v) * 100).toFixed(2) : null;
  const inVA =
    vp.vaLow != null && vp.vaHigh != null && close >= vp.vaLow && close <= vp.vaHigh;

  // Score: start at 50, adjust
  let score = 50;
  // Trading above VWAP = bullish, but not too far (overextended = bad)
  if (vwapDist != null) {
    if (vwapDist > 0 && vwapDist < 4) score += 10;
    else if (vwapDist >= 4 && vwapDist < 8) score += 4;
    else if (vwapDist >= 8) score -= 5;        // overextended
    else if (vwapDist < -3) score -= 8;        // below VWAP
  }
  // Inside value area + above POC = healthy
  if (inVA && vp.poc != null && close >= vp.poc) score += 8;
  if (vp.poc != null && close < vp.poc * 0.97) score -= 5;
  // Each strong pattern adds points
  for (const p of patterns) {
    if (p === "volume_breakout") score += 12;
    else if (p === "bullish_engulfing") score += 8;
    else if (p === "morning_star") score += 10;
    else if (p === "hammer") score += 5;
  }
  score = Math.max(0, Math.min(100, score));

  return {
    vwap20: v,
    vwapDistPct: vwapDist,
    pocPrice: vp.poc,
    valueAreaLow: vp.vaLow,
    valueAreaHigh: vp.vaHigh,
    inValueArea: inVA,
    strongPatterns: patterns,
    bullishScore: safe(score),
  };
}