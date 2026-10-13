/**
 * Realized Volatility from intraday returns.
 */
export function realizedVolatility(intradayReturns: number[]): number {
  if (intradayReturns.length < 2) return 0;
  const sumSq = intradayReturns.reduce((s, r) => s + r * r, 0);
  return Math.sqrt(sumSq);
}

export function annualize(rv: number, intervalsPerDay: number, daysObserved: number): number {
  void intervalsPerDay;
  const dailyVar = (rv * rv) / Math.max(1, daysObserved);
  return Math.sqrt(dailyVar * 252);
}

export function realizedSemivariance(intradayReturns: number[]): number {
  const negs = intradayReturns.filter((r) => r < 0);
  return Math.sqrt(negs.reduce((s, r) => s + r * r, 0));
}