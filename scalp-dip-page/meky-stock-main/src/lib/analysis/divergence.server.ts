// RSI/MACD divergence auto-detection
export type DivergenceResult = {
  bullishRSI: boolean;
  bearishRSI: boolean;
  bullishMACD: boolean;
  bearishMACD: boolean;
  strength: number; // 0-100
  confidenceDelta: number;
};

export function detectDivergence(
  closes: number[],
  rsiSeries: number[],
  macdSeries: number[]
): DivergenceResult {
  const result: DivergenceResult = {
    bullishRSI: false, bearishRSI: false,
    bullishMACD: false, bearishMACD: false,
    strength: 0, confidenceDelta: 0
  };
  if (closes.length < 20 || rsiSeries.length < 20) return result;
  const n = closes.length;
  const recent = closes.slice(-15);
  const recentRSI = rsiSeries.slice(-15);
  const recentMACD = macdSeries.slice(-15);
  // Find two lows / two highs in price
  const priceMinIdx1 = recent.indexOf(Math.min(...recent.slice(0, 7)));
  const priceMinIdx2 = 7 + recent.slice(7).indexOf(Math.min(...recent.slice(7)));
  const priceMaxIdx1 = recent.indexOf(Math.max(...recent.slice(0, 7)));
  const priceMaxIdx2 = 7 + recent.slice(7).indexOf(Math.max(...recent.slice(7)));
  // Bullish divergence: price lower low, RSI higher low
  if (recent[priceMinIdx2] < recent[priceMinIdx1] && recentRSI[priceMinIdx2] > recentRSI[priceMinIdx1]) {
    result.bullishRSI = true;
    result.confidenceDelta += 5;
  }
  if (recent[priceMaxIdx2] > recent[priceMaxIdx1] && recentRSI[priceMaxIdx2] < recentRSI[priceMaxIdx1]) {
    result.bearishRSI = true;
    result.confidenceDelta -= 5;
  }
  if (recent[priceMinIdx2] < recent[priceMinIdx1] && recentMACD[priceMinIdx2] > recentMACD[priceMinIdx1]) {
    result.bullishMACD = true;
    result.confidenceDelta += 4;
  }
  if (recent[priceMaxIdx2] > recent[priceMaxIdx1] && recentMACD[priceMaxIdx2] < recentMACD[priceMaxIdx1]) {
    result.bearishMACD = true;
    result.confidenceDelta -= 4;
  }
  result.strength = Math.abs(result.confidenceDelta) * 10;
  return result;
}
