/**
 * Walk-Forward Optimization: time-series-correct backtesting.
 * Train on window [t-N, t], test on [t, t+M], roll forward.
 */

export interface WalkForwardWindow<T> {
  trainStart: number;
  trainEnd: number;
  testStart: number;
  testEnd: number;
  trainData: T[];
  testData: T[];
}

export interface WalkForwardResult {
  windowMetrics: Array<{ window: number; metric: number }>;
  meanMetric: number;
  stdMetric: number;
  worstWindow: number;
  consistency: number; // fraction of windows above zero
}

export function* walkForwardWindows<T>(
  data: T[],
  trainSize: number,
  testSize: number,
  step: number = 0,
): Generator<WalkForwardWindow<T>> {
  const advanceBy = step || testSize;
  for (let start = 0; start + trainSize + testSize <= data.length; start += advanceBy) {
    yield {
      trainStart: start,
      trainEnd: start + trainSize,
      testStart: start + trainSize,
      testEnd: start + trainSize + testSize,
      trainData: data.slice(start, start + trainSize),
      testData: data.slice(start + trainSize, start + trainSize + testSize),
    };
  }
}

export function aggregateWalkForward(metrics: number[]): WalkForwardResult {
  if (metrics.length === 0) {
    return { windowMetrics: [], meanMetric: 0, stdMetric: 0, worstWindow: 0, consistency: 0 };
  }
  const mean = metrics.reduce((a, b) => a + b, 0) / metrics.length;
  const std = Math.sqrt(metrics.reduce((s, m) => s + (m - mean) ** 2, 0) / metrics.length);
  const worst = Math.min(...metrics);
  const consistency = metrics.filter((m) => m > 0).length / metrics.length;
  return {
    windowMetrics: metrics.map((m, i) => ({ window: i, metric: m })),
    meanMetric: mean,
    stdMetric: std,
    worstWindow: worst,
    consistency,
  };
}