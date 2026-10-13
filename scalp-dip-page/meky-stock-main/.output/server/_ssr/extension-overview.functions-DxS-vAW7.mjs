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
const getExtensionOverview_createServerFn_handler = createServerRpc({
  id: "1d76a569886393f81a39eabd66b64b62066237a0c125560028dc291bf300cf23",
  name: "getExtensionOverview",
  filename: "src/lib/telemetry/extension-overview.functions.ts"
}, (opts) => getExtensionOverview.__executeServer(opts));
const getExtensionOverview = createServerFn({
  method: "GET"
}).handler(getExtensionOverview_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const now = Date.now();
  const iso = (ms) => new Date(ms).toISOString();
  const since10m = iso(now - 10 * 6e4);
  const since5m = iso(now - 5 * 6e4);
  const since1h = iso(now - 60 * 6e4);
  const [tabsRes, ticks5mRes, ticks1hRes, lastTickRes, snap5mRes, snap1hRes, lastSnapRes, watchlistRes, signalsRes] = await Promise.all([supabaseAdmin.from("extension_tab_telemetry").select("ts, client_id, symbol, uuid, uptime_sec, last_l2_fresh, last_l2_age_sec, panel_state, has_trigger, snapshots_sent, last_snapshot_age_sec, last_ensure_age_sec, extras").gte("ts", since10m).order("ts", {
    ascending: false
  }).limit(2e3), supabaseAdmin.from("live_ticks").select("symbol, ts, price").eq("source", "thunder_ext").gte("ts", since5m).order("ts", {
    ascending: false
  }).limit(5e3), supabaseAdmin.from("live_ticks").select("symbol", {
    count: "exact",
    head: true
  }).eq("source", "thunder_ext").gte("ts", since1h), supabaseAdmin.from("live_ticks").select("ts, symbol, price").eq("source", "thunder_ext").order("ts", {
    ascending: false
  }).limit(1).maybeSingle(), supabaseAdmin.from("orderbook_snapshots").select("symbol, ts, best_bid, best_ask").gte("ts", since5m).order("ts", {
    ascending: false
  }).limit(2e3), supabaseAdmin.from("orderbook_snapshots").select("symbol", {
    count: "exact",
    head: true
  }).gte("ts", since1h), supabaseAdmin.from("orderbook_snapshots").select("ts, symbol").order("ts", {
    ascending: false
  }).limit(1).maybeSingle(), supabaseAdmin.from("thunder_watchlist_snapshots").select("symbol", {
    count: "exact",
    head: true
  }).gte("ts", since1h), fetch("https://meky-stock.lovable.app/api/public/hooks/recent-signal-symbols").then((r) => r.json()).catch(() => ({
    ok: false,
    symbols: []
  }))]);
  const seen = /* @__PURE__ */ new Map();
  for (const row of tabsRes.data || []) {
    const key = `${row.client_id}::${row.symbol}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  const tabs = Array.from(seen.values());
  const ticksBySym = /* @__PURE__ */ new Map();
  for (const t of ticks5mRes.data || []) {
    const cur = ticksBySym.get(t.symbol);
    if (!cur) {
      ticksBySym.set(t.symbol, {
        count: 1,
        lastPrice: Number(t.price) || null,
        lastTs: t.ts
      });
    } else {
      cur.count += 1;
    }
  }
  const snapsBySym = /* @__PURE__ */ new Map();
  for (const s of snap5mRes.data || []) {
    const cur = snapsBySym.get(s.symbol);
    if (!cur) {
      snapsBySym.set(s.symbol, {
        count: 1,
        lastTs: s.ts,
        bid: s.best_bid,
        ask: s.best_ask
      });
    } else {
      cur.count += 1;
    }
  }
  const signalSymbols = Array.isArray(signalsRes?.symbols) ? signalsRes.symbols : [];
  const openSymbols = new Set(tabs.map((t) => t.symbol));
  const missingSignals = signalSymbols.filter((s) => !openSymbols.has(String(s).toUpperCase()));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(/* @__PURE__ */ new Date());
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hh = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const mm = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4
  };
  const isWeekday = wd in dayMap;
  const minutes = hh * 60 + mm;
  const marketOpen = isWeekday && minutes >= 600 && minutes < 870;
  return {
    ok: true,
    now: iso(now),
    marketOpen,
    summary: {
      tabsCount: tabs.length,
      ticks5m: (ticks5mRes.data || []).length,
      ticks1h: ticks1hRes.count ?? 0,
      snaps5m: (snap5mRes.data || []).length,
      snaps1h: snap1hRes.count ?? 0,
      watchlist1h: watchlistRes.count ?? 0,
      signalsCount: signalSymbols.length,
      lastTickTs: lastTickRes.data?.ts ?? null,
      lastTickSymbol: lastTickRes.data?.symbol ?? null,
      lastSnapTs: lastSnapRes.data?.ts ?? null,
      lastSnapSymbol: lastSnapRes.data?.symbol ?? null
    },
    tabs: tabs.map((t) => ({
      symbol: t.symbol,
      client_id: t.client_id,
      uuid: t.uuid ?? null,
      ts: t.ts,
      uptime_sec: t.uptime_sec ?? null,
      snapshots_sent: t.snapshots_sent ?? 0,
      last_snapshot_age_sec: t.last_snapshot_age_sec ?? null,
      last_l2_fresh: t.last_l2_fresh ?? null,
      last_l2_age_sec: t.last_l2_age_sec ?? null,
      panel_state: t.panel_state ?? null,
      has_trigger: t.has_trigger ?? null,
      last_ensure_age_sec: t.last_ensure_age_sec ?? null
    })),
    ticksPerSymbol: Array.from(ticksBySym.entries()).map(([symbol, v]) => ({
      symbol,
      count: v.count,
      lastPrice: v.lastPrice,
      lastTs: v.lastTs
    })).sort((a, b) => b.count - a.count),
    snapsPerSymbol: Array.from(snapsBySym.entries()).map(([symbol, v]) => ({
      symbol,
      count: v.count,
      lastTs: v.lastTs,
      bid: v.bid,
      ask: v.ask
    })).sort((a, b) => b.count - a.count),
    signals: signalSymbols,
    missingSignals
  };
});
export {
  getExtensionOverview_createServerFn_handler
};
