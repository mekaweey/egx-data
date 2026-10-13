/**
 * Regime detector + regime-specific weight overlays.
 * --------------------------------------------------------------------------
 * Same signal means different things in different markets. We tag each scan
 * with a regime and apply per-regime weight tweaks on top of the base
 * orchestrator weights.
 */
import type { Candle } from "@/lib/market-data/types";

export type Regime = "trending_up" | "trending_down" | "mean_reverting" | "high_vol" | "calm";

export function detectRegime(candles: Candle[]): Regime {
  if (candles.length < 30) return "calm";
  const closes = candles.slice(-30).map((c) => c.close);
  const rets: number[] = [];
  for (let i = 1; i < closes.length; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = rets.reduce((s, x) => s + x, 0) / rets.length;
  const variance = rets.reduce((s, x) => s + (x - mean) ** 2, 0) / rets.length;
  const vol = Math.sqrt(variance);
  // Trend strength = |sum| / sum|.|  (range [0,1])
  const trendStrength = Math.abs(rets.reduce((s, x) => s + x, 0)) /
    Math.max(1e-9, rets.reduce((s, x) => s + Math.abs(x), 0));

  if (vol > 0.04) return "high_vol";
  if (trendStrength > 0.35 && mean > 0) return "trending_up";
  if (trendStrength > 0.35 && mean < 0) return "trending_down";
  if (trendStrength < 0.15) return "mean_reverting";
  return "calm";
}

/** Multiplicative weight overlays per regime. Missing modules use 1.0. */
const REGIME_WEIGHTS: Record<Regime, Record<string, number>> = {
  trending_up: { mamba_ssm: 1.4, auto_features: 1.3, gbm_mc: 1.2, ood_detector: 0.7, hawkes_events: 0.7 },
  trending_down: { vpin: 1.5, garch_vol: 1.4, hawkes_events: 1.3, mamba_ssm: 0.8 },
  mean_reverting: { mixture_density: 1.3, agent_market: 1.3, bootstrap_robustness: 1.2, mamba_ssm: 0.7 },
  high_vol: { vpin: 1.5, garch_vol: 1.5, jump_diffusion: 1.4, ood_detector: 1.3, gbm_mc: 0.6 },
  calm: {},
};

export function regimeWeights(r: Regime): Record<string, number> {
  return REGIME_WEIGHTS[r] ?? {};
}

/** Combine two weight maps (multiplicative). */
export function mergeWeights(a: Record<string, number>, b: Record<string, number>): Record<string, number> {
  const out: Record<string, number> = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = (out[k] ?? 1) * v;
  return out;
}