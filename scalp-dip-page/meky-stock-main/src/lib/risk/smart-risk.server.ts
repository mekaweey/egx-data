/**
 * Smart Risk Management
 * ---------------------
 * 1. Kelly Criterion position sizing — uses historical win-rate + avg win/loss
 *    to compute the mathematically optimal fraction of capital to risk.
 * 2. Correlation matrix — penalises position sizes when picks are highly
 *    correlated (same sector / co-moving prices) so the portfolio is not
 *    accidentally over-concentrated.
 *
 * Both helpers are pure functions that adjust a base position size; the
 * scanner remains in control of the final write to `recommendations`.
 */

import type { Candle } from "@/lib/market-data/types";

export type KellyInput = {
  winRate: number;       // 0..1 (e.g. 0.55)
  avgWinPct: number;     // average win as % (e.g. 4.2)
  avgLossPct: number;    // average loss as % (positive number, e.g. 2.1)
};

/**
 * Fractional Kelly. Returns the suggested fraction of equity (0..1) to risk.
 * We use HALF-Kelly to avoid the heavy drawdowns of full Kelly.
 */
export function kellyFraction(input: KellyInput): number {
  const { winRate, avgWinPct, avgLossPct } = input;
  if (winRate <= 0 || winRate >= 1) return 0;
  if (avgLossPct <= 0 || avgWinPct <= 0) return 0;
  const b = avgWinPct / avgLossPct;          // win/loss ratio
  const p = winRate;
  const q = 1 - p;
  const full = (b * p - q) / b;              // classic Kelly
  if (full <= 0) return 0;                   // no edge → don't bet
  return Math.min(0.05, full * 0.5);         // half-Kelly, capped at 5% of equity
}

/**
 * Adjusts a confidence-scaled base position size with a Kelly multiplier.
 * Returns a multiplier in [0.3, 1.5].
 */
export function kellyMultiplier(history: KellyInput | null): number {
  if (!history || history.winRate <= 0 || history.avgWinPct <= 0) return 1;
  const k = kellyFraction(history);
  if (k <= 0) return 0.3;                    // negative edge → shrink heavily
  // Map kelly fraction (0..5%) → multiplier (0.5..1.5)
  const m = 0.5 + (k / 0.05);
  return +Math.max(0.3, Math.min(1.5, m)).toFixed(2);
}

// -------------------- Correlation --------------------

/** Pearson correlation of two equal-length return series. */
function correlation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const ax = a.slice(-n), bx = b.slice(-n);
  const mA = ax.reduce((s, x) => s + x, 0) / n;
  const mB = bx.reduce((s, x) => s + x, 0) / n;
  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < n; i++) {
    const da = ax[i] - mA;
    const db = bx[i] - mB;
    num += da * db;
    dA += da * da;
    dB += db * db;
  }
  const den = Math.sqrt(dA * dB);
  return den > 0 ? num / den : 0;
}

function dailyReturns(candles: Candle[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < candles.length; i++) {
    const prev = candles[i - 1].close;
    if (prev > 0) out.push((candles[i].close - prev) / prev);
  }
  return out;
}

/**
 * For a single pick, compute the max correlation against the already-accepted
 * picks. Returns a position-size multiplier that shrinks when correlation
 * is high.
 *   ρ ≤ 0.4  → no penalty (1.0)
 *   ρ = 0.7  → 0.7×
 *   ρ ≥ 0.9  → 0.4×
 */
export function correlationMultiplier(args: {
  candidate: Candle[] | undefined;
  accepted: Array<{ symbol: string; candles: Candle[] | undefined }>;
}): { multiplier: number; maxCorr: number; conflictWith: string | null } {
  if (!args.candidate || args.candidate.length < 20 || args.accepted.length === 0) {
    return { multiplier: 1, maxCorr: 0, conflictWith: null };
  }
  const candR = dailyReturns(args.candidate.slice(-40));
  let maxCorr = 0;
  let conflictWith: string | null = null;
  for (const a of args.accepted) {
    if (!a.candles || a.candles.length < 20) continue;
    const accR = dailyReturns(a.candles.slice(-40));
    const c = Math.abs(correlation(candR, accR));
    if (c > maxCorr) {
      maxCorr = c;
      conflictWith = a.symbol;
    }
  }
  let mult = 1;
  if (maxCorr >= 0.9) mult = 0.4;
  else if (maxCorr >= 0.7) mult = 0.7;
  else if (maxCorr >= 0.5) mult = 0.85;
  return { multiplier: mult, maxCorr: +maxCorr.toFixed(2), conflictWith };
}

/**
 * Combine Kelly + correlation into a single multiplier. Both are bounded so
 * the final result stays in [0.2, 1.5].
 */
export function combinedRiskMultiplier(args: {
  kelly: number;          // from kellyMultiplier()
  correlation: number;    // from correlationMultiplier()
}): number {
  const m = args.kelly * args.correlation;
  return +Math.max(0.2, Math.min(1.5, m)).toFixed(2);
}