import type { Indicators } from "@/lib/analysis/indicators.server";
import type { Candle } from "@/lib/market-data/types";

/**
 * Multi-Horizon Projection — 3-day / 10-day / 30-day expected returns
 * derived from historical volatility + trend bias.
 *
 * Uses simple geometric-Brownian-motion expectation:
 *   E[r_h] = drift × h
 *   σ_h = σ × √h
 * Drift is biased by current trend (MACD hist + RSI distance from 50).
 */

export type HorizonForecast = {
  horizonDays: number;
  expectedReturnPct: number;
  sigmaPct: number;
  probUpside: number; // 0..100
  confidence: number; // 0..100, decays with horizon
  label_ar: string;
};

function dailyVolatility(candles: Candle[]): number {
  if (candles.length < 20) return 0.02;
  const rets: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / Math.max(0.001, candles[i - 1].close);
    if (isFinite(r)) rets.push(r);
  }
  const m = rets.reduce((a, b) => a + b, 0) / Math.max(1, rets.length);
  const v = rets.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, rets.length - 1);
  return Math.sqrt(v);
}

function trendDrift(ind: Indicators): number {
  let drift = 0;
  if (ind.macdHist != null) drift += Math.tanh(ind.macdHist / Math.max(0.01, ind.close * 0.005)) * 0.002;
  if (ind.rsi14 != null) drift += ((ind.rsi14 - 50) / 50) * 0.001;
  return Math.max(-0.005, Math.min(0.005, drift));
}

function normCdf(z: number): number {
  // Abramowitz & Stegun approximation
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.39894228 * Math.exp((-z * z) / 2);
  const p = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  return z >= 0 ? 1 - p : p;
}

export function multiHorizonForecast(ind: Indicators, candles: Candle[] | undefined): HorizonForecast[] {
  const sigma = dailyVolatility(candles ?? []);
  const drift = trendDrift(ind);
  const horizons = [3, 10, 30];
  return horizons.map((h) => {
    const er = drift * h;
    const sg = sigma * Math.sqrt(h);
    const z = sg === 0 ? 0 : er / sg;
    const prob = Math.round(normCdf(z) * 100);
    const conf = Math.round(Math.max(40, 95 - h * 1.5));
    const label =
      h === 3 ? "قصير المدى (3 أيام)" : h === 10 ? "متوسط (10 أيام)" : "ممتد (30 يوم)";
    return {
      horizonDays: h,
      expectedReturnPct: +(er * 100).toFixed(2),
      sigmaPct: +(sg * 100).toFixed(2),
      probUpside: prob,
      confidence: conf,
      label_ar: label,
    };
  });
}