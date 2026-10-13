import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { a as getSignalQualityReport } from "./advisory-reports.functions-CC6loMry.mjs";
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
function Page() {
  const [days, setDays] = reactExports.useState(14);
  const fn = useServerFn(getSignalQualityReport);
  const q = useQuery({
    queryKey: ["signal-quality", days],
    queryFn: () => fn({
      data: {
        days
      }
    }),
    refetchInterval: 6e4
  });
  const o = q.data?.overall;
  const buckets = q.data?.bucketStats ?? [];
  const rows = q.data?.rows ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", className: "min-h-screen bg-background p-6 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "⭐ جودة الإشارات" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketwatch-health", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "← فحص Volume" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/reconciliation", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "📒 Reconciliation" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: days, onChange: (e) => setDays(Number(e.target.value)), className: "rounded border px-2 py-1 text-xs", children: [7, 14, 30, 60].map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: d, children: [
          d,
          " يوم"
        ] }, d)) })
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "جاري التحميل..." }),
    o && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-2 gap-3 md:grid-cols-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "عدد الصفقات", value: o.trades }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "فائزة", value: o.wins }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "نسبة الفوز", value: `${o.win_rate}%`, highlight: o.win_rate >= 60 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "ربح صافي (EGP)", value: o.net_pnl.toFixed(1), highlight: o.net_pnl > 0 }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { label: "متوسط النقطة", value: o.avg_score })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-2 text-lg font-semibold", children: "توزيع حسب جودة الإشارة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: buckets.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-3 ${b.bucket === "A" ? "border-green-400 bg-green-50" : b.bucket === "B" ? "border-lime-300 bg-lime-50" : b.bucket === "C" ? "border-amber-300 bg-amber-50" : "border-red-300 bg-red-50"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "فئة ",
          b.bucket,
          " ",
          b.bucket === "A" ? "(≥75)" : b.bucket === "B" ? "(55-74)" : b.bucket === "C" ? "(35-54)" : "(<35)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-2xl font-bold", children: [
          b.trades,
          " صفقة"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          "نسبة فوز: ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
            b.win_rate,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          "صافي: ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: b.net_pnl }),
          " EGP"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          "متوسط/صفقة: ",
          b.avg_pnl
        ] })
      ] }, b.bucket)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/50 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "السهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "التوقيت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "النقاط" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "فئة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "هبوط %" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "صفقات/5د" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "قيمة/5د" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-right", children: "النتيجة" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { children: [
        rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: r.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-xs text-muted-foreground", children: new Date(r.entry_ts).toLocaleString("ar-EG", {
            timeZone: "Africa/Cairo",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit"
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-bold", children: r.score }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs ${r.bucket === "A" ? "bg-green-100 text-green-700" : r.bucket === "B" ? "bg-lime-100 text-lime-700" : r.bucket === "C" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`, children: r.bucket }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.drop_pct != null ? `${r.drop_pct}%` : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.trades_5m ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2", children: r.value_5m != null ? Math.round(r.value_5m).toLocaleString() : "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 font-semibold ${r.is_win ? "text-green-600" : "text-red-600"}`, children: [
            r.pnl > 0 ? "+" : "",
            r.pnl.toFixed(1)
          ] })
        ] }, r.trade_id)),
        !rows.length && !q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 8, className: "p-6 text-center text-muted-foreground", children: "لا توجد صفقات مغلقة في الفترة" }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-blue-50 p-4 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "معادلة النقاط (شفافة):" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-1 list-disc space-y-0.5 pr-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "حتى +40 من نشاط الصفقات في 5 دقايق (40 صفقة = full)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "حتى +30 من قيمة التداول في 5 دقايق (200k EGP = full)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "+20 لو الهبوط بين -3% و -8% (النطاق المثالي)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "+10 لو الدخول بين 10ص و 12ظ توقيت القاهرة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2", children: [
        "💡 الفئة ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "A" }),
        " = إشارات عالية الجودة (يُتوقع أعلى نسبة فوز). لو فئة ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "A" }),
        " بتكسب أضعاف فئة ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "D" }),
        "، ممكن نستخدم النقاط كفلتر إضافي مستقبلاً."
      ] })
    ] })
  ] }) });
}
function Card({
  label,
  value,
  highlight
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-3 ${highlight ? "border-green-400 bg-green-50" : ""}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: value })
  ] });
}
export {
  Page as component
};
