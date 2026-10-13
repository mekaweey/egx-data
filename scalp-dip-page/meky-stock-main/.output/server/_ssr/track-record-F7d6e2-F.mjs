import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./router-BYsPPCpA.mjs";
import { g as getTrackRecord } from "./track-record.functions-BhH-QHBv.mjs";
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
const OUTCOME_LABELS = {
  target_hit: {
    ar: "✓ هدف",
    cls: "bg-bull/20 text-bull"
  },
  stop_hit: {
    ar: "✗ وقف",
    cls: "bg-bear/20 text-bear"
  },
  expired: {
    ar: "⏱ منتهي",
    cls: "bg-muted text-muted-foreground"
  }
};
function fmt(n, digits = 2, sign = false) {
  const v = n.toLocaleString("en-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
  return sign && n >= 0 ? `+${v}` : v;
}
function SummaryCard({
  title,
  s
}) {
  const profitable = s.expectancy_pct > 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-muted-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 grid grid-cols-2 gap-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "عدد التوصيات" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-bold tabular-nums", children: s.total })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "معدل النجاح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-2xl font-bold tabular-nums ${s.win_rate >= 50 ? "text-bull" : "text-bear"}`, children: [
          fmt(s.win_rate, 1),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "متوسط الربح" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-semibold tabular-nums text-bull", children: [
          fmt(s.avg_win_pct, 2, true),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "متوسط الخسارة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-semibold tabular-nums text-bear", children: [
          fmt(s.avg_loss_pct, 2, true),
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 mt-1 border-t border-border pt-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground text-xs", children: "التوقع الإحصائي لكل صفقة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-2xl font-extrabold tabular-nums ${profitable ? "text-bull" : "text-bear"}`, children: [
          fmt(s.expectancy_pct, 2, true),
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-muted-foreground", children: profitable ? "موجب = الاستراتيجية رابحة على المدى الطويل." : "سالب = الاستراتيجية خاسرة في هذه الفترة. لا تتداول بها." })
      ] })
    ] })
  ] });
}
function EquityChart({
  data
}) {
  if (data.length < 2) return null;
  const W = 800, H = 200, P = 30;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.cumulative_pct);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 0);
  const rangeY = maxY - minY || 1;
  const sx = (i) => P + i / (xs.length - 1) * (W - 2 * P);
  const sy = (y) => H - P - (y - minY) / rangeY * (H - 2 * P);
  const zeroY = sy(0);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d.cumulative_pct).toFixed(1)}`).join(" ");
  const finalPct = ys[ys.length - 1];
  const positive = finalPct >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-baseline justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-sm font-semibold text-muted-foreground", children: "منحنى الأرباح التراكمي (لو دخلت كل توصية بنفس الحجم)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xl font-bold tabular-nums ${positive ? "text-bull" : "text-bear"}`, children: [
        fmt(finalPct, 1, true),
        "%"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { viewBox: `0 0 ${W} ${H}`, className: "w-full", preserveAspectRatio: "none", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: P, y1: zeroY, x2: W - P, y2: zeroY, stroke: "currentColor", strokeWidth: "0.5", className: "text-border", strokeDasharray: "3 3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: path, fill: "none", stroke: "currentColor", strokeWidth: "2", className: positive ? "text-bull" : "text-bear" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex justify-between text-[10px] text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: data[0].date }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: data[data.length - 1].date })
    ] })
  ] });
}
function TrackRecord() {
  const fn = useServerFn(getTrackRecord);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["track-record"],
    queryFn: () => fn()
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-extrabold", children: "📈 سجل الأداء الحقيقي" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "نتائج توصيات الشراء السابقة — هل البرنامج يستحق الثقة؟" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← العودة للتوصيات" })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-7xl px-6 py-6", children: [
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-20 text-center text-muted-foreground", children: "جاري التحميل…" }),
      data && data.buy_all.total === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-16 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-lg font-semibold", children: "لا توجد توصيات مغلقة بعد" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "التوصيات بتتقيّم بعد 24 ساعة على الأقل من إنشائها." })
      ] }),
      data && data.buy_all.total > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 grid gap-4 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { title: "آخر 30 يوم", s: data.buy_30d }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { title: "آخر 90 يوم", s: data.buy_90d }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SummaryCard, { title: "جميع التوصيات", s: data.buy_all })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(EquityChart, { data: data.equity_curve }) }),
        data.buy_all.expectancy_pct <= 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 rounded-xl border border-bear/40 bg-bear/10 p-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-bear", children: "⚠️ تحذير صريح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-sm", children: [
            "التوقع الإحصائي للاستراتيجية حالياً ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "سالب" }),
            ". يعني لو دخلت كل توصية على المدى الطويل هتخسر فلوس.",
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
            "ده ممكن يبقى بسبب: السوق في اتجاه هابط، أو الـ AI محتاج تعديل، أو توقيت الدخول/الخروج محتاج تحسين."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm font-semibold", children: "نصيحتنا: انتظر لحد ما الرقم ده يبقى موجب على آخر 30 يوم قبل ما تتداول بفلوس حقيقية." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border px-5 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-semibold", children: "آخر 30 توصية" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "السهم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "الثقة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "سعر الدخول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "النتيجة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-2 text-start", children: "العائد" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.recent.map((t) => {
              const o = OUTCOME_LABELS[t.outcome] ?? {
                ar: t.outcome,
                cls: "bg-muted"
              };
              const pct = t.realized_pct ?? 0;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t border-border hover:bg-muted/20", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 font-semibold", children: t.symbol }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 text-xs text-muted-foreground tabular-nums", children: t.created_at.slice(0, 10) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-2 tabular-nums", children: [
                  t.confidence,
                  "%"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2 tabular-nums", children: fmt(t.price_at_reco) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-md px-2 py-0.5 text-xs font-semibold ${o.cls}`, children: o.ar }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: `px-4 py-2 font-semibold tabular-nums ${pct >= 0 ? "text-bull" : "text-bear"}`, children: [
                  fmt(pct, 2, true),
                  "%"
                ] })
              ] }, t.id);
            }) })
          ] }) })
        ] })
      ] })
    ] })
  ] });
}
export {
  TrackRecord as component
};
