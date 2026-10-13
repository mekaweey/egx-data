/**
 * Kalman Filter: estimate hidden trend from noisy price observations.
 */

export interface KalmanState {
  level: number;
  trend: number;
  levelVariance: number;
  trendVariance: number;
}

export interface KalmanParams {
  processNoise: number;
  measurementNoise: number;
}

export function initKalman(initialPrice: number): KalmanState {
  return { level: initialPrice, trend: 0, levelVariance: 1, trendVariance: 1 };
}

/**
 * Update Kalman state with a new observation.
 */
export function kalmanUpdate(
  state: KalmanState,
  observation: number,
  params: KalmanParams,
): KalmanState {
  // Predict
  const predLevel = state.level + state.trend;
  const predTrend = state.trend;
  const predLevelVar = state.levelVariance + state.trendVariance + params.processNoise;

  // Kalman gain
  const gain = predLevelVar / (predLevelVar + params.measurementNoise);

  // Update
  const residual = observation - predLevel;
  return {
    level: predLevel + gain * residual,
    trend: predTrend + gain * residual * 0.1,
    levelVariance: (1 - gain) * predLevelVar,
    trendVariance: state.trendVariance + 0.01,
  };
}

/**
 * Run Kalman filter over a price series and return smoothed trend.
 */
export function runKalman(
  prices: number[],
  params: KalmanParams = { processNoise: 0.001, measurementNoise: 0.1 },
): { smoothed: number[]; trend: number[] } {
  if (prices.length === 0) return { smoothed: [], trend: [] };
  let state = initKalman(prices[0]);
  const smoothed: number[] = [state.level];
  const trend: number[] = [0];

  for (let i = 1; i < prices.length; i++) {
    state = kalmanUpdate(state, prices[i], params);
    smoothed.push(state.level);
    trend.push(state.trend);
  }

  return { smoothed, trend };
}