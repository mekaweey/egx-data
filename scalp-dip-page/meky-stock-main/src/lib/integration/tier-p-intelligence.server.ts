/**
 * Tier-P Intelligence
 * --------------------------------------------------------------------------
 * Eight self-contained accuracy lifts that work on existing data:
 *   P.1 Liquidity / survivorship filter.
 *   P.2 Walk-forward decay penalty (model performance drift).
 *   P.3 BMA over strategy families (momentum / mean-rev / breakout).
 *   P.4 Split-conformal prediction intervals per regime.
 *   P.5 Cross-sectional ranking (z-score within today's universe).
 *   P.6 News recency-decay + source-quality weighting.
 *   P.7 Backtest-vs-production drift monitor (KL-divergence).
 *   P.8 Multi-objective Pareto frontier helper.
 */

import type { Candle } from "@/lib/market-data/types";

// ────────────────────────────────────────────────────────────────────────
// P.1 Liquidity / tradability filter
// ────────────────────────────────────────────────────────────────────────
const MIN_DAILY_VALUE_EGP = 500_000;

export function liquidityMultiplier(candles?: Candle[]): number {
  if (!candles || candles.length < 5) return 1;
  const recent = candles.slice(-5);
  const avgValue = recent.reduce((s, c) => s + c.close * c.volume, 0) / recent.length;
  if (avgValue < MIN_DAILY_VALUE_EGP) return 0.55;
  if (avgValue < MIN_DAILY_VALUE_EGP * 3) return 0.85;
  return 1;
}

/** Suspicious price stuck for N days = potential halt. */
export function suspensionPenalty(candles?: Candle[]): number {
  if (!candles || candles.length < 10) return 1;
  const last10 = candles.slice(-10);
  const uniqueCloses = new Set(last10.map((c) => c.close.toFixed(2))).size;
  return uniqueCloses <= 2 ? 0.70 : 1;
}

// ────────────────────────────────────────────────────────────────────────
// P.2 Walk-forward decay penalty
// ────────────────────────────────────────────────────────────────────────
interface DecayWindow { recent: number[]; older: number[]; }
const decayByModel = new Map<string, DecayWindow>();

export function recordModelOutcome(model: string, won: boolean) {
  const w = decayByModel.get(model) ?? { recent: [], older: [] };
  w.recent.push(won ? 1 : 0);
  if (w.recent.length > 30) w.older.push(w.recent.shift()!);
  if (w.older.length > 60) w.older.shift();
  decayByModel.set(model, w);
}

/** ×0.80 if recent win-rate dropped > 15% vs older window. */
export function decayMultiplier(model: string): number {
  const w = decayByModel.get(model);
  if (!w || w.recent.length < 20 || w.older.length < 20) return 1;
  const r = w.recent.reduce((s, x) => s + x, 0) / w.recent.length;
  const o = w.older.reduce((s, x) => s + x, 0) / w.older.length;
  const drop = o - r;
  if (drop > 0.15) return 0.80;
  if (drop > 0.08) return 0.92;
  if (drop < -0.10) return 1.08;
  return 1;
}

// ────────────────────────────────────────────────────────────────────────
// P.3 Strategy-level BMA (momentum / mean-rev / breakout)
// ────────────────────────────────────────────────────────────────────────
export type StrategyFamily = "momentum" | "mean_reversion" | "breakout" | "other";
const stratStats = new Map<StrategyFamily, { wins: number; total: number }>();

export function classifyStrategy(args: {
  rsi?: number | null; close?: number | null;
  sma50?: number | null; bbUpper?: number | null; bbLower?: number | null;
}): StrategyFamily {
  const { rsi, close, sma50, bbUpper, bbLower } = args;
  if (close && bbUpper && close > bbUpper * 0.99) return "breakout";
  if (rsi != null && rsi < 35 && close && bbLower && close < bbLower * 1.02) return "mean_reversion";
  if (close && sma50 && close > sma50 * 1.03) return "momentum";
  return "other";
}

export function recordStrategyOutcome(family: StrategyFamily, won: boolean) {
  const s = stratStats.get(family) ?? { wins: 0, total: 0 };
  s.total++; if (won) s.wins++;
  stratStats.set(family, s);
}

export function strategyBMAMultiplier(family: StrategyFamily): number {
  const s = stratStats.get(family);
  if (!s || s.total < 15) return 1;
  const wr = s.wins / s.total;
  return Math.max(0.75, Math.min(1.20, 0.5 + wr));
}

// ────────────────────────────────────────────────────────────────────────
// P.4 Split-conformal prediction intervals per regime
// ────────────────────────────────────────────────────────────────────────
const residualsByRegime = new Map<string, number[]>();

export function addConformalResidual(regime: string, residualPct: number) {
  const arr = residualsByRegime.get(regime) ?? [];
  arr.push(Math.abs(residualPct));
  if (arr.length > 200) arr.shift();
  residualsByRegime.set(regime, arr);
}

