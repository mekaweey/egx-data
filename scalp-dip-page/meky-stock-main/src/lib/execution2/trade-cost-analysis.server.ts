/**
 * Trade Cost Analysis (TCA) — measure realized slippage vs benchmark.
 */
export interface ExecutedTrade {
  symbol: string;
  side: "buy" | "sell";
  shares: number;
  executionPrice: number;
  arrivalPrice: number;
  vwap: number;
  closePrice: number;
}

export interface TCAReport {
  implementationShortfallBps: number;
  vwapSlippageBps: number;
  closeSlippageBps: number;
}

function bps(realized: number, ref: number, side: "buy" | "sell"): number {
  if (ref === 0) return 0;
  const diff = side === "buy" ? realized - ref : ref - realized;
  return (diff / ref) * 10000;
}

export function analyzeTrade(t: ExecutedTrade): TCAReport {
  return {
    implementationShortfallBps: bps(t.executionPrice, t.arrivalPrice, t.side),
    vwapSlippageBps: bps(t.executionPrice, t.vwap, t.side),
    closeSlippageBps: bps(t.executionPrice, t.closePrice, t.side),
  };
}

export function aggregateTCA(trades: ExecutedTrade[]): TCAReport {
  if (trades.length === 0) return { implementationShortfallBps: 0, vwapSlippageBps: 0, closeSlippageBps: 0 };
  const totalShares = trades.reduce((s, t) => s + t.shares, 0);
  let isum = 0, vsum = 0, csum = 0;
  for (const t of trades) {
    const r = analyzeTrade(t);
    isum += r.implementationShortfallBps * t.shares;
    vsum += r.vwapSlippageBps * t.shares;
    csum += r.closeSlippageBps * t.shares;
  }
  return {
    implementationShortfallBps: isum / totalShares,
    vwapSlippageBps: vsum / totalShares,
    closeSlippageBps: csum / totalShares,
  };
}