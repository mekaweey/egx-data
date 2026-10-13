import type { Candle } from "@/lib/market-data/types";

/**
 * Seasonality detector — analyses month-of-year returns from the symbol's
 * historical candles to see if the current month is historically bullish/bearish.
 */
export type Seasonality = {
  currentMonth: number;
  avgMonthReturn: number;     // historical avg return in this month (%)
  positiveRate: number;        // % of years this month was positive
  sampleYears: number;
  bias: "bullish" | "bearish" | "neutral";
  label_ar: string;
  confidenceDelta: number;
};

export function detectSeasonality(candles: Candle[] | undefined): Seasonality {
  const empty: Seasonality = {
    currentMonth: new Date().getMonth() + 1,
    avgMonthReturn: 0, positiveRate: 0, sampleYears: 0,
    bias: "neutral", label_ar: "", confidenceDelta: 0,
  };
  if (!candles || candles.length < 60) return empty;

  const currentMonth = new Date().getMonth() + 1;
  // Group candles by (year, month) → compute monthly returns
  const monthly = new Map<string, { first: number; last: number }>();
  for (const c of candles) {
    const d = new Date(c.date);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const ex = monthly.get(key);
    if (!ex) monthly.set(key, { first: c.close, last: c.close });
    else monthly.set(key, { first: ex.first, last: c.close });
  }
  const sameMonthReturns: number[] = [];
  for (const [key, { first, last }] of monthly) {
    const m = Number(key.split("-")[1]);
    if (m === currentMonth && first > 0) {
      sameMonthReturns.push(((last - first) / first) * 100);
    }
  }
  if (sameMonthReturns.length < 2) return empty;

  const avg = sameMonthReturns.reduce((a, b) => a + b, 0) / sameMonthReturns.length;
  const positiveRate = (sameMonthReturns.filter((r) => r > 0).length / sameMonthReturns.length) * 100;

  let bias: "bullish" | "bearish" | "neutral" = "neutral";
  let confidenceDelta = 0;
  let label_ar = "";
  if (avg > 1.5 && positiveRate >= 60) {
    bias = "bullish";
    confidenceDelta = Math.min(5, Math.round(avg));
    label_ar = `موسمية إيجابية: متوسط الشهر +${avg.toFixed(1)}% (${positiveRate.toFixed(0)}% احتمالية صعود)`;
  } else if (avg < -1.5 && positiveRate <= 40) {
    bias = "bearish";
    confidenceDelta = Math.max(-5, Math.round(avg));
    label_ar = `موسمية سلبية: متوسط الشهر ${avg.toFixed(1)}% (${(100 - positiveRate).toFixed(0)}% احتمالية هبوط)`;
  }
  return {
    currentMonth, avgMonthReturn: +avg.toFixed(2),
    positiveRate: +positiveRate.toFixed(1),
    sampleYears: sameMonthReturns.length,
    bias, label_ar, confidenceDelta,
  };
}