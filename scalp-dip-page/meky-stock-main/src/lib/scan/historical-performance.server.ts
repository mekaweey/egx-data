import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type HistoricalPerformance = {
  total: number;
  profit: number;
  loss: number;
  pending: number;
  winRate: number; // 0-100
  avgRealizedPct: number; // average realized_pct across closed
  avgWin: number;
  avgLoss: number;
};

/**
 * Reads the last N closed recommendations and summarizes performance.
 * Used as feedback signal in the AI prompt so future picks learn from past results.
 */
export async function getRecentPerformance(limit = 40): Promise<HistoricalPerformance | null> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("outcome, realized_pct, signal")
    .in("signal", ["buy", "strong_buy"])
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!data || data.length === 0) return null;

  const closed = data.filter(
    (r) => r.outcome === "target_hit" || r.outcome === "stop_hit" || r.outcome === "expired" || r.outcome === "manual_close",
  );
  const pending = data.length - closed.length;
  const profit = closed.filter((r) => Number(r.realized_pct ?? 0) > 0).length;
  const loss = closed.length - profit;
  const wins = closed.filter((r) => Number(r.realized_pct ?? 0) > 0);
  const losses = closed.filter((r) => Number(r.realized_pct ?? 0) <= 0);
  const avg = (arr: typeof closed) =>
    arr.length === 0 ? 0 : arr.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / arr.length;

  return {
    total: data.length,
    profit,
    loss,
    pending,
    winRate: closed.length > 0 ? +((profit / closed.length) * 100).toFixed(1) : 0,
    avgRealizedPct: +avg(closed).toFixed(2),
    avgWin: +avg(wins).toFixed(2),
    avgLoss: +avg(losses).toFixed(2),
  };
}
