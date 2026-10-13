import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { M as MarketPulseCard } from "./market-pulse-card-dRUyDz9X.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
import "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
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
const getPaperResults = createServerFn({
  method: "GET"
}).handler(createSsrRpc("8971ff55142b392859020bdc863216a6d2a7242c5d0d6f8ba52b765ad966548e"));
function PaperPage() {
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["paper-results"],
    queryFn: () => getPaperResults(),
    refetchInterval: 3e4
  });
  if (isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6", children: "جارٍ التحميل…" });
  const trades = data?.trades || [];
  const todayStr = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", {
    timeZone: "Africa/Cairo"
  })).toISOString().slice(0, 10);
  const todayTrades = trades.filter((t) => t.trade_date === todayStr);
  const todayOpen = todayTrades.filter((t) => t.status === "open");
  const todayClosed = todayTrades.filter((t) => t.status === "closed");
  const todayRealizedPnl = todayClosed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const todayWins = todayClosed.filter((t) => Number(t.pnl) > 0).length;
  const todayWinRate = todayClosed.length ? todayWins / todayClosed.length * 100 : 0;
  const nowMs = Date.now();
  const FRESH_MS = 5 * 60 * 1e3;
  const byDate = /* @__PURE__ */ new Map();
  for (const t of trades) {
    if (!byDate.has(t.trade_date)) byDate.set(t.trade_date, []);
    byDate.get(t.trade_date).push(t);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-6 max-w-6xl mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold", children: "Paper Trading" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground mt-1", children: [
        "محاكاة بدون فلوس حقيقية. استراتيجية واحدة فعّالة:",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "• ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "scalp-mr15" }),
        ": شراء عند نزول مفاجئ 1.5% خلال 3 دقايق (mean-reversion). TP +1.2% / SL −0.5% / Time-stop 20 دقيقة. رأس مال 10,000."
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border-2 border-primary bg-primary/5 p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "text-2xl font-bold mb-2", children: [
        "📡 صفقات النهارده الحية (",
        todayStr,
        ")"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(MarketPulseCard, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground mb-4", children: [
        "الصفحة بتحدّث نفسها كل 30 ثانية. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "كل إشارة بتترصد وتتسجل تلقائياً" }),
        " في قاعدة البيانات (دخول + TP/SL + خروج + PnL)، فآخر اليوم تقدر تتأكد لو كنت مشيت ورا الاستراتيجية كنت هتكسب فعلاً ولا لأ.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: " انسخها على ورقة بنفس السعر، متشتريش بفلوس حقيقية في أول أسبوع." })
      ] }),
      todayTrades.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "إشارات اليوم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold", children: todayTrades.length })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "مفتوحة / مقفولة" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
            todayOpen.length,
            " / ",
            todayClosed.length
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "PnL محقق (لو تابعت كله)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xl font-bold ${todayRealizedPnl >= 0 ? "text-bull" : "text-bear"}`, children: [
            todayRealizedPnl >= 0 ? "+" : "",
            todayRealizedPnl.toFixed(0),
            " EGP"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "نسبة النجاح" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold", children: [
            todayWinRate.toFixed(0),
            "%"
          ] })
        ] })
      ] }),
      todayTrades.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground", children: "مفيش إشارات لسه النهارده. الـ scan بيشتغل من 10:30 صباحاً." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground mb-3 leading-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "إزاي تقرأ الكروت؟" }),
          " كل كارت = إشارة شراء وقت معيّن. لو مكتوب ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn font-semibold", children: "🔥 إشارة طازة" }),
          " (آخر 5 دقايق) → السعر لسه قريب من سعر الدخول وممكن تدخل بنفس السعر تقريباً. لو مكتوب ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "⏳ مفتوحة" }),
          " من زمان → النافذة فاتت، اعتبرها صفقة محاكاة بس ومتدخلش فيها بفلوس حقيقية."
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          todayTrades.map((t) => {
            const ageMs = nowMs - new Date(t.entry_ts).getTime();
            const isFresh = t.status === "open" && ageMs <= FRESH_MS;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded border p-3 flex items-center gap-4 ${isFresh ? "bg-warn/15 border-warn" : t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-24", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg", children: t.symbol }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: t.strategy })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  "دخول: ",
                  /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: Number(t.entry_price).toFixed(2) })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                  "TP ",
                  Number(t.tp_price).toFixed(2),
                  " / SL ",
                  Number(t.sl_price).toFixed(2)
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
                "الإشارة: ",
                new Date(t.entry_ts).toLocaleTimeString("ar-EG", {
                  timeZone: "Africa/Cairo",
                  hour: "2-digit",
                  minute: "2-digit"
                }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: isFresh ? "text-warn" : "", children: [
                  Math.floor(ageMs / 6e4),
                  " دقيقة فاتت"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mr-auto text-left", children: isFresh ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn font-bold", children: "🔥 إشارة طازة — ادخل دلوقتي" }) : t.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-semibold", children: "⏳ النافذة فاتت" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold", children: [
                t.exit_reason,
                " • ",
                Number(t.pnl) >= 0 ? "+" : "",
                Number(t.pnl).toFixed(0),
                " EGP"
              ] }) })
            ] }, t.id);
          }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground pt-2", children: [
            "مفتوحة: ",
            todayOpen.length,
            " • مقفولة: ",
            todayTrades.length - todayOpen.length
          ] })
        ] })
      ] })
    ] }),
    byDate.size === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-card p-8 text-center text-muted-foreground", children: "مفيش صفقات لسه. الـ cron هيشتغل تلقائياً في ساعات السوق (10:00–14:30 توقيت القاهرة، الأحد–الخميس)." }),
    Array.from(byDate.entries()).map(([date, list]) => {
      const closed = list.filter((t) => t.status === "closed");
      const totalPnl = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
      const wins = closed.filter((t) => Number(t.pnl) > 0).length;
      const winRate = closed.length ? wins / closed.length * 100 : 0;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-lg border bg-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between mb-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-semibold", children: date }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: totalPnl >= 0 ? "text-bull" : "text-bear", children: [
              "PnL: ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                totalPnl >= 0 ? "+" : "",
                totalPnl.toFixed(0),
                " EGP"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "Win rate: ",
              /* @__PURE__ */ jsxRuntimeExports.jsxs("strong", { children: [
                winRate.toFixed(0),
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "صفقات: ",
              list.length,
              " (",
              closed.length,
              " مقفولة)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "text-left text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "py-1", children: "السهم" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Entry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "TP/SL" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "Exit" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { children: "السبب" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "text-right", children: "PnL" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: list.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "py-1.5 font-medium", children: t.symbol }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: Number(t.entry_price).toFixed(2) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "text-xs text-muted-foreground", children: [
              Number(t.tp_price).toFixed(2),
              " / ",
              Number(t.sl_price).toFixed(2)
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: t.exit_price ? Number(t.exit_price).toFixed(2) : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { children: t.exit_reason ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: t.exit_reason === "TP" ? "text-bull" : t.exit_reason === "SL" ? "text-bear" : "text-muted-foreground", children: t.exit_reason }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary", children: "open" }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `text-right ${Number(t.pnl) >= 0 ? "text-bull" : "text-bear"}`, children: t.pnl != null ? `${Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(0)}` : "—" })
          ] }, t.id)) })
        ] })
      ] }, date);
    })
  ] });
}
export {
  PaperPage as component
};
