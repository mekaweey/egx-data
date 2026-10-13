/**
 * Risk Parity portfolio sizing — allocate equal risk contribution per pick
 * instead of equal capital. Uses ATR as volatility proxy.
 */
export interface PickRisk {
  symbol: string;
  price: number;
  atr: number;
  confidence: number;
}
export interface SizedPick extends PickRisk {
  weight: number;        // fraction of portfolio capital [0,1]
  riskContribution: number;
}

export function riskParitySizing(
  picks: PickRisk[],
  totalRiskBudgetPct = 0.10, // 10% total portfolio vol budget
): SizedPick[] {
  if (picks.length === 0) return [];
  // Inverse-volatility weight: each pick gets weight ∝ 1/atr*confidence.
  const inv = picks.map((p) => {
    const vol = Math.max(1e-6, p.atr / Math.max(1e-6, p.price));
    const conf = Math.max(0.1, p.confidence / 100);
    return conf / vol;
  });
  const sumInv = inv.reduce((s, x) => s + x, 0);
  if (sumInv <= 0) return picks.map((p) => ({ ...p, weight: 1 / picks.length, riskContribution: 0 }));

  return picks.map((p, i) => {
    const w = inv[i] / sumInv;
    const cappedW = Math.min(0.25, w); // never more than 25% in one pick
    const vol = Math.max(1e-6, p.atr / Math.max(1e-6, p.price));
    return {
      ...p,
      weight: cappedW * totalRiskBudgetPct / vol,
      riskContribution: cappedW,
    };
  });
}