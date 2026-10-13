import type { Indicators } from "./indicators.server";

/**
 * Liquidity & slippage model.
 * Estimates daily turnover (EGP) = avg volume × close, then maps it to
 * a tier. Illiquid stocks get a confidence penalty + position-size cap
 * because a stop-hit on a thin book = real slippage.
 */
export type LiquidityProfile = {
  turnoverEgp: number;
  tier: "deep" | "normal" | "thin" | "illiquid";
  label_ar: string;
  confidenceDelta: number;
  positionCapPct: number; // hard cap on position size %
  estimatedSlippagePct: number;
};

export function assessLiquidity(ind: Indicators): LiquidityProfile {
  const turnover = (ind.volAvg20 ?? 0) * ind.close;
  if (turnover >= 20_000_000) {
    return { turnoverEgp: turnover, tier: "deep", label_ar: "سيولة عميقة", confidenceDelta: 2, positionCapPct: 10, estimatedSlippagePct: 0.1 };
  }
  if (turnover >= 5_000_000) {
    return { turnoverEgp: turnover, tier: "normal", label_ar: "سيولة طبيعية", confidenceDelta: 0, positionCapPct: 7, estimatedSlippagePct: 0.3 };
  }
  if (turnover >= 1_000_000) {
    return { turnoverEgp: turnover, tier: "thin", label_ar: "سيولة ضعيفة — حذر من الانزلاق", confidenceDelta: -5, positionCapPct: 3, estimatedSlippagePct: 0.8 };
  }
  return { turnoverEgp: turnover, tier: "illiquid", label_ar: "سيولة منعدمة — تجنّب", confidenceDelta: -15, positionCapPct: 1, estimatedSlippagePct: 2.0 };
}
