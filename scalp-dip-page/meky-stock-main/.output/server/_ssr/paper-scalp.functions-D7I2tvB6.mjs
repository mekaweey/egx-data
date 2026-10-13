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
const getTodayScalp_createServerFn_handler = createServerRpc({
  id: "fa12b30c1d8334f8bd005553e7da1184c17c37554f16d3b8ea8f893c0b5fe5bc",
  name: "getTodayScalp",
  filename: "src/lib/scan/paper-scalp.functions.ts"
}, (opts) => getTodayScalp.__executeServer(opts));
const getTodayScalp = createServerFn({
  method: "GET"
}).handler(getTodayScalp_createServerFn_handler, async () => {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const {
    data,
    error
  } = await supabaseAdmin.from("paper_trades").select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_reason, pnl, status").eq("trade_date", today).eq("strategy", "scalp-mr15").order("entry_ts", {
    ascending: true
  });
  if (error) throw error;
  return {
    trades: data || [],
    date: today
  };
});
export {
  getTodayScalp_createServerFn_handler
};
