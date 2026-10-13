import {
  RSI,
  MACD,
  EMA,
  SMA,
  BollingerBands,
  ATR,
  bullish,
  bearish,
} from "technicalindicators";
import type { Candle } from "../market-data/types";

export type PatternHit = {
  name: string;
  name_ar: string;
  bullish: boolean;
};

export type Indicators = {
  close: number;
  prevClose: number;
  changePct: number;
  rsi14: number | null;
  macd: number | null;
  macdSignal: number | null;
  macdHist: number | null;
  ema9: number | null;
  ema21: number | null;
  sma50: number | null;
  sma200: number | null;
  bbUpper: number | null;
  bbMid: number | null;
  bbLower: number | null;
  atr14: number | null;
  volAvg20: number;
  volRatio: number;
  support: number;
  resistance: number;
  priorHigh20: number;
  patterns: PatternHit[];
};

const last = <T>(arr: T[]): T | undefined => arr[arr.length - 1];

function detectPatterns(candles: Candle[]): PatternHit[] {
  const hits: PatternHit[] = [];
  const slice = candles.slice(-5);
  const open = slice.map((c) => c.open);
  const high = slice.map((c) => c.high);
  const low = slice.map((c) => c.low);
  const close = slice.map((c) => c.close);
  const input = { open, high, low, close };

  // technicalindicators provides aggregated bullish/bearish detectors
  try {
    if (bullish(input)) {
      hits.push({ name: "bullish_pattern", name_ar: "نمط شرائي", bullish: true });
    }
  } catch {/* ignore */}
  try {
    if (bearish(input)) {
      hits.push({ name: "bearish_pattern", name_ar: "نمط بيعي", bullish: false });
    }
  } catch {/* ignore */}

  // Simple manual detectors on the last candle
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

function pivotLevels(candles: Candle[]) {
  const slice = candles.slice(-30);
  const high = Math.max(...slice.map((c) => c.high));
  const low = Math.min(...slice.map((c) => c.low));
  return { support: low, resistance: high };
}

// 20-day high EXCLUDING the current bar — the true breakout reference.
function priorHigh(candles: Candle[], lookback = 20): number {
  if (candles.length < 2) return 0;
  const slice = candles.slice(-(lookback + 1), -1);
  if (!slice.length) return 0;
  return Math.max(...slice.map((c) => c.high));
}

export function computeIndicators(candles: Candle[]): Indicators {
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
    SimpleMASignal: false,
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
  const changePct = pClose ? ((cClose - pClose) / pClose) * 100 : 0;

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
    patterns: detectPatterns(candles),
  };
}