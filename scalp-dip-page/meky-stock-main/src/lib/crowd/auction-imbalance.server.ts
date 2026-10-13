/**
 * Opening / Closing Auction Imbalance — directional pressure signal.
 */
export interface AuctionSnapshot {
  buyVolume: number;
  sellVolume: number;
  indicativePrice: number;
  referencePrice: number;
}

export function imbalanceRatio(a: AuctionSnapshot): number {
  const total = a.buyVolume + a.sellVolume;
  if (total === 0) return 0;
  return (a.buyVolume - a.sellVolume) / total;
}

export function indicativeMovePct(a: AuctionSnapshot): number {
  if (a.referencePrice === 0) return 0;
  return (a.indicativePrice - a.referencePrice) / a.referencePrice;
}

export function signal(a: AuctionSnapshot): "bullish" | "bearish" | "neutral" {
  const r = imbalanceRatio(a);
  const m = indicativeMovePct(a);
  if (r > 0.2 && m > 0.005) return "bullish";
  if (r < -0.2 && m < -0.005) return "bearish";
  return "neutral";
}