/**
 * Tier-N Intelligence — Smarter Learning Layer
 * --------------------------------------------------------------------------
 * Three self-contained boosters that make the engine learn from itself and
 * adapt to market context — without any new external data sources.
 *
 *   N.1 Outcome-Weighted Pattern Memory
 *       Tracks win/loss per pattern name in memory. Patterns that consistently
 *       win get boosted; patterns that consistently lose get penalised (or
 *       silently disabled). Call `recordPatternOutcomeN` from outcome-loop.
 *
 *   N.2 Regime-Aware Confidence
 *       Same bullish signal in a falling market is worth less than in a
 *       rising market. Uses the index trend % already on AutoCtx.
 *
 *   N.3 Anomaly Outlier Filter
 *       Detects volume spikes (z-score) and price gaps. Anomalous candles
 *       trigger a confidence penalty so we don't chase pump/dump moves.
 */

import type { Candle } from "@/lib/market-data/types";

// ── N.1 Outcome-Weighted Pattern Memory ────────────────────────────────

type PatternStat = { wins: number; losses: number; updatedAt: number };
const patternStats = new Map<string, PatternStat>();

/** Per-symbol pending patterns recorded at decision-time, consumed on outcome. */
const pendingPatterns = new Map<string, string[]>();

export function notePendingPatterns(symbol: string, patterns: string[] | undefined): void {
  if (!patterns || patterns.length === 0) return;
  pendingPatterns.set(symbol.toUpperCase(), patterns);
}

export function consumePendingPatterns(symbol: string): string[] {
  const k = symbol.toUpperCase();
  const p = pendingPatterns.get(k) ?? [];
  pendingPatterns.delete(k);
  return p;
}

/** Call once a recommendation closes. `won` = realised_pct > 0. */
export function recordPatternOutcomeN(patterns: string[] | undefined, won: boolean): void {
  if (!patterns || patterns.length === 0) return;
  const now = Date.now();
  for (const p of patterns) {
    const k = String(p);
    const cur = patternStats.get(k) ?? { wins: 0, losses: 0, updatedAt: now };
    if (won) cur.wins += 1;
    else cur.losses += 1;
    cur.updatedAt = now;
    patternStats.set(k, cur);
  }
}

/**
 * Returns a multiplier in [0.6, 1.3] based on the historical win rate
 * of the patterns currently triggered on this candidate.
 * Patterns with <5 samples are ignored (not enough signal yet).
 */
export function patternOutcomeMultiplier(patterns: string[] | undefined): number {
  if (!patterns || patterns.length === 0) return 1;
  let weightedWinRate = 0;
  let weight = 0;
  for (const p of patterns) {
    const stat = patternStats.get(String(p));
    if (!stat) continue;
    const total = stat.wins + stat.losses;
    if (total < 5) continue;
    const wr = stat.wins / total;
    weightedWinRate += wr * total;
    weight += total;
  }
  if (weight === 0) return 1;
  const avgWR = weightedWinRate / weight;
  // Map win-rate to multiplier: 0.30 → 0.60, 0.50 → 1.00, 0.80 → 1.30
  const mult = 1 + (avgWR - 0.5) * 1.2;
  return Math.max(0.6, Math.min(1.3, mult));
}

// ── N.2 Regime-Aware Confidence ────────────────────────────────────────

/**
 * Adjusts confidence based on whether the candidate's direction aligns
 * with the broader market regime (derived from indexTrendPct).
 *   bull (>+1%)   + bullish → ×1.15   + bearish → ×0.80
 *   bear (<-1%)   + bullish → ×0.75   + bearish → ×1.15
 *   sideways      → ×0.95
 */
export function regimeAwareMultiplier(
  signal: string | undefined,
  indexTrendPct: number | undefined,
): number {
  if (indexTrendPct == null || Number.isNaN(indexTrendPct)) return 1;
  const dir = signal === "buy" || signal === "strong_buy"
    ? 1
    : signal === "sell" || signal === "strong_sell"
    ? -1
    : 0;
  if (dir === 0) return 1;
  if (indexTrendPct > 1) return dir > 0 ? 1.15 : 0.80;
  if (indexTrendPct < -1) return dir > 0 ? 0.75 : 1.15;
  return 0.95;
}

// ── N.3 Anomaly Outlier Filter ─────────────────────────────────────────

export type AnomalyReport = {
  isAnomaly: boolean;
  reason?: string;
  multiplier: number; // applied to confidence
};

/**
 * Flags candles with abnormal volume (z-score > 4) or large gaps (>8%).
 * Returns a multiplier in [0.55, 1.00] — anomalies are penalised because
 * they often precede mean-reversion or are driven by one-off news shocks.
 */
export function anomalyOutlierFilter(candles: Candle[] | undefined): AnomalyReport {
  if (!candles || candles.length < 20) {
    return { isAnomaly: false, multiplier: 1 };
  }
  const recent = candles.slice(-21);
  const history = recent.slice(0, -1);
  const last = recent[recent.length - 1];
  const prev = recent[recent.length - 2];

  // Volume z-score
  const vols = history.map((c) => c.volume);
  const meanV = vols.reduce((s, v) => s + v, 0) / vols.length;
  const varV = vols.reduce((s, v) => s + (v - meanV) ** 2, 0) / vols.length;
  const stdV = Math.sqrt(varV) || 1;
  const zVol = (last.volume - meanV) / stdV;

  // Price gap %
  const gapPct = prev.close > 0 ? ((last.open - prev.close) / prev.close) * 100 : 0;

  if (zVol > 5 || Math.abs(gapPct) > 10) {
    return {
      isAnomaly: true,
      reason: zVol > 5 ? `volume_spike_z=${zVol.toFixed(1)}` : `gap_${gapPct.toFixed(1)}pct`,
      multiplier: 0.55,
    };
  }
  if (zVol > 4 || Math.abs(gapPct) > 8) {
    return {
      isAnomaly: true,
      reason: zVol > 4 ? `volume_elevated_z=${zVol.toFixed(1)}` : `gap_${gapPct.toFixed(1)}pct`,
      multiplier: 0.75,
    };
  }
  return { isAnomaly: false, multiplier: 1 };
}