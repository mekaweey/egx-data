/**
 * Anomaly detection — flags unusual market activity that historically
 * precedes either explosive moves OR reversals. Used as a confidence
 * modifier (not a hard gate) since anomalies can cut both ways.
 */
import type { Candle } from "@/lib/market-data/types";
import type { Indicators } from "./indicators.server";

export type Anomaly = {
  kind:
    | "volume_spike"
    | "volume_dryup"
    | "price_gap_up"
    | "price_gap_down"
    | "wide_range_bar"
    | "exhaustion_spike"
    | "stealth_accumulation";
  severity: "mild" | "strong" | "extreme";
  description_ar: string;
  /** Confidence delta applied to bullish picks (+ boosts, - penalises). */
  bullish_delta: number;
};

export type AnomalyReport = {
  anomalies: Anomaly[];
  /** Net confidence adjustment for bullish picks (capped at ±15). */
  netDelta: number;
  /** Composite anomaly score 0..100 (higher = more unusual activity). */
  score: number;
};

export function detectAnomalies(
  candles: Candle[] | undefined,
  ind: Indicators,
): AnomalyReport {
  if (!candles || candles.length < 20) {
    return { anomalies: [], netDelta: 0, score: 0 };
  }

  const anomalies: Anomaly[] = [];
  const last = candles[candles.length - 1]!;
  const prev = candles[candles.length - 2]!;
  const recent = candles.slice(-20);
  const avgVol = recent.reduce((s, c) => s + c.volume, 0) / recent.length;
  const avgRange =
    recent.reduce((s, c) => s + (c.high - c.low), 0) / recent.length;

  // 1) Volume spike — could be breakout OR exhaustion
  if (avgVol > 0 && last.volume > avgVol * 3) {
    const isUp = last.close > last.open;
    const isExhaustion =
      isUp && ind.rsi14 != null && ind.rsi14 > 70 && ind.close > (ind.bbUpper ?? Infinity);
    if (isExhaustion) {
      anomalies.push({
        kind: "exhaustion_spike",
        severity: "strong",
        description_ar: `حجم ضخم (${(last.volume / avgVol).toFixed(1)}× المتوسط) مع تشبع شرائي — احتمال انعكاس`,
        bullish_delta: -10,
      });
    } else if (isUp) {
      anomalies.push({
        kind: "volume_spike",
        severity: last.volume > avgVol * 5 ? "extreme" : "strong",
        description_ar: `موجة شراء قوية (حجم ${(last.volume / avgVol).toFixed(1)}× المتوسط)`,
        bullish_delta: +6,
      });
    } else {
      anomalies.push({
        kind: "volume_spike",
        severity: "strong",
        description_ar: `حجم ضخم على شمعة حمراء — ضغط بيع`,
        bullish_delta: -8,
      });
    }
  }

  // 2) Volume dry-up after a run — often precedes reversal
  if (avgVol > 0 && last.volume < avgVol * 0.4 && ind.changePct > 0) {
    anomalies.push({
      kind: "volume_dryup",
      severity: "mild",
      description_ar: `صعود بدون حجم (${(last.volume / avgVol).toFixed(2)}× المتوسط) — ضعف في القوة الشرائية`,
      bullish_delta: -5,
    });
  }

  // 3) Price gap up/down
  const gapPct = ((last.open - prev.close) / prev.close) * 100;
  if (gapPct > 3) {
    anomalies.push({
      kind: "price_gap_up",
      severity: gapPct > 6 ? "extreme" : "strong",
      description_ar: `فجوة صاعدة ${gapPct.toFixed(1)}% — احتمال FOMO`,
      bullish_delta: gapPct > 6 ? -8 : +3,
    });
  } else if (gapPct < -3) {
    anomalies.push({
      kind: "price_gap_down",
      severity: gapPct < -6 ? "extreme" : "strong",
      description_ar: `فجوة هابطة ${gapPct.toFixed(1)}% — ضغط بيع مفاجئ`,
      bullish_delta: -10,
    });
  }

  // 4) Wide range bar (>2.5× average) — climax / capitulation signal
  const range = last.high - last.low;
  if (avgRange > 0 && range > avgRange * 2.5) {
    const closeNearHigh = (last.close - last.low) / range > 0.7;
    anomalies.push({
      kind: "wide_range_bar",
      severity: range > avgRange * 4 ? "extreme" : "strong",
      description_ar: closeNearHigh
        ? `شمعة عريضة بإغلاق قوي — استمرار محتمل`
        : `شمعة عريضة بإغلاق ضعيف — تذبذب عالي`,
      bullish_delta: closeNearHigh ? +4 : -6,
    });
  }

  // 5) Stealth accumulation — 3+ days of above-avg volume on quiet price action
  if (recent.length >= 5) {
    const last5 = recent.slice(-5);
    const highVolDays = last5.filter((c) => c.volume > avgVol * 1.3).length;
    const totalMove = Math.abs(
      ((last5[last5.length - 1]!.close - last5[0]!.open) / last5[0]!.open) * 100,
    );
    if (highVolDays >= 3 && totalMove < 2) {
      anomalies.push({
        kind: "stealth_accumulation",
        severity: "strong",
        description_ar: `تجميع صامت: حجم مرتفع ${highVolDays}/5 أيام بدون حركة سعرية — مؤسسات تبني مركز`,
        bullish_delta: +8,
      });
    }
  }

  const netDelta = Math.max(
    -15,
    Math.min(15, anomalies.reduce((s, a) => s + a.bullish_delta, 0)),
  );
  const score = Math.min(
    100,
    anomalies.reduce(
      (s, a) => s + (a.severity === "extreme" ? 40 : a.severity === "strong" ? 25 : 10),
      0,
    ),
  );

  return { anomalies, netDelta, score };
}