/** Returns ±halfWidth at given coverage (default 0.90). */
export function conformalHalfWidth(regime: string, coverage = 0.90): number | null {
  const arr = residualsByRegime.get(regime);
  if (!arr || arr.length < 30) return null;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(coverage * sorted.length));
  return sorted[idx];
}

// ────────────────────────────────────────────────────────────────────────
// P.5 Cross-sectional ranking
// ────────────────────────────────────────────────────────────────────────
const todayUniverse = { scores: [] as number[], ts: 0 };
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function recordUniverseScore(score: number) {
  if (Date.now() - todayUniverse.ts > ONE_DAY_MS) {
    todayUniverse.scores = [];
    todayUniverse.ts = Date.now();
  }
  todayUniverse.scores.push(score);
}

/** Returns z-score relative to today's universe (or 0 if too small). */
export function crossSectionalZ(score: number): number {
  const arr = todayUniverse.scores;
  if (arr.length < 5) return 0;
  const mean = arr.reduce((s, x) => s + x, 0) / arr.length;
  const variance = arr.reduce((s, x) => s + (x - mean) ** 2, 0) / arr.length;
  const sd = Math.sqrt(variance) || 1;
  return (score - mean) / sd;
}

/** ×1.10 for top-decile, ×0.92 for bottom-decile. */
export function crossSectionalMultiplier(score: number): number {
  const z = crossSectionalZ(score);
  if (z > 1.28) return 1.10;
  if (z > 0.5) return 1.04;
  if (z < -1.28) return 0.88;
  if (z < -0.5) return 0.96;
  return 1;
}

// ────────────────────────────────────────────────────────────────────────
// P.6 News recency-decay + source-quality weighting
// ────────────────────────────────────────────────────────────────────────
const SOURCE_QUALITY: Record<string, number> = {
  reuters: 1.0, bloomberg: 1.0, ft: 0.95, wsj: 0.95,
  cnbc: 0.85, "al-borsa": 0.85, mubasher: 0.80, investing: 0.75,
};

export function newsImpactWeight(args: {
  sourceName?: string | null;
  publishedAt?: string | Date | null;
  sentimentScore: number;
}): number {
  const src = (args.sourceName ?? "").toLowerCase();
  let quality = 0.6;
  for (const [k, v] of Object.entries(SOURCE_QUALITY)) {
    if (src.includes(k)) { quality = v; break; }
  }
  let recency = 1;
  if (args.publishedAt) {
    const t = new Date(args.publishedAt).getTime();
    const hours = (Date.now() - t) / (60 * 60 * 1000);
    recency = Math.exp(-hours / 48); // half-life ~33h
  }
  return args.sentimentScore * quality * recency;
}

// ────────────────────────────────────────────────────────────────────────
// P.7 Backtest-vs-production drift monitor (KL-divergence)
// ────────────────────────────────────────────────────────────────────────
function histogram(arr: number[], bins = 10, lo = 0, hi = 100): number[] {
  const h = new Array(bins).fill(0);
  for (const v of arr) {
    const idx = Math.max(0, Math.min(bins - 1, Math.floor(((v - lo) / (hi - lo)) * bins)));
    h[idx]++;
  }
  const total = arr.length || 1;
  return h.map((x) => Math.max(1e-6, x / total));
}

export function klDivergence(production: number[], backtest: number[]): number {
  if (production.length < 20 || backtest.length < 20) return 0;
  const p = histogram(production), q = histogram(backtest);
  let kl = 0;
  for (let i = 0; i < p.length; i++) kl += p[i] * Math.log(p[i] / q[i]);
  return kl;
}

/** ×0.92 if KL > 0.20 (significant distribution drift). */
export function driftConfidencePenalty(kl: number): number {
  if (kl > 0.40) return 0.85;
  if (kl > 0.20) return 0.92;
  return 1;
}

// ────────────────────────────────────────────────────────────────────────
// P.8 Pareto-frontier helper
// ────────────────────────────────────────────────────────────────────────
export interface ParetoPoint {
  id: string;
  expectedReturn: number;   // higher better
  drawdownRisk: number;     // lower better
  sharpe: number;           // higher better
  indexCorrelation: number; // lower abs better
}

export function paretoFrontier(points: ParetoPoint[]): ParetoPoint[] {
  return points.filter((p) =>
    !points.some((q) =>
      q !== p &&
      q.expectedReturn >= p.expectedReturn &&
      q.drawdownRisk <= p.drawdownRisk &&
      q.sharpe >= p.sharpe &&
      Math.abs(q.indexCorrelation) <= Math.abs(p.indexCorrelation) &&
      (
        q.expectedReturn > p.expectedReturn ||
        q.drawdownRisk < p.drawdownRisk ||
        q.sharpe > p.sharpe ||
        Math.abs(q.indexCorrelation) < Math.abs(p.indexCorrelation)
      )
    )
  );
}