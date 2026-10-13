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
const getTradeLifecycleToday_createServerFn_handler = createServerRpc({
  id: "b4dca6a6a1d0ee9c7018236f4645f542f3b3c7d729d4110b3dc29858fdfd1cae",
  name: "getTradeLifecycleToday",
  filename: "src/lib/trade-ledger.functions.ts"
}, (opts) => getTradeLifecycleToday.__executeServer(opts));
const getTradeLifecycleToday = createServerFn({
  method: "GET"
}).handler(getTradeLifecycleToday_createServerFn_handler, async () => {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const {
    data: events,
    error
  } = await supabaseAdmin.from("trade_events").select("id, trade_date, symbol, strategy, paper_trade_id, position_id, pending_order_id, event_type, state, price, qty, reason, source, metadata, created_at").eq("trade_date", today).order("created_at", {
    ascending: true
  }).limit(2e3);
  if (error) throw new Error(error.message);
  const groups = /* @__PURE__ */ new Map();
  for (const e of events ?? []) {
    const key = e.paper_trade_id ? `pt:${e.paper_trade_id}` : `sym:${e.symbol}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        symbol: e.symbol,
        strategy: e.strategy,
        paper_trade_id: e.paper_trade_id,
        position_id: e.position_id,
        state: null,
        events: []
      };
      groups.set(key, g);
    }
    g.events.push(e);
    if (e.state) g.state = e.state;
    if (!g.position_id && e.position_id) g.position_id = e.position_id;
    if (!g.paper_trade_id && e.paper_trade_id) g.paper_trade_id = e.paper_trade_id;
  }
  const trades = Array.from(groups.values()).sort((a, b) => {
    const ta = a.events[0]?.created_at ?? "";
    const tb = b.events[0]?.created_at ?? "";
    return tb.localeCompare(ta);
  });
  return {
    date: today,
    trades
  };
});
const getSlippageReport_createServerFn_handler = createServerRpc({
  id: "f5774357a183095d0c25a597179b3b01e927ba34f04d6404c18aec78a044e125",
  name: "getSlippageReport",
  filename: "src/lib/trade-ledger.functions.ts"
}, (opts) => getSlippageReport.__executeServer(opts));
const getSlippageReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  date: data?.date
})).handler(getSlippageReport_createServerFn_handler, async ({
  data
}) => {
  const cairoToday = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const date = data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : cairoToday;
  const {
    data: events,
    error
  } = await supabaseAdmin.from("trade_events").select("id, trade_date, symbol, strategy, paper_trade_id, position_id, event_type, state, price, qty, reason, source, created_at").eq("trade_date", date).order("created_at", {
    ascending: true
  }).limit(5e3);
  if (error) throw new Error(error.message);
  const groups = /* @__PURE__ */ new Map();
  for (const e of events ?? []) {
    const k = e.paper_trade_id ? `pt:${e.paper_trade_id}` : `sym:${e.symbol}`;
    const arr = groups.get(k) ?? [];
    arr.push(e);
    groups.set(k, arr);
  }
  const rows = [];
  for (const [key, evs] of groups) {
    const signal = evs.find((e) => e.event_type === "SIGNAL");
    const buyFill = evs.find((e) => e.event_type === "BUY_FILLED");
    const sellQ = evs.find((e) => e.event_type === "SELL_QUEUED" || e.event_type === "SELL_REQUESTED");
    const sellFill = evs.find((e) => e.event_type === "SELL_FILLED");
    const closed = evs.find((e) => e.event_type === "PAPER_CLOSED");
    const eb = signal?.price != null ? Number(signal.price) : null;
    const ab = buyFill?.price != null ? Number(buyFill.price) : null;
    const es = sellQ?.price != null ? Number(sellQ.price) : null;
    const as_ = sellFill?.price != null ? Number(sellFill.price) : closed?.price != null ? Number(closed.price) : null;
    const buySlipPct = eb && ab ? (ab - eb) / eb * 100 : null;
    const sellSlipPct = es && as_ ? (as_ - es) / es * 100 : null;
    const buyLat = signal?.created_at && buyFill?.created_at ? Math.max(0, (new Date(buyFill.created_at).getTime() - new Date(signal.created_at).getTime()) / 1e3) : null;
    const sellLat = sellQ?.created_at && sellFill?.created_at ? Math.max(0, (new Date(sellFill.created_at).getTime() - new Date(sellQ.created_at).getTime()) / 1e3) : null;
    if (eb == null && ab == null && es == null && as_ == null) continue;
    rows.push({
      key,
      symbol: evs[0].symbol,
      strategy: evs[0].strategy ?? null,
      expected_buy: eb,
      expected_buy_ts: signal?.created_at ?? null,
      actual_buy: ab,
      actual_buy_ts: buyFill?.created_at ?? null,
      buy_slippage_pct: buySlipPct != null ? +buySlipPct.toFixed(3) : null,
      buy_latency_sec: buyLat != null ? +buyLat.toFixed(1) : null,
      expected_sell: es,
      expected_sell_ts: sellQ?.created_at ?? null,
      actual_sell: as_,
      actual_sell_ts: sellFill?.created_at ?? closed?.created_at ?? null,
      sell_slippage_pct: sellSlipPct != null ? +sellSlipPct.toFixed(3) : null,
      sell_latency_sec: sellLat != null ? +sellLat.toFixed(1) : null,
      exit_reason: closed?.reason ?? null
    });
  }
  const buys = rows.map((r) => r.buy_slippage_pct).filter((n) => n != null);
  const sells = rows.map((r) => r.sell_slippage_pct).filter((n) => n != null);
  const buyLats = rows.map((r) => r.buy_latency_sec).filter((n) => n != null);
  const sellLats = rows.map((r) => r.sell_latency_sec).filter((n) => n != null);
  const avg = (a) => a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3) : null;
  const median = (a) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return +(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2).toFixed(3);
  };
  const worst = (a) => a.length ? +Math.max(...a.map(Math.abs)).toFixed(3) : null;
  const summary = {
    trades: rows.length,
    paired_buys: buys.length,
    paired_sells: sells.length,
    buy_slippage_avg_pct: avg(buys),
    buy_slippage_median_pct: median(buys),
    buy_slippage_worst_abs_pct: worst(buys),
    sell_slippage_avg_pct: avg(sells),
    sell_slippage_median_pct: median(sells),
    sell_slippage_worst_abs_pct: worst(sells),
    buy_latency_avg_sec: avg(buyLats),
    buy_latency_median_sec: median(buyLats),
    sell_latency_avg_sec: avg(sellLats),
    sell_latency_median_sec: median(sellLats)
  };
  rows.sort((a, b) => {
    const ta = a.actual_buy_ts ?? a.expected_buy_ts ?? "";
    const tb = b.actual_buy_ts ?? b.expected_buy_ts ?? "";
    return tb.localeCompare(ta);
  });
  return {
    date,
    summary,
    rows
  };
});
const getMissedSignalsReport_createServerFn_handler = createServerRpc({
  id: "a523502bb449d6ec95657c1fc07896b231563af0b4226492dc2d4724e0fb5c5e",
  name: "getMissedSignalsReport",
  filename: "src/lib/trade-ledger.functions.ts"
}, (opts) => getMissedSignalsReport.__executeServer(opts));
const getMissedSignalsReport = createServerFn({
  method: "GET"
}).inputValidator((data) => ({
  date: data?.date
})).handler(getMissedSignalsReport_createServerFn_handler, async ({
  data
}) => {
  const cairoToday = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const date = data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date) ? data.date : cairoToday;
  const {
    data: misses,
    error
  } = await supabaseAdmin.from("missed_signals").select("id, trade_date, symbol, strategy, ts, reason, candidate_price, day_open, drop_pct, tp_price, sl_price, rank").eq("trade_date", date).order("ts", {
    ascending: true
  }).limit(500);
  if (error) throw new Error(error.message);
  const dayStart = `${date}T07:00:00Z`;
  const dayEnd = `${date}T12:00:00Z`;
  const symbols = Array.from(new Set((misses ?? []).map((m) => m.symbol)));
  const bySym = /* @__PURE__ */ new Map();
  if (symbols.length) {
    let from = 0;
    while (true) {
      const {
        data: ticks
      } = await supabaseAdmin.from("live_ticks").select("symbol, price, ts").in("symbol", symbols).gte("ts", dayStart).lte("ts", dayEnd).eq("source", "thunder_ext").order("symbol").order("ts").range(from, from + 999);
      if (!ticks?.length) break;
      for (const t of ticks) {
        if (!bySym.has(t.symbol)) bySym.set(t.symbol, []);
        bySym.get(t.symbol).push({
          price: Number(t.price),
          ts: new Date(t.ts).getTime()
        });
      }
      if (ticks.length < 1e3) break;
      from += 1e3;
    }
  }
  const scored = (misses ?? []).map((m) => {
    const startMs = new Date(m.ts).getTime();
    const entry = m.candidate_price != null ? Number(m.candidate_price) : null;
    const tp = m.tp_price != null ? Number(m.tp_price) : null;
    const sl = m.sl_price != null ? Number(m.sl_price) : null;
    const ticks = (bySym.get(m.symbol) ?? []).filter((t) => t.ts >= startMs);
    let outcome = "unknown";
    let maxPrice = null;
    let minPrice = null;
    let maxGainPct = null;
    let maxLossPct = null;
    if (ticks.length >= 3 && entry != null) {
      maxPrice = ticks.reduce((a, t) => Math.max(a, t.price), -Infinity);
      minPrice = ticks.reduce((a, t) => Math.min(a, t.price), Infinity);
      maxGainPct = (maxPrice - entry) / entry;
      maxLossPct = (minPrice - entry) / entry;
      const deadline = startMs + 60 * 6e4;
      let hit = null;
      for (const t of ticks) {
        if (t.ts > deadline) break;
        if (tp != null && t.price >= tp) {
          hit = "win";
          break;
        }
        if (sl != null && t.price <= sl) {
          hit = "lose";
          break;
        }
      }
      outcome = hit === "win" ? "would_win" : hit === "lose" ? "would_lose" : "flat";
    }
    const CAPITAL = 2e4;
    const qty = entry ? Math.max(1, Math.floor(CAPITAL / entry)) : 0;
    const fee = (v) => 3 + 3e-4 * v;
    let est_pnl = null;
    if (outcome === "would_win" && entry && tp) {
      est_pnl = (tp - entry) * qty - fee(entry * qty) - fee(tp * qty);
    } else if (outcome === "would_lose" && entry && sl) {
      est_pnl = (sl - entry) * qty - fee(entry * qty) - fee(sl * qty);
    }
    return {
      ...m,
      outcome,
      max_price: maxPrice,
      min_price: minPrice,
      max_gain_pct: maxGainPct != null ? +(maxGainPct * 100).toFixed(2) : null,
      max_loss_pct: maxLossPct != null ? +(maxLossPct * 100).toFixed(2) : null,
      est_pnl: est_pnl != null ? +est_pnl.toFixed(1) : null
    };
  });
  const summary = {
    total: scored.length,
    would_win: scored.filter((r) => r.outcome === "would_win").length,
    would_lose: scored.filter((r) => r.outcome === "would_lose").length,
    flat: scored.filter((r) => r.outcome === "flat").length,
    unknown: scored.filter((r) => r.outcome === "unknown").length,
    by_reason: Object.fromEntries(Array.from(new Set(scored.map((r) => r.reason))).map((reason) => [reason, {
      total: scored.filter((r) => r.reason === reason).length,
      would_win: scored.filter((r) => r.reason === reason && r.outcome === "would_win").length,
      would_lose: scored.filter((r) => r.reason === reason && r.outcome === "would_lose").length
    }])),
    missed_profit_egp: +scored.filter((r) => r.outcome === "would_win" && r.est_pnl != null).reduce((s, r) => s + r.est_pnl, 0).toFixed(1),
    avoided_loss_egp: +scored.filter((r) => r.outcome === "would_lose" && r.est_pnl != null).reduce((s, r) => s + Math.abs(r.est_pnl), 0).toFixed(1)
  };
  scored.sort((a, b) => (b.ts || "").localeCompare(a.ts || ""));
  return {
    date,
    summary,
    rows: scored
  };
});
export {
  getMissedSignalsReport_createServerFn_handler,
  getSlippageReport_createServerFn_handler,
  getTradeLifecycleToday_createServerFn_handler
};
