function decide(ind, market) {
  const reasons = [];
  if (market.regime === "trending_down" || market.regime === "volatile") {
    return { signal: "neutral", confidence: 0, reasons: [`سوق ${market.regime === "trending_down" ? "هابط" : "متذبذب"}`] };
  }
  const close = ind.close;
  const prevClose = ind.prevClose;
  const sma50 = ind.sma50 ?? close;
  const resistance = ind.priorHigh20;
  if (ind.volAvg20 < 2e5) {
    return { signal: "neutral", confidence: 0, reasons: ["سيولة غير كافية"] };
  }
  if (close <= sma50) {
    return { signal: "neutral", confidence: 0, reasons: ["تحت متوسط 50 — مفيش اتجاه صاعد"] };
  }
  if (resistance <= 0 || close <= resistance) {
    return { signal: "neutral", confidence: 0, reasons: ["لم يكسر قمة 20 يوم"] };
  }
  if (ind.volRatio < 2) {
    return { signal: "neutral", confidence: 0, reasons: [`حجم ضعيف (${ind.volRatio.toFixed(1)}x)`] };
  }
  if (close <= prevClose) {
    return { signal: "neutral", confidence: 0, reasons: ["شمعة غير صاعدة"] };
  }
  const extPct = (close - resistance) / resistance * 100;
  if (extPct > 5) {
    return { signal: "neutral", confidence: 0, reasons: [`الاختراق ممتد جداً (+${extPct.toFixed(1)}%)`] };
  }
  if (ind.rsi14 != null && ind.rsi14 > 78) {
    return { signal: "neutral", confidence: 0, reasons: ["RSI متطرف"] };
  }
  let score = 70;
  reasons.push(`كسر قمة 20 يوم عند ${resistance.toFixed(2)}`);
  reasons.push(`حجم ${ind.volRatio.toFixed(1)}x المتوسط`);
  if (ind.volRatio >= 3) {
    score += 10;
    reasons.push("حجم استثنائي");
  } else if (ind.volRatio >= 2.5) {
    score += 6;
  }
  if (extPct < 2) {
    score += 5;
    reasons.push("اختراق طازج (غير ممتد)");
  }
  const ema21 = ind.ema21 ?? close;
  if (ema21 > sma50) {
    score += 5;
    reasons.push("هيكل صاعد سليم (EMA21>SMA50)");
  }
  if (ind.macdHist != null && ind.macdHist > 0) {
    score += 3;
  }
  if (market.regime === "trending_up" && (market.slope_pct ?? 0) >= 1) {
    score += 5;
    reasons.push("سوق صاعد قوي");
  }
  if (market.regime === "ranging") {
    score -= 5;
    reasons.push("سوق عرضي");
  }
  const finalScore = Math.min(95, Math.round(score));
  const signal = finalScore >= 80 ? "strong_buy" : "buy";
  return { signal, confidence: finalScore, reasons };
}
export {
  decide as d
};
