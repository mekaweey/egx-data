import type { Indicators } from "@/lib/analysis/indicators.server";

export type FactorImpact = {
  name_ar: string;
  value: string;
  impact: "positive" | "negative" | "neutral";
  weight: number; // 0..100 relative importance
};

/**
 * Build a ranked list of the top factors that influenced a recommendation.
 * The UI can show this to explain WHY the pick was made.
 */
export function buildExplainability(params: {
  ind: Indicators;
  fiveDim: { technical: number; fundamental: number | null; sentiment: number; macro: number; sector: number };
  ensembleAgreement: number | null;
  regimeMult: number;
  monteCarloProbProfit: number | null;
}): FactorImpact[] {
  const { ind, fiveDim, ensembleAgreement, regimeMult, monteCarloProbProfit } = params;
  const factors: FactorImpact[] = [];

  // Technical dimension
  factors.push({
    name_ar: "التحليل الفني",
    value: `${fiveDim.technical.toFixed(0)}/100`,
    impact: fiveDim.technical >= 60 ? "positive" : fiveDim.technical <= 40 ? "negative" : "neutral",
    weight: 30,
  });

  // RSI
  if (ind.rsi14 != null) {
    factors.push({
      name_ar: "مؤشر القوة النسبية RSI",
      value: ind.rsi14.toFixed(1),
      impact: ind.rsi14 < 35 ? "positive" : ind.rsi14 > 70 ? "negative" : "neutral",
      weight: 15,
    });
  }

  // Volume confirmation
  if (ind.volRatio > 0) {
    factors.push({
      name_ar: "نسبة الحجم",
      value: `${ind.volRatio.toFixed(2)}x`,
      impact: ind.volRatio >= 1.5 ? "positive" : ind.volRatio < 0.7 ? "negative" : "neutral",
      weight: 12,
    });
  }

  // Sentiment
  factors.push({
    name_ar: "الأخبار والمعنويات",
    value: `${fiveDim.sentiment.toFixed(0)}/100`,
    impact: fiveDim.sentiment >= 60 ? "positive" : fiveDim.sentiment <= 40 ? "negative" : "neutral",
    weight: 20,
  });

  // Sector momentum
  factors.push({
    name_ar: "قوة القطاع",
    value: `${fiveDim.sector.toFixed(0)}/100`,
    impact: fiveDim.sector >= 60 ? "positive" : fiveDim.sector <= 40 ? "negative" : "neutral",
    weight: 15,
  });

  // Macro
  factors.push({
    name_ar: "الاقتصاد الكلي",
    value: `${fiveDim.macro.toFixed(0)}/100`,
    impact: fiveDim.macro >= 55 ? "positive" : fiveDim.macro <= 45 ? "negative" : "neutral",
    weight: 10,
  });

  // Ensemble
  if (ensembleAgreement != null) {
    factors.push({
      name_ar: "اتفاق نماذج الذكاء",
      value: `${ensembleAgreement}%`,
      impact: ensembleAgreement >= 70 ? "positive" : ensembleAgreement < 50 ? "negative" : "neutral",
      weight: 18,
    });
  }

  // Regime
  factors.push({
    name_ar: "حالة السوق",
    value: regimeMult >= 1.1 ? "صاعد" : regimeMult <= 0.8 ? "هابط/متقلب" : "محايد",
    impact: regimeMult >= 1.1 ? "positive" : regimeMult <= 0.8 ? "negative" : "neutral",
    weight: 14,
  });

  // Monte Carlo
  if (monteCarloProbProfit != null) {
    factors.push({
      name_ar: "احتمال الربح (محاكاة)",
      value: `${monteCarloProbProfit.toFixed(0)}%`,
      impact: monteCarloProbProfit >= 60 ? "positive" : monteCarloProbProfit < 45 ? "negative" : "neutral",
      weight: 16,
    });
  }

  // Sort by weight (descending) and return top 6
  return factors.sort((a, b) => b.weight - a.weight).slice(0, 6);
}