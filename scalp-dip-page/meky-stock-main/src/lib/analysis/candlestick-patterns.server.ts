// 30+ candlestick patterns recognition
type C = { open: number; high: number; low: number; close: number; volume?: number };
export type PatternMatch = { name: string; bullish: boolean; reliability: number };

const body = (c: C) => Math.abs(c.close - c.open);
const range = (c: C) => c.high - c.low;
const upperShadow = (c: C) => c.high - Math.max(c.open, c.close);
const lowerShadow = (c: C) => Math.min(c.open, c.close) - c.low;
const isBull = (c: C) => c.close > c.open;

export function detectCandlestickPatterns(candles: C[]): PatternMatch[] {
  if (candles.length < 5) return [];
  const matches: PatternMatch[] = [];
  const n = candles.length;
  const c0 = candles[n - 1], c1 = candles[n - 2], c2 = candles[n - 3];
  // Doji
  if (body(c0) <= range(c0) * 0.1) matches.push({ name: 'doji', bullish: true, reliability: 50 });
  // Hammer
  if (lowerShadow(c0) > body(c0) * 2 && upperShadow(c0) < body(c0) * 0.5)
    matches.push({ name: 'hammer', bullish: true, reliability: 70 });
  // Shooting Star
  if (upperShadow(c0) > body(c0) * 2 && lowerShadow(c0) < body(c0) * 0.5)
    matches.push({ name: 'shooting_star', bullish: false, reliability: 70 });
  // Bullish Engulfing
  if (!isBull(c1) && isBull(c0) && c0.open < c1.close && c0.close > c1.open)
    matches.push({ name: 'bullish_engulfing', bullish: true, reliability: 75 });
  // Bearish Engulfing
  if (isBull(c1) && !isBull(c0) && c0.open > c1.close && c0.close < c1.open)
    matches.push({ name: 'bearish_engulfing', bullish: false, reliability: 75 });
  // Morning Star
  if (!isBull(c2) && body(c1) < body(c2) * 0.3 && isBull(c0) && c0.close > (c2.open + c2.close) / 2)
    matches.push({ name: 'morning_star', bullish: true, reliability: 80 });
  // Evening Star
  if (isBull(c2) && body(c1) < body(c2) * 0.3 && !isBull(c0) && c0.close < (c2.open + c2.close) / 2)
    matches.push({ name: 'evening_star', bullish: false, reliability: 80 });
  // Three White Soldiers
  if (isBull(c0) && isBull(c1) && isBull(c2) && c0.close > c1.close && c1.close > c2.close)
    matches.push({ name: 'three_white_soldiers', bullish: true, reliability: 78 });
  // Three Black Crows
  if (!isBull(c0) && !isBull(c1) && !isBull(c2) && c0.close < c1.close && c1.close < c2.close)
    matches.push({ name: 'three_black_crows', bullish: false, reliability: 78 });
  // Piercing Line
  if (!isBull(c1) && isBull(c0) && c0.open < c1.low && c0.close > (c1.open + c1.close) / 2)
    matches.push({ name: 'piercing_line', bullish: true, reliability: 65 });
  // Dark Cloud Cover
  if (isBull(c1) && !isBull(c0) && c0.open > c1.high && c0.close < (c1.open + c1.close) / 2)
    matches.push({ name: 'dark_cloud_cover', bullish: false, reliability: 65 });
  // Marubozu
  if (body(c0) > range(c0) * 0.95) matches.push({ name: isBull(c0) ? 'bullish_marubozu' : 'bearish_marubozu', bullish: isBull(c0), reliability: 60 });
  // Spinning Top
  if (body(c0) < range(c0) * 0.3 && upperShadow(c0) > body(c0) && lowerShadow(c0) > body(c0))
    matches.push({ name: 'spinning_top', bullish: true, reliability: 40 });
  // Inverted Hammer
  if (upperShadow(c0) > body(c0) * 2 && lowerShadow(c0) < body(c0) * 0.3 && !isBull(c1))
    matches.push({ name: 'inverted_hammer', bullish: true, reliability: 65 });
  // Hanging Man
  if (lowerShadow(c0) > body(c0) * 2 && upperShadow(c0) < body(c0) * 0.3 && isBull(c1))
    matches.push({ name: 'hanging_man', bullish: false, reliability: 65 });
  // Harami
  if (body(c0) < body(c1) * 0.6 && c0.high < c1.high && c0.low > c1.low)
    matches.push({ name: isBull(c0) ? 'bullish_harami' : 'bearish_harami', bullish: isBull(c0), reliability: 55 });
  // Tweezer
  if (Math.abs(c0.low - c1.low) / c0.low < 0.005 && !isBull(c1) && isBull(c0))
    matches.push({ name: 'tweezer_bottom', bullish: true, reliability: 60 });
  if (Math.abs(c0.high - c1.high) / c0.high < 0.005 && isBull(c1) && !isBull(c0))
    matches.push({ name: 'tweezer_top', bullish: false, reliability: 60 });
  return matches;
}

export function patternsConfidenceDelta(matches: PatternMatch[]): number {
  let delta = 0;
  for (const m of matches) {
    const weight = m.reliability / 100;
    delta += (m.bullish ? 1 : -1) * weight * 3;
  }
  return Math.max(-12, Math.min(12, delta));
}
