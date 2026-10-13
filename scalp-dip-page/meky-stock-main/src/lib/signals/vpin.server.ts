/**
 * Volume-Synchronized Probability of Informed Trading (VPIN).
 */
export interface VolumeBucket {
  buyVolume: number;
  sellVolume: number;
}

export function bucketize(
  trades: Array<{ price: number; volume: number; prevPrice: number }>,
  bucketSize: number,
): VolumeBucket[] {
  const buckets: VolumeBucket[] = [];
  let cur: VolumeBucket = { buyVolume: 0, sellVolume: 0 };
  let acc = 0;
  for (const t of trades) {
    const isBuy = t.price >= t.prevPrice;
    if (isBuy) cur.buyVolume += t.volume;
    else cur.sellVolume += t.volume;
    acc += t.volume;
    if (acc >= bucketSize) {
      buckets.push(cur);
      cur = { buyVolume: 0, sellVolume: 0 };
      acc = 0;
    }
  }
  if (cur.buyVolume + cur.sellVolume > 0) buckets.push(cur);
  return buckets;
}

export function vpin(buckets: VolumeBucket[]): number {
  if (buckets.length === 0) return 0;
  const sum = buckets.reduce((s, b) => s + Math.abs(b.buyVolume - b.sellVolume), 0);
  const totalVol = buckets.reduce((s, b) => s + b.buyVolume + b.sellVolume, 0);
  return totalVol === 0 ? 0 : sum / totalVol;
}

export function toxicityLabel(v: number): "low" | "elevated" | "high" {
  if (v < 0.4) return "low";
  if (v < 0.6) return "elevated";
  return "high";
}