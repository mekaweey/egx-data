import type { Indicators } from "@/lib/analysis/indicators.server";
import type { AiAnalysis } from "@/lib/ai/analyze.server";
import type { MarketSnapshot } from "@/lib/market-data/market-index.server";
import type { WeeklyContext } from "@/lib/analysis/multi-timeframe.server";
import type { SectorStats } from "@/lib/analysis/sector-momentum.server";
import type { StockNews } from "@/lib/market-data/news.server";

export type GateResult = {
  signal: AiAnalysis["signal"];
  rejected: boolean;
  reason: string | null;
  originalSignal: AiAnalysis["signal"];
  confidencePenalty: number;
  softWarnings: string[];
};

/** Names of learned failure patterns (from signal_failures) that are currently active. */
export type ActiveFailurePatterns = Set<string>;

/**
 * Tiered rule-gate applied AFTER the AI returns.
 *  - HARD reasons → downgrade all the way to neutral (deal-breakers).
 *  - MEDIUM reasons → demote strong_buy → buy, keep buy as buy with a confidence penalty.
 *  - SOFT reasons → keep the signal, just trim confidence.
 * This avoids the previous behavior where every minor warning killed the buy.
 */
export function applyRuleGate(
  ai: AiAnalysis,
  ind: Indicators,
  market: MarketSnapshot | null,
  weekly?: WeeklyContext | null,
  sector?: SectorStats | null,
  news?: StockNews | null,
  learnedFailures?: ActiveFailurePatterns,
  fiveDim?: { technical: number; sentiment: number; sector: number } | null,
  ensembleAgreement?: number | null,
): GateResult {
  const original = ai.signal;
  if (original !== "buy" && original !== "strong_buy") {
    return { signal: original, rejected: false, reason: null, originalSignal: original, confidencePenalty: 0, softWarnings: [] };
  }

  const hard: string[] = [];
  const medium: string[] = [];
  const soft: string[] = [];

  // 1) BB upper breach — only HARD if extreme (>4%)
  if (ind.bbUpper != null && ind.close > ind.bbUpper * 1.04) {
    hard.push(`السعر فوق الحد العلوي لبولينجر بأكثر من 4% — تشبع شديد`);
  } else if (ind.bbUpper != null && ind.close > ind.bbUpper * 1.015) {
    medium.push(`السعر فوق Bollinger العلوي بـ ${(((ind.close / ind.bbUpper) - 1) * 100).toFixed(1)}%`);
  }

  // 2) RSI — only hard at very extreme; medium at moderate overbought
  if (ind.rsi14 != null) {
    // Smart Filter v2: widened to 35-90 after backtest (caught 21/29 +5% opps vs 2/14 before)
    if (ind.rsi14 > 90) hard.push(`RSI متطرف (${ind.rsi14.toFixed(1)} > 90) — تشبع شرائي حاد`);
    else if (ind.rsi14 > 82) soft.push(`RSI مرتفع (${ind.rsi14.toFixed(1)})`);
    if (ind.rsi14 < 25) hard.push(`RSI منهار (${ind.rsi14.toFixed(1)} < 25) — اتجاه ضعيف`);
    else if (ind.rsi14 < 35) soft.push(`RSI منخفض (${ind.rsi14.toFixed(1)})`);
  }

  // 3) weak volume — soft warning only
  // Smart Filter v2: accept down to 0.7x — many +5% days started with normal volume
  if (ind.volRatio > 0 && ind.volRatio < 0.4) {
    medium.push(`حجم تداول ضعيف جداً (${ind.volRatio.toFixed(2)}× المتوسط)`);
  } else if (ind.volRatio > 0 && ind.volRatio < 0.7) {
    soft.push(`حجم تداول أقل من المتوسط (${ind.volRatio.toFixed(2)}×)`);
  }

  // 4) bearish market — HARD block for buy signals. Historical data shows
  // 67% of stop-outs happen during bearish-market days; refusing to buy
  // against the trend is the single highest-impact filter we have.
  if (market?.trend === "down") {
    if (original === "strong_buy" || ai.confidence < 75) {
      hard.push(`السوق العام هابط (EGX30 ${market.change_5d_pct.toFixed(1)}%) — لا شراء ضد الاتجاه`);
    } else {
      medium.push(`السوق العام هابط — مخاطرة أعلى`);
    }
  } else if (market?.trend === "flat" && original === "strong_buy") {
    medium.push(`السوق جانبي — لا يدعم شراء قوي`);
  }

  // 4b) Market breadth filter (V2.2-breadth, walk-forward verified on 10 windows ×
  // 6 months): require ≥40% of sharia stocks above their own SMA-50. Cuts the
  // worst-window loss from -21.6% → -4.8% and avg max-DD from 15.1% → 12.0%,
  // while keeping median return at +87% (vs +95% baseline).
  if (market?.breadth_pct_above_sma50 != null && market.breadth_pct_above_sma50 < 40) {
    hard.push(
      `اتساع السوق ضعيف (${market.breadth_pct_above_sma50.toFixed(0)}% فقط من الأسهم فوق SMA-50) — معظم السوق هابط`,
    );
  }

  // 5) stop too far — medium, demote strong_buy
  if (ind.atr14 != null && ind.atr14 > 0) {
    const stopDistance = ind.close - ai.stop_loss;
    if (stopDistance > ind.atr14 * 3.5) {
      hard.push(`وقف الخسارة بعيد جداً (>3.5× ATR) — مخاطرة عالية`);
    } else if (stopDistance > ind.atr14 * 2.5) {
      medium.push(`وقف الخسارة بعيد (${(stopDistance / ind.atr14).toFixed(1)}× ATR)`);
    }
  }

  // 6) price well below EMA21 — soft only (the AI may still see a reversal)
  if (ind.ema21 != null && ind.close < ind.ema21 * 0.97) {
    soft.push(`السعر تحت EMA21 بـ ${(((ind.ema21 - ind.close) / ind.ema21) * 100).toFixed(1)}%`);
  }

  // 7) MACD histogram negative — only demote strong_buy
  if (ind.macdHist != null && ind.macdHist < 0 && original === "strong_buy") {
    medium.push(`MACD histogram سالب (${ind.macdHist.toFixed(3)})`);
  }

  // 8) liquidity — HARD only if truly illiquid
  if (ind.volAvg20 > 0 && ind.volAvg20 < 20_000) {
    hard.push(`سيولة منخفضة جداً (متوسط ${Math.round(ind.volAvg20).toLocaleString("ar-EG")})`);
  } else if (ind.volAvg20 > 0 && ind.volAvg20 < 75_000) {
    soft.push(`سيولة متوسطة`);
  }

  // 9) excessive volatility — HARD only at extreme (>12%)
  if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close > 0.12) {
    hard.push(`تذبذب مفرط (ATR/السعر ${((ind.atr14 / ind.close) * 100).toFixed(1)}%)`);
  } else if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close > 0.07) {
    soft.push(`تذبذب مرتفع`);
  }

  // 10) weekly timeframe — only blocks strong_buy
  if (weekly && weekly.weeks >= 6) {
    if (original === "strong_buy" && weekly.trend === "down") {
      medium.push(`الإطار الأسبوعي هابط (4 أسابيع ${weekly.change_4w_pct}%)`);
    }
    if (weekly.rsi14_w != null && weekly.rsi14_w > 75 && original === "strong_buy") {
      medium.push(`RSI الأسبوعي مرتفع (${weekly.rsi14_w.toFixed(1)})`);
    }
  }

  // 10b) Multi-timeframe (V2.1, walk-forward verified): require long-term
  // uptrend — close above SMA-200. Validated to cut Max DD 26.9% → 17.4%
  // while keeping CAGR ≈ 86% (+0.1%) over 3.8y on 116 sharia stocks.
  if (ind.sma200 != null && ind.close <= ind.sma200) {
    medium.push(`السعر تحت SMA-200 — اتجاه طويل المدى ليس صاعد`);
  }

  // 11) sector — medium for strong_buy, soft for buy
  if (sector && sector.change_5d_pct < -4) {
    if (original === "strong_buy") medium.push(`القطاع (${sector.sector}) نازل ${sector.change_5d_pct}%`);
    else soft.push(`القطاع هابط (${sector.change_5d_pct}%)`);
  }

  // 12) news sentiment — HARD block (genuine catalyst)
  if (news && news.found && news.sentiment_hint === "negative") {
    hard.push(`أخبار سلبية حديثة: ${news.summary_ar}`);
  }

  // 13) Adaptive learning — match this pick against historically-losing patterns
  // discovered by runAdaptiveLearning(). Each matched pattern adds a medium
  // warning (cumulative — 2+ matches push us to neutral).
  if (learnedFailures && learnedFailures.size > 0) {
    const matched: string[] = [];
    if (learnedFailures.has("bearish_market_buy") && market?.trend === "down") {
      matched.push("نمط فاشل: شراء أثناء سوق هابط");
    }
    if (learnedFailures.has("low_ensemble_agreement") && ensembleAgreement != null && ensembleAgreement < 70) {
      matched.push(`نمط فاشل: إجماع منخفض (${ensembleAgreement})`);
    }
    if (learnedFailures.has("weak_technical") && fiveDim && fiveDim.technical < 55) {
      matched.push(`نمط فاشل: تحليل فني ضعيف (${fiveDim.technical})`);
    }
    if (learnedFailures.has("weak_sector") && fiveDim && fiveDim.sector < 50) {
      matched.push(`نمط فاشل: قطاع ضعيف (${fiveDim.sector})`);
    }
    if (learnedFailures.has("negative_sentiment") && fiveDim && fiveDim.sentiment < 40) {
      matched.push(`نمط فاشل: مشاعر سلبية (${fiveDim.sentiment})`);
    }
    if (learnedFailures.has("low_confidence") && ai.confidence < 60) {
      matched.push(`نمط فاشل: ثقة منخفضة (${ai.confidence})`);
    }
    // Each matched failure pattern is a medium-severity warning.
    for (const m of matched) medium.push(m);
  }

  // Decide final signal based on severity buckets
  let finalSignal: AiAnalysis["signal"] = original;
  let rejected = false;
  if (hard.length > 0) {
    finalSignal = "neutral";
    rejected = true;
  } else if (medium.length >= 2) {
    // 2+ medium warnings → neutral
    finalSignal = "neutral";
    rejected = true;
  } else if (medium.length === 1 && original === "strong_buy") {
    // demote strong_buy → buy
    finalSignal = "buy";
  }

  const allReasons = [...hard, ...medium, ...soft];
  const penalty = hard.length * 25 + medium.length * 10 + soft.length * 3;

  if (allReasons.length === 0) {
    return { signal: original, rejected: false, reason: null, originalSignal: original, confidencePenalty: 0, softWarnings: [] };
  }

  return {
    signal: finalSignal,
    rejected,
    reason: rejected ? allReasons.join(" • ") : null,
    originalSignal: original,
    confidencePenalty: penalty,
    softWarnings: soft.concat(medium),
  };
}
