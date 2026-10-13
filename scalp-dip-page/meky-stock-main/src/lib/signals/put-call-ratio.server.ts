/**
 * Put/Call Ratio: contrarian sentiment indicator from options market.
 */

export interface PCRSignal {
  ratio: number;
  zScore: number;
  signal: "bullish_contrarian" | "bearish_contrarian" | "neutral";
  extremity: "extreme_fear" | "fear" | "neutral" | "greed" | "extreme_greed";
}

export function calculatePCR(putVolume: number, callVolume: number): number {
  return callVolume === 0 ? 0 : putVolume / callVolume;
}

export function analyzePCR(currentPCR: number, historicalPCR: number[]): PCRSignal {
  const mean = historicalPCR.reduce((a, b) => a + b, 0) / Math.max(historicalPCR.length, 1);
  const std = Math.sqrt(historicalPCR.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(historicalPCR.length, 1));
  const z = std === 0 ? 0 : (currentPCR - mean) / std;

  let signal: PCRSignal["signal"] = "neutral";
  if (z > 2) signal = "bullish_contrarian"; // extreme put buying = bottom
  else if (z < -2) signal = "bearish_contrarian"; // extreme call buying = top

  let extremity: PCRSignal["extremity"] = "neutral";
  if (currentPCR > 1.2) extremity = "extreme_fear";
  else if (currentPCR > 1.0) extremity = "fear";
  else if (currentPCR < 0.5) extremity = "extreme_greed";
  else if (currentPCR < 0.7) extremity = "greed";

  return { ratio: currentPCR, zScore: z, signal, extremity };
}