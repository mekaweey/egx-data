// Kelly Criterion fractional position sizing
export function kellyFractional(
  winRate: number,        // 0..1
  avgWinPct: number,      // e.g. 5 = 5%
  avgLossPct: number,     // positive number, e.g. 3 = 3%
  fraction = 0.25         // fractional Kelly (1/4 Kelly is standard for safety)
): number {
  if (winRate <= 0 || winRate >= 1 || avgWinPct <= 0 || avgLossPct <= 0) return 0;
  const b = avgWinPct / avgLossPct;
  const fullKelly = (winRate * (b + 1) - 1) / b;
  const sized = Math.max(0, fullKelly * fraction);
  return Math.min(0.25, sized); // cap at 25% per position
}

export function kellySizingMultiplier(winRate: number, avgWin: number, avgLoss: number): number {
  const k = kellyFractional(winRate, avgWin, avgLoss);
  // Express as multiplier vs baseline 5% position
  return Math.max(0.2, Math.min(2, k / 0.05));
}
