/**
 * Reinforcement Learning loop — Q-table style bandit on entry/exit actions.
 * --------------------------------------------------------------------------
 * State = (regime, confidence-bucket). Actions = ["skip", "enter_small",
 * "enter_full", "scale_out_50"]. Reward = realised return * action multiplier.
 * Pure server module; persistence is in-memory (reset per cold start).
 */

type Action = "skip" | "enter_small" | "enter_full" | "scale_out_50";
const ACTIONS: Action[] = ["skip", "enter_small", "enter_full", "scale_out_50"];
const ACT_MUL: Record<Action, number> = { skip: 0, enter_small: 0.5, enter_full: 1, scale_out_50: 0.5 };

const Q = new Map<string, Record<Action, number>>();
const LR = 0.1;
const EPS = 0.05;

function stateKey(regime: string, confidence: number): string {
  const bucket = Math.floor(confidence / 10) * 10;
  return `${regime}|${bucket}`;
}

function ensureRow(s: string): Record<Action, number> {
  let row = Q.get(s);
  if (!row) { row = { skip: 0, enter_small: 0, enter_full: 0, scale_out_50: 0 }; Q.set(s, row); }
  return row;
}

export function suggestAction(regime: string, confidence: number): Action {
  const row = ensureRow(stateKey(regime, confidence));
  if (Math.random() < EPS) return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  let best: Action = "skip", bv = -Infinity;
  for (const a of ACTIONS) if (row[a] > bv) { bv = row[a]; best = a; }
  return best;
}

export function rewardAction(regime: string, confidence: number, action: Action, realisedReturn: number) {
  const row = ensureRow(stateKey(regime, confidence));
  const reward = realisedReturn * ACT_MUL[action];
  row[action] = row[action] + LR * (reward - row[action]);
}

export function rlSnapshot() {
  return Array.from(Q.entries()).map(([s, row]) => ({ state: s, ...row }));
}