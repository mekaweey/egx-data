import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { c as createPendingScan, r as runScanForId } from "./run-scan.server-C7KKLuW0.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "./tradingview.server-ASbxwkih.mjs";
import "./levels.server-DPpGzyqT.mjs";
import "../_libs/technicalindicators.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "../_libs/ai.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/zod.mjs";
import "../_libs/@vercel/oidc.mjs";
import "path";
import "fs";
import "os";
import "../_libs/opentelemetry__api.mjs";
import "./news.server-DBo8FnwV.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "./pattern-memory.server-BKGG6vXj.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "./isotonic-calibration.server-CgJbsL0r.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "http";
import "https";
import "url";
import "../_libs/mime-types.mjs";
import "../_libs/mime-db.mjs";
import "../_libs/asynckit.mjs";
import "../_libs/es-set-tostringtag.mjs";
import "../_libs/get-intrinsic.mjs";
import "../_libs/es-object-atoms.mjs";
import "../_libs/es-errors.mjs";
import "../_libs/math-intrinsics.mjs";
import "../_libs/gopd.mjs";
import "../_libs/es-define-property.mjs";
import "../_libs/has-symbols.mjs";
import "../_libs/get-proto.mjs";
import "../_libs/dunder-proto.mjs";
import "../_libs/call-bind-apply-helpers.mjs";
import "../_libs/function-bind.mjs";
import "../_libs/hasown.mjs";
import "../_libs/has-tostringtag.mjs";
import "../_libs/proxy-from-env.mjs";
import "http2";
import "../_libs/follow-redirects.mjs";
import "assert";
import "../_libs/debug.mjs";
import "../_libs/ms.mjs";
import "tty";
import "../_libs/supports-color.mjs";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
const MIN_INTERVAL_MS = 3 * 60 * 1e3;
const STUCK_START_MS = 90 * 1e3;
const STUCK_TOTAL_MS = 6 * 60 * 1e3;
const MANUAL_SCAN_TIMEOUT_MS = 280 * 1e3;
function withTimeout(promise, ms, label) {
  let timeout;
  const timer = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}
function staleScanMessage(scan) {
  const age = Date.now() - new Date(scan.started_at).getTime();
  if ((scan.stocks_count ?? 0) === 0 && age > STUCK_START_MS) {
    return "تم إيقاف مسح عالق تلقائياً: لم يبدأ جلب الأسهم خلال 90 ثانية";
  }
  if (age > STUCK_TOTAL_MS) {
    return "تم إيقاف مسح عالق تلقائياً بعد 6 دقائق";
  }
  return null;
}
const triggerScan_createServerFn_handler = createServerRpc({
  id: "daf02c0dc194971a473c941cddcaf302d0bab61a97fa5202d405beaeff04853d",
  name: "triggerScan",
  filename: "src/lib/scan/scan.functions.ts"
}, (opts) => triggerScan.__executeServer(opts));
const triggerScan = createServerFn({
  method: "POST"
}).handler(triggerScan_createServerFn_handler, async () => {
  const {
    data: latest
  } = await supabaseAdmin.from("scans").select("id, started_at, status, stocks_count").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (latest && latest.status === "running") {
    const staleMessage = staleScanMessage(latest);
    if (staleMessage) {
      await supabaseAdmin.from("scans").update({
        status: "failed",
        finished_at: (/* @__PURE__ */ new Date()).toISOString(),
        error_message: staleMessage
      }).eq("id", latest.id);
    } else {
      return {
        ok: false,
        message: "يوجد مسح قيد التنفيذ بالفعل",
        scanId: latest.id
      };
    }
  }
  if (latest?.status === "completed") {
    const age = Date.now() - new Date(latest.started_at).getTime();
    if (age < MIN_INTERVAL_MS) {
      const mins = Math.ceil((MIN_INTERVAL_MS - age) / 6e4);
      return {
        ok: false,
        message: `يمكن إعادة المسح بعد ${mins} دقيقة`,
        scanId: latest.id
      };
    }
  }
  const scanId = await createPendingScan();
  try {
    const result = await withTimeout(runScanForId(scanId), MANUAL_SCAN_TIMEOUT_MS, "انتهت مهلة المسح قبل الاكتمال — تم إيقافه بأمان بدون تعليق");
    return {
      ok: true,
      started: true,
      completed: true,
      scanId,
      message: `اكتمل المسح: تم تجهيز وتحليل ${result.stocks} سهم`
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("manual scan failed:", message);
    try {
      await supabaseAdmin.from("scans").update({
        status: "failed",
        finished_at: (/* @__PURE__ */ new Date()).toISOString(),
        error_message: message
      }).eq("id", scanId);
    } catch {
    }
    return {
      ok: false,
      started: false,
      scanId,
      message
    };
  }
});
const cancelScan_createServerFn_handler = createServerRpc({
  id: "0c51e32c0a3f0adf9f0d7f6c10762f2aa64aa8396e3253b87c707221250dce13",
  name: "cancelScan",
  filename: "src/lib/scan/scan.functions.ts"
}, (opts) => cancelScan.__executeServer(opts));
const cancelScan = createServerFn({
  method: "POST"
}).handler(cancelScan_createServerFn_handler, async () => {
  const {
    data: latest
  } = await supabaseAdmin.from("scans").select("id, status").order("started_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (!latest || latest.status !== "running") {
    return {
      ok: false,
      message: "لا يوجد مسح قيد التنفيذ"
    };
  }
  await supabaseAdmin.from("scans").update({
    status: "failed",
    finished_at: (/* @__PURE__ */ new Date()).toISOString(),
    error_message: "تم الإلغاء بواسطة المستخدم"
  }).eq("id", latest.id);
  return {
    ok: true,
    message: "تم إلغاء المسح",
    scanId: latest.id
  };
});
export {
  cancelScan_createServerFn_handler,
  triggerScan_createServerFn_handler
};
