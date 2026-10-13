import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
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
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
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
const getTierDashboard = createServerFn({
  method: "GET"
}).handler(createSsrRpc("bdf462cd26fc76083cc992f2c73674102970d9181654df0e9f023bb1db88ea0f"));
function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
function TierCard({
  t
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary", children: t.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold", children: t.title })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: t.description })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${t.hasData ? "bg-bull/15 text-bull" : "bg-muted text-muted-foreground"}`, children: t.hasData ? "نشط" : "خامل" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-3 gap-2 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/40 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "المفاتيح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: t.payloadKeys.length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/40 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "الحجم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: fmtBytes(t.payloadSizeBytes) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/40 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "الميزات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: t.features.length })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("details", { className: "mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("summary", { className: "cursor-pointer text-xs text-muted-foreground hover:text-foreground", children: [
        "عرض الميزات (",
        t.features.length,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex flex-wrap gap-1", children: t.features.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-accent px-2 py-0.5 font-mono text-[10px] text-accent-foreground", children: f }, f)) })
    ] }),
    t.updatedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-[11px] text-muted-foreground", children: [
      "آخر تحديث: ",
      new Date(t.updatedAt).toLocaleString("ar-EG")
    ] })
  ] });
}
function TiersPage() {
  const fetchDashboard = useServerFn(getTierDashboard);
  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["tier-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 3e4
  });
  const activeCount = data?.tiers.filter((t) => t.hasData).length ?? 0;
  const totalCount = data?.tiers.length ?? 0;
  const maxContrib = Math.max(1e-9, ...data?.topModules.map((m) => m.avgAbsContribution) ?? [1e-9]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/40", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "طبقات الذكاء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
          activeCount,
          " / ",
          totalCount,
          " طبقة نشطة · ",
          data?.recentDecisions ?? 0,
          " قرار في الذاكرة"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), disabled: isFetching, className: "rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50", children: isFetching ? "..." : "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "الرئيسية" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-7xl space-y-8 px-4 py-6", children: [
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-muted-foreground", children: "جاري التحميل…" }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-bear", children: [
        "خطأ في التحميل: ",
        error.message
      ] }),
      data && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "أكثر الموديولات مساهمة" }),
          data.topModules.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-md border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground", children: "لا توجد قرارات في الذاكرة بعد. شغّل سكان لتعبئة السجل." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "الموديول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "عدد المرات" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "متوسط الوزن" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "متوسط الإشارة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "المساهمة" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.topModules.map((m) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-mono text-xs", children: m.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: m.count }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: m.avgWeight.toFixed(3) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: m.avgSignal.toFixed(3) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-32 overflow-hidden rounded bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary", style: {
                  width: `${m.avgAbsContribution / maxContrib * 100}%`
                } }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs tabular-nums", children: m.avgAbsContribution.toFixed(3) })
              ] }) })
            ] }, m.name)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "كتالوج الطبقات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 xl:grid-cols-3", children: data.tiers.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx(TierCard, { t }, t.stateKey)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "آخر القرارات" }),
          data.recentDecisionSamples.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-md border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground", children: "لا توجد قرارات حديثة." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-hidden rounded-xl border border-border bg-card", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/40 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "الوقت" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "السهم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "القرار" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "الثقة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-2 text-right font-medium", children: "المبررات" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.recentDecisionSamples.map((d, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 text-xs text-muted-foreground", children: new Date(d.at).toLocaleTimeString("ar-EG") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-bold", children: d.symbol }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs font-bold ${d.action === "buy" ? "bg-bull/20 text-bull" : d.action === "sell" ? "bg-bear/20 text-bear" : "bg-muted text-muted-foreground"}`, children: d.action === "buy" ? "شراء" : d.action === "sell" ? "بيع" : "محايد" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-3 py-2 tabular-nums", children: [
                d.adjustedConfidence.toFixed(1),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
                  " ",
                  "(",
                  d.baseConfidence.toFixed(0),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-2 font-mono text-xs text-muted-foreground", children: d.rationale })
            ] }, `${d.at}-${i}`)) })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  TiersPage as component
};
