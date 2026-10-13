/**
 * #7 Wyckoff Method Auto-Detection.
 */
export type WyckoffPhase = "ACCUMULATION" | "MARKUP" | "DISTRIBUTION" | "MARKDOWN" | "UNKNOWN";

export function detectWyckoffPhase(closes: number[], volumes: number[]): { phase: WyckoffPhase; confidence: number } {
  if (closes.length < 30) return { phase: "UNKNOWN", confidence: 0 };
  const recent = closes.slice(-30);
  const recentVol = volumes.slice(-30);
  const high = Math.max(...recent);
  const low = Math.min(...recent);
  const range = high - low;
  const last = recent[recent.length - 1];
  const avgVol = recentVol.reduce((a, b) => a + b, 0) / recentVol.length;
  const recentVolAvg = recentVol.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const volSurge = recentVolAvg / Math.max(avgVol, 1);
  const position = (last - low) / Math.max(range, 0.01);
  const rangeRatio = range / Math.max(last, 0.01);
  if (rangeRatio < 0.05 && position < 0.3 && volSurge > 1.3) return { phase: "ACCUMULATION", confidence: 75 };
  if (rangeRatio < 0.05 && position > 0.7 && volSurge > 1.3) return { phase: "DISTRIBUTION", confidence: 75 };
  if (rangeRatio > 0.1 && position > 0.6) return { phase: "MARKUP", confidence: 60 };
  if (rangeRatio > 0.1 && position < 0.4) return { phase: "MARKDOWN", confidence: 60 };
  return { phase: "UNKNOWN", confidence: 30 };
}