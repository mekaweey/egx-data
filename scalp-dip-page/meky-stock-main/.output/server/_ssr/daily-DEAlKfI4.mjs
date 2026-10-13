import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, g as getDailyOnePercent } from "./router-BYsPPCpA.mjs";
import { g as getLiveQuotes } from "./live-quote.functions-BvAYWih7.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import { L as LivePriceCard, M as MarketBadge } from "./live-price-card-CTbpJOCb.mjs";
import { B as BuyNowButton } from "./buy-now-button-BHj5kRh1.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "./server-BpMZvK1r.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
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
import "./telegram.server-D6g8flro.mjs";
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
const fmt = (n, d = 2) => n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-EG", {
  maximumFractionDigits: d,
  minimumFractionDigits: d
});
const bare = (symbol) => symbol.replace(/\.CA$/i, "").toUpperCase();
function LiveTape({
  quotes,
  marketOpen,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 flex flex-wrap items-center justify-between gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-bold text-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MarketBadge, { open: marketOpen }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "متابعة لحظية للأسهم المرشحة" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: marketOpen ? "تحديث كل 5 ثواني" : "آخر أسعار متاحة — تحديث كل 30 ثانية" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 overflow-x-auto pb-1 text-xs", children: [
      quotes.filter((q) => q.price > 0).map((q) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-32 rounded-lg border border-border bg-card px-3 py-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: q.symbol }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "tabular-nums", children: fmt(q.price) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `tabular-nums ${q.change_pct >= 0 ? "text-bull" : "text-bear"}`, children: [
          q.change_pct >= 0 ? "+" : "",
          fmt(q.change_pct, 2),
          "%"
        ] })
      ] }, q.symbol)),
      loading && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "py-3 text-muted-foreground", children: "جاري جلب اللايف…" })
    ] })
  ] });
}
function Alt({
  p,
  live,
  marketOpen
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
    symbol: p.symbol
  }, className: "block rounded-xl border border-border bg-card p-3 hover:border-primary/50", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold", children: [
          p.name_ar,
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: p.symbol })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
          "حركة ~",
          fmt(p.expected_swing_pct, 1),
          "٪ • ثقة ",
          p.confidence,
          "٪ • وزن ",
          /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { className: "text-foreground", children: [
            p.position_size_pct,
            "٪"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          "دخول ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.entry) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-bull", children: [
          "هدف ",
          fmt(p.target),
          " (+",
          fmt(p.target_pct, 1),
          "٪)"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LivePriceCard, { symbol: bare(p.symbol), quote: live, entry: p.entry, marketOpen, size: "sm" }) })
  ] });
}
function DailyPage() {
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const {
    data,
    isLoading,
    refetch,
    isFetching
  } = useQuery({
    queryKey: ["daily-one-percent"],
    queryFn: () => getDailyOnePercent(),
    refetchInterval: 3 * 60 * 1e3
  });
  const [training, setTraining] = reactExports.useState(false);
  const [trainMsg, setTrainMsg] = reactExports.useState(null);
  const [marketOpen, setMarketOpen] = reactExports.useState(() => getMarketStatus().isOpen);
  reactExports.useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5e3);
    return () => clearInterval(id);
  }, []);
  const liveSymbols = reactExports.useMemo(() => {
    const symbols = [data?.pick, ...data?.alternatives ?? []].map((x) => x?.symbol).filter((x) => Boolean(x));
    return Array.from(new Set(symbols.map(bare)));
  }, [data?.pick, data?.alternatives]);
  const liveBatch = useQuery({
    queryKey: ["daily-live-quotes", liveSymbols.join(",")],
    queryFn: () => fetchLiveBatch({
      data: {
        symbols: liveSymbols
      }
    }),
    enabled: liveSymbols.length > 0,
    refetchInterval: marketOpen ? 5e3 : 3e4,
    refetchIntervalInBackground: true,
    staleTime: marketOpen ? 2e3 : 15e3
  });
  const liveBySymbol = reactExports.useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const q of liveBatch.data ?? []) map.set(q.symbol, q);
    return map;
  }, [liveBatch.data]);
  const liveFor = (symbol) => liveBySymbol.get(bare(symbol));
  const reranked = reactExports.useMemo(() => {
    if (!data?.pick) return {
      pick: null,
      alternatives: []
    };
    const all = [data.pick, ...data.alternatives ?? []];
    const withLive = all.filter((x) => {
      const q = liveBySymbol.get(bare(x.symbol));
      return q && q.price > 0 && Number.isFinite(q.change_pct);
    });
    if (!marketOpen || withLive.length < 2) {
      return {
        pick: data.pick,
        alternatives: data.alternatives ?? []
      };
    }
    const scoreOf = (x) => {
      const q = liveBySymbol.get(bare(x.symbol));
      const price = q && q.price > 0 ? q.price : x.entry;
      if (!(price > 0) || !(x.target > 0)) return -999;
      const remaining = (x.target - price) / price * 100;
      return remaining * ((x.confidence ?? 50) / 100);
    };
    const sorted = [...all].map((x) => ({
      x,
      s: scoreOf(x)
    })).filter((it) => it.s > 0).sort((a, b) => b.s - a.s).map((it) => it.x);
    if (sorted.length === 0) return {
      pick: data.pick,
      alternatives: data.alternatives ?? []
    };
    return {
      pick: sorted[0],
      alternatives: sorted.slice(1)
    };
  }, [data?.pick, data?.alternatives, liveBySymbol, marketOpen]);
  const p = reranked.pick;
  const reorderedByLive = !!(p && data?.pick && p.symbol !== data.pick.symbol);
  async function runInstantTrain() {
    setTraining(true);
    setTrainMsg("جاري التدريب الفوري السريع...");
    try {
      const r = await fetch("/api/public/hooks/instant-train", {
        method: "POST"
      });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} — ${txt.slice(0, 120) || "النسخة المنشورة قديمة، انشر الموقع تاني"}`);
      }
      const j = await r.json();
      if (j?.ok === false) {
        throw new Error(j.error || j.hint || "السيرفر رجّع فشل");
      }
      const trades = j?.backtest?.trades ?? j?.backtest?.total_trades ?? "?";
      const rules = j?.adversarial?.rules_added ?? 0;
      const models = j?.weights?.models ?? 0;
      setTrainMsg(`✅ تم: ${trades} صفقة • ${models} موديل أُعيد توزينه • ${rules} قاعدة فشل جديدة`);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTrainMsg(`❌ فشل التدريب — ${msg}`);
    } finally {
      setTraining(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-4 py-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-6 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "صفقة اليوم" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "هدف +1٪ • خروج فوري عند الوصول" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runInstantTrain, disabled: training, className: "rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50", children: training ? "يتعلّم..." : "⚡ تعلّم فوري" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), disabled: isFetching, className: "rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary", children: isFetching ? "..." : "تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/learning", className: "rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary", children: "🧠 التعلّم" })
      ] })
    ] }),
    trainMsg && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-4 rounded-lg border border-border bg-card px-4 py-2 text-sm", children: trainMsg }),
    isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center text-muted-foreground", children: "جاري التحميل..." }),
    data && !isLoading && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex flex-wrap items-center gap-2 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `rounded-full px-3 py-1 ${data.market_regime === "bullish" ? "bg-bull/20 text-bull" : data.market_regime === "bearish" ? "bg-bear/20 text-bear" : "bg-muted text-muted-foreground"}`, children: [
        "السوق: ",
        data.market_regime === "bullish" ? "صاعد 🟢" : data.market_regime === "bearish" ? "هابط 🔴" : data.market_regime === "neutral" ? "جانبي 🟡" : "غير محدد"
      ] }),
      !data.noTrade && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-card border border-border px-3 py-1", children: [
        "تعرّض: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          data.total_exposure_pct,
          "٪"
        ] }),
        " • كاش: ",
        /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
          data.cash_pct,
          "٪"
        ] })
      ] }),
      data.news_warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "rounded-full bg-bear/15 text-bear px-3 py-1", children: [
        "⚠️ ",
        data.news_warnings.length,
        " سهم مستبعد لأخبار سلبية"
      ] })
    ] }),
    liveSymbols.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(LiveTape, { quotes: liveBatch.data ?? [], marketOpen, loading: liveBatch.isLoading || liveBatch.isFetching }),
    data?.noTrade && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-5xl", children: "🛑" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-bold", children: "مفيش صفقة النهارده" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: data.reason }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "رأس مالك أهم من صفقة ضعيفة." })
    ] }),
    p && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/stock/$symbol", params: {
        symbol: p.symbol
      }, className: "block rounded-2xl border-2 border-bull/60 bg-gradient-to-br from-bull/10 to-card p-6 shadow-xl shadow-bull/10 transition hover:scale-[1.01]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-3xl", children: "🎯" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold", children: p.name_ar }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground", children: p.symbol })
            ] }),
            p.sector_ar && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: p.sector_ar }),
            reorderedByLive && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-[11px] text-bull", children: "⚡ تم تقديمه لأن قدامه أكبر مسافة صعود للهدف" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-end", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-full bg-bull/20 px-3 py-1 text-xs font-bold text-bull", children: "شراء" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground", children: [
              "ثقة ",
              p.confidence,
              "٪ • وزن ",
              p.position_size_pct,
              "٪"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LivePriceCard, { symbol: bare(p.symbol), quote: liveFor(p.symbol), entry: p.entry, marketOpen, size: "lg" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-3 gap-3 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-background/50 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "سعر الدخول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-bold", children: fmt(p.entry) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-bull/15 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
              "الهدف (+",
              fmt(p.target_pct, 1),
              "٪) — بِيع فوراً"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-bold text-bull", children: fmt(p.target) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg bg-bear/15 p-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground", children: [
              "وقف الخسارة (-",
              fmt(p.stop_pct, 1),
              "٪)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-lg font-bold text-bear", children: fmt(p.stop) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid grid-cols-2 gap-3 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "حركة السهم اليومية المتوقعة:" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              "~",
              fmt(p.expected_swing_pct, 1),
              "٪"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "اتفاق الموديلات:" }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              p.ensemble_agreement,
              "/5"
            ] })
          ] })
        ] }),
        p.symbol_history_n > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-[11px] text-muted-foreground", children: [
          "أداء تاريخي: ",
          fmt((p.symbol_win_rate ?? 0) * 100, 0),
          "٪ نجاح من ",
          p.symbol_history_n,
          " توصية"
        ] }),
        p.reasons_ar.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-4 space-y-1 text-xs text-muted-foreground", children: p.reasons_ar.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "• ",
          r
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BuyNowButton, { symbol: p.symbol, name: p.name_ar, entry: p.entry, target: p.target, stop: p.stop, maxHoldDays: 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "لو اشتريت السهم ده فعلاً — اضغط هنا والسيستم هيتابعه ويبعتلك إشعار وقت البيع" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "خطة التنفيذ:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 list-decimal space-y-1 ps-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "وزّع رأس مالك: ",
            /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
              p.position_size_pct,
              "٪"
            ] }),
            " في السهم الأساسي + الباقي على البدائل (إجمالي ",
            data?.total_exposure_pct,
            "٪)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "ادخل قريب من ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.entry) }),
            " عند الافتتاح."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "ضع أمر بيع تلقائي عند ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.target) }),
            " (+",
            fmt(p.target_pct, 1),
            "٪)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "ضع وقف خسارة عند ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.stop) }),
            " (-",
            fmt(p.stop_pct, 1),
            "٪)."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "🔒 ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Trailing Stop:" }),
            " لو وصل السعر ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.trail_to_be_at) }),
            " (+0.6٪)، حرّك الستوب لـ ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmt(p.entry) }),
            " (break-even). خسارة 0٪ مضمونة."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "لو وصل الإقفال ومحققش الهدف → اخرج بدون انتظار. بكره صفقة جديدة." })
        ] })
      ] }),
      reranked.alternatives.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mb-2 text-sm font-bold text-muted-foreground", children: "باقي المحفظة (موزّعة معاه):" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: reranked.alternatives.map((a) => /* @__PURE__ */ jsxRuntimeExports.jsx(Alt, { p: a, live: liveFor(a.symbol), marketOpen }, a.symbol)) })
      ] }),
      data && data.news_warnings.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 rounded-xl border border-bear/30 bg-bear/5 p-3 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-bear", children: "⚠️ أسهم استُبعدت بسبب أخبار سلبية:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 space-y-1 text-muted-foreground", children: data.news_warnings.slice(0, 5).map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
          "• ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: w.symbol }),
          " — ",
          w.reason
        ] }, w.symbol)) })
      ] })
    ] })
  ] });
}
export {
  DailyPage as component
};
