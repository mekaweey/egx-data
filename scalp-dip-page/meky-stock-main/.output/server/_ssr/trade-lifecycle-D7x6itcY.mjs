import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useRouter, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { b as getTradeLifecycleToday } from "./trade-ledger.functions-BOankbNu.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./market-hours-CyHCW23Z.mjs";
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
import "./telegram.server-D6g8flro.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
import "./client-DcfJRNR2.mjs";
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./run-scan.server-C7KKLuW0.mjs";
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
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "./isotonic-calibration.server-CgJbsL0r.mjs";
import "node:zlib";
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
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
const STATE_STYLE = {
  SIGNALED: "bg-blue-100 text-blue-800",
  BUYING: "bg-amber-100 text-amber-800",
  HOLDING: "bg-emerald-100 text-emerald-800",
  SELLING: "bg-purple-100 text-purple-800",
  CLOSED_TP: "bg-green-200 text-green-900 font-semibold",
  CLOSED_SL: "bg-red-200 text-red-900",
  CLOSED_TRAIL: "bg-yellow-200 text-yellow-900",
  CLOSED_TIME: "bg-gray-200 text-gray-800",
  CLOSED_EOD: "bg-gray-200 text-gray-800",
  CLOSED_HARD_FLOOR: "bg-red-300 text-red-950 font-semibold",
  CLOSED_VOLUME_DEATH: "bg-orange-200 text-orange-900",
  CANCELLED: "bg-gray-100 text-gray-600",
  ERROR: "bg-red-100 text-red-800"
};
const EVENT_ICON = {
  SIGNAL: "📡",
  ORDER_QUEUED: "📥",
  ORDER_OPENED: "🌐",
  ORDER_PREPARED: "📝",
  ORDER_CONFIRMED: "✅",
  REVIEW_CLICKED: "🖱️",
  BUY_FILLED: "🟢",
  SELL_REQUESTED: "📤",
  SELL_QUEUED: "🔔",
  SELL_FILLED: "🔴",
  SMART_EXIT_HARD_FLOOR: "🛑",
  SMART_EXIT_VOLUME_DEATH: "💀",
  SMART_EXIT_PREBUY_SKIP: "⏭️",
  PAPER_CLOSED: "📊",
  CANCELLED: "❌",
  ERROR: "⚠️"
};
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Africa/Cairo",
    hour12: false
  });
}
function Page() {
  const fn = useServerFn(getTradeLifecycleToday);
  const router = useRouter();
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["trade-lifecycle-today"],
    queryFn: () => fn(),
    refetchInterval: 15e3
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-6xl mx-auto p-4 sm:p-6 space-y-4", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🔎 سجل الصفقات — Trade Lifecycle" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "كل حدث في كل صفقة، من الإشارة لحد الإقفال — بيتحدّث كل 15 ثانية." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/slippage-report", className: "px-3 py-1.5 rounded border text-sm hover:bg-gray-50", children: "📐 Slippage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          refetch();
          router.invalidate();
        }, className: "px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700", children: isFetching ? "…" : "تحديث" })
      ] })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500", children: "جاري التحميل…" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
      "خطأ: ",
      String(error.message)
    ] }),
    data && data.trades.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 bg-gray-50 border border-gray-200 rounded text-center text-gray-500", children: "مفيش أي أحداث النهارده لسه — أول إشارة من الاستراتيجية هتظهر هنا فوراً." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: (data?.trades ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("article", { className: "border border-gray-200 rounded-lg bg-white overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-bold", children: t.symbol }),
          t.strategy && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500", children: t.strategy }),
          t.state && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs px-2 py-1 rounded ${STATE_STYLE[t.state] || "bg-gray-100"}`, children: t.state })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-gray-500", children: [
          t.events.length,
          " حدث"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "relative border-r-2 border-gray-200 mr-4 my-3 space-y-2", children: t.events.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "pr-4 pl-2 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -right-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 flex-wrap text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: EVENT_ICON[e.event_type] || "•" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: e.event_type }),
          e.state && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] px-1.5 py-0.5 rounded ${STATE_STYLE[e.state] || "bg-gray-100"}`, children: e.state }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-500", children: fmtTime(e.created_at) }),
          e.price != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-700", children: [
            "@ ",
            Number(e.price).toFixed(2)
          ] }),
          e.qty != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-gray-500", children: [
            "× ",
            Number(e.qty)
          ] }),
          e.reason && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-gray-600 italic", children: e.reason }),
          e.source && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] text-gray-400", children: [
            "[",
            e.source,
            "]"
          ] })
        ] })
      ] }, e.id)) })
    ] }, t.key)) })
  ] });
}
export {
  Page as component
};
