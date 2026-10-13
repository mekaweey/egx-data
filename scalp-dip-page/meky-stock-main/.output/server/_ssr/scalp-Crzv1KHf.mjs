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
const COLOR = {
  green: { bar: "border-bull/50 bg-bull/10", dot: "bg-bull", text: "text-bull", chip: "bg-bull/20 text-bull" },
  yellow: { bar: "border-warn/50 bg-warn/10", dot: "bg-warn", text: "text-warn", chip: "bg-warn/20 text-warn" },
  red: { bar: "border-bear/60 bg-bear/15", dot: "bg-bear", text: "text-bear", chip: "bg-bear/20 text-bear" },
  idle: { bar: "border-muted bg-muted/30", dot: "bg-muted-foreground", text: "text-muted-foreground", chip: "bg-muted text-muted-foreground" }
};
const LABEL = {
  green: "كل شيء يعمل ✓",
  yellow: "بطء في مصدر واحد",
  red: "⚠️ تنبيه فوري — مصدر متوقف",
  idle: "السوق مغلق"
};
function fmtAgo(sec) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}د`;
  return `${Math.floor(sec / 3600)}س`;
}
function CollectionWatchdogPanel() {
  const [data, setData] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  const [expanded, setExpanded] = reactExports.useState(false);
  const lastAlertRef = reactExports.useRef({ level: "green", ts: 0 });
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/public/hooks/collection-watchdog", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (cancelled) return;
        setData(d);
        setErr(null);
        const nowMs = Date.now();
        if (d.overall === "red") {
          const wasRed = lastAlertRef.current.level === "red";
          const enoughGap = nowMs - lastAlertRef.current.ts > 12e4;
          if (!wasRed || enoughGap) {
            const failing = d.checks.filter((c2) => c2.status === "red").map((c2) => c2.label).join("، ");
            alertBeep();
            toast.error("⚠️ تنبيه: مصدر بيانات متوقف", {
              description: failing,
              duration: 3e4
            });
            lastAlertRef.current = { level: "red", ts: nowMs };
          }
        } else if (d.overall === "yellow" && lastAlertRef.current.level !== "yellow" && lastAlertRef.current.level !== "red") {
          lastAlertRef.current = { level: "yellow", ts: nowMs };
        } else if (d.overall === "green") {
          if (lastAlertRef.current.level === "red" || lastAlertRef.current.level === "yellow") {
            toast.success("✅ رجع كل شيء طبيعي");
          }
          lastAlertRef.current = { level: "green", ts: nowMs };
        }
      } catch (e) {
        if (!cancelled) setErr(e.message);
      }
    };
    tick();
    const id = setInterval(tick, 1e4);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
  if (err && !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky top-2 z-30 rounded-xl border border-bear/50 bg-bear/10 text-bear px-3 py-2 text-xs", children: [
      "تعذر قراءة الحالة (",
      err,
      ")"
    ] });
  }
  if (!data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "sticky top-2 z-30 rounded-xl border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground", children: "جارٍ فحص حالة التجميع…" });
  }
  const c = COLOR[data.overall];
  const pulse = data.overall === "red" ? "animate-pulse" : data.overall === "green" ? "animate-pulse" : "";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `sticky top-2 z-30 rounded-xl border ${c.bar} px-3 py-2 shadow-sm`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setExpanded((v) => !v),
        className: "w-full flex items-center gap-2 text-right",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block w-2.5 h-2.5 rounded-full ${c.dot} ${pulse}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-bold text-sm ${c.text}`, children: LABEL[data.overall] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground mr-auto", children: [
            data.marketOpen ? "🟢 السوق مفتوح" : "⚪ السوق مغلق",
            " · تحديث كل 10ث"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "a",
            {
              href: "/health-check",
              onClick: (e) => e.stopPropagation(),
              className: "text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30",
              children: "فحص شامل"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: expanded ? "▲" : "▼" })
        ]
      }
    ),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2", children: data.checks.map((check) => {
      const cc = COLOR[check.status];
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border ${cc.bar} p-2 text-xs`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 font-semibold mb-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block w-2 h-2 rounded-full ${cc.dot}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: check.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mr-auto text-[10px] px-1.5 py-0.5 rounded ${cc.chip}`, children: check.status === "green" ? "OK" : check.status === "yellow" ? "بطء" : check.status === "red" ? "متوقف" : "خامد" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: check.message }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground mt-1", children: [
          "آخر: ",
          fmtAgo(check.lastAgoSec),
          " · متوقع: ",
          check.expected
        ] })
      ] }, check.key);
    }) })
  ] });
}
const getScalpToday = createServerFn({
  method: "GET"
}).handler(createSsrRpc("ec6a01cc7e9ce0826ad36add2a77f3017260ebf5c10affed67538e43666fceee"));
const getScalpMr15Enabled = createServerFn({
  method: "GET"
}).handler(createSsrRpc("9a9d8f0d8bc815a6a7580acc02c3886f7be973c40feb0a16659f9a0e69f4b289"));
const setScalpMr15Enabled = createServerFn({
  method: "POST"
}).inputValidator((d) => d).handler(createSsrRpc("9c055ae5f3053e2d69092a94ef55a9ef04d8064ffcb68be04ecb8a3f4d530f0b"));
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function ExtensionToggle() {
  const getEnabled = useServerFn(getScalpMr15Enabled);
  const setEnabled = useServerFn(setScalpMr15Enabled);
  const {
    data,
    refetch,
    isLoading
  } = useQuery({
    queryKey: ["scalp-mr15-enabled"],
    queryFn: () => getEnabled(),
    refetchInterval: 3e4
  });
  const [busy, setBusy] = reactExports.useState(false);
  const enabled = data?.enabled ?? true;
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !enabled;
      await setEnabled({
        data: {
          enabled: next
        }
      });
      await refetch();
      toast(next ? "تم تفعيل فتح تابات ثاندر ✅" : "تم إيقاف فتح تابات ثاندر ⛔");
    } catch (e) {
      toast.error(`فشل التغيير: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-4 flex items-center justify-between gap-3 ${enabled ? "bg-bull/10 border-bull/40" : "bg-muted/40 border-muted"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold", children: isLoading ? "…" : enabled ? "🟢 فتح تابات ثاندر: مُفعّل" : "⛔ فتح تابات ثاندر: مُعطّل" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "الصفحة بتفضل شغّالة في الحالتين. لما يبقى مُعطّل، الإشارات بتظهر هنا لكن الاكستنشن مش هيفتح تابات ثاندر." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: toggle, disabled: busy || isLoading, className: `rounded-md px-4 py-2 text-sm font-bold ${enabled ? "bg-bear text-white" : "bg-bull text-white"} disabled:opacity-50`, children: busy ? "..." : enabled ? "إيقاف" : "تفعيل" })
  ] });
}
function ScalpPage() {
  const fetchTrades = useServerFn(getScalpToday);
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["scalp-today"],
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
    const channel = supabase.channel("scalp-live").on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "paper_trades",
      filter: "strategy=eq.scalp-mr15"
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
      toast.success(`🔥 إشارة Scalp جديدة: ${t.symbol}`, {
        description: body,
        duration: 3e4
      });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(`🔥 Scalp ${t.symbol}`, {
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
      filter: "strategy=eq.scalp-mr15"
    }, (payload) => {
      const t = payload.new;
      const old = payload.old;
      if (t.status !== "closed" || old.status === "closed") return;
      beep(t.pnl && t.pnl > 0 ? 1320 : 520);
      const pnl = Number(t.pnl ?? 0);
      toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج Scalp: ${t.symbol}`, {
        description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
        duration: 2e4
      });
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification(`${pnl >= 0 ? "🎯" : "🛑"} ${t.symbol}`, {
            body: `${t.exit_reason} • ${pnl.toFixed(0)} EGP`,
            tag: `${t.id}-exit`
          });
        } catch {
        }
      }
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(CollectionWatchdogPanel, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2", children: "← الرجوع للرئيسية" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [
          "⚡ Scalp Live",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block h-2.5 w-2.5 rounded-full bg-bull ${pulse % 2 ? "animate-ping" : ""}` })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/scalp-feasibility", className: "mt-2 inline-block text-xs text-primary hover:underline", children: "📊 تقرير جدوى الإشارات (proof بأرقام حقيقية) →" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm mt-1", children: "إشعارات لحظية فورية (Realtime). الصوت + إشعار المتصفح يشتغلوا في نفس الثانية اللي بتطلع فيها الإشارة." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        ensureAudioUnlock();
        beep(880);
        toast("الصوت مفعّل ✅");
        if (typeof Notification !== "undefined") Notification.requestPermission().catch(() => {
        });
      }, className: "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground", children: "فعّل الصوت + الإشعارات" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إشارات اليوم", value: String(trades.length) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "مفتوحة / مقفولة", value: `${open.length} / ${closed.length}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "PnL محقق", value: `${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`, tone: realized >= 0 ? "bull" : "bear" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "نسبة النجاح", value: `${winRate.toFixed(0)}%` })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ExtensionToggle, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ManualOpenThunderTabWidget, {}),
    trades.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border bg-card p-10 text-center text-muted-foreground", children: "لسه مفيش إشارات Scalp النهارده. الإشعار هيوصلك لحظياً أول ما تطلع." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: trades.map((t) => {
      const ageMs = nowMs - new Date(t.entry_ts).getTime();
      const cur = t.current_price ?? null;
      const drift = cur != null && t.entry_price > 0 ? (cur - t.entry_price) / t.entry_price : 0;
      const priceMovedUp = cur != null && drift > MAX_DRIFT_PCT;
      const isFresh = t.status === "open" && ageMs <= FRESH_MS && !priceMovedUp;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-lg border p-4 flex flex-wrap items-center gap-4 ${isFresh ? "bg-warn/15 border-warn shadow-md" : t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-2xl", children: t.symbol }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: fmtTime(t.entry_ts) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(OpenThunderTabButton, { symbol: t.symbol })
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
            ] }),
            t.current_price_source && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.current_price_source === "thunder_ext" ? "bg-bull/20 text-bull" : "bg-muted text-muted-foreground"}`, title: t.current_price_ts ?? void 0, children: [
              t.current_price_source === "thunder_ext" ? "⚡ Thunder" : t.current_price_source,
              t.current_price_ts && ` · ${Math.max(0, Math.round((Date.now() - new Date(t.current_price_ts).getTime()) / 1e3))}s`
            ] })
          ] }),
          t.peak_price != null && t.peak_price > 0 && (() => {
            const peakDrift = t.entry_price > 0 ? (t.peak_price - t.entry_price) / t.entry_price : 0;
            const hitTp = t.peak_price >= t.tp_price;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs mt-1", children: [
              "أعلى سعر: ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-bull", children: fmtPrice(t.peak_price) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                " (",
                peakDrift >= 0 ? "+" : "",
                (peakDrift * 100).toFixed(2),
                "%)"
              ] }),
              hitTp && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mr-2 text-[10px] font-bold text-bull", children: "🎯 تخطّى TP" }),
              t.peak_price_ts && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-muted-foreground", children: [
                " · ",
                fmtTime(t.peak_price_ts)
              ] })
            ] });
          })()
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mr-auto text-left", children: [
          (t.max_gap_sec ?? 0) > 60 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 inline-block rounded bg-warn/20 border border-warn px-2 py-0.5 text-[11px] font-bold text-warn", title: `أكبر فجوة بين التيكات داخل نافذة الصفقة = ${t.max_gap_sec}s • عدد التيكات = ${t.tick_count ?? 0}`, children: [
            "⚠️ فجوة تيكات ",
            t.max_gap_sec,
            "s"
          ] }),
          isFresh ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-warn font-bold text-lg", children: "🔥 ادخل دلوقتي" }) : t.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground font-semibold", children: priceMovedUp ? `⏳ النافذة فاتت — السعر فوق الدخول بـ ${(drift * 100).toFixed(2)}%` : "⏳ النافذة فاتت" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold", children: [
            t.exit_reason,
            " • ",
            Number(t.pnl) >= 0 ? "+" : "",
            Number(t.pnl).toFixed(0),
            " EGP"
          ] })
        ] })
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
function OpenThunderTabButton({
  symbol
}) {
  const [state, setState] = reactExports.useState("idle");
  const [msg, setMsg] = reactExports.useState("");
  const onClick = () => requestOpenThunderTab(symbol, setState, setMsg);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick, title: msg || "افتح تاب ثاندر لهذا السهم مع قائمة معلومات السوق (المستوى الثاني) تلقائياً", className: `mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${state === "ok" ? "border-bull bg-bull/15 text-bull" : state === "err" || state === "noext" ? "border-bear bg-bear/15 text-bear" : "border-muted-foreground/30 bg-muted/30 hover:bg-accent hover:border-accent-foreground/50"}`, children: state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ الاكستنشن مش شغّال" : state === "err" ? "❌ فشل" : "⚡ فتح تاب ثاندر" });
}
function ManualOpenThunderTabWidget() {
  const [sym, setSym] = reactExports.useState("");
  const [state, setState] = reactExports.useState("idle");
  const [msg, setMsg] = reactExports.useState("");
  const submit = (e) => {
    e.preventDefault();
    const s = sym.trim().toUpperCase();
    if (!s) return;
    requestOpenThunderTab(s, setState, setMsg);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "rounded-lg border bg-card p-3 flex flex-wrap items-center gap-2", title: msg || "افتح تاب ثاندر لأي سهم يدوياً — لو ثاندر عمل logout وقفل التاب", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: "⚡ فتح تاب ثاندر يدوي" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", value: sym, onChange: (e) => setSym(e.target.value), placeholder: "رمز السهم (مثل AALR)", className: "rounded border bg-background px-2 py-1 text-sm font-mono uppercase w-40", maxLength: 12 }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", className: `rounded border px-3 py-1 text-sm font-semibold transition-colors ${state === "ok" ? "border-bull bg-bull/20 text-bull" : state === "err" || state === "noext" ? "border-bear bg-bear/20 text-bear" : "border-muted-foreground/40 bg-muted/40 hover:bg-accent"}`, children: state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ ثبّت الاكستنشن v4.1.86" : state === "err" ? "❌ فشل" : "افتح التاب" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground mr-auto", children: msg || "بيفتح صفحة السهم في ثاندر ويفتح قائمة معلومات السوق (L2) تلقائياً" })
  ] });
}
function requestOpenThunderTab(symbol, setState, setMsg) {
  const marker = typeof document !== "undefined" ? document.documentElement?.getAttribute("data-thunder-ext-v4") : null;
  if (!marker) {
    setState("noext");
    setMsg("الاكستنشن v4.1.86 مش متثبّت أو نسخة قديمة — نزّل الـZIP الجديد من صفحة Thunder وأعد تحميله من chrome://extensions.");
    setTimeout(() => setState("idle"), 4e3);
    return;
  }
  const reqId = `open-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let done = false;
  const onMsg = (ev) => {
    const d = ev.data;
    if (!d || d.__thunderResponse !== true || d.__reqId !== reqId) return;
    done = true;
    window.removeEventListener("message", onMsg);
    if (d.ok) {
      setState("ok");
      setMsg("");
    } else {
      setState("err");
      setMsg(d.err || d.resp?.error || "فشل غير معروف");
    }
    setTimeout(() => setState("idle"), 3e3);
  };
  window.addEventListener("message", onMsg);
  try {
    window.postMessage({
      __thunder: true,
      type: "openPersistTab",
      payload: {
        symbol
      },
      __reqId: reqId
    }, window.location.origin);
  } catch (e) {
    window.removeEventListener("message", onMsg);
    setState("err");
    setMsg(String(e?.message || e));
    setTimeout(() => setState("idle"), 3e3);
    return;
  }
  setTimeout(() => {
    if (done) return;
    window.removeEventListener("message", onMsg);
    setState("err");
    setMsg("مفيش رد من الاكستنشن — تأكد إن ثاندر مسجّل دخول ثم اضغط تاني.");
    setTimeout(() => setState("idle"), 4e3);
  }, 2500);
}
export {
  ScalpPage as component
};
