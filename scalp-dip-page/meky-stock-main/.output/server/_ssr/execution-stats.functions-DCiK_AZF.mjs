import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
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
const getExecutionStats_createServerFn_handler = createServerRpc({
  id: "38d53129308893778ead5c52e194740703847d4fa050242802f271c456673a53",
  name: "getExecutionStats",
  filename: "src/lib/execution-stats.functions.ts"
}, (opts) => getExecutionStats.__executeServer(opts));
const getExecutionStats = createServerFn({
  method: "GET"
}).handler(getExecutionStats_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const since = /* @__PURE__ */ new Date();
  since.setHours(0, 0, 0, 0);
  const sinceIso = since.toISOString();
  const [snapCount, orders, recent] = await Promise.all([supabaseAdmin.from("orderbook_snapshots").select("id", {
    count: "exact",
    head: true
  }).gte("ts", sinceIso), supabaseAdmin.from("order_lifecycle").select("status, order_type").gte("placed_at", sinceIso), supabaseAdmin.from("fill_analysis_v").select("order_id, symbol, side, order_type, status, requested_price, requested_qty, fill_price_avg, filled_qty, placed_at, time_to_first_fill_ms, slippage_vs_touch, best_bid_at_placement, best_ask_at_placement").order("placed_at", {
    ascending: false
  }).limit(20)]);
  const by_status = {};
  const by_type = {};
  for (const o of orders.data ?? []) {
    by_status[o.status] = (by_status[o.status] ?? 0) + 1;
    by_type[o.order_type] = (by_type[o.order_type] ?? 0) + 1;
  }
  const fills = (recent.data ?? []).filter((r) => r.time_to_first_fill_ms != null);
  const avgTtff = fills.length ? fills.reduce((s, r) => s + Number(r.time_to_first_fill_ms), 0) / fills.length : null;
  const slips = (recent.data ?? []).filter((r) => r.slippage_vs_touch != null);
  const avgSlip = slips.length ? slips.reduce((s, r) => s + Number(r.slippage_vs_touch), 0) / slips.length : null;
  return {
    snapshots_today: snapCount.count ?? 0,
    orders_today: (orders.data ?? []).length,
    orders_by_status: by_status,
    orders_by_type: by_type,
    avg_time_to_first_fill_ms: avgTtff,
    avg_slippage_vs_touch: avgSlip,
    recent_orders: (recent.data ?? []).map((r) => ({
      id: r.order_id,
      symbol: r.symbol,
      side: r.side,
      order_type: r.order_type,
      status: r.status,
      requested_price: r.requested_price,
      requested_qty: Number(r.requested_qty),
      fill_price_avg: r.fill_price_avg,
      filled_qty: r.filled_qty,
      placed_at: r.placed_at,
      time_to_first_fill_ms: r.time_to_first_fill_ms,
      slippage_vs_touch: r.slippage_vs_touch,
      best_bid_at_placement: r.best_bid_at_placement,
      best_ask_at_placement: r.best_ask_at_placement
    }))
  };
});
export {
  getExecutionStats_createServerFn_handler
};
