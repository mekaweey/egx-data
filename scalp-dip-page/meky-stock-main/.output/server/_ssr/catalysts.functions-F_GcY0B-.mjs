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
const getUpcomingCatalysts_createServerFn_handler = createServerRpc({
  id: "64ee50c4206716d8f38bde1a4a7337dde453b61f1c25d8870e0f940f2eed4e61",
  name: "getUpcomingCatalysts",
  filename: "src/lib/catalysts/catalysts.functions.ts"
}, (opts) => getUpcomingCatalysts.__executeServer(opts));
const getUpcomingCatalysts = createServerFn({
  method: "GET"
}).handler(getUpcomingCatalysts_createServerFn_handler, async () => {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const {
    data,
    error
  } = await supabaseAdmin.from("news_impact_forecasts").select("id, symbol, headline, expected_direction, expected_magnitude_pct, confidence, impact_start_date, impact_end_date, baladi_summary").gte("impact_end_date", today).in("expected_direction", ["up", "down"]).order("confidence", {
    ascending: false
  }).limit(50);
  if (error || !data) return [];
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const r of data) {
    const key = r.symbol;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: r.id,
      symbol: r.symbol,
      headline: r.headline,
      expected_direction: r.expected_direction,
      expected_magnitude_pct: r.expected_magnitude_pct != null ? Number(r.expected_magnitude_pct) : null,
      confidence: Number(r.confidence ?? 0),
      impact_start_date: r.impact_start_date,
      impact_end_date: r.impact_end_date,
      baladi_summary: r.baladi_summary ?? null
    });
    if (out.length >= 6) break;
  }
  return out;
});
export {
  getUpcomingCatalysts_createServerFn_handler
};
