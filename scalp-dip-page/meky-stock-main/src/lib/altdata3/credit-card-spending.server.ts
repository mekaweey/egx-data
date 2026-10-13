/**
 * Credit Card Spending proxy — predict quarterly revenue before earnings.
 */
export interface SpendingObservation {
  weekStart: string;
  totalSpend: number;
  uniqueCardholders: number;
}

export interface RevenueNowcast {
  estimatedQuarterRevenue: number;
  yoyGrowth: number;
  confidenceBand: { low: number; high: number };
}

export function nowcastRevenue(
  current: SpendingObservation[],
  yearAgo: SpendingObservation[],
  panelCoverage: number = 0.05,
): RevenueNowcast {
  const sum = (arr: SpendingObservation[]) => arr.reduce((s, o) => s + o.totalSpend, 0);
  const curTotal = sum(current);
  const prevTotal = sum(yearAgo);
  const yoy = prevTotal === 0 ? 0 : (curTotal - prevTotal) / prevTotal;
  const estimated = curTotal / Math.max(0.001, panelCoverage);
  return {
    estimatedQuarterRevenue: estimated,
    yoyGrowth: yoy,
    confidenceBand: { low: estimated * 0.9, high: estimated * 1.1 },
  };
}