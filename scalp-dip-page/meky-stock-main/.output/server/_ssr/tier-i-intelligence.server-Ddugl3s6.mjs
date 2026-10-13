function portfolioCorrelationPenalty(candidate, existing, maxPerSector = 2) {
  if (!candidate.sector || existing.length === 0) return 1;
  const sameSector = existing.filter((p) => p.sector === candidate.sector).length;
  if (sameSector < maxPerSector) return 1;
  const excess = sameSector - maxPerSector + 1;
  return Math.max(0.6, 1 - 0.08 * excess);
}
function estimateSlippage(input) {
  const { orderValue, avgDailyValue, atrPct } = input;
  if (avgDailyValue <= 0) return 0.01;
  const participation = Math.min(0.5, orderValue / avgDailyValue);
  const impact = 0.1 * Math.sqrt(participation) * Math.max(5e-3, atrPct);
  return Math.min(0.05, impact);
}
export {
  estimateSlippage as e,
  portfolioCorrelationPenalty as p
};
