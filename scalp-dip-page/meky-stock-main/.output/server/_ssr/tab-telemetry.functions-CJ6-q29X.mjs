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
const getLatestTabTelemetry_createServerFn_handler = createServerRpc({
  id: "ed217c894431aa80c22ea8e84255ac31bf285a6c93995faf1d09320ab3e7dde0",
  name: "getLatestTabTelemetry",
  filename: "src/lib/telemetry/tab-telemetry.functions.ts"
}, (opts) => getLatestTabTelemetry.__executeServer(opts));
const getLatestTabTelemetry = createServerFn({
  method: "GET"
}).handler(getLatestTabTelemetry_createServerFn_handler, async () => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const sinceIso = new Date(Date.now() - 10 * 6e4).toISOString();
  const {
    data,
    error
  } = await supabaseAdmin.from("extension_tab_telemetry").select("ts, client_id, symbol, uuid, opened_at_ms, uptime_sec, last_ensure_age_sec, last_l2_fresh, last_l2_age_sec, panel_state, has_trigger, snapshots_sent, last_snapshot_age_sec, extras").gte("ts", sinceIso).order("ts", {
    ascending: false
  }).limit(2e3);
  if (error) return {
    ok: false,
    tabs: [],
    error: error.message
  };
  const seen = /* @__PURE__ */ new Map();
  for (const row of data || []) {
    const key = `${row.client_id}::${row.symbol}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return {
    ok: true,
    tabs: Array.from(seen.values())
  };
});
export {
  getLatestTabTelemetry_createServerFn_handler
};
