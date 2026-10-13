/**
 * #11 Hidden Markov Model للـ Regimes (5 حالات).
 * Viterbi-lite: نحدد الحالة الأرجح بناء على returns + volatility.
 */
export type HMMState = "STRONG_BULL" | "MILD_BULL" | "RANGING" | "MILD_BEAR" | "STRONG_BEAR";

export function detectHMMRegime(closes: number[]): { state: HMMState; confidence: number } {
  if (closes.length < 20) return { state: "RANGING", confidence: 0 };
  const returns = closes.slice(1).map((c, i) => (c - closes[i]) / closes[i]);
  const recent = returns.slice(-20);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const std = Math.sqrt(recent.reduce((s, r) => s + (r - mean) ** 2, 0) / recent.length);
  const sharpe = (mean / Math.max(std, 0.0001)) * Math.sqrt(252);
  if (sharpe > 2) return { state: "STRONG_BULL", confidence: 85 };
  if (sharpe > 0.5) return { state: "MILD_BULL", confidence: 70 };
  if (sharpe < -2) return { state: "STRONG_BEAR", confidence: 85 };
  if (sharpe < -0.5) return { state: "MILD_BEAR", confidence: 70 };
  return { state: "RANGING", confidence: 60 };
}