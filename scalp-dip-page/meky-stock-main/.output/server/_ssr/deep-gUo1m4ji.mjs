import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { b as deepQueryOptions } from "./router-BYsPPCpA.mjs";
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
function aiBadgeCls(s) {
  if (s === "positive") return "bg-bull text-bull-foreground";
  if (s === "negative") return "bg-bear text-bear-foreground";
  if (s === "mixed") return "bg-warn text-warn-foreground";
  return "bg-muted text-muted-foreground";
}
function aiLabel(s) {
  return s === "positive" ? "إيجابي" : s === "negative" ? "سلبي" : s === "mixed" ? "مختلط" : "محايد";
}
function Row({
  r
}) {
  const chgPos = (r.change_pct ?? 0) >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold", children: r.name_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: r.symbol })
        ] }),
        r.sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: r.sector_ar })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-left", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: r.close.toFixed(2) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: chgPos ? "text-bull text-sm" : "text-bear text-sm", children: [
          chgPos ? "+" : "",
          (r.change_pct ?? 0).toFixed(2),
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full border border-border bg-muted/30 px-3 py-1 text-xs", children: [
        "قواعد ثابتة: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: r.rule_label }),
        " (",
        (r.rule_score * 100).toFixed(0),
        "%)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `rounded-full px-3 py-1 text-xs font-bold ${aiBadgeCls(r.ai_sentiment)}`, children: [
        "AI: ",
        aiLabel(r.ai_sentiment),
        " (",
        (r.ai_score * 100).toFixed(0),
        "%)"
      ] })
    ] }),
    r.headlines.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground", children: r.headlines.slice(0, 4).map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: h }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "لا توجد أخبار حديثة" }),
    r.ai_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-3 rounded-lg bg-primary/10 p-3 text-sm text-primary", children: [
      "💡 ",
      r.ai_reason
    ] })
  ] });
}
function DeepAnalysisPage() {
  const {
    data
  } = useSuspenseQuery(deepQueryOptions);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "min-h-screen bg-background p-6", dir: "rtl", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-5xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "🧠 التحليل الهجين التلقائي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "قواعد ثابتة (مجاناً) + AI يفهم الأخبار — أعلى ٦ أسهم حركةً، بدون أي إدخال يدوي." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-xs text-muted-foreground", children: [
          "آخر تحديث: ",
          new Date(data.generatedAt).toLocaleString("ar-EG")
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" })
    ] }),
    data.rows.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-muted-foreground", children: "لا توجد بيانات scan حديثة — شغّل scan من الرئيسية أولاً." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2", children: data.rows.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { r }, r.symbol)) })
  ] }) });
}
export {
  DeepAnalysisPage as component
};
