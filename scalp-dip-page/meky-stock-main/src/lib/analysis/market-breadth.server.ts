import type { Candle } from "@/lib/market-data/types";

/**
 * Market breadth — measures the health of the overall market by looking
 * at how many stocks are participating in the move (not just the index).
 *
 * Returns:
 *  - pctAboveSma50: % of stocks trading above their 50-day SMA
 *  - advanceDeclineRatio: # up today / # down today
 *  - newHighsMinusLows: 20-day new highs minus new lows
 *  - breadthScore: 0..100 composite (higher = healthier market)
 *  - confidenceDelta: ±6 to apply to bullish picks
 */
export type MarketBreadth = {
  pctAboveSma50: number;
  advanceDeclineRatio: number;
  newHighsMinusLows: number;
  breadthScore: number;
  confidenceDelta: number;
  label_ar: string;
};

function sma(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function computeMarketBreadth(
  histories: Map<string, Candle[]>,
): MarketBreadth {
  let aboveSma = 0;
  let total = 0;
  let advances = 0;
  let declines = 0;
  let newHighs = 0;
  let newLows = 0;

  for (const candles of histories.values()) {
    if (!candles || candles.length < 50) continue;
    total++;
    const last = candles[candles.length - 1];
    const prev = candles[candles.length - 2];
    const closes = candles.slice(-50).map((c) => c.close);
    const sma50 = sma(closes);
    if (last.close > sma50) aboveSma++;
    if (prev && last.close > prev.close) advances++;
    else if (prev && last.close < prev.close) declines++;

    const last20 = candles.slice(-20);
    const max20 = Math.max(...last20.map((c) => c.high));
    const min20 = Math.min(...last20.map((c) => c.low));
    if (last.high >= max20) newHighs++;
    if (last.low <= min20) newLows++;
  }

  const pctAboveSma50 = total > 0 ? +((aboveSma / total) * 100).toFixed(1) : 50;
  const advanceDeclineRatio = declines > 0 ? +(advances / declines).toFixed(2) : advances;
  const newHighsMinusLows = newHighs - newLows;

  let breadthScore = 50;
  if (pctAboveSma50 > 60) breadthScore += 15;
  else if (pctAboveSma50 < 35) breadthScore -= 20;
  if (advanceDeclineRatio > 1.5) breadthScore += 10;
  else if (advanceDeclineRatio < 0.7) breadthScore -= 15;
  if (newHighsMinusLows > 3) breadthScore += 10;
  else if (newHighsMinusLows < -3) breadthScore -= 15;
  breadthScore = Math.max(0, Math.min(100, breadthScore));

  let confidenceDelta = 0;
  let label_ar = "اتساع متوازن";
  if (breadthScore >= 70) { confidenceDelta = 6; label_ar = "اتساع قوي — معظم الأسهم صاعدة"; }
  else if (breadthScore >= 60) { confidenceDelta = 3; label_ar = "اتساع إيجابي"; }
  else if (breadthScore <= 30) { confidenceDelta = -6; label_ar = "اتساع ضعيف — السوق هش"; }
  else if (breadthScore <= 40) { confidenceDelta = -3; label_ar = "اتساع متراجع"; }

  return { pctAboveSma50, advanceDeclineRatio, newHighsMinusLows, breadthScore, confidenceDelta, label_ar };
}
