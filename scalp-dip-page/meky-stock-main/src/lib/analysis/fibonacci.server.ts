// Fibonacci retracement / extension levels
export type FibLevels = {
  level_0: number;
  level_236: number;
  level_382: number;
  level_500: number;
  level_618: number;
  level_786: number;
  level_1000: number;
  ext_1272: number;
  ext_1618: number;
  nearestLevel: number;
  distanceToNearestPct: number;
  isAtKeyLevel: boolean;
};

export function calculateFibLevels(highs: number[], lows: number[], currentPrice: number): FibLevels | null {
  if (highs.length < 30) return null;
  const recent = 60;
  const lookback = Math.min(recent, highs.length);
  const maxH = Math.max(...highs.slice(-lookback));
  const minL = Math.min(...lows.slice(-lookback));
  const range = maxH - minL;
  if (range <= 0) return null;
  const fib = {
    level_0: minL,
    level_236: minL + range * 0.236,
    level_382: minL + range * 0.382,
    level_500: minL + range * 0.5,
    level_618: minL + range * 0.618,
    level_786: minL + range * 0.786,
    level_1000: maxH,
    ext_1272: minL + range * 1.272,
    ext_1618: minL + range * 1.618,
    nearestLevel: 0,
    distanceToNearestPct: 0,
    isAtKeyLevel: false
  };
  const levels = [fib.level_236, fib.level_382, fib.level_500, fib.level_618, fib.level_786];
  let minDist = Infinity, nearest = 0;
  for (const lv of levels) {
    const d = Math.abs(currentPrice - lv);
    if (d < minDist) { minDist = d; nearest = lv; }
  }
  fib.nearestLevel = nearest;
  fib.distanceToNearestPct = (minDist / currentPrice) * 100;
  fib.isAtKeyLevel = fib.distanceToNearestPct < 1.5;
  return fib;
}
