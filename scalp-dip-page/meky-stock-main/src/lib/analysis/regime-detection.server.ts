import type { MarketSnapshot } from "@/lib/market-data/market-index.server";
import type { Candle } from "@/lib/market-data/types";

export type MarketRegime =
  | "bull_trending"
  | "bear_trending"
  | "high_volatility"
  | "low_volatility"
  | "ranging";

export type RegimeReport = {
  regime: MarketRegime;
  label_ar: string;
  volatility_pct: number;
  trend_strength: number; // -100..100
  confidence_multiplier: number; // applied to picks (0.7..1.15)
  description_ar: string;
};

/**
 * Detect market regime from EGX30 snapshot + recent candles (if available).
 * Used by the scanner to adjust confidence thresholds dynamically.
 */
export function detectRegime(market: MarketSnapshot | null, indexCandles?: Candle[]): RegimeReport {
  if (!market) {
    return {
      regime: "ranging",
      label_ar: "غير محدد",
      volatility_pct: 0,
      trend_strength: 0,
      confidence_multiplier: 1,
      description_ar: "لا توجد بيانات كافية للسوق",
    };
  }

  // Compute realized volatility from last 20 daily returns if we have candles.
  let volatilityPct = 0;
  if (indexCandles && indexCandles.length >= 20) {
    const tail = indexCandles.slice(-20);
    const returns: number[] = [];
    for (let i = 1; i < tail.length; i++) {
      const r = (tail[i].close - tail[i - 1].close) / tail[i - 1].close;
      returns.push(r);
    }
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length;
    volatilityPct = Math.sqrt(variance) * Math.sqrt(252) * 100; // annualized %
  } else {
    // Fallback: use 5d change magnitude as a rough proxy
    volatilityPct = Math.abs(market.change_5d_pct ?? 0) * 3;
  }

  const change5d = market.change_5d_pct ?? 0;
  const trendStrength = Math.max(-100, Math.min(100, change5d * 10));

  // Classify
  let regime: MarketRegime = "ranging";
  let label = "متذبذب";
  let mult = 1;
  let desc = "السوق في نطاق محدود، فرص محدودة";

  if (volatilityPct >= 35) {
    regime = "high_volatility";
    label = "تقلبات عالية";
    mult = 0.75;
    desc = `تقلبات عالية (${volatilityPct.toFixed(1)}%) — قلل المراكز وارفع الـ stop loss`;
  } else if (volatilityPct < 12 && Math.abs(change5d) < 1) {
    regime = "low_volatility";
    label = "تقلبات منخفضة";
    mult = 1.05;
    desc = "سوق هادئ — فرص تجميع مناسبة";
  } else if (market.trend === "up" && change5d > 1.5) {
    regime = "bull_trending";
    label = "اتجاه صاعد";
    mult = 1.15;
    desc = `سوق صاعد قوي (+${change5d.toFixed(1)}% خلال 5 أيام)`;
  } else if (market.trend === "down" && change5d < -1.5) {
    regime = "bear_trending";
    label = "اتجاه هابط";
    mult = 0.7;
    desc = `سوق هابط (${change5d.toFixed(1)}% خلال 5 أيام) — تجنب الشراء`;
  }

  return {
    regime,
    label_ar: label,
    volatility_pct: +volatilityPct.toFixed(2),
    trend_strength: +trendStrength.toFixed(1),
    confidence_multiplier: mult,
    description_ar: desc,
  };
}