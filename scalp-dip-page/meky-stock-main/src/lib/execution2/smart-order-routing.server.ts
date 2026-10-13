/**
 * Smart Order Routing Simulator — splits an order across venues to minimize
 * total cost (fees + expected slippage).
 */
export interface Venue {
  name: string;
  availableLiquidity: number;
  feeBps: number;
  expectedSlippageBps: number;
}

export interface RoutingDecision {
  venue: string;
  shares: number;
  costBps: number;
}

export function route(totalShares: number, venues: Venue[]): RoutingDecision[] {
  const sorted = [...venues].sort(
    (a, b) => a.feeBps + a.expectedSlippageBps - (b.feeBps + b.expectedSlippageBps),
  );
  const out: RoutingDecision[] = [];
  let remaining = totalShares;
  for (const v of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, v.availableLiquidity);
    if (take <= 0) continue;
    out.push({ venue: v.name, shares: take, costBps: v.feeBps + v.expectedSlippageBps });
    remaining -= take;
  }
  return out;
}

export function totalCostBps(decisions: RoutingDecision[]): number {
  const total = decisions.reduce((s, d) => s + d.shares, 0);
  if (total === 0) return 0;
  return decisions.reduce((s, d) => s + d.shares * d.costBps, 0) / total;
}