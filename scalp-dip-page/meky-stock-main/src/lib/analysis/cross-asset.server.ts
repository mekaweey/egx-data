import type { Candle } from "@/lib/market-data/types";
import type { MacroSnapshot } from "@/lib/market-data/macro.server";

/**
 * Cross-asset signal: USD strength, oil, and gold trends affect
 * Egyptian equities (especially banks/exporters).
 * We use the latest macro snapshot vs naive expectations to add a small
 * cross-asset tilt to each pick.
 *
 * Heuristics (well-known for EGX):
 *  - Strong USD/EGP move ↑ → hurts importers, helps exporters
 *  - Rising oil → hurts most sectors except energy
 *  - Rising gold + falling equities globally → risk-off
 *  - SP500 strong red → EM sell pressure
 */
export type CrossAssetResult = {
  riskOn: boolean;
  confidenceDelta: number;
  reasons_ar: string[];
};

export function computeCrossAsset(macro: MacroSnapshot | null, candles?: Candle[]): CrossAssetResult {
  const reasons: string[] = [];
  let delta = 0;

  if (!macro) return { riskOn: true, confidenceDelta: 0, reasons_ar: [] };

  if (macro.sp500_change_pct != null) {
    if (macro.sp500_change_pct < -1.5) { delta -= 4; reasons.push("S&P 500 هبوط قوي — بيع في الأسواق الناشئة"); }
    else if (macro.sp500_change_pct > 1.0) { delta += 2; reasons.push("S&P 500 إيجابي — شهية مخاطرة"); }
  }

  // Brent oil vs equity correlation (rising oil = pressure on margins)
  if (macro.brent_oil_usd != null && candles && candles.length >= 20) {
    const c20 = candles.slice(-20);
    const ret = (c20[c20.length - 1].close - c20[0].close) / c20[0].close;
    if (macro.brent_oil_usd > 90 && ret < 0) { delta -= 2; reasons.push("نفط مرتفع + ضغط على السهم"); }
  }

  // USD/EGP weakness historically hits sentiment short-term
  if (macro.usd_egp != null && macro.usd_egp >= 55) {
    delta -= 2; reasons.push(`الدولار مرتفع (${macro.usd_egp.toFixed(2)} EGP) — ضغط على المستوردين`);
  }

  // Gold rally = risk-off mood globally
  if (macro.gold_usd != null && macro.gold_usd >= 2700) {
    delta -= 1; reasons.push("ذهب مرتفع — مزاج تجنب مخاطرة");
  }

  return { riskOn: delta >= 0, confidenceDelta: Math.max(-6, Math.min(6, delta)), reasons_ar: reasons };
}
