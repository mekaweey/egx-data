import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { g as getMissedSignalsReport } from "./trade-ledger.functions-BOankbNu.mjs";
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
  return `${s}${n.toFixed(2)}%`;
}
function fmtPx(n) {
  if (n == null) return "—";
  return Number(n).toFixed(3);
}
function reasonLabel(r) {
  switch (r) {
    case "busy_open_trade":
      return "🔒 صفقة مفتوحة";
    case "not_top_pick":
      return "🥈 مش أفضل مرشح";
    case "prebuy_filter":
      return "🔇 فلتر السيولة";
    default:
      return r;
  }
}
function outcomeBadge(o) {
  const map = {
    would_win: {
      txt: "🎯 كان هيربح",
      cls: "bg-emerald-100 text-emerald-800 border-emerald-300"
    },
    would_lose: {
      txt: "🛑 كان هيخسر",
      cls: "bg-red-100 text-red-800 border-red-300"
    },
    flat: {
      txt: "➖ ثابت",
      cls: "bg-gray-100 text-gray-700 border-gray-300"
    },
    unknown: {
      txt: "❔ غير مؤكد",
      cls: "bg-yellow-50 text-yellow-800 border-yellow-300"
    }
  };
  const m = map[o] ?? map.unknown;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-2 py-0.5 rounded border text-xs ${m.cls}`, children: m.txt });
}
function Page() {
  const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const [date, setDate] = reactExports.useState(today);
  const fetchReport = useServerFn(getMissedSignalsReport);
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["missed-signals", date],
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "🎯 الإشارات الضايعة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-gray-600", children: "كل مرشح مطابق لشروط DIP اترفض/ما اتنفذش؛ الجدول بيحسب لو دخلنا كان هيوصل TP ولا هيهبط لـ SL خلال ساعة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "border rounded px-2 py-1 text-sm" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), className: "px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700", children: isFetching ? "…" : "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "text-sm text-blue-600 hover:underline", children: "← العودة" })
      ] })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-gray-500", children: "جاري التحميل…" }),
    error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
      "خطأ: ",
      String(error.message)
    ] }),
    data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "إجمالي", value: String(data.summary.total) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "كان هيربح", value: String(data.summary.would_win), tone: "win" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "كان هيخسر", value: String(data.summary.would_lose), tone: "lose" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "غير مؤكد / ثابت", value: String(data.summary.unknown + data.summary.flat) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "ربح ضاع (تقديري)", value: `${data.summary.missed_profit_egp} EGP`, tone: "win" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "خسارة اتفاديت", value: `${data.summary.avoided_loss_egp} EGP`, tone: "lose" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { title: "صافي حكم النظام", value: `${(data.summary.avoided_loss_egp - data.summary.missed_profit_egp).toFixed(0)} EGP` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-white rounded border shadow-sm overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-gray-50 text-gray-700", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "الوقت" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السبب" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Rank" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Drop %" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "TP" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "أعلى/أدنى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "Max Gain / Loss" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "النتيجة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "P&L تقديري" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
          data.rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t hover:bg-gray-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 whitespace-nowrap", children: new Date(r.ts).toLocaleTimeString("ar-EG", {
              timeZone: "Africa/Cairo"
            }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: r.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: reasonLabel(r.reason) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.rank ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtPx(r.candidate_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-red-700", children: fmtPct(r.drop_pct != null ? Number(r.drop_pct) * 100 : null) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: fmtPx(r.tp_price) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2 text-gray-600", children: [
              fmtPx(r.max_price),
              " / ",
              fmtPx(r.min_price)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "p-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-emerald-700", children: fmtPct(r.max_gain_pct) }),
              " / ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-red-700", children: fmtPct(r.max_loss_pct) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: outcomeBadge(r.outcome) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-2 font-semibold ${r.est_pnl == null ? "text-gray-400" : r.est_pnl >= 0 ? "text-emerald-700" : "text-red-700"}`, children: r.est_pnl == null ? "—" : `${r.est_pnl > 0 ? "+" : ""}${r.est_pnl}` })
          ] }, r.id)),
          !data.rows.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 11, className: "p-6 text-center text-gray-500", children: "مافيش إشارات ضايعة في اليوم ده." }) })
        ] })
      ] }) })
    ] })
  ] });
}
function Card({
  title,
  value,
  tone
}) {
  const cls = tone === "win" ? "text-emerald-700" : tone === "lose" ? "text-red-700" : "text-gray-900";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-white rounded border p-3 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-gray-500", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xl font-bold ${cls}`, children: value })
  ] });
}
export {
  Page as component
};
