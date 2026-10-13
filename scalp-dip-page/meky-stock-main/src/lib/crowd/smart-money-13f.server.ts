/**
 * Smart Money 13F Tracking — track holdings deltas of top funds.
 */
export interface FundHolding {
  fund: string;
  symbol: string;
  shares: number;
  reportDate: string;
}

export interface SmartMoneySignal {
  symbol: string;
  netBuyers: number;
  netSellers: number;
  conviction: number;
}

export function computeSignals(prev: FundHolding[], current: FundHolding[]): SmartMoneySignal[] {
  const key = (h: FundHolding) => `${h.fund}|${h.symbol}`;
  const prevMap = new Map(prev.map((h) => [key(h), h.shares]));
  const symbols = new Set(current.map((h) => h.symbol));
  const out: SmartMoneySignal[] = [];
  for (const sym of symbols) {
    let buyers = 0;
    let sellers = 0;
    for (const cur of current.filter((h) => h.symbol === sym)) {
      const prevShares = prevMap.get(key(cur)) ?? 0;
      if (cur.shares > prevShares * 1.1) buyers++;
      else if (cur.shares < prevShares * 0.9) sellers++;
    }
    const total = buyers + sellers || 1;
    out.push({
      symbol: sym,
      netBuyers: buyers,
      netSellers: sellers,
      conviction: (buyers - sellers) / total,
    });
  }
  return out.sort((a, b) => b.conviction - a.conviction);
}