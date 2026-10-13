import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { a as getSlippageReport } from "./trade-ledger.functions-BOankbNu.mjs";
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
function fmtPct(n) {
  if (n == null) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(3)}%`;
}
function fmtSec(n) {
  if (n == null) return "—";
  return n < 60 ? `${n.toFixed(1)}s` : `${(n / 60).toFixed(1)}m`;
}
function fmtPx(n) {
  if (n == null) return "—";
  return n.toFixed(3);
}
function slipClass(n, side) {
  if (n == null) return "text-gray-400";
  const good = side === "buy" ? n < -0.05 : n > 0.05;
  const bad = side === "buy" ? n > 0.15 : n < -0.15;
  if (good) return "text-emerald-700 font-semibold";
  if (bad) return "text-red-700 font-semibold";
  return "text-gray-700";
}
function Page() {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const [date, setDate] = reactExports.useState(today);
  const fetchReport = useServerFn(getSlippageReport);
  const {
    data,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["slippage-report", date],
    queryFn: () => fetchReport({
      data: {
        date
      }
    }),
    refetchInterval: 3e4
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-7xl mx-auto space-y-6", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-3 justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "📐 Slippage Report" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "الفرق بين السعر المتوقع (لحظة الإشارة / لحظة طلب البيع) والسعر الفعلي اللي اتنفّذ في ثاندر." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "border rounded px-2 py-1 text-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), className: "border rounded px-3 py-1 text-sm bg-white hover:bg-gray-50", children: "🔄 تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/trade-lifecycle", className: "text-sm text-blue-600 hover:underline", children: "← Trade Lifecycle" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "text-sm text-blue-600 hover:underline", children: "Health →" })
      ] })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500", children: "جاري التحميل..." }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
      "خطأ: ",
      String(error.message)
    ] }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "عدد الصفقات", value: String(data.summary.trades), sub: `${data.summary.paired_buys} شراء / ${data.summary.paired_sells} بيع` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "متوسط انزلاق الشراء", value: fmtPct(data.summary.buy_slippage_avg_pct), sub: `وسيط ${fmtPct(data.summary.buy_slippage_median_pct)} · أسوأ ${fmtPct(data.summary.buy_slippage_worst_abs_pct)}`, tone: data.summary.buy_slippage_avg_pct != null && data.summary.buy_slippage_avg_pct > 0.2 ? "bad" : "ok" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "متوسط انزلاق البيع", value: fmtPct(data.summary.sell_slippage_avg_pct), sub: `وسيط ${fmtPct(data.summary.sell_slippage_median_pct)} · أسوأ ${fmtPct(data.summary.sell_slippage_worst_abs_pct)}`, tone: data.summary.sell_slippage_avg_pct != null && data.summary.sell_slippage_avg_pct < -0.2 ? "bad" : "ok" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "زمن التنفيذ", value: `شراء ${fmtSec(data.summary.buy_latency_median_sec)}`, sub: `بيع ${fmtSec(data.summary.sell_latency_median_sec)} (وسيط)` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "ازاي تقرا:" }),
        " انزلاق الشراء الموجب = اشتريت أغلى من المتوقع (سيء). انزلاق البيع الموجب = بعت أعلى من المتوقع (كويس). القيمة المثالية = صفر أو قريبة منه. لو المتوسط تعدى 0.2% في الاتجاه السيء → في مشكلة سرعة/سيولة محتاجة فحص."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white border rounded overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "min-w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 text-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "الاستراتيجية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "متوقع شراء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "فعلي شراء" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "انزلاق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "زمن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "متوقع بيع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "فعلي بيع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "انزلاق" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "زمن" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right px-3 py-2", children: "النهاية" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          data.rows.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 11, className: "px-3 py-6 text-center text-gray-500", children: "لا توجد صفقات في هذا اليوم بعد." }) }),
          data.rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-gray-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-semibold", children: r.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-600", children: r.strategy || "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: fmtPx(r.expected_buy) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: fmtPx(r.actual_buy) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 ${slipClass(r.buy_slippage_pct, "buy")}`, children: fmtPct(r.buy_slippage_pct) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-600", children: fmtSec(r.buy_latency_sec) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: fmtPx(r.expected_sell) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: fmtPx(r.actual_sell) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `px-3 py-2 ${slipClass(r.sell_slippage_pct, "sell")}`, children: fmtPct(r.sell_slippage_pct) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-600", children: fmtSec(r.sell_latency_sec) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-gray-600", children: r.exit_reason || "—" })
          ] }, r.key))
        ] })
      ] }) })
    ] })
  ] });
}
function Card({
  title,
  value,
  sub,
  tone
}) {
  const border = tone === "bad" ? "border-red-300 bg-red-50" : "border-gray-200 bg-white";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-3 ${border}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-600", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold mt-1", children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500 mt-1", children: sub })
  ] });
}
export {
  Page as component
};
