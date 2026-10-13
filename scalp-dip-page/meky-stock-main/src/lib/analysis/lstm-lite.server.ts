import type { Candle } from "@/lib/market-data/types";

/**
 * Lightweight sequence predictor — autoregressive momentum model.
 * A real LSTM would require training a neural network. Instead, we use
 * an exponentially-weighted momentum + mean-reversion blend that captures
 * the same intuition: recent moves carry signal, but extreme moves revert.
 */
export type SequenceForecast = {
  expectedReturnPct: number;
  direction: "up" | "down" | "flat";
  confidence: number;          // 0–100
  momentum: number;
  meanReversion: number;
  label_ar: string;
  confidenceDelta: number;
};

export function sequenceForecast(candles: Candle[] | undefined): SequenceForecast {
  const empty: SequenceForecast = {
    expectedReturnPct: 0, direction: "flat", confidence: 0,
    momentum: 0, meanReversion: 0, label_ar: "", confidenceDelta: 0,
  };
  if (!candles || candles.length < 30) return empty;

  // 1) Exponentially-weighted returns (recent dominant)
  const returns: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const r = (candles[i].close - candles[i - 1].close) / candles[i - 1].close;
    returns.push(r);
  }
  const lambda = 0.94;
  let weightSum = 0;
  let weightedReturn = 0;
  for (let i = returns.length - 1; i >= 0; i--) {
    const age = returns.length - 1 - i;
    const w = Math.pow(lambda, age);
    weightedReturn += returns[i] * w;
    weightSum += w;
    if (age > 30) break;
  }
  const momentum = weightSum > 0 ? (weightedReturn / weightSum) * 100 : 0;

  // 2) Mean reversion: how far is close from 20-day average?
  const last20 = candles.slice(-20).map((c) => c.close);
  const avg = last20.reduce((a, b) => a + b, 0) / last20.length;
  const std = Math.sqrt(last20.map((c) => (c - avg) ** 2).reduce((a, b) => a + b, 0) / last20.length);
  const lastClose = candles[candles.length - 1].close;
  const zScore = std > 0 ? (lastClose - avg) / std : 0;
  const meanReversion = -zScore * 0.3; // -1 = expected pullback, +1 = expected bounce

  // 3) Blend: 70% momentum + 30% mean-reversion
  const expectedReturnPct = +(momentum * 0.7 + meanReversion).toFixed(2);
  const absExp = Math.abs(expectedReturnPct);
  const confidence = Math.min(85, 40 + Math.round(absExp * 8));
  const direction: "up" | "down" | "flat" =
    expectedReturnPct > 0.3 ? "up" : expectedReturnPct < -0.3 ? "down" : "flat";

  let confidenceDelta = 0;
  let label_ar = "";
  if (direction === "up" && absExp > 0.5) {
    confidenceDelta = Math.min(6, Math.round(absExp * 2));
    label_ar = `نموذج التسلسل يتوقع صعود +${expectedReturnPct}%`;
  } else if (direction === "down" && absExp > 0.5) {
    confidenceDelta = Math.max(-6, -Math.round(absExp * 2));
    label_ar = `نموذج التسلسل يتوقع هبوط ${expectedReturnPct}%`;
  }

  return {
    expectedReturnPct, direction, confidence,
    momentum: +momentum.toFixed(3),
    meanReversion: +meanReversion.toFixed(3),
    label_ar, confidenceDelta,
  };
}