import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as opts } from "./router-BYsPPCpA.mjs";
import { c as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
function fmt(n, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n).toFixed(digits);
}
function fmtMs(n) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1e3) return `${Math.round(n)}ms`;
  return `${(n / 1e3).toFixed(1)}s`;
}
function ExecutionLab() {
  const {
    data
  } = useSuspenseQuery(opts);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-6xl mx-auto space-y-6", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "مختبر التنفيذ" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "تسجيل حقيقي لكل أمر شراء/بيع وعمق السوق لحظة القرار. البيانات دي هتحدد أفضل استراتيجية بيع بعد أسبوعين." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Snapshots اليوم", value: data.snapshots_today.toLocaleString() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "أوامر اليوم", value: data.orders_today.toLocaleString() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "متوسط زمن التنفيذ", value: fmtMs(data.avg_time_to_first_fill_ms) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "متوسط الانزلاق", value: fmt(data.avg_slippage_vs_touch, 3) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "بحسب الحالة", children: Object.keys(data.orders_by_status).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "لا يوجد أوامر اليوم" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm space-y-1", children: Object.entries(data.orders_by_status).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: k }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: v })
      ] }, k)) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "بحسب النوع", children: Object.keys(data.orders_by_type).length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "لا يوجد أوامر اليوم" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "text-sm space-y-1", children: Object.entries(data.orders_by_type).map(([k, v]) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: k }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: v })
      ] }, k)) }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "آخر 20 أمر", children: data.recent_orders.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "لسه مفيش أوامر مسجلة. الاكستنشن هيبدأ يبعت لما نفعّل الـtracker." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "الوقت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "السهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "الاتجاه" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "النوع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "سعر مطلوب" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "سعر تنفيذ" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "Bid/Ask" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "زمن" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right p-2", children: "انزلاق" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.recent_orders.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: new Date(o.placed_at).toLocaleTimeString("ar-EG") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: o.symbol }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: o.side === "buy" ? "شراء" : "بيع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: o.order_type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: o.status }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(o.requested_price) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(o.fill_price_avg) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 font-mono", children: [
          fmt(o.best_bid_at_placement),
          "/",
          fmt(o.best_ask_at_placement)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtMs(o.time_to_first_fill_ms) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-mono", children: fmt(o.slippage_vs_touch, 3) })
      ] }, o.id)) })
    ] }) }) })
  ] });
}
function Stat({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-semibold mt-1", children: value })
  ] });
}
function Card({
  title,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border rounded-lg p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold mb-2", children: title }),
    children
  ] });
}
export {
  ExecutionLab as component
};
