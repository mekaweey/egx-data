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
const getPerformanceStats_createServerFn_handler = createServerRpc({
  id: "fa89dee2a371fe9677cfc4aec0ece83ea5b862066c7641ba38b7dabb6d05b1c6",
  name: "getPerformanceStats",
  filename: "src/lib/perf/performance-stats.functions.ts"
}, (opts) => getPerformanceStats.__executeServer(opts));
const getPerformanceStats = createServerFn({
  method: "GET"
}).handler(getPerformanceStats_createServerFn_handler, async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
  const {
    data: all
  } = await supabaseAdmin.from("recommendations").select("symbol, confidence, outcome, realized_pct, created_at").gte("created_at", thirtyDaysAgo);
  const recos = all ?? [];
  const closed = recos.filter((r) => r.outcome && r.outcome !== "pending");
  const wins = closed.filter((r) => Number(r.realized_pct ?? 0) > 0);
  const losses = closed.filter((r) => Number(r.realized_pct ?? 0) <= 0);
  const avgWin = wins.length ? wins.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length ? losses.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / losses.length : 0;
  let best = null;
  let worst = null;
  for (const r of closed) {
    const p = Number(r.realized_pct ?? 0);
    if (!best || p > best.pct) best = {
      symbol: String(r.symbol),
      pct: p
    };
    if (!worst || p < worst.pct) worst = {
      symbol: String(r.symbol),
      pct: p
    };
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
    byTier: {
      gold: gold.length,
      silver: silver.length,
      goldWinRate
    },
    last30dCount: recos.length,
    generatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
export {
  getPerformanceStats_createServerFn_handler
};
