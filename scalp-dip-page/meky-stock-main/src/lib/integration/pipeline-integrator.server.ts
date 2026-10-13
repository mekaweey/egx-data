/**
 * Pipeline Integrator
 * Combines outputs from many standalone modules into a single adjusted
 * confidence score using learnable weights. Designed to be called from
 * run-scan.server.ts at the end of the scoring pipeline.
 */
export interface ModuleSignal {
  name: string;
  /** Signal in [-1, 1] where >0 = bullish, <0 = bearish. */
  value: number;
  /** Optional self-reported confidence in [0, 1]. */
  confidence?: number;
}

export interface IntegratorWeights {
  [moduleName: string]: number;
}

export interface IntegratedResult {
  adjustedConfidence: number;
  contributions: Array<{ name: string; weight: number; contribution: number }>;
  totalWeight: number;
}

export function integrateSignals(
  baseConfidence: number,
  signals: ModuleSignal[],
  weights: IntegratorWeights = {},
  blendAlpha: number = 0.35,
): IntegratedResult {
  if (signals.length === 0) {
    return { adjustedConfidence: baseConfidence, contributions: [], totalWeight: 0 };
  }
  const contributions: IntegratedResult["contributions"] = [];
  let weightedSum = 0;
  let totalWeight = 0;
  for (const s of signals) {
    const w = Math.max(0, weights[s.name] ?? 1) * (s.confidence ?? 1);
    const contrib = w * Math.max(-1, Math.min(1, s.value));
    contributions.push({ name: s.name, weight: w, contribution: contrib });
    weightedSum += contrib;
    totalWeight += w;
  }
  const meanSignal = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const delta = blendAlpha * meanSignal * 50;
  const adjusted = Math.max(0, Math.min(100, baseConfidence + delta));
  return { adjustedConfidence: adjusted, contributions, totalWeight };
}

/** Update weights using a simple gradient step on past prediction outcomes. */
export function updateWeights(
  weights: IntegratorWeights,
  signals: ModuleSignal[],
  outcome: number, // +1 win, -1 loss
  lr: number = 0.05,
): IntegratorWeights {
  const next: IntegratorWeights = { ...weights };
  for (const s of signals) {
    const w = next[s.name] ?? 1;
    const grad = -outcome * s.value;
    next[s.name] = Math.max(0, w - lr * grad);
  }
  return next;
}