import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
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
const ROOT = process.cwd();
const getFeed_createServerFn_handler = createServerRpc({
  id: "64f76e3101175655734775544ff6d26371663016d6568212eb3140fff79f57aa",
  name: "getFeed",
  filename: "src/components/ai-supervisor-chat.tsx"
}, (opts) => getFeed.__executeServer(opts));
const getFeed = createServerFn({
  method: "GET"
}).handler(getFeed_createServerFn_handler, async () => {
  const feedPath = path__default__default.join(ROOT, "supervisor_feed.jsonl");
  const statePath = path__default__default.join(ROOT, "supervisor_state.json");
  let entries = [];
  let state = null;
  try {
    const raw = fs__default__default.readFileSync(feedPath, "utf8").trim().split("\n").filter(Boolean);
    entries = raw.slice(-50).reverse().map((l) => JSON.parse(l));
  } catch {
  }
  try {
    state = JSON.parse(fs__default__default.readFileSync(statePath, "utf8"));
  } catch {
  }
  let alive = "unknown";
  if (state?.time) {
    const ageMin = (Date.now() - new Date(state.time).getTime()) / 6e4;
    alive = ageMin < 35 ? "yes" : "stale";
  }
  return {
    entries,
    state,
    alive
  };
});
const sendToSupervisor_createServerFn_handler = createServerRpc({
  id: "05cd77dacd06be3c6285b58375ce809df7d0db7836c7d9132e3d2c837fc88a54",
  name: "sendToSupervisor",
  filename: "src/components/ai-supervisor-chat.tsx"
}, (opts) => sendToSupervisor.__executeServer(opts));
const sendToSupervisor = createServerFn({
  method: "POST"
}).validator((d) => d).handler(sendToSupervisor_createServerFn_handler, async ({
  data
}) => {
  const text = (data?.text || "").slice(0, 500);
  if (!text.trim()) return {
    ok: false
  };
  const feedPath = path__default__default.join(ROOT, "supervisor_feed.jsonl");
  const entry = {
    time: (/* @__PURE__ */ new Date()).toISOString(),
    kind: "user",
    text: text.trim()
  };
  fs__default__default.appendFileSync(feedPath, JSON.stringify(entry) + "\n");
  return {
    ok: true
  };
});
export {
  getFeed_createServerFn_handler,
  sendToSupervisor_createServerFn_handler
};
