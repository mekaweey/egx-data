/**
 * Iceberg Order Detection — detects repeated refills at the same price.
 */
export interface OrderBookSnap {
  timestamp: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
}

export interface IcebergAlert {
  side: "bid" | "ask";
  price: number;
  refillCount: number;
  estimatedHiddenSize: number;
}

export function detectIcebergs(snaps: OrderBookSnap[], minRefills: number = 5): IcebergAlert[] {
  const alerts: IcebergAlert[] = [];
  for (const side of ["bid", "ask"] as const) {
    const groups = new Map<number, { count: number; totalSize: number }>();
    for (let i = 1; i < snaps.length; i++) {
      const cur = snaps[i];
      const prev = snaps[i - 1];
      const price = side === "bid" ? cur.bidPrice : cur.askPrice;
      const prevSize = side === "bid" ? prev.bidSize : prev.askSize;
      const curSize = side === "bid" ? cur.bidSize : cur.askSize;
      if (price === (side === "bid" ? prev.bidPrice : prev.askPrice) && curSize > prevSize * 0.8 && prevSize > 0 && curSize >= prevSize) {
        const g = groups.get(price) ?? { count: 0, totalSize: 0 };
        g.count++;
        g.totalSize += curSize;
        groups.set(price, g);
      }
    }
    for (const [price, g] of groups) {
      if (g.count >= minRefills) {
        alerts.push({ side, price, refillCount: g.count, estimatedHiddenSize: g.totalSize });
      }
    }
  }
  return alerts;
}