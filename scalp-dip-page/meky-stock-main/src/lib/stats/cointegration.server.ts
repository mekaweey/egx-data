/**
 * Cointegration Analysis: detect pairs of assets that move together (pairs trading).
 * Uses Engle-Granger 2-step procedure.
 */

export interface CointegrationResult {
  hedgeRatio: number;
  intercept: number;
  spread: number[];
  adfStatistic: number;
  isCointegrated: boolean;
  halfLife: number;
}

function linearRegression(x: number[], y: number[]): { slope: number; intercept: number } {
  const n = x.length;
  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - meanX) * (y[i] - meanY);
    den += (x[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den;
  return { slope, intercept: meanY - slope * meanX };
}

/**
 * Augmented Dickey-Fuller test (simplified).
 */
function adfTest(series: number[]): number {
  const n = series.length;
  if (n < 10) return 0;
  const diff: number[] = [];
  const lag: number[] = [];
  for (let i = 1; i < n; i++) {
    diff.push(series[i] - series[i - 1]);
    lag.push(series[i - 1]);
  }
  const { slope } = linearRegression(lag, diff);
  // t-statistic approximation
  const residuals = diff.map((d, i) => d - slope * lag[i]);
  const sse = residuals.reduce((s, r) => s + r * r, 0);
  const seSlope = Math.sqrt(sse / (n - 2)) / Math.sqrt(lag.reduce((s, l) => s + l * l, 0));
  return seSlope === 0 ? 0 : slope / seSlope;
}

export function testCointegration(seriesA: number[], seriesB: number[]): CointegrationResult {
  const { slope: hedgeRatio, intercept } = linearRegression(seriesB, seriesA);
  const spread = seriesA.map((a, i) => a - hedgeRatio * seriesB[i] - intercept);
  const adfStat = adfTest(spread);

  // Half-life via AR(1) on spread
  const diffSpread: number[] = [];
  const lagSpread: number[] = [];
  for (let i = 1; i < spread.length; i++) {
    diffSpread.push(spread[i] - spread[i - 1]);
    lagSpread.push(spread[i - 1]);
  }
  const { slope: arSlope } = linearRegression(lagSpread, diffSpread);
  const halfLife = arSlope < 0 ? -Math.log(2) / arSlope : Infinity;

  return {
    hedgeRatio,
    intercept,
    spread,
    adfStatistic: adfStat,
    isCointegrated: adfStat < -2.86, // 5% critical value
    halfLife,
  };
}

/**
 * Pairs trading signal: z-score of current spread.
 */
export function pairsSignal(
  spread: number[],
  lookback: number = 30,
): { zScore: number; signal: "long_spread" | "short_spread" | "neutral" } {
  const recent = spread.slice(-lookback);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const std = Math.sqrt(recent.reduce((s, v) => s + (v - mean) ** 2, 0) / recent.length);
  const current = spread[spread.length - 1];
  const z = std === 0 ? 0 : (current - mean) / std;

  let signal: "long_spread" | "short_spread" | "neutral" = "neutral";
  if (z < -2) signal = "long_spread";
  else if (z > 2) signal = "short_spread";

  return { zScore: z, signal };
}