import type { SectorContext } from "@/lib/analysis/sector-momentum.server";

export type SectorRotationReport = {
  leaders: string[]; // top 3 sectors by momentum
  laggards: string[]; // bottom 3
  rotationStrength: number; // 0..100 spread between leader and laggard
  sectorBoost: Map<string, number>; // sector → confidence delta (±8)
};

/**
 * Detect sector rotation: which sectors money is flowing into vs out of.
 * Picks in leading sectors get a small confidence boost, lagging sectors a penalty.
 */
export function detectSectorRotation(ctx: SectorContext): SectorRotationReport {
  const sectors = Array.from(ctx.bySector.entries()).map(([name, info]) => ({
    name,
    momentum: info.change_5d_pct ?? 0,
  }));
  sectors.sort((a, b) => b.momentum - a.momentum);

  const leaders = sectors.slice(0, 3).map((s) => s.name);
  const laggards = sectors.slice(-3).map((s) => s.name);
  const spread = sectors.length > 0
    ? Math.abs((sectors[0]?.momentum ?? 0) - (sectors[sectors.length - 1]?.momentum ?? 0))
    : 0;
  const rotationStrength = Math.min(100, Math.round(spread * 10));

  const boost = new Map<string, number>();
  sectors.forEach((s, i) => {
    if (i < 3) boost.set(s.name, 6 - i * 2); // +6, +4, +2
    else if (i >= sectors.length - 3) boost.set(s.name, -(6 - (sectors.length - 1 - i) * 2));
  });

  return { leaders, laggards, rotationStrength, sectorBoost: boost };
}