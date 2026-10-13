import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { createHash } from "crypto";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as object, b as string, _ as _enum, c as array } from "../_libs/zod.mjs";
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
import "../_libs/isbot.mjs";
const MessageInput = object({
  role: _enum(["user", "assistant"]),
  content: string().min(1).max(2e5),
  turn_id: string().max(120).nullish()
});
const InputSchema = object({
  messages: array(MessageInput).min(1).max(200),
  source: string().max(80).default("manual-refresh-button")
});
function sha256(parts) {
  return createHash("sha256").update(parts.map((p) => p ?? "").join("|")).digest("hex");
}
const logMessagesManual_createServerFn_handler = createServerRpc({
  id: "3bdcdc1a58dd1636ab04563a53c79057646cf1bc6d351f5c3bf5e4c3c8dc32ff",
  name: "logMessagesManual",
  filename: "src/lib/session-log/log-manual.functions.ts"
}, (opts) => logMessagesManual.__executeServer(opts));
const logMessagesManual = createServerFn({
  method: "POST"
}).inputValidator((input) => InputSchema.parse(input)).handler(logMessagesManual_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const rows = data.messages.map((m) => ({
    role: m.role,
    content: m.content,
    turn_id: m.turn_id ?? null,
    content_hash: sha256(["message", m.role, m.turn_id ?? null, m.content])
  }));
  const hashes = [...new Set(rows.map((r) => r.content_hash))];
  const {
    data: existing,
    error: existingErr
  } = await supabaseAdmin.from("session_messages").select("content_hash").in("content_hash", hashes);
  if (existingErr) throw new Error(`lookup failed: ${existingErr.message}`);
  const seen = new Set((existing ?? []).map((r) => r.content_hash));
  const localSeen = /* @__PURE__ */ new Set();
  const toInsert = rows.filter((r) => {
    if (seen.has(r.content_hash) || localSeen.has(r.content_hash)) return false;
    localSeen.add(r.content_hash);
    return true;
  });
  let inserted = 0;
  if (toInsert.length) {
    const {
      error: insErr
    } = await supabaseAdmin.from("session_messages").insert(toInsert);
    if (insErr && insErr.code !== "23505") throw new Error(`insert failed: ${insErr.message}`);
    inserted = toInsert.length;
  }
  await supabaseAdmin.from("session_ingest_audit").insert({
    turn_id: data.messages[0]?.turn_id ?? null,
    client_batch_id: `manual-${Date.now()}`,
    source: data.source,
    items_total: rows.length,
    messages_count: inserted,
    edits_count: 0,
    reads_count: 0,
    duplicate_count: rows.length - inserted,
    ok: true,
    error_stage: null,
    error_message: null
  });
  return {
    ok: true,
    total: rows.length,
    inserted,
    duplicates: rows.length - inserted
  };
});
export {
  logMessagesManual_createServerFn_handler
};
