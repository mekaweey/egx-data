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
const getInvestmentOpportunities = createServerFn({
  method: "GET"
}).handler(createSsrRpc("cdd24e49e7b21e25f5eca7f05fe248f81997da385d8140962e6dd9b9b850a6a5"));
function fmt(n, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}
function ScoreBar({
  value,
  label
}) {
  const v = value ?? 0;
  const color = v >= 70 ? "bg-bull" : v >= 50 ? "bg-warn" : "bg-bear";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px]", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: Math.round(v) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 h-1 w-full rounded-full bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1 rounded-full ${color}`, style: {
      width: `${Math.min(100, v)}%`
    } }) })
  ] });
}
function PickCard({
  p,
  rank
}) {
  const sentimentColor = p.positive_news_count > p.negative_news_count ? "text-bull" : p.negative_news_count > 0 ? "text-bear" : "text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6 shadow-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg font-extrabold text-primary", children: [
          "#",
          rank
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/stock/$symbol", params: {
              symbol: p.symbol
            }, className: "text-xl font-bold hover:text-primary", children: p.name_ar }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: p.symbol })
          ] }),
          p.sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: p.sector_ar })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-extrabold tabular-nums text-primary", children: Math.round(p.investment_score) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wide text-muted-foreground", children: "نقاط الاستثمار" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed", children: p.thesis_ar }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-semibold text-primary", children: "📅 خطة الاستثمار (شهر كامل)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 text-center text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "اشتري من" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-bold tabular-nums", children: fmtDate(p.buy_from) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
            "إلى ",
            fmtDate(p.buy_to)
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "احتفظ حتى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-bold tabular-nums text-bull", children: fmtDate(p.hold_until) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: "~30 يوم" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "الربح المتوقع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 font-bold tabular-nums text-bull", children: [
            "+",
            fmt(p.expected_gain_pct, 1),
            "%"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: "على رأس المال" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "السعر الحالي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-bold tabular-nums", children: fmt(p.close) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { title: "نطاق الشراء المقترح", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "دخول" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 font-bold tabular-nums", children: [
          fmt(p.entry_min),
          "–",
          fmt(p.entry_max)
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "الهدف" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-bold tabular-nums text-bull", children: fmt(p.target) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "وقف الخسارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-bold tabular-nums text-bear", children: fmt(p.stop_loss) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-dashed border-border p-3 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "مكرر الربحية", children: [
        "P/E: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: fmt(p.pe_ratio, 1) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "العائد على حقوق المساهمين", children: [
        "ROE: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: p.roe != null ? `${fmt(p.roe, 1)}%` : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "نمو الإيرادات السنوي", children: [
        "نمو الإيرادات: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: p.revenue_growth_yoy != null ? `${fmt(p.revenue_growth_yoy, 1)}%` : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { title: "عائد التوزيعات", children: [
        "توزيعات: ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: p.dividend_yield != null ? `${fmt(p.dividend_yield, 1)}%` : "—" })
      ] }),
      p.next_earnings_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-warn", children: [
        "📢 نتائج مالية: ",
        fmtDate(p.next_earnings_date)
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-5 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { value: p.technical_score, label: "فني" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { value: p.fundamental_score, label: "أساسي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { value: p.sentiment_score, label: "مشاعر" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { value: p.macro_score, label: "اقتصاد" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(ScoreBar, { value: p.sector_score, label: "قطاع" })
    ] }),
    p.recent_news.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mb-2 text-xs font-semibold ${sentimentColor}`, children: [
        "📰 آخر الأخبار (",
        p.positive_news_count,
        " إيجابي · ",
        p.negative_news_count,
        " سلبي · ",
        p.high_impact_news_count,
        " مؤثّر)"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5 text-xs", children: p.recent_news.map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2 rounded border border-border/50 bg-background/50 p-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${n.sentiment === "positive" ? "bg-bull" : n.sentiment === "negative" ? "bg-bear" : "bg-muted-foreground"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          n.source_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: n.source_url, target: "_blank", rel: "noreferrer", className: "font-medium hover:text-primary", children: n.headline }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: n.headline }),
          n.summary_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-muted-foreground", children: n.summary_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-0.5 text-[10px] text-muted-foreground", children: [
            n.source_name ?? "مصدر",
            " ",
            n.impact_level === "high" && "• تأثير عالٍ"
          ] })
        ] })
      ] }, i)) })
    ] })
  ] });
}
function InvestmentPage() {
  const fetchFn = useServerFn(getInvestmentOpportunities);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["investment-opportunities"],
    queryFn: () => fetchFn(),
    refetchInterval: 5 * 6e4
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-extrabold", children: [
          "💼 فرص ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "الاستثمار الشهرية" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "أفضل الأسهم المتوقع صعودها خلال الـ 30 يوم القادمة — مبنية على الاتجاه الفني والأساسيات والأخبار اليومية" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/track-record", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "📈 سجل الأداء" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-primary", children: "📌 كيف تستخدم هذه الصفحة؟" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ul", { className: "mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "كل سهم له خطة كاملة: تاريخ شراء، تاريخ بيع متوقع، هدف، ووقف خسارة." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "اشتري في نطاق الدخول، وحدد وقف الخسارة فور الشراء." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "وزّع رأس مالك على 3–5 أسهم لتقليل المخاطر." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "الصفحة تتحدث تلقائيًا مع كل فحص يومي (بيانات الأخبار والأساسيات والمؤشرات)." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-2 text-xs", children: "⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. الاستثمار في الأسهم ينطوي على مخاطر." }),
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-border bg-card p-8 text-center text-muted-foreground", children: "جاري تحليل الفرص…" }),
      !isLoading && data && data.picks.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card p-8 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: "لا توجد فرص استثمارية تستوفي المعايير حاليًا" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "السوق قد لا يكون في حالة صاعدة. تحقق مجددًا بعد التحديث اليومي القادم." })
      ] }),
      data && data.picks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "mb-3 text-lg font-bold", children: [
          "🏆 أفضل ",
          data.picks.length,
          " فرص للشهر القادم"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: data.picks.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsx(PickCard, { p, rank: i + 1 }, p.symbol)) }),
        data.watchlist.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-3 mt-8 text-lg font-bold", children: "👀 قائمة المراقبة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: data.watchlist.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/stock/$symbol", params: {
            symbol: p.symbol
          }, className: "rounded-lg border border-border bg-card p-3 text-sm transition hover:border-primary/50", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: p.name_ar }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
                p.symbol,
                " · ",
                p.sector_ar ?? "—"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-primary", children: Math.round(p.investment_score) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-bull", children: [
                "+",
                fmt(p.expected_gain_pct, 1),
                "%"
              ] })
            ] })
          ] }) }, p.symbol)) })
        ] })
      ] })
    ] })
  ] });
}
export {
  InvestmentPage as component
};
