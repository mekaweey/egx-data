import type { MetaWeights } from "@/lib/analysis/meta-learner.server";

/**
 * Linear SHAP for the meta-learner (logistic regression on 5 normalized scores).
 * For a linear model, each SHAP value = w_k * (x_k - mean_x_k).
 * We use 0.5 as a neutral baseline (midpoint of normalized 0..1 scores).
 *
 * Returns ranked contributions in 0..100 weight units (signed direction in `impact`).
 */

export type ShapContribution = {
  feature: "technical" | "fundamental" | "sentiment" | "macro" | "sector";
  name_ar: string;
  raw: number;            // raw 0..100 score
  contribution: number;   // signed contribution to log-odds
  impact: "positive" | "negative" | "neutral";
  weight: number;         // 0..100 importance for UI
};

const NAMES_AR: Record<ShapContribution["feature"], string> = {
  technical: "التحليل الفني",
  fundamental: "التحليل المالي",
  sentiment: "الأخبار والمشاعر",
  macro: "البيئة الاقتصادية",
  sector: "أداء القطاع",
};

export function shapExplain(
  scores: { technical: number; fundamental: number | null; sentiment: number; macro: number; sector: number },
  m: MetaWeights,
): ShapContribution[] {
  const feats: ShapContribution["feature"][] = ["technical", "fundamental", "sentiment", "macro", "sector"];
  const x = [
    scores.technical / 100,
    (scores.fundamental ?? scores.technical) / 100,
    scores.sentiment / 100,
    scores.macro / 100,
    scores.sector / 100,
  ];
  const raw = [
    scores.technical,
    scores.fundamental ?? scores.technical,
    scores.sentiment,
    scores.macro,
    scores.sector,
  ];
  const baseline = 0.5;
  const contribs = x.map((v, k) => m.w[k] * (v - baseline));
  const maxAbs = Math.max(...contribs.map((c) => Math.abs(c)), 1e-6);

  return feats
    .map((f, k) => {
      const c = contribs[k];
      return {
        feature: f,
        name_ar: NAMES_AR[f],
        raw: +raw[k].toFixed(1),
        contribution: +c.toFixed(4),
        impact: (c > 0.01 ? "positive" : c < -0.01 ? "negative" : "neutral") as ShapContribution["impact"],
        weight: Math.round((Math.abs(c) / maxAbs) * 100),
      };
    })
    .sort((a, b) => b.weight - a.weight);
}