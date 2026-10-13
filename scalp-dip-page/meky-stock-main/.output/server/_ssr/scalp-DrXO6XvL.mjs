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
const getScalpToday_createServerFn_handler = createServerRpc({
  id: "ec6a01cc7e9ce0826ad36add2a77f3017260ebf5c10affed67538e43666fceee",
  name: "getScalpToday",
  filename: "src/routes/scalp.tsx"
}, (opts) => getScalpToday.__executeServer(opts));
const getScalpToday = createServerFn({
  method: "GET"
}).handler(getScalpToday_createServerFn_handler, async () => {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const {
    data,
    error
  } = await supabaseAdmin.from("paper_trades").select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_ts, exit_reason, pnl, status, trade_date").eq("trade_date", today).eq("strategy", "scalp-mr15").order("entry_ts", {
    ascending: false
  });
  if (error) throw error;
  const trades = data || [];
  const allSyms = Array.from(new Set(trades.map((t) => t.symbol)));
  if (allSyms.length) {
    const dayStart = `${today}T07:00:00Z`;
    const byPrice = /* @__PURE__ */ new Map();
    let from = 0;
    const PAGE = 1e3;
    while (true) {
      const {
        data: ticks
      } = await supabaseAdmin.from("live_ticks").select("symbol, price, ts, source").in("symbol", allSyms).gte("ts", dayStart).order("ts", {
        ascending: true
      }).range(from, from + PAGE - 1);
      if (!ticks || ticks.length === 0) break;
      for (const r of ticks) {
        const arr = byPrice.get(r.symbol) ?? [];
        arr.push({
          ts: new Date(r.ts).getTime(),
          price: Number(r.price),
          source: r.source || "?"
        });
        byPrice.set(r.symbol, arr);
      }
      if (ticks.length < PAGE) break;
      from += PAGE;
    }
    for (const t of trades) {
      const arr = byPrice.get(t.symbol) ?? [];
      if (t.status === "open" && arr.length) {
        const last = arr[arr.length - 1];
        t.current_price = last.price;
        t.current_price_ts = new Date(last.ts).toISOString();
        t.current_price_source = last.source;
      }
      const start = new Date(t.entry_ts).getTime();
      const end = t.exit_ts ? new Date(t.exit_ts).getTime() : Date.now();
      let prev = start;
      let maxGap = 0;
      let count = 0;
      let peak = 0;
      let peakTs = 0;
      for (const tk of arr) {
        if (tk.ts < start || tk.ts > end) continue;
        const gap = (tk.ts - prev) / 1e3;
        if (gap > maxGap) maxGap = gap;
        prev = tk.ts;
        count++;
        if (tk.price > peak) {
          peak = tk.price;
          peakTs = tk.ts;
        }
      }
      const tailGap = (end - prev) / 1e3;
      if (tailGap > maxGap) maxGap = tailGap;
      t.max_gap_sec = Math.round(maxGap);
      t.tick_count = count;
      t.peak_price = peak > 0 ? peak : null;
      t.peak_price_ts = peakTs > 0 ? new Date(peakTs).toISOString() : null;
    }
  }
  return {
    trades,
    date: today
  };
});
const getScalpMr15Enabled_createServerFn_handler = createServerRpc({
  id: "9a9d8f0d8bc815a6a7580acc02c3886f7be973c40feb0a16659f9a0e69f4b289",
  name: "getScalpMr15Enabled",
  filename: "src/routes/scalp.tsx"
}, (opts) => getScalpMr15Enabled.__executeServer(opts));
const getScalpMr15Enabled = createServerFn({
  method: "GET"
}).handler(getScalpMr15Enabled_createServerFn_handler, async () => {
  const {
    data
  } = await supabaseAdmin.from("strategy_settings").select("enabled").eq("key", "scalp-mr15").maybeSingle();
  return {
    enabled: data?.enabled ?? true
  };
});
const setScalpMr15Enabled_createServerFn_handler = createServerRpc({
  id: "9c055ae5f3053e2d69092a94ef55a9ef04d8064ffcb68be04ecb8a3f4d530f0b",
  name: "setScalpMr15Enabled",
  filename: "src/routes/scalp.tsx"
}, (opts) => setScalpMr15Enabled.__executeServer(opts));
const setScalpMr15Enabled = createServerFn({
  method: "POST"
}).inputValidator((d) => d).handler(setScalpMr15Enabled_createServerFn_handler, async ({
  data
}) => {
  const {
    error
  } = await supabaseAdmin.from("strategy_settings").upsert({
    key: "scalp-mr15",
    enabled: data.enabled,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "key"
  });
  if (error) throw error;
  return {
    ok: true,
    enabled: data.enabled
  };
});
export {
  getScalpMr15Enabled_createServerFn_handler,
  getScalpToday_createServerFn_handler,
  setScalpMr15Enabled_createServerFn_handler
};
