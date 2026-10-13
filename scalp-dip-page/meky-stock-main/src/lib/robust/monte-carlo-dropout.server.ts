/**
 * Monte Carlo Dropout: uncertainty quantification via stochastic forward passes.
 */

export interface MCDropoutResult {
  meanPrediction: number;
  epistemic: number; // model uncertainty
  confidenceInterval: { lower: number; upper: number };
  samples: number[];
}

/**
 * Apply dropout mask to features (set fraction to 0).
 */
function dropoutMask(features: number[], rate: number): number[] {
  return features.map((f) => (Math.random() < rate ? 0 : f / (1 - rate)));
}

/**
 * Run multiple stochastic forward passes and aggregate.
 */
export function mcDropoutInference(
  features: number[],
  predict: (x: number[]) => number,
  opts: { samples?: number; dropoutRate?: number; confidence?: number } = {},
): MCDropoutResult {
  const numSamples = opts.samples ?? 50;
  const dropoutRate = opts.dropoutRate ?? 0.2;
  const conf = opts.confidence ?? 0.95;

  const preds: number[] = [];
  for (let i = 0; i < numSamples; i++) {
    preds.push(predict(dropoutMask(features, dropoutRate)));
  }

  const mean = preds.reduce((a, b) => a + b, 0) / numSamples;
  const variance = preds.reduce((s, p) => s + (p - mean) ** 2, 0) / numSamples;
  const sorted = [...preds].sort((a, b) => a - b);
  const lowerIdx = Math.floor(((1 - conf) / 2) * numSamples);
  const upperIdx = Math.floor((1 - (1 - conf) / 2) * numSamples);

  return {
    meanPrediction: mean,
    epistemic: Math.sqrt(variance),
    confidenceInterval: { lower: sorted[lowerIdx], upper: sorted[upperIdx] },
    samples: preds,
  };
}