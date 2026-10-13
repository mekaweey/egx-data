// Simplified Elliott Wave detection (5-wave impulse / 3-wave correction)
export type ElliottResult = {
  currentWave: 1 | 2 | 3 | 4 | 5 | 'A' | 'B' | 'C' | null;
  trend: 'up' | 'down' | 'sideways';
  nextLikelyDirection: 'up' | 'down' | 'unclear';
  confidenceDelta: number;
};

export function detectElliott(closes: number[]): ElliottResult {
  const result: ElliottResult = { currentWave: null, trend: 'sideways', nextLikelyDirection: 'unclear', confidenceDelta: 0 };
  if (closes.length < 40) return result;
  // Find swing points via simple zigzag (3% threshold)
  const threshold = 0.03;
  const pivots: { idx: number; price: number; isHigh: boolean }[] = [];
  let lastPivot = closes[0];
  let lastIdx = 0;
  let direction: 'up' | 'down' | null = null;
  for (let i = 1; i < closes.length; i++) {
    const change = (closes[i] - lastPivot) / lastPivot;
    if (direction === null) {
      if (Math.abs(change) >= threshold) {
        direction = change > 0 ? 'up' : 'down';
        pivots.push({ idx: lastIdx, price: lastPivot, isHigh: direction === 'down' });
      }
    } else if (direction === 'up') {
      if (closes[i] > lastPivot) { lastPivot = closes[i]; lastIdx = i; }
      else if ((closes[i] - lastPivot) / lastPivot <= -threshold) {
        pivots.push({ idx: lastIdx, price: lastPivot, isHigh: true });
        direction = 'down'; lastPivot = closes[i]; lastIdx = i;
      }
    } else {
      if (closes[i] < lastPivot) { lastPivot = closes[i]; lastIdx = i; }
      else if ((closes[i] - lastPivot) / lastPivot >= threshold) {
        pivots.push({ idx: lastIdx, price: lastPivot, isHigh: false });
        direction = 'up'; lastPivot = closes[i]; lastIdx = i;
      }
    }
  }
  if (pivots.length < 3) return result;
  const recent = pivots.slice(-6);
  // Determine trend
  const first = recent[0].price, last = recent[recent.length - 1].price;
  result.trend = last > first * 1.05 ? 'up' : last < first * 0.95 ? 'down' : 'sideways';
  // Map wave count
  const waveIdx = recent.length % 5;
  result.currentWave = (waveIdx as 1 | 2 | 3 | 4 | 5) || 5;
  // Wave 3 / wave 5 in uptrend = bullish continuation
  if (result.trend === 'up' && (result.currentWave === 2 || result.currentWave === 4)) {
    result.nextLikelyDirection = 'up';
    result.confidenceDelta = 4;
  } else if (result.trend === 'down' && (result.currentWave === 2 || result.currentWave === 4)) {
    result.nextLikelyDirection = 'down';
    result.confidenceDelta = -4;
  }
  return result;
}
