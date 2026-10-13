/**
 * Automatic feature generation: build hundreds of features from raw OHLCV.
 */

export interface Bar {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateFeatures(bars: Bar[]): Record<string, number> {
  const n = bars.length;
  if (n === 0) return {};
  const closes = bars.map((b) => b.close);
  const volumes = bars.map((b) => b.volume);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const f: Record<string, number> = {};

  // Returns at multiple horizons
  for (const lag of [1, 3, 5, 10, 20, 50]) {
    if (n > lag) f[`return_${lag}`] = (closes[n - 1] - closes[n - 1 - lag]) / closes[n - 1 - lag];
  }

  // Moving averages and ratios
  for (const w of [5, 10, 20, 50, 100, 200]) {
    if (n >= w) {
      const ma = closes.slice(-w).reduce((a, b) => a + b, 0) / w;
      f[`ma_${w}`] = ma;
      f[`price_to_ma_${w}`] = closes[n - 1] / ma;
    }
  }

  // Volatility (rolling std of returns)
  const rets: number[] = [];
  for (let i = 1; i < n; i++) rets.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  for (const w of [5, 10, 20, 50]) {
    if (rets.length >= w) {
      const slice = rets.slice(-w);
      const m = slice.reduce((a, b) => a + b, 0) / w;
      const v = slice.reduce((s, r) => s + (r - m) ** 2, 0) / w;
      f[`volatility_${w}`] = Math.sqrt(v);
    }
  }

  // Range-based features
  for (const w of [5, 10, 20]) {
    if (n >= w) {
      const hSlice = highs.slice(-w);
      const lSlice = lows.slice(-w);
      const hi = Math.max(...hSlice);
      const lo = Math.min(...lSlice);
      f[`range_${w}`] = (hi - lo) / closes[n - 1];
      f[`position_in_range_${w}`] = lo === hi ? 0.5 : (closes[n - 1] - lo) / (hi - lo);
    }
  }

  // Volume features
  for (const w of [5, 20, 50]) {
    if (n >= w) {
      const avgV = volumes.slice(-w).reduce((a, b) => a + b, 0) / w;
      f[`volume_ratio_${w}`] = volumes[n - 1] / Math.max(avgV, 1);
    }
  }

  // Skewness & kurtosis of returns
  if (rets.length > 5) {
    const m = rets.reduce((a, b) => a + b, 0) / rets.length;
    const sd = Math.sqrt(rets.reduce((s, r) => s + (r - m) ** 2, 0) / rets.length);
    if (sd > 0) {
      f.skew = rets.reduce((s, r) => s + ((r - m) / sd) ** 3, 0) / rets.length;
      f.kurtosis = rets.reduce((s, r) => s + ((r - m) / sd) ** 4, 0) / rets.length - 3;
    }
  }

  return f;
}

/** Select top-K features by absolute correlation with target. */
export function selectFeatures(
  featureMatrix: Record<string, number>[],
  target: number[],
  k: number = 20,
): string[] {
  if (featureMatrix.length === 0) return [];
  const keys = Object.keys(featureMatrix[0]);
  const meanT = target.reduce((a, b) => a + b, 0) / target.length;
  const scores = keys.map((key) => {
    const vals = featureMatrix.map((f) => f[key] ?? 0);
    const meanV = vals.reduce((a, b) => a + b, 0) / vals.length;
    let num = 0;
    let dx = 0;
    let dy = 0;
    for (let i = 0; i < vals.length; i++) {
      num += (vals[i] - meanV) * (target[i] - meanT);
      dx += (vals[i] - meanV) ** 2;
      dy += (target[i] - meanT) ** 2;
    }
    return { key, score: dx * dy === 0 ? 0 : Math.abs(num / Math.sqrt(dx * dy)) };
  });
  return scores.sort((a, b) => b.score - a.score).slice(0, k).map((s) => s.key);
}