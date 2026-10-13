/**
 * #12 Survival Analysis للصفقات: متوسط عمر الإشارة قبل ما تفشل.
 * Kaplan-Meier estimator مبسط.
 */
export interface SurvivalResult { medianDays: number; survivalCurve: { day: number; survival: number }[] }

export function survivalAnalysis(trades: { daysHeld: number; failed: boolean }[]): SurvivalResult {
  if (!trades.length) return { medianDays: 0, survivalCurve: [] };
  const maxDay = Math.max(...trades.map((t) => t.daysHeld));
  const curve: { day: number; survival: number }[] = [];
  let surviving = trades.length;
  for (let d = 1; d <= maxDay; d++) {
    const failedAtD = trades.filter((t) => t.failed && t.daysHeld === d).length;
    surviving -= failedAtD;
    curve.push({ day: d, survival: surviving / trades.length });
  }
  const median = curve.find((c) => c.survival <= 0.5)?.day ?? maxDay;
  return { medianDays: median, survivalCurve: curve };
}