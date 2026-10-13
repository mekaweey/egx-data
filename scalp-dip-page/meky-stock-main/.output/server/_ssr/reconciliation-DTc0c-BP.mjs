import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { g as getReconciliationReport } from "./advisory-reports.functions-CC6loMry.mjs";
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
function fmt(n, dp = 2) {
  return n == null ? "—" : Number(n).toFixed(dp);
}
function pct(n) {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}
function Page() {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const [date, setDate] = reactExports.useState(today);
  const fn = useServerFn(getReconciliationReport);
  const q = useQuery({
    queryKey: ["recon", date],
    queryFn: () => fn({
      data: {
        date
      }
    }),
    refetchInterval: 3e4
  });
  const s = q.data?.summary;
  const rows = q.data?.rows ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", className: "min-h-screen bg-background p-6 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "📒 تسوية يومية" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "← فحص Volume" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signal-quality", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "⭐ Signal Quality" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "rounded border px-2 py-1 text-xs" })
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "جاري التحميل..." }),
    q.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
      "خطأ: ",
      q.error.message
    ] }),
    s && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "إشارات ورقية", value: s.total_signals }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "تنفيذ حقيقي", value: s.total_real }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "مطابق", value: s.matched, highlight: s.matched > 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "إشارة بدون تنفيذ", value: s.signal_only, warn: s.signal_only > 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "تنفيذ بدون إشارة", value: s.real_only, warn: s.real_only > 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "ربح ورقي (EGP)", value: fmt(s.simulated_pnl, 1) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "ربح حقيقي (EGP)", value: fmt(s.real_pnl, 1) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "أسوأ انزلاق بيع %", value: fmt(s.sell_drift_worst_pct, 2) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الحالة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "دخول ورقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "دخول حقيقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "انزلاق شراء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "خروج ورقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "خروج حقيقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "انزلاق بيع" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "ربح ورقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "ربح حقيقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "فرق" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        rows.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: r.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs ${r.status === "matched" ? "bg-green-100 text-green-700" : r.status === "signal_only" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`, children: r.status === "matched" ? "مطابق" : r.status === "signal_only" ? "بدون تنفيذ" : "بدون إشارة" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.paper_entry) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.real_buy) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: pct(r.buy_drift_pct) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.paper_exit) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.real_sell) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: pct(r.sell_drift_pct) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.paper_pnl, 1) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmt(r.real_pnl, 1) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 ${(r.pnl_delta ?? 0) < 0 ? "text-red-600" : "text-green-600"}`, children: fmt(r.pnl_delta, 1) })
        ] }, i)),
        !rows.length && !q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 11, className: "p-6 text-center text-muted-foreground", children: "لا توجد بيانات لهذا اليوم" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: '💡 المطابقة على أساس رمز السهم + أقرب توقيت خلال 30 دقيقة. "بدون تنفيذ" = إشارة الاستراتيجية لم تُنفَّذ فعلياً؛ "بدون إشارة" = صفقة يدوية أو من مصدر آخر.' })
  ] }) });
}
function Card({
  label,
  value,
  warn,
  highlight
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-3 ${warn ? "border-amber-400 bg-amber-50" : highlight ? "border-green-400 bg-green-50" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: value })
  ] });
}
export {
  Page as component
};
