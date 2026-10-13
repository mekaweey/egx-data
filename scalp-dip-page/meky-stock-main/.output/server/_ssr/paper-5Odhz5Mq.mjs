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
const getPaperResults_createServerFn_handler = createServerRpc({
  id: "8971ff55142b392859020bdc863216a6d2a7242c5d0d6f8ba52b765ad966548e",
  name: "getPaperResults",
  filename: "src/routes/paper.tsx"
}, (opts) => getPaperResults.__executeServer(opts));
const getPaperResults = createServerFn({
  method: "GET"
}).handler(getPaperResults_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("paper_trades").select("*").order("trade_date", {
    ascending: false
  }).order("entry_ts", {
    ascending: true
  }).limit(500);
  if (error) throw error;
  return {
    trades: data || []
  };
});
export {
  getPaperResults_createServerFn_handler
};
