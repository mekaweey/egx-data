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
const listFeasibility_createServerFn_handler = createServerRpc({
  id: "6146a667bbc3055ca6b144d502e799f5912a769fcecfb2a9e3c56031f618d896",
  name: "listFeasibility",
  filename: "src/routes/scalp-feasibility.tsx"
}, (opts) => listFeasibility.__executeServer(opts));
const listFeasibility = createServerFn({
  method: "GET"
}).inputValidator((input) => input).handler(listFeasibility_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const tradeDate = data.tradeDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const {
    data: rows,
    error
  } = await supabaseAdmin.from("scalp_feasibility_report").select("*").eq("trade_date", tradeDate).order("signal_ts", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  return {
    rows: rows || [],
    tradeDate
  };
});
export {
  listFeasibility_createServerFn_handler
};
