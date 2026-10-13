/**
 * Lightweight State Space Model (Mamba-style, simplified).
 */
export interface SSMState {
  hidden: number[];
  A: number[];
  B: number[];
  C: number[];
}

export function createSSM(dim: number): SSMState {
  return {
    hidden: new Array(dim).fill(0),
    A: new Array(dim).fill(0).map(() => 0.9 + Math.random() * 0.09),
    B: new Array(dim).fill(0).map(() => Math.random() * 0.1),
    C: new Array(dim).fill(0).map(() => Math.random() * 0.1),
  };
}

export function step(state: SSMState, x: number): { state: SSMState; y: number } {
  const newHidden = state.hidden.map((h, i) => state.A[i] * h + state.B[i] * x);
  const y = newHidden.reduce((s, h, i) => s + state.C[i] * h, 0);
  return { state: { ...state, hidden: newHidden }, y };
}

export function forecast(state: SSMState, series: number[]): number[] {
  let cur = state;
  const out: number[] = [];
  for (const x of series) {
    const r = step(cur, x);
    cur = r.state;
    out.push(r.y);
  }
  return out;
}