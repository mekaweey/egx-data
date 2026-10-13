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
const STRATEGY = "scalp-mr15-fresh";
const getScalpFreshToday_createServerFn_handler = createServerRpc({
  id: "7244383c55a32f355e55d23b1c56f8985081469d73ba66aabbc0adcdccaf02f2",
  name: "getScalpFreshToday",
  filename: "src/routes/scalp-fresh.tsx"
}, (opts) => getScalpFreshToday.__executeServer(opts));
const getScalpFreshToday = createServerFn({
  method: "GET"
}).handler(getScalpFreshToday_createServerFn_handler, async () => {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const {
    data,
    error
  } = await supabaseAdmin.from("paper_trades").select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_ts, exit_reason, pnl, status, trade_date").eq("trade_date", today).eq("strategy", STRATEGY).order("entry_ts", {
    ascending: false
  });
  if (error) throw error;
  const trades = data || [];
  const openSyms = Array.from(new Set(trades.filter((t) => t.status === "open").map((t) => t.symbol)));
  if (openSyms.length) {
    const dayStart = `${today}T07:00:00Z`;
    const {
      data: ticks
    } = await supabaseAdmin.from("live_ticks").select("symbol, price, ts").in("symbol", openSyms).gte("ts", dayStart).order("ts", {
      ascending: false
    });
    const latest = /* @__PURE__ */ new Map();
    for (const t of ticks || []) {
      if (!latest.has(t.symbol)) latest.set(t.symbol, {
        price: Number(t.price),
        ts: t.ts
      });
    }
    for (const t of trades) {
      const l = latest.get(t.symbol);
      if (l) {
        t.current_price = l.price;
        t.current_price_ts = l.ts;
      }
    }
  }
  return {
    trades,
    date: today
  };
});
export {
  getScalpFreshToday_createServerFn_handler
};
