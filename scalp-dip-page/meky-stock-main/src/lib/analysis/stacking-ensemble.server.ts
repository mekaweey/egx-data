import type { FiveDimScores } from "@/lib/analysis/five-dim-score.server";

/**
 * Stacking ensemble — combines 3 sub-models with different inductive biases
 * then takes a weighted average. Each sub-model produces a probability of profit.
 *
 * Sub-models:
 *  1. Linear: simple weighted sum (technical-heavy)
 *  2. Tree-like: rule-based piecewise thresholds (fundamentals-heavy)
 *  3. Neural-like: sigmoid of weighted sum with non-linear interactions
 */
export type StackingResult = {
  linearProb: number;
  treeProb: number;
  neuralProb: number;
  stackedProb: number;
  agreement: number;          // 0-100, how aligned the models are
  label_ar: string;
  confidenceDelta: number;
};

function sigmoid(x: number) { return 1 / (1 + Math.exp(-x)); }

function linearModel(s: FiveDimScores): number {
  const fund = s.fundamental ?? 50;
  const raw = 0.35 * s.technical + 0.15 * fund + 0.20 * s.sentiment
            + 0.15 * s.macro + 0.15 * s.sector;
  return Math.max(0, Math.min(100, raw));
}

function treeModel(s: FiveDimScores): number {
  const fund = s.fundamental ?? 50;
  // Piecewise: rewards combinations strongly, penalises any single weak dim
  let prob = 50;
  if (s.technical >= 70 && s.sentiment >= 60) prob += 15;
  else if (s.technical >= 60) prob += 5;
  else if (s.technical < 40) prob -= 12;

  if (fund >= 70) prob += 8;
  else if (fund < 35) prob -= 10;

  if (s.macro >= 60 && s.sector >= 60) prob += 8;
  if (s.macro < 35 || s.sector < 35) prob -= 8;

  return Math.max(5, Math.min(95, prob));
}

function neuralModel(s: FiveDimScores): number {
  // Single hidden layer with two neurons + sigmoid combination
  const norm = (x: number) => (x - 50) / 25;
  const t = norm(s.technical), f = norm(s.fundamental ?? 50), se = norm(s.sentiment),
        m = norm(s.macro), sc = norm(s.sector);
  const h1 = Math.tanh(0.6 * t + 0.3 * se + 0.2 * sc + 0.1 * m);
  const h2 = Math.tanh(0.5 * f + 0.4 * m + 0.3 * sc - 0.2 * t);
  const out = sigmoid(1.2 * h1 + 0.8 * h2);
  return Math.round(out * 100);
}

export function stackingEnsemble(scores: FiveDimScores): StackingResult {
  const linearProb = Math.round(linearModel(scores));
  const treeProb = Math.round(treeModel(scores));
  const neuralProb = Math.round(neuralModel(scores));

  // Stacked: weighted average (neural slightly higher weight when models agree)
  const probs = [linearProb, treeProb, neuralProb];
  const stackedProb = Math.round((linearProb * 0.3 + treeProb * 0.3 + neuralProb * 0.4));
  const max = Math.max(...probs), min = Math.min(...probs);
  const spread = max - min;
  const agreement = Math.max(0, 100 - spread * 2);

  let confidenceDelta = 0;
  let label_ar = "";
  if (agreement >= 80 && stackedProb >= 65) {
    confidenceDelta = 6;
    label_ar = `النماذج الثلاثة متفقة على إيجابية (${stackedProb}%)`;
  } else if (agreement >= 80 && stackedProb <= 35) {
    confidenceDelta = -6;
    label_ar = `النماذج الثلاثة متفقة على سلبية (${stackedProb}%)`;
  } else if (agreement < 50) {
    confidenceDelta = -4;
    label_ar = `النماذج غير متفقة (تشتت ${spread}%)`;
  }

  return { linearProb, treeProb, neuralProb, stackedProb, agreement, label_ar, confidenceDelta };
}