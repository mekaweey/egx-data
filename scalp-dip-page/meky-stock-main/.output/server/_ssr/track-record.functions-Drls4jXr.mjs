import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function summarize(rows, windowDays) {
  const filtered = rows.filter((r) => r.realized_pct != null);
  const wins = filtered.filter((r) => r.outcome === "target_hit");
  const losses = filtered.filter((r) => r.outcome === "stop_hit");
  const expired = filtered.filter((r) => r.outcome === "expired");
  const winPcts = wins.map((r) => Number(r.realized_pct));
  const lossPcts = losses.map((r) => Number(r.realized_pct));
  const allPcts = filtered.map((r) => Number(r.realized_pct));
  const sum = (a) => a.reduce((x, y) => x + y, 0);
  const avg = (a) => a.length ? sum(a) / a.length : 0;
  const total = filtered.length;
  const winRate = total ? wins.length / total * 100 : 0;
  const avgWin = avg(winPcts);
  const avgLoss = avg(lossPcts);
  const expectancy = winRate / 100 * avgWin + (1 - winRate / 100) * avgLoss;
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
    worst: allPcts.length ? +Math.min(...allPcts).toFixed(2) : 0
  };
}
const getTrackRecord_createServerFn_handler = createServerRpc({
  id: "9a98e3db8e399a746106cfbe61c69d7050daefbec932b9f7b569fb2351504e0b",
  name: "getTrackRecord",
  filename: "src/lib/scan/track-record.functions.ts"
}, (opts) => getTrackRecord.__executeServer(opts));
const getTrackRecord = createServerFn({
  method: "GET"
}).handler(getTrackRecord_createServerFn_handler, async () => {
  const {
    data: all
  } = await supabaseAdmin.from("recommendations").select("id, symbol, signal, confidence, outcome, price_at_reco, outcome_price, realized_pct, created_at, outcome_at").neq("outcome", "pending").in("signal", ["buy", "strong_buy"]).order("created_at", {
    ascending: false
  }).limit(2e3);
  const rows = all ?? [];
  const now = Date.now();
  const within = (days) => rows.filter((r) => now - new Date(r.created_at).getTime() <= days * 864e5);
  const chrono = [...rows].reverse();
  let cum = 0;
  const equity = chrono.map((r) => {
    cum += Number(r.realized_pct ?? 0);
    return {
      date: (r.outcome_at ?? r.created_at).slice(0, 10),
      cumulative_pct: +cum.toFixed(2)
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
      outcome_at: r.outcome_at
    })),
    equity_curve: equity
  };
});
export {
  getTrackRecord_createServerFn_handler
};
