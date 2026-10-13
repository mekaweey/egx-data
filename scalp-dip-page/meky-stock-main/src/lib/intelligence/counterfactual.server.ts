/**
 * Counterfactual Explanations: "what if X were different, would the decision change?"
 */

export interface Counterfactual {
  feature: string;
  originalValue: number;
  flippedValue: number;
  newPrediction: number;
  decisionChanged: boolean;
  importance: number; // how much it matters
}

/**
 * For each feature, find the minimum perturbation that flips the decision.
 */
export function findCounterfactuals(
  features: Record<string, number>,
  predict: (f: Record<string, number>) => number,
  threshold: number = 0.5,
  searchRange: number = 2, // multiples of value
): Counterfactual[] {
  const original = predict(features);
  const originalDecision = original > threshold;
  const results: Counterfactual[] = [];

  for (const key of Object.keys(features)) {
    const orig = features[key];
    let bestFlipped = orig;
    let bestPred = original;
    let flipped = false;

    // Binary search for smallest perturbation
    for (let delta = 0.05; delta <= searchRange; delta += 0.1) {
      for (const sign of [-1, 1]) {
        const newVal = orig * (1 + sign * delta);
        const newFeatures = { ...features, [key]: newVal };
        const newPred = predict(newFeatures);
        const newDecision = newPred > threshold;
        if (newDecision !== originalDecision) {
          bestFlipped = newVal;
          bestPred = newPred;
          flipped = true;
          break;
        }
      }
      if (flipped) break;
    }

    results.push({
      feature: key,
      originalValue: orig,
      flippedValue: bestFlipped,
      newPrediction: bestPred,
      decisionChanged: flipped,
      importance: flipped ? 1 / Math.max(Math.abs(bestFlipped - orig) / Math.max(Math.abs(orig), 0.01), 0.01) : 0,
    });
  }

  return results.sort((a, b) => b.importance - a.importance);
}