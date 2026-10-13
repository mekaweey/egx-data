// Meta-learning: transfer knowledge from similar symbols
export type SymbolProfile = { symbol: string; sector: string; avgVol: number; betaToIndex: number };

export function findSimilarSymbols(
  target: SymbolProfile,
  universe: SymbolProfile[],
  topK = 5
): { symbol: string; similarity: number }[] {
  return universe
    .filter(s => s.symbol !== target.symbol)
    .map(s => {
      const sectorMatch = s.sector === target.sector ? 1 : 0;
      const volSim = 1 - Math.min(1, Math.abs(s.avgVol - target.avgVol) / Math.max(target.avgVol, 1));
      const betaSim = 1 - Math.min(1, Math.abs(s.betaToIndex - target.betaToIndex) / 2);
      const similarity = sectorMatch * 0.5 + volSim * 0.25 + betaSim * 0.25;
      return { symbol: s.symbol, similarity: +similarity.toFixed(3) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

export function transferLearnedBoost(
  similarSymbolsWinRates: { symbol: string; winRate: number; similarity: number }[]
): number {
  if (similarSymbolsWinRates.length === 0) return 0;
  let weightedSum = 0, totalWeight = 0;
  for (const s of similarSymbolsWinRates) {
    weightedSum += (s.winRate - 0.5) * s.similarity;
    totalWeight += s.similarity;
  }
  if (totalWeight === 0) return 0;
  const avgEdge = weightedSum / totalWeight;
  return Math.max(-5, Math.min(5, avgEdge * 20));
}
