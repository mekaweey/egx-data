import { A as ADX, a as ATR, R as RSI, M as MACD, E as EMA, S as SMA, B as BollingerBands, b as bullish, c as bearish } from "../_libs/technicalindicators.mjs";
function detectRegime(candles) {
  if (candles.length < 30) {
    return { regime: "unknown", adx: null, slope_pct: null, bb_width_pct: null, description_ar: "بيانات غير كافية" };
  }
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const close = candles.map((c) => c.close);
  let adx = null;
  try {
    const adxArr = ADX.calculate({ period: 14, high, low, close });
    const last2 = adxArr[adxArr.length - 1];
    if (last2 && typeof last2.adx === "number") adx = +last2.adx.toFixed(1);
  } catch {
  }
  const window = close.slice(-20);
  const slope = window.length >= 20 ? linearSlope(window) : 0;
  const startPrice = window[0] ?? 1;
  const slope_pct = startPrice > 0 ? +(slope * window.length / startPrice * 100).toFixed(2) : 0;
  const atr = (() => {
    try {
      const a = ATR.calculate({ period: 14, high, low, close });
      return a[a.length - 1] ?? null;
    } catch {
      return null;
    }
  })();
  const lastClose = close[close.length - 1];
  const bb_width_pct = atr != null && lastClose > 0 ? +(atr / lastClose * 100).toFixed(2) : null;
  let regime = "unknown";
  let description = "";
  const isVolatile = bb_width_pct != null && bb_width_pct > 3.5;
  const isTrending = adx != null && adx > 22;
  const isRanging = adx != null && adx < 20;
  if (isVolatile && !isTrending) {
    regime = "volatile";
    description = `سوق متذبذب (ATR ${bb_width_pct}%)`;
  } else if (isTrending && slope_pct > 2) {
    regime = "trending_up";
    description = `اتجاه صاعد قوي (ADX ${adx}, الميل +${slope_pct}%)`;
  } else if (isTrending && slope_pct < -2) {
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
function linearSlope(values) {
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
const last = (arr) => arr[arr.length - 1];
function detectPatterns(candles) {
  const hits = [];
  const slice = candles.slice(-5);
  const open = slice.map((c2) => c2.open);
  const high = slice.map((c2) => c2.high);
  const low = slice.map((c2) => c2.low);
  const close = slice.map((c2) => c2.close);
  const input = { open, high, low, close };
  try {
    if (bullish(input)) {
      hits.push({ name: "bullish_pattern", name_ar: "نمط شرائي", bullish: true });
    }
  } catch {
  }
  try {
    if (bearish(input)) {
      hits.push({ name: "bearish_pattern", name_ar: "نمط بيعي", bullish: false });
    }
  } catch {
  }
  const c = slice[slice.length - 1];
  if (!c) return hits;
  const body = Math.abs(c.close - c.open);
  const range = c.high - c.low;
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  if (range > 0 && body / range < 0.1) {
    hits.push({ name: "doji", name_ar: "دوجي (تردد)", bullish: false });
  }
  if (range > 0 && lowerWick > body * 2 && upperWick < body) {
    hits.push({ name: "hammer", name_ar: "مطرقة", bullish: true });
  }
  if (range > 0 && upperWick > body * 2 && lowerWick < body) {
    hits.push({ name: "shooting_star", name_ar: "نجم هابط", bullish: false });
  }
  return hits;
}
function pivotLevels(candles) {
  const slice = candles.slice(-30);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  return { support: low, resistance: high };
}
function priorHigh(candles, lookback = 20) {
  if (candles.length < 2) return 0;
  const slice = candles.slice(-(lookback + 1), -1);
  if (!slice.length) return 0;
  return Math.max(...slice.map((c) => c.high));
}
function computeIndicators(candles) {
  if (candles.length < 50) {
    throw new Error(`Need >=50 candles, got ${candles.length}`);
  }
  const close = candles.map((c) => c.close);
  const high = candles.map((c) => c.high);
  const low = candles.map((c) => c.low);
  const volume = candles.map((c) => c.volume);
  const rsi = RSI.calculate({ period: 14, values: close });
  const macdArr = MACD.calculate({
    values: close,
    fastPeriod: 12,
    slowPeriod: 26,
    signalPeriod: 9,
    SimpleMAOscillator: false,
    SimpleMASignal: false
  });
  const ema9 = EMA.calculate({ period: 9, values: close });
  const ema21 = EMA.calculate({ period: 21, values: close });
  const sma50 = SMA.calculate({ period: 50, values: close });
  const sma200 = close.length >= 200 ? SMA.calculate({ period: 200, values: close }) : [];
  const bb = BollingerBands.calculate({ period: 20, values: close, stdDev: 2 });
  const atr = ATR.calculate({ period: 14, high, low, close });
  const recentVol = volume.slice(-20);
  const volAvg20 = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
  const lastVolume = last(volume) ?? 0;
  const volRatio = volAvg20 > 0 ? lastVolume / volAvg20 : 0;
  const cClose = last(close) ?? 0;
  const pClose = close[close.length - 2] ?? cClose;
  const changePct = pClose ? (cClose - pClose) / pClose * 100 : 0;
  const macdLast = last(macdArr);
  const bbLast = last(bb);
  const { support, resistance } = pivotLevels(candles);
  const priorHigh20 = priorHigh(candles, 20);
  return {
    close: cClose,
    prevClose: pClose,
    changePct,
    rsi14: last(rsi) ?? null,
    macd: macdLast?.MACD ?? null,
    macdSignal: macdLast?.signal ?? null,
    macdHist: macdLast?.histogram ?? null,
    ema9: last(ema9) ?? null,
    ema21: last(ema21) ?? null,
    sma50: last(sma50) ?? null,
    sma200: last(sma200) ?? null,
    bbUpper: bbLast?.upper ?? null,
    bbMid: bbLast?.middle ?? null,
    bbLower: bbLast?.lower ?? null,
    atr14: last(atr) ?? null,
    volAvg20,
    volRatio,
    support,
    resistance,
    priorHigh20,
    patterns: detectPatterns(candles)
  };
}
function canonicalLevels(ind, opts) {
  const stopMult = opts?.stopMult ?? 1.4;
  const targetMult = opts?.targetMult ?? 3.2;
  const minRR = opts?.minRR ?? 2;
  const MIN_STOP_PCT = 1.2;
  const price = opts?.priceOverride ?? ind.close;
  const atr = ind.atr14;
  if (atr != null && atr > 0 && price > 0) {
    let stop2 = price - atr * stopMult;
    let target2 = price + atr * targetMult;
    if (ind.support > 0 && ind.support < price) {
      const supStop = ind.support * 0.995;
      if (supStop > stop2 && supStop < price * 0.99) stop2 = supStop;
    }
    if (ind.resistance > 0 && ind.resistance > price) {
      if (ind.resistance < target2) target2 = ind.resistance * 0.995;
    }
    const minStop = price * (1 - MIN_STOP_PCT / 100);
    if (stop2 > minStop) stop2 = minStop;
    {
      const risk = price - stop2;
      const reward = target2 - price;
      if (risk > 0 && reward / risk < minRR) {
        target2 = price + risk * minRR;
      }
    }
    const stopDistancePct = (price - stop2) / price * 100;
    const targetDistancePct = (target2 - price) / price * 100;
    const rr = (target2 - price) / (price - stop2);
    return {
      entryMin: +(price * 0.998).toFixed(2),
      entryMax: +(price * 1.005).toFixed(2),
      stopLoss: +stop2.toFixed(2),
      target: +target2.toFixed(2),
      rrRatio: +rr.toFixed(2),
      atrMultStop: stopMult,
      atrMultTarget: targetMult,
      stopDistancePct: +stopDistancePct.toFixed(2),
      targetDistancePct: +targetDistancePct.toFixed(2),
      source: "atr"
    };
  }
  const stop = price * 0.98;
  const target = price * 1.04;
  return {
    entryMin: +(price * 0.998).toFixed(2),
    entryMax: +(price * 1.005).toFixed(2),
    stopLoss: +stop.toFixed(2),
    target: +target.toFixed(2),
    rrRatio: 2,
    atrMultStop: 0,
    atrMultTarget: 0,
    stopDistancePct: 2,
    targetDistancePct: 4,
    source: "fallback"
  };
}
export {
  canonicalLevels as a,
  computeIndicators as c,
  detectRegime as d
};
