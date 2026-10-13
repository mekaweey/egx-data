import { ATR, ADX } from "technicalindicators";
import type { Candle } from "@/lib/market-data/types";

export type MarketRegime = {
  regime: "trending_up" | "trending_down" | "ranging" | "volatile" | "unknown";
  adx: number | null;
  slope_pct: number | null; // 20-day linear regression slope as %
  bb_width_pct: number | null; // bollinger width as % of price — proxy for volatility
  description_ar: string;
};

/**
 * Detect market regime from a candle series (works on EGX30 or any index).
 * Combines:
 *  - ADX(14): trend strength. > 25 = trending; < 20 = ranging.
 *  - 20-day linear regression slope: trend direction.
 *  - Bollinger band width: volatility proxy.
 *
 * Strategy implications:
 *  - trending_up    → momentum / breakout strategies work best.
 *  - trending_down  → avoid longs; mean-reversion bounces are risky.
 *  - ranging        → mean-reversion (buy support, sell resistance) works.
 *  - volatile       → reduce position sizes, tighten filters.
 */
export function detectRegime(candles: Candle[]): MarketRegime {
  if (candles.length < 30) {
    return { regime: "unknown", adx: null, slope_pct: null, bb_width_pct: null, description_ar: "بيانات غير كافية" };
  }
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const close = candles.map((c) => c.close);

  // ADX
  let adx: number | null = null;
  try {
    const adxArr = ADX.calculate({ period: 14, high, low, close });
    const last = adxArr[adxArr.length - 1];
    if (last && typeof last.adx === "number") adx = +last.adx.toFixed(1);
  } catch {/* ignore */}

  // 20-day slope as % of starting price
  const window = close.slice(-20);
  const slope = window.length >= 20 ? linearSlope(window) : 0;
  const startPrice = window[0] ?? 1;
  const slope_pct = startPrice > 0 ? +((slope * window.length) / startPrice * 100).toFixed(2) : 0;

  // Bollinger width = (recent high range) / mean → volatility proxy
  const atr = (() => {
    try {
      const a = ATR.calculate({ period: 14, high, low, close });
      return a[a.length - 1] ?? null;
    } catch { return null; }
  })();
  const lastClose = close[close.length - 1];
  const bb_width_pct = atr != null && lastClose > 0 ? +(atr / lastClose * 100).toFixed(2) : null;

  // Decision tree
  let regime: MarketRegime["regime"] = "unknown";
  let description = "";
  const isVolatile = bb_width_pct != null && bb_width_pct > 3.5;
  const isTrending = adx != null && adx > 22;
  const isRanging = adx != null && adx < 20;

  if (isVolatile && !isTrending) {
    regime = "volatile";
    description = `سوق متذبذب (ATR ${bb_width_pct}%)`;
  } else if (isTrending && slope_pct > 2.0) {
    regime = "trending_up";
    description = `اتجاه صاعد قوي (ADX ${adx}, الميل +${slope_pct}%)`;
  } else if (isTrending && slope_pct < -2.0) {
    regime = "trending_down";
    description = `اتجاه هابط قوي (ADX ${adx}, الميل ${slope_pct}%)`;
  } else if (isRanging) {
    regime = "ranging";
    description = `سوق عرضي (ADX ${adx ?? "?"}) — استراتيجية الارتداد مناسبة`;
  } else {
    regime = slope_pct > 0 ? "trending_up" : slope_pct < 0 ? "trending_down" : "ranging";
    description = `${regime === "trending_up" ? "ميل صاعد ضعيف" : regime === "trending_down" ? "ميل هابط ضعيف" : "اتجاه غير محدد"} (ADX ${adx ?? "?"})`;
  }

  return { regime, adx, slope_pct, bb_width_pct, description_ar: description };
}

function linearSlope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }
  const denom = n * sumX2 - sumX * sumX;
  if (denom === 0) return 0;
  return (n * sumXY - sumX * sumY) / denom;
}