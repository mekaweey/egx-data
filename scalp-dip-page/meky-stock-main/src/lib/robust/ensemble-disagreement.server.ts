/**
 * Ensemble Disagreement: weak signals when models disagree, strong when they agree.
 */

export interface DisagreementMetric {
  meanPrediction: number;
  disagreement: number;
  signalStrength: number; // 0-1
  voteEntropy: number;
  recommendation: "strong" | "moderate" | "weak" | "no_signal";
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-10) h -= p * Math.log(p);
  }
  return h;
}

export function measureDisagreement(predictions: number[]): DisagreementMetric {
  if (predictions.length === 0) {
    return { meanPrediction: 0, disagreement: 0, signalStrength: 0, voteEntropy: 0, recommendation: "no_signal" };
  }

  const mean = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const variance = predictions.reduce((s, p) => s + (p - mean) ** 2, 0) / predictions.length;
  const disagreement = Math.sqrt(variance);

  // Vote entropy: how many models say "buy" (>0.5) vs "sell" (<0.5)
  const buys = predictions.filter((p) => p > 0.5).length;
  const sells = predictions.length - buys;
  const voteProbs = [buys / predictions.length, sells / predictions.length];
  const voteEntropy = entropy(voteProbs);

  // Signal strength: high agreement (low disagreement) + extreme mean = strong
  const extremity = Math.abs(mean - 0.5) * 2;
  const agreement = Math.max(0, 1 - disagreement * 4);
  const signalStrength = extremity * agreement;

  let recommendation: DisagreementMetric["recommendation"] = "no_signal";
  if (signalStrength > 0.7) recommendation = "strong";
  else if (signalStrength > 0.4) recommendation = "moderate";
  else if (signalStrength > 0.2) recommendation = "weak";

  return { meanPrediction: mean, disagreement, signalStrength, voteEntropy, recommendation };
}