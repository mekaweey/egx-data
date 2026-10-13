import type { Indicators } from "@/lib/analysis/indicators.server";
import type { MarketRegime } from "@/lib/analysis/regime.server";
import type { Candle } from "@/lib/market-data/types";

export type DayTradeDecision = {
  signal: "strong_buy" | "buy" | "neutral";
  confidence: number;
  reasons: string[];
};

/**
 * Day-trading-specific decision: predicts whether next session's
 * open→close return will be positive. Buys at next open, sells at next close.
 *
 * Heuristics tuned for the Egyptian Exchange (Sun–Thu):
 *   - Strong close yesterday (close in top 30% of day's range)
 *   - 3-day rising-close momentum (no consolidation/exhaustion)
 *   - Volume thrust (today vol > 1.5x 20d avg AND > 1.3x 5d avg)
 *   - Trend backdrop (close>EMA21>SMA50, MACD hist rising)
 *   - Not extended (close not >4% above EMA21)
 *   - No bearish reversal pattern (shooting star, doji at top)
 *   - Skip if today gap-up >4% (exhaustion) or gap-down >2% (sell-off)
 *   - Skip Thursdays (next session is Sunday → weekend gap risk)
 */
export function decideDayTrade(
  candles: Candle[],
  ind: Indicators,
  market: MarketRegime,
): DayTradeDecision {
  const reasons: string[] = [];
  const n = candles.length;
  if (n < 6) return { signal: "neutral", confidence: 0, reasons: ["بيانات غير كافية"] };

  // Hard liquidity / volatility filters
  if (ind.volAvg20 > 0 && ind.volAvg20 < 30_000) {
    return { signal: "neutral", confidence: 0, reasons: ["سيولة منخفضة"] };
  }
  if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close > 0.045) {
    return { signal: "neutral", confidence: 0, reasons: ["تذبذب مفرط للمضاربة اليومية"] };
  }

  // Regime gates — day-trading needs a trending market
  if (market.regime !== "trending_up") {
    return { signal: "neutral", confidence: 0, reasons: ["السوق ليس صاعداً"] };
  }

  const today = candles[n - 1];
  const y1 = candles[n - 2];
  const y2 = candles[n - 3];
  const y3 = candles[n - 4];

  // Skip Thursdays — next session is Sunday (weekend gap risk).
  // EGX uses ISO weekday: Thu=4 → JS getDay()=4.
  const dt = new Date(today.date);
  if (dt.getUTCDay() === 4) {
    return { signal: "neutral", confidence: 0, reasons: ["خميس — مخاطر فجوة عطلة"] };
  }

  // 1) Strong close yesterday: close in top 30% of day's range
  const range = today.high - today.low;
  if (range <= 0) return { signal: "neutral", confidence: 0, reasons: ["نطاق صفري"] };
  const closePos = (today.close - today.low) / range; // 1 = closed at high
  const strongClose = closePos >= 0.7;

  // 2) Day-on-day strength
  const dayChg = (today.close - y1.close) / y1.close * 100;
  const exhaustionGap = (today.open - y1.close) / y1.close * 100 > 4;
  const sellOffGap = (today.open - y1.close) / y1.close * 100 < -2;
  if (exhaustionGap || sellOffGap) {
    return { signal: "neutral", confidence: 0, reasons: ["فجوة افتتاح غير ملائمة"] };
  }

  // 3) 3-day rising closes (not strictly, allow one wobble)
  const risingCount = [
    today.close > y1.close ? 1 : 0,
    y1.close > y2.close ? 1 : 0,
    y2.close > y3.close ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // 4) Volume thrust — both short & long avg
  const vol5 = candles.slice(-6, -1).reduce((s, c) => s + c.volume, 0) / 5;
  const volBurst5 = vol5 > 0 ? today.volume / vol5 : 0;
  const volThrust = ind.volRatio >= 1.5 && volBurst5 >= 1.3;
  const volElite = ind.volRatio >= 2.0 && volBurst5 >= 1.6;

  // 5) Trend backdrop
  const ema21 = ind.ema21 ?? ind.close;
  const sma50 = ind.sma50 ?? ind.close;
  const aboveEma21 = ind.close > ema21;
  const stack = ema21 > sma50;
  const macdRising = (ind.macdHist ?? 0) > 0;
  const rsi = ind.rsi14 ?? 50;
  const rsiZone = rsi >= 50 && rsi <= 68;

  // 6) Not extended
  const extPct = ema21 > 0 ? ((ind.close - ema21) / ind.close) * 100 : 0;
  const notExtended = extPct < 4 && extPct > -1;

  // 7) No bearish reversal
  const bearish = ind.patterns.some(
    (p) => p.name === "shooting_star" || (p.name === "doji" && closePos > 0.7),
  );
  if (bearish) {
    return { signal: "neutral", confidence: 0, reasons: ["نمط انعكاسي هابط"] };
  }

  // Hard gates that we never bend on
  if (!(aboveEma21 && stack && macdRising)) {
    return { signal: "neutral", confidence: 0, reasons: ["اتجاه غير صاعد"] };
  }
  if (!notExtended) {
    return { signal: "neutral", confidence: 0, reasons: ["السهم ممتد بعيداً عن EMA21"] };
  }
  if (!rsiZone) {
    return { signal: "neutral", confidence: 0, reasons: ["RSI خارج النطاق"] };
  }

  // Scored gates — accumulate evidence
  let score = 40;
  if (strongClose) { score += 12; reasons.push("إغلاق قوي عند القمة"); }
  if (closePos >= 0.85) { score += 5; reasons.push("إغلاق قرب القمة"); }
  if (dayChg > 0 && dayChg < 3.5) { score += 8; reasons.push(`ارتفاع يومي ${dayChg.toFixed(2)}%`); }
  if (risingCount >= 2) { score += 8; reasons.push("زخم 3 أيام"); }
  if (risingCount === 3) { score += 4; reasons.push("زخم 3 أيام كامل"); }
  if (volElite) { score += 20; reasons.push("حجم استثنائي"); }
  else if (volThrust) { score += 14; reasons.push("حجم تأكيدي"); }
  if ((market.slope_pct ?? 0) >= 1.5) { score += 5; reasons.push("سوق صاعد قوي"); }
  if (ind.atr14 != null && ind.close > 0 && ind.atr14 / ind.close < 0.025) {
    score += 5; reasons.push("تذبذب منخفض — حركة منظمة");
  }

  const signal: DayTradeDecision["signal"] = score >= 85 ? "strong_buy" : "buy";
  return { signal, confidence: Math.min(95, score), reasons };
}