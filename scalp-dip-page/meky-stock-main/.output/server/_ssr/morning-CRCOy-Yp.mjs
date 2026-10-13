import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as getMorningBrief } from "./router-BYsPPCpA.mjs";
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
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function Card({
  p,
  rank
}) {
  const top = rank === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
    symbol: p.symbol
  }, className: `block rounded-2xl border p-6 transition hover:scale-[1.01] ${top ? "border-bull/60 bg-gradient-to-br from-bull/10 to-card shadow-xl shadow-bull/10" : "border-border bg-card hover:border-primary/50"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          top && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "⭐" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold text-muted-foreground", children: [
            "#",
            rank + 1
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-xl font-bold", children: p.name_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: p.symbol })
        ] }),
        p.sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: p.sector_ar })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-bull/20 px-3 py-1 text-xs font-bold text-bull", children: p.signal === "strong_buy" ? "شراء قوي" : "شراء" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
          "ثقة ",
          p.confidence,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[10px] text-muted-foreground", children: [
          "اتفاق ",
          p.ensemble_agreement,
          "/5"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-3 gap-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "الدخول" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold", children: [
          fmt(p.entry_min),
          " – ",
          fmt(p.entry_max)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "الهدف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-bull", children: fmt(p.target) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "وقف الخسارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-bear", children: fmt(p.stop_loss) })
      ] })
    ] }),
    p.symbol_history_n > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-[11px] text-muted-foreground", children: [
      "أداء السهم تاريخياً مع النظام: ",
      fmt((p.symbol_win_rate ?? 0) * 100, 0),
      "% نجاح من ",
      p.symbol_history_n,
      " توصية"
    ] }),
    p.reasons_ar.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-1 text-xs text-muted-foreground", children: p.reasons_ar.slice(0, 3).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
      "• ",
      r
    ] }, i)) })
  ] });
}
function MorningPage() {
  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["morning-brief"],
    queryFn: () => getMorningBrief(),
    refetchInterval: 5 * 60 * 1e3
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-4xl px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "بريفينج الصباح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "صفقات اليوم اللي عدّت بوابة Conviction قبل افتتاح السوق" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), disabled: isFetching, className: "rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary", children: isFetching ? "..." : "تحديث" })
    ] }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground", children: "جاري التحميل..." }),
    data?.noTrade && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl", children: "🛑" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-bold", children: "لا صفقات اليوم" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: data.reason }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-4 text-xs text-muted-foreground", children: "عدم الدخول قرار ذكي — لا تجبر صفقة ضعيفة." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/tomorrow", className: "mt-4 inline-block text-sm text-primary hover:underline", children: "شوف كل توصيات الـ tier الذهبي →" })
    ] }),
    data?.picks && data.picks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      data.picks.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { p, rank: i }, p.symbol)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "معايير البوابة:" }),
        " ثقة ≥ ",
        data.minConfidenceUsed,
        "% • اتفاق ≥ 4/5 موديلات • verifier موافق • سجل السهم ليس سيئاً • لم يُرفض بقواعد الفشل"
      ] })
    ] })
  ] });
}
export {
  MorningPage as component
};
