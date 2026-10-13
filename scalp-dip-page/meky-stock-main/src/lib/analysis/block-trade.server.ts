import type { Indicators } from "@/lib/analysis/indicators.server";
import type { Candle } from "@/lib/market-data/types";

/**
 * Block / Smart-Money trade detector.
 *
 * Flags days where today's volume is ≥ 3× 20-day average AND the close
 * is in the upper third of the day's range (institutional accumulation)
 * or lower third (institutional distribution).
 */

export type BlockTradeSignal = {
  detected: boolean;
  kind: "accumulation" | "distribution" | "none";
  volumeRatio: number;
  label_ar: string;
  confidenceDelta: number;
};

export function detectBlockTrade(ind: Indicators, candles: Candle[] | undefined): BlockTradeSignal {
  const ratio = ind.volRatio ?? null;
  if (!ratio || !candles || candles.length === 0) {
    return { detected: false, kind: "none", volumeRatio: ratio ?? 0, label_ar: "", confidenceDelta: 0 };
  }
  const last = candles[candles.length - 1];
  const range = Math.max(0.0001, last.high - last.low);
  const position = (last.close - last.low) / range;

  if (ratio >= 3 && position >= 0.66) {
    return {
      detected: true,
      kind: "accumulation",
      volumeRatio: +ratio.toFixed(2),
      label_ar: `صفقة كبيرة (تجميع) — حجم ${ratio.toFixed(1)}× المتوسط`,
      confidenceDelta: 6,
    };
  }
  if (ratio >= 3 && position <= 0.33) {
    return {
      detected: true,
      kind: "distribution",
      volumeRatio: +ratio.toFixed(2),
      label_ar: `صفقة كبيرة (توزيع) — حجم ${ratio.toFixed(1)}× المتوسط`,
      confidenceDelta: -8,
    };
  }
  return { detected: false, kind: "none", volumeRatio: +ratio.toFixed(2), label_ar: "", confidenceDelta: 0 };
}