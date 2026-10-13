/**
 * Continual Learning via Elastic Weight Consolidation (EWC).
 * Prevents catastrophic forgetting when learning from new data.
 */

export interface EWCState {
  weights: number[];
  fisher: number[]; // Fisher information matrix diagonal
  oldWeights: number[];
}

export function initEWC(dim: number): EWCState {
  return {
    weights: new Array(dim).fill(0),
    fisher: new Array(dim).fill(0),
    oldWeights: new Array(dim).fill(0),
  };
}

/**
 * Compute Fisher information from a batch of gradients.
 */
export function computeFisher(gradients: number[][]): number[] {
  if (gradients.length === 0) return [];
  const dim = gradients[0].length;
  const fisher = new Array(dim).fill(0);
  for (const grad of gradients) {
    for (let i = 0; i < dim; i++) fisher[i] += grad[i] * grad[i];
  }
  for (let i = 0; i < dim; i++) fisher[i] /= gradients.length;
  return fisher;
}

/**
 * EWC loss penalty: lambda/2 * sum(F_i * (w_i - w_old_i)^2)
 */
export function ewcPenalty(state: EWCState, lambda: number = 1000): number {
  let penalty = 0;
  for (let i = 0; i < state.weights.length; i++) {
    const diff = state.weights[i] - state.oldWeights[i];
    penalty += state.fisher[i] * diff * diff;
  }
  return (lambda / 2) * penalty;
}

/**
 * Consolidate after task: save current weights as "old" and update Fisher.
 */
export function consolidate(state: EWCState, newFisher: number[]): EWCState {
  return {
    weights: [...state.weights],
    oldWeights: [...state.weights],
    fisher: state.fisher.map((f, i) => f + (newFisher[i] ?? 0)),
  };
}