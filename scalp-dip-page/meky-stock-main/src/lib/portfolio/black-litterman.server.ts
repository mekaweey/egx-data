// Simplified Black-Litterman: blend equilibrium weights with model views
export function blackLittermanBlend(
  equilibriumWeights: { symbol: string; weight: number }[],
  modelViews: { symbol: string; expectedReturn: number; confidence: number }[],
  blendStrength = 0.5
): { symbol: string; finalWeight: number }[] {
  const viewMap = new Map(modelViews.map(v => [v.symbol, v]));
  const adjusted = equilibriumWeights.map(eq => {
    const v = viewMap.get(eq.symbol);
    if (!v) return { symbol: eq.symbol, finalWeight: eq.weight };
    const conf = Math.max(0, Math.min(1, v.confidence / 100));
    const tilt = (v.expectedReturn / 100) * conf * blendStrength;
    return { symbol: eq.symbol, finalWeight: Math.max(0, eq.weight * (1 + tilt)) };
  });
  const total = adjusted.reduce((s, x) => s + x.finalWeight, 0);
  return adjusted.map(x => ({ symbol: x.symbol, finalWeight: total > 0 ? +(x.finalWeight / total).toFixed(4) : 0 }));
}
