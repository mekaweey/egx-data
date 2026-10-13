/**
 * Insider Transactions analyzer (Form 4 style).
 */
export interface InsiderTransaction {
  insiderRole: "CEO" | "CFO" | "Director" | "Officer" | "Other";
  action: "buy" | "sell";
  shares: number;
  price: number;
  filedAt: string;
}

const ROLE_WEIGHT: Record<InsiderTransaction["insiderRole"], number> = {
  CEO: 3,
  CFO: 2.5,
  Director: 1.5,
  Officer: 1.2,
  Other: 1,
};

export function insiderScore(txs: InsiderTransaction[], windowDays: number = 90): number {
  const cutoff = Date.now() - windowDays * 86400_000;
  const recent = txs.filter((t) => new Date(t.filedAt).getTime() >= cutoff);
  if (recent.length === 0) return 0;
  let score = 0;
  for (const t of recent) {
    const w = ROLE_WEIGHT[t.insiderRole];
    const val = t.shares * t.price * w;
    score += t.action === "buy" ? val : -val;
  }
  const sign = Math.sign(score);
  const mag = Math.log10(Math.abs(score) + 1);
  return sign * Math.tanh(mag / 7);
}