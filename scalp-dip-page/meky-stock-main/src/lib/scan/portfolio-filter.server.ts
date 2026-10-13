/**
 * Portfolio Correlation Filter.
 *
 * After picks are generated, cap the number of recommendations per sector
 * so the user doesn't get 5 banks (= 1 concentrated bet).
 *
 * Keeps the highest-confidence pick(s) per sector and demotes the rest
 * by adding a rejection_reason. Operates IN PLACE on a result array
 * sorted by confidence descending.
 */

export type Pick = {
  symbol: string;
  sector: string | null;
  signal: string;
  confidence: number;
  rejected_by_rules: boolean;
  rejection_reason: string | null;
};

export const MAX_PER_SECTOR = 2;

export function applyPortfolioFilter<T extends Pick>(picks: T[]): { picks: T[]; demoted: number } {
  const sorted = [...picks].sort((a, b) => b.confidence - a.confidence);
  const sectorCount = new Map<string, number>();
  let demoted = 0;

  for (const p of sorted) {
    if (p.rejected_by_rules) continue;
    if (p.signal !== "buy" && p.signal !== "strong_buy") continue;
    const sec = p.sector ?? "غير محدد";
    const cnt = sectorCount.get(sec) ?? 0;
    if (cnt >= MAX_PER_SECTOR) {
      p.signal = "neutral";
      p.rejected_by_rules = true;
      p.rejection_reason =
        (p.rejection_reason ? p.rejection_reason + " • " : "") +
        `تنويع المحفظة: تم بالفعل اختيار ${MAX_PER_SECTOR} من قطاع ${sec}`;
      demoted++;
    } else {
      sectorCount.set(sec, cnt + 1);
    }
  }

  return { picks: sorted, demoted };
}