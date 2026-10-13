import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { R as Route$1B, u as useServerFn, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { a as getStockDetail } from "./dashboard.functions-CP1L58iF.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { a as getLiveQuote } from "./live-quote.functions-BvAYWih7.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import { L as LivePriceCard } from "./live-price-card-CTbpJOCb.mjs";
import "../_libs/sonner.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/seroval.mjs";
import { R as ResponsiveContainer, A as AreaChart, C as CartesianGrid, X as XAxis, Y as YAxis, T as Tooltip, c as ReferenceLine, d as Area } from "../_libs/recharts.mjs";
import { o as object, b as string } from "../_libs/zod.mjs";
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
import "./client-DcfJRNR2.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./client.server-D5ro3rAQ.mjs";
import "node:fs";
import "node:path";
import "node:child_process";
import "./outcome-loop.server-BOECsdkT.mjs";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./chat-fallback.server-HMcdWJQs.mjs";
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
import "./telegram.server-D6g8flro.mjs";
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
import "../_libs/clsx.mjs";
import "../_libs/lodash.mjs";
import "../_libs/react-smooth.mjs";
import "../_libs/prop-types.mjs";
import "../_libs/fast-equals.mjs";
import "../_libs/tiny-invariant.mjs";
import "../_libs/react-is.mjs";
import "../_libs/d3-shape.mjs";
import "../_libs/d3-path.mjs";
import "../_libs/victory-vendor.mjs";
import "../_libs/d3-scale.mjs";
import "../_libs/internmap.mjs";
import "../_libs/d3-array.mjs";
import "../_libs/d3-time-format.mjs";
import "../_libs/d3-time.mjs";
import "../_libs/d3-interpolate.mjs";
import "../_libs/d3-color.mjs";
import "../_libs/d3-format.mjs";
import "../_libs/recharts-scale.mjs";
import "../_libs/decimal.js-light.mjs";
import "../_libs/eventemitter3.mjs";
const getStockNews = createServerFn({
  method: "POST"
}).inputValidator((data) => object({
  symbol: string().min(1).max(20).regex(/^[A-Za-z0-9._-]+$/)
}).parse(data)).handler(createSsrRpc("297560c49847d61c20ab81a0ac45dfc844076edc29130e601211719a51a97462"));
const SIGNAL_LABELS = {
  strong_buy: {
    ar: "شراء قوي",
    cls: "bg-bull text-bull-foreground"
  },
  buy: {
    ar: "شراء",
    cls: "bg-bull/70 text-bull-foreground"
  },
  neutral: {
    ar: "محايد",
    cls: "bg-warn text-warn-foreground"
  },
  sell: {
    ar: "بيع",
    cls: "bg-bear/70 text-bear-foreground"
  },
  strong_sell: {
    ar: "بيع قوي",
    cls: "bg-bear text-bear-foreground"
  }
};
function fmt(n, digits = 2) {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "—";
  return v.toLocaleString("en-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits
  });
}
function Stat({
  label,
  value,
  accent,
  tooltip
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border bg-card/60 p-3", title: tooltip, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[11px] text-muted-foreground", children: [
      label,
      tooltip && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "cursor-help text-[10px] text-primary", children: "ⓘ" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-sm font-semibold tabular-nums ${accent ?? ""}`, children: value })
  ] });
}
function StockDetailPage() {
  const {
    symbol
  } = Route$1B.useParams();
  const fetchDetail = useServerFn(getStockDetail);
  const {
    data,
    isLoading,
    error
  } = useQuery({
    queryKey: ["stock-detail", symbol],
    queryFn: () => fetchDetail({
      data: {
        symbol
      }
    })
  });
  const fetchNews = useServerFn(getStockNews);
  const {
    data: news
  } = useQuery({
    queryKey: ["stock-news", symbol],
    queryFn: () => fetchNews({
      data: {
        symbol
      }
    }),
    staleTime: 5 * 60 * 1e3,
    refetchInterval: 10 * 60 * 1e3
  });
  const [marketOpen, setMarketOpen] = reactExports.useState(() => getMarketStatus().isOpen);
  reactExports.useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5e3);
    return () => clearInterval(id);
  }, []);
  const fetchLive = useServerFn(getLiveQuote);
  const {
    data: live
  } = useQuery({
    queryKey: ["stock-live", symbol],
    queryFn: () => fetchLive({
      data: {
        symbol
      }
    }),
    refetchInterval: marketOpen ? 1e4 : 6e4,
    refetchIntervalInBackground: false,
    staleTime: marketOpen ? 5e3 : 3e4
  });
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background text-muted-foreground", children: "جاري التحميل…" });
  }
  if (error || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { children: [
        "لم يتم العثور على السهم ",
        symbol
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded bg-primary px-4 py-2 text-sm text-primary-foreground", children: "العودة للوحة" })
    ] });
  }
  const {
    snapshot: snap,
    recommendation: reco,
    history,
    name_ar,
    sector_ar
  } = data;
  const sig = reco?.signal ? SIGNAL_LABELS[reco.signal] : null;
  const close = snap ? Number(snap.close) : history.at(-1)?.close ?? 0;
  const chgPct = snap?.change_pct != null ? Number(snap.change_pct) : 0;
  const chgPos = chgPct >= 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-muted-foreground hover:text-foreground", children: "← العودة للوحة" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-lg font-extrabold", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "EGX" }),
        " سكانر"
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-6xl px-6 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-extrabold", children: name_ar }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: symbol })
          ] }),
          sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: sector_ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-baseline gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl font-bold tabular-nums", children: fmt(close) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-sm tabular-nums ${chgPos ? "text-bull" : "text-bear"}`, children: [
              chgPos ? "+" : "",
              fmt(chgPct),
              "%"
            ] })
          ] })
        ] }),
        sig && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block rounded-full px-4 py-1.5 text-sm font-bold ${sig.cls}`, children: sig.ar }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-muted-foreground", children: [
            "الثقة: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-semibold text-foreground", children: [
              reco?.confidence,
              "%"
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LivePriceCard, { symbol, quote: live ? {
          symbol: live.symbol,
          price: live.price,
          change_pct: live.change_pct,
          open: 0,
          high: 0,
          low: 0,
          volume: live.volume,
          fetchedAt: live.fetchedAt,
          source: live.source,
          ageSec: live.ageSec
        } : void 0, entry: reco?.entry_min != null ? Number(reco.entry_min) : void 0, marketOpen }),
        live?.message && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-2 rounded-lg border p-3 text-xs ${live.recommendation === "sell_target" ? "border-bull/50 bg-bull/10 text-bull" : live.recommendation === "sell_stop" ? "border-bear/50 bg-bear/10 text-bear" : live.recommendation === "trail" ? "border-primary/50 bg-primary/10 text-primary" : "border-border bg-muted/30 text-muted-foreground"}`, children: live.message })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-3 text-sm font-bold", children: "الرسم البياني (آخر 90 يوماً)" }),
        history.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "py-10 text-center text-muted-foreground", children: "لا توجد بيانات للرسم" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-72 w-full", dir: "ltr", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ResponsiveContainer, { width: "100%", height: "100%", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AreaChart, { data: history, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "px", x1: "0", y1: "0", x2: "0", y2: "1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "var(--primary)", stopOpacity: 0.4 }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "var(--primary)", stopOpacity: 0 })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "var(--border)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(XAxis, { dataKey: "date", tick: {
            fontSize: 10
          }, stroke: "var(--muted-foreground)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(YAxis, { domain: ["auto", "auto"], tick: {
            fontSize: 10
          }, stroke: "var(--muted-foreground)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { contentStyle: {
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12
          } }),
          reco?.target != null && /* @__PURE__ */ jsxRuntimeExports.jsx(ReferenceLine, { y: Number(reco.target), stroke: "var(--bull)", strokeDasharray: "4 4", label: {
            value: "الهدف",
            fill: "var(--bull)",
            fontSize: 10
          } }),
          reco?.stop_loss != null && /* @__PURE__ */ jsxRuntimeExports.jsx(ReferenceLine, { y: Number(reco.stop_loss), stroke: "var(--bear)", strokeDasharray: "4 4", label: {
            value: "وقف",
            fill: "var(--bear)",
            fontSize: 10
          } }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Area, { type: "monotone", dataKey: "close", stroke: "var(--primary)", fill: "url(#px)", strokeWidth: 2 })
        ] }) }) })
      ] }),
      reco && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 text-sm font-bold", children: "التوصية الذكية" }),
        (reco.entry_timing_ar || reco.expected_gain_pct != null) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 p-3 text-sm", children: [
          reco.entry_timing_ar && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-primary", children: [
            "⏱ ",
            reco.entry_timing_ar
          ] }),
          reco.expected_gain_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bull font-semibold", children: [
            "ربح متوقع: +",
            fmt(reco.expected_gain_pct, 1),
            "%"
          ] }),
          reco.partial_exit_pct != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "بِع نصف عند ربح ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-bull", children: [
              "+",
              fmt(reco.partial_exit_pct, 1),
              "%"
            ] })
          ] }),
          reco.max_hold_days != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
            "اخرج خلال ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-bold text-foreground", children: [
              reco.max_hold_days,
              " أيام"
            ] }),
            " كحد أقصى"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "دخول من", value: fmt(reco.entry_min), tooltip: "أقل سعر مناسب للدخول في الصفقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "دخول إلى", value: fmt(reco.entry_max), tooltip: "أعلى سعر مناسب للدخول في الصفقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "الهدف", value: fmt(reco.target), accent: "text-bull", tooltip: "السعر المتوقع للبيع عنده لتحقيق ربح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "وقف الخسارة", value: fmt(reco.stop_loss), accent: "text-bear", tooltip: "إذا نزل السعر لهذا المستوى، نبيع لتقليل الخسارة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "نسبة المخاطرة/العائد", value: fmt(reco.rr_ratio), tooltip: "R:R = الربح المتوقع ÷ الخسارة المحتملة. كلما زاد، كانت الصفقة أفضل" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "حجم المركز", value: `${fmt(reco.position_size_pct)}%`, tooltip: "نسبة رأس المال المقترحة للاستثمار في هذا السهم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مدة التوصية", value: `${reco.timeframe_days ?? "—"} يوم`, tooltip: "الفترة المتوقعة لتحقيق الهدف" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "السعر عند التوصية", value: fmt(reco.price_at_reco), tooltip: "سعر الإغلاق وقت إصدار التوصية" })
        ] }),
        Array.isArray(reco.reasons_ar) && reco.reasons_ar.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-xs font-bold text-muted-foreground", children: "أسباب التوصية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-1.5", children: reco.reasons_ar.map((reason, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: reason })
          ] }, i)) })
        ] }),
        reco.risk_note_ar && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-lg border border-warn/30 bg-warn/10 p-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: "تنبيه مخاطر: " }),
          reco.risk_note_ar
        ] })
      ] }),
      snap && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-4 text-sm font-bold", children: "المؤشرات الفنية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 md:grid-cols-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "RSI (14)", value: fmt(snap.rsi14, 1), tooltip: "مؤشر القوة النسبية (0-100). فوق 70 = مبالغ في الشراء، تحت 30 = مبالغ في البيع" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "MACD", value: fmt(snap.macd, 3), tooltip: "خط MACD — يظهر اتجاه الزخم. إيجابي = صاعد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "MACD Signal", value: fmt(snap.macd_signal, 3), tooltip: "خط إشارة MACD — عبوره خط MACD يعطي إشارة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "MACD Hist", value: fmt(snap.macd_hist, 3), tooltip: "الفرق بين MACD وخط الإشارة — يدل على قوة الزخم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "EMA 9", value: fmt(snap.ema9), tooltip: "المتوسط المتحرك الأسي 9 أيام — قصير المدى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "EMA 21", value: fmt(snap.ema21), tooltip: "المتوسط المتحرك الأسي 21 يوم — متوسط المدى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "SMA 50", value: fmt(snap.sma50), tooltip: "المتوسط المتحرك البسيط 50 يوم — طويل المدى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "ATR (14)", value: fmt(snap.atr14, 3), tooltip: "متوسط النطاق الحقيقي — يقيس تذبذب السهم (ال volatility)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Bollinger أعلى", value: fmt(snap.bb_upper), tooltip: "الحد العلوي لقناة بولينجر — السعر فوقها = مبالغة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Bollinger وسط", value: fmt(snap.bb_mid), tooltip: "خط الوسط لقناة بولينجر = متوسط متحرك 20 يوم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Bollinger أدنى", value: fmt(snap.bb_lower), tooltip: "الحد السفلي لقناة بولينجر — السعر تحتها = فرصة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "حجم نسبي", value: `×${fmt(snap.vol_ratio)}`, tooltip: "حجم التداول اليوم مقابل المتوسط — فوق 1.5 = اهتمام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "دعم", value: fmt(snap.support), tooltip: "مستوى دعم تقني — السعر يميل للارتداد منه لأعلى" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مقاومة", value: fmt(snap.resistance), tooltip: "مستوى مقاومة تقني — السعر يصعب اختراقه" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "نتيجة مركبة", value: fmt(snap.composite_score, 1), tooltip: "درجة فنية مركبة (0-100) — كلما زادت، كان السهم أفضل فنياً" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مزود البيانات", value: snap.data_provider ?? "—", tooltip: "مصدر البيانات: Yahoo Finance أو Alpha Vantage أو بيانات تجريبية" })
        ] }),
        Array.isArray(snap.patterns) && snap.patterns.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "mb-2 text-xs font-bold text-muted-foreground", children: "نماذج الشموع المكتشفة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: snap.patterns.map((p, i) => {
            const label = typeof p === "string" ? p : p.name_ar ?? p.name ?? "—";
            const bullish = typeof p === "object" ? p.bullish : void 0;
            const cls = bullish === true ? "border-bull/40 bg-bull/10 text-bull" : bullish === false ? "border-bear/40 bg-bear/10 text-bear" : "border-border bg-muted/40";
            return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full border px-3 py-1 text-xs ${cls}`, children: label }, i);
          }) })
        ] })
      ] }),
      news && news.items.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-6 rounded-2xl border border-border bg-card/70 p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex flex-wrap items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-base font-bold", children: "📰 آخر الأخبار وتحليل المشاعر" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[11px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-bull/20 px-2 py-0.5 text-bull", children: [
              "إيجابي ",
              news.posCount
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-muted px-2 py-0.5", children: [
              "محايد ",
              news.neuCount
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-bear/20 px-2 py-0.5 text-bear", children: [
              "سلبي ",
              news.negCount
            ] }),
            news.avgScore != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `rounded-full px-2 py-0.5 font-bold ${news.avgScore >= 0.1 ? "bg-bull/20 text-bull" : news.avgScore <= -0.1 ? "bg-bear/20 text-bear" : "bg-muted"}`, children: [
              "متوسط: ",
              news.avgScore.toFixed(2)
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: news.items.map((n) => {
          const cls = n.sentiment === "positive" ? "border-bull/40" : n.sentiment === "negative" ? "border-bear/40" : "border-border";
          const dot = n.sentiment === "positive" ? "bg-bull" : n.sentiment === "negative" ? "bg-bear" : "bg-muted-foreground";
          return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { className: `rounded-lg border ${cls} bg-background/50 p-3`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}` }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
              n.source_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: n.source_url, target: "_blank", rel: "noreferrer", className: "text-sm font-medium hover:underline", children: n.headline }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium", children: n.headline }),
              n.summary_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground line-clamp-2", children: n.summary_ar }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground", children: [
                n.source_name && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: n.source_name }),
                n.published_at && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                  "• ",
                  new Date(n.published_at).toLocaleString("ar-EG")
                ] }),
                n.impact_level === "high" && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-warn/20 px-1.5 py-0.5 text-warn-foreground", children: "تأثير عالي" })
              ] })
            ] })
          ] }) }, n.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("footer", { className: "mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground", children: "⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. تداول الأسهم ينطوي على مخاطر فقدان رأس المال." })
    ] })
  ] });
}
export {
  StockDetailPage as component
};
