/**
 * #5 Dark Pool Detection: استدلال على الصفقات المخفية من تباين volume vs price.
 */
export interface DarkPoolSignal { score: number; reason: string }

export function detectDarkPool(volume: number, volAvg20: number, changePct: number): DarkPoolSignal {
  const volRatio = volume / Math.max(volAvg20, 1);
  if (volRatio > 2.5 && Math.abs(changePct) < 0.5) {
    return { score: Math.min(100, volRatio * 20), reason: "حجم استثنائي بدون حركة سعر — احتمال صفقات مؤسسية مخفية" };
  }
  if (volRatio > 4) return { score: 70, reason: "حجم ضخم — تجميع/توزيع محتمل" };
  return { score: 0, reason: "" };
}