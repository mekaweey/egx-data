import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PerfStats = {
  totalRecos: number;
  closedRecos: number;
  wins: number;
  losses: number;
  winRate: number;
  avgWinPct: number;
  avgLossPct: number;
  bestPick: { symbol: string; pct: number } | null;
  worstPick: { symbol: string; pct: number } | null;
  expectancy: number;
  byTier: { gold: number; silver: number; goldWinRate: number };
  last30dCount: number;
  generatedAt: string;
};

export const getPerformanceStats = createServerFn({ method: "GET" }).handler(
  async (): Promise<PerfStats> => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: all } = await supabaseAdmin
      .from("recommendations")
      .select("symbol, confidence, outcome, realized_pct, created_at")
      .gte("created_at", thirtyDaysAgo);

    const recos = all ?? [];
    const closed = recos.filter((r) => r.outcome && r.outcome !== "pending");
    const wins = closed.filter((r) => Number(r.realized_pct ?? 0) > 0);
    const losses = closed.filter((r) => Number(r.realized_pct ?? 0) <= 0);

    const avgWin = wins.length
      ? wins.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / wins.length
      : 0;
    const avgLoss = losses.length
      ? losses.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / losses.length
      : 0;

    let best: { symbol: string; pct: number } | null = null;
    let worst: { symbol: string; pct: number } | null = null;
    for (const r of closed) {
      const p = Number(r.realized_pct ?? 0);
      if (!best || p > best.pct) best = { symbol: String(r.symbol), pct: p };
      if (!worst || p < worst.pct) worst = { symbol: String(r.symbol), pct: p };
    }

    const winRate = closed.length ? wins.length / closed.length : 0;
    const expectancy = winRate * avgWin + (1 - winRate) * avgLoss;

    const gold = recos.filter((r) => Number(r.confidence ?? 0) >= 70);
    const silver = recos.filter((r) => Number(r.confidence ?? 0) < 70);
    const goldClosed = gold.filter((r) => r.outcome && r.outcome !== "pending");
    const goldWins = goldClosed.filter((r) => Number(r.realized_pct ?? 0) > 0);
    const goldWinRate = goldClosed.length ? goldWins.length / goldClosed.length : 0;

    return {
      totalRecos: recos.length,
      closedRecos: closed.length,
      wins: wins.length,
      losses: losses.length,
      winRate,
      avgWinPct: avgWin,
      avgLossPct: avgLoss,
      bestPick: best,
      worstPick: worst,
      expectancy,
      byTier: { gold: gold.length, silver: silver.length, goldWinRate },
      last30dCount: recos.length,
      generatedAt: new Date().toISOString(),
    };
  },
);