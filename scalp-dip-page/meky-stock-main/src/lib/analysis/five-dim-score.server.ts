/**
 * 5-dimensional score breakdown for every stock.
 * Each dimension is 0-100; the overall recommendation requires
 * minimum thresholds across multiple dimensions.
 */
import type { Indicators } from "./indicators.server";
import type { MarketSnapshot } from "@/lib/market-data/market-index.server";
import type { SectorStats } from "./sector-momentum.server";
import type { StockNews } from "@/lib/market-data/news.server";
import type { Fundamentals } from "@/lib/market-data/fundamentals.server";
import type { MacroSnapshot } from "@/lib/market-data/macro.server";
import { scoreFundamentals } from "@/lib/market-data/fundamentals.server";
import { scoreMacro } from "@/lib/market-data/macro.server";

export type FiveDimScores = {
  technical: number;
  fundamental: number | null;
  sentiment: number;
  macro: number;
  sector: number;
  composite: number;
  dataCompleteness: number; // 0-100, how many dimensions had real data
  passes: boolean; // all critical dimensions > 55
  failures: string[];
};

export function computeFiveDimScores(args: {
  ind: Indicators;
  market: MarketSnapshot | null;
  sector: SectorStats | null;
  news: StockNews | null;
  fundamentals: Fundamentals | null;
  macro: MacroSnapshot | null;
}): FiveDimScores {
  const { ind, market, sector, news, fundamentals, macro } = args;

  // === Technical (always available) ===
  let technical = 50;
  if (ind.rsi14 != null) {
    if (ind.rsi14 > 50 && ind.rsi14 < 70) technical += 10;
    else if (ind.rsi14 >= 70) technical -= 5;
    else if (ind.rsi14 < 35) technical -= 10;
  }
  if (ind.macdHist != null && ind.macdHist > 0) technical += 10;
  if (ind.ema9 != null && ind.ema21 != null && ind.ema9 > ind.ema21) technical += 8;
  if (ind.ema21 != null && ind.sma50 != null && ind.ema21 > ind.sma50) technical += 5;
  if (ind.close > 0 && ind.ema21 != null && ind.close > ind.ema21) technical += 5;
  if (ind.volRatio > 1.2) technical += 7;
  else if (ind.volRatio < 0.7) technical -= 5;
  if (ind.patterns.some((p) => /bullish|breakout|hammer/i.test(p.name))) technical += 5;
  if (ind.patterns.some((p) => /bearish|breakdown|shooting/i.test(p.name))) technical -= 10;
  technical = Math.max(0, Math.min(100, technical));

  // === Fundamental (may be null) ===
  const fundamental = scoreFundamentals(fundamentals);

  // === Sentiment (default neutral if no news) ===
  let sentiment = 50;
  if (news?.found) {
    if (news.sentiment_hint === "positive") sentiment = 75;
    else if (news.sentiment_hint === "negative") sentiment = 20;
    else sentiment = 50;
  }

  // === Macro ===
  const macroScore = scoreMacro(macro);

  // === Sector ===
  let sectorScore = 50;
  if (sector) {
    if (sector.change_5d_pct > 3) sectorScore += 15;
    else if (sector.change_5d_pct > 0) sectorScore += 7;
    else if (sector.change_5d_pct < -3) sectorScore -= 15;
    else if (sector.change_5d_pct < 0) sectorScore -= 7;
    if (sector.trend === "up") sectorScore += 5;
    else if (sector.trend === "down") sectorScore -= 5;
  }
  sectorScore = Math.max(0, Math.min(100, sectorScore));

  // Also fold market trend INTO sector context since it's macro-correlated
  if (market?.trend === "down") sectorScore = Math.max(0, sectorScore - 10);
  else if (market?.trend === "up") sectorScore = Math.min(100, sectorScore + 5);

  // === Composite (weighted) ===
  const weights = {
    technical: 0.35,
    fundamental: 0.15,
    sentiment: 0.15,
    macro: 0.10,
    sector: 0.25,
  };
  let totalWeight = weights.technical + weights.sentiment + weights.macro + weights.sector;
  let weighted =
    technical * weights.technical +
    sentiment * weights.sentiment +
    macroScore * weights.macro +
    sectorScore * weights.sector;
  if (fundamental != null) {
    weighted += fundamental * weights.fundamental;
    totalWeight += weights.fundamental;
  }
  const composite = Math.round(weighted / totalWeight);

  // Data completeness
  const dims = [true, fundamental != null, news?.found ?? false, macro != null, sector != null];
  const dataCompleteness = Math.round((dims.filter(Boolean).length / dims.length) * 100);

  // Pass gate: technical AND sector must be > 55; no dimension < 30
  const failures: string[] = [];
  if (technical < 55) failures.push(`الفني ضعيف (${technical})`);
  if (sectorScore < 50) failures.push(`القطاع ضعيف (${sectorScore})`);
  if (sentiment < 35) failures.push(`المشاعر سلبية (${sentiment})`);
  if (fundamental != null && fundamental < 35) failures.push(`الأساسي ضعيف (${fundamental})`);
  const passes = failures.length === 0;

  return {
    technical,
    fundamental,
    sentiment,
    macro: macroScore,
    sector: sectorScore,
    composite,
    dataCompleteness,
    passes,
    failures,
  };
}