/**
 * #18 Market Impact Estimator: Almgren-Chriss مبسط.
 */
export function estimateMarketImpact(orderSize: number, avgDailyVolume: number, volatility: number): number {
  const participation = orderSize / Math.max(avgDailyVolume, 1);
  // square-root law
  return volatility * Math.sqrt(participation) * 100;
}