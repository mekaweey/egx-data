// Portfolio Value-at-Risk (95% confidence, historical method)
export type VaRResult = {
  var95Pct: number;
  cvar95Pct: number;
  worstDayPct: number;
  volatilityPct: number;
};

export function calculatePortfolioVaR(returns: number[]): VaRResult {
  if (returns.length < 20) return { var95Pct: 0, cvar95Pct: 0, worstDayPct: 0, volatilityPct: 0 };
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor(sorted.length * 0.05);
  const var95 = Math.abs(sorted[idx] * 100);
  const tail = sorted.slice(0, idx + 1);
  const cvar95 = Math.abs(tail.reduce((s, x) => s + x, 0) / tail.length * 100);
  const mean = returns.reduce((s, x) => s + x, 0) / returns.length;
  const variance = returns.reduce((s, x) => s + (x - mean) ** 2, 0) / returns.length;
  return {
    var95Pct: +var95.toFixed(2),
    cvar95Pct: +cvar95.toFixed(2),
    worstDayPct: +(Math.abs(sorted[0]) * 100).toFixed(2),
    volatilityPct: +(Math.sqrt(variance) * 100).toFixed(2)
  };
}
