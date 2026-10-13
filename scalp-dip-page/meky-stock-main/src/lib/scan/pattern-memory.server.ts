import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SymbolMemory = {
  symbol: string;
  total: number;
  wins: number;
  winRate: number; // 0..1
  avgReturn: number; // %
  avgWinPct: number; // avg of winners (positive %)
  avgLossPct: number; // avg of losers (positive number, magnitude)
  confidenceDelta: number; // points to add/subtract from finalConfidence
};

/**
 * Per-symbol historical performance.
 * Each stock has its own personality — some respond well to our system,
 * others don't. Track the realized outcomes and use them as a small prior.
 */
export async function loadSymbolMemory(): Promise<Map<string, SymbolMemory>> {
  const { data } = await supabaseAdmin
    .from("recommendations")
    .select("symbol, outcome, realized_pct")
    .in("outcome", ["target_hit", "stop_hit", "expired"])
    .in("signal", ["buy", "strong_buy"])
    .limit(3000);

  const rows: { symbol: string; outcome: string | null; realized_pct: number | null }[] = (data ?? []) as any;

  // Bootstrap من backtest_trades لو عينة التوصيات الحقيقية ضعيفة
  if (rows.length < 300) {
    const { data: bt } = await supabaseAdmin
      .from("backtest_trades")
      .select("symbol, pnl_pct, signal, exit_reason")
      .not("exit_reason", "is", null)
      .in("signal", ["buy", "strong_buy"])
      .limit(5000);
    for (const r of bt ?? []) {
      const realized = Number(r.pnl_pct ?? 0);
      rows.push({
        symbol: r.symbol,
        outcome: realized > 0 ? "target_hit" : "stop_hit",
        realized_pct: realized,
      });
    }
  }

  const grouped = new Map<string, { wins: number; total: number; sumReturn: number; sumWin: number; sumLoss: number; lossCount: number }>();
  for (const r of rows) {
    const g = grouped.get(r.symbol) ?? { wins: 0, total: 0, sumReturn: 0, sumWin: 0, sumLoss: 0, lossCount: 0 };
    g.total++;
    const realized = Number(r.realized_pct ?? 0);
    g.sumReturn += realized;
    if (r.outcome === "target_hit" || realized > 0) {
      g.wins++;
      g.sumWin += Math.max(0, realized);
    } else {
      g.lossCount++;
      g.sumLoss += Math.abs(realized);
    }
    grouped.set(r.symbol, g);
  }

  const out = new Map<string, SymbolMemory>();
  for (const [symbol, g] of grouped.entries()) {
    if (g.total < 3) continue; // need minimum sample
    const winRate = g.wins / g.total;
    const avgReturn = g.sumReturn / g.total;
    // Map win rate to confidence delta. Baseline 50% → 0. 70%→+6, 30%→-6, capped ±10.
    const delta = Math.round(Math.max(-10, Math.min(10, (winRate - 0.5) * 30)));
    const avgWinPct = g.wins > 0 ? g.sumWin / g.wins : 0;
    const avgLossPct = g.lossCount > 0 ? g.sumLoss / g.lossCount : 0;
    out.set(symbol, { symbol, total: g.total, wins: g.wins, winRate, avgReturn, avgWinPct, avgLossPct, confidenceDelta: delta });
  }
  return out;
}