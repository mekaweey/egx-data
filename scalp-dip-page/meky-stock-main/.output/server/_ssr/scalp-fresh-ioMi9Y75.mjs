import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, q as ensureAudioUnlock, n as alertBeep, t as fmtPrice, v as beep, c as createSsrRpc } from "./router-BYsPPCpA.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-DcfJRNR2.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { T as ThunderConnectionBanner } from "./thunder-connection-banner-hyVTeR9F.mjs";
import "../_libs/mendable__firecrawl-js.mjs";
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
import "crypto";
import "./self-calibration.server-DafiNwz-.mjs";
import "./engine.server-K_Mwkd4b.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
import "./blocklist-BkSBV-pn.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
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
const STRATEGY = "scalp-mr15-fresh";
const getScalpFreshToday = createServerFn({
  method: "GET"
}).handler(createSsrRpc("7244383c55a32f355e55d23b1c56f8985081469d73ba66aabbc0adcdccaf02f2"));
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function ScalpFreshPage() {
  const fetchTrades = useServerFn(getScalpFreshToday);
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["scalp-fresh-today"],
    queryFn: () => fetchTrades(),
    refetchInterval: 15e3
  });
  const [pulse, setPulse] = reactExports.useState(0);
  const seenIdsRef = reactExports.useRef(/* @__PURE__ */ new Set());
  const initializedRef = reactExports.useRef(false);
  reactExports.useEffect(() => {
    ensureAudioUnlock();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
      });
    }
  }, []);
  reactExports.useEffect(() => {
    if (!data?.trades || initializedRef.current) return;
    for (const t of data.trades) seenIdsRef.current.add(t.id);
    initializedRef.current = true;
  }, [data]);
  reactExports.useEffect(() => {
    const channel = supabase.channel("scalp-fresh-live").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "paper_trades",
      filter: `strategy=eq.${STRATEGY}`
    }, (payload) => {
      const t = payload.new;
      if (seenIdsRef.current.has(t.id)) return;
      seenIdsRef.current.add(t.id);
      alertBeep();
      setPulse((p) => p + 1);
      const entry = fmtPrice(t.entry_price);
      const tp = fmtPrice(t.tp_price);
      const sl = fmtPrice(t.sl_price);
      const body = `دخول ${entry} • TP ${tp} • SL ${sl}`;
      toast.success(`🔥 [FRESH] إشارة Scalp: ${t.symbol}`, {
        description: body,
        duration: 3e4
      });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(`🔥 [FRESH] ${t.symbol}`, {
            body,
            tag: t.id,
            requireInteraction: true
          });
        } catch {
        }
      }
      refetch();
    }).on("postgres_changes", {
      event: "UPDATE",
      schema: "public",
      table: "paper_trades",
      filter: `strategy=eq.${STRATEGY}`
    }, (payload) => {
      const t = payload.new;
      const old = payload.old;
      if (t.status !== "closed" || old.status === "closed") return;
      beep(t.pnl && t.pnl > 0 ? 1320 : 520);
      const pnl = Number(t.pnl ?? 0);
      toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج [FRESH]: ${t.symbol}`, {
        description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
        duration: 2e4
      });
      refetch();
    }).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);
  const trades = data?.trades ?? [];
  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const realized = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const wins = closed.filter((t) => Number(t.pnl) > 0).length;
  const winRate = closed.length ? wins / closed.length * 100 : 0;
  const nowMs = Date.now();
  const FRESH_MS = 90 * 1e3;
  const MAX_DRIFT_PCT = 3e-3;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 md:p-6 max-w-5xl mx-auto space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ThunderConnectionBanner, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2", children: "← الرجوع للرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
          "🧪 Scalp Fresh (تجريبي)",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block h-2.5 w-2.5 rounded-full bg-warn ${pulse % 2 ? "animate-ping" : ""}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "نسخة موازية تستخدم سعر لحظي للدخول. الأصلية شغّالة كما هي على /scalp." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        ensureAudioUnlock();
        beep(880);
        toast("الصوت مفعّل ✅");
      }, className: "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground", children: "فعّل الصوت" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إشارات اليوم", value: String(trades.length) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مفتوحة / مقفولة", value: `${open.length} / ${closed.length}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "PnL محقق", value: `${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`, tone: realized >= 0 ? "bull" : "bear" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "نسبة النجاح", value: `${winRate.toFixed(0)}%` })
    ] }),
    trades.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-card p-10 text-center text-muted-foreground", children: "لسه مفيش إشارات. هتظهر هنا أول ما الـ cron يتفعّل على الـ hook الجديد." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: trades.map((t) => {
      const ageMs = nowMs - new Date(t.entry_ts).getTime();
      const cur = t.current_price ?? null;
      const drift = cur != null && t.entry_price > 0 ? (cur - t.entry_price) / t.entry_price : 0;
      const priceMovedUp = cur != null && drift > MAX_DRIFT_PCT;
      const isFresh = t.status === "open" && ageMs <= FRESH_MS && !priceMovedUp;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-4 flex flex-wrap items-center gap-4 ${isFresh ? "bg-warn/15 border-warn shadow-md" : t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-2xl", children: t.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: fmtTime(t.entry_ts) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "دخول: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: fmtPrice(t.entry_price) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            "TP ",
            fmtPrice(t.tp_price),
            " / SL ",
            fmtPrice(t.sl_price)
          ] }),
          cur != null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs mt-1", children: [
            "السعر الآن: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: drift > 0 ? "text-bear" : "text-bull", children: fmtPrice(cur) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
              " (",
              drift >= 0 ? "+" : "",
              (drift * 100).toFixed(2),
              "%)"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mr-auto text-left", children: isFresh ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn font-bold text-lg", children: "🔥 ادخل دلوقتي" }) : t.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-semibold", children: priceMovedUp ? `⏳ النافذة فاتت — السعر فوق الدخول بـ ${(drift * 100).toFixed(2)}%` : "⏳ النافذة فاتت" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold", children: [
          t.exit_reason,
          " • ",
          Number(t.pnl) >= 0 ? "+" : "",
          Number(t.pnl).toFixed(0),
          " EGP"
        ] }) })
      ] }, t.id);
    }) })
  ] });
}
function Stat({
  label,
  value,
  tone
}) {
  const color = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xl font-bold ${color}`, children: value })
  ] });
}
export {
  ScalpFreshPage as component
};
