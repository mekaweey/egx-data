/**
 * Ensemble disagreement penalty.
 * Looks at the spread between the 5 scoring dimensions (technical,
 * fundamental, sentiment, macro, sector). High agreement (low std-dev)
 * → confidence boost. Wide disagreement → confidence cut.
 */
export type DisagreementResult = {
  stdDev: number;
  range: number;
  agreement: "high" | "medium" | "low";
  confidenceDelta: number;
  label_ar: string;
};

export function computeDisagreement(scores: {
  technical: number;
  fundamental: number | null;
  sentiment: number;
  macro: number;
  sector: number;
}): DisagreementResult {
  const vals = [
    scores.technical,
    scores.fundamental ?? scores.technical,
    scores.sentiment,
    scores.macro,
    scores.sector,
  ];
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
  const stdDev = +Math.sqrt(variance).toFixed(1);
  const range = Math.max(...vals) - Math.min(...vals);

  if (stdDev < 8) return { stdDev, range, agreement: "high", confidenceDelta: 5, label_ar: "إجماع قوي بين كل الأبعاد" };
  if (stdDev < 18) return { stdDev, range, agreement: "medium", confidenceDelta: 0, label_ar: "اتفاق متوسط" };
  return { stdDev, range, agreement: "low", confidenceDelta: -8, label_ar: "تشتت كبير بين النماذج — يقين منخفض" };
}
