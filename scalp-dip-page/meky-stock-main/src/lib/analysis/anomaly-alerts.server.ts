import type { Indicators } from "@/lib/analysis/indicators.server";
import type { Candle } from "@/lib/market-data/types";
import type { StockNews } from "@/lib/market-data/news.server";

/**
 * Anomaly alert: today's move > 3σ AND no relevant news found.
 * Possible manipulation or insider activity — flag and reduce confidence.
 */

export type AnomalyAlert = {
  flagged: boolean;
  zScore: number;
  hasNews: boolean;
  label_ar: string;
  confidenceDelta: number;
};

export function detectAnomalyAlert(
  ind: Indicators,
  candles: Candle[] | undefined,
  news: StockNews | undefined,
): AnomalyAlert {
  if (!candles || candles.length < 30 || ind.changePct == null) {
    return { flagged: false, zScore: 0, hasNews: !!news?.found, label_ar: "", confidenceDelta: 0 };
  }
  const rets: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / Math.max(0.001, candles[i - 1].close);
    if (isFinite(r)) rets.push(r * 100);
  }
  const m = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, rets.length - 1));
  const z = sd === 0 ? 0 : (ind.changePct - m) / sd;
  const hasNews = !!news?.found && (news.headlines?.length ?? 0) > 0;
  if (Math.abs(z) >= 3 && !hasNews) {
    return {
      flagged: true,
      zScore: +z.toFixed(2),
      hasNews,
      label_ar: `حركة شاذة ${z.toFixed(1)}σ بدون أخبار — احذر`,
      confidenceDelta: -10,
    };
  }
  return { flagged: false, zScore: +z.toFixed(2), hasNews, label_ar: "", confidenceDelta: 0 };
}