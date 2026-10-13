/**
 * Active Learning: select the most informative unlabeled examples to label next.
 * Strategies: uncertainty sampling, margin sampling, entropy, diversity.
 */

export interface UnlabeledExample {
  id: string;
  features: number[];
  predictedProbs: number[]; // class probabilities from current model
}

export interface ActiveSample {
  id: string;
  score: number;
  reason: string;
}

function entropy(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-10) h -= p * Math.log(p);
  }
  return h;
}

/**
 * Uncertainty sampling: pick examples where the model is least confident.
 */
export function uncertaintySampling(examples: UnlabeledExample[], k: number = 10): ActiveSample[] {
  return examples
    .map((ex) => ({ id: ex.id, score: 1 - Math.max(...ex.predictedProbs), reason: "least_confident" }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Margin sampling: smallest gap between top-2 predictions.
 */
export function marginSampling(examples: UnlabeledExample[], k: number = 10): ActiveSample[] {
  return examples
    .map((ex) => {
      const sorted = [...ex.predictedProbs].sort((a, b) => b - a);
      const margin = (sorted[0] ?? 0) - (sorted[1] ?? 0);
      return { id: ex.id, score: 1 - margin, reason: "smallest_margin" };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Entropy-based sampling: highest entropy = most uncertain across all classes.
 */
export function entropySampling(examples: UnlabeledExample[], k: number = 10): ActiveSample[] {
  return examples
    .map((ex) => ({ id: ex.id, score: entropy(ex.predictedProbs), reason: "max_entropy" }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/**
 * Diversity-aware: pick uncertain examples that are also far from each other in feature space.
 */
export function diversityAwareSampling(examples: UnlabeledExample[], k: number = 10): ActiveSample[] {
  const candidates = entropySampling(examples, k * 3);
  const selected: ActiveSample[] = [];
  const selectedFeatures: number[][] = [];

  for (const cand of candidates) {
    if (selected.length >= k) break;
    const features = examples.find((e) => e.id === cand.id)?.features ?? [];
    let minDist = Infinity;
    for (const sf of selectedFeatures) {
      const dist = Math.sqrt(features.reduce((s, f, i) => s + (f - (sf[i] ?? 0)) ** 2, 0));
      minDist = Math.min(minDist, dist);
    }
    if (selected.length === 0 || minDist > 0.1) {
      selected.push({ ...cand, score: cand.score * (1 + Math.min(minDist, 1)), reason: "diverse_uncertain" });
      selectedFeatures.push(features);
    }
  }

  return selected;
}