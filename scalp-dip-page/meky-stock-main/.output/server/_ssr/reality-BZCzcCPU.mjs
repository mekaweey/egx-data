import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { r as realityQuery } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as useSuspenseQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
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
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
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
function pctCls(n) {
  return n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-muted-foreground";
}
function wrCls(n) {
  return n >= 55 ? "text-bull" : n >= 45 ? "text-warn" : "text-bear";
}
function RealityPage() {
  const {
    data
  } = useSuspenseQuery(realityQuery);
  const verdictCls = data.verdict.severity === "good" ? "border-bull bg-bull/10 text-bull" : data.verdict.severity === "warn" ? "border-warn bg-warn/10 text-warn" : "border-bear bg-bear/10 text-bear";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "mx-auto max-w-6xl space-y-6 p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "🔍 Reality Check" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "أداء التوصيات الحقيقي — مفيش تجميل، بس الأرقام" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-primary hover:underline", children: "→ الرئيسية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-xl border-2 p-5 text-lg font-bold ${verdictCls}`, children: data.verdict.ar }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "إجمالي التوصيات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-2xl font-bold", children: data.total }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          data.evaluated,
          " مُقيّمة · ",
          data.pending,
          " معلقة"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Win Rate الإجمالي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-2xl font-bold ${wrCls(data.overallWinRate)}`, children: [
          data.overallWinRate,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "المطلوب ≥ 55%" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "متوسط العائد/توصية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-2xl font-bold ${pctCls(data.overallAvgPct)}`, children: [
          data.overallAvgPct > 0 ? "+" : "",
          data.overallAvgPct,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "إجمالي العائد التراكمي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-2xl font-bold ${pctCls(data.totalReturnPct)}`, children: [
          data.totalReturnPct > 0 ? "+" : "",
          data.totalReturnPct,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "حسب نوع الإشارة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2 text-start", children: "الإشارة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "عدد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "ربح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "خسارة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "منتهية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Win Rate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "متوسط %" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-2", children: "Expectancy" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.bySignal.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-semibold", children: r.signal }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center", children: r.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center text-bull", children: r.wins }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center text-bear", children: r.losses }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center text-muted-foreground", children: r.expired }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-center font-bold ${wrCls(r.win_rate)}`, children: [
            r.win_rate,
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-center ${pctCls(r.avg_pct)}`, children: [
            r.avg_pct,
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-center font-semibold ${pctCls(r.expectancy)}`, children: [
            r.expectancy > 0 ? "+" : "",
            r.expectancy,
            "%"
          ] })
        ] }, r.signal)) })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Expectancy = القيمة المتوقعة لكل توصية. لو سالبة → بتخسر فلوس طويل المدى." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "حسب درجة الثقة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "المفروض الثقة الأعلى = Win Rate أعلى. لو مش كده، نموذج الثقة معطوب." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-5", children: data.byConfidence.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-3 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: b.bucket }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-xl font-bold ${wrCls(b.win_rate)}`, children: [
          b.win_rate,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
          b.total,
          " توصية"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xs ${pctCls(b.avg_pct)}`, children: [
          b.avg_pct > 0 ? "+" : "",
          b.avg_pct,
          "%"
        ] })
      ] }, b.bucket)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold text-bull", children: "🏆 أفضل 5 أسهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.topWinners.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-bold", children: s.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center text-xs text-muted-foreground", children: s.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-end font-bold ${pctCls(s.avg_pct)}`, children: [
            "+",
            s.avg_pct,
            "%"
          ] })
        ] }, s.symbol)) }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold text-bear", children: "⚠️ أسوأ 5 أسهم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("table", { className: "w-full text-sm", children: /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.topLosers.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border/50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 font-bold", children: s.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-2 text-center text-xs text-muted-foreground", children: s.total }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `p-2 text-end font-bold ${pctCls(s.avg_pct)}`, children: [
            s.avg_pct,
            "%"
          ] })
        ] }, s.symbol)) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-xs text-muted-foreground", children: [
      "آخر تحديث: ",
      new Date(data.generatedAt).toLocaleString("ar-EG")
    ] })
  ] });
}
export {
  RealityPage as component
};
