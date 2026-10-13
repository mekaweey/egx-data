import type { Indicators } from "./indicators.server";

// Composite 0-100 score
export function computeScore(ind: Indicators): number {
  let technical = 50;
  // RSI zone
  if (ind.rsi14 != null) {
    if (ind.rsi14 < 30) technical += 15; // oversold bounce
    else if (ind.rsi14 < 45) technical += 8;
    else if (ind.rsi14 > 70) technical -= 15; // overbought
    else if (ind.rsi14 > 55) technical -= 4;
  }
  // MACD cross
  if (ind.macdHist != null) {
    if (ind.macdHist > 0) technical += 10;
    else technical -= 10;
  }
  // EMA alignment (ema9 > ema21 > sma50 = uptrend)
  if (ind.ema9 && ind.ema21 && ind.sma50) {
    if (ind.ema9 > ind.ema21 && ind.ema21 > ind.sma50) technical += 10;
    else if (ind.ema9 < ind.ema21 && ind.ema21 < ind.sma50) technical -= 10;
  }
  // BB position
  if (ind.bbLower && ind.bbUpper) {
    if (ind.close <= ind.bbLower) technical += 8;
    else if (ind.close >= ind.bbUpper) technical -= 8;
  }
  technical = Math.max(0, Math.min(100, technical));

  // Volume confirmation (0-100)
  let volume = 50;
  if (ind.volRatio > 2) volume = 95;
  else if (ind.volRatio > 1.5) volume = 80;
  else if (ind.volRatio > 1) volume = 65;
  else if (ind.volRatio > 0.5) volume = 45;
  else volume = 25;

  // Trend alignment (price vs ema21 vs sma50)
  let trend = 50;
  if (ind.ema21 && ind.sma50) {
    const above21 = ind.close > ind.ema21;
    const above50 = ind.close > ind.sma50;
    if (above21 && above50) trend = 80;
    else if (!above21 && !above50) trend = 25;
    else trend = 50;
  }

  // Risk/Reward via ATR
  let rr = 50;
  if (ind.atr14 && ind.atr14 > 0) {
    // Reward: distance to resistance / Risk: 1 ATR
    const reward = Math.max(0, ind.resistance - ind.close);
    const risk = ind.atr14;
    const ratio = reward / risk;
    if (ratio >= 3) rr = 90;
    else if (ratio >= 2) rr = 75;
    else if (ratio >= 1.5) rr = 60;
    else if (ratio >= 1) rr = 45;
    else rr = 25;
  }

  const composite =
    technical * 0.4 + volume * 0.2 + trend * 0.2 + rr * 0.2;
  return Math.round(composite * 100) / 100;
}

export function suggestLevels(ind: Indicators) {
  const atr = ind.atr14 ?? ind.close * 0.02;
  const entryMin = +(ind.close - atr * 0.3).toFixed(2);
  const entryMax = +(ind.close + atr * 0.3).toFixed(2);
  const target = +(ind.close + atr * 2).toFixed(2);
  const stopLoss = +(ind.close - atr * 1.2).toFixed(2);
  const risk = ind.close - stopLoss;
  const reward = target - ind.close;
  const rrRatio = risk > 0 ? +(reward / risk).toFixed(2) : 0;
  return { entryMin, entryMax, target, stopLoss, rrRatio };
}