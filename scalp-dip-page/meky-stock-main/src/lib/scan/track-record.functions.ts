import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TrackRecordTrade = {
  id: string;
  symbol: string;
  signal: string;
  confidence: number;
  outcome: string;
  price_at_reco: number;
  outcome_price: number | null;
  realized_pct: number | null;
  created_at: string;
  outcome_at: string | null;
};

export type TrackRecordSummary = {
  window_days: number;
  total: number;
  wins: number;
  losses: number;
  expired: number;
  win_rate: number;
  avg_win_pct: number;
  avg_loss_pct: number;
  expectancy_pct: number;
  total_return_pct: number; // sum of realized_pct (rough portfolio if equal-weighted 1% each)
  best: number;
  worst: number;
};

export type TrackRecordPayload = {
  buy_30d: TrackRecordSummary;
  buy_90d: TrackRecordSummary;
  buy_all: TrackRecordSummary;
  recent: TrackRecordTrade[];
  equity_curve: Array<{ date: string; cumulative_pct: number }>;
};

function summarize(
  rows: Array<{ outcome: string; realized_pct: number | null }>,
  windowDays: number,
): TrackRecordSummary {
  const filtered = rows.filter((r) => r.realized_pct != null);
  const wins = filtered.filter((r) => r.outcome === "target_hit");
  const losses = filtered.filter((r) => r.outcome === "stop_hit");
  const expired = filtered.filter((r) => r.outcome === "expired");
  const winPcts = wins.map((r) => Number(r.realized_pct));
  const lossPcts = losses.map((r) => Number(r.realized_pct));
  const allPcts = filtered.map((r) => Number(r.realized_pct));
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0);
  const total = filtered.length;
  const winRate = total ? (wins.length / total) * 100 : 0;
  const avgWin = avg(winPcts);
  const avgLoss = avg(lossPcts);
  const expectancy = (winRate / 100) * avgWin + (1 - winRate / 100) * avgLoss;
  return {
    window_days: windowDays,
    total,
    wins: wins.length,
    losses: losses.length,
    expired: expired.length,
    win_rate: +winRate.toFixed(1),
    avg_win_pct: +avgWin.toFixed(2),
    avg_loss_pct: +avgLoss.toFixed(2),
    expectancy_pct: +expectancy.toFixed(2),
    total_return_pct: +sum(allPcts).toFixed(2),
    best: allPcts.length ? +Math.max(...allPcts).toFixed(2) : 0,
    worst: allPcts.length ? +Math.min(...allPcts).toFixed(2) : 0,
  };
}

export const getTrackRecord = createServerFn({ method: "GET" }).handler(
  async (): Promise<TrackRecordPayload> => {
    const { data: all } = await supabaseAdmin
      .from("recommendations")
      .select("id, symbol, signal, confidence, outcome, price_at_reco, outcome_price, realized_pct, created_at, outcome_at")
      .neq("outcome", "pending")
      .in("signal", ["buy", "strong_buy"])
      .order("created_at", { ascending: false })
      .limit(2000);

    const rows = all ?? [];
    const now = Date.now();
    const within = (days: number) =>
      rows.filter((r) => now - new Date(r.created_at).getTime() <= days * 86_400_000);

    // Equity curve from oldest to newest (cumulative sum of realized_pct).
    const chrono = [...rows].reverse();
    let cum = 0;
    const equity = chrono.map((r) => {
      cum += Number(r.realized_pct ?? 0);
      return {
        date: (r.outcome_at ?? r.created_at).slice(0, 10),
        cumulative_pct: +cum.toFixed(2),
      };
    });

    return {
      buy_30d: summarize(within(30), 30),
      buy_90d: summarize(within(90), 90),
      buy_all: summarize(rows, 9999),
      recent: rows.slice(0, 30).map((r) => ({
        id: r.id,
        symbol: r.symbol,
        signal: r.signal,
        confidence: r.confidence,
        outcome: r.outcome,
        price_at_reco: Number(r.price_at_reco),
        outcome_price: r.outcome_price != null ? Number(r.outcome_price) : null,
        realized_pct: r.realized_pct != null ? Number(r.realized_pct) : null,
        created_at: r.created_at,
        outcome_at: r.outcome_at,
      })),
      equity_curve: equity,
    };
  },
);