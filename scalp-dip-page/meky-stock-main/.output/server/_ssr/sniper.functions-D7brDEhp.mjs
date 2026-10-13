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
const getSniperSnapshot_createServerFn_handler = createServerRpc({
  id: "64c6e19884a6c1ec3fefe7cde56570036d605dd7fcf0752d91dfa5e7cca2bb90",
  name: "getSniperSnapshot",
  filename: "src/lib/sniper/sniper.functions.ts"
}, (opts) => getSniperSnapshot.__executeServer(opts));
const getSniperSnapshot = createServerFn({
  method: "GET"
}).handler(getSniperSnapshot_createServerFn_handler, async () => {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const {
    data: pickRow
  } = await supabaseAdmin.from("sniper_picks").select("*").eq("pick_date", today).maybeSingle();
  let ticks = [];
  let latest = null;
  if (pickRow) {
    const {
      data: t
    } = await supabaseAdmin.from("live_ticks").select("ts,price,source").eq("symbol", pickRow.symbol).gte("ts", today + "T07:30:00Z").order("ts", {
      ascending: true
    }).limit(500);
    ticks = (t ?? []).map((r) => ({
      ts: r.ts,
      price: +r.price,
      source: r.source
    }));
    latest = ticks.length ? ticks[ticks.length - 1] : null;
  }
  const pick = pickRow ? {
    pick_date: pickRow.pick_date,
    symbol: pickRow.symbol,
    name_ar: pickRow.name_ar,
    reasons: pickRow.reasons,
    prev_close: pickRow.prev_close ? +pickRow.prev_close : null,
    entry_price: pickRow.entry_price ? +pickRow.entry_price : null,
    target_price: pickRow.target_price ? +pickRow.target_price : null,
    stop_price: pickRow.stop_price ? +pickRow.stop_price : null,
    orb_high: pickRow.orb_high ? +pickRow.orb_high : null,
    orb_low: pickRow.orb_low ? +pickRow.orb_low : null,
    orb_decision: pickRow.orb_decision,
    orb_confidence: pickRow.orb_confidence,
    position_pct: pickRow.position_pct ? +pickRow.position_pct : null,
    status: pickRow.status,
    v3_score: pickRow.v3_score ? +pickRow.v3_score : null,
    confidence: pickRow.confidence ?? null,
    negative_reasons: pickRow.negative_reasons ?? null
  } : null;
  return {
    pick,
    ticks,
    latest
  };
});
export {
  getSniperSnapshot_createServerFn_handler
};
