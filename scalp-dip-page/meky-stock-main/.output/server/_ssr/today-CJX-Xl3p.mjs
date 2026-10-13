import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useServerFn, H as getTodayPick } from "./router-BYsPPCpA.mjs";
import { a as getLiveQuote, g as getLiveQuotes } from "./live-quote.functions-BvAYWih7.mjs";
import { g as getMarketStatus } from "./market-hours-CyHCW23Z.mjs";
import { B as BuyNowButton } from "./buy-now-button-BHj5kRh1.mjs";
import { s as supabase } from "./client-DcfJRNR2.mjs";
import { T as ThunderConnectionBanner } from "./thunder-connection-banner-hyVTeR9F.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
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
function fmt(n, d = 2) {
  return n.toLocaleString("en-EG", {
    maximumFractionDigits: d,
    minimumFractionDigits: d
  });
}
function fmtEGP(n) {
  return Math.round(n).toLocaleString("en-EG") + " ج.م";
}
function ConfidenceBar({
  value
}) {
  const color = value >= 85 ? "bg-bull" : value >= 75 ? "bg-primary" : "bg-warn";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full h-3 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full ${color} transition-all`, style: {
    width: `${value}%`
  } }) });
}
function PickHistoryRow({
  p,
  livePrice
}) {
  const badge = p.status === "win" ? "bg-bull/20 text-bull" : p.status === "loss" ? "bg-bear/20 text-bear" : p.status === "expired" ? "bg-muted text-muted-foreground" : "bg-primary/20 text-primary";
  const livePct = p.status === "open" && livePrice && livePrice > 0 && p.entry > 0 ? (livePrice - p.entry) / p.entry * 100 : null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-2 text-xs text-muted-foreground", children: p.date }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-2 font-semibold", children: p.name_ar ?? p.symbol }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "py-2 px-2 text-xs tabular-nums", children: [
      fmt(p.confidence, 0),
      "%"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-2", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-[11px] font-bold ${badge}`, children: p.status === "win" ? "ربح" : p.status === "loss" ? "خسارة" : p.status === "expired" ? "منتهي" : "مفتوح" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-2 px-2 text-xs tabular-nums font-bold", children: livePct != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `inline-flex items-center gap-1 ${livePct > 0 ? "text-bull" : livePct < 0 ? "text-bear" : ""}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-1.5 w-1.5 rounded-full bg-bull", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/60" }) }),
      livePct > 0 ? "+" : "",
      fmt(livePct, 2),
      "%"
    ] }) : p.pnlPct != null ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: (p.pnlPct ?? 0) > 0 ? "text-bull" : (p.pnlPct ?? 0) < 0 ? "text-bear" : "", children: [
      p.pnlPct > 0 ? "+" : "",
      fmt(p.pnlPct, 2),
      "%"
    ] }) : "—" })
  ] });
}
function TodayPage() {
  const queryClient = useQueryClient();
  const fetchToday = useServerFn(getTodayPick);
  const fetchLive = useServerFn(getLiveQuote);
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const [capital, setCapital] = reactExports.useState(15e4);
  const [marketOpen, setMarketOpen] = reactExports.useState(() => getMarketStatus().isOpen);
  reactExports.useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5e3);
    return () => clearInterval(id);
  }, []);
  reactExports.useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("plan.capital") : null;
    if (s) setCapital(Number(s) || 15e4);
  }, []);
  reactExports.useEffect(() => {
    const channel = supabase.channel("today-pick-live").on("postgres_changes", {
      event: "*",
      schema: "public",
      table: "daily_picks"
    }, () => {
      queryClient.invalidateQueries({
        queryKey: ["today"]
      });
      queryClient.invalidateQueries({
        queryKey: ["live-quote"]
      });
      queryClient.invalidateQueries({
        queryKey: ["live-quotes"]
      });
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  reactExports.useEffect(() => {
    if (!marketOpen) return;
    let cancelled = false;
    const runLiveMonitor = async () => {
      try {
        await fetch("/api/public/hooks/live-tick-poll", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: "{}"
        });
        await fetch("/api/public/hooks/live-pick-monitor", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: "{}"
        });
        if (!cancelled) {
          queryClient.invalidateQueries({
            queryKey: ["today"]
          });
          queryClient.invalidateQueries({
            queryKey: ["live-quote"]
          });
          queryClient.invalidateQueries({
            queryKey: ["live-quotes"]
          });
        }
      } catch {
      }
    };
    runLiveMonitor();
    const id = window.setInterval(runLiveMonitor, 6e4);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [marketOpen, queryClient]);
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["today"],
    queryFn: () => fetchToday(),
    refetchInterval: marketOpen ? 6e4 : 5 * 6e4
  });
  const pick = data?.pick;
  const live = useQuery({
    queryKey: ["live-quote", pick?.symbol],
    queryFn: () => fetchLive({
      data: {
        symbol: pick.symbol
      }
    }),
    enabled: !!pick?.symbol,
    refetchInterval: marketOpen ? 1e4 : false,
    refetchIntervalInBackground: false,
    staleTime: 5e3
  });
  const historySymbols = Array.from(new Set((data?.recentPicks ?? []).map((p) => p.symbol)));
  const liveBatch = useQuery({
    queryKey: ["live-quotes", historySymbols.join(",")],
    queryFn: () => fetchLiveBatch({
      data: {
        symbols: historySymbols
      }
    }),
    enabled: historySymbols.length > 0,
    refetchInterval: marketOpen ? 1e4 : false,
    refetchIntervalInBackground: false,
    staleTime: 5e3
  });
  const livePriceBySymbol = new Map((liveBatch.data ?? []).map((q) => [q.symbol, q.price]));
  const canExecute = marketOpen;
  const investAmount = pick ? capital * pick.kellyPct : 0;
  const shares = pick ? Math.floor(investAmount / pick.entry) : 0;
  const realCost = pick ? shares * pick.entry : 0;
  const winEGP = pick ? shares * (pick.target - pick.entry) : 0;
  const lossEGP = pick ? shares * (pick.entry - pick.stop) : 0;
  const livePnlEGP = pick && live.data?.pnlPct != null ? shares * (live.data.price - pick.entry) : 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "min-h-screen bg-background text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "border-b border-border bg-card/50 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-extrabold", children: [
          "🎯 صفقة ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "النهارده" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "سهم واحد · ثقة عالية · حماية تلقائية" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => refetch(), className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "🔄 تحديث" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/plan", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "الخطة" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted", children: "← الرئيسية" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-5xl px-6 py-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ThunderConnectionBanner, {}),
      data && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "دقة آخر 30 صفقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-2xl font-bold tabular-nums", children: [
            fmt(data.recentStats.accuracy, 0),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "متوسط ربح/صفقة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-1 text-2xl font-bold tabular-nums ${data.recentStats.avgPnl > 0 ? "text-bull" : data.recentStats.avgPnl < 0 ? "text-bear" : ""}`, children: [
            data.recentStats.avgPnl > 0 ? "+" : "",
            fmt(data.recentStats.avgPnl, 2),
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "عدد الصفقات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-2xl font-bold tabular-nums", children: data.recentStats.trades })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border p-4 ${data.circuitOpen ? "border-bear/40 bg-bear/10" : "border-bull/40 bg-bull/10"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "حالة النظام" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-lg font-bold ${data.circuitOpen ? "text-bear" : "text-bull"}`, children: data.circuitOpen ? "🛡️ متوقف للحماية" : "✅ شغّال" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-sm font-semibold text-muted-foreground", children: "رأس مالك (جنيه)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 flex items-center gap-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: capital, onChange: (e) => {
          const v = Math.max(1e3, Number(e.target.value) || 0);
          setCapital(v);
          if (typeof window !== "undefined") localStorage.setItem("plan.capital", String(v));
        }, className: "w-48 rounded-lg border border-border bg-background px-3 py-2 text-lg font-bold tabular-nums" }) })
      ] }),
      isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-8 text-center", children: "⏳ بنحلل السوق…" }),
      !isLoading && !pick && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-warn/40 bg-warn/10 p-6 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: data?.message ?? "مفيش فرصة النهارده" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "النظام مش هيدخلك في صفقة لو الثقة أقل من 70%. ده اللي بيحميك على المدى الطويل." })
      ] }),
      pick && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: `rounded-2xl border-2 p-6 ${data?.circuitOpen ? "border-bear/40 bg-bear/5" : "border-primary/50 bg-primary/5"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "السهم المختار اليوم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-3xl font-extrabold mt-1", children: pick.name_ar ?? pick.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: pick.symbol }),
            pick.isNewsElite && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "🔥" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Elite News Catalyst" }),
              pick.newsEliteScore != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "opacity-70", children: [
                "· ",
                Math.round(pick.newsEliteScore),
                "/100"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "درجة الثقة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-extrabold text-primary tabular-nums", children: [
              fmt(pick.confidence, 0),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 w-32", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceBar, { value: pick.confidence }) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-card p-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "سعر الدخول" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold tabular-nums", children: fmt(pick.entry) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-bull/10 border border-bull/30 p-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "الهدف (+",
              fmt(pick.targetPct, 1),
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold text-bull tabular-nums", children: fmt(pick.target) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl bg-bear/10 border border-bear/30 p-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
              "وقف الخسارة (-",
              fmt(pick.stopPct, 1),
              "%)"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xl font-bold text-bear tabular-nums", children: fmt(pick.stop) })
          ] })
        ] }),
        live.data && live.data.price > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-4 rounded-xl border-2 p-4 ${live.data.recommendation === "sell_target" ? "border-bull bg-bull/10" : live.data.recommendation === "sell_stop" ? "border-bear bg-bear/10" : live.data.recommendation === "trail" ? "border-primary bg-primary/10" : "border-border bg-card"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              marketOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "relative inline-flex h-2 w-2 rounded-full bg-bull", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/60" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: marketOpen ? "السعر اللحظي" : "آخر سعر" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground tabular-nums", children: new Date(live.data.fetchedAt).toLocaleTimeString("ar-EG") })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 grid grid-cols-3 gap-3 text-center", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "السعر الآن" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl font-extrabold tabular-nums", children: fmt(live.data.price) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "من سعر الدخول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-2xl font-extrabold tabular-nums ${(live.data.pnlPct ?? 0) > 0 ? "text-bull" : (live.data.pnlPct ?? 0) < 0 ? "text-bear" : ""}`, children: live.data.pnlPct != null ? `${live.data.pnlPct > 0 ? "+" : ""}${fmt(live.data.pnlPct, 2)}%` : "—" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: "ربح/خسارة فعلية" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-2xl font-extrabold tabular-nums ${livePnlEGP > 0 ? "text-bull" : livePnlEGP < 0 ? "text-bear" : ""}`, children: [
                livePnlEGP > 0 ? "+" : "",
                fmtEGP(livePnlEGP)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-center text-sm font-bold", children: live.data.message }),
          live.data.liveConfidence != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[11px] text-muted-foreground mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "الثقة المتكيّفة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "tabular-nums", children: [
                fmt(live.data.liveConfidence, 0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceBar, { value: live.data.liveConfidence })
          ] })
        ] }),
        live.data && live.data.price > 0 && (() => {
          const price = live.data.price;
          const pct = (price - pick.entry) / pick.entry * 100;
          const hitStop = price <= pick.stop;
          const hitTarget = price >= pick.target;
          const tooHigh = pct > 1.5;
          const ok = marketOpen && !hitStop && !hitTarget && !tooHigh;
          const liveShares = Math.floor(investAmount / price);
          const liveCost = liveShares * price;
          const tone = ok ? "border-bull bg-bull/10 text-bull" : hitTarget ? "border-primary bg-primary/10 text-primary" : "border-warn bg-warn/10 text-warn";
          const title = !marketOpen ? "⏰ السوق مقفول — استنى الفتحة الجاية" : hitStop ? "❌ ضرب الستوب — متشتريش النهارده" : hitTarget ? "🎯 وصل الهدف — فات وقت الشراء" : tooHigh ? `⚠️ السعر طلع +${fmt(pct, 2)}% فوق الدخول — استنى رجوع للسعر ${fmt(pick.entry)} أو سيبها` : `✅ لسه ينفع تشتري دلوقتي بسعر ${fmt(price)} (${pct >= 0 ? "+" : ""}${fmt(pct, 2)}% من الدخول)`;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `mt-4 rounded-xl border-2 p-4 ${tone}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-extrabold", children: title }),
            ok && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 text-xs text-foreground/80", children: [
              "الكمية المعدّلة بالسعر الحالي: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums", children: liveShares.toLocaleString("en-EG") }),
              " سهم · التكلفة: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums", children: fmtEGP(liveCost) }),
              "· الستوب ثابت عند ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("b", { className: "tabular-nums", children: fmt(pick.stop) })
            ] })
          ] });
        })(),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold mb-2", children: "💼 الكمية الموصى بها (Kelly Sizing)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "نسبة من رأس المال" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold tabular-nums", children: [
                fmt(pick.kellyPct * 100, 0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "عدد الأسهم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: shares.toLocaleString("en-EG") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "المبلغ المستثمر" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold tabular-nums", children: fmtEGP(realCost) })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "مدة الاحتفاظ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold tabular-nums", children: [
                "حتى ",
                pick.maxHoldDays,
                " أيام"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex flex-wrap gap-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bull", children: [
              "🟢 لو وصل الهدف: ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
                "+",
                fmtEGP(winEGP)
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-bear", children: [
              "🔴 لو ضرب الستوب: ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("b", { children: [
                "-",
                fmtEGP(lossEGP)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(BuyNowButton, { symbol: pick.symbol, name: pick.name_ar, entry: pick.entry, target: pick.target, stop: pick.stop, maxHoldDays: pick.maxHoldDays, defaultShares: shares, disabled: !canExecute, disabledReason: "السوق مغلق — التنفيذ متاح أثناء جلسة التداول فقط" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "لما تشتري السهم اضغط هنا — السيستم هيتابعه ويبعتلك إشعار وقت البيع" })
          ] })
        ] }),
        pick.reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold mb-2", children: "📊 ليه اختار السهم ده؟" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "grid grid-cols-1 md:grid-cols-2 gap-1 text-sm", children: pick.reasons.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bull", children: "✓" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: r })
          ] }, i)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground", children: "⚙️ النظام بيشتغل أوتوماتيك: بيختار سهم واحد كل يوم، بيتابع النتيجة، وبيتوقف لوحده لو خسر 3 صفقات متتالية. الـ Kelly Sizing بيكبّر الكمية لما الثقة عالية، وبيصغّرها لما تقل." })
      ] }),
      data && data.recentPicks.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "📜 آخر 10 صفقات (سجل الشفافية)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 px-2 text-right", children: "التاريخ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 px-2 text-right", children: "السهم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 px-2 text-right", children: "الثقة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 px-2 text-right", children: "الحالة" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-2 px-2 text-right", children: "النتيجة" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: data.recentPicks.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx(PickHistoryRow, { p, livePrice: livePriceBySymbol.get(p.symbol.replace(/\.CA$/i, "").toUpperCase()) }, p.date + p.symbol)) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  TodayPage as component
};
