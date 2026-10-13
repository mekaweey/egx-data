import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import fs__default__default from "node:fs";
import path__default__default from "node:path";
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
const getSupervisorState_createServerFn_handler = createServerRpc({
  id: "ff247ed1bf7b334e0d2e9a50f023bd88824e683bb4c20d7334b4a355a35d4a23",
  name: "getSupervisorState",
  filename: "src/routes/ai-supervisor.tsx"
}, (opts) => getSupervisorState.__executeServer(opts));
const getSupervisorState = createServerFn({
  method: "GET"
}).handler(getSupervisorState_createServerFn_handler, async () => {
  const statePath = path__default__default.join(process.cwd(), "supervisor_state.json");
  let verdict = null;
  try {
    const raw = fs__default__default.readFileSync(statePath, "utf8");
    verdict = JSON.parse(raw);
  } catch {
    verdict = null;
  }
  let history = [];
  const histPath = path__default__default.join(process.cwd(), "supervisor_history.jsonl");
  try {
    const raw = fs__default__default.readFileSync(histPath, "utf8").trim().split("\n").filter(Boolean);
    history = raw.slice(-40).reverse().map((l) => JSON.parse(l));
  } catch {
    history = [];
  }
  return {
    verdict,
    history
  };
});
const getSystemFacts_createServerFn_handler = createServerRpc({
  id: "90b85236a77d50db8e2a9db999a9488a327b6db75cca05c530bd5001e068aeb6",
  name: "getSystemFacts",
  filename: "src/routes/ai-supervisor.tsx"
}, (opts) => getSystemFacts.__executeServer(opts));
const getSystemFacts = createServerFn({
  method: "GET"
}).handler(getSystemFacts_createServerFn_handler, async () => {
  const p = supabaseAdmin;
  const [pos, sig, news, jobs] = await Promise.all([p.from("paper_trades").select("symbol, trade_date, entry_price, sl_price, status").eq("strategy", "scalp-dip").eq("status", "open"), p.from("scalp_dip_signals").select("scan_date, symbol").eq("scan_date", (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)), p.from("mubasher_news").select("id").limit(1).then((r) => ({
    count: r.data?.length ?? 0
  })), p.from("paper_trades").select("symbol").eq("strategy", "scalp-dip").eq("status", "closed")]);
  return {
    openPositions: pos.data?.length ?? 0,
    todaySignals: sig.data?.length ?? 0,
    closedTrades: jobs.data?.length ?? 0
  };
});
export {
  getSupervisorState_createServerFn_handler,
  getSystemFacts_createServerFn_handler
};
