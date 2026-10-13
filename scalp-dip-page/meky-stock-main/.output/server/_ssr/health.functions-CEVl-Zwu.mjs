import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { s as shadowStats, c as calibrationState, g as getAllScores, a as getHealthSummary, r as resetModule, b as resetAllModules } from "./auto-orchestrator.server-Cobs3ZBw.mjs";
import { i as ingestClosedTrades } from "./outcome-loop.server-BOECsdkT.mjs";
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
import "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
const getModuleHealth_createServerFn_handler = createServerRpc({
  id: "4b24fa87a86ffd3cbc59f7ed840a3b5983cf4cda8340206e2508c4807bc802e6",
  name: "getModuleHealth",
  filename: "src/lib/integration/health.functions.ts"
}, (opts) => getModuleHealth.__executeServer(opts));
const getModuleHealth = createServerFn({
  method: "GET"
}).handler(getModuleHealth_createServerFn_handler, async () => {
  return {
    ...getHealthSummary(),
    scores: getAllScores(),
    calibration: calibrationState(),
    shadow: shadowStats()
  };
});
const resetModuleHealth_createServerFn_handler = createServerRpc({
  id: "b9314d3f21e28c9064790697a40faadc3a3292b23b8c90ed2e1479c8d1e9d428",
  name: "resetModuleHealth",
  filename: "src/lib/integration/health.functions.ts"
}, (opts) => resetModuleHealth.__executeServer(opts));
const resetModuleHealth = createServerFn({
  method: "POST"
}).inputValidator((data) => data ?? {}).handler(resetModuleHealth_createServerFn_handler, async ({
  data
}) => {
  if (data.name) return {
    reset: resetModule(data.name) ? 1 : 0
  };
  return {
    reset: resetAllModules()
  };
});
const runOutcomeLoop_createServerFn_handler = createServerRpc({
  id: "985b7ffce9bdcf8eacbb2c5d54c7e1d97cfd71bc0e08488e0d1f9108c41d5414",
  name: "runOutcomeLoop",
  filename: "src/lib/integration/health.functions.ts"
}, (opts) => runOutcomeLoop.__executeServer(opts));
const runOutcomeLoop = createServerFn({
  method: "POST"
}).handler(runOutcomeLoop_createServerFn_handler, async () => {
  return ingestClosedTrades(200);
});
export {
  getModuleHealth_createServerFn_handler,
  resetModuleHealth_createServerFn_handler,
  runOutcomeLoop_createServerFn_handler
};
