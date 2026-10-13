import type { Candle } from "@/lib/market-data/types";

export type VPDReport = {
  detected: boolean;
  type: "bullish_divergence" | "bearish_divergence" | "none";
  strength: number; // 0..100
  description_ar: string;
};

/**
 * Volume / Price Divergence detector.
 * - Bearish: price making higher highs but volume making lower highs
 *   (weakening rally → likely reversal down).
 * - Bullish: price making lower lows but volume drying up (selling exhaustion).
 */
export function detectVPD(candles: Candle[] | undefined): VPDReport {
  if (!candles || candles.length < 20) {
    return { detected: false, type: "none", strength: 0, description_ar: "" };
  }
  const last10 = candles.slice(-10);
  const prev10 = candles.slice(-20, -10);

  const priceHighRecent = Math.max(...last10.map((c) => c.high));
  const priceHighPrev = Math.max(...prev10.map((c) => c.high));
  const priceLowRecent = Math.min(...last10.map((c) => c.low));
  const priceLowPrev = Math.min(...prev10.map((c) => c.low));

  const volRecent = last10.reduce((a, b) => a + b.volume, 0) / 10;
  const volPrev = prev10.reduce((a, b) => a + b.volume, 0) / 10;

  // Bearish divergence: higher highs in price, lower avg volume
  if (priceHighRecent > priceHighPrev * 1.01 && volRecent < volPrev * 0.85) {
    const strength = Math.min(100, Math.round(((volPrev - volRecent) / volPrev) * 200));
    return {
      detected: true,
      type: "bearish_divergence",
      strength,
      description_ar: `تباعد سلبي: السعر يصنع قمماً أعلى لكن الحجم يتراجع (${strength}% قوة) — ضعف في الصعود.`,
    };
  }

  // Bullish divergence: lower lows but volume drying up
  if (priceLowRecent < priceLowPrev * 0.99 && volRecent < volPrev * 0.8) {
    const strength = Math.min(100, Math.round(((volPrev - volRecent) / volPrev) * 150));
    return {
      detected: true,
      type: "bullish_divergence",
      strength,
      description_ar: `تباعد إيجابي: السعر يصنع قيعاناً أقل لكن البائعين منهكون (حجم منخفض) — احتمال انعكاس.`,
    };
  }

  return { detected: false, type: "none", strength: 0, description_ar: "" };
}