import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, c as createSsrRpc, I as getTomorrowPicks } from "./router-BYsPPCpA.mjs";
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
const getUpcomingCatalysts = createServerFn({
  method: "GET"
}).handler(createSsrRpc("64ee50c4206716d8f38bde1a4a7337dde453b61f1c25d8870e0f940f2eed4e61"));
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function PickCard({
  p,
  rank
}) {
  const isElite = rank === 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
    symbol: p.symbol
  }, className: `block rounded-2xl border p-6 transition hover:scale-[1.01] ${isElite ? "border-bull/60 bg-gradient-to-br from-bull/10 to-card shadow-lg shadow-bull/10" : "border-border bg-card hover:border-primary/50"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          isElite && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-2xl", children: "👑" }),
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
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Metric, { label: "السعر الآن", value: fmt(p.close) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Metric, { label: "متوقع غداً", value: `+${fmt(p.expected_next_day_pct, 2)}%`, tone: "bull", big: true }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Metric, { label: "هدف قصير", value: fmt(p.target) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Metric, { label: "وقف خسارة", value: fmt(p.stop_loss) })
    ] }),
    p.entry_timing_ar && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary", children: [
      "⏱ ",
      p.entry_timing_ar
    ] }),
    p.reasons_ar.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-1 text-sm text-muted-foreground", children: p.reasons_ar.slice(0, 3).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "✓" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: r })
    ] }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground", children: [
      p.ensemble_agreement != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "اتفاق النماذج: ",
        p.ensemble_agreement,
        "/5"
      ] }),
      p.technical_score != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
        "فني: ",
        fmt(p.technical_score, 0)
      ] }),
      p.expected_gain_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bull", children: [
        "هدف كامل: +",
        fmt(p.expected_gain_pct, 1),
        "%"
      ] })
    ] })
  ] });
}
function Metric({
  label,
  value,
  tone,
  big
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `tabular-nums font-bold ${big ? "text-2xl" : "text-base"} ${tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground"}`, children: value })
  ] });
}
function TomorrowPage() {
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["tomorrow-picks"],
    queryFn: () => getTomorrowPicks(),
    refetchInterval: 6e4
  });
  const fetchCatalysts = useServerFn(getUpcomingCatalysts);
  const {
    data: catalysts
  } = useQuery({
    queryKey: ["upcoming-catalysts"],
    queryFn: () => fetchCatalysts(),
    refetchInterval: 10 * 60 * 1e3,
    staleTime: 5 * 60 * 1e3
  });
  const picks = data?.picks ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-black", children: "🎯 توقعات الغد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "أسهم النخبة فقط: ثقة ≥",
          data?.minConfidence ?? 70,
          "% وتوقع صعود إيجابي للجلسة التالية"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center gap-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-6xl space-y-6 px-4 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "تنويه:" }),
        " هذه توقعات احتمالية مبنية على نماذج إحصائية. الدقة التاريخية للنموذج ~65-72% — يعني من كل ١٠ أسهم تظهر هنا، تاريخياً ٢-٣ منهم قد لا يحققون الصعود المتوقع. أدر مخاطرك واستخدم وقف الخسارة دائماً."
      ] }),
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center text-muted-foreground", children: "جاري التحميل…" }),
      catalysts && catalysts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-2xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 text-lg font-bold", children: "📰 محفزات أخبارية قادمة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mb-3 text-xs text-muted-foreground", children: "توقعات تأثير أخبار حديثة على الأسهم خلال الأيام القادمة (بناءً على تحليل الذكاء الاصطناعي)." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: catalysts.map((c) => {
          const up = c.expected_direction === "up";
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/stock/$symbol", params: {
              symbol: c.symbol
            }, className: "rounded bg-muted px-2 py-1 text-xs font-bold hover:bg-primary/20", children: c.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium line-clamp-2", children: c.headline }),
              c.baladi_summary && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: c.baladi_summary }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-muted-foreground", children: [
                "نافذة التأثير: ",
                c.impact_start_date,
                " → ",
                c.impact_end_date,
                " • ثقة ",
                c.confidence,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${up ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"}`, children: [
              up ? "↑" : "↓",
              " ",
              c.expected_magnitude_pct != null ? `${Number(c.expected_magnitude_pct).toFixed(1)}%` : "—"
            ] })
          ] }, c.id);
        }) })
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-bear/40 bg-bear/10 p-4 text-bear", children: [
        "تعذر تحميل البيانات: ",
        error.message
      ] }),
      !isLoading && picks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-10 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl", children: "🤷" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-bold", children: "لا توجد أسهم بثقة كافية اليوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm text-muted-foreground", children: [
          "النموذج لم يجد أي سهم يتجاوز عتبة الثقة المطلوبة (≥",
          data?.minConfidence ?? 70,
          "%) مع توقع صعود إيجابي.",
          /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
          "ده طبيعي في الأيام اللي السوق فيها مش واضح — أفضل من إعطاء إشارات ضعيفة."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: "عرض كل الأسهم" })
      ] }),
      picks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: picks.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(PickCard, { p, rank: i }, p.symbol)) }),
      data?.finishedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-center text-xs text-muted-foreground", children: [
        "آخر مسح: ",
        new Date(data.finishedAt).toLocaleString("ar-EG")
      ] })
    ] })
  ] });
}
export {
  TomorrowPage as component
};
