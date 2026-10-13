/**
 * Adversarial robustness check.
 * --------------------------------------------------------------------------
 * Perturbs every module signal with bounded noise N times and measures
 * whether the aggregate confidence stays on the same side. Fragile signals
 * (small noise flips the decision) get penalised.
 */
import type { ModuleSignal, IntegratorWeights } from "./pipeline-integrator.server";
import { integrateSignals } from "./pipeline-integrator.server";

export interface RobustnessResult {
  /** Fraction of perturbations that kept the same direction vs base. */
  stability: number;
  /** Confidence multiplier in [0.7, 1.05]. */
  multiplier: number;
}

export function robustness(
  baseConfidence: number,
  signals: ModuleSignal[],
  weights: IntegratorWeights = {},
  noiseStd = 0.1,
  trials = 12,
): RobustnessResult {
  const base = integrateSignals(baseConfidence, signals, weights, 0.30).adjustedConfidence;
  const baseSide = base > baseConfidence ? 1 : base < baseConfidence ? -1 : 0;
  let agree = 0;
  for (let t = 0; t < trials; t++) {
    const noisy = signals.map((s) => ({
      ...s,
      value: Math.max(-1, Math.min(1, s.value + (Math.random() * 2 - 1) * noiseStd)),
    }));
    const r = integrateSignals(baseConfidence, noisy, weights, 0.30).adjustedConfidence;
    const side = r > baseConfidence ? 1 : r < baseConfidence ? -1 : 0;
    if (side === baseSide) agree++;
  }
  const stability = agree / trials;
  const multiplier = 0.7 + 0.35 * stability;
  return { stability, multiplier };
}