// Filter picks that are too correlated to each other
export type CorrelationPair = { symbolA: string; symbolB: string; correlation: number };

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const aa = a.slice(-n), bb = b.slice(-n);
  const ma = aa.reduce((s, x) => s + x, 0) / n;
  const mb = bb.reduce((s, x) => s + x, 0) / n;
  let num = 0, dA = 0, dB = 0;
  for (let i = 0; i < n; i++) {
    const da = aa[i] - ma, db = bb[i] - mb;
    num += da * db; dA += da * da; dB += db * db;
  }
  const den = Math.sqrt(dA * dB);
  return den === 0 ? 0 : num / den;
}

export function filterByCorrelation(
  picks: { symbol: string; confidence: number; returns: number[] }[],
  maxCorrelation = 0.75
): { kept: typeof picks; removed: { symbol: string; reason: string }[] } {
  const sorted = [...picks].sort((a, b) => b.confidence - a.confidence);
  const kept: typeof picks = [];
  const removed: { symbol: string; reason: string }[] = [];
  for (const p of sorted) {
    let tooCorrelated = false;
    for (const k of kept) {
      const corr = pearson(p.returns, k.returns);
      if (Math.abs(corr) > maxCorrelation) {
        removed.push({ symbol: p.symbol, reason: `correlated ${(corr * 100).toFixed(0)}% with ${k.symbol}` });
        tooCorrelated = true;
        break;
      }
    }
    if (!tooCorrelated) kept.push(p);
  }
  return { kept, removed };
}
