import type { Candle } from "@/lib/market-data/types";

export type SectorStats = {
  sector: string;
  count: number;
  change_5d_pct: number;
  change_20d_pct: number;
  trend: "up" | "down" | "flat";
};

export type SectorContext = {
  bySymbol: Map<string, SectorStats>;
  bySector: Map<string, SectorStats>;
};

/**
 * Compute average % change over 5d / 20d for every sector, then expose a
 * per-symbol lookup so the AI prompt and the rule-gate can both consume
 * "is this stock's sector trending up or down?" cheaply.
 */
export function computeSectorMomentum(
  stocks: Array<{ symbol: string; sector_ar?: string | null }>,
  history: Map<string, Candle[]>,
): SectorContext {
  const sectorChanges = new Map<string, { c5: number[]; c20: number[] }>();
  const symbolSector = new Map<string, string>();

  for (const s of stocks) {
    const sector = s.sector_ar?.trim() || "غير محدد";
    symbolSector.set(s.symbol.toUpperCase(), sector);
    const candles = history.get(s.symbol.toUpperCase());
    if (!candles || candles.length < 21) continue;
    const last = candles[candles.length - 1].close;
    const c5 = candles[candles.length - 6]?.close;
    const c20 = candles[candles.length - 21]?.close;
    const acc = sectorChanges.get(sector) ?? { c5: [], c20: [] };
    if (c5) acc.c5.push(((last - c5) / c5) * 100);
    if (c20) acc.c20.push(((last - c20) / c20) * 100);
    sectorChanges.set(sector, acc);
  }

  const bySector = new Map<string, SectorStats>();
  for (const [sector, agg] of sectorChanges.entries()) {
    const avg5 = agg.c5.length ? agg.c5.reduce((a, b) => a + b, 0) / agg.c5.length : 0;
    const avg20 = agg.c20.length ? agg.c20.reduce((a, b) => a + b, 0) / agg.c20.length : 0;
    let trend: SectorStats["trend"] = "flat";
    if (avg5 > 1.5) trend = "up";
    else if (avg5 < -1.5) trend = "down";
    bySector.set(sector, {
      sector,
      count: agg.c5.length,
      change_5d_pct: +avg5.toFixed(2),
      change_20d_pct: +avg20.toFixed(2),
      trend,
    });
  }

  const bySymbol = new Map<string, SectorStats>();
  for (const [sym, sector] of symbolSector.entries()) {
    const stats = bySector.get(sector);
    if (stats) bySymbol.set(sym, stats);
  }

  return { bySymbol, bySector };
}