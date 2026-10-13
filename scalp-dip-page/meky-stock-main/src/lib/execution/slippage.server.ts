/**
 * #17 Slippage Modeling: تقدير الفرق بين السعر النظري والسعر الفعلي.
 */
export interface SlippageEstimate { expectedSlippagePct: number; worstCasePct: number }

export function estimateSlippage(orderSize: number, avgVolume: number, spread: number): SlippageEstimate {
  const participation = orderSize / Math.max(avgVolume, 1);
  const linear = spread * 0.5 + participation * 100 * 0.1;
  const worst = linear * 2.5;
  return { expectedSlippagePct: linear, worstCasePct: worst };
}