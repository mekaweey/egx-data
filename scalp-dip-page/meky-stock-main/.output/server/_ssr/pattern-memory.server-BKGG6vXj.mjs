import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
async function loadSymbolMemory() {
  const { data } = await supabaseAdmin.from("recommendations").select("symbol, outcome, realized_pct").in("outcome", ["target_hit", "stop_hit", "expired"]).in("signal", ["buy", "strong_buy"]).limit(3e3);
  const rows = data ?? [];
  if (rows.length < 300) {
    const { data: bt } = await supabaseAdmin.from("backtest_trades").select("symbol, pnl_pct, signal, exit_reason").not("exit_reason", "is", null).in("signal", ["buy", "strong_buy"]).limit(5e3);
    for (const r of bt ?? []) {
      const realized = Number(r.pnl_pct ?? 0);
      rows.push({
        symbol: r.symbol,
        outcome: realized > 0 ? "target_hit" : "stop_hit",
        realized_pct: realized
      });
    }
  }
  const grouped = /* @__PURE__ */ new Map();
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
  const out = /* @__PURE__ */ new Map();
  for (const [symbol, g] of grouped.entries()) {
    if (g.total < 3) continue;
    const winRate = g.wins / g.total;
    const avgReturn = g.sumReturn / g.total;
    const delta = Math.round(Math.max(-10, Math.min(10, (winRate - 0.5) * 30)));
    const avgWinPct = g.wins > 0 ? g.sumWin / g.wins : 0;
    const avgLossPct = g.lossCount > 0 ? g.sumLoss / g.lossCount : 0;
    out.set(symbol, { symbol, total: g.total, wins: g.wins, winRate, avgReturn, avgWinPct, avgLossPct, confidenceDelta: delta });
  }
  return out;
}
export {
  loadSymbolMemory as l
};
