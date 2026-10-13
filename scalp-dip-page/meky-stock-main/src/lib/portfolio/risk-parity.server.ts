// Risk parity allocation: weight inversely to volatility
export function riskParityWeights(volatilities: { symbol: string; volPct: number }[]): { symbol: string; weight: number }[] {
  if (volatilities.length === 0) return [];
  const inv = volatilities.map(v => ({ symbol: v.symbol, w: v.volPct > 0 ? 1 / v.volPct : 0 }));
  const total = inv.reduce((s, x) => s + x.w, 0);
  if (total <= 0) return volatilities.map(v => ({ symbol: v.symbol, weight: 1 / volatilities.length }));
  return inv.map(x => ({ symbol: x.symbol, weight: +(x.w / total).toFixed(4) }));
}
