import type { Indicators } from "@/lib/analysis/indicators.server";

export type TrailingStopPlan = {
  initial_stop: number;
  trail_atr_mult: number;
  activation_price: number; // start trailing once price reaches this
  step_pct: number;
  description_ar: string;
};

/**
 * Dynamic trailing stop plan based on ATR.
 * - Initial stop = 1.5× ATR below entry
 * - Activate trailing once price advances ≥ 1× ATR
 * - Trail at 2× ATR behind the highest price reached
 */
export function buildTrailingStop(entryPrice: number, ind: Indicators): TrailingStopPlan {
  const atr = ind.atr14 ?? entryPrice * 0.02;
  const initialStop = +(entryPrice - 1.5 * atr).toFixed(2);
  const activation = +(entryPrice + 1.0 * atr).toFixed(2);
  const stepPct = +((atr / entryPrice) * 100).toFixed(2);

  return {
    initial_stop: initialStop,
    trail_atr_mult: 2,
    activation_price: activation,
    step_pct: stepPct,
    description_ar: `وقف ديناميكي: ابدأ بـ ${initialStop}. بعد وصول السعر لـ ${activation}، حرّك الوقف خلف أعلى سعر بمسافة ${(2 * atr).toFixed(2)} (≈${(stepPct * 2).toFixed(1)}%) لحماية الأرباح.`,
  };
}