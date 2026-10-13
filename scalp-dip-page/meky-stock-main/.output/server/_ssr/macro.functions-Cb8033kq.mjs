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
const getMacroSnapshot_createServerFn_handler = createServerRpc({
  id: "9c957eddc141d0f7c3a0b80acccf0415d37bb979145afe08d50debf69ef98337",
  name: "getMacroSnapshot",
  filename: "src/lib/macro/macro.functions.ts"
}, (opts) => getMacroSnapshot.__executeServer(opts));
const getMacroSnapshot = createServerFn({
  method: "GET"
}).handler(getMacroSnapshot_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("macro_indicators").select("as_of, usd_egp, gold_usd, brent_oil_usd, cbe_interest_rate, inflation_yoy, sp500_close, sp500_change_pct, msci_em_close").order("as_of", {
    ascending: false
  }).limit(1).maybeSingle();
  if (error || !data) return null;
  return {
    as_of: data.as_of,
    usd_egp: data.usd_egp != null ? Number(data.usd_egp) : null,
    gold_usd: data.gold_usd != null ? Number(data.gold_usd) : null,
    brent_oil_usd: data.brent_oil_usd != null ? Number(data.brent_oil_usd) : null,
    cbe_interest_rate: data.cbe_interest_rate != null ? Number(data.cbe_interest_rate) : null,
    inflation_yoy: data.inflation_yoy != null ? Number(data.inflation_yoy) : null,
    sp500_close: data.sp500_close != null ? Number(data.sp500_close) : null,
    sp500_change_pct: data.sp500_change_pct != null ? Number(data.sp500_change_pct) : null,
    msci_em_close: data.msci_em_close != null ? Number(data.msci_em_close) : null
  };
});
export {
  getMacroSnapshot_createServerFn_handler
};
