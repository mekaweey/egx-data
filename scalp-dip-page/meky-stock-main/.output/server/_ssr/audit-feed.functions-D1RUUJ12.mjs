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
const listAuditFeed_createServerFn_handler = createServerRpc({
  id: "7403c6cad522bbde625b9e1c2180789663e866e306f57a8e106d25442add9001",
  name: "listAuditFeed",
  filename: "src/lib/notify/audit-feed.functions.ts"
}, (opts) => listAuditFeed.__executeServer(opts));
const listAuditFeed = createServerFn({
  method: "GET"
}).validator((d) => ({
  afterId: Number(d?.afterId ?? 0),
  probe: Boolean(d?.probe)
})).handler(listAuditFeed_createServerFn_handler, async ({
  data
}) => {
  try {
    const {
      supabaseAdmin
    } = await import("./client.server-D5ro3rAQ.mjs");
    const db = supabaseAdmin;
    if (data.probe) {
      const {
        data: row
      } = await db.from("decision_audit_log").select("id").order("id", {
        ascending: false
      }).limit(1).maybeSingle();
      return {
        rows: [],
        maxId: Number(row?.id ?? 0)
      };
    }
    let q = db.from("decision_audit_log").select("id, created_at, event_type, symbol, trigger_price, reference_price, pnl_pct, details, user_action");
    if (data.afterId > 0) q = q.gt("id", data.afterId);
    const {
      data: rows
    } = await q.order("id", {
      ascending: true
    }).limit(50);
    const list = (rows ?? []).map((r) => ({
      id: Number(r.id),
      created_at: String(r.created_at ?? ""),
      event_type: String(r.event_type ?? ""),
      symbol: String(r.symbol ?? "-"),
      trigger_price: r.trigger_price != null ? Number(r.trigger_price) : null,
      reference_price: r.reference_price != null ? Number(r.reference_price) : null,
      pnl_pct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
      details: r.details != null ? typeof r.details === "object" ? JSON.stringify(r.details) : String(r.details) : null,
      user_action: String(r.user_action ?? "")
    }));
    const maxId = list.length ? Math.max(...list.map((r) => r.id)) : data.afterId;
    return {
      rows: list,
      maxId
    };
  } catch {
    return {
      rows: [],
      maxId: data.afterId
    };
  }
});
export {
  listAuditFeed_createServerFn_handler
};
