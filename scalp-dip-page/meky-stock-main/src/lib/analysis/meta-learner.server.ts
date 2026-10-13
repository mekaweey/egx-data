import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { windowStartISO, symbolWeight } from "@/lib/analysis/training-window.server";

/**
 * Meta-Learner / Stacking model.
 *
 * Learns the optimal weights of the 5 scoring dimensions (technical,
 * fundamental, sentiment, macro, sector) from closed recommendations
 * via simple logistic regression (gradient descent). The result is a
 * probability of profit that replaces the hand-picked equal weights.
 *
 * Falls back to equal weights when there is not enough history.
 */

export type MetaWeights = {
  w: [number, number, number, number, number]; // technical, fundamental, sentiment, macro, sector
  b: number;
  fitted: boolean;
  sampleSize: number;
  accuracy: number;
  cvAccuracy?: number; // held-out 20% accuracy (true generalization)
};

const DEFAULT: MetaWeights = {
  w: [0.25, 0.15, 0.2, 0.15, 0.25],
  b: 0,
  fitted: false,
  sampleSize: 0,
  accuracy: 0,
};

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

export async function trainMetaLearner(focusSymbol: string | null = null): Promise<MetaWeights> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("technical_score, fundamental_score, sentiment_score, macro_score, sector_score, outcome, realized_pct, symbol, created_at")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", windowStartISO())
    .limit(3000);

  const rows = (data ?? []).filter(
    (r) => r.technical_score != null && r.sentiment_score != null && r.macro_score != null && r.sector_score != null,
  );
  if (rows.length < 50) return DEFAULT;

  const X = rows.map((r) => [
    Number(r.technical_score) / 100,
    Number(r.fundamental_score ?? r.technical_score) / 100,
    Number(r.sentiment_score) / 100,
    Number(r.macro_score) / 100,
    Number(r.sector_score) / 100,
  ]);
  const y = rows.map((r) =>
    r.outcome === "target_hit" || (r.realized_pct != null && Number(r.realized_pct) > 0) ? 1 : 0,
  );
  const weights = rows.map((r) => symbolWeight(r.symbol, focusSymbol));

  // 80/20 train/test split (deterministic by index) for honest accuracy.
  const idx = X.map((_, i) => i);
  const cutoff = Math.floor(idx.length * 0.8);
  const trainIdx = idx.slice(0, cutoff);
  const testIdx = idx.slice(cutoff);

  // SGD logistic regression
  let w = [...DEFAULT.w];
  let b = 0;
  const lr = 0.05;
  const epochs = 200;
  for (let e = 0; e < epochs; e++) {
    for (const i of trainIdx) {
      const z = X[i].reduce((s, v, k) => s + v * w[k], b);
      const p = sigmoid(z);
      const err = (p - y[i]) * weights[i];
      for (let k = 0; k < 5; k++) w[k] -= lr * err * X[i][k];
      b -= lr * err;
    }
  }

  // Normalize weights to sum=1 for interpretability (keeps sigmoid behaviour via b)
  const sumAbs = w.reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const wNorm = w.map((v) => +(Math.max(0, v) / sumAbs).toFixed(4)) as MetaWeights["w"];

  // Training-set accuracy
  let correct = 0;
  for (const i of trainIdx) {
    const z = X[i].reduce((s, v, k) => s + v * w[k], b);
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === y[i]) correct++;
  }
  // Held-out cross-validation accuracy
  let cvCorrect = 0;
  for (const i of testIdx) {
    const z = X[i].reduce((s, v, k) => s + v * w[k], b);
    const pred = sigmoid(z) >= 0.5 ? 1 : 0;
    if (pred === y[i]) cvCorrect++;
  }

  return {
    w: wNorm,
    b: +b.toFixed(4),
    fitted: true,
    sampleSize: rows.length,
    accuracy: +(correct / Math.max(1, trainIdx.length)).toFixed(3),
    cvAccuracy: testIdx.length > 0 ? +(cvCorrect / testIdx.length).toFixed(3) : undefined,
  };
}

/**
 * Predict probability of profit for a single pick using the learned weights.
 * Returns a 0–100 probability that can be used to blend confidence.
 */
export function metaPredict(
  scores: { technical: number; fundamental: number | null; sentiment: number; macro: number; sector: number },
  m: MetaWeights,
): number {
  const x = [
    scores.technical / 100,
    (scores.fundamental ?? scores.technical) / 100,
    scores.sentiment / 100,
    scores.macro / 100,
    scores.sector / 100,
  ];
  const z = x.reduce((s, v, k) => s + v * m.w[k], m.b);
  return Math.round(sigmoid(z) * 100);
}
