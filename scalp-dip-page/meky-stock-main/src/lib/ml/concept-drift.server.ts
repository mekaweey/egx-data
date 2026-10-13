/**
 * #21 Concept Drift Detection: ADWIN-lite.
 * يكتشف لما توزيع البيانات يتغير جذرياً ويطلب إعادة تدريب.
 */
export interface DriftResult { driftDetected: boolean; severity: number; recommendation: string }

function mean(a: number[]) { return a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1) }
function std(a: number[]) { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / Math.max(a.length, 1)) }

export function detectConceptDrift(recentAccuracy: number[], historicalAccuracy: number[]): DriftResult {
  if (recentAccuracy.length < 5 || historicalAccuracy.length < 10) {
    return { driftDetected: false, severity: 0, recommendation: "بيانات غير كافية" };
  }
  const rMean = mean(recentAccuracy);
  const hMean = mean(historicalAccuracy);
  const hStd = std(historicalAccuracy);
  const zScore = Math.abs(rMean - hMean) / Math.max(hStd, 0.01);
  const drift = zScore > 2;
  return {
    driftDetected: drift,
    severity: zScore,
    recommendation: drift ? "إعادة تدريب فوراً — تغير جذري في السوق" : "ثابت",
  };
}