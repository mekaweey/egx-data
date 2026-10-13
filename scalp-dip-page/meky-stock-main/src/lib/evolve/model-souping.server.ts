/**
 * Model Souping — average weights across multiple fine-tuned checkpoints.
 * Greedy soup: only add a checkpoint if it improves validation score.
 */
export interface Checkpoint {
  weights: number[];
  valScore: number;
  name: string;
}

export function uniformSoup(checkpoints: Checkpoint[]): number[] {
  if (checkpoints.length === 0) return [];
  const dim = checkpoints[0].weights.length;
  const out = new Array(dim).fill(0);
  for (const c of checkpoints) for (let i = 0; i < dim; i++) out[i] += c.weights[i];
  return out.map((v) => v / checkpoints.length);
}

export function greedySoup(
  checkpoints: Checkpoint[],
  evaluate: (w: number[]) => number,
): { weights: number[]; included: string[]; score: number } {
  const sorted = [...checkpoints].sort((a, b) => b.valScore - a.valScore);
  let included: Checkpoint[] = [sorted[0]];
  let bestScore = evaluate(sorted[0].weights);
  for (let i = 1; i < sorted.length; i++) {
    const candidate = [...included, sorted[i]];
    const soup = uniformSoup(candidate);
    const s = evaluate(soup);
    if (s >= bestScore) {
      bestScore = s;
      included = candidate;
    }
  }
  return { weights: uniformSoup(included), included: included.map((c) => c.name), score: bestScore };
}