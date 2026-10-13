/**
 * Mixture of Experts (MoE): route inputs to specialized experts based on market regime.
 */

export type MarketRegime = "trending" | "ranging" | "volatile";

export interface Expert {
  regime: MarketRegime;
  predict: (features: number[]) => number;
  weight: number;
}

export interface GatingNetwork {
  weights: number[][]; // [regime][feature]
}

function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((x) => Math.exp(x - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/**
 * Gating network decides which expert to use based on input features.
 */
export function gate(gating: GatingNetwork, features: number[]): number[] {
  const logits = gating.weights.map((w) => w.reduce((s, wi, i) => s + wi * (features[i] ?? 0), 0));
  return softmax(logits);
}

/**
 * Combine expert predictions weighted by gating probabilities.
 */
export function moePredict(
  experts: Expert[],
  gating: GatingNetwork,
  features: number[],
): { prediction: number; regimeProbs: Record<MarketRegime, number>; dominantRegime: MarketRegime } {
  const probs = gate(gating, features);
  let prediction = 0;
  const regimeProbs: Record<MarketRegime, number> = { trending: 0, ranging: 0, volatile: 0 };

  for (let i = 0; i < experts.length; i++) {
    const expertPred = experts[i].predict(features);
    prediction += probs[i] * expertPred;
    regimeProbs[experts[i].regime] = probs[i];
  }

  const dominantIdx = probs.indexOf(Math.max(...probs));
  return {
    prediction,
    regimeProbs,
    dominantRegime: experts[dominantIdx]?.regime ?? "ranging",
  };
}

/**
 * Detect current market regime from price series.
 */
export function detectRegime(prices: number[]): MarketRegime {
  if (prices.length < 20) return "ranging";
  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const volatility = Math.sqrt(variance);

  const firstHalf = prices.slice(0, Math.floor(prices.length / 2));
  const secondHalf = prices.slice(Math.floor(prices.length / 2));
  const trend = (secondHalf[secondHalf.length - 1] - firstHalf[0]) / firstHalf[0];

  if (volatility > 0.03) return "volatile";
  if (Math.abs(trend) > 0.05) return "trending";
  return "ranging";
}