/**
 * Stochastic Weight Averaging (SWA).
 */
export interface SWAState {
  averagedWeights: number[];
  count: number;
}

export function createSWA(dim: number): SWAState {
  return { averagedWeights: new Array(dim).fill(0), count: 0 };
}

export function update(state: SWAState, newWeights: number[]): SWAState {
  const count = state.count + 1;
  const averagedWeights = state.averagedWeights.map(
    (w, i) => (w * state.count + newWeights[i]) / count,
  );
  return { averagedWeights, count };
}

export function reset(dim: number): SWAState {
  return createSWA(dim);
}