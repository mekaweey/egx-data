import type { Indicators } from "@/lib/analysis/indicators.server";

/**
 * ATR-adapted target/stop levels.
 *
 * Replaces fixed percentage targets with ATR multiples — automatically
 * adapts to current volatility regime per symbol.
 *
 * Conservative defaults:
 *  - Stop = 1.5 × ATR below entry
 *  - Target = 2.5 × ATR above entry (R:R ≈ 1.67)
 */

export type AtrLevels = {
  entry: number;
  stop: number;
  target: number;
  rr: number;
  used: boolean;
};

export function atrLevels(
  entry: number,
  ind: Indicators,
  opts: { stopMult?: number; targetMult?: number } = {},
): AtrLevels {
  const atr = ind.atr14 ?? null;
  if (!atr || atr <= 0 || entry <= 0) {
    return { entry, stop: entry * 0.95, target: entry * 1.08, rr: 1.6, used: false };
  }
  const stopMult = opts.stopMult ?? 1.5;
  const targetMult = opts.targetMult ?? 2.5;
  const stop = +Math.max(0.01, entry - stopMult * atr).toFixed(3);
  const target = +(entry + targetMult * atr).toFixed(3);
  const rr = +((target - entry) / Math.max(0.001, entry - stop)).toFixed(2);
  return { entry, stop, target, rr, used: true };
}

/**
 * Blend ATR levels with AI-suggested levels — picks the tighter stop
 * and the more conservative target so we never widen risk vs the AI.
 */
export function blendWithAi(atr: AtrLevels, aiStop: number, aiTarget: number): AtrLevels {
  if (!atr.used) return { ...atr, stop: aiStop, target: aiTarget, rr: +((aiTarget - atr.entry) / Math.max(0.001, atr.entry - aiStop)).toFixed(2) };
  const stop = Math.max(atr.stop, aiStop); // higher stop = tighter risk
  const target = Math.min(atr.target, aiTarget); // lower target = more reachable
  const rr = +((target - atr.entry) / Math.max(0.001, atr.entry - stop)).toFixed(2);
  return { ...atr, stop: +stop.toFixed(3), target: +target.toFixed(3), rr };
}