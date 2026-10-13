/**
 * Signal Fusion Layer — aggregates microstructure, signals, and altdata
 * into a normalized feature vector.
 */
export interface RawSignalGroup {
  group: "microstructure" | "signals" | "altdata" | "fundamentals";
  features: Record<string, number>;
}

export interface FusedVector {
  keys: string[];
  values: number[];
  groupMeans: Record<string, number>;
}

function zScore(x: number, mean: number, std: number): number {
  if (std === 0) return 0;
  return (x - mean) / std;
}

export function fuse(groups: RawSignalGroup[]): FusedVector {
  const keys: string[] = [];
  const values: number[] = [];
  const groupMeans: Record<string, number> = {};
  for (const g of groups) {
    const entries = Object.entries(g.features);
    const nums = entries.map(([, v]) => v);
    const mean = nums.reduce((s, v) => s + v, 0) / Math.max(1, nums.length);
    const variance = nums.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(1, nums.length);
    const std = Math.sqrt(variance);
    groupMeans[g.group] = mean;
    for (const [k, v] of entries) {
      keys.push(`${g.group}:${k}`);
      values.push(zScore(v, mean, std));
    }
  }
  return { keys, values, groupMeans };
}