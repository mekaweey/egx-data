/**
 * Cross-Asset Correlation: relate stock to Gold/Oil/DXY/Bonds.
 */

export type AssetClass = "gold" | "oil" | "dxy" | "bonds" | "btc";

export interface CrossAssetSignal {
  correlations: Record<AssetClass, number>;
  dominantDriver: AssetClass | "idiosyncratic";
  regimeShift: boolean;
}

function pearson(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return dx * dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

export function analyzeCrossAsset(
  stockReturns: number[],
  assetReturns: Partial<Record<AssetClass, number[]>>,
  previousCorrelations?: Record<AssetClass, number>,
): CrossAssetSignal {
  const correlations = { gold: 0, oil: 0, dxy: 0, bonds: 0, btc: 0 } as Record<AssetClass, number>;
  for (const key of Object.keys(assetReturns) as AssetClass[]) {
    correlations[key] = pearson(stockReturns, assetReturns[key] ?? []);
  }

  let dominantDriver: AssetClass | "idiosyncratic" = "idiosyncratic";
  let maxAbs = 0.3;
  for (const key of Object.keys(correlations) as AssetClass[]) {
    if (Math.abs(correlations[key]) > maxAbs) {
      maxAbs = Math.abs(correlations[key]);
      dominantDriver = key;
    }
  }

  let regimeShift = false;
  if (previousCorrelations) {
    for (const key of Object.keys(correlations) as AssetClass[]) {
      if (Math.abs(correlations[key] - previousCorrelations[key]) > 0.4) {
        regimeShift = true;
        break;
      }
    }
  }

  return { correlations, dominantDriver, regimeShift };
}