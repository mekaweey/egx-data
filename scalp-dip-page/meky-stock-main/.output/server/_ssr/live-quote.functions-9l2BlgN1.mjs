import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { f as fetchEgxSnapshots } from "./tradingview.server-ASbxwkih.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, b as string, c as array } from "../_libs/zod.mjs";
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
const REALTIME_WINDOW_SEC = 90;
async function getFreshestTicks(symbols) {
  const out = /* @__PURE__ */ new Map();
  if (!symbols.length) return out;
  const sinceIso = new Date(Date.now() - REALTIME_WINDOW_SEC * 1e3).toISOString();
  const {
    data
  } = await supabaseAdmin.from("live_ticks").select("symbol,price,volume,source,ts").in("symbol", symbols).gte("ts", sinceIso).order("ts", {
    ascending: false
  });
  const now = Date.now();
  for (const r of data ?? []) {
    if (out.has(r.symbol)) continue;
    out.set(r.symbol, {
      symbol: r.symbol,
      price: Number(r.price),
      volume: r.volume,
      source: String(r.source),
      ageSec: Math.round((now - new Date(r.ts).getTime()) / 1e3)
    });
  }
  return out;
}
const getLiveQuote_createServerFn_handler = createServerRpc({
  id: "a0f88cdb691910792e5ff92c10d3682aabad833482cc13bf7dad52d831f06357",
  name: "getLiveQuote",
  filename: "src/lib/today/live-quote.functions.ts"
}, (opts) => getLiveQuote.__executeServer(opts));
const getLiveQuote = createServerFn({
  method: "GET"
}).inputValidator((d) => object({
  symbol: string().min(1).max(20).regex(/^[A-Z0-9.]+$/i)
}).parse(d)).handler(getLiveQuote_createServerFn_handler, async ({
  data
}) => {
  const bare = data.symbol.replace(/\.CA$/i, "").toUpperCase();
  const fresh = (await getFreshestTicks([bare])).get(bare) ?? null;
  const snaps = await fetchEgxSnapshots([bare]).catch(() => /* @__PURE__ */ new Map());
  const snap = snaps.get(bare);
  const livePrice = fresh?.price ?? snap?.close ?? null;
  const liveSource = fresh?.source ?? (snap ? "tradingview" : "none");
  const liveAge = fresh?.ageSec ?? null;
  if (livePrice == null) {
    return {
      symbol: bare,
      price: 0,
      change_pct: 0,
      volume: 0,
      rsi14: null,
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      source: "none",
      ageSec: null,
      pnlPct: null,
      pnlVsEntry: null,
      hitTarget: false,
      hitStop: false,
      liveConfidence: null,
      recommendation: "no_pick",
      message: "تعذر جلب السعر اللحظي — السوق ممكن يكون مغلق"
    };
  }
  (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const {
    data: pick
  } = await supabaseAdmin.from("daily_picks").select("*").eq("symbol", data.symbol).eq("status", "open").order("pick_date", {
    ascending: false
  }).limit(1).maybeSingle();
  let pnlPct = null;
  let pnlVsEntry = null;
  let hitTarget = false;
  let hitStop = false;
  let liveConfidence = null;
  let recommendation = "no_pick";
  let message = "السعر اللحظي محدّث";
  if (pick) {
    const entry = Number(pick.entry_price);
    const target = Number(pick.target_price);
    const stop = Number(pick.stop_price);
    const baseConf = Number(pick.confidence);
    pnlPct = (livePrice - entry) / entry * 100;
    pnlVsEntry = livePrice - entry;
    hitTarget = (snap?.high ?? livePrice) >= target;
    hitStop = (snap?.low ?? livePrice) <= stop;
    const adj = pnlPct >= 0 ? pnlPct * 5 : pnlPct * 8;
    liveConfidence = Math.max(0, Math.min(100, baseConf + adj));
    if (hitTarget) {
      recommendation = "sell_target";
      message = `🎯 وصل الهدف ${target.toFixed(2)} — بيع فوراً`;
    } else if (hitStop) {
      recommendation = "sell_stop";
      message = `🛑 ضرب الستوب ${stop.toFixed(2)} — اخرج فوراً لحماية رأس المال`;
    } else if (pnlPct >= 5) {
      recommendation = "trail";
      const newStop = livePrice * 0.97;
      message = `📈 ربح +${pnlPct.toFixed(2)}% — حرّك الستوب لـ ${newStop.toFixed(2)} (3% تحت السعر)`;
    } else if (pnlPct <= -2) {
      recommendation = "hold";
      message = `⚠️ خسارة ${pnlPct.toFixed(2)}% — الستوب لسه ${stop.toFixed(2)} · استنى`;
    } else {
      recommendation = "hold";
      message = `الصفقة شغّالة (${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%) — احتفظ`;
    }
  }
  return {
    symbol: bare,
    price: livePrice,
    change_pct: snap?.change_pct ?? 0,
    volume: fresh?.volume ?? snap?.volume ?? 0,
    rsi14: snap?.rsi14 ?? null,
    fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
    source: liveSource,
    ageSec: liveAge,
    pnlPct,
    pnlVsEntry,
    hitTarget,
    hitStop,
    liveConfidence,
    recommendation,
    message
  };
});
const getLiveQuotes_createServerFn_handler = createServerRpc({
  id: "7edf0edde40b0f1612d8ec3843c45c71b3276755691ee91223ab77f16f68441b",
  name: "getLiveQuotes",
  filename: "src/lib/today/live-quote.functions.ts"
}, (opts) => getLiveQuotes.__executeServer(opts));
const getLiveQuotes = createServerFn({
  method: "POST"
}).inputValidator((d) => object({
  symbols: array(string().min(1).max(20).regex(/^[A-Z0-9.]+$/i)).min(1).max(150)
}).parse(d)).handler(getLiveQuotes_createServerFn_handler, async ({
  data
}) => {
  const bares = Array.from(new Set(data.symbols.map((s) => s.replace(/\.CA$/i, "").toUpperCase())));
  const [fresh, snaps] = await Promise.all([getFreshestTicks(bares), fetchEgxSnapshots(bares).catch(() => /* @__PURE__ */ new Map())]);
  const fetchedAt = (/* @__PURE__ */ new Date()).toISOString();
  return bares.map((s) => {
    const f = fresh.get(s);
    const snap = snaps.get(s);
    const price = f?.price ?? snap?.close ?? 0;
    return {
      symbol: s,
      price,
      change_pct: snap?.change_pct ?? 0,
      open: snap?.open ?? 0,
      high: snap?.high ?? price,
      low: snap?.low ?? price,
      volume: f?.volume ?? snap?.volume ?? 0,
      fetchedAt,
      source: f?.source ?? (snap ? "tradingview" : "none"),
      ageSec: f?.ageSec ?? null
    };
  });
});
export {
  getLiveQuote_createServerFn_handler,
  getLiveQuotes_createServerFn_handler
};
