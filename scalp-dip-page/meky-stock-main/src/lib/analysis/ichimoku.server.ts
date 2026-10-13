// Ichimoku Cloud
export type IchimokuResult = {
  tenkan: number;
  kijun: number;
  senkouA: number;
  senkouB: number;
  chikou: number;
  aboveCloud: boolean;
  belowCloud: boolean;
  inCloud: boolean;
  tkCross: 'bullish' | 'bearish' | 'none';
  confidenceDelta: number;
};

const periodHL = (highs: number[], lows: number[], p: number, end: number) => {
  const h = highs.slice(end - p, end);
  const l = lows.slice(end - p, end);
  return (Math.max(...h) + Math.min(...l)) / 2;
};

export function calculateIchimoku(highs: number[], lows: number[], closes: number[]): IchimokuResult | null {
  const n = closes.length;
  if (n < 60) return null;
  const tenkan = periodHL(highs, lows, 9, n);
  const kijun = periodHL(highs, lows, 26, n);
  const senkouA = (tenkan + kijun) / 2;
  const senkouB = periodHL(highs, lows, 52, n);
  const chikou = closes[n - 1];
  const price = closes[n - 1];
  const cloudTop = Math.max(senkouA, senkouB);
  const cloudBot = Math.min(senkouA, senkouB);
  const prevTenkan = periodHL(highs, lows, 9, n - 1);
  const prevKijun = periodHL(highs, lows, 26, n - 1);
  let tkCross: 'bullish' | 'bearish' | 'none' = 'none';
  if (prevTenkan <= prevKijun && tenkan > kijun) tkCross = 'bullish';
  else if (prevTenkan >= prevKijun && tenkan < kijun) tkCross = 'bearish';
  let delta = 0;
  if (price > cloudTop) delta += 6;
  else if (price < cloudBot) delta -= 6;
  if (tkCross === 'bullish') delta += 4;
  if (tkCross === 'bearish') delta -= 4;
  return {
    tenkan, kijun, senkouA, senkouB, chikou,
    aboveCloud: price > cloudTop, belowCloud: price < cloudBot,
    inCloud: price >= cloudBot && price <= cloudTop,
    tkCross, confidenceDelta: delta
  };
}
