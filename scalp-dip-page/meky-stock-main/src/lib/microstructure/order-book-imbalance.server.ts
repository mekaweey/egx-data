/**
 * #8 Market Microstructure: bid-ask spread و order book imbalance من OHLC.
 */
export interface MicrostructureSignal { spread: number; imbalance: number; pressure: "BUY" | "SELL" | "NEUTRAL" }

export function estimateMicrostructure(open: number, high: number, low: number, close: number): MicrostructureSignal {
  const spread = (high - low) / Math.max(close, 0.01);
  const upperWick = high - Math.max(open, close);
  const lowerWick = Math.min(open, close) - low;
  const body = Math.abs(close - open);
  const imbalance = (lowerWick - upperWick) / Math.max(body + upperWick + lowerWick, 0.01);
  const pressure = imbalance > 0.3 ? "BUY" : imbalance < -0.3 ? "SELL" : "NEUTRAL";
  return { spread, imbalance, pressure };
}