import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { p as perfQO } from "./router-BYsPPCpA.mjs";
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
function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}
function num(n, digits = 2) {
  return n.toFixed(digits);
}
function StatCard({
  label,
  value,
  sub,
  tone = "neutral"
}) {
  const toneClass = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-bold ${toneClass}`, children: value }),
    sub && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: sub })
  ] });
}
function PerformancePage() {
  const {
    data: s
  } = useSuspenseQuery(perfQO);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6 max-w-5xl mx-auto", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold mb-1", children: "📊 أداء النظام" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "آخر 30 يوم — تحديث تلقائي كل دقيقة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/automation", className: "text-sm text-primary hover:underline", children: "الأتمتة ←" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "إجمالي التوصيات", value: String(s.totalRecos) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "مغلقة", value: String(s.closedRecos), sub: `${s.wins} رابحة / ${s.losses} خاسرة` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "نسبة النجاح", value: pct(s.winRate), tone: s.winRate >= 0.6 ? "bull" : s.winRate >= 0.5 ? "neutral" : "bear" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "التوقع لكل صفقة", value: `${num(s.expectancy)}%`, tone: s.expectancy > 0 ? "bull" : "bear" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 mb-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "متوسط المكسب", value: `+${num(s.avgWinPct)}%`, tone: "bull" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "متوسط الخسارة", value: `${num(s.avgLossPct)}%`, tone: "bear" }),
      s.bestPick && /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "أفضل صفقة", value: `${s.bestPick.symbol}`, sub: `+${num(s.bestPick.pct)}%`, tone: "bull" }),
      s.worstPick && /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { label: "أسوأ صفقة", value: `${s.worstPick.symbol}`, sub: `${num(s.worstPick.pct)}%`, tone: "bear" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold mb-3", children: "🏆 توصيات المستوى الذهبي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "ذهبية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: s.byTier.gold })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "فضية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: s.byTier.silver })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "نجاح الذهبية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xl font-bold ${s.byTier.goldWinRate >= 0.6 ? "text-bull" : "text-foreground"}`, children: pct(s.byTier.goldWinRate) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("footer", { className: "mt-6 text-xs text-muted-foreground text-center", children: [
      "محدث: ",
      new Date(s.generatedAt).toLocaleString("ar-EG")
    ] })
  ] });
}
export {
  PerformancePage as component
};
