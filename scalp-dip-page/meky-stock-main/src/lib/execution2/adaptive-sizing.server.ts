/**
 * Adaptive Position Sizing — sizes positions by expected Sharpe and confidence.
 */
export interface SizingInput {
  expectedReturn: number;
  expectedVol: number;
  confidence: number; // 0..1
  accountEquity: number;
  maxPositionPct: number;
}

export function adaptiveSize(input: SizingInput): { dollarAmount: number; equityPct: number; expectedSharpe: number } {
  const sharpe = input.expectedVol === 0 ? 0 : input.expectedReturn / input.expectedVol;
  const baseFraction = Math.tanh(Math.max(0, sharpe) / 1.5);
  const fraction = Math.min(input.maxPositionPct, baseFraction * input.confidence);
  return {
    dollarAmount: input.accountEquity * fraction,
    equityPct: fraction,
    expectedSharpe: sharpe,
  };
}