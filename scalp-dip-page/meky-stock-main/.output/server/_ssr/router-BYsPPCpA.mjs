import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, q as queryOptions } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { m as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { n as notifyNewPick, b as notifyNewsShocksForActive, g as getMarketStatus, a as getNewsSentiment, c as getCairoNow } from "./market-hours-CyHCW23Z.mjs";
import { T as Toaster$1, t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-DcfJRNR2.mjs";
import { c as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-BpMZvK1r.mjs";
import { supabaseAdmin as supabaseAdmin$5 } from "./client.server-D5ro3rAQ.mjs";
import * as fs__default from "node:fs";
import fs__default__default from "node:fs";
import * as path__default from "node:path";
import path__default__default from "node:path";
import { exec } from "node:child_process";
import { i as ingestClosedTrades } from "./outcome-loop.server-BOECsdkT.mjs";
import { a as runAdaptiveLearning, f as fetchMarketSnapshot, b as computeMarketBreadth$1, d as fetchMacroSnapshot, s as saveMacro, e as fetchFundamentals, g as saveFundamentals, c as createPendingScan, r as runScanForId, h as fetchHistoryBulk } from "./run-scan.server-C7KKLuW0.mjs";
import { b as sendTelegramTo, s as sendTelegram$1, e as escapeHtml, a as explainNewsBaladi } from "./telegram.server-D6g8flro.mjs";
import { i as index_default } from "../_libs/mendable__firecrawl-js.mjs";
import { c as chatWithFallback } from "./chat-fallback.server-HMcdWJQs.mjs";
import { f as fetchNewsBulk, g as getAiGateway, A as AI_MODEL, b as fetchRssItemsForSymbol } from "./news.server-DBo8FnwV.mjs";
import * as zlib$2 from "node:zlib";
import { createHash, timingSafeEqual } from "crypto";
import { r as recomputeAutoThreshold, b as runSelfCalibration } from "./self-calibration.server-DafiNwz-.mjs";
import { g as generateText } from "../_libs/ai.mjs";
import { loadIsotonicCalibration } from "./isotonic-calibration.server-CgJbsL0r.mjs";
import { l as loadSymbolMemory } from "./pattern-memory.server-BKGG6vXj.mjs";
import { d as detectRegime } from "./levels.server-DPpGzyqT.mjs";
import { s as simulateSymbol, c as computeMetrics } from "./engine.server-K_Mwkd4b.mjs";
import { f as fetchEgxSnapshots } from "./tradingview.server-ASbxwkih.mjs";
import { isBlocked } from "./blocklist-BkSBV-pn.mjs";
import { o as object, b as string, n as number, f as boolean, e as union, p as preprocess, _ as _enum, a as any, c as array, r as record, l as literal, u as unknown, d as discriminatedUnion } from "../_libs/zod.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "./auto-orchestrator.server-Cobs3ZBw.mjs";
import "./tier-k-intelligence.server-IqAM99dH.mjs";
import "./yahoo.server-Coiq-pQ8.mjs";
import "./tier-i-intelligence.server-Ddugl3s6.mjs";
import "../_libs/technicalindicators.mjs";
import "../_libs/axios.mjs";
import "../_libs/form-data.mjs";
import "../_libs/combined-stream.mjs";
import "../_libs/delayed-stream.mjs";
import "path";
import "http";
import "https";
import "url";
import "fs";
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
import "os";
import "../_libs/has-flag.mjs";
import "zlib";
import "events";
import "../_libs/zod-to-json-schema.mjs";
import "../_libs/ai-sdk__openai-compatible.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/@vercel/oidc.mjs";
import "../_libs/opentelemetry__api.mjs";
import "./strategy.server-BM-ZfGqV.mjs";
function useServerFn(serverFn) {
  const router2 = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router2.stores.location.get();
        return router2.navigate(router2.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router2, serverFn]);
}
const appCss = "/assets/styles-DX9Ap4IU.css";
function MarketClock() {
  const [mounted, setMounted] = reactExports.useState(false);
  const [status, setStatus] = reactExports.useState(() => getMarketStatus());
  reactExports.useEffect(() => {
    setMounted(true);
    setStatus(getMarketStatus());
    const id = setInterval(() => setStatus(getMarketStatus()), 1e3);
    return () => clearInterval(id);
  }, []);
  if (!mounted) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-full border-b border-border bg-card/60 backdrop-blur", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "EGX" }) }) });
  }
  const dot = status.isOpen ? "bg-bull" : "bg-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      dir: "rtl",
      className: `w-full border-b ${status.isOpen ? "border-bull/30 bg-bull/5" : "border-border bg-card/60"} backdrop-blur`,
      children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `relative inline-flex h-2 w-2 rounded-full ${dot}`, children: status.isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute inset-0 animate-ping rounded-full bg-bull/60" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: status.isOpen ? "font-semibold text-bull" : "text-muted-foreground", children: status.label })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: status.dateLabel }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono tabular-nums text-foreground", children: status.hhmmss }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "القاهرة" })
        ] })
      ] })
    }
  );
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
let sharedCtx = null;
let unlockAttached = false;
function getCtx() {
  if (typeof window === "undefined") return null;
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    if (!sharedCtx) sharedCtx = new AC();
    return sharedCtx;
  } catch {
    return null;
  }
}
function ensureAudioUnlock() {
  if (typeof window === "undefined" || unlockAttached) return;
  unlockAttached = true;
  const unlock = () => {
    const ctx = getCtx();
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {
    });
    try {
      if (ctx) {
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
      }
    } catch {
    }
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
    window.removeEventListener("touchstart", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
  window.addEventListener("touchstart", unlock, { once: true });
}
function beep(freq = 880) {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    if (ctx.state === "suspended") ctx.resume().catch(() => {
    });
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = freq;
    g.gain.value = 1e-4;
    o.connect(g);
    g.connect(ctx.destination);
    const now = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    g.gain.exponentialRampToValueAtTime(1e-4, now + 0.5);
    o.start(now);
    o.stop(now + 0.55);
  } catch {
  }
}
function alertBeep() {
  beep(880);
  setTimeout(() => beep(1180), 180);
}
const LOG_KEY = "egx_notify_log";
const MUTE_KEY = "egx_notify_muted";
const MAX_ENTRIES = 300;
function readLog() {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function appendLog(e) {
  try {
    const all = readLog();
    all.unshift({ ...e, ts: (/* @__PURE__ */ new Date()).toISOString() });
    localStorage.setItem(LOG_KEY, JSON.stringify(all.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent("egx-notify-log"));
  } catch {
  }
}
function clearLog() {
  try {
    localStorage.removeItem(LOG_KEY);
    window.dispatchEvent(new CustomEvent("egx-notify-log"));
  } catch {
  }
}
function isMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}
function setMuted(m) {
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
    window.dispatchEvent(new CustomEvent("egx-notify-muted"));
  } catch {
  }
}
function fmtPrice(p) {
  const n = Number(p);
  if (!isFinite(n)) return "—";
  return Math.abs(n) < 1 ? n.toFixed(4) : n.toFixed(2);
}
function GlobalScalpWatcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const paused = pathname === "/scalp" || pathname === "/scalp-fresh";
  const seenIds = reactExports.useRef(/* @__PURE__ */ new Set());
  const seenExits = reactExports.useRef(/* @__PURE__ */ new Set());
  reactExports.useEffect(() => {
    ensureAudioUnlock();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
      });
    }
  }, []);
  reactExports.useEffect(() => {
    if (paused) return;
    const channel = supabase.channel("global-scalp-live").on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "paper_trades" },
      (payload) => {
        const t = payload.new;
        if (t.strategy !== "scalp-mr15" && t.strategy !== "scalp-mr15-fresh" && t.strategy !== "scalp-dip") return;
        if (seenIds.current.has(t.id)) return;
        seenIds.current.add(t.id);
        ensureAudioUnlock();
        if (!isMuted()) alertBeep();
        const tag = t.strategy === "scalp-mr15-fresh" ? "🔥 [FRESH]" : t.strategy === "scalp-dip" ? "📉 [GAP]" : "🔥";
        const entry = fmtPrice(t.entry_price);
        const tp = fmtPrice(t.tp_price);
        const sl = fmtPrice(t.sl_price);
        const body = `دخول ${entry} • TP ${tp} • SL ${sl}`;
        toast.success(`${tag} إشارة Scalp: ${t.symbol}`, { description: body, duration: 3e4 });
        appendLog({ kind: "BUY", title: `${tag} إشارة ${t.symbol}`, body });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`${tag} ${t.symbol}`, { body, tag: t.id, requireInteraction: true });
          } catch {
          }
        }
      }
    ).on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "paper_trades" },
      (payload) => {
        const t = payload.new;
        const old = payload.old;
        if (t.strategy !== "scalp-mr15" && t.strategy !== "scalp-mr15-fresh" && t.strategy !== "scalp-dip") return;
        if (t.status !== "closed" || old.status === "closed") return;
        if (seenExits.current.has(t.id)) return;
        seenExits.current.add(t.id);
        const pnl = Number(t.pnl ?? 0);
        if (!isMuted()) beep(pnl > 0 ? 1320 : 520);
        const tag = t.strategy === "scalp-mr15-fresh" ? "[FRESH]" : t.strategy === "scalp-dip" ? "[GAP]" : "";
        toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج ${tag}: ${t.symbol}`, {
          description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
          duration: 2e4
        });
        appendLog({ kind: pnl >= 0 ? "BUY" : "SELL", title: `خروج ${tag} ${t.symbol}`, body: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP` });
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          try {
            new Notification(`${pnl >= 0 ? "🎯" : "🛑"} ${tag} ${t.symbol}`, { body: `${t.exit_reason ?? ""} • ${pnl.toFixed(0)} EGP`, tag: `${t.id}-exit` });
          } catch {
          }
        }
      }
    ).subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [paused]);
  return null;
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
createServerFn({
  method: "GET"
}).handler(createSsrRpc("64f76e3101175655734775544ff6d26371663016d6568212eb3140fff79f57aa"));
createServerFn({
  method: "POST"
}).validator((d) => d).handler(createSsrRpc("05cd77dacd06be3c6285b58375ce809df7d0db7836c7d9132e3d2c837fc88a54"));
function AISupervisorChat() {
  const [open, setOpen] = reactExports.useState(false);
  const [input, setInput] = reactExports.useState("");
  const [sending, setSending] = reactExports.useState(false);
  const feedQ = reactExports.useRef(null);
  const [feed, setFeed] = reactExports.useState({
    entries: [],
    alive: "unknown"
  });
  const scrollRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/ai-supervisor-feed");
        if (res.ok) {
          const j2 = await res.json();
          if (!cancelled) setFeed({
            entries: j2.entries ?? [],
            alive: j2.alive ?? "unknown",
            level: j2.level
          });
        }
      } catch {
      }
      if (!cancelled) feedQ.current = setTimeout(tick, 2e4);
    };
    tick();
    return () => {
      cancelled = true;
      if (feedQ.current) clearTimeout(feedQ.current);
    };
  }, []);
  reactExports.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [feed.entries.length, open]);
  const aliveColor = feed.alive === "yes" ? "bg-emerald-400" : feed.alive === "stale" ? "bg-amber-400" : "bg-zinc-500";
  const aliveText = feed.alive === "yes" ? "صاحي وشايف كل حاجة" : feed.alive === "stale" ? "مش شايف — البيانات قديمة!" : "لسه بيبدأ";
  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await fetch("/api/public/hooks/ai-supervisor-feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text
        })
      });
      setInput("");
      setFeed((f) => ({
        ...f,
        entries: [{
          time: (/* @__PURE__ */ new Date()).toISOString(),
          kind: "user",
          text
        }, ...f.entries]
      }));
    } finally {
      setSending(false);
    }
  };
  const kindIcon = {
    thought: "💭",
    action: "🔧",
    alert: "🚨",
    plan: "🎯",
    user: "👤",
    answer: "🛡️"
  };
  const kindColor = {
    thought: "text-sky-300",
    action: "text-emerald-300",
    alert: "text-red-300",
    plan: "text-violet-300",
    user: "text-foreground",
    answer: "text-emerald-200"
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen((o) => !o), "aria-label": "المشرف الذكي", title: "المشرف الذكي — اضغط للمراقبة الحية", className: "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-lg hover:scale-105 transition", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-3 w-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute inline-flex h-full w-full animate-ping rounded-full ${aliveColor} opacity-60` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `relative inline-flex h-3 w-3 rounded-full ${aliveColor}` })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: "🛡️ المشرف" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground hidden sm:inline", children: open ? "إغلاق" : aliveText })
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { dir: "rtl", className: "fixed bottom-16 right-4 z-50 flex h-[70vh] w-[92vw] max-w-md flex-col rounded-xl border bg-background shadow-2xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "relative flex h-3 w-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `absolute inline-flex h-full w-full animate-ping rounded-full ${aliveColor} opacity-60` }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `relative inline-flex h-3 w-3 rounded-full ${aliveColor}` })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-black", children: "🛡️ المشرف الذكي" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
              aliveText,
              " — تحديث كل 20 ثانية"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), className: "text-muted-foreground hover:text-foreground", "aria-label": "إغلاق", children: "✕" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: scrollRef, className: "flex-1 space-y-2 overflow-y-auto p-3", children: [
        feed.entries.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground space-y-2 p-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "المشرف لسه بيبدأ — أول تقرير هيظهر بعد أول دورة مراقبة." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "اكتب رسالة ليه تحت وهو هيرد في دورته الجاية (كل 20 دقيقة أثناء السوق، أو فورًا أول ما يصحى)." })
        ] }),
        feed.entries.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xs leading-relaxed ${e.kind === "user" ? "text-left" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `font-semibold ${kindColor[e.kind] ?? ""}`, children: [
            kindIcon[e.kind] ?? "•",
            " ",
            e.kind === "user" ? "أنت" : e.kind === "answer" ? "المشرف" : "المشرف",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: new Date(e.time).toLocaleString("ar-EG", {
              hour: "2-digit",
              minute: "2-digit"
            }) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "whitespace-pre-wrap rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 mt-0.5", children: e.text })
        ] }, i))
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t p-2 flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: input, onChange: (e) => setInput(e.target.value), onKeyDown: (e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }, placeholder: "اكتب للمشرف… (طلب، سؤال، أو تعليمات)", className: "flex-1 rounded-md border bg-muted/40 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: send, disabled: sending || !input.trim(), className: "rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40", children: sending ? "…" : "إرسال" })
      ] })
    ] })
  ] });
}
const listAuditFeed = createServerFn({
  method: "GET"
}).validator((d) => ({
  afterId: Number(d?.afterId ?? 0),
  probe: Boolean(d?.probe)
})).handler(createSsrRpc("7403c6cad522bbde625b9e1c2180789663e866e306f57a8e106d25442add9001"));
const AUDIT_LAST_ID_KEY = "egx_notify_audit_last_id";
function parseDetails(raw) {
  if (!raw) return {};
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}
function auditRowToEntry(r) {
  const d = parseDetails(r.details);
  const px = (v) => v != null && Number.isFinite(v) ? `${v.toFixed(2)} ج.م` : "";
  const pct2 = (v) => v != null && Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : "";
  switch (r.event_type) {
    case "MW_WEEKLY_SCAN": {
      const sel = Array.isArray(d.selected) ? d.selected : [];
      if (d.regime_cash) {
        return { kind: "WARNING", title: "فلتر النظام: كاش هذا الأسبوع", body: "تراكم 10 أسابيع سالب — لا مرشحين هذا الأسبوع." };
      }
      if (d.no_candidates) {
        return { kind: "INFO", title: "لا مرشحين داخل نطاق الزخم", body: "لا أسهم بين 8%-45% زخم هذا الأسبوع — كاش." };
      }
      if (sel.length) {
        return {
          kind: "BUY",
          title: `إشعار شراء أسبوعي: ${sel.join("، ")}`,
          body: `الدخول: افتتاح ${d.entry_date ?? "أول جلسة"} (فجوة -3% إلى +2%) · الخروج: افتتاح الأسبوع القادم.`
        };
      }
      return { kind: "INFO", title: "مسح أسبوعي تم", body: d.entry_date ? `أُرسل التليجرام — أسبوع الدخول ${d.entry_date}.` : "سجل المسح الأسبوعي." };
    }
    case "MW_WEEKLY_EXIT":
      return {
        kind: "SELL",
        title: `خروج أسبوعي: ${r.symbol}`,
        body: `خروج عند ${px(r.trigger_price)} · العائد ${pct2(r.pnl_pct)} · ${d.exit_reason ?? "WEEKLY_TIME_EXIT"}.`
      };
    case "MW_REGIME_CASH":
      return { kind: "WARNING", title: "فلتر النظام: كاش", body: "تراكم 10 أسابيع لمؤشر متساوي الأوزان سالب — النظام في كاش." };
    case "USER_BOUGHT":
      return { kind: "BUY", title: `تأكيد شراء: ${r.symbol}`, body: `تنفيذ عند ${px(r.trigger_price)} (سعر الترشيح ${px(r.reference_price)}).` };
    case "USER_SOLD":
      return { kind: "SELL", title: `تأكيد بيع: ${r.symbol}`, body: `تنفيذ عند ${px(r.trigger_price)} · العائد ${pct2(r.pnl_pct)}.` };
    case "PAPER_CLOSED":
      return { kind: "SELL", title: `إغلاق ورقي: ${r.symbol}`, body: `العائد ${pct2(r.pnl_pct)}.` };
    default:
      return { kind: "INFO", title: `${r.event_type}${r.symbol && r.symbol !== "-" ? ` — ${r.symbol}` : ""}`, body: r.trigger_price != null ? px(r.trigger_price) : "" };
  }
}
function NotificationCenter() {
  const [perm, setPerm] = reactExports.useState("default");
  const [muted, setMutedState] = reactExports.useState(false);
  const [open, setOpen] = reactExports.useState(false);
  const [log, setLog] = reactExports.useState([]);
  const fetchFeed = useServerFn(listAuditFeed);
  const lastIdRef = reactExports.useRef(-1);
  reactExports.useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    setMutedState(isMuted());
    setLog(readLog());
    const onLog = () => setLog(readLog());
    const onMute = () => setMutedState(isMuted());
    window.addEventListener("egx-notify-log", onLog);
    window.addEventListener("egx-notify-muted", onMute);
    return () => {
      window.removeEventListener("egx-notify-log", onLog);
      window.removeEventListener("egx-notify-muted", onMute);
    };
  }, []);
  reactExports.useEffect(() => {
    let cancelled = false;
    const ingest = async () => {
      try {
        let lastId = lastIdRef.current;
        if (lastId < 0) {
          const stored = Number(localStorage.getItem(AUDIT_LAST_ID_KEY) ?? "0");
          if (stored > 0) {
            lastId = stored;
            lastIdRef.current = stored;
          }
        }
        const probe = lastId <= 0;
        const res = await fetchFeed({ data: { afterId: probe ? 0 : lastId, probe } });
        if (cancelled || !res) return;
        if (probe) {
          lastIdRef.current = res.maxId;
          try {
            localStorage.setItem(AUDIT_LAST_ID_KEY, String(res.maxId));
          } catch {
          }
          return;
        }
        if (res.maxId > lastId) {
          lastIdRef.current = res.maxId;
          try {
            localStorage.setItem(AUDIT_LAST_ID_KEY, String(res.maxId));
          } catch {
          }
        }
        for (const r of res.rows) {
          const entry = auditRowToEntry(r);
          appendLog(entry);
          const loud = entry.kind === "BUY" || entry.kind === "SELL" || entry.kind === "WARNING";
          if (loud) {
            ensureAudioUnlock();
            if (!isMuted()) {
              if (entry.kind === "SELL" || entry.kind === "WARNING") alertBeep();
              else beep(1200);
            }
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try {
                new Notification(entry.title, { body: entry.body, tag: `audit-${r.id}` });
              } catch {
              }
            }
          }
        }
      } catch {
      }
    };
    ingest();
    const id = setInterval(ingest, 6e4);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [fetchFeed]);
  const enable = async () => {
    ensureAudioUnlock();
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") {
      beep(1320);
      appendLog({ kind: "INFO", title: "تم تفعيل الإشعارات", body: "صلاحية المتصفح ممنوحة — سيتم تنبيهك بكل إشارة وخروج." });
    } else appendLog({ kind: "WARNING", title: "تعذّر تفعيل الإشعارات", body: "الصلاحية مرفوضة — فعّلها يدويًا من إعدادات الموقع في المتصفح." });
  };
  const needsEnable = typeof Notification !== "undefined" && Notification.permission !== "granted";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed bottom-3 left-3 z-50 print:hidden", children: [
    needsEnable && /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: enable,
        className: "mb-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-black shadow-lg hover:bg-amber-400",
        children: "🔔 فعّل الإشعارات (اضغط هنا — المطلوب نقرة منك لصلاحية المتصفح)"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => setOpen((o) => !o),
          className: "rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white shadow hover:bg-neutral-700",
          children: [
            "📜 سجل الإشعارات (",
            log.length,
            ")"
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            const m = !muted;
            setMuted(m);
            setMutedState(m);
            if (!m) {
              ensureAudioUnlock();
              beep(880);
            }
          },
          className: `rounded-lg px-3 py-1.5 text-sm font-bold shadow ${muted ? "bg-red-700 text-white hover:bg-red-600" : "bg-emerald-700 text-white hover:bg-emerald-600"}`,
          title: muted ? "الصوت مقفول — اضغط للتشغيل" : "الصوت شغال — اضغط للكتم",
          children: muted ? "🔇 مكتوم" : "🔊 الصوت شغال"
        }
      )
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 max-h-72 w-96 overflow-auto rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-1 flex justify-between items-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-neutral-400", children: "سجل دائم — كل تنبيه صدر، حتى لو كان مقفول الصوت" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: clearLog, className: "text-xs text-red-400 hover:underline", children: "تفريغ" })
      ] }),
      log.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2 text-sm text-neutral-500", children: "لا توجد إشعارات مسجلة بعد" }),
      log.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-neutral-800 px-1 py-1.5 text-sm last:border-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: e.kind === "SELL" ? "text-red-400 font-bold" : e.kind === "BUY" ? "text-emerald-400 font-bold" : "text-amber-400", children: [
            e.kind === "SELL" ? "🛑" : e.kind === "BUY" ? "🎯" : "ℹ️",
            " ",
            e.title
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0 text-[10px] text-neutral-500", children: new Date(e.ts).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-neutral-400", children: e.body })
      ] }, i))
    ] })
  ] });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist or has been moved." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "This page didn't load" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Something went wrong on our end. You can try refreshing or head back home." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "a",
        {
          href: "/",
          className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent",
          children: "Go home"
        }
      )
    ] })
  ] }) });
}
const Route$2j = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      {
        name: "description",
        content: "ماسح يومي لأسهم البورصة المصرية مع تحليل فني وتوصيات ذكية للمدى القصير."
      },
      { property: "og:title", content: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      {
        property: "og:description",
        content: "توصيات يومية مرتبة بنقاط دخول وأهداف ووقف خسارة."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "EGX سكانر — تحليل ذكي للبورصة المصرية" },
      { name: "description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { property: "og:description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { name: "twitter:description", content: "EGX Insights scans Egyptian stocks, analyzes them with technical indicators and AI, and recommends short-term trading opportunities." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e25a586-ba96-432f-b9f3-fe2459d6de50/id-preview-d9f9f91f--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app-1780394725131.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/7e25a586-ba96-432f-b9f3-fe2459d6de50/id-preview-d9f9f91f--22b3e97d-425e-446e-8ea6-07fd5375b0d2.lovable.app-1780394725131.png" }
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss
      },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap"
      }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "ar", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$2j.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(MarketClock, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/activity",
        "aria-label": "سجل النشاط والإشعارات",
        title: "سجل النشاط والإشعارات",
        className: "fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition",
        children: "📜"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/automation",
        "aria-label": "الأتمتة — مراقبة المشروع",
        title: "الأتمتة — مراقبة المشروع",
        className: "fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg hover:scale-105 transition",
        children: "🤖"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/scalp",
        "aria-label": "Scalp Live — إشارات لحظية",
        title: "Scalp Live",
        className: "fixed bottom-36 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-warn text-warn-foreground shadow-lg hover:scale-105 transition",
        children: "⚡"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/scalp-fresh",
        "aria-label": "Scalp Fresh — نسخة تجريبية",
        title: "Scalp Fresh (تجريبي)",
        className: "fixed bottom-52 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 transition",
        children: "🧪"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/session-log",
        "aria-label": "Session Log — سجل الجلسة",
        title: "Session Log",
        className: "fixed bottom-[17rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground shadow-lg hover:scale-105 transition",
        children: "📜"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/scalp-dip",
        "aria-label": "Scalp DIP — استراتيجية الانخفاض",
        title: "Scalp DIP Live",
        className: "fixed bottom-[21rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg hover:scale-105 transition",
        children: "📉"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/marketwatch-health",
        "aria-label": "فحص Volume لحظي",
        title: "فحص Volume لحظي",
        className: "fixed bottom-[25rem] left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-bull text-bull-foreground shadow-lg hover:scale-105 transition",
        children: "📊"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, { position: "top-center", richColors: true, closeButton: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(GlobalScalpWatcher, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(NotificationCenter, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AISupervisorChat, {})
  ] });
}
const $$splitComponentImporter$I = () => import("./index-D4gvSuB7.mjs");
const Route$2i = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter$I, "component")
});
const listPositions = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0b600d69f4c93e6451655d8abeafa56788e476dd51a35d3aae5a60fe034e9082"));
const OpenSchema = object({
  symbol: string().min(1).max(20),
  entry_price: number().positive(),
  quantity: number().positive().default(1),
  stop_loss: number().positive().nullable().optional(),
  target_price: number().positive().nullable().optional(),
  max_hold_days: number().int().positive().nullable().optional(),
  recommendation_id: string().uuid().nullable().optional(),
  notes: string().max(500).nullable().optional(),
  // Pre-buy L2 gate controls. Default: ON.
  skip_l2_gate: boolean().optional().default(false),
  gate_tp_pct: number().positive().optional(),
  gate_fee_pct: number().nonnegative().optional(),
  gate_source: string().max(40).optional()
});
const openPosition = createServerFn({
  method: "POST"
}).inputValidator((d) => OpenSchema.parse(d)).handler(createSsrRpc("80a649afc32c59e6f9568a2b2d1537765c00f78803241630c58f8908c8640535"));
const ClosePositionSchema = object({
  position_id: string().uuid(),
  exit_price: number().positive(),
  exit_reason: _enum(["target_hit", "stop_loss", "trailing_stop", "time_exit", "manual", "news_shock"]).default("manual")
});
const closePosition = createServerFn({
  method: "POST"
}).inputValidator((d) => ClosePositionSchema.parse(d)).handler(createSsrRpc("9cf7afcc4da36d0351774c8f92e72a3725e5d650af8c66d48632f750d598c4b4"));
const AckSchema = object({
  alert_id: string().uuid()
});
const acknowledgeAlert = createServerFn({
  method: "POST"
}).inputValidator((d) => AckSchema.parse(d)).handler(createSsrRpc("43c34c8f9006f7b035597816cfca2525ec0d440216be52fd9788c10db431d269"));
const DeletePositionSchema = object({
  position_id: string().uuid()
});
const deletePosition = createServerFn({
  method: "POST"
}).inputValidator((d) => DeletePositionSchema.parse(d)).handler(createSsrRpc("5a60a9ee330fc9f273ade8e7a78db9e9579f9859b2f32a138495fad137c0c562"));
const listActivity = createServerFn({
  method: "GET"
}).handler(createSsrRpc("f20c1f9a188f60bf1513f24269a676cf1ec4b95a891a3cdb3c697c5543bfe754"));
const dailyPnl = createServerFn({
  method: "GET"
}).handler(createSsrRpc("4870ca91aee46fb7bc64953938bca4df042ce4a02210fe46e1f5c1f4a541a57d"));
const evaluatePositions = createServerFn({
  method: "POST"
}).handler(createSsrRpc("eda5aee35a0be88f6267b3aa53d7129925a40fa6b52adbbecb90dd35c04a3703"));
const activityQO = queryOptions({
  queryKey: ["activity"],
  queryFn: () => listActivity()
});
const $$splitNotFoundComponentImporter$g = () => import("./activity-COkN9kl4.mjs");
const $$splitErrorComponentImporter$i = () => import("./activity-M1aW2-R7.mjs");
const $$splitComponentImporter$H = () => import("./activity-DIcj1H8a.mjs");
const Route$2h = createFileRoute("/activity")({
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(activityQO),
  component: lazyRouteComponent($$splitComponentImporter$H, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$i, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$g, "notFoundComponent")
});
const $$splitComponentImporter$G = () => import("./ai-supervisor-Bd9KqFQe.mjs");
const Route$2g = createFileRoute("/ai-supervisor")({
  head: () => ({
    meta: [{
      title: "المشرف الذكي — مراقبة النظام لحظيًا"
    }, {
      name: "description",
      content: "لوحة مراقبة المشرف الذكي: حالة النظام، قرارات المشرف، وسجل التغييرات"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$G, "component")
});
const getAutomationSnapshot = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fc773513f959457af6a16f8f3f89985321c7d549186fb933e6350ee9313a6740"));
const snapshotQO = queryOptions({
  queryKey: ["automation-snapshot"],
  queryFn: () => getAutomationSnapshot(),
  refetchInterval: 3e4
});
const $$splitNotFoundComponentImporter$f = () => import("./automation-COkN9kl4.mjs");
const $$splitErrorComponentImporter$h = () => import("./automation-M1aW2-R7.mjs");
const $$splitComponentImporter$F = () => import("./automation-BKL_3p0t.mjs");
const Route$2f = createFileRoute("/automation")({
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(snapshotQO),
  component: lazyRouteComponent($$splitComponentImporter$F, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$h, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$f, "notFoundComponent")
});
const $$splitComponentImporter$E = () => import("./backtest-CA5Peilx.mjs");
const Route$2e = createFileRoute("/backtest")({
  component: lazyRouteComponent($$splitComponentImporter$E, "component"),
  head: () => ({
    meta: [{
      title: "Backtesting — اختبار الاستراتيجية على بيانات تاريخية"
    }, {
      name: "description",
      content: "محاكاة استراتيجية التوصيات على آخر 90 يوم لقياس نسبة النجاح والربحية."
    }]
  })
});
const $$splitComponentImporter$D = () => import("./daily-DEAlKfI4.mjs");
const Route$2d = createFileRoute("/daily")({
  head: () => ({
    meta: [{
      title: "صفقة اليوم — هدف +1٪ وخروج فوري"
    }, {
      name: "description",
      content: "سهم واحد كل يوم باحتمال عالٍ لتحقيق +1٪ خلال الجلسة. بيع فوراً عند الهدف."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$D, "component")
});
const $$splitComponentImporter$C = () => import("./decision-engine--71Ta8QS.mjs");
const $$splitNotFoundComponentImporter$e = () => import("./decision-engine-B7b39wSL.mjs");
const $$splitErrorComponentImporter$g = () => import("./decision-engine-ZRybJVsD.mjs");
const Route$2c = createFileRoute("/decision-engine")({
  head: () => ({
    meta: [{
      title: "Decision Engine — محرك القرارات الذكي"
    }, {
      name: "description",
      content: "تحليل بيانات الاستراتيجية وتقديم اقتراحات تعديل مبنية على أدلة حقيقية."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$g, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$e, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$C, "component")
});
createServerFn({
  method: "POST"
}).inputValidator((input) => object({
  symbol: string().min(1).max(20),
  company_ar: string().min(1).max(200),
  headlines: array(string().min(3).max(500)).min(1).max(20)
}).parse(input)).handler(createSsrRpc("4b6ba4d96a85210e8d8edcabb8ac9b2456ca8f1f053914ff44216a765ef5b706"));
createServerFn({
  method: "POST"
}).inputValidator((input) => object({
  company_ar: string().min(1).max(200),
  // user pastes raw text extracted from the PDF financial report
  report_text: string().min(50).max(5e4)
}).parse(input)).handler(createSsrRpc("5ebde02fc9cb42e78b75f4aa5fcc0830c6f3347c5a32a5bd4d4ebffc2e2de3f1"));
const getAutoDeepAnalysis = createServerFn({
  method: "GET"
}).handler(createSsrRpc("960f51279087a9cf413c6386776d2ead86b7900c86f423102192916ec9cb7384"));
const deepQueryOptions = queryOptions({
  queryKey: ["auto-deep-analysis"],
  queryFn: () => getAutoDeepAnalysis(),
  staleTime: 60 * 1e3
});
function ErrorView({
  message,
  reset
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background p-6 text-center", dir: "rtl", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-bear", children: message }),
    reset && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: reset, className: "mt-3 rounded-lg border px-3 py-2", children: "إعادة المحاولة" })
  ] });
}
const $$splitNotFoundComponentImporter$d = () => import("./deep-BMuXWR7I.mjs");
const $$splitErrorComponentImporter$f = () => import("./deep-COjIzUSF.mjs");
const $$splitComponentImporter$B = () => import("./deep-gUo1m4ji.mjs");
const Route$2b = createFileRoute("/deep")({
  head: () => ({
    meta: [{
      title: "تحليل هجين تلقائي — Meky Stock"
    }, {
      name: "description",
      content: "تحليل تلقائي لأعلى الأسهم: قواعد ثابتة فورية + ذكاء اصطناعي يفهم الأخبار، بدون أي إدخال يدوي."
    }]
  }),
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(deepQueryOptions),
  component: lazyRouteComponent($$splitComponentImporter$B, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$f, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$d, "notFoundComponent")
});
const getExecutionStats = createServerFn({
  method: "GET"
}).handler(createSsrRpc("38d53129308893778ead5c52e194740703847d4fa050242802f271c456673a53"));
const opts = queryOptions({
  queryKey: ["execution-stats"],
  queryFn: () => getExecutionStats(),
  refetchInterval: 1e4
});
const $$splitNotFoundComponentImporter$c = () => import("./execution-lab-j5V5m0A2.mjs");
const $$splitErrorComponentImporter$e = () => import("./execution-lab-Ce3hyj5M.mjs");
const $$splitComponentImporter$A = () => import("./execution-lab-kL5Gqfvg.mjs");
const Route$2a = createFileRoute("/execution-lab")({
  head: () => ({
    meta: [{
      title: "مختبر التنفيذ — Execution Lab"
    }]
  }),
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(opts),
  component: lazyRouteComponent($$splitComponentImporter$A, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$e, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$c, "notFoundComponent")
});
const $$splitComponentImporter$z = () => import("./ext-diag-CAZotm3f.mjs");
const Route$29 = createFileRoute("/ext-diag")({
  component: lazyRouteComponent($$splitComponentImporter$z, "component"),
  head: () => ({
    meta: [{
      title: "Extension Diagnostic — Throttling Probe"
    }]
  })
});
const $$splitComponentImporter$y = () => import("./extension-telemetry-DrfKvBD4.mjs");
const Route$28 = createFileRoute("/extension-telemetry")({
  component: lazyRouteComponent($$splitComponentImporter$y, "component"),
  head: () => ({
    meta: [{
      title: "Extension Telemetry — كل بيانات الاكستنشن حي"
    }]
  })
});
const $$splitComponentImporter$x = () => import("./halal-daytrade-DYdJMnlf.mjs");
const Route$27 = createFileRoute("/halal-daytrade")({
  component: lazyRouteComponent($$splitComponentImporter$x, "component"),
  head: () => ({
    meta: [{
      title: "استراتيجية التداول اليومي للأسهم الحلال — EGX"
    }, {
      name: "description",
      content: "Backtest كامل على 6 شهور لاستراتيجية تداول يومية على الأسهم الحلال في البورصة المصرية."
    }]
  })
});
const $$splitComponentImporter$w = () => import("./health-C2kZVmDF.mjs");
const Route$26 = createFileRoute("/health")({
  component: lazyRouteComponent($$splitComponentImporter$w, "component"),
  head: () => ({
    meta: [{
      title: "صحة الموديولات"
    }, {
      name: "description",
      content: "حالة كل موديول تحليلي في الوقت الفعلي"
    }]
  })
});
const $$splitComponentImporter$v = () => import("./health-check-C7EDUv_4.mjs");
const Route$25 = createFileRoute("/health-check")({
  component: lazyRouteComponent($$splitComponentImporter$v, "component"),
  head: () => ({
    meta: [{
      title: "فحص التجميع الشامل"
    }, {
      name: "description",
      content: "فحص كل مصادر البيانات و cron jobs في وقت واحد"
    }]
  })
});
const $$splitComponentImporter$u = () => import("./investment-D7LuMBfk.mjs");
const Route$24 = createFileRoute("/investment")({
  component: lazyRouteComponent($$splitComponentImporter$u, "component"),
  head: () => ({
    meta: [{
      title: "فرص الاستثمار الشهرية — EGX سكانر"
    }, {
      name: "description",
      content: "أفضل فرص الاستثمار في البورصة المصرية للشهر القادم بناءً على الأخبار والأساسيات والاتجاه الفني."
    }]
  })
});
const $$splitComponentImporter$t = () => import("./learning-BBnpdGcv.mjs");
const Route$23 = createFileRoute("/learning")({
  head: () => ({
    meta: [{
      title: "مستوى تعلّم الموديلات"
    }, {
      name: "description",
      content: "تشخيص لحظي لمستوى التعلم لكل موديل ونقاط الضعف والحلول."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$t, "component")
});
const $$splitComponentImporter$s = () => import("./marketwatch-health-CRDpIFgy.mjs");
const Route$22 = createFileRoute("/marketwatch-health")({
  head: () => ({
    meta: [{
      title: "Marketwatch Live Health"
    }, {
      name: "description",
      content: "فحص لحظي لتدفق بيانات volume من الإكستنشن"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$s, "component")
});
const $$splitComponentImporter$r = () => import("./missed-signals-DUyKSa6d.mjs");
const $$splitNotFoundComponentImporter$b = () => import("./missed-signals-B7b39wSL.mjs");
const $$splitErrorComponentImporter$d = () => import("./missed-signals-ZRybJVsD.mjs");
const Route$21 = createFileRoute("/missed-signals")({
  head: () => ({
    meta: [{
      title: "Missed Signals — الإشارات الضايعة"
    }, {
      name: "description",
      content: "الإشارات اللي الاستراتيجية شافتها لكن ماخدتش فيها صفقة، ونتيجتها لو كنا دخلنا."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$d, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$b, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$r, "component")
});
const $$splitComponentImporter$q = () => import("./morning-CRCOy-Yp.mjs");
const Route$20 = createFileRoute("/morning")({
  head: () => ({
    meta: [{
      title: "بريفينج الصباح — صفقات اليوم بثقة عالية"
    }, {
      name: "description",
      content: "صفقات قبل افتتاح البورصة (10 صباحاً) عدت بوابة Conviction صارمة: ثقة ≥75% واتفاق ≥4 موديلات وverifier موافق."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$q, "component")
});
const $$splitNotFoundComponentImporter$a = () => import("./paper-DEZbpQij.mjs");
const $$splitErrorComponentImporter$c = () => import("./paper-B5jRpu9v.mjs");
const $$splitComponentImporter$p = () => import("./paper-B1J_yqA2.mjs");
const Route$1$ = createFileRoute("/paper")({
  component: lazyRouteComponent($$splitComponentImporter$p, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$c, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$a, "notFoundComponent")
});
const getPerformanceStats = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fa89dee2a371fe9677cfc4aec0ece83ea5b862066c7641ba38b7dabb6d05b1c6"));
const perfQO = queryOptions({
  queryKey: ["performance-stats"],
  queryFn: () => getPerformanceStats(),
  refetchInterval: 6e4
});
const $$splitNotFoundComponentImporter$9 = () => import("./performance-COkN9kl4.mjs");
const $$splitErrorComponentImporter$b = () => import("./performance-M1aW2-R7.mjs");
const $$splitComponentImporter$o = () => import("./performance-ClKSwknB.mjs");
const Route$1_ = createFileRoute("/performance")({
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(perfQO),
  component: lazyRouteComponent($$splitComponentImporter$o, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$b, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$9, "notFoundComponent"),
  head: () => ({
    meta: [{
      title: "أداء النظام — Meky Stock"
    }, {
      name: "description",
      content: "إحصائيات أداء توصيات النظام آخر 30 يوم"
    }]
  })
});
const Route$1Z = createFileRoute("/ping")({
  server: {
    handlers: {
      GET: async () => new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        }
      }),
      HEAD: async () => new Response(null, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      })
    }
  }
});
const $$splitComponentImporter$n = () => import("./plan--benXHyR.mjs");
const Route$1Y = createFileRoute("/plan")({
  head: () => ({
    meta: [{
      title: "خطة اليوم — هجين (Hold + Swing)"
    }, {
      name: "description",
      content: "خطة استثمار يومية جاهزة للتنفيذ: كام سهم تشتري، ب كام، وقف خسارة وهدف لكل صفقة."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$n, "component")
});
const positionsQO = queryOptions({
  queryKey: ["positions"],
  queryFn: () => listPositions()
});
const dailyPnlQO = queryOptions({
  queryKey: ["positions", "daily-pnl"],
  queryFn: () => dailyPnl()
});
const $$splitNotFoundComponentImporter$8 = () => import("./positions-COkN9kl4.mjs");
const $$splitErrorComponentImporter$a = () => import("./positions-M1aW2-R7.mjs");
const $$splitComponentImporter$m = () => import("./positions-DQ2I4_j_.mjs");
const Route$1X = createFileRoute("/positions")({
  loader: ({
    context
  }) => Promise.all([context.queryClient.ensureQueryData(positionsQO), context.queryClient.ensureQueryData(dailyPnlQO)]),
  component: lazyRouteComponent($$splitComponentImporter$m, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$a, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$8, "notFoundComponent")
});
const getRealityCheck = createServerFn({
  method: "GET"
}).handler(createSsrRpc("5b05edd4867c22f2d10837166332ffd6cb00c7a46c0084959717d2dfa0d5d49b"));
const realityQuery = queryOptions({
  queryKey: ["reality-check"],
  queryFn: () => getRealityCheck()
});
const $$splitErrorComponentImporter$9 = () => import("./reality-C4C0qxw_.mjs");
const $$splitComponentImporter$l = () => import("./reality-BZCzcCPU.mjs");
const Route$1W = createFileRoute("/reality")({
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(realityQuery),
  component: lazyRouteComponent($$splitComponentImporter$l, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$9, "errorComponent")
});
const $$splitComponentImporter$k = () => import("./reconciliation-DTc0c-BP.mjs");
const $$splitNotFoundComponentImporter$7 = () => import("./reconciliation-B7b39wSL.mjs");
const $$splitErrorComponentImporter$8 = () => import("./reconciliation-ZRybJVsD.mjs");
const Route$1V = createFileRoute("/reconciliation")({
  head: () => ({
    meta: [{
      title: "Daily Reconciliation — تسوية يومية"
    }, {
      name: "description",
      content: "مقارنة إشارات الاستراتيجية بالتنفيذ الحقيقي من الإكستنشن."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$8, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$7, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$k, "component")
});
const getRightsOpportunities = createServerFn({
  method: "GET"
}).handler(createSsrRpc("df57b0716da4007094d7413b8e05c61cff4396d2332b800ea65cf26502ddc4f7"));
const rightsQuery = queryOptions({
  queryKey: ["rights-opportunities"],
  queryFn: () => getRightsOpportunities(),
  staleTime: 6e4
});
const $$splitNotFoundComponentImporter$6 = () => import("./rights-CykiZ03q.mjs");
const $$splitErrorComponentImporter$7 = () => import("./rights-bwsucCQD.mjs");
const $$splitComponentImporter$j = () => import("./rights-VzzyB_DF.mjs");
const Route$1U = createFileRoute("/rights")({
  loader: ({
    context
  }) => context.queryClient.ensureQueryData(rightsQuery),
  head: () => ({
    meta: [{
      title: "حقوق الاكتتاب الشرعية — EGX سكانر"
    }, {
      name: "description",
      content: "ترشيحات حقوق الاكتتاب المتداولة في البورصة المصرية مع فلتر شرعي."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$j, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$7, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$6, "notFoundComponent")
});
const $$splitNotFoundComponentImporter$5 = () => import("./scalp-DEZbpQij.mjs");
const $$splitErrorComponentImporter$6 = () => import("./scalp-B5jRpu9v.mjs");
const $$splitComponentImporter$i = () => import("./scalp-Crzv1KHf.mjs");
const Route$1T = createFileRoute("/scalp")({
  component: lazyRouteComponent($$splitComponentImporter$i, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$6, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$5, "notFoundComponent"),
  head: () => ({
    meta: [{
      title: "Scalp — إشارات لحظية"
    }, {
      name: "description",
      content: "صفحة Scalp مخصصة بإشعارات لحظية فورية."
    }]
  })
});
const $$splitNotFoundComponentImporter$4 = () => import("./scalp-dip-DEZbpQij.mjs");
const $$splitErrorComponentImporter$5 = () => import("./scalp-dip-B5jRpu9v.mjs");
const $$splitComponentImporter$h = () => import("./scalp-dip-D2zgXXln.mjs");
const Route$1S = createFileRoute("/scalp-dip")({
  component: lazyRouteComponent($$splitComponentImporter$h, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$5, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$4, "notFoundComponent"),
  head: () => ({
    meta: [{
      title: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)"
    }, {
      name: "description",
      content: "لوحة التحكم الأسبوعية: ترشيحات الأحد مع عداد التنفيذ 15 دقيقة، تتبع حي للصفقات طوال الأسبوع، إشعارات طوارئ صوتية وبصرية، وتقويم EGX الصريح."
    }]
  })
});
const $$splitComponentImporter$g = () => import("./scalp-feasibility-D_400yUS.mjs");
const Route$1R = createFileRoute("/scalp-feasibility")({
  head: () => ({
    meta: [{
      title: "تقرير جدوى إشارات Scalp"
    }, {
      name: "description",
      content: "إثبات مؤكد بأرقام حقيقية لكل إشارة scalp: هل كان ممكن الشراء والبيع بمكسب."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$g, "component")
});
const $$splitNotFoundComponentImporter$3 = () => import("./scalp-fresh-DEZbpQij.mjs");
const $$splitErrorComponentImporter$4 = () => import("./scalp-fresh-B5jRpu9v.mjs");
const $$splitComponentImporter$f = () => import("./scalp-fresh-ioMi9Y75.mjs");
const Route$1Q = createFileRoute("/scalp-fresh")({
  component: lazyRouteComponent($$splitComponentImporter$f, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$4, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$3, "notFoundComponent"),
  head: () => ({
    meta: [{
      title: "Scalp Fresh — تجربة سعر لحظي"
    }, {
      name: "description",
      content: "نسخة تجريبية من Scalp تستخدم سعر لحظي للدخول."
    }]
  })
});
const $$splitComponentImporter$e = () => import("./session-log-DbEUxQPm.mjs");
const Route$1P = createFileRoute("/session-log")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "Session Log — سجل الجلسة"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./shadow-report-DAaM4ABR.mjs");
const Route$1O = createFileRoute("/shadow-report")({
  head: () => ({
    meta: [{
      title: "Shadow Report — تقييم قرارات Smart Exit"
    }, {
      name: "description",
      content: "مقارنة كل قرار Smart Exit بحركة السعر الفعلية بعده"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./signal-quality-BjzKGKd9.mjs");
const $$splitNotFoundComponentImporter$2 = () => import("./signal-quality-B7b39wSL.mjs");
const $$splitErrorComponentImporter$3 = () => import("./signal-quality-ZRybJVsD.mjs");
const Route$1N = createFileRoute("/signal-quality")({
  head: () => ({
    meta: [{
      title: "Signal Quality — جودة الإشارات"
    }, {
      name: "description",
      content: "تقييم جودة كل إشارة scalp-dip بناءً على النشاط اللحظي وعمق الهبوط."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$3, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$2, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./slippage-report-D8cFy6kG.mjs");
const $$splitNotFoundComponentImporter$1 = () => import("./slippage-report-B7b39wSL.mjs");
const $$splitErrorComponentImporter$2 = () => import("./slippage-report-ZRybJVsD.mjs");
const Route$1M = createFileRoute("/slippage-report")({
  head: () => ({
    meta: [{
      title: "Slippage Report — المتوقع مقابل الفعلي"
    }, {
      name: "description",
      content: "فرق السعر والزمن بين إشارة الاستراتيجية والتنفيذ الفعلي في ثاندر."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$2, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter$1, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./sniper-DijMJupA.mjs");
const Route$1L = createFileRoute("/sniper")({
  head: () => ({
    meta: [{
      title: "Sniper — صفقة اليوم"
    }, {
      name: "description",
      content: "سهم واحد كل يوم بدقة عالية — تأكيد ORB من 3 مصادر real-time"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./throttle-test-Coo6DXlm.mjs");
const Route$1K = createFileRoute("/throttle-test")({
  component: lazyRouteComponent($$splitComponentImporter$9, "component"),
  head: () => ({
    meta: [{
      title: "اختبار Throttling — Meky"
    }]
  })
});
const $$splitComponentImporter$8 = () => import("./thunder-B593DhzT.mjs");
const Route$1J = createFileRoute("/thunder")({
  component: lazyRouteComponent($$splitComponentImporter$8, "component"),
  head: () => ({
    meta: [{
      title: "Thunder X Extension — Live Market Data"
    }, {
      name: "description",
      content: "تحميل إضافة Thunder X لجمع بيانات السوق الحية والفوليوم وBid/Ask من ردود ثاندر الحقيقية."
    }, {
      property: "og:title",
      content: "Thunder X Extension — Live Market Data"
    }, {
      property: "og:description",
      content: "تحميل إضافة Thunder X لجمع بيانات السوق الحية والفوليوم وBid/Ask من ردود ثاندر الحقيقية."
    }, {
      property: "og:type",
      content: "website"
    }, {
      name: "twitter:card",
      content: "summary"
    }]
  })
});
const $$splitComponentImporter$7 = () => import("./thunder-live-VNcFHd_P.mjs");
const Route$1I = createFileRoute("/thunder-live")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component"),
  head: () => ({
    meta: [{
      title: "Thunder Live — مراقبة البيانات اللحظية"
    }, {
      name: "description",
      content: "تأكد من أن بيانات Thunder Extension لحظية وحقيقية."
    }]
  })
});
const $$splitComponentImporter$6 = () => import("./thunder-tabs-P3GKJb2k.mjs");
const Route$1H = createFileRoute("/thunder-tabs")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component"),
  head: () => ({
    meta: [{
      title: "Thunder Tabs — تشخيص L2 حي"
    }]
  })
});
const $$splitComponentImporter$5 = () => import("./tiers-Cgg9QyBE.mjs");
const Route$1G = createFileRoute("/tiers")({
  head: () => ({
    meta: [{
      title: "طبقات الذكاء — لوحة التحكم"
    }, {
      name: "description",
      content: "عرض مساهمة كل طبقة ذكاء (Tier) في قرارات التوصية."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./today-CJX-Xl3p.mjs");
const Route$1F = createFileRoute("/today")({
  head: () => ({
    meta: [{
      title: "صفقة النهارده — النظام الذكي"
    }, {
      name: "description",
      content: "سهم واحد كل يوم بثقة عالية + Kelly sizing + حماية تلقائية"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./tomorrow-DE0fACIQ.mjs");
const Route$1E = createFileRoute("/tomorrow")({
  head: () => ({
    meta: [{
      title: "توقعات الغد — الأسهم المتوقع صعودها"
    }, {
      name: "description",
      content: "أفضل الأسهم المتوقع ارتفاعها في جلسة الغد بناءً على تحليل النموذج وثقة عالية."
    }, {
      property: "og:title",
      content: "توقعات الغد — EGX سكانر"
    }, {
      property: "og:description",
      content: "اختيارات النخبة فقط: شراء بثقة ≥70% وتوقع صعود إيجابي للجلسة التالية."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./track-record-F7d6e2-F.mjs");
const Route$1D = createFileRoute("/track-record")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./trade-lifecycle-D7x6itcY.mjs");
const $$splitNotFoundComponentImporter = () => import("./trade-lifecycle-B7b39wSL.mjs");
const $$splitErrorComponentImporter$1 = () => import("./trade-lifecycle-ZRybJVsD.mjs");
const Route$1C = createFileRoute("/trade-lifecycle")({
  head: () => ({
    meta: [{
      title: "Trade Lifecycle — سجل الصفقات"
    }, {
      name: "description",
      content: "تايم-لاين لحظي لكل حدث في كل صفقة: من الإشارة لحد الإقفال."
    }]
  }),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter$1, "errorComponent"),
  notFoundComponent: lazyRouteComponent($$splitNotFoundComponentImporter, "notFoundComponent"),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitErrorComponentImporter = () => import("./stock._symbol-BTl4x7wK.mjs");
const $$splitComponentImporter = () => import("./stock._symbol-CSJ54Zir.mjs");
const Route$1B = createFileRoute("/stock/$symbol")({
  component: lazyRouteComponent($$splitComponentImporter, "component"),
  errorComponent: lazyRouteComponent($$splitErrorComponentImporter, "errorComponent"),
  head: ({
    params
  }) => ({
    meta: [{
      title: `${params.symbol} — تحليل فني | EGX سكانر`
    }, {
      name: "description",
      content: `التحليل الفني الكامل والتوصية الذكية لسهم ${params.symbol} في البورصة المصرية.`
    }]
  })
});
const Route$1A = createFileRoute("/api/public/hooks/aggregate-intraday-candles")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let targetDate = null;
        try {
          const body = await request.json().catch(() => ({}));
          targetDate = body?.date ?? null;
        } catch {
        }
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const yyyy = cairoNow2.getFullYear();
        const mm = String(cairoNow2.getMonth() + 1).padStart(2, "0");
        const dd = String(cairoNow2.getDate()).padStart(2, "0");
        const dateStr = targetDate ?? `${yyyy}-${mm}-${dd}`;
        const fromIso = `${dateStr}T06:30:00.000Z`;
        const toIso = `${dateStr}T13:30:00.000Z`;
        const PAGE = 1e3;
        let offset = 0;
        const bars = /* @__PURE__ */ new Map();
        while (true) {
          const { data, error } = await supabaseAdmin$5.from("live_ticks").select("symbol,price,volume,ts").gte("ts", fromIso).lte("ts", toIso).order("ts", { ascending: true }).range(offset, offset + PAGE - 1);
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          if (!data || data.length === 0) break;
          for (const r of data) {
            const t = new Date(r.ts);
            const bucket = new Date(Date.UTC(
              t.getUTCFullYear(),
              t.getUTCMonth(),
              t.getUTCDate(),
              t.getUTCHours(),
              t.getUTCMinutes(),
              0,
              0
            ));
            const key = `${r.symbol}|${bucket.toISOString()}`;
            const price = Number(r.price);
            const vol = r.volume == null ? null : Number(r.volume);
            const tsMs = t.getTime();
            const existing = bars.get(key);
            if (!existing) {
              bars.set(key, {
                symbol: r.symbol,
                bucket_ts: bucket.toISOString(),
                open: price,
                high: price,
                low: price,
                close: price,
                volume: vol,
                tick_count: 1,
                firstTs: tsMs,
                lastTs: tsMs
              });
            } else {
              if (price > existing.high) existing.high = price;
              if (price < existing.low) existing.low = price;
              if (tsMs < existing.firstTs) {
                existing.firstTs = tsMs;
                existing.open = price;
              }
              if (tsMs > existing.lastTs) {
                existing.lastTs = tsMs;
                existing.close = price;
              }
              if (vol != null) existing.volume = vol;
              existing.tick_count++;
            }
          }
          if (data.length < PAGE) break;
          offset += PAGE;
        }
        if (bars.size === 0) {
          return Response.json({ ok: true, date: dateStr, bars: 0, note: "no_ticks" });
        }
        const rows = Array.from(bars.values()).map((b) => ({
          symbol: b.symbol,
          trade_date: dateStr,
          bucket_ts: b.bucket_ts,
          interval_min: 1,
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
          volume: b.volume,
          tick_count: b.tick_count
        }));
        let inserted = 0;
        for (let i = 0; i < rows.length; i += 500) {
          const chunk = rows.slice(i, i + 500);
          const { error } = await supabaseAdmin$5.from("intraday_candles").upsert(chunk, { onConflict: "symbol,bucket_ts,interval_min" });
          if (error) return Response.json({ ok: false, error: error.message, inserted }, { status: 500 });
          inserted += chunk.length;
        }
        return Response.json({
          ok: true,
          date: dateStr,
          bars: rows.length,
          symbols: new Set(rows.map((r) => r.symbol)).size
        });
      }
    }
  }
});
const ROOT$1 = process.cwd();
const FEED = path__default__default.join(ROOT$1, "supervisor_feed.jsonl");
const STATE = path__default__default.join(ROOT$1, "supervisor_state.json");
function readFeed() {
  try {
    const raw = fs__default__default.readFileSync(FEED, "utf8").trim().split("\n").filter(Boolean);
    return raw.slice(-50).reverse().map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch {
    return [];
  }
}
function readState() {
  try {
    return JSON.parse(fs__default__default.readFileSync(STATE, "utf8"));
  } catch {
    return null;
  }
}
const Route$1z = createFileRoute("/api/public/hooks/ai-supervisor-feed")({
  server: {
    handlers: {
      GET: async () => {
        const entries = readFeed();
        const state = readState();
        let alive = "unknown";
        let level = state?.level ?? null;
        if (state?.time) {
          const ageMin = (Date.now() - new Date(state.time).getTime()) / 6e4;
          alive = ageMin < 35 ? "yes" : "stale";
        }
        return Response.json({ entries, alive, level, time: state?.time ?? null });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const text = (body?.text || "").trim().slice(0, 500);
          if (!text) return Response.json({ ok: false, error: "empty" }, { status: 400 });
          const entry = { time: (/* @__PURE__ */ new Date()).toISOString(), kind: "user", text };
          fs__default__default.appendFileSync(FEED, JSON.stringify(entry) + "\n");
          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ ok: false, error: e.message }, { status: 500 });
        }
      }
    }
  }
});
const ROOT = process.cwd();
const Route$1y = createFileRoute("/api/public/hooks/ai-supervisor-identity")({
  server: {
    handlers: {
      GET: async () => {
        const manifestPath = path__default__default.join(ROOT, "supervisor_identity.json");
        let manifest = {};
        try {
          manifest = JSON.parse(fs__default__default.readFileSync(manifestPath, "utf8"));
        } catch {
          manifest = { note: "manifest not written yet" };
        }
        return Response.json({
          ok: true,
          supervisor_identity: {
            implemented_via: "AutoClaw heartbeat (agentTurn) — same program & credentials as this chat",
            model_provider: "AutoClaw default model (GLM — same as the user's chat)",
            isolation: "dedicated isolated session per heartbeat (full transcript per wake)",
            schedule: "*/20 9-15 * * 0-4 (Africa/Cairo)",
            ...manifest
          },
          explanation_ar: "المشرف شغال داخل نفس برنامج AutoClaw اللي انت بتكلم منه — نفس الموديل ونفس الكريدتس. كل صحوة بتفتح جلسة مستقلة موثقة، وانت تقدر تشوف جلساته في AutoClaw (sessions list)."
        });
      }
    }
  }
});
const supabaseAdmin$4 = supabaseAdmin$5;
const ARCHIVE_DIR = path__default__default.join(process.cwd(), "egx-archive");
function listArchivedDates() {
  const out = [];
  if (!fs__default__default.existsSync(ARCHIVE_DIR)) return out;
  const walk = (dir) => {
    for (const f of fs__default__default.readdirSync(dir)) {
      const p = path__default__default.join(dir, f);
      if (fs__default__default.statSync(p).isDirectory()) walk(p);
      else {
        const m = f.match(/^EGX_DAILY_(\d{4}-\d{2}-\d{2})\.csv$/);
        if (m) out.push(m[1]);
      }
    }
  };
  walk(ARCHIVE_DIR);
  return out.sort();
}
async function catchupArchive() {
  fs__default__default.mkdirSync(ARCHIVE_DIR, { recursive: true });
  const local = listArchivedDates();
  const lastLocal = local.length ? local[local.length - 1] : null;
  const { data: dateRows } = await supabaseAdmin$4.from("daily_candles").select("date").order("date", { ascending: false }).limit(400);
  const allDates2 = [...new Set((dateRows ?? []).map((r) => String(r.date)))].sort();
  const missing = allDates2.filter((d) => (!lastLocal || d > lastLocal) && d <= (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const writtenDates = [];
  for (const d of missing) {
    const { data: rows } = await supabaseAdmin$4.from("daily_candles").select("symbol, date, open, high, low, close, volume").eq("date", d);
    if (!rows?.length) continue;
    const yyyy = d.slice(0, 4), mm = d.slice(5, 7);
    const dir = path__default__default.join(ARCHIVE_DIR, yyyy, mm);
    fs__default__default.mkdirSync(dir, { recursive: true });
    const csv = "symbol,date,open,high,low,close,volume\n" + rows.map((r) => `${r.symbol},${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume}`).join("\n") + "\n";
    fs__default__default.writeFileSync(path__default__default.join(dir, `EGX_DAILY_${d}.csv`), csv, "utf8");
    writtenDates.push(d);
  }
  return { written: writtenDates.length, dates: writtenDates, lastLocal: lastLocal ?? "none" };
}
function openFolder() {
  return new Promise((resolve) => {
    exec(`explorer.exe "${ARCHIVE_DIR}"`, () => resolve());
    setTimeout(resolve, 800);
  });
}
async function handleGet$1(url) {
  const action = url.searchParams.get("action") ?? "open";
  try {
    if (action === "catchup") {
      const r2 = await catchupArchive();
      return Response.json({ ok: true, ...r2 });
    }
    const r = await catchupArchive();
    await openFolder();
    return Response.json({ ok: true, folder: ARCHIVE_DIR, catchup: r });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message ?? "archive action failed" }, { status: 500 });
  }
}
const Route$1x = createFileRoute("/api/public/hooks/archive-folder")({
  server: {
    handlers: {
      GET: ({ request }) => handleGet$1(new URL(request.url)),
      POST: ({ request }) => handleGet$1(new URL(request.url))
    }
  }
});
const DATA_TABLES = {
  live_ticks: { timestampCol: "ts", priceCol: "price", volumeCol: "volume" },
  marketwatch_snapshots: {
    timestampCol: "captured_at",
    priceCol: "last_price",
    volumeCol: "total_volume",
    bidCol: "highest_bid",
    askCol: "lowest_ask"
  },
  orderbook_snapshots: {
    timestampCol: "ts",
    bidCol: "best_bid",
    askCol: "best_ask"
  },
  live_quotes: { timestampCol: "ts", bidCol: "bid", askCol: "ask" },
  smart_exit_log: { timestampCol: "ts", priceCol: "price" },
  thunder_auth_events: { timestampCol: "ts" },
  mubasher_news: { timestampCol: "published_at" }
};
const DATA_TABLE_NAMES = Object.keys(DATA_TABLES);
const ARCHIVE_ROOT = process.env.HISTORY_ARCHIVE_ROOT ?? "D:\\1All Data";
const QUALITY_README = [
  "DATA-QUALITY COMPANION FILE — READ ME FIRST",
  "===========================================",
  "This export includes a data-quality companion (quality CSV). A row is",
  "FULL_SESSION_RELIABLE=true only if the symbol has data from near market",
  "open (10:00 Cairo) to near close (14:30 Cairo) with no gaps over 15",
  "minutes during continuous trading (10:00-14:15; the 14:15-14:30 closing",
  "auction silence is normal and excluded).",
  "",
  "Columns: date, table, symbol, first_tick, last_tick (Cairo local time),",
  "open_reliable, close_reliable, full_session_reliable, likely_reason.",
  "",
  "likely_reason values (only set when NOT full-session reliable):",
  "- possible_illiquidity    : the symbol stayed visible in full-market",
  "                            snapshots to end-of-day but had no trades —",
  "                            REAL thin trading, data collection was fine.",
  "- possible_collection_gap: the symbol was missing from full-market",
  "                            snapshots too, or no evidence was available —",
  "                            we may have lost data for it that day.",
  "- late_extension_start    : the whole day started late (browser opened",
  "                            after 10:10 Cairo) — not the symbol's fault.",
  "",
  "Do not use non-reliable symbol-days for precise profit/loss backtesting",
  "without accounting for this."
].join("\n");
async function isLocalRuntime() {
  try {
    if (String("production").toLowerCase() === "production") {
      return false;
    }
    const m = await fs$1();
    return m.existsSync(ARCHIVE_ROOT);
  } catch {
    return false;
  }
}
function expandTables$2(tables) {
  const set = /* @__PURE__ */ new Set();
  for (const t of tables) {
    const name = String(t || "").trim();
    if (name === "" || name === "all") {
      for (const a of DATA_TABLE_NAMES) set.add(a);
      continue;
    }
    if (DATA_TABLE_NAMES.includes(name)) set.add(name);
  }
  return DATA_TABLE_NAMES.filter((t) => set.has(t));
}
let _fsP$1 = null;
async function fs$1() {
  if (!_fsP$1) {
    _fsP$1 = Promise.resolve().then(() => import("node:fs")).catch(() => import("fs"));
  }
  return _fsP$1;
}
let _pathP$1 = null;
async function pth$1() {
  if (!_pathP$1) _pathP$1 = Promise.resolve().then(() => import("node:path"));
  return _pathP$1;
}
let _zlibP$1 = null;
async function zlib$1() {
  if (!_zlibP$1) {
    _zlibP$1 = Promise.resolve().then(() => import("node:zlib")).catch(() => import("zlib"));
  }
  return _zlibP$1;
}
function csvCell(val) {
  if (val === null || val === void 0) return "";
  if (typeof val === "object") {
    return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
function parseCsvLine$1(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}
function unionColumns(rows) {
  const seen = /* @__PURE__ */ new Set();
  const cols = [];
  for (const r of rows) {
    for (const k of Object.keys(r)) {
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
    }
  }
  return cols;
}
function rowTs(row, tsCol) {
  const raw = row[tsCol] ?? row["created_at"] ?? row["captured_at"] ?? "";
  if (!raw) return 0;
  try {
    const n = new Date(String(raw)).getTime();
    return Number.isFinite(n) ? n : 0;
  } catch {
    return 0;
  }
}
function toUnifiedRow(table, row) {
  const symbol = row["symbol"] || "";
  if (!symbol) return null;
  const cfg = DATA_TABLES[table];
  if (!cfg) return null;
  const tsCol = cfg.timestampCol;
  const ts = rowTs(row, tsCol);
  if (ts === 0) return null;
  const date = new Date(ts);
  const dateStr = date.toISOString().slice(0, 10);
  const timeStr = date.toTimeString().slice(0, 8);
  const price = cfg.priceCol && row[cfg.priceCol] != null ? row[cfg.priceCol] : "";
  const volume = cfg.volumeCol && row[cfg.volumeCol] != null ? row[cfg.volumeCol] : "";
  const bid = cfg.bidCol && row[cfg.bidCol] != null ? row[cfg.bidCol] : "";
  const ask = cfg.askCol && row[cfg.askCol] != null ? row[cfg.askCol] : "";
  return {
    symbol,
    date: dateStr,
    time: timeStr,
    data_type: table,
    price,
    volume,
    bid,
    ask
  };
}
function isoAddDays$2(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
async function readLocalRows(table, date) {
  const p = await pth$1();
  const m = await fs$1();
  const csvFp = p.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = p.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);
  let content;
  if (m.existsSync(csvFp)) {
    content = m.readFileSync(csvFp, "utf-8");
  } else if (m.existsSync(gzFp)) {
    const z2 = await zlib$1();
    const gzBuffer = m.readFileSync(gzFp);
    const decompressed = z2.gunzipSync(gzBuffer);
    content = decompressed.toString("utf-8");
  } else {
    return [];
  }
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine$1(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine$1(lines[i]);
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h] = idx < cells.length ? cells[idx] : "";
    });
    rows.push(obj);
  }
  return rows;
}
async function cacheLocalRows(table, date, rows) {
  const p = await pth$1();
  const m = await fs$1();
  const dir = p.join(ARCHIVE_ROOT, table);
  if (!m.existsSync(dir)) m.mkdirSync(dir, { recursive: true });
  const fp = p.join(dir, `${date}.csv`);
  if (m.existsSync(fp)) return false;
  const columns = unionColumns(rows);
  const csv = [columns.join(","), ...rows.map((r) => columns.map((c) => csvCell(r[c] ?? "")).join(","))].join(
    "\n"
  ) + "\n";
  m.writeFileSync(fp, csv, "utf-8");
  return true;
}
async function defaultSupabaseFetcher(params) {
  const supabaseAdmin2 = (await import("./client.server-D5ro3rAQ.mjs")).supabaseAdmin;
  const all = [];
  const PAGE = 1e3;
  let from = 0;
  const chain = supabaseAdmin2.from(params.table);
  for (; ; ) {
    const { data, error } = await chain.select("*").gte(params.tsCol, params.fromIso).lt(params.tsCol, params.toIso).order(params.tsCol, { ascending: true }).range(from, from + PAGE - 1);
    if (error) throw new Error(`${params.table} ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += data.length;
  }
  return all;
}
const TABLE_TIMEOUT_MS = 6e4;
async function runExport(input, fetchCb) {
  const isLocal = await isLocalRuntime();
  if (!isLocal) {
    return { ok: false, local: false, reason: "PROD" };
  }
  const tables = expandTables$2(input.tables);
  if (tables.length === 0) {
    return { ok: false, local: true, reason: "NO_TABLE" };
  }
  if (String(input.start) > String(input.end)) {
    return { ok: false, local: true, reason: "INVALID_RANGE" };
  }
  const dates = [];
  let cur = input.start;
  while (cur <= input.end) {
    dates.push(cur);
    cur = isoAddDays$2(cur, 1);
  }
  const fetch2 = defaultSupabaseFetcher;
  const tableResults = [];
  const allGaps = [];
  const errors = [];
  const unified = input.mode === "unified";
  let unifiedCsv;
  let unifiedTempPaths = [];
  let unifiedRowCount = 0;
  for (const table of tables) {
    const tableStartMs = Date.now();
    const tsCol = DATA_TABLES[table]?.timestampCol ?? "created_at";
    const merged = [];
    const breakdown = [];
    let tableError;
    try {
      for (const date of dates) {
        if (Date.now() - tableStartMs > TABLE_TIMEOUT_MS) {
          tableError = `${table} partially exported — remaining dates skipped (timeout after ${Math.round(
            (Date.now() - tableStartMs) / 1e3
          )}s; collected ${merged.length} rows across ${breakdown.length} date(s) were kept)`;
          breakdown.push({ date, source: "gap", rows: 0, skipped: true });
          for (const rest of dates.slice(dates.indexOf(date) + 1)) {
            breakdown.push({ date: rest, source: "gap", rows: 0, skipped: true });
          }
          allGaps.push({ table, date: `${input.start}..${input.end} @ deadline` });
          break;
        }
        const fromIso = `${date}T00:00:00.000Z`;
        const toIso = `${isoAddDays$2(date, 1)}T00:00:00.000Z`;
        let local = [];
        try {
          local = await readLocalRows(table, date);
        } catch {
          local = [];
        }
        if (local.length === 0) {
          let remote = [];
          try {
            remote = await fetch2({ table, tsCol, fromIso, toIso });
          } catch {
            remote = [];
          }
          if (remote.length === 0) {
            allGaps.push({ table, date });
            breakdown.push({ date, source: "gap", rows: 0 });
            continue;
          }
          const cached2 = await cacheLocalRows(table, date, remote);
          appendAll(merged, remote);
          breakdown.push({ date, source: "cache", cached: cached2, rows: remote.length });
        } else {
          appendAll(merged, local);
          breakdown.push({ date, source: "local", rows: local.length });
        }
        if (unified) {
          const m = await fs$1();
          const first = unifiedTempPaths.length === 0;
          const tmpPath = await pJoin(
            await pTempDir(),
            `unified_${table}_${Date.now()}_${Math.random().toString(36).slice(2)}.rows`
          );
          const fh = m.openSync(tmpPath, "a");
          try {
            for (const row of merged) {
              const uRow = toUnifiedRow(table, row);
              if (uRow === null) continue;
              m.writeSync(fh, unifiedRowToSortableCsv(uRow) + "\n");
              unifiedRowCount++;
            }
          } finally {
            m.closeSync(fh);
          }
          if (merged.length > 0) unifiedTempPaths.push(tmpPath);
          else {
            try {
              m.unlinkSync(tmpPath);
            } catch {
            }
          }
          merged.length = 0;
        }
      }
    } catch (e) {
      tableError = String(e?.message || e).slice(0, 200);
      if (String(tableError).includes("call stack")) {
        tableError = `${table}: internal error building data (too many rows) — try a smaller date range`;
      }
    }
    if (tableError) {
      errors.push({ table, error: tableError });
    }
    {
      const rowed = breakdown.filter((b) => b.rows > 0 && !b.skipped);
      if (rowed.length >= 2) {
        const sorted = rowed.map((b) => b.rows).sort((a, b) => a - b);
        const medianRows = sorted[Math.floor(sorted.length / 2)];
        for (const b of rowed) {
          if (b.source !== "gap" && b.skipped !== true && medianRows > 0) {
            const pct2 = b.rows / medianRows * 100;
            if (pct2 < 5) {
              b.source = "partial";
              b.medianRows = medianRows;
              b.pctOfMedian = Math.round(pct2 * 10) / 10;
            }
          }
        }
      }
    }
    if (unified) {
      if (merged.length > 0) {
        const m = await fs$1();
        const tmpPath = await pJoin(
          await pTempDir(),
          `unified_${table}_${Date.now()}_${Math.random().toString(36).slice(2)}.rows`
        );
        const fh = m.openSync(tmpPath, "a");
        try {
          for (const row of merged) {
            const uRow = toUnifiedRow(table, row);
            if (uRow === null) continue;
            m.writeSync(fh, unifiedRowToSortableCsv(uRow) + "\n");
            unifiedRowCount++;
          }
          unifiedTempPaths.push(tmpPath);
        } finally {
          m.closeSync(fh);
        }
        merged.length = 0;
      }
      tableResults.push({
        table,
        rows: breakdown.reduce((acc, b) => acc + (b.rows ?? 0), 0),
        // this table's own row total
        columns: [],
        csv: "",
        breakdown,
        error: tableError
      });
      continue;
    }
    if (tableError) {
      tableResults.push({
        table,
        rows: merged.length,
        columns: unionColumns(merged),
        csv: "",
        breakdown,
        error: tableError
      });
      continue;
    }
    merged.sort((a, b) => rowTs(a, tsCol) - rowTs(b, tsCol));
    const columns = unionColumns(merged);
    const csv = (columns.length ? [
      columns.join(","),
      ...merged.map((r) => columns.map((c) => csvCell(r[c] ?? "")).join(","))
    ].join("\n") : "") + "\n";
    tableResults.push({ table, rows: merged.length, columns, csv, breakdown });
  }
  if (unified) {
    const m = await fs$1();
    const header = "symbol,date,time,data_type,price,volume,bid,ask";
    if (unifiedTempPaths.length === 0) {
      unifiedCsv = header + "\n";
    } else {
      const parts = [header];
      const readers = unifiedTempPaths.map((tp) => ({
        fd: m.openSync(tp, "r"),
        rest: "",
        done: false,
        next: null
      }));
      try {
        const BUFSZ = 1 << 20;
        const readLine = (r) => {
          while (true) {
            if (r.done && r.rest === "") return null;
            const nl = r.rest.indexOf("\n");
            if (nl >= 0) {
              const line = r.rest.slice(0, nl);
              r.rest = r.rest.slice(nl + 1);
              return line;
            }
            if (r.done) {
              const line = r.rest;
              r.rest = "";
              return line.length ? line : null;
            }
            const buf = Buffer.allocUnsafe(BUFSZ);
            const n = m.readSync(r.fd, buf, 0, BUFSZ, null);
            if (n === 0) {
              r.done = true;
              continue;
            }
            r.rest += buf.toString("utf8", 0, n);
          }
        };
        for (const r of readers) r.next = readLine(r);
        const stripPrefix = (s) => {
          let i = -1;
          for (let k = 0; k < 3; k++) {
            i = s.indexOf("", i + 1);
            if (i < 0) return s;
          }
          return s.slice(i + 1);
        };
        for (; ; ) {
          let best = -1;
          for (let i = 0; i < readers.length; i++) {
            const cur2 = readers[i].next;
            if (cur2 !== null && (best === -1 || cur2 < readers[best].next)) best = i;
          }
          if (best === -1) break;
          parts.push(stripPrefix(readers[best].next));
          readers[best].next = readLine(readers[best]);
        }
      } finally {
        for (const r of readers) {
          try {
            m.closeSync(r.fd);
          } catch {
          }
        }
        for (const tp of unifiedTempPaths) {
          try {
            m.unlinkSync(tp);
          } catch {
          }
        }
      }
      unifiedCsv = parts.join("\n") + "\n";
    }
  }
  let qualityCsv;
  {
    const p = await pth$1();
    const m = await fs$1();
    const qualityRows = [];
    for (const table of tables) {
      for (const date of dates) {
        const qp = p.join(ARCHIVE_ROOT, table, `${date}.quality.json`);
        if (!m.existsSync(qp)) continue;
        try {
          const q = JSON.parse(m.readFileSync(qp, "utf-8"));
          for (const s of q.symbols ?? []) {
            qualityRows.push(
              [
                date,
                table,
                s.symbol,
                s.firstTickCairo ?? "",
                s.lastTickCairo ?? "",
                s.openReliable,
                s.closeReliable,
                s.fullSessionReliable,
                s.likelyReason ?? ""
              ].join(",")
            );
          }
        } catch {
        }
      }
    }
    if (qualityRows.length > 0) {
      qualityCsv = [
        "date,table,symbol,first_tick,last_tick,open_reliable,close_reliable,full_session_reliable,likely_reason",
        ...qualityRows
      ].join("\n") + "\n";
    }
  }
  return {
    ok: true,
    local: true,
    from: input.start,
    to: input.end,
    tables: tableResults,
    gaps: allGaps,
    errors,
    unifiedCsv,
    qualityCsv,
    qualityReadme: QUALITY_README
  };
}
function appendAll(dest, src) {
  for (let i = 0; i < (src?.length ?? 0); i++) dest[dest.length] = src[i];
}
let _osP = null;
async function osmod() {
  if (!_osP) {
    _osP = Promise.resolve().then(() => import("node:os")).catch(() => import("os"));
  }
  return _osP;
}
async function pTempDir() {
  const os = await osmod();
  const p = await pth$1();
  const m = await fs$1();
  const dir = p.join(os.tmpdir(), "mky-unified-export");
  if (!m.existsSync(dir)) m.mkdirSync(dir, { recursive: true });
  else {
    try {
      const cutoff = Date.now() - 60 * 60 * 1e3;
      for (const f of m.readdirSync(dir)) {
        const fp = p.join(dir, f);
        try {
          if (m.statSync(fp).mtimeMs < cutoff) m.unlinkSync(fp);
        } catch {
        }
      }
    } catch {
    }
  }
  return dir;
}
async function pJoin(dir, file) {
  const p = await pth$1();
  return p.join(dir, file);
}
function unifiedRowToSortableCsv(row) {
  const cells = [
    row.symbol ?? "",
    row.date ?? "",
    row.time ?? "",
    row.data_type ?? "",
    row.price ?? "",
    row.volume ?? "",
    row.bid ?? "",
    row.ask ?? ""
  ].map((v) => csvCell(v));
  const csvLine = cells.join(",");
  return `${row.date ?? ""}${row.time ?? ""}${row.symbol ?? ""}${csvLine}`;
}
const TARGET_TABLES = DATA_TABLE_NAMES;
const EXPORT_LOG_PATH = ARCHIVE_ROOT + "/_exports_log.csv";
let _fsP = null;
let _pathP = null;
let _zlibP = null;
async function fs() {
  if (!_fsP) {
    _fsP = Promise.resolve().then(() => import("node:fs")).catch(() => import("fs"));
  }
  return _fsP;
}
async function pth() {
  if (!_pathP) {
    _pathP = Promise.resolve().then(() => import("node:path"));
  }
  return _pathP;
}
async function zlib() {
  if (!_zlibP) {
    _zlibP = Promise.resolve().then(() => import("node:zlib")).catch(() => import("zlib"));
  }
  return _zlibP;
}
function formatCSVValue(val) {
  if (val === null || val === void 0) return "";
  if (typeof val === "object") {
    const json2 = JSON.stringify(val);
    return '"' + json2.replace(/"/g, '""') + '"';
  }
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function parseCSVLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === ",") {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  result.push(cur);
  return result;
}
function loadExistingSignatures(filePath, headerCols, pkCols, fsModule) {
  if (!fsModule.existsSync(filePath)) {
    return { headers: headerCols, keys: /* @__PURE__ */ new Set() };
  }
  const content = fsModule.readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return { headers: headerCols, keys: /* @__PURE__ */ new Set() };
  }
  const existingHeaders = parseCSVLine(lines[0]);
  const pkIndices = pkCols.map((pk) => existingHeaders.indexOf(pk));
  const hasAllPks = pkIndices.every((idx) => idx !== -1);
  const keys = /* @__PURE__ */ new Set();
  for (let i = 1; i < lines.length; i++) {
    const parsed = parseCSVLine(lines[i]);
    if (hasAllPks) {
      const key = pkIndices.map((idx) => parsed[idx] ?? "").join(":::");
      keys.add(key);
    } else {
      keys.add(lines[i]);
    }
  }
  return { headers: existingHeaders, keys };
}
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
async function getDbSize$1() {
  try {
    const { data, error } = await supabaseAdmin$5.rpc("get_db_size");
    if (error) {
      console.log(`  [archive] get_db_size error: ${error.message}`);
      return { pretty: "N/A", bytes: 0 };
    }
    const row = (data ?? [])[0];
    if (!row) {
      return { pretty: "N/A", bytes: 0 };
    }
    return {
      pretty: row.human_size ?? formatBytes(row.total_bytes),
      bytes: row.total_bytes
    };
  } catch (e) {
    console.log(`  [archive] get_db_size exception: ${e}`);
    return { pretty: "N/A", bytes: 0 };
  }
}
function writeGzipCopy(csvPath, csvContent, fsModule, zlibModule) {
  const gzPath = csvPath + ".gz";
  const compressed = zlibModule.gzipSync(Buffer.from(csvContent, "utf-8"));
  fsModule.writeFileSync(gzPath, compressed);
  return gzPath;
}
function appendExportLog(logPath, entries, runTimestamp, dryRun, fsModule) {
  const headers = "run_timestamp,table_name,total_db_rows,older_than_2_days,rows_exported,rows_deleted,dry_run,partitions_affected,ids_log_path\n";
  const rows = entries.map(
    (s) => [
      runTimestamp,
      s.table,
      s.totalInDb,
      s.olderThan2Days,
      s.rowsExported,
      s.rowsDeleted,
      dryRun ? "TRUE" : "FALSE",
      '"' + (s.partitionsAffected ?? []).join(";") + '"',
      '"' + (s.idsLogPath ?? "") + '"'
    ].join(",")
  ).join("\n") + "\n";
  if (!fsModule.existsSync(logPath)) {
    fsModule.writeFileSync(logPath, headers + rows, "utf-8");
  } else {
    fsModule.appendFileSync(logPath, rows, "utf-8");
  }
}
async function runVacuumFull() {
  const vacuumTables = [];
  let overallSuccess = true;
  const { data, error } = await supabaseAdmin$5.rpc("vacuum_full_data_tables");
  if (error) {
    console.log(`  [archive] VACUUM FULL RPC error: ${error.message}`);
    for (const tableName of TARGET_TABLES) {
      vacuumTables.push({ table: tableName, vacuumed: false, message: error.message });
    }
    return { success: false, tables: vacuumTables };
  }
  if (data && Array.isArray(data)) {
    for (const row of data) {
      vacuumTables.push({
        table: row.table_name,
        vacuumed: row.vacuumed,
        message: row.message
      });
      if (!row.vacuumed) overallSuccess = false;
    }
  }
  if (vacuumTables.length === 0) {
    vacuumTables.push({ table: "all", vacuumed: true });
  }
  return { success: overallSuccess, tables: vacuumTables };
}
async function runArchive(opts2) {
  const dryRun = opts2?.dryRun ?? true;
  const olderThanHours = opts2?.olderThanHours ?? 48;
  const onProgress = opts2?.onProgress;
  const startTime = (/* @__PURE__ */ new Date()).toISOString();
  const m = await fs();
  const p = await pth();
  const z2 = await zlib();
  if (!m.existsSync(ARCHIVE_ROOT)) {
    m.mkdirSync(ARCHIVE_ROOT, { recursive: true });
  }
  const cutoffDate = /* @__PURE__ */ new Date();
  cutoffDate.setHours(cutoffDate.getHours() - olderThanHours);
  const cutoffIso = cutoffDate.toISOString();
  const dbSizeBefore = await getDbSize$1();
  onProgress?.({ type: "table_progress", dbSize: dbSizeBefore });
  const tableSummaries = [];
  for (let tableIdx = 0; tableIdx < TARGET_TABLES.length; tableIdx++) {
    const tableName = TARGET_TABLES[tableIdx];
    const dataCfg = DATA_TABLES[tableName] || { timestampCol: "created_at" };
    const cfg = { timestampCol: dataCfg.timestampCol, pkCols: ["id"] };
    onProgress?.({
      type: "table_start",
      table: tableName,
      currentTable: tableIdx + 1,
      totalTables: TARGET_TABLES.length
    });
    const tableDir = p.join(ARCHIVE_ROOT, tableName);
    if (!m.existsSync(tableDir)) {
      m.mkdirSync(tableDir, { recursive: true });
    }
    let tsCol = cfg.timestampCol;
    let { count: totalDbCount, error: countErr } = await supabaseAdmin$5.from(tableName).select("*", { count: "exact", head: true });
    onProgress?.({
      type: "table_progress",
      table: tableName,
      phase: "fetch",
      totalRows: totalDbCount ?? 0
    });
    if (countErr) {
      console.log(`  [archive] Error querying total count for ${tableName}: ${countErr.message}`);
      tableSummaries.push({
        table: tableName,
        totalInDb: -1,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
        errors: countErr.message
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0
      });
      continue;
    }
    if (!totalDbCount || totalDbCount === 0) {
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: []
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0
      });
      continue;
    }
    let { count: oldRowsCount, error: oldErr } = await supabaseAdmin$5.from(tableName).select("*", { count: "exact", head: true }).lt(tsCol, cutoffIso);
    if (oldErr && tsCol !== "created_at") {
      const fallback = await supabaseAdmin$5.from(tableName).select("*", { count: "exact", head: true }).lt("created_at", cutoffIso);
      if (!fallback.error) {
        tsCol = "created_at";
        oldRowsCount = fallback.count;
        oldErr = null;
      }
    }
    onProgress?.({
      type: "table_progress",
      table: tableName,
      phase: "fetch",
      eligibleRows: oldRowsCount ?? 0
    });
    if (oldErr) {
      console.log(`  [archive] Error querying older rows for ${tableName}: ${oldErr.message}`);
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: [],
        errors: oldErr.message
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0
      });
      continue;
    }
    if (!oldRowsCount || oldRowsCount === 0) {
      tableSummaries.push({
        table: tableName,
        totalInDb: totalDbCount ?? 0,
        olderThan2Days: 0,
        rowsExported: 0,
        rowsDeleted: 0,
        partitionsAffected: []
      });
      onProgress?.({
        type: "table_done",
        table: tableName,
        totalRows: totalDbCount ?? 0,
        eligibleRows: 0,
        exportedRows: 0,
        deletedRows: 0
      });
      continue;
    }
    const PAGE_SIZE = 1e3;
    let fetched = 0;
    const allEligibleRows = [];
    while (fetched < oldRowsCount) {
      const { data: pageData, error: pageErr } = await supabaseAdmin$5.from(tableName).select("*").lt(tsCol, cutoffIso).order(tsCol, { ascending: true }).range(fetched, fetched + PAGE_SIZE - 1);
      if (pageErr) {
        console.log(`  [archive] Fetch error at ${fetched} for ${tableName}: ${pageErr.message}`);
        onProgress?.({
          type: "table_progress",
          table: tableName,
          phase: "fetch",
          fetchedRows: fetched,
          error: pageErr.message
        });
        break;
      }
      if (!pageData || pageData.length === 0) break;
      for (let i = 0; i < pageData.length; i++) {
        allEligibleRows[allEligibleRows.length] = pageData[i];
      }
      fetched += pageData.length;
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "fetch",
        fetchedRows: fetched,
        eligibleRows: oldRowsCount ?? 0
      });
    }
    const groupedByDate = /* @__PURE__ */ new Map();
    for (const row of allEligibleRows) {
      const rawDate = row[tsCol] || row["created_at"] || row["captured_at"] || row["timestamp"];
      let dateKey = "unknown_date";
      if (rawDate) {
        try {
          dateKey = new Date(String(rawDate)).toISOString().slice(0, 10);
        } catch {
          dateKey = String(rawDate).slice(0, 10);
        }
      }
      if (!groupedByDate.has(dateKey)) groupedByDate.set(dateKey, []);
      groupedByDate.get(dateKey).push(row);
    }
    let totalExportedForTable = 0;
    const affectedPartitions = [];
    const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pendingTmpFiles = [];
    for (const [dateStr, rows] of groupedByDate.entries()) {
      const partitionFileName = `${dateStr}.csv`;
      const partitionFilePath = p.join(tableDir, partitionFileName);
      affectedPartitions.push(partitionFileName);
      const sampleRow = rows[0];
      const headerCols = Object.keys(sampleRow);
      const sigs = loadExistingSignatures(partitionFilePath, headerCols, cfg.pkCols, m);
      const targetHeaders = sigs.headers.length > 0 ? sigs.headers : headerCols;
      const newLines = [];
      for (const r of rows) {
        const pkIndices = cfg.pkCols.map((pk) => targetHeaders.indexOf(pk));
        const hasAllPks = pkIndices.every((idx) => idx !== -1);
        let rowKey = "";
        if (hasAllPks) rowKey = cfg.pkCols.map((pk) => String(r[pk] ?? "")).join(":::");
        const isDup = hasAllPks ? sigs.keys.has(rowKey) : sigs.keys.has(targetHeaders.map((h) => formatCSVValue(r[h] ?? "")).join(","));
        if (!isDup) {
          newLines.push(targetHeaders.map((h) => formatCSVValue(r[h])).join(","));
          if (hasAllPks) sigs.keys.add(rowKey);
          else
            sigs.keys.add(targetHeaders.map((h) => formatCSVValue(r[h] ?? "")).join(","));
          totalExportedForTable++;
        }
      }
      if (!dryRun && newLines.length > 0) {
        let fullContent;
        if (!m.existsSync(partitionFilePath)) {
          fullContent = targetHeaders.join(",") + "\n" + newLines.join("\n") + "\n";
        } else {
          const existing = m.readFileSync(partitionFilePath, "utf-8");
          const sep = existing.endsWith("\n") ? "" : "\n";
          fullContent = existing + sep + newLines.join("\n") + "\n";
        }
        const tmpPath = `${partitionFilePath}.tmp.${runId}`;
        m.writeFileSync(tmpPath, fullContent, "utf-8");
        pendingTmpFiles.push({ tmpPath, canonicalPath: partitionFilePath, fullContent });
      }
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "export",
        exportedRows: totalExportedForTable,
        fetchedRows: allEligibleRows.length
      });
    }
    let deletedCount = 0;
    if (!dryRun) {
      onProgress?.({ type: "table_progress", table: tableName, phase: "delete", deletedRows: 0 });
      const idsToDelete = allEligibleRows.map((r) => r.id).filter((id) => id !== void 0);
      const m2 = await fs();
      const p2 = await pth();
      const tableDir2 = p2.join(ARCHIVE_ROOT, tableName);
      const existingCsvIds = /* @__PURE__ */ new Set();
      const csvFilesScanned = [];
      for (const partFile of affectedPartitions) {
        const matchingTmp = pendingTmpFiles.find(
          (t) => p2.basename(t.canonicalPath) === partFile
        );
        if (!matchingTmp) {
          const canonical = p2.join(tableDir2, partFile);
          if (m2.existsSync(canonical)) {
            const text2 = m2.readFileSync(canonical, "utf-8");
            const lines2 = text2.split(/\r?\n/);
            if (lines2.length >= 2) {
              const header2 = lines2[0].split(",");
              const idIdx2 = header2.indexOf("id");
              if (idIdx2 >= 0) {
                csvFilesScanned.push(partFile + " (canonical, prior export)");
                for (let li = 1; li < lines2.length; li++) {
                  if (!lines2[li]) continue;
                  const cols = lines2[li].split(",");
                  const id = cols[idIdx2];
                  if (id) existingCsvIds.add(id);
                }
              }
            }
          }
          continue;
        }
        const tmpPath = matchingTmp.tmpPath;
        if (!m2.existsSync(tmpPath)) {
          throw new Error(
            `[archive] SAFETY ABORT: temp CSV missing for ${tableName}: ${tmpPath}. Refusing to delete ${idsToDelete.length} rows without confirmed backup.`
          );
        }
        const text = m2.readFileSync(tmpPath, "utf-8");
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          throw new Error(
            `[archive] SAFETY ABORT: ${tmpPath} is empty (no header). Refusing to delete.`
          );
        }
        const header = lines[0].split(",");
        const idIdx = header.indexOf("id");
        if (idIdx < 0) {
          throw new Error(
            `[archive] SAFETY ABORT: ${tmpPath} has no 'id' column. Refusing to delete.`
          );
        }
        csvFilesScanned.push(partFile + " (tmp)");
        for (let li = 1; li < lines.length; li++) {
          if (!lines[li]) continue;
          const cols = lines[li].split(",");
          const id = cols[idIdx];
          if (id) existingCsvIds.add(id);
        }
      }
      const missingFromBackup = [];
      const sampleSize = Math.min(idsToDelete.length, 20);
      const sampleMissing = [];
      for (const id of idsToDelete) {
        if (!existingCsvIds.has(String(id))) {
          missingFromBackup.push(id);
          if (sampleMissing.length < sampleSize) sampleMissing.push(id);
        }
      }
      if (missingFromBackup.length > 0) {
        throw new Error(
          `[archive] SAFETY ABORT: ${missingFromBackup.length} of ${idsToDelete.length} rows in ${tableName} are NOT in the archive CSVs (scanned: ${csvFilesScanned.join(", ")}). First ${sampleSize} missing ids: ${JSON.stringify(sampleMissing)}. Refusing to delete ANY rows. Temp files preserved at: ${pendingTmpFiles.map((t) => t.tmpPath).join(", ")}.`
        );
      }
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "verify",
        deletedRows: 0,
        exportedRows: totalExportedForTable
      });
      for (const t of pendingTmpFiles) {
        m2.renameSync(t.tmpPath, t.canonicalPath);
        writeGzipCopy(t.canonicalPath, t.fullContent, m2, z2);
      }
      onProgress?.({
        type: "table_progress",
        table: tableName,
        phase: "delete",
        deletedRows: 0,
        exportedRows: totalExportedForTable
      });
      if (idsToDelete.length > 0) {
        const pthMod = await pth();
        const fsMod = await import("node:fs");
        const idsLogPath = pthMod.join(
          ARCHIVE_ROOT,
          `deleted_ids_${tableName}_${startTime.replace(/[:.]/g, "-")}.json`
        );
        try {
          fsMod.writeFileSync(
            idsLogPath,
            JSON.stringify(
              {
                table: tableName,
                startedAt: startTime,
                cutoffIso,
                rowCount: idsToDelete.length,
                ids: idsToDelete
              },
              null,
              2
            ),
            "utf8"
          );
          tableSummaries[tableIdx].idsLogPath = idsLogPath;
          console.log(
            `    [archive] Pre-delete ID log: ${idsLogPath} (${idsToDelete.length} ids)`
          );
        } catch (e) {
          console.error(
            `    [archive] FATAL: failed to write pre-delete ID log: ${e.message}`
          );
          throw new Error(
            `Pre-delete ID log could not be written to ${idsLogPath}: ${e.message}. Aborting delete to prevent unlogged data loss.`
          );
        }
        const DEL_BATCH = 200;
        for (let i = 0; i < idsToDelete.length; i += DEL_BATCH) {
          const batch = idsToDelete.slice(i, i + DEL_BATCH);
          const { error: delErr } = await supabaseAdmin$5.from(tableName).delete().in("id", batch);
          if (delErr)
            console.log(
              `    [archive] Delete batch ${i}-${i + batch.length} error: ${delErr.message}`
            );
          else {
            deletedCount += batch.length;
            onProgress?.({
              type: "table_progress",
              table: tableName,
              phase: "delete",
              deletedRows: deletedCount
            });
          }
        }
      } else {
        const { error: delErr } = await supabaseAdmin$5.from(tableName).delete().lt(tsCol, cutoffIso);
        if (delErr) console.log(`    [archive] Delete by ts error: ${delErr.message}`);
        else {
          deletedCount = allEligibleRows.length;
          onProgress?.({
            type: "table_progress",
            table: tableName,
            phase: "delete",
            deletedRows: deletedCount
          });
        }
      }
    } else {
      deletedCount = oldRowsCount ?? 0;
    }
    tableSummaries.push({
      table: tableName,
      totalInDb: totalDbCount ?? 0,
      olderThan2Days: oldRowsCount ?? 0,
      rowsExported: totalExportedForTable,
      rowsDeleted: deletedCount,
      partitionsAffected: affectedPartitions
    });
    onProgress?.({
      type: "table_done",
      table: tableName,
      totalRows: totalDbCount ?? 0,
      eligibleRows: oldRowsCount ?? 0,
      exportedRows: totalExportedForTable,
      deletedRows: deletedCount
    });
  }
  let vacuumResult = null;
  if (!dryRun) {
    onProgress?.({ type: "table_progress", phase: "vacuum", table: "all", fetchedRows: 0 });
    vacuumResult = await runVacuumFull();
    onProgress?.({
      type: "table_progress",
      phase: "vacuum",
      table: "all",
      fetchedRows: vacuumResult.tables.length,
      deletedRows: vacuumResult.success ? vacuumResult.tables.length : 0
    });
    if (!vacuumResult.success) {
      console.log("  [archive] VACUUM FULL completed with errors - archiving is still successful");
    }
  }
  const dbSizeAfter = await getDbSize$1();
  const spaceFreedBytes = Math.max(0, dbSizeBefore.bytes - dbSizeAfter.bytes);
  const endTime = (/* @__PURE__ */ new Date()).toISOString();
  appendExportLog(EXPORT_LOG_PATH, tableSummaries, startTime, dryRun, m);
  const summary = {
    success: true,
    startTime,
    endTime,
    cutoffDate: cutoffIso,
    dbSizeBefore,
    dbSizeAfter,
    spaceFreedBytes,
    tables: tableSummaries,
    archiveDir: ARCHIVE_ROOT,
    vacuumSuccess: vacuumResult?.success ?? true,
    vacuumTables: vacuumResult?.tables
  };
  onProgress?.({ type: "all_done", summary });
  return summary;
}
async function runFullArchive(opts2) {
  const cutoffDays = opts2?.cutoffDays ?? 2;
  const dryRun = opts2?.dryRun ?? true;
  const startTime = (/* @__PURE__ */ new Date()).toISOString();
  const cutoffDate = new Date(Date.now() - cutoffDays * 86400 * 1e3);
  const cutoffIso = cutoffDate.toISOString();
  opts2?.onProgress?.({
    type: "phase",
    phase: "archiving",
    message: `Full archive: rows older than ${cutoffIso}...`
  });
  const archiveResult = await runArchive({
    dryRun,
    olderThanHours: cutoffDays * 24,
    onProgress: opts2?.onProgress
  });
  opts2?.onProgress?.({
    type: "phase",
    phase: "vacuum",
    message: "Running VACUUM FULL to reclaim disk space..."
  });
  let vacuumResult = {
    success: true,
    tables: []
  };
  const vacTables = ["marketwatch_snapshots", "live_ticks", "orderbook_snapshots", "live_quotes", "smart_exit_log", "thunder_auth_events"];
  for (const tbl of vacTables) {
    try {
      await runVacuumFull();
      vacuumResult.tables.push({ table: tbl, vacuumed: true });
    } catch (e) {
      const msg = String(e?.message || e).slice(0, 200);
      vacuumResult.tables.push({ table: tbl, vacuumed: false, message: msg });
      vacuumResult.success = false;
    }
  }
  const dbSizeAfter = await getDbSize$1();
  const spaceFreedBytes = Math.max(0, archiveResult.dbSizeBefore.bytes - dbSizeAfter.bytes);
  const endTime = (/* @__PURE__ */ new Date()).toISOString();
  const fullSummary = {
    success: true,
    startTime,
    endTime,
    cutoffDate: cutoffIso,
    dbSizeBefore: archiveResult.dbSizeBefore,
    dbSizeAfter,
    spaceFreedBytes,
    tables: archiveResult.tables,
    archiveDir: ARCHIVE_ROOT,
    vacuumSuccess: vacuumResult.success,
    vacuumTables: vacuumResult.tables
  };
  opts2?.onProgress?.({ type: "all_done", summary: fullSummary });
  return fullSummary;
}
function json$m(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function encodeSSE$1(obj) {
  const line = `data: ${JSON.stringify(obj)}

`;
  return new TextEncoder().encode(line);
}
const Route$1w = createFileRoute("/api/public/hooks/archive-trigger")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json$m({ ok: false, local: false, reason: "PROD" }, 200);
        }
        return json$m({ ok: true, local: true, reason: "ready", endpoint: "POST" }, 200);
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) {
          return json$m({ ok: false, local: false, reason: "PROD" }, 200);
        }
        const url = new URL(request.url);
        const dryRun = url.searchParams.get("dry_run") === "true";
        const olderThanHours = parseInt(url.searchParams.get("older_than_hours") ?? "48", 10) || 48;
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        void writer.write(encodeSSE$1({ type: "connected", dryRun, olderThanHours }));
        void runArchive({
          dryRun,
          olderThanHours,
          onProgress: (event) => {
            void writer.write(encodeSSE$1(event));
          }
        }).then((summary) => {
          void writer.write(encodeSSE$1({ type: "all_done", summary }));
          void writer.close();
        }).catch((err) => {
          const msg = String(err?.message || err);
          console.error("[archive-trigger] runArchive threw:", msg);
          void writer.write(
            encodeSSE$1({ type: "error", error: msg.slice(0, 500) })
          );
          void writer.close();
        });
        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive"
          }
        });
      }
    }
  }
});
const Route$1v = createFileRoute("/api/public/hooks/auto-backtest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const days = Math.max(7, Math.min(1825, Number(body?.days) || 90));
        const requireNews = body?.requireNews === true;
        const chunkSize = Math.max(1, Math.min(20, Number(body?.chunkSize) || 5));
        const parallelism = Math.max(1, Math.min(6, Number(body?.parallelism) || 3));
        const fromDate = new Date(Date.now() - days * 2 * 864e5).toISOString().slice(0, 10);
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const endpoint = `${base}/api/public/hooks/run-backtest`;
        const post = (payload) => fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).then((r) => r.json());
        const init = await post({ init: true, fromDateFilter: fromDate, requireNews });
        const backtestId = init?.backtestId;
        const symbols = init?.symbols ?? [];
        if (!backtestId || symbols.length === 0) {
          return Response.json({ ok: false, stage: "init", init }, { status: 500 });
        }
        const chunks = [];
        for (let i = 0; i < symbols.length; i += chunkSize) chunks.push(symbols.slice(i, i + chunkSize));
        const chunkResults = [];
        for (let i = 0; i < chunks.length; i += parallelism) {
          const batch = chunks.slice(i, i + parallelism).map(
            (syms) => post({ backtestId, fromDateFilter: fromDate, requireNews, symbols: syms }).catch((e) => ({ error: String(e) }))
          );
          const out = await Promise.all(batch);
          chunkResults.push(...out);
        }
        const finalize = await post({ backtestId, finalize: true });
        return Response.json({
          ok: true,
          backtestId,
          fromDate,
          requireNews,
          symbols: symbols.length,
          chunks: chunks.length,
          regimesCached: init?.regimesCached ?? 0,
          metrics: finalize?.metrics
        });
      }
    }
  }
});
const runWalkForward = createServerFn({
  method: "POST"
}).inputValidator((d) => ({
  days: Math.max(30, Math.min(400, d.days ?? 365)),
  minConfidence: Math.max(40, Math.min(90, d.minConfidence ?? 85)),
  picksPerDay: Math.max(1, Math.min(10, d.picksPerDay ?? 3))
})).handler(createSsrRpc("9fb8cba718bf5bd4f0650819469fb791a5b2371b5d98e0343de9729561f4cc68"));
createServerFn({
  method: "GET"
}).handler(createSsrRpc("2a666e4d016edb96e7911f84a43ec832d7cd7d1295ce60fc6f27da7d507b06fc"));
const Route$1u = createFileRoute("/api/public/hooks/auto-retrain")({
  server: {
    handlers: {
      POST: async () => runRetrain(),
      GET: async () => runRetrain()
    }
  }
});
async function runRetrain() {
  try {
    const days = 180;
    const picksPerDay = 3;
    const candidates = [75, 80, 82, 85, 88];
    const trials = [];
    for (const minConfidence of candidates) {
      try {
        const r = await runWalkForward({
          data: { days, minConfidence, picksPerDay }
        });
        const acc = Number(r.accuracy_pct ?? 0);
        const wr = Number(r.top_pick_win_rate ?? 0);
        const ret = Number(r.avg_next_day_return_pct ?? 0);
        trials.push({
          minConfidence,
          accuracy_pct: acc,
          top_pick_win_rate: wr,
          avg_next_day_return_pct: ret,
          score: acc * wr + ret * 100
        });
      } catch (e) {
        console.warn(`[auto-retrain] trial ${minConfidence} failed:`, e);
      }
    }
    if (trials.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "no trials succeeded" }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    trials.sort((a, b) => b.score - a.score);
    const best = trials[0];
    await supabaseAdmin$5.from("model_state").upsert({
      key: "auto_retrain_best",
      data: {
        best,
        trials,
        evaluated_at: (/* @__PURE__ */ new Date()).toISOString(),
        window_days: days,
        picks_per_day: picksPerDay
      },
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    return new Response(
      JSON.stringify({ success: true, best, trials }, null, 2),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[auto-retrain] fatal:", msg);
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { headers: { "Content-Type": "application/json" } }
    );
  }
}
const Route$1t = createFileRoute("/api/public/hooks/backfill-tiers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const maxBatches = Math.min(50, Number(url.searchParams.get("batches") ?? 10));
        const batchSize = Math.min(5e3, Number(url.searchParams.get("size") ?? 2e3));
        let totalProcessed = 0;
        const batches = [];
        for (let i = 0; i < maxBatches; i++) {
          const { processed } = await ingestClosedTrades(batchSize);
          batches.push(processed);
          totalProcessed += processed;
          if (processed === 0) break;
        }
        return new Response(
          JSON.stringify({
            success: true,
            totalProcessed,
            batchesRun: batches.length,
            perBatch: batches
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      },
      GET: async () => new Response(
        JSON.stringify({
          usage: "POST /api/public/hooks/backfill-tiers?batches=10&size=2000"
        }),
        { headers: { "Content-Type": "application/json" } }
      )
    }
  }
});
const CORS$j = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function cairoDateISO$4(d) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
const Route$1s = createFileRoute("/api/public/hooks/collection-status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$j }),
      GET: async () => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const now = /* @__PURE__ */ new Date();
        const dayStartCairo = `${cairoDateISO$4(now)}T07:00:00Z`;
        const since5m = new Date(now.getTime() - 5 * 6e4).toISOString();
        const [tickLatest, tick5m, tlLatest, tlToday, obLatest, obToday] = await Promise.all([
          supabaseAdmin2.from("live_ticks").select("ts, symbol").eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("live_ticks").select("symbol", { count: "exact", head: true }).eq("source", "thunder_ext").gte("ts", since5m),
          supabaseAdmin2.from("scalp_timeline_events").select("at_ms, event, symbol").order("at_ms", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("scalp_timeline_events").select("event", { count: "exact", head: true }).gte("at_ms", new Date(dayStartCairo).getTime()),
          supabaseAdmin2.from("orderbook_snapshots").select("ts, symbol").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("orderbook_snapshots").select("symbol", { count: "exact", head: true }).gte("ts", dayStartCairo)
        ]);
        const tickTs = tickLatest.data?.ts ?? null;
        const tickAgo = tickTs ? Math.round((now.getTime() - new Date(tickTs).getTime()) / 1e3) : null;
        const tlTs = tlLatest.data?.at_ms ? new Date(Number(tlLatest.data.at_ms)).toISOString() : null;
        const tlAgo = tlLatest.data?.at_ms ? Math.round((now.getTime() - Number(tlLatest.data.at_ms)) / 1e3) : null;
        const obTs = obLatest.data?.ts ?? null;
        const obAgo = obTs ? Math.round((now.getTime() - new Date(obTs).getTime()) / 1e3) : null;
        return new Response(JSON.stringify({
          ok: true,
          now: now.toISOString(),
          ticks: { lastTs: tickTs, lastAgoSec: tickAgo, count5m: tick5m.count ?? 0, lastSymbol: tickLatest.data?.symbol ?? null },
          timeline: { lastTs: tlTs, lastAgoSec: tlAgo, countToday: tlToday.count ?? 0, lastEvent: tlLatest.data?.event ?? null, lastSymbol: tlLatest.data?.symbol ?? null },
          l2: { lastTs: obTs, lastAgoSec: obAgo, countToday: obToday.count ?? 0, lastSymbol: obLatest.data?.symbol ?? null }
        }), { status: 200, headers: { "Content-Type": "application/json", ...CORS$j } });
      }
    }
  }
});
const CORS$i = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function classify$2(ageSec, marketOpen, redAfter, yellowAfter) {
  if (!marketOpen) return "idle";
  if (ageSec == null) return "red";
  if (ageSec >= redAfter) return "red";
  if (ageSec >= yellowAfter) return "yellow";
  return "green";
}
const Route$1r = createFileRoute("/api/public/hooks/collection-watchdog")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$i }),
      GET: async () => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const now = /* @__PURE__ */ new Date();
        const market = getMarketStatus(now);
        const marketOpen = market.isOpen;
        const since5m = new Date(now.getTime() - 5 * 6e4).toISOString();
        const since30m = new Date(now.getTime() - 30 * 6e4).toISOString();
        const [tickLatest, tick5m, obLatest, ob30m, wlLatest, wl5m, tlLatest] = await Promise.all([
          supabaseAdmin2.from("live_ticks").select("ts, symbol").eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("live_ticks").select("symbol", { count: "exact", head: true }).eq("source", "thunder_ext").gte("ts", since5m),
          supabaseAdmin2.from("orderbook_snapshots").select("ts, symbol").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("orderbook_snapshots").select("symbol", { count: "exact", head: true }).gte("ts", since30m),
          supabaseAdmin2.from("thunder_watchlist_snapshots").select("ts, symbol").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("thunder_watchlist_snapshots").select("symbol", { count: "exact", head: true }).gte("ts", since5m),
          supabaseAdmin2.from("scalp_timeline_events").select("at_ms, event").order("at_ms", { ascending: false }).limit(1).maybeSingle()
        ]);
        const ageSec = (iso) => iso ? Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1e3)) : null;
        const ageMs = (ms) => ms != null ? Math.max(0, Math.round((now.getTime() - Number(ms)) / 1e3)) : null;
        const tickAge = ageSec(tickLatest.data?.ts);
        const obAge = ageSec(obLatest.data?.ts);
        const wlAge = ageSec(wlLatest.data?.ts);
        const tlAge = ageMs(tlLatest.data?.at_ms);
        const checks = [
          {
            key: "ticks",
            label: "💹 الأسعار اللحظية",
            status: classify$2(tickAge, marketOpen, 180, 90),
            lastAgoSec: tickAge,
            countRecent: tick5m.count ?? 0,
            expected: "tick كل ثانيتين تقريباً",
            message: marketOpen ? tickAge == null ? "لا توجد أي بيانات — الإكستنشن مش بيبعت أسعار" : tickAge >= 180 ? `آخر سعر من ${tickAge}s — الإكستنشن واقف` : tickAge >= 90 ? `آخر سعر من ${tickAge}s — بطيء` : `${tick5m.count ?? 0} tick / آخر 5د` : "السوق مغلق — لا نتوقع أسعار"
          },
          {
            key: "l2",
            label: "📚 قائمة L2 (Level 2)",
            status: classify$2(obAge, marketOpen, 1800, 900),
            lastAgoSec: obAge,
            countRecent: ob30m.count ?? 0,
            expected: "snapshot كل ~2 دقيقة",
            message: marketOpen ? obAge == null ? "لا يوجد أي L2 اليوم — دورة L2 متوقفة" : obAge >= 1800 ? `آخر L2 من ${Math.round(obAge / 60)}د — الدورة متوقفة` : obAge >= 900 ? `آخر L2 من ${Math.round(obAge / 60)}د — بطيء` : `${ob30m.count ?? 0} snapshot / آخر 30د` : "السوق مغلق — لا نتوقع L2"
          },
          {
            key: "watchlist",
            label: "👁️ Watchlist",
            // الاكستنشن بتعمل throttle لكل UUID مرة/ساعة (background.js:1352).
            // فلازم threshold الـ watchdog يطابقها، وإلا هنشوف "متوقف" كل ساعة
            // مع إن كل حاجة تمام. red = ساعتين بدون أي snapshot، yellow = ساعة.
            status: classify$2(wlAge, marketOpen, 7200, 3600),
            lastAgoSec: wlAge,
            countRecent: wl5m.count ?? 0,
            expected: "snapshot لكل رمز مرة/ساعة (throttle مقصود)",
            message: marketOpen ? wlAge == null ? "لا يوجد watchlist اليوم" : wlAge >= 7200 ? `آخر watchlist من ${Math.round(wlAge / 60)}د — الدورة متوقفة` : wlAge >= 3600 ? `آخر watchlist من ${Math.round(wlAge / 60)}د — بطيء` : `${wl5m.count ?? 0} صف / آخر 5د` : "السوق مغلق"
          },
          {
            key: "timeline",
            label: "📍 Timeline إشارات",
            status: !marketOpen ? "idle" : tlAge != null ? "green" : "idle",
            lastAgoSec: tlAge,
            countRecent: 0,
            expected: "يظهر عند كل إشارة",
            message: tlAge == null ? "لا توجد إشارات بعد اليوم" : `آخر حدث من ${tlAge < 60 ? tlAge + "s" : Math.round(tlAge / 60) + "د"}`
          }
        ];
        const worst = checks.some((c) => c.status === "red") ? "red" : checks.some((c) => c.status === "yellow") ? "yellow" : !marketOpen ? "idle" : "green";
        return new Response(JSON.stringify({
          ok: true,
          now: now.toISOString(),
          marketOpen,
          marketLabel: market.label,
          overall: worst,
          checks
        }), { status: 200, headers: { "Content-Type": "application/json", ...CORS$i } });
      }
    }
  }
});
const computeScalpFeasibility = createServerFn({
  method: "POST"
}).inputValidator((input) => input).handler(createSsrRpc("0a99f69b017d353c507a6e6f607ac5a16ace74014d33be6cc1d024d4dba5840b"));
const Route$1q = createFileRoute(
  "/api/public/hooks/compute-scalp-feasibility"
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let tradeDate;
        try {
          const body = await request.json();
          tradeDate = body.tradeDate;
        } catch {
        }
        const result = await computeScalpFeasibility({ data: { tradeDate } });
        return Response.json({ ok: true, ...result });
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tradeDate = url.searchParams.get("tradeDate") || void 0;
        const result = await computeScalpFeasibility({ data: { tradeDate } });
        return Response.json({ ok: true, ...result });
      }
    }
  }
});
const Route$1p = createFileRoute("/api/public/hooks/daily-pick")({
  server: {
    handlers: {
      POST: async () => {
        const { data: openPicks } = await supabaseAdmin$5.from("daily_picks").select("*").eq("status", "open");
        let updated = 0;
        for (const p of openPicks ?? []) {
          const endDate = new Date(p.pick_date);
          endDate.setDate(endDate.getDate() + p.max_hold_days + 1);
          const { data: candles } = await supabaseAdmin$5.from("daily_candles").select("date,open,high,low,close").eq("symbol", p.symbol).gt("date", p.pick_date).lte("date", endDate.toISOString().slice(0, 10)).order("date");
          if (!candles?.length) continue;
          const entry = Number(p.entry_price);
          const tgt = Number(p.target_price);
          const stp = Number(p.stop_price);
          let status = null;
          let exitPrice = 0;
          let exitDate = "";
          for (const c of candles) {
            if (+c.high >= tgt) {
              status = "win";
              exitPrice = tgt;
              exitDate = c.date;
              break;
            }
            if (+c.low <= stp) {
              status = "loss";
              exitPrice = stp;
              exitDate = c.date;
              break;
            }
          }
          if (!status && candles.length >= p.max_hold_days) {
            const last = candles[Math.min(candles.length - 1, p.max_hold_days - 1)];
            exitPrice = +last.close;
            exitDate = last.date;
            status = exitPrice > entry ? "win" : exitPrice < entry ? "loss" : "expired";
          }
          if (status) {
            const pnlPct = (exitPrice / entry - 1) * 100;
            await supabaseAdmin$5.from("daily_picks").update({
              status,
              exit_price: exitPrice,
              exit_date: exitDate,
              pnl_pct: pnlPct
            }).eq("id", p.id);
            updated++;
          }
        }
        return new Response(JSON.stringify({ ok: true, updated }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
});
async function notifyScanSummary(scanId) {
  const { data: recs } = await supabaseAdmin$5.from("recommendations").select(
    "symbol, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, expected_gain_pct, expected_next_day_pct, technical_score, sentiment_score, market_trend, signal, rejected_by_rules"
  ).eq("scan_id", scanId).eq("signal", "buy").eq("rejected_by_rules", false).order("confidence", { ascending: false }).limit(5);
  if (!recs || recs.length === 0) {
    await sendTelegram$1(
      `<b>🔍 خلص التحديث</b>
مفيش ترشيحات شراء قويه دلوقتي — السوق مش معطي إشارات واضحه.
هنحاول تاني في التحديث الجاي.`
    );
    return { sent: true, picks: 0 };
  }
  const symbols = recs.map((r) => String(r.symbol));
  const [{ data: stocks }, { data: news }] = await Promise.all([
    supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", symbols),
    supabaseAdmin$5.from("news_sentiment").select("symbol, headline, sentiment, impact_level, published_at").in("symbol", symbols).gte("published_at", new Date(Date.now() - 48 * 3600 * 1e3).toISOString()).order("published_at", { ascending: false })
  ]);
  const nameMap = new Map((stocks ?? []).map((s) => [String(s.symbol), String(s.name_ar)]));
  const newsBySym = /* @__PURE__ */ new Map();
  for (const n of news ?? []) {
    const sym = String(n.symbol);
    const arr = newsBySym.get(sym) ?? [];
    if (arr.length < 2) {
      arr.push({
        headline: String(n.headline ?? ""),
        sentiment: String(n.sentiment ?? "neutral"),
        impact: String(n.impact_level ?? "low")
      });
      newsBySym.set(sym, arr);
    }
  }
  const blocks = recs.map((r, i) => {
    const sym = String(r.symbol);
    const name = escapeHtml(nameMap.get(sym) ?? sym);
    const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.map(String) : [];
    const reasonsText = reasons.slice(0, 4).map((x) => `   • ${escapeHtml(x)}`).join("\n");
    const entry = r.entry_min != null && r.entry_max != null ? `${Number(r.entry_min).toFixed(2)}–${Number(r.entry_max).toFixed(2)}` : "—";
    const tgt = r.target != null ? Number(r.target).toFixed(2) : "—";
    const stp = r.stop_loss != null ? Number(r.stop_loss).toFixed(2) : "—";
    const expDay = r.expected_next_day_pct != null ? `${Number(r.expected_next_day_pct).toFixed(1)}%` : null;
    const expTotal = r.expected_gain_pct != null ? `${Number(r.expected_gain_pct).toFixed(1)}%` : null;
    const tech = r.technical_score != null ? Number(r.technical_score).toFixed(0) : null;
    const sent = r.sentiment_score != null ? Number(r.sentiment_score).toFixed(2) : null;
    const newsArr = newsBySym.get(sym) ?? [];
    const newsLines = newsArr.length ? "\n   <i>📰 من الأخبار اللي اتحللت:</i>\n" + newsArr.map((n) => {
      const icon = n.sentiment === "positive" ? "📈" : n.sentiment === "negative" ? "⚠️" : "📰";
      return `   ${icon} ${escapeHtml(n.headline.slice(0, 110))}`;
    }).join("\n") : "";
    const scoresParts = [];
    if (tech) scoresParts.push(`فني ${tech}/100`);
    if (sent) scoresParts.push(`أخبار ${sent}`);
    const scoresLine = scoresParts.length ? `
   <i>📊 ${scoresParts.join(" · ")}</i>` : "";
    const expLine = expDay || expTotal ? `
   <i>📈 توقع: ${expDay ? `بكرا ${expDay}` : ""}${expDay && expTotal ? " · " : ""}${expTotal ? `إجمالي ${expTotal}` : ""}</i>` : "";
    return `<b>${i + 1}. ${name}</b> (<code>${escapeHtml(sym)}</code>) — ثقة ${r.confidence}%
   💵 دخول: <b>${entry}</b> · 🎯 ${tgt} · 🛑 ${stp}` + expLine + scoresLine + (reasonsText ? `
   <i>💡 ليه اترشح:</i>
${reasonsText}` : "") + newsLines;
  });
  const header = `<b>🤖 خلص التحديث — ${recs.length} ترشيح لجلسة الغد</b>
<i>التوقيت: ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "short" })}</i>
`;
  const message = [header, ...blocks, `
<i>⚠️ راجع الأسعار قبل الشراء وادخل بحجم مناسب لرأس مالك.</i>`].join("\n\n");
  const MAX = 3900;
  if (message.length <= MAX) {
    await sendTelegram$1(message);
  } else {
    let buf = header;
    for (const b of blocks) {
      if ((buf + "\n\n" + b).length > MAX) {
        await sendTelegram$1(buf);
        buf = "";
      }
      buf += (buf ? "\n\n" : "") + b;
    }
    if (buf) await sendTelegram$1(buf);
  }
  return { sent: true, picks: recs.length };
}
const SCAN_HARD_TIMEOUT_MS = 280 * 1e3;
function withTimeout(promise, ms, label) {
  let timeout;
  const timer = new Promise((_, reject) => {
    timeout = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}
const Route$1o = createFileRoute("/api/public/hooks/daily-scan")({
  server: {
    handlers: {
      POST: async () => {
        const { data: latest } = await supabaseAdmin$5.from("scans").select("id, started_at, status").order("started_at", { ascending: false }).limit(1).maybeSingle();
        if (latest?.status === "running") {
          const age = Date.now() - new Date(latest.started_at).getTime();
          if (age > 6 * 60 * 1e3) {
            await supabaseAdmin$5.from("scans").update({
              status: "failed",
              finished_at: (/* @__PURE__ */ new Date()).toISOString(),
              error_message: "auto-failed: stuck >6min (worker timeout)"
            }).eq("id", latest.id);
          } else {
            return Response.json(
              { ok: false, message: "scan already running", scanId: latest.id, ageMs: age },
              { status: 200 }
            );
          }
        }
        if (latest) {
          const lastTime = latest.status === "completed" ? latest.started_at : null;
          const age = lastTime ? Date.now() - new Date(lastTime).getTime() : Number.POSITIVE_INFINITY;
          if (latest.status === "completed" && age < 3 * 60 * 1e3) {
            return Response.json(
              { ok: false, message: "throttled", lastScanId: latest.id, ageMs: age },
              { status: 200 }
            );
          }
        }
        try {
          const scanId = await createPendingScan();
          try {
            const result = await withTimeout(
              runScanForId(scanId),
              SCAN_HARD_TIMEOUT_MS,
              "انتهت مهلة المسح قبل الاكتمال — تم إيقافه بأمان بدون تعليق"
            );
            if (result?.scanId) {
              await notifyScanSummary(result.scanId).catch(
                (e) => console.error("[daily-scan] notifyScanSummary failed", e)
              );
            }
            return Response.json(
              { ok: true, completed: true, scanId, stocks: result?.stocks ?? 0 },
              { status: 200 }
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("daily-scan run failed:", msg);
            await supabaseAdmin$5.from("scans").update({ status: "failed", finished_at: (/* @__PURE__ */ new Date()).toISOString(), error_message: msg }).eq("id", scanId);
            return Response.json({ ok: false, scanId, error: msg }, { status: 200 });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("daily-scan failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
let cached = null;
let cachedAt = 0;
function getHalalSet() {
  const now = Date.now();
  if (cached && now - cachedAt < 5 * 6e4) return cached;
  const set = /* @__PURE__ */ new Set();
  try {
    const p = path__default__default.join(process.cwd(), "halal-symbols.txt");
    const text = fs__default__default.readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim().toUpperCase();
      if (s) set.add(s);
    }
  } catch {
  }
  cached = set;
  cachedAt = now;
  return set;
}
function isHalal(symbol) {
  return getHalalSet().has(String(symbol).trim().toUpperCase());
}
const halalList_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getHalalSet,
  isHalal
}, Symbol.toStringTag, { value: "Module" }));
const STRATEGY_ID$1 = "momentum-weekly";
const MW_PARAMS = {
  TOTAL_CAPITAL: 1e5,
  TOP_N_DEFAULT: 5,
  // N5 deployment (audited: best return/consistency balance)
  TOP_N_MAX: 5,
  MOM_LB: 5,
  // sessions, ending yesterday
  MOM_MIN: 0.08,
  MOM_MAX: 0.45,
  // tail shield — never remove (measured)
  LIQ_TOP: 100,
  LIQ_FLOOR_MONEY: 2e5,
  // mean daily close×volume, last 20 sessions ending yesterday
  LIQ_WINDOW: 20,
  HIGH_WINDOW: 250,
  // for the fresh-high (FH) variant flag
  GAP_MIN: -0.03,
  // entry-open filter vs yesterday close
  GAP_MAX: 0.02,
  REGIME_WEEKS: 10,
  // cumulative EW universe return > 0 → trade, else cash
  HOLD_SESSIONS: 5,
  // exit at next week's first open
  COST_RT: 5e-4,
  // Thundr 0.05% round trip (0.6% variant validated: 1.17%/wk)
  VOL_TARGET: 0.06,
  // 8-week weekly-σ above this → scale positions by 0.06/σ
  CRASH_CUT: 0.08,
  // two consecutive weeks summing ≤ −8% → half size
  SESSION_DAYS: [0, 1, 2, 3, 4],
  // Sun..Thu
  PRICE_MIN: 0.5,
  HALAL_ONLY: true,
  // nominations restricted to the Shariah whitelist
  // W4 selection filters (volume confirmation + smooth momentum). Verdict per
  // the data-hierarchy rule (user's daily.csv = primary source, 2026-09-22):
  // OFF. On the primary source the filters cost ~60% of the return (they
  // exclude the monster-week picks: 07-05 +14,948 vs +5,881, 07-12 +21,770 vs
  // +3,914). Their verified value on ydf-10y was tail protection only. Flag
  // kept for live A/B — flip to true to re-enable.
  W4_FILTERS: false
};
const USER_CAPITAL_SETTING_KEY$1 = "momentum_weekly_user_capital";
const SLOT_UNIT_EGP$1 = 2e4;
function computeSizing$1(userCapital) {
  const cap = typeof userCapital === "number" && Number.isFinite(userCapital) && userCapital > 0 ? userCapital : MW_PARAMS.TOTAL_CAPITAL;
  let topN = Math.round(cap / SLOT_UNIT_EGP$1);
  if (topN < 1) topN = 1;
  if (topN > MW_PARAMS.TOP_N_MAX) topN = MW_PARAMS.TOP_N_MAX;
  return { total_capital: cap, top_n: topN, slot_capital: cap / topN };
}
const BACKTEST_WEEKLY_EGP = 1033;
const BACKTEST_WEEKLY_EGP_LOW = 490;
const BACKTEST_WEEKLY_EGP_HIGH = 1600;
const BACKTEST_WORST_WEEK_PCT = -24.5;
const BACKTEST_MAXDD_PCT = 36.7;
const CURRENT_REGIME_WEEKLY_LOW_EGP = 2e3;
const CURRENT_REGIME_WEEKLY_HIGH_EGP = 3300;
const BACKTEST_DISCLAIMER_AR = "قياس صادق (2016-2026، شريعة فقط، تكلفة ثاندر 0.05%): المتوسط الطويل الموثوق ~1,033 ج.م/أسبوع (فاصل ثقة 95%: 490-1,600) — والنظام الصاعد الحالي قاس ~2,000-2,700/أسبوع وهو أداء أفضل فترة في العقد وليس حقاً مكتسباً. شكل الأسابيع الحقيقي: ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 — المتوسط بيتحقق من قفزات نادرة لا يمكن توقيتها. مرفوض نهائياً: وعد بربح ثابت. أقصى تراجع تاريخي 36.7% (مع الحمايات: ~27-30%) — التوصية: paper trading ثم رأس مال تدريجي.";
function cairoNow$3() {
  return new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function cairoDateISO$3(d = cairoNow$3()) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
function isSessionDay$1(d = cairoNow$3()) {
  return MW_PARAMS.SESSION_DAYS.includes(d.getDay());
}
function sessionsBetween(fromISO, toISO) {
  const start = Date.parse(`${fromISO}T00:00:00Z`);
  const end = Date.parse(`${toISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 864e5) {
    const dow = new Date(t).getUTCDay();
    if (MW_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}
async function loadCandles(symbol, minRows = 30) {
  const out = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$5.from("daily_candles").select("date, open, high, low, close, volume").eq("symbol", symbol).order("date", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const o = Number(r.open);
      const c = Number(r.close);
      if (!(o > 0) || !(c > 0)) continue;
      out.push({
        date: String(r.date),
        open: o,
        high: Number(r.high) || o,
        low: Number(r.low) || o,
        close: c,
        volume: Number(r.volume) || 0
      });
    }
    if (data.length < 1e3) break;
    from += 1e3;
  }
  return out;
}
async function loadUniverse() {
  const syms = /* @__PURE__ */ new Set();
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol").eq("is_active", true).eq("day_tradable", true);
  for (const s of stocks ?? []) syms.add(String(s.symbol).toUpperCase());
  const since = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
  const { data: candles } = await supabaseAdmin$5.from("daily_candles").select("symbol").gte("date", since);
  for (const r of candles ?? []) syms.add(String(r.symbol).toUpperCase());
  return [...syms];
}
function lastCompletedIdx(g, nowCairo) {
  const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo" }).format(nowCairo);
  const mins = nowCairo.getHours() * 60 + nowCairo.getMinutes();
  let li = g.length - 1;
  while (li > 0) {
    const d = g[li].date;
    const complete = d < todayISO || d === todayISO && mins >= 14 * 60 + 45;
    if (complete) break;
    li--;
  }
  return li;
}
async function scanWeeklyCandidates() {
  const now = cairoNow$3();
  cairoDateISO$3(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sizing = { total_capital: MW_PARAMS.TOTAL_CAPITAL, top_n: MW_PARAMS.TOP_N_DEFAULT, slot_capital: MW_PARAMS.TOTAL_CAPITAL / MW_PARAMS.TOP_N_DEFAULT };
  const base = {
    status: "before_data",
    statusLabelAr: "لا توجد بيانات",
    cairoTime: hhmm,
    signalDate: "",
    entryDate: "",
    exitDate: "",
    regimeOn: false,
    regimeCum10: 0,
    protectionScale: 1,
    universeCount: 0,
    liquidCount: 0,
    bandCount: 0,
    candidates: [],
    selected: [],
    sizing
  };
  const universe = await loadUniverse();
  base.universeCount = universe.length;
  if (!universe.length) return base;
  const candles = /* @__PURE__ */ new Map();
  let maxDate = "";
  for (const sym of universe) {
    const g = await loadCandles(sym);
    if (g.length >= 26) {
      candles.set(sym, g);
      const li = lastCompletedIdx(g, now);
      if (g[li].date > maxDate) maxDate = g[li].date;
    }
  }
  if (!candles.size || !maxDate) return base;
  const signalDate = maxDate;
  base.signalDate = signalDate;
  const ageDays = Math.floor((Date.now() - Date.parse(`${signalDate}T00:00:00Z`)) / 864e5);
  if (ageDays > 4) {
    return { ...base, status: "stale_data", statusLabelAr: `البيانات قديمة (${signalDate}) — حدّث daily_candles قبل الترشيح` };
  }
  (/* @__PURE__ */ new Date(`${signalDate}T00:00:00Z`)).getUTCDay();
  let entry = /* @__PURE__ */ new Date(`${signalDate}T00:00:00Z`);
  do {
    entry.setUTCDate(entry.getUTCDate() + 1);
  } while (!MW_PARAMS.SESSION_DAYS.includes(entry.getUTCDay()));
  const entryDate = entry.toISOString().slice(0, 10);
  const weekStart = new Date(entry);
  weekStart.setUTCDate(weekStart.getUTCDate() - entry.getUTCDay());
  const exit = new Date(weekStart);
  exit.setUTCDate(exit.getUTCDate() + 4);
  do {
    exit.setUTCDate(exit.getUTCDate() + 1);
  } while (!MW_PARAMS.SESSION_DAYS.includes(exit.getUTCDay()));
  base.entryDate = entryDate;
  base.exitDate = exit.toISOString().slice(0, 10);
  const cands = [];
  for (const [sym, g] of candles) {
    if (!isHalal(sym)) continue;
    const li = lastCompletedIdx(g, now);
    if (g[li].date !== signalDate) continue;
    const n = li + 1;
    if (n < 26) continue;
    const lastClose = g[li].close;
    if (lastClose < MW_PARAMS.PRICE_MIN) continue;
    let money = 0;
    for (let j2 = n - MW_PARAMS.LIQ_WINDOW; j2 < n; j2++) money += g[j2].close * g[j2].volume;
    const v20 = money / MW_PARAMS.LIQ_WINDOW;
    if (v20 < MW_PARAMS.LIQ_FLOOR_MONEY) continue;
    const mom = n > MW_PARAMS.MOM_LB + 1 ? g[li].close / g[li - MW_PARAMS.MOM_LB].close - 1 : -9;
    const from = Math.max(0, li + 1 - MW_PARAMS.HIGH_WINDOW);
    let hh = 0;
    for (let j2 = from; j2 <= li; j2++) if (g[j2].close > hh) hh = g[j2].close;
    const nearHigh = hh > 0 ? g[li].close / hh : 0;
    let gapped = false;
    for (let j2 = Math.max(1, li - MW_PARAMS.MOM_LB); j2 <= li; j2++) {
      const dd = (Date.parse(`${g[j2].date}T00:00:00Z`) - Date.parse(`${g[j2 - 1].date}T00:00:00Z`)) / 864e5;
      if (dd > 7) {
        gapped = true;
        break;
      }
    }
    if (gapped) continue;
    let down5 = 0;
    for (let j2 = li - 4; j2 <= li; j2++) if (g[j2].close < g[j2 - 1].close) down5++;
    let v10s = 0;
    for (let j2 = li - 9; j2 <= li; j2++) v10s += g[j2].volume;
    let v20s = 0;
    for (let j2 = li - 19; j2 <= li; j2++) v20s += g[j2].volume;
    const volR = v20s > 0 ? v10s / 10 / (v20s / 20) : 0;
    cands.push({
      symbol: sym,
      last_close: lastClose,
      mom5: mom,
      v20_money: v20,
      near_high: Math.round(nearHigh * 1e3) / 1e3,
      fresh_high: g[li].close >= hh && hh > 0,
      halal: isHalal(sym),
      down5,
      volR: Math.round(volR * 1e3) / 1e3
    });
  }
  base.liquidCount = cands.length;
  const liq = [...cands].sort((a, b) => b.v20_money - a.v20_money).slice(0, MW_PARAMS.LIQ_TOP);
  const inBand = liq.filter((c) => c.mom5 >= MW_PARAMS.MOM_MIN && c.mom5 <= MW_PARAMS.MOM_MAX).sort((a, b) => b.mom5 - a.mom5);
  base.bandCount = inBand.length;
  const pool = inBand;
  const weekly = computeWeeklyBench(candles, allDates(candles));
  const cum10 = weekly.slice(-10).reduce((a, r) => a * (1 + r), 1);
  base.regimeCum10 = cum10 - 1;
  base.regimeOn = cum10 > 1;
  let protectionScale = 1;
  const last8 = weekly.slice(-8);
  if (last8.length >= 8) {
    const mu = last8.reduce((a, r) => a + r, 0) / 8;
    const ss = last8.reduce((a, r) => a + (r - mu) * (r - mu), 0);
    const sd = Math.sqrt(ss / 7);
    if (sd > MW_PARAMS.VOL_TARGET) protectionScale = MW_PARAMS.VOL_TARGET / sd;
  }
  if (weekly.length >= 2 && weekly[weekly.length - 1] + weekly[weekly.length - 2] <= -0.08) {
    protectionScale *= 0.5;
  }
  base.protectionScale = protectionScale;
  if (!base.regimeOn) {
    return { ...base, status: "regime_off", statusLabelAr: "فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع سالب)" };
  }
  if (!pool.length) {
    return { ...base, status: "no_candidates", statusLabelAr: "لا مرشحين داخل نطاق الزخم هذا الأسبوع (كاش)" };
  }
  base.status = "ready";
  base.statusLabelAr = `جاهز: ${Math.min(sizing.top_n, pool.length)} مرشح (من ${inBand.length} داخل النطاق)`;
  base.candidates = pool;
  base.selected = pool.slice(0, sizing.top_n);
  return base;
}
function allDates(candles) {
  const s = /* @__PURE__ */ new Set();
  for (const g of candles.values()) for (const r of g) s.add(r.date);
  return [...s].sort();
}
function computeWeeklyBench(candles, dates) {
  function dow(ds) {
    return (/* @__PURE__ */ new Date(`${ds}T00:00:00Z`)).getUTCDay();
  }
  const weekStarts = [];
  for (let i = 0; i < dates.length; i++) {
    if (i === 0 || dow(dates[i]) < dow(dates[i - 1])) weekStarts.push(dates[i]);
  }
  const out = [];
  for (let k = 0; k < weekStarts.length - 1; k++) {
    let sum = 0;
    let n = 0;
    for (const g of candles.values()) {
      const iE = g.findIndex((r) => r.date === weekStarts[k]);
      const iX = g.findIndex((r) => r.date === weekStarts[k + 1]);
      if (iE < 0 || iX < 0) continue;
      if (!(g[iE].open > 0) || !(g[iX].open > 0)) continue;
      sum += g[iX].open / g[iE].open - 1;
      n++;
    }
    out.push(n > 0 ? sum / n : 0);
  }
  return out;
}
const GAP_PARAMS$1 = {
  STOP_LOSS_PCT: 0,
  EOD_CHECK_MIN: 14 * 60 + 25,
  SESSION_OPEN_MIN: 10 * 60
};
function cairoMinutesNow$1() {
  const n = cairoNow$3();
  return n.getHours() * 60 + n.getMinutes();
}
function tradingDaysElapsed$1(entryDateISO, todayISO) {
  const start = Date.parse(`${entryDateISO}T00:00:00Z`);
  const end = Date.parse(`${todayISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 864e5) {
    const dow = new Date(t).getUTCDay();
    if (MW_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}
async function liveSymbolState(symbol) {
  const [{ data: tick }, { data: mw }, { data: candle }] = await Promise.all([
    supabaseAdmin$5.from("live_ticks").select("price, ts").eq("symbol", symbol).order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin$5.from("marketwatch_snapshots").select("highest_bid, highest_bid_qty, last_price, captured_at").eq("symbol", symbol).order("captured_at", { ascending: false }).limit(1).maybeSingle(),
    // Final fallback: latest daily close — kept fresh in-session by the
    // Supabase tv-bridge (every 5s) so open-position cards never read 0
    // when no live feed (extension/marketwatch) is connected.
    supabaseAdmin$5.from("daily_candles").select("close, date").eq("symbol", symbol).order("date", { ascending: false }).limit(1).maybeSingle()
  ]);
  const price = tick ? Number(tick.price) : mw ? Number(mw.last_price) || null : candle ? Number(candle.close) || null : null;
  const bid = mw ? Number(mw.highest_bid) || null : null;
  const bidQty = mw ? Number(mw.highest_bid_qty) || null : null;
  return {
    price,
    bid,
    bidQty,
    bidValue: (bid ?? 0) * (bidQty ?? 0),
    ts: tick ? String(tick.ts) : mw ? String(mw.captured_at) : candle ? String(candle.date) : null
  };
}
function decideExit(args) {
  void args.extraHoldGranted;
  void args.exitDue;
  if (args.daysHeld < MW_PARAMS.HOLD_SESSIONS) return { action: "HOLD" };
  if (args.bidValue >= args.positionValue && args.bid > 0) {
    return { action: "SELL", reason: "TIME_EXIT", exit_price: args.bid, bid_confirmed: true };
  }
  return { action: "SELL", reason: "TIME_EXIT", exit_price: args.price, bid_confirmed: false };
}
async function getUserCapital$1() {
  const { data } = await supabaseAdmin$5.from("strategy_settings").select("numeric_value").eq("key", USER_CAPITAL_SETTING_KEY$1).maybeSingle();
  const v = data ? data.numeric_value : null;
  const n = v == null ? null : Number(v);
  return n != null && Number.isFinite(n) ? n : null;
}
async function getEffectiveSizing$1() {
  return computeSizing$1(await getUserCapital$1());
}
async function loadTodayFirstPrices$1(todayISO) {
  const first = /* @__PURE__ */ new Map();
  let mwFrom = 0;
  let mwDone = false;
  while (!mwDone) {
    const { data: mw } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol, last_price, captured_at").gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true }).range(mwFrom, mwFrom + 999);
    if (!mw?.length) break;
    for (const r of mw) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.last_price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.captured_at) });
    }
    if (mw.length < 1e3) mwDone = true;
    else mwFrom += 1e3;
  }
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, ts").gte("ts", `${todayISO}T00:00:00Z`).order("ts", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.ts) });
    }
    if (data.length < 1e3) break;
    from += 1e3;
  }
  return first;
}
async function scanDailyCandidates$1(_dateISOOverride, ignoreSession = false) {
  const now = cairoNow$3();
  const todayISO = cairoDateISO$3(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sizing = await getEffectiveSizing$1();
  const base = {
    status: "no_data",
    statusLabelAr: "لا توجد بيانات",
    cairoTime: hhmm,
    scanDate: todayISO,
    universeCount: 0,
    candidates: [],
    selected: [],
    filteredOutIlliquid: [],
    sizing
  };
  if (!ignoreSession) {
    if (!isSessionDay$1(now)) return { ...base, status: "out_of_session", statusLabelAr: "السوق مغلق" };
    if (now.getDay() !== 0) {
      return { ...base, status: "not_entry_day", statusLabelAr: "نظام أسبوعي: الدخول يوم الأحد فقط (أول جلسة في الأسبوع)" };
    }
    if (cairoMinutesNow$1() < GAP_PARAMS$1.SESSION_OPEN_MIN)
      return { ...base, status: "before_open", statusLabelAr: "الجلسة لم تفتح بعد" };
  }
  const universe = await loadUniverse();
  base.universeCount = universe.length;
  if (!universe.length) return base;
  const candles = /* @__PURE__ */ new Map();
  let maxDate = "";
  for (const sym of universe) {
    const g = await loadCandles(sym);
    if (g.length >= 26) {
      candles.set(sym, g);
      const li = lastCompletedIdx(g, now);
      if (g[li].date > maxDate) maxDate = g[li].date;
    }
  }
  if (!candles.size || !maxDate) return { ...base, status: "no_data", statusLabelAr: "لا توجد شموع يومية بعد — شغّل تحديث daily_candles" };
  const signalDate = maxDate;
  const cands = [];
  for (const [sym, g] of candles) {
    if (!isHalal(sym)) continue;
    const li = lastCompletedIdx(g, now);
    if (g[li].date !== signalDate) continue;
    const n = li + 1;
    if (n < 26) continue;
    const lastClose = g[li].close;
    if (lastClose < MW_PARAMS.PRICE_MIN) continue;
    let money = 0;
    for (let j2 = n - MW_PARAMS.LIQ_WINDOW; j2 < n; j2++) money += g[j2].close * g[j2].volume;
    const v20 = money / MW_PARAMS.LIQ_WINDOW;
    if (v20 < MW_PARAMS.LIQ_FLOOR_MONEY) continue;
    const mom = n > MW_PARAMS.MOM_LB + 1 ? g[li].close / g[li - MW_PARAMS.MOM_LB].close - 1 : -9;
    const from = Math.max(0, li + 1 - MW_PARAMS.HIGH_WINDOW);
    let hh = 0;
    for (let j2 = from; j2 <= li; j2++) if (g[j2].close > hh) hh = g[j2].close;
    const nearHigh = hh > 0 ? g[li].close / hh : 0;
    let gapped = false;
    for (let j2 = Math.max(1, li - MW_PARAMS.MOM_LB); j2 <= li; j2++) {
      const dd = (Date.parse(`${g[j2].date}T00:00:00Z`) - Date.parse(`${g[j2 - 1].date}T00:00:00Z`)) / 864e5;
      if (dd > 7) {
        gapped = true;
        break;
      }
    }
    if (gapped) continue;
    let down5 = 0;
    for (let j2 = li - 4; j2 <= li; j2++) if (g[j2].close < g[j2 - 1].close) down5++;
    let v10s = 0;
    for (let j2 = li - 9; j2 <= li; j2++) v10s += g[j2].volume;
    let v20s = 0;
    for (let j2 = li - 19; j2 <= li; j2++) v20s += g[j2].volume;
    const volR = v20s > 0 ? v10s / 10 / (v20s / 20) : 0;
    cands.push({
      symbol: sym,
      last_close: lastClose,
      mom5: mom,
      v20_money: v20,
      near_high: Math.round(nearHigh * 1e3) / 1e3,
      fresh_high: g[li].close >= hh && hh > 0,
      halal: isHalal(sym),
      down5,
      volR: Math.round(volR * 1e3) / 1e3
    });
  }
  const liq = [...cands].sort((a, b) => b.v20_money - a.v20_money).slice(0, MW_PARAMS.LIQ_TOP);
  const inBand = liq.filter((c) => c.mom5 >= MW_PARAMS.MOM_MIN && c.mom5 <= MW_PARAMS.MOM_MAX).sort((a, b) => b.mom5 - a.mom5);
  const pool = inBand;
  const weekly = computeWeeklyBench(candles, allDates(candles));
  const cum10 = weekly.slice(-10).reduce((a, r) => a * (1 + r), 1);
  base.regimeOn = cum10 > 1;
  base.regimeCum10 = cum10 - 1;
  base.signalDate = signalDate;
  let protectionScale = 1;
  const last8 = weekly.slice(-8);
  if (last8.length >= 8) {
    const mu = last8.reduce((a, r) => a + r, 0) / 8;
    const ss = last8.reduce((a, r) => a + (r - mu) * (r - mu), 0);
    const sd = Math.sqrt(ss / 7);
    if (sd > MW_PARAMS.VOL_TARGET) protectionScale = MW_PARAMS.VOL_TARGET / sd;
  }
  if (weekly.length >= 2 && weekly[weekly.length - 1] + weekly[weekly.length - 2] <= -0.08) {
    protectionScale *= 0.5;
  }
  base.protectionScale = protectionScale;
  if (!base.regimeOn) {
    return {
      ...base,
      status: "no_gap_downs",
      statusLabelAr: `فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع ${(cum10 - 1 >= 0 ? "+" : "") + ((cum10 - 1) * 100).toFixed(1)}% ≤ 0)`
    };
  }
  if (!pool.length) {
    return { ...base, status: "no_gap_downs", statusLabelAr: "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — كاش" };
  }
  const firstPrices = await loadTodayFirstPrices$1(todayISO);
  const mapped = [];
  const gapFiltered = [];
  for (const c of pool) {
    const fp = firstPrices.get(c.symbol);
    const gAll = candles.get(c.symbol);
    const todayCandle = gAll.find((r) => r.date === todayISO);
    let entryPrice = fp ? fp.price : 0;
    if (!(entryPrice > 0) && todayCandle && todayCandle.open > 0) entryPrice = todayCandle.open;
    if (!(entryPrice > 0)) entryPrice = c.last_close;
    const gapPct = c.last_close > 0 ? entryPrice / c.last_close - 1 : 0;
    const posValue = Math.round(sizing.slot_capital * (base.protectionScale ?? 1));
    const cand = {
      symbol: c.symbol,
      entry_price: entryPrice,
      entry_ts: fp?.ts ?? `${todayISO}T08:00:00Z`,
      prev_close: c.last_close,
      gap_pct: gapPct,
      bid_depth_value: c.v20_money,
      position_value: posValue,
      shares: entryPrice > 0 ? Math.floor(posValue / entryPrice) : 0,
      mom5: c.mom5,
      v20_money: c.v20_money,
      near_high: c.near_high,
      fresh_high: c.fresh_high,
      halal: isHalal(c.symbol),
      last_close: c.last_close,
      down5: c.down5,
      volR: c.volR
    };
    if (gapPct < MW_PARAMS.GAP_MIN || gapPct > MW_PARAMS.GAP_MAX) gapFiltered.push(cand);
    else mapped.push(cand);
  }
  const selected = mapped.slice(0, sizing.top_n);
  if (!selected.length) {
    return {
      ...base,
      status: "all_illiquid",
      statusLabelAr: "كل المرشحين استُبعدوا بقاعدة الفجوة (-3% إلى +2%) — لا مطاردة افتتاحات",
      filteredOutIlliquid: gapFiltered
    };
  }
  base.status = "trading";
  base.statusLabelAr = `مرشحون: ${selected.length} (من ${inBand.length} داخل نطاق الزخم) — دخول الأحد، خروج افتتاح الأسبوع القادم`;
  base.candidates = mapped;
  base.selected = selected;
  base.filteredOutIlliquid = gapFiltered;
  return base;
}
const Route$1n = createFileRoute("/api/public/hooks/data-freshness")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const now = cairoNow$3();
          const { data: latest } = await supabaseAdmin$5.from("daily_candles").select("date").order("date", { ascending: false }).limit(1).maybeSingle();
          const maxDate = latest ? String(latest.date) : null;
          let symbolsOnMaxDate = null;
          if (maxDate) {
            const { count } = await supabaseAdmin$5.from("daily_candles").select("symbol", { count: "exact", head: true }).eq("date", maxDate);
            symbolsOnMaxDate = count ?? null;
          }
          const ageDays = maxDate != null ? Math.floor((Date.now() - Date.parse(`${maxDate}T00:00:00Z`)) / 864e5) : null;
          const healthy = ageDays != null && ageDays <= 4;
          return Response.json(
            {
              ok: true,
              maxDate,
              ageDays,
              healthy,
              symbolsOnMaxDate: symbolsOnMaxDate ?? null,
              checkedAt: now.toISOString()
            },
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (e) {
          return Response.json(
            { ok: false, error: e?.message ?? "freshness probe failed", healthy: false },
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
function json$l(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
const Route$1m = createFileRoute("/api/public/hooks/db-size")({
  server: {
    handlers: {
      // Allow GET for manual/ad-hoc checks and POST for cron job calls.
      GET: async () => {
        return handle();
      },
      POST: async () => {
        return handle();
      }
    }
  }
});
async function handle() {
  try {
    const { data, error } = await supabaseAdmin$5.rpc("get_db_size");
    if (error) {
      return json$l({ ok: false, error: error.message }, 500);
    }
    const row = (data ?? [])[0];
    if (!row) {
      return json$l({ ok: false, error: "get_db_size returned no rows" }, 500);
    }
    const tableCount = DATA_TABLE_NAMES.length;
    return json$l({
      ok: true,
      total_bytes: row.total_bytes,
      human_size: row.human_size,
      table_count: tableCount,
      checked_at: (/* @__PURE__ */ new Date()).toISOString()
    });
  } catch (e) {
    console.error("[db-size] handler error:", e);
    return json$l(
      {
        ok: false,
        error: String(e?.message || e).slice(0, 300)
      },
      500
    );
  }
}
const THRESHOLD_PCT = -3;
const Route$1l = createFileRoute("/api/public/hooks/drawdown-guard")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
          const [recsRes, positionsRes] = await Promise.all([
            supabaseAdmin$5.from("recommendations").select("realized_pct, outcome, created_at").gte("created_at", since).eq("rejected_by_rules", false).neq("outcome", "pending").not("realized_pct", "is", null),
            supabaseAdmin$5.from("positions").select("pnl_pct, status, updated_at").gte("updated_at", since).eq("status", "closed").not("pnl_pct", "is", null)
          ]);
          const recs = recsRes.data ?? [];
          const pos = positionsRes.data ?? [];
          const allPct = [...recs.map((r) => Number(r.realized_pct)), ...pos.map((p) => Number(p.pnl_pct))].filter((n2) => Number.isFinite(n2));
          const n = allPct.length;
          if (n < 3) return Response.json({ ok: true, skipped: "insufficient_data", samples: n });
          const avg = allPct.reduce((s, x) => s + x, 0) / n;
          const losses = allPct.filter((x) => x < 0).length;
          const losses_pct = losses / n * 100;
          if (avg > THRESHOLD_PCT) {
            return Response.json({ ok: true, healthy: true, avg, samples: n });
          }
          const lines = [];
          lines.push("⚠️ <b>تحذير: حارس الانخفاض مُفعَّل</b>");
          lines.push("");
          lines.push(`متوسط أداء آخر 7 أيام: <b>${avg.toFixed(2)}%</b> على ${n} صفقة`);
          lines.push(`نسبة الصفقات الخاسرة: <b>${losses_pct.toFixed(0)}%</b>`);
          lines.push("");
          lines.push("💡 <b>توصية:</b>");
          lines.push("• قلّل حجم المراكز الجديدة مؤقتًا (لـ 50% من المعتاد).");
          lines.push("• ركّز فقط على ترشيحات بثقة ≥ 75%.");
          lines.push("• راجع المراكز المفتوحة وفكّر في تشديد وقف الخسارة.");
          lines.push("• استنّى تأكيد اتجاه السوق قبل توسيع التعرّض.");
          const tg = await sendTelegram$1(lines.join("\n"));
          return Response.json({ ok: true, alert: true, avg, losses_pct, samples: n, telegram: tg });
        } catch (e) {
          console.error("[drawdown-guard] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
function classify$1(score) {
  const sentiment = score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
  const abs = Math.abs(score);
  const impact_level = abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";
  return { sentiment, impact_level };
}
function extractHeadlines(markdown, limit) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  const re = /\[([^\]]+)\]\((https?:\/\/www\.mubasher\.info\/news\/[^\s)]+)\)/g;
  let m;
  while ((m = re.exec(markdown)) !== null) {
    const title = m[1].trim().replace(/\s+/g, " ");
    const url = m[2].trim();
    if (title.length < 10) continue;
    if (seen.has(title)) continue;
    seen.add(title);
    out.push({ title, url });
    if (out.length >= limit) break;
  }
  return out;
}
async function scrapeMubasher(symbol) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return null;
  const client = new index_default({ apiKey });
  const url = `https://www.mubasher.info/markets/EGX/stocks/${symbol}/news/`;
  try {
    const res = await client.scrape(url, {
      formats: ["markdown"],
      onlyMainContent: true
    });
    const md = res.markdown ?? res.data?.markdown ?? null;
    return typeof md === "string" ? md : null;
  } catch {
    return null;
  }
}
async function analyzeBatch$1(symbol, nameAr, headlines) {
  if (headlines.length === 0) return [];
  const prompt = `أنت محلل أخبار مالية لسهم ${symbol} (${nameAr}) في البورصة المصرية.
لكل عنوان، أعطِ score من -1 (سلبي جداً) إلى +1 (إيجابي جداً) من منظور تأثيره المتوقع على سعر السهم خلال 5 أيام.
ركّز على: أرباح، صفقات، توسع، عقود، توزيعات، تخفيضات، خسائر، تحقيقات، تخفيض تصنيف.
تجاهل العناوين العامة أو غير المتعلقة بالسهم تحديداً (أعطها 0).

أعد JSON فقط:
{"scores":[0.5,-0.3,...]}
(نفس ترتيب العناوين، نفس العدد)

العناوين:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
  const raw = await chatWithFallback({
    messages: [
      { role: "system", content: "Return strict JSON only. No markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0,
    timeoutMs: 15e3
  });
  if (!raw) return headlines.map(() => 0);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return headlines.map(() => 0);
    const parsed = JSON.parse(m[0]);
    const arr = Array.isArray(parsed.scores) ? parsed.scores : [];
    return headlines.map((_, i) => {
      const v = Number(arr[i]);
      if (!Number.isFinite(v)) return 0;
      return Math.max(-1, Math.min(1, v));
    });
  } catch {
    return headlines.map(() => 0);
  }
}
async function existingHeadlines$1(symbol) {
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString();
  const { data } = await supabaseAdmin$5.from("news_sentiment").select("headline").eq("symbol", symbol).gte("published_at", since);
  const set = /* @__PURE__ */ new Set();
  for (const r of data ?? []) {
    if (r.headline) set.add(String(r.headline).trim());
  }
  return set;
}
async function enrichNewsFromMubasher(opts2) {
  const maxPerSymbol = opts2?.maxPerSymbol ?? 8;
  const concurrency = opts2?.concurrency;
  const result = {
    stocks_scanned: 0,
    stocks_with_page: 0,
    stocks_with_matches: 0,
    headlines_found: 0,
    headlines_analyzed: 0,
    rows_inserted: 0,
    errors: []
  };
  let query = supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_active", true);
  if (opts2?.onlySymbols && opts2.onlySymbols.length > 0) {
    query = query.in("symbol", opts2.onlySymbols);
  }
  const { data: stocks, error } = await query;
  if (error) {
    result.errors.push(`stocks: ${error.message}`);
    return result;
  }
  if (!stocks || stocks.length === 0) return result;
  result.stocks_scanned = stocks.length;
  for (let i = 0; i < stocks.length; i += concurrency) {
    const slice = stocks.slice(i, i + concurrency);
    await Promise.all(
      slice.map(async (s) => {
        try {
          const md = await scrapeMubasher(s.symbol);
          if (!md) return;
          result.stocks_with_page += 1;
          const items = extractHeadlines(md, maxPerSymbol);
          if (items.length === 0) return;
          result.headlines_found += items.length;
          const existing = await existingHeadlines$1(s.symbol);
          const toAnalyze = items.filter(
            (it) => !existing.has(it.title.trim())
          );
          if (toAnalyze.length === 0) return;
          const scores = await analyzeBatch$1(
            s.symbol,
            s.name_ar ?? s.symbol,
            toAnalyze.map((it) => it.title)
          );
          result.headlines_analyzed += toAnalyze.length;
          const rows = [];
          for (let j2 = 0; j2 < toAnalyze.length; j2++) {
            const it = toAnalyze[j2];
            const sc = scores[j2] ?? 0;
            if (Math.abs(sc) < 0.15) continue;
            const { sentiment, impact_level } = classify$1(sc);
            rows.push({
              symbol: s.symbol,
              headline: it.title.trim(),
              source_url: it.url,
              source_name: "mubasher-firecrawl",
              published_at: (/* @__PURE__ */ new Date()).toISOString(),
              sentiment,
              sentiment_score: sc,
              impact_level,
              ai_model: "gemini-2.5-flash"
            });
          }
          if (rows.length === 0) return;
          result.stocks_with_matches += 1;
          const { error: insErr } = await supabaseAdmin$5.from("news_sentiment").insert(rows);
          if (insErr) {
            result.errors.push(`${s.symbol}: ${insErr.message}`);
          } else {
            result.rows_inserted += rows.length;
          }
        } catch (e) {
          result.errors.push(`${s.symbol}: ${e.message}`);
        }
      })
    );
  }
  return result;
}
async function run(request) {
  const url = new URL(request.url);
  const max = Number(url.searchParams.get("max") ?? "8");
  const symbolsParam = url.searchParams.get("symbols");
  const onlySymbols = symbolsParam ? symbolsParam.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : void 0;
  try {
    const result = await enrichNewsFromMubasher({
      maxPerSymbol: Number.isFinite(max) && max > 0 ? max : 8,
      concurrency: 3,
      onlySymbols
    });
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
const Route$1k = createFileRoute("/api/public/hooks/enrich-news-mubasher")({
  server: {
    handlers: {
      GET: async ({ request }) => run(request),
      POST: async ({ request }) => run(request)
    }
  }
});
function classify(score) {
  const sentiment = score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
  const abs = Math.abs(score);
  const impact_level = abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";
  return { sentiment, impact_level };
}
function parseDate(s) {
  if (!s) return null;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}
async function analyzeBatch(symbol, nameAr, headlines) {
  if (headlines.length === 0) return [];
  const prompt = `أنت محلل أخبار مالية لسهم ${symbol} (${nameAr}) في البورصة المصرية.
لكل عنوان، أعطِ score من -1 (سلبي جداً) إلى +1 (إيجابي جداً) من منظور تأثيره المتوقع على سعر السهم خلال 5 أيام.
ركّز على: أرباح، صفقات، توسع، عقود، توزيعات، تخفيضات، خسائر، تحقيقات، تخفيض تصنيف.
تجاهل العناوين العامة أو غير المتعلقة بالسهم تحديداً (أعطها 0).

أعد JSON فقط بهذا الشكل:
{"scores":[0.5,-0.3,...]}
(نفس ترتيب العناوين، نفس العدد)

العناوين:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
  const raw = await chatWithFallback({
    messages: [
      { role: "system", content: "Return strict JSON only. No markdown." },
      { role: "user", content: prompt }
    ],
    temperature: 0,
    timeoutMs: 12e3
  });
  if (!raw) return headlines.map(() => 0);
  try {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return headlines.map(() => 0);
    const parsed = JSON.parse(m[0]);
    const arr = Array.isArray(parsed.scores) ? parsed.scores : [];
    return headlines.map((_, i) => {
      const v = Number(arr[i]);
      if (!Number.isFinite(v)) return 0;
      return Math.max(-1, Math.min(1, v));
    });
  } catch {
    return headlines.map(() => 0);
  }
}
async function existingHeadlines(symbol) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
  const { data } = await supabaseAdmin$5.from("news_sentiment").select("headline").eq("symbol", symbol).gte("published_at", since);
  const set = /* @__PURE__ */ new Set();
  for (const r of data ?? []) {
    if (r.headline) set.add(String(r.headline).trim());
  }
  return set;
}
async function enrichNewsFromRss(opts2) {
  const maxPerSymbol = opts2?.maxPerSymbol ?? 5;
  const result = {
    stocks_scanned: 0,
    stocks_with_matches: 0,
    headlines_analyzed: 0,
    rows_inserted: 0,
    errors: []
  };
  const { data: stocks, error } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_active", true);
  if (error) {
    result.errors.push(`stocks: ${error.message}`);
    return result;
  }
  if (!stocks || stocks.length === 0) return result;
  result.stocks_scanned = stocks.length;
  const CONCURRENCY = 4;
  for (let i = 0; i < stocks.length; i += CONCURRENCY) {
    const slice = stocks.slice(i, i + CONCURRENCY);
    await Promise.all(
      slice.map(async (s) => {
        try {
          const items = await fetchRssItemsForSymbol({
            symbol: s.symbol,
            nameAr: s.name_ar ?? s.symbol,
            limit: maxPerSymbol
          });
          if (items.length === 0) return;
          const existing = await existingHeadlines(s.symbol);
          const fresh = [];
          const toAnalyze = items.filter((it) => !existing.has(it.title.trim()));
          if (toAnalyze.length === 0) return;
          const scores = await analyzeBatch(
            s.symbol,
            s.name_ar ?? s.symbol,
            toAnalyze.map((it) => it.title)
          );
          result.headlines_analyzed += toAnalyze.length;
          for (let j2 = 0; j2 < toAnalyze.length; j2++) {
            const it = toAnalyze[j2];
            const sc = scores[j2] ?? 0;
            if (Math.abs(sc) < 0.15) continue;
            const { sentiment, impact_level } = classify(sc);
            fresh.push({
              headline: it.title.trim(),
              score: sc,
              sentiment,
              impact_level,
              pubDate: parseDate(it.pubDate)
            });
          }
          if (fresh.length === 0) return;
          result.stocks_with_matches += 1;
          const rows = fresh.map((f) => ({
            symbol: s.symbol,
            headline: f.headline,
            source_name: "rss-groq",
            published_at: f.pubDate ?? (/* @__PURE__ */ new Date()).toISOString(),
            sentiment: f.sentiment,
            sentiment_score: f.score,
            impact_level: f.impact_level,
            ai_model: "llama-3.3-70b-versatile"
          }));
          const { error: insErr } = await supabaseAdmin$5.from("news_sentiment").insert(rows);
          if (insErr) {
            result.errors.push(`${s.symbol}: ${insErr.message}`);
          } else {
            result.rows_inserted += rows.length;
          }
        } catch (e) {
          result.errors.push(`${s.symbol}: ${e.message}`);
        }
      })
    );
  }
  return result;
}
const Route$1j = createFileRoute("/api/public/hooks/enrich-news-rss")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const result = await enrichNewsFromRss({ maxPerSymbol: 5 });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: e.message },
            { status: 500 }
          );
        }
      },
      GET: async () => {
        try {
          const result = await enrichNewsFromRss({ maxPerSymbol: 5 });
          return Response.json({ ok: true, ...result });
        } catch (e) {
          return Response.json(
            { ok: false, error: e.message },
            { status: 500 }
          );
        }
      }
    }
  }
});
const Route$1i = createFileRoute("/api/public/hooks/eod-learn")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow2.getDay();
        if (dow < 0 || dow > 4) return Response.json({ ok: true, skipped: "non_trading_day" });
        const today = cairoNow2.toISOString().slice(0, 10);
        const dayStartIso = (/* @__PURE__ */ new Date(`${today}T07:00:00Z`)).toISOString();
        const dayEndIso = (/* @__PURE__ */ new Date(`${today}T13:00:00Z`)).toISOString();
        const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_sharia", true).eq("is_active", true);
        const universe = stocks ?? [];
        if (!universe.length) return Response.json({ ok: false, error: "no_universe" });
        const symbols = universe.map((s) => s.symbol);
        const nameMap = new Map(universe.map((s) => [s.symbol, s.name_ar ?? s.symbol]));
        const [breadth, ticksRes, candlesRes, snapsRes, picksRes, newsRes, marketRes, prevCandlesRes] = await Promise.all([
          computeMarketBreadth$1().catch(() => null),
          supabaseAdmin$5.from("live_ticks").select("symbol, price, volume, ts").gte("ts", dayStartIso).lte("ts", dayEndIso).in("symbol", symbols),
          supabaseAdmin$5.from("daily_candles").select("symbol, open, high, low, close, volume, date").eq("date", today).in("symbol", symbols),
          supabaseAdmin$5.from("stock_snapshots").select("symbol, rsi14, macd, macd_hist, ema9, ema21, sma50, atr14, vol_ratio, composite_score, ts").gte("ts", dayStartIso).in("symbol", symbols).order("ts", { ascending: false }),
          supabaseAdmin$5.from("daily_picks").select("symbol, confidence, reasons, status, pnl_pct").eq("pick_date", today),
          supabaseAdmin$5.from("news_sentiment").select("symbol, sentiment_score, impact_level").gte("published_at", dayStartIso).in("symbol", symbols),
          supabaseAdmin$5.from("market_snapshots").select("change_pct, trend, regime").eq("date", today).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin$5.from("daily_candles").select("symbol, close").lt("date", today).in("symbol", symbols).order("date", { ascending: false })
        ]);
        const ticksBySym = /* @__PURE__ */ new Map();
        for (const t of ticksRes.data ?? []) {
          const arr = ticksBySym.get(t.symbol) ?? [];
          arr.push({ price: Number(t.price), volume: t.volume, ts: t.ts });
          ticksBySym.set(t.symbol, arr);
        }
        const candleBySym = new Map((candlesRes.data ?? []).map((c) => [c.symbol, c]));
        const snapBySym = /* @__PURE__ */ new Map();
        for (const s of snapsRes.data ?? []) if (!snapBySym.has(s.symbol)) snapBySym.set(s.symbol, s);
        const pickBySym = new Map((picksRes.data ?? []).map((p) => [p.symbol, p]));
        const prevCloseBySym = /* @__PURE__ */ new Map();
        for (const c of prevCandlesRes.data ?? []) if (!prevCloseBySym.has(c.symbol)) prevCloseBySym.set(c.symbol, Number(c.close));
        const newsAgg = /* @__PURE__ */ new Map();
        for (const n of newsRes.data ?? []) {
          const a = newsAgg.get(n.symbol) ?? { count: 0, sumScore: 0, highImpact: 0 };
          a.count++;
          a.sumScore += Number(n.sentiment_score ?? 0);
          if (n.impact_level === "high") a.highImpact++;
          newsAgg.set(n.symbol, a);
        }
        const market = marketRes.data;
        const rows = universe.map((s) => {
          const sym = s.symbol;
          const ticks = ticksBySym.get(sym) ?? [];
          const candle = candleBySym.get(sym);
          const snap = snapBySym.get(sym) ?? null;
          const pick = pickBySym.get(sym);
          const news = newsAgg.get(sym);
          const prevClose = prevCloseBySym.get(sym) ?? null;
          let iFirst = null, iLast = null;
          let iHigh = -Infinity, iLow = Infinity, iVol = 0;
          let maxUp = 0, maxDown = 0;
          if (ticks.length) {
            iFirst = ticks[0].price;
            iLast = ticks[ticks.length - 1].price;
            for (const t of ticks) {
              if (t.price > iHigh) iHigh = t.price;
              if (t.price < iLow) iLow = t.price;
              if (t.volume) iVol += t.volume;
              if (iFirst) {
                const pct2 = (t.price - iFirst) / iFirst * 100;
                if (pct2 > maxUp) maxUp = pct2;
                if (pct2 < maxDown) maxDown = pct2;
              }
            }
          }
          const close = candle ? Number(candle.close) : iLast;
          const changePct = close != null && prevClose ? (close - prevClose) / prevClose * 100 : null;
          return {
            trade_date: today,
            symbol: sym,
            name_ar: nameMap.get(sym) ?? null,
            open: candle ? Number(candle.open) : iFirst,
            high: candle ? Number(candle.high) : iHigh === -Infinity ? null : iHigh,
            low: candle ? Number(candle.low) : iLow === Infinity ? null : iLow,
            close,
            volume: candle ? Number(candle.volume) : null,
            change_pct: changePct,
            prev_close: prevClose,
            intraday_first: iFirst,
            intraday_last: iLast,
            intraday_high: iHigh === -Infinity ? null : iHigh,
            intraday_low: iLow === Infinity ? null : iLow,
            intraday_tick_count: ticks.length,
            intraday_max_drawup_pct: maxUp,
            intraday_max_drawdown_pct: maxDown,
            intraday_volume: iVol || null,
            rsi14: snap ? Number(snap.rsi14 ?? null) : null,
            macd: snap ? Number(snap.macd ?? null) : null,
            macd_hist: snap ? Number(snap.macd_hist ?? null) : null,
            ema9: snap ? Number(snap.ema9 ?? null) : null,
            ema21: snap ? Number(snap.ema21 ?? null) : null,
            sma50: snap ? Number(snap.sma50 ?? null) : null,
            atr14: snap ? Number(snap.atr14 ?? null) : null,
            vol_ratio: snap ? Number(snap.vol_ratio ?? null) : null,
            composite_score: snap ? Number(snap.composite_score ?? null) : null,
            breadth_pct: breadth,
            market_trend: market?.trend ?? null,
            market_regime: market?.regime ?? null,
            egx30_change_pct: market ? Number(market.change_pct ?? null) : null,
            news_count: news?.count ?? 0,
            news_sentiment_avg: news && news.count ? news.sumScore / news.count : null,
            news_high_impact_count: news?.highImpact ?? 0,
            was_picked: !!pick,
            was_candidate: maxUp >= 2,
            pick_confidence: pick ? Number(pick.confidence) : null,
            pick_reasons: pick?.reasons ?? null,
            pick_outcome: pick?.status ?? null,
            pick_pnl_pct: pick?.pnl_pct != null ? Number(pick.pnl_pct) : null
          };
        });
        const { error: upErr } = await supabaseAdmin$5.from("daily_intelligence").upsert(rows, { onConflict: "trade_date,symbol" });
        const y = new Date(cairoNow2);
        y.setDate(y.getDate() - 1);
        while (y.getDay() === 5 || y.getDay() === 6) y.setDate(y.getDate() - 1);
        const ydayISO = y.toISOString().slice(0, 10);
        const { data: ydayRows } = await supabaseAdmin$5.from("daily_intelligence").select("symbol, close").eq("trade_date", ydayISO);
        let labelsFilled = 0;
        if (ydayRows?.length) {
          const todayCloseBySym = new Map(rows.map((r) => [r.symbol, r.close]));
          for (const yrow of ydayRows) {
            const yClose = Number(yrow.close);
            const tClose = todayCloseBySym.get(yrow.symbol);
            if (!yClose || tClose == null) continue;
            const nextRet = (tClose - yClose) / yClose * 100;
            await supabaseAdmin$5.from("daily_intelligence").update({ next_day_return_pct: nextRet }).eq("trade_date", ydayISO).eq("symbol", yrow.symbol);
            labelsFilled++;
          }
        }
        return Response.json({
          ok: !upErr,
          error: upErr?.message ?? null,
          trade_date: today,
          rows_upserted: rows.length,
          breadth_pct: breadth,
          labels_backfilled: labelsFilled,
          ticks_total: (ticksRes.data ?? []).length,
          news_total: (newsRes.data ?? []).length
        });
      }
    }
  }
});
const Route$1h = createFileRoute("/api/public/hooks/eod-recap")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const todayStart = /* @__PURE__ */ new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayISO = todayStart.toISOString();
          const today = todayISO.slice(0, 10);
          const [recsRes, picksRes, alertsRes, marketRes, positionsRes] = await Promise.all([
            supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, outcome, realized_pct, created_at").gte("created_at", todayISO).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).order("confidence", { ascending: false }),
            supabaseAdmin$5.from("daily_picks").select("symbol, status, pnl_pct, confidence, target_pct, pick_date").eq("pick_date", today),
            supabaseAdmin$5.from("sell_alerts").select("symbol, alert_type, created_at").gte("created_at", todayISO),
            supabaseAdmin$5.from("market_snapshots").select("index_symbol, close, change_pct, trend").order("date", { ascending: false }).limit(1).maybeSingle(),
            supabaseAdmin$5.from("positions").select("symbol, pnl_pct, status, exit_reason").gte("updated_at", todayISO).eq("status", "closed")
          ]);
          const recs = recsRes.data ?? [];
          const picks = picksRes.data ?? [];
          const alerts = alertsRes.data ?? [];
          const closed = positionsRes.data ?? [];
          const m = marketRes.data;
          const resolved = recs.filter((r) => r.outcome !== "pending" && r.realized_pct != null);
          const wins = resolved.filter((r) => (r.realized_pct ?? 0) > 0).length;
          const accuracy = resolved.length ? wins / resolved.length * 100 : null;
          const lines = [];
          lines.push("🌇 <b>ملخص نهاية اليوم</b>");
          lines.push((/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
          lines.push("");
          if (m) {
            const arrow = (m.change_pct ?? 0) >= 0 ? "🟢" : "🔴";
            lines.push(`${arrow} <b>${escapeHtml(m.index_symbol ?? "السوق")}:</b> ${Number(m.close ?? 0).toFixed(2)} (${Number(m.change_pct ?? 0).toFixed(2)}%) — ${escapeHtml(m.trend ?? "—")}`);
            lines.push("");
          }
          lines.push(`🎯 توصيات اليوم: <b>${recs.length}</b> · مكتملة: <b>${resolved.length}</b>${accuracy != null ? ` · دقة ${accuracy.toFixed(0)}%` : ""}`);
          lines.push(`⭐ ترشيحات اليوم: <b>${picks.length}</b>`);
          lines.push(`🚨 تنبيهات بيع: <b>${alerts.length}</b>`);
          if (closed.length) {
            lines.push(`💼 مراكز أُغلقت اليوم: <b>${closed.length}</b>`);
            for (const c of closed.slice(0, 5)) {
              const arrow = (c.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
              lines.push(`${arrow} ${escapeHtml(c.symbol)} — ${c.pnl_pct?.toFixed(2) ?? "—"}% (${escapeHtml(c.exit_reason ?? c.status)})`);
            }
          }
          if (resolved.length) {
            const sorted = [...resolved].sort((a, b) => Number(b.realized_pct ?? 0) - Number(a.realized_pct ?? 0));
            const best = sorted[0];
            const worst = sorted[sorted.length - 1];
            lines.push("");
            lines.push("🏆 <b>أبرز نتائج اليوم:</b>");
            lines.push(`🟢 ${escapeHtml(best.symbol)} — ${Number(best.realized_pct).toFixed(2)}%`);
            if (best !== worst) lines.push(`🔴 ${escapeHtml(worst.symbol)} — ${Number(worst.realized_pct).toFixed(2)}%`);
          }
          if (picks.length) {
            lines.push("");
            lines.push("⭐ <b>ترشيحات اليوم (للمتابعة بكرا):</b>");
            for (const p of picks.slice(0, 5)) {
              lines.push(`• ${escapeHtml(p.symbol)} — ثقة ${p.confidence}% · هدف +${Number(p.target_pct ?? 0).toFixed(1)}%`);
            }
          }
          const tg = await sendTelegram$1(lines.join("\n"));
          return Response.json({ ok: true, telegram: tg, recs: recs.length, picks: picks.length, alerts: alerts.length });
        } catch (e) {
          console.error("[eod-recap] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const BodySchema$4 = object({
  tables: array(string().trim().min(1)).min(1).max(10),
  start: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: string().regex(/^\d{4}-\d{2}-\d{2}$/)
});
const ALLOWED$2 = DATA_TABLE_NAMES;
const MAGIC = Buffer.from("MKB2", "ascii");
function json$k(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function isoAddDays$1(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function expandTables$1(tables) {
  const set = /* @__PURE__ */ new Set();
  for (const t of tables) {
    const name = String(t || "").trim();
    if (!name) continue;
    if (name.toLowerCase() === "all") {
      for (const a of ALLOWED$2) set.add(a);
    } else if (ALLOWED$2.includes(name)) set.add(name);
  }
  return ALLOWED$2.filter((t) => set.has(t));
}
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}
function splitCsvLines(text) {
  const lines = [];
  const len = text.length;
  let start = 0;
  let inQ = false;
  for (let i = 0; i < len; i++) {
    const c = text.charCodeAt(i);
    if (c === 34) inQ = !inQ;
    else if (c === 10 && !inQ) {
      let end = i;
      if (end > start && text.charCodeAt(end - 1) === 13) end--;
      lines.push(text.slice(start, end));
      start = i + 1;
    }
  }
  if (start < len) {
    let end = len;
    if (end > start && text.charCodeAt(end - 1) === 13) end--;
    const last = text.slice(start, end);
    if (last.length > 0) lines.push(last);
  }
  return lines;
}
function uvarint(v) {
  const out = [];
  let x = v;
  do {
    let b = x % 128;
    x = Math.floor(x / 128);
    if (x > 0) b |= 128;
    out.push(b);
  } while (x > 0);
  return Buffer.from(out);
}
const TAG_DICT = 1;
const TAG_PLAIN = 2;
const TAG_INT_DELTA = 16;
const TAG_INT_DIRECT = 17;
const TAG_FLOAT = 32;
const TAG_BOOL = 48;
const INT_RE = /^-?\d+$/;
const INT64_MIN = -9223372036854775808n;
const INT64_MAX = 9223372036854775807n;
class ByteSink {
  chunks = [];
  cur = Buffer.allocUnsafe(1 << 20);
  used = 0;
  ensure(extra) {
    if (this.used + extra <= this.cur.length) return;
    this.chunks.push(this.cur.subarray(0, this.used));
    this.cur = Buffer.allocUnsafe(Math.max(1 << 20, extra));
    this.used = 0;
  }
  pushBuf(b) {
    this.ensure(b.length);
    b.copy(this.cur, this.used);
    this.used += b.length;
    return this;
  }
  pushByte(b) {
    this.ensure(1);
    this.cur[this.used++] = b;
    return this;
  }
  pushUvar(v) {
    this.ensure(10);
    let x = v;
    do {
      let byte = x % 128;
      x = Math.floor(x / 128);
      if (x > 0) byte |= 128;
      this.cur[this.used++] = byte;
    } while (x > 0);
    return this;
  }
  pushSvar(v) {
    this.ensure(10);
    const zz = v >= 0n ? v << 1n : (-v << 1n) - 1n;
    let x = zz;
    do {
      let byte = Number(x & 0x7fn);
      x >>= 7n;
      if (x > 0n) byte |= 128;
      this.cur[this.used++] = byte;
    } while (x > 0n);
    return this;
  }
  finish() {
    this.chunks.push(this.cur.subarray(0, this.used));
    const out = Buffer.concat(this.chunks);
    this.chunks = [];
    this.cur = Buffer.alloc(0);
    this.used = 0;
    return out;
  }
}
function encodeColumn(sink, values) {
  const n = values.length;
  const nullBits = Buffer.alloc(Math.ceil(n / 8));
  let nn = 0;
  for (let i = 0; i < n; i++) {
    if (values[i] === "") nullBits[i >> 3] |= 1 << i % 8;
    else nn++;
  }
  let allBool = true;
  let allInt = true;
  let allFloat = true;
  if (nn === 0) {
    allBool = allInt = allFloat = false;
  } else {
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      if (v !== "true" && v !== "false") allBool = false;
      if (!INT_RE.test(v)) allInt = false;
      const num = Number(v);
      if (!Number.isFinite(num) || String(num) !== v) {
        allFloat = false;
        allInt = false;
      }
    }
  }
  let ints = null;
  let monotonic = true;
  if (allInt) {
    const arr = new Array(n);
    let ok = true;
    let prev = null;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") {
        arr[i] = null;
        continue;
      }
      const b = BigInt(v);
      if (String(b) !== v || b < INT64_MIN || b > INT64_MAX) {
        ok = false;
        break;
      }
      arr[i] = b;
      if (prev !== null && b < prev) monotonic = false;
      prev = b;
    }
    if (ok) ints = arr;
    else allInt = false;
  }
  if (allBool) {
    const packed = Buffer.alloc(Math.ceil(nn / 8));
    let k = 0;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      if (v === "true") packed[k >> 3] |= 1 << k % 8;
      k++;
    }
    sink.pushByte(TAG_BOOL).pushBuf(nullBits).pushBuf(packed);
    return TAG_BOOL;
  }
  if (allInt && ints) {
    if (monotonic) {
      let first = 0n;
      let firstIdx = -1;
      for (let i = 0; i < n; i++) {
        if (ints[i] !== null) {
          first = ints[i];
          firstIdx = i;
          break;
        }
      }
      const seed = Buffer.alloc(8);
      seed.writeBigInt64BE(first);
      sink.pushByte(TAG_INT_DELTA).pushBuf(nullBits).pushBuf(seed);
      let prev = first;
      for (let i = firstIdx + 1; i < n; i++) {
        const cur = ints[i];
        if (cur === null) continue;
        sink.pushSvar(cur - prev);
        prev = cur;
      }
      return TAG_INT_DELTA;
    }
    sink.pushByte(TAG_INT_DIRECT).pushBuf(nullBits);
    for (let i = 0; i < n; i++) {
      const b = ints[i];
      if (b === null) continue;
      sink.pushSvar(b);
    }
    return TAG_INT_DIRECT;
  }
  if (allFloat) {
    const buf = Buffer.alloc(8 * nn);
    let k = 0;
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      buf.writeDoubleBE(Number(v), k * 8);
      k++;
    }
    sink.pushByte(TAG_FLOAT).pushBuf(nullBits).pushBuf(buf);
    return TAG_FLOAT;
  }
  const uniq = /* @__PURE__ */ new Map();
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === "") continue;
    if (!uniq.has(v)) uniq.set(v, uniq.size);
  }
  if (uniq.size > 0 && uniq.size <= Math.max(64, Math.floor(n * 0.1))) {
    sink.pushByte(TAG_DICT).pushBuf(nullBits).pushUvar(uniq.size);
    for (const s of uniq.keys()) {
      const b = Buffer.from(s, "utf-8");
      sink.pushUvar(b.length).pushBuf(b);
    }
    for (let i = 0; i < n; i++) {
      const v = values[i];
      if (v === "") continue;
      sink.pushUvar(uniq.get(v));
    }
    return TAG_DICT;
  }
  sink.pushByte(TAG_PLAIN).pushBuf(nullBits);
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === "") continue;
    const b = Buffer.from(v, "utf-8");
    sink.pushUvar(b.length).pushBuf(b);
  }
  return TAG_PLAIN;
}
function encodeTableCsv(csvText) {
  const lines = splitCsvLines(csvText);
  if (lines.length === 0) return { n: 0, columns: [], body: Buffer.alloc(0) };
  const header = parseCsvLine(lines[0]);
  const n = lines.length - 1;
  const cols = header.map(() => []);
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    for (let j2 = 0; j2 < header.length; j2++) cols[j2].push(cells[j2] ?? "");
  }
  const sink = new ByteSink();
  for (let j2 = 0; j2 < header.length; j2++) {
    const nb = Buffer.from(header[j2], "utf-8");
    sink.pushUvar(nb.length).pushBuf(nb);
    encodeColumn(sink, cols[j2]);
  }
  return { n, columns: header, body: zlib$2.deflateSync(sink.finish(), { level: 9 }) };
}
async function readDayFile(table, date) {
  const csvFp = path__default.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = path__default.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);
  if (fs__default.existsSync(csvFp)) return fs__default.readFileSync(csvFp);
  if (fs__default.existsSync(gzFp)) return zlib$2.gunzipSync(fs__default.readFileSync(gzFp));
  return null;
}
const Route$1g = createFileRoute("/api/public/hooks/export-binary")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json$k({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) return json$k({ ok: false, local: false, reason: "PROD" }, 200);
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$k({ ok: false, local: true, reason: "BAD_JSON" }, 400);
        }
        const parsed = BodySchema$4.safeParse(raw);
        if (!parsed.success) return json$k({ ok: false, local: true, reason: "BAD_BODY" }, 400);
        const tables = expandTables$1(parsed.data.tables);
        if (tables.length === 0) return json$k({ ok: false, local: true, reason: "NO_TABLE" }, 400);
        if (parsed.data.start > parsed.data.end)
          return json$k({ ok: false, local: true, reason: "INVALID_RANGE" }, 400);
        const dates = [];
        let cur = parsed.data.start;
        while (cur <= parsed.data.end) {
          dates.push(cur);
          cur = isoAddDays$1(cur, 1);
        }
        let tableIdx = 0;
        let dateIdx = 0;
        let wroteMagic = false;
        let closed = false;
        let qualityQueued = false;
        const stream = new ReadableStream({
          async pull(controller) {
            try {
              if (!wroteMagic) {
                wroteMagic = true;
                controller.enqueue(new Uint8Array(MAGIC));
                return;
              }
              while (tableIdx < tables.length) {
                const table = tables[tableIdx];
                const date = dates[dateIdx];
                dateIdx++;
                if (dateIdx >= dates.length) {
                  dateIdx = 0;
                  tableIdx++;
                }
                const buf = await readDayFile(table, date);
                if (!buf) continue;
                const enc = encodeTableCsv(buf.toString("utf-8"));
                if (enc.columns.length === 0) continue;
                const nameB = Buffer.from(table, "utf-8");
                const dateB = Buffer.from(date, "utf-8");
                const section = Buffer.concat([
                  uvarint(nameB.length),
                  nameB,
                  uvarint(dateB.length),
                  dateB,
                  uvarint(enc.n),
                  uvarint(enc.columns.length),
                  uvarint(enc.body.length),
                  enc.body
                ]);
                controller.enqueue(
                  new Uint8Array(section.buffer, section.byteOffset, section.byteLength)
                );
                return;
              }
              if (!closed) {
                if (!qualityQueued) {
                  qualityQueued = true;
                  const qRows = [];
                  for (const table of tables) {
                    for (const date of dates) {
                      const qp = path__default.join(ARCHIVE_ROOT, table, `${date}.quality.json`);
                      if (!fs__default.existsSync(qp)) continue;
                      try {
                        const q = JSON.parse(fs__default.readFileSync(qp, "utf-8"));
                        for (const s of q.symbols ?? []) {
                          qRows.push([
                            date,
                            table,
                            s.symbol,
                            s.firstTickCairo ?? "",
                            s.lastTickCairo ?? "",
                            s.openReliable,
                            s.closeReliable,
                            s.fullSessionReliable,
                            s.likelyReason ?? ""
                          ].join(","));
                        }
                      } catch {
                      }
                    }
                  }
                  if (qRows.length > 0) {
                    const qCsv = [
                      "date,table,symbol,first_tick,last_tick,open_reliable,close_reliable,full_session_reliable,likely_reason",
                      ...qRows
                    ].join("\n") + "\n";
                    const enc = encodeTableCsv(qCsv);
                    const nameB = Buffer.from("_quality", "utf-8");
                    const dateB = Buffer.from(parsed.data.start, "utf-8");
                    const section = Buffer.concat([
                      uvarint(nameB.length),
                      nameB,
                      uvarint(dateB.length),
                      dateB,
                      uvarint(enc.n),
                      uvarint(enc.columns.length),
                      uvarint(enc.body.length),
                      enc.body
                    ]);
                    controller.enqueue(
                      new Uint8Array(section.buffer, section.byteOffset, section.byteLength)
                    );
                    return;
                  }
                }
                closed = true;
                controller.close();
              }
            } catch (e) {
              if (!closed) {
                closed = true;
                controller.error(e);
              }
            }
          }
        });
        const headers = {
          "Content-Type": "application/octet-stream",
          "Cache-Control": "no-store",
          "Content-Disposition": 'attachment; filename="historical_export.mkb2"'
        };
        return new Response(stream, { status: 200, headers });
      }
    }
  }
});
const BodySchema$3 = object({
  tables: array(string().trim().min(1)).min(1).max(10),
  start: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Selection of columns to keep.
  //   "all"  — every column, every row, every byte (heaviest, ~138 MB gz
  //            for 10 days × 6 tables). Lossless, including any future
  //            columns we don't know about today.
  //   "core" — id, symbol, price-like, volume-like, ts (numeric & symbol
  //            columns only). Drops JSON metadata blobs and any string
  //            columns we don't recognise. ~25-40 MB gz for 10 days.
  //   "minimal" — symbol, ts, captured_at and the configured price/volume
  //            columns only. ~10-15 MB gz for 10 days. Best for sharing
  //            or importing into another analytics tool.
  // The trade-off is documented in the UI next to the download button.
  select: _enum(["all", "core", "minimal"]).default("all"),
  // Legacy flag kept for backwards compatibility; ignored when `select`
  // is explicitly set. When true (and select is not "all"), applies
  // additional drop-duplicate-id and created_at-when-equal-ts cleanup.
  compact: boolean().default(true)
});
function selectColumns(rawHeader, mode, table) {
  if (mode === "all") return rawHeader;
  const CORE = /* @__PURE__ */ new Set([
    "id",
    "symbol",
    "ts",
    "captured_at",
    "created_at",
    "price",
    "last_price",
    "ref_price",
    "open_price",
    "volume",
    "total_volume",
    "total_trades",
    "bid",
    "ask",
    "best_bid",
    "best_ask",
    "highest_bid",
    "lowest_ask"
  ]);
  const MINIMAL = /* @__PURE__ */ new Set([
    "id",
    "symbol",
    "ts",
    "captured_at",
    "price",
    "last_price",
    "volume",
    "total_volume",
    "bid",
    "ask",
    "highest_bid",
    "lowest_ask"
  ]);
  const keep = mode === "minimal" ? MINIMAL : CORE;
  return rawHeader.filter((h) => keep.has(h));
}
const ALLOWED$1 = DATA_TABLE_NAMES;
function json$j(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
function isoAddDays(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function expandTables(tables) {
  const set = /* @__PURE__ */ new Set();
  for (const t of tables) {
    const name = String(t || "").trim();
    if (!name) continue;
    if (name.toLowerCase() === "all") {
      for (const a of ALLOWED$1) set.add(a);
    } else if (ALLOWED$1.includes(name)) {
      set.add(name);
    }
  }
  return ALLOWED$1.filter((t) => set.has(t));
}
async function streamLocalDay(table, date, writer, compact, selectMode) {
  const csvFp = path__default.join(ARCHIVE_ROOT, table, `${date}.csv`);
  const gzFp = path__default.join(ARCHIVE_ROOT, table, `${date}.csv.gz`);
  let buf;
  try {
    if (fs__default.existsSync(csvFp)) {
      buf = fs__default.readFileSync(csvFp);
    } else if (fs__default.existsSync(gzFp)) {
      const gz = fs__default.readFileSync(gzFp);
      buf = zlib$2.gunzipSync(gz);
    } else {
      return { ok: false, rawBytes: 0, outBytes: 0 };
    }
  } catch (e) {
    return { ok: false, rawBytes: 0, outBytes: 0 };
  }
  const rawBytes = buf.length;
  const out = compact ? compactCsvBuffer(buf, table, selectMode) : buf;
  const outBytes = out.length;
  await writer.write(out);
  return { ok: true, rawBytes, outBytes };
}
function csvEscapeLocal(v) {
  if (v == null) return "";
  const s = String(v);
  if (/[",\r\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
async function fetchSupabaseDayCsv(table, date) {
  const cfg = DATA_TABLES[table];
  if (!cfg) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: "unknown_table" };
  const tsCol = cfg.timestampCol;
  const [y, m, d] = date.split("-").map(Number);
  const fromIso = `${date}T00:00:00+03:00`;
  const toIso = `${date}T23:59:59.999+03:00`;
  const PAGE = 1e3;
  let from = 0;
  const allRows = [];
  let headerCols = [];
  for (; ; ) {
    const { data, error } = await supabaseAdmin$5.from(table).select("*").gte(tsCol, fromIso).lte(tsCol, toIso).order("id", { ascending: true }).range(from, from + PAGE - 1);
    if (error) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: error.message };
    const page = data ?? [];
    if (page.length === 0) break;
    if (from === 0) headerCols = Object.keys(page[0]);
    for (const row of page) allRows.push(row);
    if (page.length < PAGE) break;
    from += PAGE;
  }
  if (allRows.length === 0) return { ok: false, csv: Buffer.alloc(0), rows: 0, error: "no_rows" };
  const lines = [headerCols.join(",")];
  for (const row of allRows) {
    lines.push(headerCols.map((c) => csvEscapeLocal(row[c])).join(","));
  }
  return { ok: true, csv: Buffer.from(lines.join("\n") + "\n", "utf-8"), rows: allRows.length };
}
async function streamOneDay(table, date, writer, compact, selectMode) {
  const local = await streamLocalDay(table, date, writer, compact, selectMode);
  if (local.ok) return { source: "disk_archive", rawBytes: local.rawBytes, outBytes: local.outBytes };
  const live = await fetchSupabaseDayCsv(table, date);
  if (!live.ok) return { source: "gap", rawBytes: 0, outBytes: 0 };
  const buf = compact ? compactCsvBuffer(live.csv, table, selectMode) : live.csv;
  await writer.write(buf);
  return { source: "supabase_live", rawBytes: live.csv.length, outBytes: buf.length, rows: live.rows };
}
function compactCsvBuffer(buf, table, mode) {
  const text = buf.toString("utf-8");
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return buf;
  const header = parseCsvLineLocal(lines[0]);
  const keep = selectColumns(header, mode);
  const keepIdx = keep.map((name) => header.indexOf(name)).filter((i) => i >= 0);
  const metaIdx = keep.indexOf("meta");
  const tsIdx = keep.indexOf("ts");
  const createdAtIdx = keep.indexOf("created_at");
  const newHeader = keep.join(",");
  const metaMap = /* @__PURE__ */ new Map();
  let metaCounter = 0;
  const newLines = [];
  newLines.push(`# table=${table} select=${mode} compacted=2026-08-30`);
  if (metaIdx >= 0) {
    newLines.push(
      `# meta_map: compact IDs (m0, m1, ...) reference JSON sidecar below`
    );
  }
  newLines.push(newHeader);
  for (let li = 1; li < lines.length; li++) {
    const line = lines[li];
    if (!line) continue;
    const cells = parseCsvLineLocal(line);
    let kept = keepIdx.map((i) => cells[i] ?? "");
    if (metaIdx >= 0) {
      const metaColPos = keep.indexOf("meta");
      if (metaColPos >= 0) {
        const raw = kept[metaColPos] ?? "";
        if (raw && !metaMap.has(raw) && raw.startsWith("{")) {
          const compact = "m" + metaCounter++;
          metaMap.set(raw, compact);
        }
        if (raw) kept[metaColPos] = metaMap.get(raw) ?? "";
      }
    }
    if (tsIdx >= 0 && createdAtIdx >= 0) {
      const tsStr = kept[tsIdx];
      const caStr = kept[createdAtIdx];
      if (tsStr && caStr && roughlyEqualTimestamps(tsStr, caStr)) {
        kept.splice(createdAtIdx, 1);
      }
    }
    newLines.push(kept.map(csvCellLocal).join(","));
  }
  if (metaMap.size > 0) {
    const sidecar = [];
    for (const [orig, compact] of metaMap) {
      sidecar.push(`# meta_map_entry: ${compact}=${JSON.stringify(orig)}`);
    }
    newLines.splice(3, 0, ...sidecar);
  }
  return Buffer.from(newLines.join("\n") + "\n", "utf-8");
}
function parseCsvLineLocal(line) {
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQ = true;
    } else if (c === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}
function csvCellLocal(val) {
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}
function roughlyEqualTimestamps(a, b) {
  const ta = Date.parse(a);
  const tb = Date.parse(b);
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return false;
  return Math.abs(ta - tb) < 1e3;
}
const Route$1f = createFileRoute("/api/public/hooks/export-direct")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json$j({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) {
          return json$j({ ok: false, local: false, reason: "PROD" }, 200);
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$j({ ok: false, local: true, reason: "BAD_JSON" }, 400);
        }
        const parsed = BodySchema$3.safeParse(raw);
        if (!parsed.success) {
          return json$j({ ok: false, local: true, reason: "BAD_BODY" }, 400);
        }
        const tables = expandTables(parsed.data.tables);
        if (tables.length === 0) {
          return json$j({ ok: false, local: true, reason: "NO_TABLE" }, 400);
        }
        if (parsed.data.start > parsed.data.end) {
          return json$j({ ok: false, local: true, reason: "INVALID_RANGE" }, 400);
        }
        const dates = [];
        let cur = parsed.data.start;
        while (cur <= parsed.data.end) {
          dates.push(cur);
          cur = isoAddDays(cur, 1);
        }
        const acceptEnc = (request.headers.get("accept-encoding") || "").toLowerCase();
        const useGzip = acceptEnc.includes("gzip");
        const encoder = new TextEncoder();
        const gzip = useGzip ? zlib$2.createGzip({ level: zlib$2.constants.Z_BEST_COMPRESSION }) : null;
        const stream = new ReadableStream({
          async start(controller) {
            const rawWriter = {
              write: async (chunk) => {
                if (gzip) {
                  gzip.write(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
                } else {
                  const arr = chunk instanceof Uint8Array ? chunk : new Uint8Array(chunk);
                  controller.enqueue(arr);
                }
              }
            };
            if (gzip) {
              gzip.on("data", (chunk) => {
                controller.enqueue(new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength));
              });
              gzip.on("end", () => controller.close());
              gzip.on("error", (e) => controller.error(e));
            }
            const safeWrite = async (s) => {
              rawWriter.write(encoder.encode(s));
            };
            try {
              for (const table of tables) {
                await safeWrite(`# table=${table} range=${parsed.data.start}..${parsed.data.end}
`);
                let totalRawBytes = 0;
                let totalOutBytes = 0;
                let totalDays = 0;
                for (const date of dates) {
                  const result = await streamOneDay(table, date, rawWriter, parsed.data.compact, parsed.data.select);
                  if (result.source !== "gap") {
                    totalRawBytes += result.rawBytes;
                    totalOutBytes += result.outBytes;
                    totalDays++;
                    const saved = result.rawBytes - result.outBytes;
                    await safeWrite(
                      `# date=${date} source=${result.source} rows=${result.rows ?? "?"} raw_bytes=${result.rawBytes} out_bytes=${result.outBytes} saved=${saved}
`
                    );
                  } else {
                    await safeWrite(`# date=${date} source=gap bytes=0 reason=no_data_on_disk_or_supabase
`);
                  }
                }
                const totalSaved = totalRawBytes - totalOutBytes;
                await safeWrite(
                  `# table=${table} total_days=${totalDays} raw_total=${totalRawBytes} out_total=${totalOutBytes} saved=${totalSaved} (compact=${parsed.data.compact})

`
                );
              }
              if (gzip) gzip.end();
              else controller.close();
            } catch (e) {
              if (gzip) gzip.destroy();
              controller.error(e);
            }
          }
        });
        const headers = {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-store",
          "Content-Disposition": useGzip ? 'attachment; filename="historical_export.csv.gz"' : 'attachment; filename="historical_export.csv"'
        };
        if (useGzip) headers["Content-Encoding"] = "gzip";
        return new Response(stream, { status: 200, headers });
      }
    }
  }
});
const ALLOWED = DATA_TABLE_NAMES;
const BodySchema$2 = object({
  tables: array(string().trim().min(1)).min(1).max(10),
  start: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mode: union([literal("separate"), literal("unified")]).default("separate")
});
function json$i(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
const Route$1e = createFileRoute("/api/public/hooks/export-history")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        return json$i({ local, reason: local ? null : "PROD" });
      },
      POST: async ({ request }) => {
        try {
          const local = await isLocalRuntime();
          if (!local) {
            return json$i({ ok: false, local: false, reason: "PROD" }, 200);
          }
          let raw;
          try {
            raw = await request.json();
          } catch {
            return json$i({ ok: false, local: true, reason: "BAD_JSON" }, 400);
          }
          const parsed = BodySchema$2.safeParse(raw);
          if (!parsed.success) {
            return json$i({ ok: false, local: true, reason: "BAD_BODY" }, 400);
          }
          const set = /* @__PURE__ */ new Set();
          for (const t of parsed.data.tables) {
            if (t.toLowerCase() === "all") {
              for (const a of ALLOWED) set.add(a);
            } else if (ALLOWED.includes(t)) {
              set.add(t);
            }
          }
          const tables = ALLOWED.filter((t) => set.has(t));
          if (tables.length === 0) {
            return json$i({ ok: false, local: true, reason: "NO_TABLE" }, 400);
          }
          const result = await runExport(
            { tables, start: parsed.data.start, end: parsed.data.end, mode: parsed.data.mode },
            void 0
          );
          return json$i(result, 200);
        } catch (e) {
          console.error("[export-history] handler error:", e);
          return json$i(
            {
              ok: false,
              local: true,
              reason: "INTERNAL",
              errorMessage: String(e?.message || e).slice(0, 300)
            },
            200
          );
        }
      }
    }
  }
});
const CORS$h = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
const json$h = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS$h } });
const Route$1d = createFileRoute("/api/public/hooks/ext-diag")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$h }),
      POST: async ({ request }) => {
        let body = {};
        try {
          body = await request.json();
        } catch {
          return json$h({ ok: false, error: "bad_json" }, 400);
        }
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const row = {
          client_id: String(body.client_id ?? "").slice(0, 128) || null,
          symbol: String(body.symbol ?? "").slice(0, 32) || null,
          visibility_state: String(body.visibility_state ?? "").slice(0, 16) || null,
          audio_paused: typeof body.audio_paused === "boolean" ? body.audio_paused : null,
          audio_muted: typeof body.audio_muted === "boolean" ? body.audio_muted : null,
          audio_ready_state: Number.isFinite(body.audio_ready_state) ? Number(body.audio_ready_state) : null,
          audio_current_time: Number.isFinite(body.audio_current_time) ? Number(body.audio_current_time) : null,
          depth_count_30s: Number.isFinite(body.depth_count_30s) ? Number(body.depth_count_30s) : null,
          last_depth_age_ms: Number.isFinite(body.last_depth_age_ms) ? Number(body.last_depth_age_ms) : null,
          extra: body.extra && typeof body.extra === "object" ? body.extra : {}
        };
        const { error } = await supabaseAdmin2.from("extension_diag").insert(row);
        if (error) return json$h({ ok: false, error: error.message }, 500);
        return json$h({ ok: true });
      }
    }
  }
});
async function isThunderAuthorized(provided, expected) {
  if (expected && provided.length === expected.length && provided === expected) return true;
  if (!provided || provided.length < 16 || provided.length > 200) return false;
  try {
    const { data } = await supabaseAdmin$5.from("ingest_tokens").select("token").eq("token", provided).limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}
const TabSchema = object({
  symbol: string().trim().min(1).max(32),
  uuid: string().nullish(),
  opened_at_ms: number().finite().nullish(),
  uptime_sec: number().int().nullish(),
  last_ensure_age_sec: number().int().nullish(),
  last_l2_fresh: boolean().nullish(),
  last_l2_age_sec: number().int().nullish(),
  panel_state: string().max(32).nullish(),
  has_trigger: boolean().nullish(),
  snapshots_sent: number().int().nullish(),
  last_snapshot_age_sec: number().int().nullish(),
  panel_reason: string().max(64).nullish(),
  ac_state: string().max(32).nullish(),
  ac_resume_attempts: number().int().nullish(),
  ac_resume_ok: number().int().nullish(),
  depth_total: number().int().nullish(),
  l2_soft_resets: number().int().nullish()
});
const BodySchema$1 = object({
  clientId: string().min(1).max(64),
  ts: number().finite().optional(),
  marketOpen: boolean().optional(),
  persistTabsCount: number().int().optional(),
  persistMaxTabs: number().int().optional(),
  signalsCount: number().int().optional(),
  tabs: array(TabSchema).max(50)
});
const CORS$g = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$g(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS$g }
  });
}
const Route$1c = createFileRoute("/api/public/hooks/extension-telemetry")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$g }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$g({ ok: false, error: "no_token" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$g });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$g({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = BodySchema$1.safeParse(raw);
        if (!parsed.success) return json$g({ ok: false, error: "invalid_body", issues: parsed.error.issues.slice(0, 5) }, 400);
        const b = parsed.data;
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        const rows = b.tabs.map((t) => ({
          ts: nowIso,
          client_id: b.clientId,
          symbol: String(t.symbol).toUpperCase(),
          uuid: t.uuid ?? null,
          opened_at_ms: t.opened_at_ms ?? null,
          uptime_sec: t.uptime_sec ?? null,
          last_ensure_age_sec: t.last_ensure_age_sec ?? null,
          last_l2_fresh: t.last_l2_fresh ?? null,
          last_l2_age_sec: t.last_l2_age_sec ?? null,
          panel_state: t.panel_state ?? null,
          has_trigger: t.has_trigger ?? null,
          snapshots_sent: t.snapshots_sent ?? null,
          last_snapshot_age_sec: t.last_snapshot_age_sec ?? null,
          panel_reason: t.panel_reason ?? null,
          ac_state: t.ac_state ?? null,
          ac_resume_attempts: t.ac_resume_attempts ?? null,
          ac_resume_ok: t.ac_resume_ok ?? null,
          depth_total: t.depth_total ?? null,
          l2_soft_resets: t.l2_soft_resets ?? null,
          extras: {
            persistTabsCount: b.persistTabsCount ?? null,
            persistMaxTabs: b.persistMaxTabs ?? null,
            signalsCount: b.signalsCount ?? null,
            marketOpen: b.marketOpen ?? null
          }
        }));
        if (rows.length === 0) return json$g({ ok: true, inserted: 0 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error } = await supabaseAdmin2.from("extension_tab_telemetry").insert(rows);
        if (error) return json$g({ ok: false, error: error.message }, 500);
        return json$g({ ok: true, inserted: rows.length });
      }
    }
  }
});
const CORS_HEADERS$4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$f(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS$4 }
  });
}
function authOK$2(request) {
  const expected = process.env.THUNDER_INGEST_TOKEN ?? "";
  const provided = request.headers.get("x-thunder-token") ?? "";
  return expected.length > 0 && provided.length === expected.length && provided === expected;
}
const UpsertSchema = object({
  client_trade_id: string().min(3).max(128),
  symbol: string().min(1).max(16),
  trade_date: string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source: string().max(64).optional(),
  status: _enum(["open", "closed"]).default("open"),
  opened_at: string(),
  buy_qty: number().nullable().optional(),
  buy_price: number().nullable().optional(),
  buy_value: number().nullable().optional(),
  buy_fee: number().nullable().optional(),
  buy_total_cost: number().nullable().optional(),
  closed_at: string().nullable().optional(),
  sell_qty: number().nullable().optional(),
  sell_price: number().nullable().optional(),
  sell_value: number().nullable().optional(),
  sell_fee: number().nullable().optional(),
  sell_net_proceeds: number().nullable().optional(),
  pnl: number().nullable().optional(),
  pnl_pct: number().nullable().optional(),
  metadata: record(string(), unknown()).optional()
});
const Route$1b = createFileRoute("/api/public/hooks/extension-trades")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS$4 }),
      GET: async ({ request }) => {
        if (!authOK$2(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$4 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const url = new URL(request.url);
        const date = url.searchParams.get("date");
        let q = supabaseAdmin2.from("extension_trades").select("*").order("opened_at", { ascending: false }).limit(200);
        if (date) q = q.eq("trade_date", date);
        const { data, error } = await q;
        if (error) return json$f({ ok: false, error: error.message }, 500);
        return json$f({ ok: true, trades: data ?? [] });
      },
      POST: async ({ request }) => {
        if (!authOK$2(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$4 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$f({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = UpsertSchema.safeParse(raw);
        if (!parsed.success) return json$f({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);
        const payload = {
          ...parsed.data,
          symbol: parsed.data.symbol.toUpperCase(),
          metadata: parsed.data.metadata ?? {}
        };
        const { error } = await supabaseAdmin2.from("extension_trades").upsert(payload, { onConflict: "client_trade_id" });
        if (error) return json$f({ ok: false, error: error.message }, 500);
        return json$f({ ok: true });
      }
    }
  }
});
const Route$1a = createFileRoute("/api/public/hooks/fetch-fundamentals")({
  server: {
    handlers: {
      POST: async () => {
        const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol").eq("is_active", true);
        if (!stocks || stocks.length === 0) {
          return Response.json({ ok: false, error: "no active stocks" });
        }
        const map = await fetchFundamentals(stocks.map((s) => s.symbol));
        await saveFundamentals(map);
        return Response.json({ ok: true, fetched: map.size });
      }
    }
  }
});
const Route$19 = createFileRoute("/api/public/hooks/fetch-macro")({
  server: {
    handlers: {
      POST: async () => {
        const snap = await fetchMacroSnapshot();
        if (!snap) return Response.json({ ok: false, error: "macro fetch failed" });
        await saveMacro(snap);
        return Response.json({ ok: true, snap });
      }
    }
  }
});
const Route$18 = createFileRoute("/api/public/hooks/fetch-news-all")({
  server: {
    handlers: {
      POST: async () => {
        const { data: stocks, error } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_active", true);
        if (error) {
          return Response.json({ ok: false, error: error.message }, { status: 500 });
        }
        if (!stocks || stocks.length === 0) {
          return Response.json({ ok: true, processed: 0 });
        }
        const list = stocks.map((s) => ({
          symbol: s.symbol,
          nameAr: s.name_ar ?? s.symbol
        }));
        const map = await fetchNewsBulk(list, 4);
        let saved = 0;
        const errors = [];
        for (const [symbol, news] of map.entries()) {
          if (!news.found || news.headlines.length === 0) continue;
          const score = Number(news.sentiment_score) || 0;
          const sentiment = score >= 0.3 ? "positive" : score <= -0.3 ? "negative" : "neutral";
          const abs = Math.abs(score);
          const impact_level = abs >= 0.7 ? "high" : abs >= 0.4 ? "medium" : "low";
          const rows = news.headlines.slice(0, 3).map((h) => ({
            symbol,
            headline: h,
            summary_ar: news.summary_ar?.slice(0, 500) ?? null,
            source_name: "firecrawl",
            published_at: (/* @__PURE__ */ new Date()).toISOString(),
            sentiment,
            sentiment_score: score,
            impact_level,
            ai_model: "gemini-2.5-flash"
          }));
          const { error: insErr } = await supabaseAdmin$5.from("news_sentiment").insert(rows);
          if (insErr) errors.push(`${symbol}: ${insErr.message}`);
          else saved += rows.length;
        }
        return Response.json({
          ok: true,
          stocks: stocks.length,
          news_inserted: saved,
          errors: errors.slice(0, 10)
        });
      }
    }
  }
});
const EGX_HOLIDAYS = /* @__PURE__ */ new Set([
  // YYYY-MM-DD — أضِف هنا الإجازات الرسمية لو احتجنا دقة أكثر.
]);
function toCairoDateKey(d) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(d);
  return parts;
}
function cairoDayOfWeek(d) {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    weekday: "short"
  }).format(d);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(wd);
}
function isEgxTradingDay(d) {
  const dow = cairoDayOfWeek(d);
  if (dow === 5 || dow === 6) return false;
  if (EGX_HOLIDAYS.has(toCairoDateKey(d))) return false;
  return true;
}
function nextEgxTradingDay(from = /* @__PURE__ */ new Date(), includeToday = false) {
  const d = new Date(from);
  if (!includeToday) d.setUTCDate(d.getUTCDate() + 1);
  for (let i = 0; i < 10; i++) {
    if (isEgxTradingDay(d)) return new Date(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}
function addEgxTradingDays(from, n) {
  const d = new Date(from);
  let added = 0;
  while (added < n) {
    d.setUTCDate(d.getUTCDate() + 1);
    if (isEgxTradingDay(d)) added++;
  }
  return d;
}
function toDateOnly(d) {
  return toCairoDateKey(d);
}
const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"
];
function formatCairoDateAr(d) {
  const dow = cairoDayOfWeek(d);
  const key = toCairoDateKey(d);
  const [, mm, dd] = key.split("-").map(Number);
  return `${AR_DAYS[dow]} ${dd} ${AR_MONTHS[(mm ?? 1) - 1]}`;
}
function describeImpactWindowAr(publishedAt, impactStart, horizon) {
  const horizonAr = horizon === "short" ? "قصير المدى" : horizon === "medium" ? "متوسط المدى" : "طويل المدى";
  const startDow = cairoDayOfWeek(impactStart);
  const isWeekend = startDow === 5 || startDow === 6;
  const note = isWeekend ? " (البورصة مقفولة — هيتأجل لأول يوم تداول)" : "";
  return `📅 نُشر: ${formatCairoDateAr(publishedAt)} · أفق ${horizonAr} · التأثير المتوقع: ${formatCairoDateAr(impactStart)}${note}`;
}
const RIGHTS_KEYWORDS = [
  "حقوق اكتتاب",
  "حقوق الاكتتاب",
  "زيادة رأس المال",
  "زيادة رأس مال",
  "اكتتاب",
  "rights issue",
  "rights offering",
  "capital increase"
];
function hashHeadline(s) {
  return createHash("sha256").update(s.trim().toLowerCase()).digest("hex").slice(0, 24);
}
function detectRights(text) {
  const t = text.toLowerCase();
  return RIGHTS_KEYWORDS.some((k) => t.includes(k.toLowerCase()));
}
function ruleBasedClassify(headline) {
  const t = headline.toLowerCase();
  if (detectRights(t)) return { category: "rights_issue", horizon: "medium" };
  if (/(أرباح|نتائج|earnings|results|ربح|خسائر|خسارة)/.test(t)) return { category: "earnings", horizon: "short" };
  if (/(توزيع|كوبون|dividend|distribution)/.test(t)) return { category: "dividend", horizon: "medium" };
  if (/(رئيس|مدير|ceo|chairman|استقالة|تعيين)/.test(t)) return { category: "management", horizon: "medium" };
  if (/(فائدة|تضخم|سعر|inflation|interest|cbe|البنك المركزي|عملة|الدولار)/.test(t)) return { category: "macro", horizon: "long" };
  if (/(قرار|تنظيم|regulator|fra|البورصة)/.test(t)) return { category: "regulatory", horizon: "medium" };
  return { category: "general", horizon: "short" };
}
function horizonToDays(h) {
  if (h === "short") return { start: 0, span: 1 };
  if (h === "medium") return { start: 0, span: 5 };
  return { start: 2, span: 15 };
}
async function llmEnrich(symbol, headline) {
  try {
    const prompt = `حلل الخبر التالي عن سهم ${symbol} في البورصة المصرية و رد JSON فقط:
الخبر: "${headline}"
JSON Schema:
{
  "category": "rights_issue|earnings|dividend|management|regulatory|macro|general",
  "horizon": "short|medium|long",
  "direction": "up|down|neutral",
  "magnitude_pct": <رقم تقديري للتأثير على السعر، يمكن أن يكون سالب>,
  "confidence": <0-100>,
  "explanation_ar": "<شرح فني مختصر بالعربية الفصحى، حتى 25 كلمة>",
  "baladi": "<خلاصة بلهجة مصرية بلدي، حتى 20 كلمة، يوضح هيأثر إزاي و على إيه>"
}
ملاحظات:
- short = يوم تداول واحد، medium = أسبوع تداول، long = أكثر من أسبوع.
- لو الخبر عن حقوق اكتتاب أو زيادة رأس مال خليه rights_issue و horizon medium على الأقل.`;
    const txt = await chatWithFallback({
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      timeoutMs: 8e3
    });
    if (!txt) return null;
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j2 = JSON.parse(m[0]);
    return {
      category: j2.category ?? void 0,
      horizon: j2.horizon ?? void 0,
      direction: j2.direction ?? void 0,
      magnitudePct: typeof j2.magnitude_pct === "number" ? j2.magnitude_pct : null,
      confidence: typeof j2.confidence === "number" ? Math.max(0, Math.min(100, j2.confidence)) : 60,
      explanationAr: String(j2.explanation_ar ?? "").slice(0, 240),
      baladiSummary: String(j2.baladi ?? "").slice(0, 240)
    };
  } catch {
    return null;
  }
}
async function forecastAndPersistNews(args) {
  const publishedAt = args.publishedAt ?? /* @__PURE__ */ new Date();
  const headline = args.headline.trim();
  if (!headline) return null;
  const rule = ruleBasedClassify(headline);
  const ai = await llmEnrich(args.symbol, headline);
  const category = ai?.category ?? rule.category;
  const horizon = ai?.horizon ?? rule.horizon;
  const { start, span } = horizonToDays(horizon);
  const firstTrading = nextEgxTradingDay(publishedAt, true);
  const impactStart = start === 0 ? firstTrading : addEgxTradingDays(firstTrading, start);
  const impactEnd = addEgxTradingDays(impactStart, Math.max(0, span - 1));
  const sScore = args.sentimentScore ?? 0;
  const direction = ai?.direction ?? (sScore > 0.15 ? "up" : sScore < -0.15 ? "down" : "neutral");
  const isRights = category === "rights_issue" || detectRights(headline);
  const forecast = {
    symbol: args.symbol,
    headline,
    category,
    horizon,
    publishedAt,
    impactStart,
    impactEnd,
    direction,
    magnitudePct: ai?.magnitudePct ?? null,
    confidence: ai?.confidence ?? 55,
    explanationAr: ai?.explanationAr ?? "تحليل أوّلي بناءً على نوع الخبر و توقيته.",
    baladiSummary: ai?.baladiSummary ?? "الخبر ده ممكن يحرّك السهم على المدى المحدد، خلي بالك من حركة السعر.",
    isRightsRelated: isRights
  };
  try {
    await supabaseAdmin$5.from("news_impact_forecasts").upsert({
      news_id: args.newsId ?? null,
      symbol: forecast.symbol,
      headline: forecast.headline,
      headline_hash: hashHeadline(`${forecast.symbol}|${forecast.headline}`),
      category: forecast.category,
      horizon: forecast.horizon,
      published_at: forecast.publishedAt.toISOString(),
      impact_start_date: toDateOnly(forecast.impactStart),
      impact_end_date: toDateOnly(forecast.impactEnd),
      expected_direction: forecast.direction,
      expected_magnitude_pct: forecast.magnitudePct,
      confidence: forecast.confidence,
      explanation_ar: forecast.explanationAr,
      baladi_summary: forecast.baladiSummary,
      is_rights_related: forecast.isRightsRelated
    }, { onConflict: "symbol,headline_hash", ignoreDuplicates: false });
  } catch (e) {
    console.error("[news-impact-forecast] persist failed", e);
  }
  return forecast;
}
const Route$17 = createFileRoute("/api/public/hooks/forecast-news-impacts")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
          const { data: news } = await supabaseAdmin$5.from("news_sentiment").select("id, symbol, headline, sentiment_score, published_at, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(80);
          if (!news || news.length === 0) {
            return Response.json({ ok: true, processed: 0 });
          }
          const results = [];
          const BATCH = 3;
          for (let i = 0; i < news.length; i += BATCH) {
            const slice = news.slice(i, i + BATCH);
            const out = await Promise.all(slice.map(async (n) => {
              const fc2 = await forecastAndPersistNews({
                symbol: n.symbol,
                headline: n.headline,
                newsId: n.id,
                publishedAt: n.published_at ? new Date(n.published_at) : new Date(n.created_at),
                sentimentScore: n.sentiment_score
              });
              if (!fc2) return null;
              return {
                symbol: fc2.symbol,
                headline: fc2.headline,
                horizon: fc2.horizon,
                category: fc2.category,
                isRights: fc2.isRightsRelated,
                impactStart: fc2.impactStart,
                publishedAt: fc2.publishedAt,
                direction: fc2.direction,
                magnitude: fc2.magnitudePct,
                confidence: fc2.confidence,
                explanation: fc2.explanationAr,
                baladi: fc2.baladiSummary
              };
            }));
            for (const o of out) if (o) results.push(o);
          }
          const rights = results.filter((r) => r.isRights);
          const strong = results.filter((r) => !r.isRights && r.confidence >= 65).sort((a, b) => b.confidence - a.confidence).slice(0, 8);
          const lines = [];
          lines.push("🧠 <b>تنبؤات تأثير الأخبار</b>");
          lines.push("");
          if (rights.length) {
            lines.push("📜 <b>حقوق اكتتاب / زيادة رأس مال:</b>");
            for (const r of rights.slice(0, 10)) {
              const dirEmoji = r.direction === "up" ? "🟢" : r.direction === "down" ? "🔴" : "⚪";
              const mag = r.magnitude != null ? ` ${r.magnitude > 0 ? "+" : ""}${Number(r.magnitude).toFixed(1)}%` : "";
              lines.push(`${dirEmoji} <b>${escapeHtml(r.symbol)}</b> — ${escapeHtml(r.headline.slice(0, 90))}`);
              lines.push(`  ${describeImpactWindowAr(r.publishedAt, r.impactStart, r.horizon)}`);
              lines.push(`  ثقة ${r.confidence}%${mag} · ${escapeHtml(r.explanation.slice(0, 140))}`);
              if (r.baladi) lines.push(`  🗣️ ${escapeHtml(r.baladi.slice(0, 140))}`);
            }
            lines.push("");
          }
          if (strong.length) {
            lines.push("⚡ <b>أخبار ذات تأثير قوي:</b>");
            for (const r of strong) {
              const dirEmoji = r.direction === "up" ? "🟢" : r.direction === "down" ? "🔴" : "⚪";
              const mag = r.magnitude != null ? ` ${r.magnitude > 0 ? "+" : ""}${Number(r.magnitude).toFixed(1)}%` : "";
              lines.push(`${dirEmoji} <b>${escapeHtml(r.symbol)}</b> [${r.category}] — ${escapeHtml(r.headline.slice(0, 90))}`);
              lines.push(`  ${describeImpactWindowAr(r.publishedAt, r.impactStart, r.horizon)}`);
              lines.push(`  ثقة ${r.confidence}%${mag}`);
              if (r.baladi) lines.push(`  🗣️ ${escapeHtml(r.baladi.slice(0, 130))}`);
            }
            lines.push("");
          }
          let telegram = null;
          if (rights.length || strong.length) {
            lines.push(`<i>📊 تم تحليل ${results.length} خبر و حفظ التأثير المتوقع للرجوع له لاحقاً.</i>`);
            telegram = await sendTelegram$1(lines.join("\n"));
          }
          return Response.json({
            ok: true,
            processed: results.length,
            rights: rights.length,
            strong: strong.length,
            telegram
          });
        } catch (e) {
          console.error("[forecast-news-impacts] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const Route$16 = createFileRoute("/api/public/hooks/health-check")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin$5.rpc("get_cron_runs", {
          p_limit: 200
        });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        const runs = data ?? [];
        const byJob = /* @__PURE__ */ new Map();
        for (const r of runs) {
          const arr = byJob.get(r.jobid) ?? [];
          if (arr.length < 2) {
            arr.push(r);
            byJob.set(r.jobid, arr);
          }
        }
        const alerts = [];
        for (const [, arr] of byJob) {
          if (arr.length < 2) continue;
          const [last, prev] = arr;
          if (last.status !== "succeeded" && prev.status !== "succeeded") {
            const name = escapeHtml(last.jobname ?? `#${last.jobid}`);
            const msg = escapeHtml((last.return_message ?? "").slice(0, 120));
            alerts.push(`• ${name} — ${last.status}${msg ? ` (${msg})` : ""}`);
          }
        }
        let telegramSent = false;
        if (alerts.length > 0) {
          const text = `⚠️ <b>تنبيه أتمتة</b>
${alerts.length} مهمة فشلت مرتين متتاليتين:

` + alerts.join("\n");
          try {
            await sendTelegram$1(text);
            telegramSent = true;
          } catch (e) {
            console.error("telegram send failed", e);
          }
        }
        return new Response(
          JSON.stringify({
            ok: true,
            checked: byJob.size,
            failing_jobs: alerts.length,
            telegram_sent: telegramSent
          }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
    }
  }
});
const Route$15 = createFileRoute("/api/public/hooks/hourly-pulse")({
  server: {
    handlers: {
      POST: async () => {
        const since = new Date(Date.now() - 60 * 60 * 1e3).toISOString();
        const lastDay = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
        const [
          newsHourRes,
          newsDayRes,
          scansHourRes,
          recsHourRes,
          recsDayRes,
          alertsHourRes,
          picksHourRes,
          picksDayRes,
          cronRes,
          latestScanRes
        ] = await Promise.all([
          supabaseAdmin$5.from("news_sentiment").select("id, symbol, headline, sentiment_score, published_at", { count: "exact" }).gte("created_at", since).order("sentiment_score", { ascending: false }).limit(3),
          supabaseAdmin$5.from("news_sentiment").select("id, symbol, headline, sentiment, sentiment_score, published_at, created_at", { count: "exact" }).gte("created_at", lastDay).order("created_at", { ascending: false }).limit(8),
          supabaseAdmin$5.from("scans").select("id, started_at, finished_at, status, stocks_count, ai_count, error_message", { count: "exact", head: false }).gte("started_at", since).order("started_at", { ascending: false }).limit(1),
          supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, created_at", { count: "exact" }).gte("created_at", since).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).order("confidence", { ascending: false }).limit(3),
          supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, expected_next_day_pct, created_at", { count: "exact" }).gte("created_at", lastDay).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).order("confidence", { ascending: false }).limit(5),
          supabaseAdmin$5.from("sell_alerts").select("symbol, message_ar, alert_type, created_at", { count: "exact" }).gte("created_at", since).order("created_at", { ascending: false }).limit(3),
          supabaseAdmin$5.from("daily_picks").select("symbol, confidence, created_at", { count: "exact" }).gte("created_at", since).order("confidence", { ascending: false }).limit(3),
          supabaseAdmin$5.from("daily_picks").select("symbol, confidence, created_at", { count: "exact" }).gte("created_at", lastDay).order("confidence", { ascending: false }).limit(3),
          supabaseAdmin$5.rpc("get_cron_runs", { p_limit: 80 }),
          supabaseAdmin$5.from("scans").select("id, started_at, finished_at, status, stocks_count, ai_count, error_message").gte("started_at", lastDay).order("started_at", { ascending: false }).limit(1).maybeSingle()
        ]);
        const newsCount = newsHourRes.count ?? 0;
        const newsDayCount = newsDayRes.count ?? 0;
        const scansCount = scansHourRes.count ?? 0;
        const recsCount = recsHourRes.count ?? 0;
        const recsDayCount = recsDayRes.count ?? 0;
        const alertsCount = alertsHourRes.count ?? 0;
        const picksCount = picksHourRes.count ?? 0;
        const picksDayCount = picksDayRes.count ?? 0;
        const runs = (cronRes.data ?? []).filter(
          (r) => new Date(r.start_time).toISOString() >= since
        );
        const okJobs = runs.filter((r) => r.status === "succeeded").length;
        const failJobs = runs.filter((r) => r.status !== "succeeded");
        const lines = [];
        lines.push("📡 <b>نبضة الساعة</b> — حالة النظام والتحليل");
        lines.push("");
        lines.push("✅ النظام شغال تلقائيًا وبيفحص المهام والخلفية.");
        lines.push(`📰 أخبار جديدة: <b>${newsCount}</b> آخر ساعة · <b>${newsDayCount}</b> آخر 24 ساعة`);
        lines.push(`🔍 فحوصات سوق: <b>${scansCount}</b> آخر ساعة`);
        lines.push(`🎯 توصيات شراء: <b>${recsCount}</b> آخر ساعة · <b>${recsDayCount}</b> آخر 24 ساعة`);
        lines.push(`⭐ ترشيحات اليوم: <b>${picksCount}</b> آخر ساعة · <b>${picksDayCount}</b> آخر 24 ساعة`);
        lines.push(`🚨 تنبيهات بيع: <b>${alertsCount}</b>`);
        lines.push(`⚙️ مهام تلقائية ناجحة: <b>${okJobs}</b>`);
        const latestScan = latestScanRes.data;
        if (latestScan) {
          const startedAt = latestScan.started_at ? new Date(latestScan.started_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }) : "غير معروف";
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🔎 <b>آخر مسح كامل:</b>");
          lines.push(`• الحالة: <b>${latestScan.status}</b>`);
          lines.push(`• وقت البدء: ${startedAt}`);
          lines.push(`• أسهم تم فحصها: <b>${latestScan.stocks_count ?? 0}</b> · تحليلات AI: <b>${latestScan.ai_count ?? 0}</b>`);
          if (latestScan.error_message) {
            const err = String(latestScan.error_message ?? "");
            const aiFallback = /Payment Required|Too Many Requests|AI|بوابة/i.test(err);
            if (aiFallback) {
              lines.push("• حالة AI: استخدم النظام الاحتياطي/التقليل الذكي لبعض الأسهم بسبب ضغط أو رصيد المزود.");
            }
            const rateLimitSymbols = Array.from(
              new Set((err.match(/([A-Z]{3,5}):\s*Failed after \d+ attempts/g) ?? []).map((s) => s.split(":")[0]))
            );
            const driftMatch = err.match(/انحراف[^|]+/);
            const cleanNotes = [];
            if (driftMatch) cleanNotes.push(driftMatch[0].trim());
            if (rateLimitSymbols.length) {
              cleanNotes.push(`فشل مؤقت في جلب أخبار ${rateLimitSymbols.length} سهم (Rate-Limit): ${rateLimitSymbols.slice(0, 5).join("، ")}${rateLimitSymbols.length > 5 ? "…" : ""} — هيُعاد المحاولة تلقائياً.`);
            }
            if (cleanNotes.length) {
              lines.push(`• ملاحظات: ${escapeHtml(cleanNotes.join(" | ").slice(0, 320))}`);
            }
          }
        } else {
          lines.push("");
          lines.push("🔎 لم يتم العثور على مسح كامل خلال آخر 24 ساعة.");
        }
        if (recsDayCount === 0 && picksDayCount === 0) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("ℹ️ <b>ليه مفيش توصيات دلوقتي؟</b>");
          lines.push("الأخبار بتتجمع و بتتحلل تلقائياً، لكن التوصيات بتطلع من المسح الكامل و بشرط:");
          lines.push("• الثقة في السهم > 70% • إشارة فنية واضحة • ما يكونش مرفوض من قواعد المخاطرة.");
          lines.push(`النهارده ${newsDayCount} خبر اتحللوا، بس ولا سهم وصل لمعايير الشراء — السوق في وضع انتظار.`);
        }
        if ((recsDayRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🎯 <b>أبرز توصيات الشراء خلال 24 ساعة:</b>");
          for (const r of recsDayRes.data ?? []) {
            const reasons = Array.isArray(r.reasons_ar) ? r.reasons_ar.map(String).slice(0, 2) : [];
            const expected = r.expected_next_day_pct != null ? ` · متوقع بكرا ${Number(r.expected_next_day_pct).toFixed(1)}%` : "";
            lines.push(`• <b>${escapeHtml(r.symbol)}</b> — ثقة ${r.confidence}%${expected}`);
            for (const reason of reasons) lines.push(`  - ${escapeHtml(reason.slice(0, 95))}`);
          }
        }
        if ((newsDayRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("📰 <b>آخر الأخبار التي دخلت التحليل:</b>");
          const topNews = (newsDayRes.data ?? []).slice(0, 5);
          const ranked = [...topNews].sort(
            (a, b) => Math.abs(b.sentiment_score ?? 0) - Math.abs(a.sentiment_score ?? 0)
          );
          const explainSet = new Set(ranked.slice(0, 2).map((n) => `${n.symbol}::${n.headline}`));
          for (const n of topNews) {
            const head = escapeHtml((n.headline ?? "").slice(0, 110));
            const icon = n.sentiment === "positive" ? "📈" : n.sentiment === "negative" ? "⚠️" : "📰";
            lines.push(`${icon} <b>${escapeHtml(n.symbol)}</b>: ${head} <i>(${n.sentiment_score?.toFixed(2)})</i>`);
            if (explainSet.has(`${n.symbol}::${n.headline}`)) {
              const baladi = await explainNewsBaladi({
                symbol: n.symbol,
                headline: n.headline ?? "",
                sentiment: n.sentiment,
                impact_level: n.impact_level ?? null,
                sentiment_score: n.sentiment_score
              });
              if (baladi) lines.push(`   🗣️ <i>${escapeHtml(baladi)}</i>`);
            }
          }
        } else {
          lines.push("");
          lines.push("📰 لا توجد أخبار مخزنة آخر 24 ساعة — سيتم اعتبار ده مشكلة لو استمر بعد تشغيل مهمة الأخبار القادمة.");
        }
        if ((alertsHourRes.data ?? []).length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push("🚨 <b>تنبيهات بيع:</b>");
          for (const a of alertsHourRes.data ?? []) {
            lines.push(`• ${escapeHtml(a.symbol)} — ${escapeHtml((a.message_ar ?? "").slice(0, 80))}`);
          }
        }
        if (failJobs.length) {
          lines.push("");
          lines.push("━━━━━━━━━━━━━━━");
          lines.push(`⚠️ مهام فشلت: <b>${failJobs.length}</b>`);
          for (const f of failJobs.slice(0, 3)) {
            lines.push(`• ${escapeHtml(f.jobname ?? "?")} (${escapeHtml(f.status)})`);
          }
        }
        const telegram = await sendTelegram$1(lines.join("\n"));
        return Response.json({
          ok: true,
          telegram,
          news: newsCount,
          news_24h: newsDayCount,
          scans: scansCount,
          recs: recsCount,
          recs_24h: recsDayCount,
          alerts: alertsCount,
          picks: picksCount,
          picks_24h: picksDayCount,
          jobs_ok: okJobs,
          jobs_failed: failJobs.length
        });
      }
    }
  }
});
async function runAdversarialLearner() {
  const { data: losers } = await supabaseAdmin$5.from("recommendations").select(
    "id, symbol, signal, confidence, realized_pct, raw_ai_response, reasons_ar, market_trend, technical_score"
  ).neq("outcome", "pending").lte("realized_pct", -1.5).order("created_at", { ascending: false }).limit(30);
  if (!losers || losers.length === 0) return { examined: 0, rules_added: 0 };
  const gateway = getAiGateway();
  const model = gateway(AI_MODEL);
  const samples = losers.map((r) => ({
    sym: r.symbol,
    sig: r.signal,
    conf: r.confidence,
    loss_pct: r.realized_pct,
    market: r.market_trend,
    tech: r.technical_score,
    reasons: r.reasons_ar?.slice(0, 2) ?? []
  }));
  const system = [
    "أنت محلل أداء صارم. مهمتك اكتشاف الأنماط المشتركة في التوصيات الفاشلة.",
    "أعطني JSON يحتوي على array من 0-3 قواعد فقط، كل قاعدة بشكل:",
    `{"pattern_name":"اسم_مختصر","description_ar":"شرح بالعربية","rule":{"signal":"buy","market_trend":"down","max_confidence":75}}`,
    "rule.* يجب أن تكون شروط بسيطة قابلة للتحقق (signal, market_trend, max_confidence, min_rsi, max_rsi, sector).",
    "لا تخترع قواعد عامة — فقط ما يدعمه نمط واضح في العينة.",
    'أجب بـ JSON صالح فقط بصيغة {"rules":[...]} بدون أي نص آخر.'
  ].join("\n");
  let rules = [];
  try {
    const { text } = await generateText({
      model,
      system,
      prompt: JSON.stringify(samples),
      temperature: 0.2
    });
    const m = text.match(/\{[\s\S]*\}/);
    if (m) {
      const parsed = JSON.parse(m[0]);
      rules = (parsed.rules ?? []).slice(0, 3);
    }
  } catch {
    return { examined: losers.length, rules_added: 0 };
  }
  let added = 0;
  for (const r of rules) {
    if (!r.pattern_name || !r.rule) continue;
    const { data: existing } = await supabaseAdmin$5.from("signal_failures").select("id, failure_count").eq("pattern_name", r.pattern_name).maybeSingle();
    if (existing) {
      await supabaseAdmin$5.from("signal_failures").update({
        failure_count: (existing.failure_count ?? 0) + losers.length,
        total_count: (existing.failure_count ?? 0) + losers.length,
        last_updated: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", existing.id);
    } else {
      await supabaseAdmin$5.from("signal_failures").insert({
        pattern_name: r.pattern_name,
        description_ar: r.description_ar ?? r.pattern_name,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        rule_json: r.rule,
        failure_count: losers.length,
        total_count: losers.length,
        win_count: 0,
        is_active: true
      });
      added++;
    }
  }
  return { examined: losers.length, rules_added: added };
}
async function updateEnsembleMetaWeights() {
  const { data: votes } = await supabaseAdmin$5.from("ensemble_votes").select("model_name, vote, recommendation_id").order("created_at", { ascending: false }).limit(2e3);
  const recoIds = [...new Set((votes ?? []).map((v) => v.recommendation_id).filter(Boolean))];
  const { data: recos } = await supabaseAdmin$5.from("recommendations").select("id, outcome, realized_pct").in("id", recoIds.length ? recoIds : ["__none__"]);
  const outcomeMap = /* @__PURE__ */ new Map();
  (recos ?? []).forEach((r) => {
    if (r.outcome === "pending") outcomeMap.set(r.id, null);
    else
      outcomeMap.set(
        r.id,
        r.outcome === "target_hit" || typeof r.realized_pct === "number" && Number(r.realized_pct) > 0
      );
  });
  const tally = /* @__PURE__ */ new Map();
  for (const v of votes ?? []) {
    if (!v.recommendation_id) continue;
    const out = outcomeMap.get(v.recommendation_id);
    if (out == null) continue;
    const isBuyVote = v.vote === "buy" || v.vote === "strong_buy";
    if (!isBuyVote) continue;
    const t = tally.get(v.model_name) ?? { wins: 0, total: 0 };
    t.total += 1;
    if (out) t.wins += 1;
    tally.set(v.model_name, t);
  }
  const weights = {};
  tally.forEach((v, k) => {
    if (v.total < 5) {
      weights[k] = 1;
      return;
    }
    const wr = v.wins / v.total;
    weights[k] = +Math.max(0.4, Math.min(1.4, 0.4 + wr * 2)).toFixed(2);
  });
  if (Object.keys(weights).length === 0) {
    const { data: tiers } = await supabaseAdmin$5.from("model_state").select("key").like("key", "tier_%_intelligence");
    const { data: bt } = await supabaseAdmin$5.from("backtest_trades").select("pnl_pct, exit_reason").not("exit_reason", "is", null).limit(2e3);
    const closed = (bt ?? []).filter((r) => typeof r.pnl_pct === "number");
    const wr = closed.length ? closed.filter((r) => Number(r.pnl_pct) > 0).length / closed.length : 0.5;
    const seed = +Math.max(0.6, Math.min(1.3, 0.4 + wr * 2)).toFixed(2);
    for (const t of tiers ?? []) {
      const name = t.key.replace(/_intelligence$/, "");
      weights[name] = seed;
    }
    if (Object.keys(weights).length === 0) weights["primary"] = seed;
  }
  await supabaseAdmin$5.from("model_state").upsert({
    key: "ensemble_meta_weights_v1",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: { weights, fitted_at: (/* @__PURE__ */ new Date()).toISOString() },
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  return { models: Object.keys(weights).length, weights };
}
const KEY = "__online_calibration__";
const DEFAULT_BUCKETS = [
  { min: 0, max: 49, n: 0, wins: 0 },
  { min: 50, max: 59, n: 0, wins: 0 },
  { min: 60, max: 69, n: 0, wins: 0 },
  { min: 70, max: 79, n: 0, wins: 0 },
  { min: 80, max: 89, n: 0, wins: 0 },
  { min: 90, max: 100, n: 0, wins: 0 }
];
function cloneBuckets() {
  return DEFAULT_BUCKETS.map((b) => ({ ...b }));
}
async function nudgeCalibration(confidence, won) {
  const { data } = await supabaseAdmin$5.from("signal_failures").select("id, rule_json, total_count, win_count, win_rate").eq("pattern_name", KEY).maybeSingle();
  const savedBuckets = data?.rule_json?.buckets;
  const buckets = Array.isArray(savedBuckets) ? savedBuckets.map((b2) => ({ ...b2, n: Number(b2.n ?? 0), wins: Number(b2.wins ?? 0) })) : cloneBuckets();
  const b = buckets.find((x) => confidence >= x.min && confidence <= x.max);
  if (b) {
    b.n += 1;
    if (won) b.wins += 1;
  }
  const total = buckets.reduce((s, x) => s + x.n, 0);
  const wins = buckets.reduce((s, x) => s + x.wins, 0);
  if (data?.id) {
    await supabaseAdmin$5.from("signal_failures").update({
      rule_json: { buckets },
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", data.id);
  } else {
    await supabaseAdmin$5.from("signal_failures").insert({
      pattern_name: KEY,
      description_ar: "تعلّم تدريجي للمعايرة بعد كل توصية مغلقة",
      rule_json: { buckets },
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      is_active: false
      // not used as a hard rule
    });
  }
}
async function bootstrapOnlineCalibration() {
  const buckets = cloneBuckets();
  const { data: recs } = await supabaseAdmin$5.from("recommendations").select("confidence, outcome, realized_pct").neq("outcome", "pending").limit(3e3);
  const samples = [];
  for (const r of recs ?? []) {
    const c = Number(r.confidence);
    if (!Number.isFinite(c)) continue;
    const won = r.outcome === "target_hit" || typeof r.realized_pct === "number" && Number(r.realized_pct) > 0;
    samples.push({ confidence: c, won });
  }
  if (samples.length < 300) {
    const { data: bt } = await supabaseAdmin$5.from("backtest_trades").select("confidence, pnl_pct, exit_reason").not("exit_reason", "is", null).limit(5e3);
    for (const r of bt ?? []) {
      const c = Number(r.confidence);
      if (!Number.isFinite(c)) continue;
      samples.push({ confidence: c, won: Number(r.pnl_pct ?? 0) > 0 });
    }
  }
  for (const s of samples) {
    const b = buckets.find((x) => s.confidence >= x.min && s.confidence <= x.max);
    if (b) {
      b.n += 1;
      if (s.won) b.wins += 1;
    }
  }
  const total = buckets.reduce((s, x) => s + x.n, 0);
  const wins = buckets.reduce((s, x) => s + x.wins, 0);
  const { data: existing } = await supabaseAdmin$5.from("signal_failures").select("id").eq("pattern_name", KEY).maybeSingle();
  if (existing?.id) {
    await supabaseAdmin$5.from("signal_failures").update({
      rule_json: { buckets },
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      last_updated: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", existing.id);
  } else {
    await supabaseAdmin$5.from("signal_failures").insert({
      pattern_name: KEY,
      description_ar: "تعلّم تدريجي للمعايرة بعد كل توصية مغلقة",
      rule_json: { buckets },
      total_count: total,
      win_count: wins,
      failure_count: total - wins,
      is_active: false
    });
  }
  return { rows: samples.length, total, wins };
}
const RETRYABLE_MESSAGES = [
  "fetch failed",
  "ERR_SSL_PACKET_LENGTH_TOO_LONG",
  "packet length too long",
  "network",
  "terminated",
  "timeout"
];
function getErrorText(error) {
  const parts = [];
  if (error instanceof Error) {
    parts.push(error.message);
    const cause = error.cause;
    if (cause instanceof Error) parts.push(cause.message, cause.name);
    else if (cause) parts.push(String(cause));
  } else {
    parts.push(String(error));
  }
  return parts.join(" ");
}
function isRetryable(error) {
  const text = getErrorText(error).toLowerCase();
  return RETRYABLE_MESSAGES.some((message) => text.includes(message.toLowerCase()));
}
async function withSupabaseRetry(label, operation, attempts = 4) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === attempts) break;
      const waitMs = 250 * attempt;
      console.warn(`[supabase-retry] ${label} failed (${attempt}/${attempts}), retrying in ${waitMs}ms`, error);
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }
  throw lastError;
}
async function runBacktestJob(params = {}) {
  const minConfidence = Math.max(40, Math.min(95, Number(params.minConfidence) || 75));
  const warmup = Math.max(30, Math.min(60, Number(params.warmup) || 50));
  const maxHold = Math.max(2, Math.min(10, Number(params.maxHold) || 7));
  const requireNews = params.requireNews === true;
  const newsLookbackDays = Math.max(1, Math.min(14, Number(params.newsLookbackDays) || 3));
  const fromDateFilter = typeof params.fromDateFilter === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.fromDateFilter) ? params.fromDateFilter : null;
  if (params.finalize && params.backtestId) {
    return await finalizeBacktest(params.backtestId);
  }
  const { data: stocks } = await withSupabaseRetry(
    "load all stocks",
    () => supabaseAdmin$5.from("stocks").select("symbol")
  );
  if (!stocks?.length) return { ok: false, error: "no stocks" };
  if (params.init) {
    const minQ = supabaseAdmin$5.from("daily_candles").select("date").order("date", { ascending: true }).limit(1);
    const { data: minRow } = await withSupabaseRetry(
      "min date",
      () => fromDateFilter ? minQ.gte("date", fromDateFilter).maybeSingle() : minQ.maybeSingle()
    );
    const { data: maxRow } = await withSupabaseRetry(
      "max date",
      () => supabaseAdmin$5.from("daily_candles").select("date").order("date", { ascending: false }).limit(1).maybeSingle()
    );
    const fromDate2 = minRow?.date ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const toDate2 = maxRow?.date ?? fromDate2;
    let regimesCached = 0;
    try {
      regimesCached = await precomputeMarketRegimes(fromDate2, toDate2, warmup);
    } catch (e) {
      console.warn("[backtest:init] regime precompute failed", e);
    }
    const { data: btRow } = await withSupabaseRetry(
      "create backtest",
      () => supabaseAdmin$5.from("backtests").insert({
        status: "running",
        from_date: fromDate2,
        to_date: toDate2,
        min_confidence: minConfidence,
        strategy_version: requireNews ? "v2-trending-only+news-gate" : "v2-trending-only",
        symbols_count: stocks.length
      }).select("id").single()
    );
    return { ok: true, mode: "init", backtestId: btRow.id, symbols: stocks.map((s) => s.symbol), regimesCached };
  }
  const symbolFilter = params.symbols && params.symbols.length > 0 ? new Set(params.symbols) : null;
  const targetStocks = symbolFilter ? stocks.filter((s) => symbolFilter.has(s.symbol)) : stocks;
  const allRows = [];
  const PAGE = 1e3;
  const symbolsToLoad = symbolFilter ? [...symbolFilter] : null;
  for (let from = 0; ; from += PAGE) {
    const q = supabaseAdmin$5.from("daily_candles").select("symbol, date, open, high, low, close, volume").order("symbol", { ascending: true }).order("date", { ascending: true }).range(from, from + PAGE - 1);
    const { data: page } = await withSupabaseRetry(`load candles page ${from}`, () => {
      let qq = q;
      if (symbolsToLoad) qq = qq.in("symbol", symbolsToLoad);
      if (fromDateFilter) qq = qq.gte("date", fromDateFilter);
      return qq;
    });
    if (!page || page.length === 0) break;
    allRows.push(...page);
    if (page.length < PAGE) break;
  }
  const bySymbol = /* @__PURE__ */ new Map();
  for (const r of allRows) {
    const arr = bySymbol.get(r.symbol) ?? [];
    arr.push({ date: r.date, open: +r.open, high: +r.high, low: +r.low, close: +r.close, volume: +r.volume });
    bySymbol.set(r.symbol, arr);
  }
  for (const arr of bySymbol.values()) arr.sort((a, b) => a.date.localeCompare(b.date));
  const dates = /* @__PURE__ */ new Set();
  for (const arr of bySymbol.values()) for (const c of arr) dates.add(c.date);
  const sortedDates = [...dates].sort();
  const indexBySymbol = /* @__PURE__ */ new Map();
  for (const [sym, arr] of bySymbol) {
    const m2 = /* @__PURE__ */ new Map();
    for (const c of arr) m2.set(c.date, c);
    indexBySymbol.set(sym, m2);
  }
  const regimeByDate = /* @__PURE__ */ new Map();
  if (symbolFilter) {
    const { data: regRows } = await withSupabaseRetry(
      "load market_regimes",
      () => supabaseAdmin$5.from("market_regimes").select("date, regime").gte("date", sortedDates[0] ?? "1970-01-01").lte("date", sortedDates[sortedDates.length - 1] ?? "1970-01-01")
    );
    for (const r of regRows ?? []) {
      regimeByDate.set(r.date, r.regime);
    }
  } else {
    const marketCandles = sortedDates.map((d) => {
      let oSum = 0, hSum = 0, lSum = 0, cSum = 0, n = 0;
      let vol = 0;
      for (const m2 of indexBySymbol.values()) {
        const c = m2.get(d);
        if (c) {
          oSum += c.open;
          hSum += c.high;
          lSum += c.low;
          cSum += c.close;
          vol += c.volume;
          n++;
        }
      }
      const k = Math.max(1, n);
      return { date: d, open: oSum / k, high: hSum / k, low: lSum / k, close: cSum / k, volume: vol };
    });
    for (let i = warmup; i < marketCandles.length; i++) {
      regimeByDate.set(marketCandles[i].date, detectRegime(marketCandles.slice(Math.max(0, i - 60), i + 1)));
    }
  }
  const fromDate = sortedDates[Math.min(warmup, sortedDates.length - 1)] ?? (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const toDate = sortedDates[sortedDates.length - 1] ?? fromDate;
  let backtestId;
  if (params.backtestId) {
    backtestId = params.backtestId;
  } else {
    const { data: btRow } = await withSupabaseRetry(
      "create backtest",
      () => supabaseAdmin$5.from("backtests").insert({
        status: "running",
        from_date: fromDate,
        to_date: toDate,
        min_confidence: minConfidence,
        strategy_version: requireNews ? "v2-trending-only+news-gate" : "v2-trending-only",
        symbols_count: bySymbol.size
      }).select("id").single()
    );
    backtestId = btRow.id;
  }
  const newsDatesBySymbol = /* @__PURE__ */ new Map();
  if (requireNews) {
    const NPAGE = 1e3;
    for (let from = 0; ; from += NPAGE) {
      const q = supabaseAdmin$5.from("news_sentiment").select("symbol, published_at").gte("published_at", fromDate).order("published_at", { ascending: true }).range(from, from + NPAGE - 1);
      const { data: page } = await withSupabaseRetry(
        `load news page ${from}`,
        () => symbolsToLoad ? q.in("symbol", symbolsToLoad) : q
      );
      if (!page || page.length === 0) break;
      for (const r of page) {
        if (!r.published_at) continue;
        const d = r.published_at.slice(0, 10);
        const s = newsDatesBySymbol.get(r.symbol) ?? /* @__PURE__ */ new Set();
        s.add(d);
        newsDatesBySymbol.set(r.symbol, s);
      }
      if (page.length < NPAGE) break;
    }
  }
  const allTrades = [];
  for (const s of targetStocks) {
    const candles = bySymbol.get(s.symbol);
    if (!candles || candles.length < warmup + 3) continue;
    const t = simulateSymbol({
      symbol: s.symbol,
      candles,
      marketRegimeByDate: regimeByDate,
      minConfidence,
      warmup,
      maxHold,
      requireNews,
      newsLookbackDays,
      newsDatesBySymbol
    });
    allTrades.push(...t);
  }
  if (allTrades.length > 0) {
    const rows = allTrades.map((t) => ({
      backtest_id: backtestId,
      symbol: t.symbol,
      signal_date: t.signalDate,
      entry_date: t.entryDate,
      entry_price: t.entryPrice,
      exit_date: t.exitDate,
      exit_price: t.exitPrice,
      exit_reason: t.exitReason,
      pnl_pct: t.pnlPct,
      r_multiple: t.rMultiple,
      days_held: t.daysHeld,
      confidence: t.confidence,
      signal: t.signal,
      stop_loss: t.stopLoss,
      target: t.target,
      atr: t.atr,
      market_regime: t.marketRegime
    }));
    const CHUNK = 500;
    for (let i = 0; i < rows.length; i += CHUNK) {
      await withSupabaseRetry(
        `insert backtest trades ${i}`,
        () => supabaseAdmin$5.from("backtest_trades").insert(rows.slice(i, i + CHUNK))
      );
    }
  }
  if (params.backtestId) {
    return { ok: true, mode: "chunk", backtestId, tradesInserted: allTrades.length };
  }
  const m = computeMetrics(allTrades);
  await withSupabaseRetry(
    "complete backtest",
    () => supabaseAdmin$5.from("backtests").update({
      status: "completed",
      finished_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_trades: m.totalTrades,
      wins: m.wins,
      losses: m.losses,
      open_trades: m.openTrades,
      win_rate: m.winRate,
      avg_win_pct: m.avgWinPct,
      avg_loss_pct: m.avgLossPct,
      profit_factor: m.profitFactor,
      expectancy_pct: m.expectancyPct,
      max_drawdown_pct: m.maxDrawdownPct,
      sharpe: m.sharpe,
      total_return_pct: m.totalReturnPct,
      best_trade_pct: m.bestTradePct,
      worst_trade_pct: m.worstTradePct,
      avg_days_held: m.avgDaysHeld
    }).eq("id", backtestId)
  );
  return { ok: true, backtestId, metrics: m };
}
async function finalizeBacktest(backtestId) {
  const rows = [];
  const PAGE = 1e3;
  for (let from = 0; ; from += PAGE) {
    const { data: page } = await withSupabaseRetry(
      `load trades ${from}`,
      () => supabaseAdmin$5.from("backtest_trades").select("symbol, signal_date, entry_date, entry_price, exit_date, exit_price, exit_reason, pnl_pct, r_multiple, days_held, confidence, signal, stop_loss, target, atr, market_regime").eq("backtest_id", backtestId).range(from, from + PAGE - 1)
    );
    if (!page || page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  const trades = rows.map((r) => ({
    symbol: r.symbol,
    signalDate: r.signal_date,
    entryDate: r.entry_date ?? r.signal_date,
    entryPrice: Number(r.entry_price ?? 0),
    exitDate: r.exit_date,
    exitPrice: r.exit_price === null ? null : Number(r.exit_price),
    exitReason: r.exit_reason,
    pnlPct: r.pnl_pct === null ? null : Number(r.pnl_pct),
    rMultiple: r.r_multiple === null ? null : Number(r.r_multiple),
    daysHeld: r.days_held ?? 0,
    confidence: Number(r.confidence ?? 0),
    signal: r.signal ?? "buy",
    stopLoss: Number(r.stop_loss ?? 0),
    target: Number(r.target ?? 0),
    atr: Number(r.atr ?? 0),
    marketRegime: r.market_regime ?? "neutral"
  }));
  const m = computeMetrics(trades);
  await withSupabaseRetry(
    "complete backtest",
    () => supabaseAdmin$5.from("backtests").update({
      status: "completed",
      finished_at: (/* @__PURE__ */ new Date()).toISOString(),
      total_trades: m.totalTrades,
      wins: m.wins,
      losses: m.losses,
      open_trades: m.openTrades,
      win_rate: m.winRate,
      avg_win_pct: m.avgWinPct,
      avg_loss_pct: m.avgLossPct,
      profit_factor: m.profitFactor,
      expectancy_pct: m.expectancyPct,
      max_drawdown_pct: m.maxDrawdownPct,
      sharpe: m.sharpe,
      total_return_pct: m.totalReturnPct,
      best_trade_pct: m.bestTradePct,
      worst_trade_pct: m.worstTradePct,
      avg_days_held: m.avgDaysHeld
    }).eq("id", backtestId)
  );
  return { ok: true, mode: "finalize", backtestId, metrics: m };
}
async function precomputeMarketRegimes(fromDate, toDate, warmup) {
  const rows = [];
  const PAGE = 1e3;
  for (let from = 0; ; from += PAGE) {
    const { data: page } = await withSupabaseRetry(
      `load candles for regime ${from}`,
      () => supabaseAdmin$5.from("daily_candles").select("date, open, high, low, close, volume").gte("date", fromDate).lte("date", toDate).order("date", { ascending: true }).range(from, from + PAGE - 1)
    );
    if (!page || page.length === 0) break;
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  if (rows.length === 0) return 0;
  const agg = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const a = agg.get(r.date) ?? { o: 0, h: 0, l: 0, c: 0, v: 0, n: 0 };
    a.o += +r.open;
    a.h += +r.high;
    a.l += +r.low;
    a.c += +r.close;
    a.v += +r.volume;
    a.n++;
    agg.set(r.date, a);
  }
  const sortedDates = [...agg.keys()].sort();
  const marketCandles = sortedDates.map((d) => {
    const a = agg.get(d);
    const k = Math.max(1, a.n);
    return { date: d, open: a.o / k, high: a.h / k, low: a.l / k, close: a.c / k, volume: a.v };
  });
  const upserts = [];
  for (let i = warmup; i < marketCandles.length; i++) {
    const regime = detectRegime(marketCandles.slice(Math.max(0, i - 60), i + 1));
    upserts.push({ date: marketCandles[i].date, regime });
  }
  const CHUNK = 500;
  for (let i = 0; i < upserts.length; i += CHUNK) {
    await withSupabaseRetry(
      `upsert market_regimes ${i}`,
      () => supabaseAdmin$5.from("market_regimes").upsert(upserts.slice(i, i + CHUNK), { onConflict: "date" })
    );
  }
  return upserts.length;
}
const TRAINING_SWEEPS = [
  { minConfidence: 55, warmup: 50, maxHold: 7 },
  { minConfidence: 60, warmup: 45, maxHold: 5 },
  { minConfidence: 65, warmup: 55, maxHold: 9 },
  { minConfidence: 70, warmup: 40, maxHold: 6 },
  { minConfidence: 75, warmup: 60, maxHold: 10 }
];
const Route$14 = createFileRoute("/api/public/hooks/instant-train")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const force = url.searchParams.get("force") === "1";
          const auto = url.searchParams.get("auto") === "1";
          const { data: cycleState } = await withSupabaseRetry(
            "load learning cycle",
            () => supabaseAdmin$5.from("model_state").select("data").eq("key", "learning_cycle_v1").maybeSingle()
          );
          const previousCycle = Number(cycleState?.data?.cycle ?? 0);
          const cycle = previousCycle + 1;
          const sweep = TRAINING_SWEEPS[previousCycle % TRAINING_SWEEPS.length];
          const { data: recent } = await withSupabaseRetry(
            "load recent backtest",
            () => supabaseAdmin$5.from("backtests").select("id, finished_at, total_trades").eq("status", "completed").order("finished_at", { ascending: false }).limit(1)
          );
          const last = recent?.[0];
          const fresh = !force && last && (last.total_trades ?? 0) > 50;
          let backtestResult = { skipped: true, reason: last ? "existing_backtest" : "no_backtest_yet", lastId: last?.id };
          if (force && !fresh) {
            try {
              backtestResult = await runBacktestJob(sweep);
            } catch (err) {
              backtestResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
            }
          }
          const [threshold, weights, adversarial, isotonic, memory, online] = await Promise.allSettled([
            recomputeAutoThreshold(),
            updateEnsembleMetaWeights(),
            runAdversarialLearner(),
            loadIsotonicCalibration(),
            // يعيد بناء معايرة الثقة
            loadSymbolMemory(),
            // يعيد بناء ذاكرة الأنماط لكل سهم
            bootstrapOnlineCalibration()
            // يملأ buckets الـ online من التاريخ
          ]);
          await withSupabaseRetry(
            "save learning cycle",
            () => supabaseAdmin$5.from("model_state").upsert({
              key: "learning_cycle_v1",
              data: {
                cycle,
                auto,
                sweep,
                last_run_at: (/* @__PURE__ */ new Date()).toISOString(),
                last_backtest: backtestResult
              },
              updated_at: (/* @__PURE__ */ new Date()).toISOString()
            })
          );
          return Response.json({
            ok: true,
            cycle,
            sweep,
            mode: auto ? "auto" : "manual",
            backtest: backtestResult,
            threshold: threshold.status === "fulfilled" ? threshold.value : { error: String(threshold.reason) },
            weights: weights.status === "fulfilled" ? weights.value : { error: String(weights.reason) },
            adversarial: adversarial.status === "fulfilled" ? adversarial.value : { error: String(adversarial.reason) },
            isotonic: isotonic.status === "fulfilled" ? { fitted: isotonic.value.fitted, samples: isotonic.value.sampleSize, bins: isotonic.value.bins.length } : { error: String(isotonic.reason) },
            symbol_memory: memory.status === "fulfilled" ? { symbols: memory.value.size } : { error: String(memory.reason) },
            online: online.status === "fulfilled" ? online.value : { error: String(online.reason) }
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[instant-train] handler failed:", err);
          return Response.json(
            { ok: false, error: message, hint: "تواصل الشبكة مع قاعدة البيانات فشل — جرّب تاني خلال ثواني" },
            { status: 200 }
          );
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST to trigger instant training" })
    }
  }
});
function sma$1(arr) {
  if (!arr.length) return null;
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}
const Route$13 = createFileRoute("/api/public/hooks/intraday-breakout-scan")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow2.getDay();
        const hh = cairoNow2.getHours();
        const inSession = dow >= 0 && dow <= 4 && hh >= 10 && (hh < 14 || hh === 14 && cairoNow2.getMinutes() <= 30);
        if (!inSession) return Response.json({ ok: true, skipped: "out_of_session" });
        const todayCairo = cairoNow2.toISOString().slice(0, 10);
        const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_sharia", true);
        const symbols = (stocks ?? []).map((s) => s.symbol);
        const nameMap = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar]));
        if (!symbols.length) return Response.json({ ok: false, error: "no_symbols" });
        const { data: already } = await supabaseAdmin$5.from("intraday_breakouts").select("symbol").eq("trade_date", todayCairo);
        const skip = new Set((already ?? []).map((r) => r.symbol));
        const fromDate = new Date(Date.now() - 320 * 864e5).toISOString().slice(0, 10);
        const rows = [];
        for (let f = 0; ; f += 1e3) {
          const { data } = await supabaseAdmin$5.from("daily_candles").select("symbol,date,close,high,volume").in("symbol", symbols).gte("date", fromDate).order("symbol").order("date").range(f, f + 999);
          if (!data?.length) break;
          rows.push(...data.map((r) => ({ symbol: r.symbol, date: r.date, close: +r.close, high: +r.high, volume: Number(r.volume) || 0 })));
          if (data.length < 1e3) break;
        }
        const bySym = /* @__PURE__ */ new Map();
        for (const r of rows) {
          const a = bySym.get(r.symbol) ?? [];
          a.push(r);
          bySym.set(r.symbol, a);
        }
        for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));
        const startOfDay = (/* @__PURE__ */ new Date(`${todayCairo}T00:00:00Z`)).toISOString();
        const { data: ticks } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, volume, ts").in("symbol", symbols).gte("ts", startOfDay).order("ts", { ascending: true });
        const ticksBySym = /* @__PURE__ */ new Map();
        for (const t of ticks ?? []) {
          const a = ticksBySym.get(t.symbol) ?? [];
          a.push({ price: +t.price, volume: t.volume == null ? null : Number(t.volume) });
          ticksBySym.set(t.symbol, a);
        }
        const detected = [];
        const inserts = [];
        for (const sym of symbols) {
          if (skip.has(sym)) continue;
          const hist = bySym.get(sym);
          if (!hist || hist.length < 220) continue;
          const ticksToday = ticksBySym.get(sym);
          if (!ticksToday?.length) continue;
          const histPrior = hist.filter((r) => r.date < todayCairo);
          if (histPrior.length < 220) continue;
          const last20 = histPrior.slice(-20);
          const last50 = histPrior.slice(-50);
          const last200 = histPrior.slice(-200);
          const hh20 = Math.max(...last20.map((r) => r.high));
          const sma50 = sma$1(last50.map((r) => r.close));
          const sma200 = sma$1(last200.map((r) => r.close));
          const vavg20 = sma$1(last20.map((r) => r.volume));
          const prevClose = histPrior.at(-1).close;
          const intradayHigh = Math.max(...ticksToday.map((t) => t.price));
          const currentPrice = ticksToday.at(-1).price;
          const volsSeen = ticksToday.map((t) => t.volume).filter((v) => v != null && v > 0);
          const intradayVol = volsSeen.length ? Math.max(...volsSeen) : 0;
          const volX = vavg20 > 0 ? intradayVol / vavg20 : 0;
          const openPrice = ticksToday[0].price;
          const gapPct = prevClose > 0 ? (openPrice - prevClose) / prevClose * 100 : 0;
          const f_breakout = intradayHigh > hh20;
          const f_sma50 = currentPrice >= sma50;
          const f_sma200 = currentPrice >= sma200;
          const f_vol = volX >= 1.5;
          const f_gap = gapPct <= 3;
          if (!(f_breakout && f_sma50 && f_sma200 && f_vol && f_gap)) continue;
          inserts.push({
            symbol: sym,
            trade_date: todayCairo,
            breakout_price: currentPrice,
            hh20,
            sma50,
            sma200,
            vol_intraday: intradayVol,
            vol_avg20: vavg20,
            vol_x: volX,
            prev_close: prevClose,
            gap_pct: gapPct,
            filters_passed: { f_breakout, f_sma50, f_sma200, f_vol, f_gap },
            telegram_sent: false
          });
          detected.push({ symbol: sym, price: currentPrice, vol_x: volX, hh20 });
        }
        if (inserts.length) {
          await supabaseAdmin$5.from("intraday_breakouts").insert(inserts);
        }
        if (detected.length) {
          const lines = detected.map((d) => {
            const name = nameMap.get(d.symbol) ?? d.symbol;
            const upPct = ((d.price - d.hh20) / d.hh20 * 100).toFixed(1);
            return `🎯 <b>${d.symbol}</b> (${name})
   السعر: ${d.price.toFixed(2)} | فوق قمة 20 يوم بـ +${upPct}% | Vol ${d.vol_x.toFixed(1)}x`;
          });
          const msg = `⚡️ <b>اختراق Intraday — V2.1</b>
${cairoNow2.toLocaleString("ar-EG")}

${lines.join("\n\n")}

📌 الاستراتيجية المعتمدة. ادخل دلوقتي قبل الإقفال لتكسب حركة باقي اليوم.`;
          const sent = await sendTelegram$1(msg);
          if (sent.ok) {
            await supabaseAdmin$5.from("intraday_breakouts").update({ telegram_sent: true }).eq("trade_date", todayCairo).in("symbol", detected.map((d) => d.symbol));
          }
        }
        return Response.json({ ok: true, scanned: symbols.length, detected: detected.length, symbols: detected.map((d) => d.symbol) });
      }
    }
  }
});
const CORS$f = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey"
};
async function handler$5({ request }) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const dry = url.searchParams.get("dry") === "1";
  if (!symbol) {
    return Response.json({ ok: false, error: "missing_symbol" }, { status: 400, headers: CORS$f });
  }
  const { checkL2CoverageAndAlert } = await import("./l2-coverage-alert.server-ZR6KoGet.mjs");
  const result = await checkL2CoverageAndAlert(symbol, { dry });
  return Response.json({ ok: true, dry, result }, { headers: CORS$f });
}
const Route$12 = createFileRoute("/api/public/hooks/l2-coverage-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$f }),
      GET: handler$5,
      POST: handler$5
    }
  }
});
const CORS$e = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey"
};
async function handler$4() {
  const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
  const { sendTelegram: sendTelegram2 } = await import("./telegram.server-D6g8flro.mjs").then((n) => n.t);
  const now = /* @__PURE__ */ new Date();
  const since10m = new Date(now.getTime() - 10 * 6e4).toISOString();
  const since24h = new Date(now.getTime() - 24 * 36e5).toISOString();
  const [{ data: latest }, { count: last10m }, { count: last24h, data: distinct24h }] = await Promise.all([
    supabaseAdmin2.from("orderbook_snapshots").select("ts, symbol").order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin2.from("orderbook_snapshots").select("id", { count: "exact", head: true }).gte("ts", since10m),
    supabaseAdmin2.from("orderbook_snapshots").select("symbol", { count: "exact" }).gte("ts", since24h)
  ]);
  const latestTs = latest?.ts ? new Date(latest.ts).toISOString() : null;
  const ageMin = latestTs ? Math.round((now.getTime() - new Date(latestTs).getTime()) / 6e4) : null;
  const distinctSymbols = new Set((distinct24h ?? []).map((r) => r.symbol)).size;
  const healthy = (last10m ?? 0) >= 3;
  const emoji = healthy ? "✅" : "⚠️";
  const status = healthy ? "L2 شغّال" : "L2 مش شغّال / قليل جدًا";
  const text = `<b>${emoji} فحص L2 قبل السوق</b>
الحالة: <b>${status}</b>

آخر snapshot: ${latestTs ? `${ageMin} دقيقة` : "لا يوجد"}
آخر 10د: <b>${last10m ?? 0}</b> snapshots
آخر 24س: <b>${last24h ?? 0}</b> snapshots على <b>${distinctSymbols}</b> سهم

` + (healthy ? "الإكستنشن Thunder شغّال والبوابة هتقدر تتحقق." : "🔴 <b>افتح Thunder Extension على المتصفح فورًا</b> عشان البوابة تشتغل صح.");
  await sendTelegram2(text);
  return Response.json({
    ok: true,
    healthy,
    latest_ts: latestTs,
    latest_age_min: ageMin,
    snapshots_last_10m: last10m ?? 0,
    snapshots_last_24h: last24h ?? 0,
    distinct_symbols_24h: distinctSymbols
  }, { headers: CORS$e });
}
const Route$11 = createFileRoute("/api/public/hooks/l2-health-check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$e }),
      GET: handler$4,
      POST: handler$4
    }
  }
});
async function alreadySent(pick_date, symbol, kind) {
  const { data } = await supabaseAdmin$5.from("pick_notifications").select("id").eq("pick_date", pick_date).eq("symbol", symbol).eq("kind", kind).maybeSingle();
  return !!data;
}
async function markSent(pick_date, symbol, kind, payload) {
  await supabaseAdmin$5.from("pick_notifications").insert({ pick_date, symbol, kind, payload: payload == null ? null : JSON.parse(JSON.stringify(payload)) });
}
function cairoDateString$2() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
function pct(now, base) {
  return base > 0 ? (now - base) / base * 100 : 0;
}
async function findBetterReplacement(args) {
  const currentPnl = pct(args.currentPrice, Number(args.current.entry_price));
  const closeToStop = args.currentPrice <= Number(args.current.stop_price) * 1.01;
  const losingNow = currentPnl <= -0.75 || args.currentTrendPct <= -0.6 || closeToStop;
  if (!losingNow) return null;
  const { count: switchesToday } = await supabaseAdmin$5.from("pick_notifications").select("id", { count: "exact", head: true }).eq("pick_date", args.today).or("kind.ilike.monitor:auto_switch:%,kind.ilike.monitor:reopen_after_loss:%");
  if ((switchesToday ?? 0) >= 1) return null;
  const { data: usedToday } = await supabaseAdmin$5.from("daily_picks").select("symbol").eq("pick_date", args.today);
  const usedSymbolSet = new Set((usedToday ?? []).map((r) => r.symbol));
  const { data: recs } = await supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, price_at_reco, expected_gain_pct, created_at").eq("outcome", "pending").in("signal", ["buy", "strong_buy"]).gte("created_at", `${args.today}T00:00:00.000Z`).order("confidence", { ascending: false }).limit(80);
  const symbols = Array.from(
    new Set(
      (recs ?? []).map((r) => r.symbol).filter((s) => s && s !== args.current.symbol && !isBlocked(s) && !usedSymbolSet.has(s))
    )
  );
  if (!symbols.length) return null;
  const snaps = await fetchEgxSnapshots(symbols).catch(() => /* @__PURE__ */ new Map());
  const { data: tickRows } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, ts").in("symbol", symbols).gte("ts", `${args.today}T07:00:00.000Z`).order("ts", { ascending: false }).limit(500);
  const latestTick = /* @__PURE__ */ new Map();
  for (const t of tickRows ?? []) if (!latestTick.has(t.symbol)) latestTick.set(t.symbol, Number(t.price));
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", symbols);
  const nameMap = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar ?? s.symbol]));
  const currentScore = Number(args.current.confidence) + currentPnl * 14 + args.currentTrendPct * 12;
  let best = null;
  for (const r of recs ?? []) {
    if (r.symbol === args.current.symbol) continue;
    if (isBlocked(r.symbol)) continue;
    const snap = snaps.get(r.symbol);
    const livePrice = snap?.close ?? latestTick.get(r.symbol) ?? 0;
    const recoPrice = Number(r.price_at_reco ?? r.entry_min ?? 0);
    const target = Number(r.target);
    const stop = Number(r.stop_loss);
    const confidence = Number(r.confidence ?? 0);
    if (!(livePrice > 0) || !(target > livePrice) || !(stop > 0) || livePrice <= stop) continue;
    const livePnl = pct(livePrice, recoPrice);
    const remainingUpside = pct(target, livePrice);
    const expectedGain = Number(r.expected_gain_pct ?? remainingUpside);
    const signalBonus = String(r.signal) === "strong_buy" ? 10 : 6;
    const candidateScore = confidence + livePnl * 8 + remainingUpside * 2 + expectedGain + signalBonus;
    if (confidence < 85) continue;
    if (livePnl < 1) continue;
    if (remainingUpside < 1.2) continue;
    if (expectedGain < 1.2) continue;
    if (candidateScore < currentScore + 15) continue;
    const safeStop = +Math.min(stop, livePrice * 0.98).toFixed(4);
    const stopPctFromEntry = (livePrice - safeStop) / livePrice * 100;
    if (stopPctFromEntry < 2 || stopPctFromEntry > 4) continue;
    const reasons = [
      `تبديل تلقائي: الترشيح الحالي بقى ${currentPnl.toFixed(2)}%`,
      `البديل صاعد لحظياً +${livePnl.toFixed(2)}% ولسه قدامه +${remainingUpside.toFixed(2)}% للهدف`,
      ...(r.reasons_ar ?? []).slice(0, 2)
    ];
    const candidate = {
      symbol: r.symbol,
      name_ar: nameMap.get(r.symbol) ?? r.symbol,
      entry: +livePrice.toFixed(4),
      target: +target.toFixed(4),
      stop: safeStop,
      confidence,
      score: +candidateScore.toFixed(2),
      reasons,
      livePnl,
      remainingUpside
    };
    if (!best || candidate.score > best.score) best = candidate;
  }
  return best;
}
const Route$10 = createFileRoute("/api/public/hooks/live-pick-monitor")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow2.getDay();
        const hh = cairoNow2.getHours();
        const mm = cairoNow2.getMinutes();
        const inSession = dow >= 0 && dow <= 4 && hh >= 10 && (hh < 14 || hh === 14 && mm <= 30);
        if (!inSession) return Response.json({ ok: true, skipped: "out_of_session" });
        const today = cairoDateString$2();
        const { data: picks } = await supabaseAdmin$5.from("daily_picks").select("id, symbol, name_ar, entry_price, target_price, stop_price, status, confidence").eq("pick_date", today).eq("status", "open");
        if (!picks?.length) {
          const { data: lastToday } = await supabaseAdmin$5.from("daily_picks").select("id, symbol, name_ar, entry_price, target_price, stop_price, status, confidence, exit_price, pnl_pct").eq("pick_date", today).order("updated_at", { ascending: false }).limit(1).maybeSingle();
          if (!lastToday || !["loss", "closed", "win", "expired"].includes(String(lastToday.status))) {
            return Response.json({ ok: true, picks: 0 });
          }
          const { data: lastTick2 } = await supabaseAdmin$5.from("live_ticks").select("price").eq("symbol", lastToday.symbol).order("ts", { ascending: false }).limit(1).maybeSingle();
          const currentPrice = Number(lastTick2?.price ?? lastToday.exit_price ?? lastToday.entry_price);
          const replacement = await findBetterReplacement({
            today,
            current: {
              symbol: lastToday.symbol,
              confidence: Number(lastToday.confidence ?? 0),
              entry_price: Number(lastToday.entry_price),
              stop_price: Number(lastToday.stop_price)
            },
            currentPrice,
            currentTrendPct: -1
          });
          if (!replacement) return Response.json({ ok: true, picks: 0, action: "no_replacement" });
          const { data: newPick } = await supabaseAdmin$5.from("daily_picks").insert({
            pick_date: today,
            symbol: replacement.symbol,
            name_ar: replacement.name_ar,
            entry_price: replacement.entry,
            target_price: replacement.target,
            stop_price: replacement.stop,
            target_pct: +((replacement.target - replacement.entry) / replacement.entry * 100).toFixed(2),
            stop_pct: +((replacement.entry - replacement.stop) / replacement.entry * 100).toFixed(2),
            confidence: replacement.confidence,
            kelly_pct: Math.max(0.08, Math.min(0.25, replacement.confidence / 400)),
            score: replacement.score,
            reasons: replacement.reasons,
            status: "open"
          }).select("id").maybeSingle();
          if (!newPick) return Response.json({ ok: false, action: "insert_replacement_failed" }, { status: 500 });
          const kind = `monitor:reopen_after_loss:${lastToday.symbol}->${replacement.symbol}`;
          if (!await alreadySent(today, lastToday.symbol, kind)) {
            const sent = await sendTelegram$1(
              `<b>🔁 بديل تلقائي بعد فشل الصفقة</b>
الصفقة السابقة: <b>${escapeHtml(lastToday.name_ar ?? lastToday.symbol)}</b> (<code>${lastToday.symbol}</code>)

البديل الحالي: <b>${escapeHtml(replacement.name_ar ?? replacement.symbol)}</b> (<code>${replacement.symbol}</code>)
💵 دخول: <b>${replacement.entry.toFixed(2)}</b> · 🎯 ${replacement.target.toFixed(2)} · 🛑 ${replacement.stop.toFixed(2)}
📊 ثقة: <b>${replacement.confidence.toFixed(0)}%</b>`
            );
            if (sent.ok) await markSent(today, lastToday.symbol, kind, { from: lastToday.symbol, to: replacement.symbol, replacement });
          }
          return Response.json({ ok: true, picks: 0, action: "reopened_with_replacement", to: replacement.symbol });
        }
        const bucket = Math.floor(mm / 5);
        const results = [];
        for (const p of picks) {
          const { data: tickRow } = await supabaseAdmin$5.from("live_ticks").select("price, volume, ts").eq("symbol", p.symbol).gte("ts", `${today}T07:00:00.000Z`).order("ts", { ascending: false }).limit(1).maybeSingle();
          if (!tickRow) {
            results.push({ symbol: p.symbol, skipped: "no_tick_today" });
            continue;
          }
          const tickAgeSec = (Date.now() - new Date(tickRow.ts).getTime()) / 1e3;
          if (tickAgeSec > 600) {
            results.push({ symbol: p.symbol, skipped: "stale_tick", age_sec: Math.round(tickAgeSec) });
            continue;
          }
          const price = Number(tickRow.price);
          const entry = Number(p.entry_price);
          const target = Number(p.target_price);
          const stop = Number(p.stop_price);
          const pnlPct = (price - entry) / entry * 100;
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1e3).toISOString();
          const { data: prevRow } = await supabaseAdmin$5.from("live_ticks").select("price").eq("symbol", p.symbol).lte("ts", fiveMinAgo).order("ts", { ascending: false }).limit(1).maybeSingle();
          const prevPrice = prevRow ? Number(prevRow.price) : price;
          const trendPct = prevPrice ? (price - prevPrice) / prevPrice * 100 : 0;
          const trend = trendPct > 0.2 ? "📈 صاعد" : trendPct < -0.2 ? "📉 هابط" : "➡️ ثابت";
          const replacement = await findBetterReplacement({
            today,
            current: {
              symbol: p.symbol,
              confidence: Number(p.confidence ?? 0),
              entry_price: entry,
              stop_price: stop
            },
            currentPrice: price,
            currentTrendPct: trendPct
          });
          if (replacement) {
            const switchKind = `monitor:auto_switch:${p.symbol}->${replacement.symbol}`;
            const currentPnL = pct(price, entry);
            const { error: closeError } = await supabaseAdmin$5.from("daily_picks").update({
              status: "closed",
              exit_price: price,
              exit_date: today,
              pnl_pct: currentPnL
            }).eq("id", p.id);
            const { error } = closeError ? { error: closeError } : await supabaseAdmin$5.from("daily_picks").insert({
              pick_date: today,
              symbol: replacement.symbol,
              name_ar: replacement.name_ar,
              entry_price: replacement.entry,
              target_price: replacement.target,
              stop_price: replacement.stop,
              target_pct: +((replacement.target - replacement.entry) / replacement.entry * 100).toFixed(2),
              stop_pct: +((replacement.entry - replacement.stop) / replacement.entry * 100).toFixed(2),
              confidence: replacement.confidence,
              kelly_pct: Math.max(0.08, Math.min(0.25, replacement.confidence / 400)),
              score: replacement.score,
              reasons: replacement.reasons,
              status: "open"
            });
            if (!error && !await alreadySent(today, p.symbol, switchKind)) {
              const text2 = `<b>🔁 تبديل تلقائي لصفقة اليوم</b>
خرجنا من <b>${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>) لأن الأداء اللحظي بقى <b>${currentPnL.toFixed(2)}%</b> ${trend}

البديل الأفضل: <b>${escapeHtml(replacement.name_ar ?? replacement.symbol)}</b> (<code>${replacement.symbol}</code>)
💵 دخول جديد: <b>${replacement.entry.toFixed(2)}</b>
🎯 هدف: <b>${replacement.target.toFixed(2)}</b> · 🛑 ستوب: <b>${replacement.stop.toFixed(2)}</b>
📊 ثقة: <b>${replacement.confidence.toFixed(0)}%</b> · صعود لحظي: <b>+${replacement.livePnl.toFixed(2)}%</b>

<b>السبب:</b> ${escapeHtml(replacement.reasons.slice(0, 2).join(" — "))}`;
              const sent = await sendTelegram$1(text2);
              if (sent.ok) await markSent(today, p.symbol, switchKind, { from: p.symbol, to: replacement.symbol, price, replacement });
            }
            results.push({ symbol: p.symbol, action: "auto_switched", to: replacement.symbol, price, replacementScore: replacement.score });
            continue;
          }
          let alertKind = null;
          let advice = "";
          let header = "";
          if (price >= target) {
            alertKind = "monitor:target_hit";
            header = `🎯 وصل الهدف — بيع فوراً`;
            advice = `الهدف ${target.toFixed(2)} تحقق · اخرج بربح +${pnlPct.toFixed(2)}%`;
          } else if (price <= stop) {
            alertKind = "monitor:stop_hit";
            header = `🛑 ضرب الستوب — اخرج فوراً`;
            advice = `الستوب ${stop.toFixed(2)} ضُرب · احمي رأس المال (${pnlPct.toFixed(2)}%)`;
          } else if (pnlPct >= 5) {
            alertKind = `monitor:trail_5_${today}`;
            const newStop = +(price * 0.97).toFixed(2);
            header = `📈 ربح +${pnlPct.toFixed(2)}% — حرّك الستوب`;
            advice = `حرّك الستوب لـ ${newStop.toFixed(2)} (3% تحت السعر) واحتفظ`;
          } else if (pnlPct >= 2) {
            alertKind = `monitor:up2_${today}`;
            header = `✅ السهم في الربح +${pnlPct.toFixed(2)}%`;
            advice = `خليك — السهم بيتحرك صح. الستوب ${stop.toFixed(2)}، الهدف ${target.toFixed(2)}`;
          } else if (pnlPct <= -1.5) {
            alertKind = `monitor:down15_${today}`;
            header = `⚠️ السهم في خسارة ${pnlPct.toFixed(2)}%`;
            advice = `استنى — الستوب لسه ${stop.toFixed(2)}. ابيع بس لو وصل الستوب`;
          } else {
            alertKind = `monitor:hb_${today}_${bucket}_${hh}`;
            header = `🔄 متابعة لحظية ${trend}`;
            advice = `السعر ${price.toFixed(2)} · P/L ${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% · احتفظ`;
          }
          if (await alreadySent(today, p.symbol, alertKind)) {
            results.push({ symbol: p.symbol, skipped: "dedup", kind: alertKind });
            continue;
          }
          const text = `<b>${header}</b>
<b>${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>)
💵 السعر اللحظي: <b>${price.toFixed(2)}</b> ${trend}
📊 من الدخول ${entry.toFixed(2)}: <b>${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%</b>
🎯 هدف ${target.toFixed(2)} · 🛑 ستوب ${stop.toFixed(2)}

<b>توصية:</b> ${escapeHtml(advice)}`;
          const res = await sendTelegram$1(text);
          if (res.ok) {
            await markSent(today, p.symbol, alertKind, { price, pnlPct, trendPct });
          }
          if (price >= target || price <= stop) {
            const finalStatus = price >= target ? "win" : "loss";
            await supabaseAdmin$5.from("daily_picks").update({
              status: finalStatus,
              exit_price: price,
              exit_date: today,
              pnl_pct: pnlPct
            }).eq("id", p.id);
          }
          results.push({ symbol: p.symbol, price, pct: +pnlPct.toFixed(2), kind: alertKind, sent: res.ok });
        }
        return Response.json({ ok: true, picks: picks.length, results });
      }
    }
  }
});
const Route$$ = createFileRoute("/api/public/hooks/live-price-status")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const parts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Africa/Cairo",
            weekday: "short",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false
          }).formatToParts(/* @__PURE__ */ new Date());
          const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
          const wd = get("weekday");
          const dowMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const dow = dowMap[wd] ?? 0;
          const hm = get("hour") + ":" + get("minute");
          const [hh, mm] = hm.split(":").map((x) => parseInt(x, 10));
          const mins = (hh || 0) * 60 + (mm || 0);
          const inSession = MW_PARAMS.SESSION_DAYS.includes(dow) && mins >= 9 * 60 + 45 && mins <= 14 * 60 + 45;
          const { data: lastSnap } = await supabaseAdmin$5.from("marketwatch_snapshots").select("captured_at").order("captured_at", { ascending: false }).limit(1).maybeSingle();
          const lastCaptureAt = lastSnap ? String(lastSnap.captured_at) : null;
          let ageMin = null;
          if (lastCaptureAt) {
            ageMin = Math.round((Date.now() - Date.parse(lastCaptureAt)) / 6e4);
          }
          let symbolsLast15m = 0;
          {
            const since = new Date(Date.now() - 15 * 6e4).toISOString();
            const { data: syms } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol").gte("captured_at", since);
            symbolsLast15m = new Set((syms ?? []).map((r) => String(r.symbol).toUpperCase())).size;
          }
          let status = "closed";
          if (inSession) {
            status = ageMin !== null && ageMin <= 10 && symbolsLast15m >= 30 ? "live" : "stale";
          }
          return Response.json({
            ok: true,
            status,
            inSession,
            lastCaptureAt,
            ageMin,
            symbolsLast15m,
            checkedAt: (/* @__PURE__ */ new Date()).toISOString()
          });
        } catch (e) {
          return Response.json({ ok: false, error: e?.message ?? "probe failed" }, { status: 500 });
        }
      }
    }
  }
});
const Route$_ = createFileRoute("/api/public/hooks/live-signal-scan")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow2.getDay();
        const hh = cairoNow2.getHours();
        const mm = cairoNow2.getMinutes();
        const inSession = dow >= 0 && dow <= 4 && hh >= 10 && (hh < 14 || hh === 14 && mm <= 30);
        if (!inSession) {
          return Response.json({ ok: true, skipped: "out_of_session" });
        }
        const breadth = await computeMarketBreadth$1().catch(() => null);
        if (breadth != null && breadth < 40) {
          return Response.json({ ok: true, skipped: "weak_breadth", breadth });
        }
        const today = cairoNow2.toISOString().slice(0, 10);
        const dayStart = (/* @__PURE__ */ new Date(`${today}T07:00:00Z`)).toISOString();
        const { data: rows } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, volume, ts").gte("ts", dayStart).order("ts", { ascending: true });
        const ticks = rows ?? [];
        if (!ticks.length) {
          return Response.json({ ok: true, ticks: 0 });
        }
        const firstBySym = /* @__PURE__ */ new Map();
        const lastBySym = /* @__PURE__ */ new Map();
        const volSumBySym = /* @__PURE__ */ new Map();
        for (const t of ticks) {
          if (!firstBySym.has(t.symbol)) firstBySym.set(t.symbol, t);
          lastBySym.set(t.symbol, t);
          if (t.volume) volSumBySym.set(t.symbol, (volSumBySym.get(t.symbol) ?? 0) + Number(t.volume));
        }
        const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").eq("is_sharia", true).eq("is_active", true);
        const sharia = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar ?? s.symbol]));
        const { data: existing } = await supabaseAdmin$5.from("daily_picks").select("id, symbol, score, entry_price, status").eq("pick_date", today).maybeSingle();
        const candidates = [];
        for (const [sym, first] of firstBySym) {
          if (!sharia.has(sym)) continue;
          if (existing && existing.symbol === sym) continue;
          const last = lastBySym.get(sym);
          if (!first.price || !last.price) continue;
          const pct2 = (last.price - first.price) / first.price * 100;
          if (pct2 < 2) continue;
          candidates.push({
            symbol: sym,
            name_ar: sharia.get(sym),
            open: first.price,
            last: last.price,
            pct: pct2
          });
        }
        candidates.sort((a, b) => b.pct - a.pct);
        if (candidates.length > 0) {
          const since = new Date(Date.now() - 6 * 3600 * 1e3).toISOString();
          const topSymbols = candidates.slice(0, 10).map((c) => c.symbol);
          const { data: news } = await supabaseAdmin$5.from("news_sentiment").select("symbol, sentiment_score, impact_level, headline, published_at").in("symbol", topSymbols).gte("published_at", since).order("published_at", { ascending: false });
          const newsBySym = /* @__PURE__ */ new Map();
          for (const n of news ?? []) {
            if (!newsBySym.has(n.symbol)) {
              newsBySym.set(n.symbol, {
                score: Number(n.sentiment_score) || 0,
                impact: n.impact_level ?? "low",
                headline: n.headline ?? ""
              });
            }
          }
          for (const c of candidates) {
            const n = newsBySym.get(c.symbol);
            if (!n) continue;
            const impactMult = n.impact === "high" ? 1.5 : n.impact === "medium" ? 1 : 0.5;
            const boost = n.score * impactMult;
            c.news_boost = boost;
            c.news_headline = n.headline;
            c.pct += boost;
          }
          candidates.sort((a, b) => b.pct - a.pct);
        }
        const top = candidates[0];
        if (!top) {
          return Response.json({ ok: true, breadth, ticks: ticks.length, candidates: 0, action: "none" });
        }
        const target = +(top.last * 1.05).toFixed(2);
        const stop = +(top.last * 0.98).toFixed(2);
        const confidence = Math.min(85, 60 + top.pct * 5);
        const reasons = [
          `breakout لحظي +${top.pct.toFixed(2)}% من فتح اليوم`,
          `حجم تراكمي: ${(volSumBySym.get(top.symbol) ?? 0).toLocaleString("en-US")}`,
          `breadth: ${breadth?.toFixed(1) ?? "N/A"}%`
        ];
        if (top.news_headline) {
          reasons.push(`📰 خبر: ${top.news_headline.slice(0, 80)} (تأثير ${top.news_boost?.toFixed(2)})`);
        }
        const payload = {
          pick_date: today,
          symbol: top.symbol,
          name_ar: top.name_ar,
          entry_price: top.last,
          target_price: target,
          stop_price: stop,
          target_pct: 5,
          stop_pct: 2,
          max_hold_days: 5,
          confidence,
          kelly_pct: 0,
          score: top.pct,
          reasons,
          status: "open"
        };
        let action = "kept";
        if (!existing) {
          const { error } = await supabaseAdmin$5.from("daily_picks").insert(payload);
          if (error) {
            console.error("[live-signal-scan] insert failed", top.symbol, error.message);
          } else {
            action = "inserted";
          }
        } else {
          const currentScore = Number(existing.score ?? 0);
          const UPGRADE_MARGIN = 2;
          if (top.pct >= currentScore + UPGRADE_MARGIN && existing.status === "open") {
            const { error } = await supabaseAdmin$5.from("daily_picks").update({ ...payload, reasons: [...reasons, `ترقية من ${existing.symbol} (score ${currentScore.toFixed(2)} → ${top.pct.toFixed(2)})`] }).eq("id", existing.id);
            if (error) {
              console.error("[live-signal-scan] upgrade failed", top.symbol, error.message);
            } else {
              action = "upgraded";
            }
          }
        }
        if (action !== "kept") {
          await notifyNewPick({
            pick_date: today,
            symbol: top.symbol,
            name_ar: top.name_ar,
            entry: top.last,
            target,
            stop,
            confidence,
            reasons: action === "upgraded" ? [`ترقية: السهم ده أقوى من الترشيح الحالي`, `breakout +${top.pct.toFixed(2)}%`] : [`breakout لحظي +${top.pct.toFixed(2)}%`, `breadth ${breadth?.toFixed(1) ?? "N/A"}%`],
            source: "today"
          }).catch((e) => console.error("[live-signal-scan] notify failed", e));
        }
        return Response.json({
          ok: true,
          breadth,
          ticks: ticks.length,
          candidates: candidates.length,
          action,
          top: { symbol: top.symbol, pct: +top.pct.toFixed(2) },
          existing: existing ? { symbol: existing.symbol, score: Number(existing.score) } : null
        });
      }
    }
  }
});
const Route$Z = createFileRoute("/api/public/hooks/live-tick-poll")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ ok: true, skipped: "thunder_only_mode", fetched: 0 });
      }
    }
  }
});
const Route$Y = createFileRoute("/api/public/hooks/market-open-check")({
  server: {
    handlers: {
      POST: async () => {
        const [breadth, snap] = await Promise.all([
          computeMarketBreadth$1().catch(() => null),
          fetchMarketSnapshot().catch(() => null)
        ]);
        const breadthOk = breadth == null ? null : breadth >= 40;
        const verdict = breadthOk === false ? "🚫 <b>السوق ضعيف</b> — مفيش ترشيحات جديدة النهاردة." : "🟢 <b>السوق مقبول</b> — مسح لحظي شغّال.";
        const lines = [
          "🔔 <b>قبل جرس الافتتاح</b>",
          (/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
          breadth == null ? "اتساع السوق: غير متاح" : `اتساع السوق: <b>${breadth.toFixed(1)}%</b>`,
          snap ? `EGX30: <b>${snap.close.toFixed(2)}</b> · ${snap.trend}` : "EGX30: غير متاح",
          "",
          verdict
        ].join("\n");
        await sendTelegram$1(lines, { skipBaladi: true }).catch(() => void 0);
        return Response.json({ ok: true, breadth, breadthOk, market: snap });
      }
    }
  }
});
const supabaseAdmin$3 = supabaseAdmin$5;
const HALAL_KEY_TTL = 60 * 6e4;
let halalCache = null;
async function halalSyms() {
  if (halalCache && Date.now() - halalCache.at < HALAL_KEY_TTL) return halalCache.syms;
  const { getHalalSet: getHalalSet2 } = await Promise.resolve().then(() => halalList_server);
  const syms = new Set([...getHalalSet2()].map((x) => String(x).toUpperCase()));
  halalCache = { at: Date.now(), syms };
  return syms;
}
function mapRange(x, lo, hi) {
  if (!Number.isFinite(x)) return 50;
  const v = (x - lo) / (hi - lo) * 100;
  return Math.max(0, Math.min(100, v));
}
const Route$X = createFileRoute("/api/public/hooks/market-state")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const syms = await halalSyms();
          let rows = [];
          let from = 0;
          while (true) {
            const { data: page, error: rowsErr } = await supabaseAdmin$3.from("daily_candles").select("symbol, date, open, close, volume").gte("date", new Date(Date.now() - 130 * 864e5).toISOString().slice(0, 10)).order("date", { ascending: true }).range(from, from + 999);
            if (rowsErr) throw new Error(rowsErr.message);
            if (!page?.length) break;
            for (const r of page) rows.push(r);
            if (page.length < 1e3) break;
            from += 1e3;
          }
          const perSym = /* @__PURE__ */ new Map();
          const daySet = /* @__PURE__ */ new Set();
          for (const r of rows) {
            const sym = String(r.symbol).toUpperCase();
            if (!syms.has(sym)) continue;
            const o = Number(r.open), c = Number(r.close);
            if (!(o > 0) || !(c > 0)) continue;
            if (!perSym.has(sym)) perSym.set(sym, /* @__PURE__ */ new Map());
            perSym.get(sym).set(String(r.date).slice(0, 10), { o, c });
            daySet.add(String(r.date).slice(0, 10));
          }
          const sessions = [...daySet].sort();
          if (sessions.length < 25) {
            return Response.json({ ok: false, error: "لا توجد بيانات كافية لحساب الحالة" }, { status: 200 });
          }
          const today = sessions[sessions.length - 1];
          const idxOf = (t, d) => {
            const m = perSym.get(t);
            if (!m) return -1;
            const arr = [...m.keys()].sort();
            for (let i = 0; i < arr.length; i++) if (arr[i] >= d) return arr[i] === d ? i : -1;
            return -1;
          };
          const agg = [];
          for (let s = Math.max(1, sessions.length - 30); s < sessions.length; s++) {
            const d = sessions[s];
            const dp = sessions[s - 1];
            const rets = [];
            const gaps = [];
            let above = 0, maN = 0;
            for (const [t, m] of perSym) {
              const i = m.get(d), ip = m.get(dp);
              if (i == null || ip == null) continue;
              const o = m.get(d).o, c = m.get(d).c, pc = m.get(dp).c;
              rets.push(c / pc - 1);
              gaps.push(o / pc - 1);
              const arr = [...m.entries()].sort((x, y) => x[0] < y[0] ? -1 : 1);
              const ii = arr.findIndex((x) => x[0] === d);
              if (ii >= 19) {
                let sm = 0;
                for (let q = ii - 19; q <= ii; q++) sm += arr[q][1].c;
                if (c > sm / 20) above++;
                maN++;
              }
            }
            if (rets.length < 30) continue;
            agg.push({
              d,
              ret: rets.reduce((a, b) => a + b, 0) / rets.length,
              gap: gaps.reduce((a, b) => a + b, 0) / gaps.length,
              breadth: maN ? above / maN : 0
            });
          }
          const last = agg[agg.length - 1];
          const prev = agg[agg.length - 2] ?? last;
          const rets20 = agg.slice(-20).map((a) => a.ret);
          const trend20 = agg.slice(-20).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
          const trend5 = agg.slice(-5).reduce((acc, a) => acc * (1 + a.ret), 1) - 1;
          const mu = rets20.reduce((a, b) => a + b, 0) / rets20.length;
          const vol20 = Math.sqrt(rets20.reduce((acc, r) => acc + (r - mu) * (r - mu), 0) / (rets20.length - 1));
          const cBreadth = mapRange(last.breadth, 0.3, 0.7);
          const cTrend20 = mapRange(trend20, -0.08, 0.08);
          const cPrev = mapRange(last.ret, -0.02, 0.02);
          const cTrend5 = mapRange(trend5, -0.04, 0.04);
          const cVol = mapRange(-vol20, -0.035, -8e-3);
          const comps = {
            breadth: cBreadth,
            trend20: cTrend20,
            prevday: cPrev,
            trend5: cTrend5,
            volreg: cVol
          };
          let opening = null;
          const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(/* @__PURE__ */ new Date());
          const gp = (t) => parts.find((p) => p.type === t)?.value ?? "";
          const wdMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
          const dow = wdMap[gp("weekday")] ?? 0;
          const hh = parseInt(gp("hour"), 10) || 0;
          const mm = parseInt(gp("minute"), 10) || 0;
          const cairoMin = hh * 60 + mm;
          const inSession = MW_PARAMS.SESSION_DAYS.includes(dow) && cairoMin >= 10 * 60 && cairoMin <= 14 * 60 + 35;
          let liveSyms = 0;
          if (inSession) {
            const { data: todayRows } = await supabaseAdmin$3.from("daily_candles").select("symbol, open, close").eq("date", today);
            if (todayRows && todayRows.length >= 30) {
              const rel = [];
              for (const r of todayRows) {
                const s = String(r.symbol).toUpperCase();
                if (!syms.has(s)) continue;
                const o = Number(r.open), c = Number(r.close);
                if (!(o > 0) || !(c > 0)) continue;
                rel.push(c / o - 1);
                liveSyms++;
              }
              if (liveSyms >= 30) {
                const openingRet = rel.reduce((a, b) => a + b, 0) / rel.length;
                opening = mapRange(openingRet, -0.015, 0.015);
                comps.opening = opening;
              }
            }
          }
          const weights = { breadth: 0.25, trend20: 0.25, prevday: 0.15, trend5: 0.15, volreg: 0.1, opening: 0.1 };
          let wsum = 0, score = 0;
          for (const k of Object.keys(weights)) {
            if (k === "opening" && opening === null) continue;
            score += comps[k] * weights[k];
            wsum += weights[k];
          }
          score = score / wsum;
          const bucket = score >= 80 ? "ممتاز" : score >= 60 ? "جيد" : score >= 40 ? "متوسط" : "ضعيف";
          return Response.json({
            ok: true,
            score: Math.round(score),
            bucket,
            components: {
              breadth: Math.round(comps.breadth),
              trend20: Math.round(comps.trend20),
              prevday: Math.round(comps.prevday),
              trend5: Math.round(comps.trend5),
              volreg: Math.round(comps.volreg),
              opening: opening === null ? null : Math.round(opening)
            },
            detail: {
              breadthPct: Math.round(last.breadth * 100),
              trend20Pct: Math.round(trend20 * 1e3) / 10,
              trend5Pct: Math.round(trend5 * 1e3) / 10,
              prevdayPct: Math.round(last.ret * 1e3) / 10,
              vol20Pct: Math.round(vol20 * 1e3) / 10,
              openingPct: opening,
              liveSyms,
              inSession,
              sessions: sessions.length,
              asOf: today,
              checkedAt: (/* @__PURE__ */ new Date()).toISOString()
            }
          });
        } catch (e) {
          return Response.json({ ok: false, error: e?.message ?? "market-state failed" }, { status: 500 });
        }
      }
    }
  }
});
const Route$W = createFileRoute("/api/public/hooks/marketwatch-health")({
  server: {
    handlers: {
      GET: async () => {
        const { supabaseAdmin: _supabaseAdmin } = await import("./client.server-D5ro3rAQ.mjs");
        const supabaseAdmin2 = _supabaseAdmin;
        const now = /* @__PURE__ */ new Date();
        const healthWindowMs = 15e4;
        const t60 = new Date(now.getTime() - healthWindowMs).toISOString();
        const COV_WINDOW_MS = 15 * 6e4;
        const tCov = new Date(now.getTime() - COV_WINDOW_MS).toISOString();
        const t5m = new Date(now.getTime() - 5 * 6e4).toISOString();
        const todayStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const { data: latestRow } = await supabaseAdmin2.from("marketwatch_snapshots").select("captured_at").order("captured_at", { ascending: false }).limit(1);
        const lastCaptured = latestRow?.[0]?.captured_at ?? null;
        const ageSec = lastCaptured ? Math.round((now.getTime() - new Date(lastCaptured).getTime()) / 1e3) : null;
        const [
          rawScanRes,
          last60Res,
          rows5mRes,
          liveTickLatestRes,
          liveTicks60Res,
          orderbookLatestRes,
          orderbookRowsRes,
          quoteLatestRes,
          quoteRowsRes,
          shariaStocksRes,
          tvLatestRes,
          tv60Res,
          flagsRowsRes,
          recentLogRes,
          todayLogRes,
          coverageMwRes,
          coverageQuotesRes,
          coverageTicksRes
        ] = await Promise.all([
          // Raw scan symbols from latest snapshot
          lastCaptured ? supabaseAdmin2.from("marketwatch_snapshots").select("symbol").eq("captured_at", lastCaptured) : { data: [] },
          // Full marketwatch data from latest snapshot
          lastCaptured ? supabaseAdmin2.from("marketwatch_snapshots").select("symbol,total_volume,total_trades,last_price,is_same_day,captured_at,highest_bid,lowest_ask,total_bids,total_asks").eq("captured_at", lastCaptured) : { data: [] },
          // Count rows from last 5 min
          supabaseAdmin2.from("marketwatch_snapshots").select("*", { count: "exact", head: true }).gte("captured_at", t5m),
          // Last live tick
          supabaseAdmin2.from("live_ticks").select("ts").order("ts", { ascending: false }).limit(1),
          // Live ticks from last 60s
          supabaseAdmin2.from("live_ticks").select("symbol,price,volume,ts").gte("ts", t60),
          // Latest orderbook
          supabaseAdmin2.from("orderbook_snapshots").select("ts,symbol,best_bid,best_ask").order("ts", { ascending: false }).limit(1),
          // Orderbook rows from last 60s
          supabaseAdmin2.from("orderbook_snapshots").select("symbol,best_bid,best_ask,ts").gte("ts", t60),
          // Latest quote
          supabaseAdmin2.from("live_quotes").select("ts,symbol,bid,ask").order("ts", { ascending: false }).limit(1),
          // Quote rows from last 60s
          supabaseAdmin2.from("live_quotes").select("symbol,bid,ask,ts").gte("ts", t60),
          // Sharia stocks universe
          supabaseAdmin2.from("stocks").select("symbol").eq("is_sharia", true).eq("is_active", true),
          // TV bridge (server-side, no machine needed) — newest tick + last-60s symbols
          supabaseAdmin2.from("tv_ticks").select("ts").order("ts", { ascending: false }).limit(1),
          supabaseAdmin2.from("tv_ticks").select("symbol,price,ts").gte("ts", t60),
          // Smart exit flags
          supabaseAdmin2.from("strategy_settings").select("key,enabled").in("key", [
            "scalp-dip-smart-exit",
            "scalp-dip-smart-exit-shadow",
            "scalp-dip-prebuy-volume-filter"
          ]),
          // Recent smart exit log
          supabaseAdmin2.from("smart_exit_log").select("ts,symbol,rule,action,shadow,price,pnl_pct,seconds_since_entry,mw_trades_5m,mw_volume_5m").order("ts", { ascending: false }).limit(15),
          // Today's smart exit counts
          supabaseAdmin2.from("smart_exit_log").select("rule,action").eq("trade_date", todayStr),
          // True live-price coverage: every source that actually delivers fresh prices
          supabaseAdmin2.from("marketwatch_snapshots").select("symbol,captured_at").gte("captured_at", tCov),
          supabaseAdmin2.from("live_quotes").select("symbol,ts").gte("ts", tCov),
          supabaseAdmin2.from("live_ticks").select("symbol,ts").gte("ts", tCov)
        ]);
        const rawScanRows = rawScanRes.data ?? [];
        const rawScanCount = new Set(rawScanRows.map((r) => r.symbol)).size;
        const last60 = last60Res.data ?? [];
        const { count: rows5m } = rows5mRes;
        const lastLiveTick = liveTickLatestRes.data?.[0]?.ts ?? null;
        const liveTickAgeSec = lastLiveTick ? Math.round((now.getTime() - new Date(lastLiveTick).getTime()) / 1e3) : null;
        const liveTicks60 = liveTicks60Res.data ?? [];
        const liveTickSymbols = /* @__PURE__ */ new Set();
        const liveTickPriceSymbols = /* @__PURE__ */ new Set();
        const liveTickVolumeSymbols = /* @__PURE__ */ new Set();
        for (const r of liveTicks60 ?? []) {
          liveTickSymbols.add(String(r.symbol || "").toUpperCase());
          if ((r.price ?? 0) > 0) liveTickPriceSymbols.add(String(r.symbol || "").toUpperCase());
          if ((r.volume ?? 0) > 0) liveTickVolumeSymbols.add(String(r.symbol || "").toUpperCase());
        }
        const covMw = /* @__PURE__ */ new Set();
        for (const r of coverageMwRes.data ?? []) covMw.add(String(r.symbol || "").toUpperCase());
        const covQ = /* @__PURE__ */ new Set();
        for (const r of coverageQuotesRes.data ?? []) covQ.add(String(r.symbol || "").toUpperCase());
        const covT = /* @__PURE__ */ new Set();
        let covTickLatestMs = 0;
        for (const r of coverageTicksRes.data ?? []) {
          covT.add(String(r.symbol || "").toUpperCase());
          const ms = new Date(r.ts).getTime();
          if (Number.isFinite(ms) && ms > covTickLatestMs) covTickLatestMs = ms;
        }
        const tvLastTs = (tvLatestRes.data ?? [])[0]?.ts ?? null;
        const tvAgeSec = tvLastTs ? Math.round((now.getTime() - new Date(tvLastTs).getTime()) / 1e3) : null;
        const tvSymbols = /* @__PURE__ */ new Set();
        for (const r of tv60Res.data ?? []) {
          const s = String(r.symbol ?? "").toUpperCase();
          if (s) tvSymbols.add(s);
        }
        const ages = [liveTickAgeSec, ageSec, tvAgeSec].filter((x) => x != null);
        const freshestAgeSec = ages.length ? Math.min(...ages) : null;
        const covAll = /* @__PURE__ */ new Set([...covMw, ...covQ, ...covT]);
        for (const s of tvSymbols) covAll.add(s);
        let covMwLatestMs = 0;
        for (const r of coverageMwRes.data ?? []) {
          const ms = new Date(r.captured_at).getTime();
          if (Number.isFinite(ms) && ms > covMwLatestMs) covMwLatestMs = ms;
        }
        const covAges = [];
        if (ageSec != null) covAges.push(ageSec);
        if (covMwLatestMs) covAges.push((now.getTime() - covMwLatestMs) / 1e3);
        const qLatest = quoteLatestRes.data?.[0]?.ts;
        if (qLatest) covAges.push((now.getTime() - new Date(qLatest).getTime()) / 1e3);
        if (covTickLatestMs) covAges.push((now.getTime() - covTickLatestMs) / 1e3);
        const livePriceAgeSec = covAges.length ? Math.round(Math.min(...covAges)) : null;
        const symbols = /* @__PURE__ */ new Set();
        const volumeSymbols = /* @__PURE__ */ new Set();
        const tradesSymbols = /* @__PURE__ */ new Set();
        const priceSymbols = /* @__PURE__ */ new Set();
        const sameDaySymbols = /* @__PURE__ */ new Set();
        const marketwatchBidSymbols = /* @__PURE__ */ new Set();
        const marketwatchAskSymbols = /* @__PURE__ */ new Set();
        const marketwatchBidAskSymbols = /* @__PURE__ */ new Set();
        for (const r of last60 ?? []) {
          symbols.add(r.symbol);
          if ((r.total_volume ?? 0) > 0) volumeSymbols.add(r.symbol);
          if ((r.total_trades ?? 0) > 0) tradesSymbols.add(r.symbol);
          if ((r.last_price ?? 0) > 0) priceSymbols.add(r.symbol);
          if (r.is_same_day === true) sameDaySymbols.add(r.symbol);
          const hasBid = (r.highest_bid ?? 0) > 0;
          const hasAsk = (r.lowest_ask ?? 0) > 0;
          if (hasBid) marketwatchBidSymbols.add(r.symbol);
          if (hasAsk) marketwatchAskSymbols.add(r.symbol);
          if (hasBid || hasAsk) marketwatchBidAskSymbols.add(r.symbol);
        }
        const { data: orderbookLatest } = await supabaseAdmin2.from("orderbook_snapshots").select("ts,symbol,best_bid,best_ask").order("ts", { ascending: false }).limit(1);
        const lastOrderbook = orderbookLatestRes.data?.[0]?.ts ?? null;
        const orderbookAgeSec = lastOrderbook ? Math.round((now.getTime() - new Date(lastOrderbook).getTime()) / 1e3) : null;
        const orderbookRows = orderbookRowsRes.data ?? [];
        const orderbookSymbols = /* @__PURE__ */ new Set();
        const orderbookBidSymbols = /* @__PURE__ */ new Set();
        for (const r of orderbookRows ?? []) {
          const sym = String(r.symbol || "").toUpperCase();
          if (!sym) continue;
          orderbookSymbols.add(sym);
          if ((r.best_bid ?? 0) > 0) orderbookBidSymbols.add(sym);
        }
        const lastQuote = quoteLatestRes.data?.[0]?.ts ?? null;
        const quoteAgeSec = lastQuote ? Math.round((now.getTime() - new Date(lastQuote).getTime()) / 1e3) : null;
        const quoteRows = quoteRowsRes.data ?? [];
        const quoteSymbols = /* @__PURE__ */ new Set();
        const quoteBidAskSymbols = /* @__PURE__ */ new Set();
        for (const r of quoteRows ?? []) {
          const sym = String(r.symbol || "").toUpperCase();
          if (!sym) continue;
          quoteSymbols.add(sym);
          if ((r.bid ?? 0) > 0 || (r.ask ?? 0) > 0) quoteBidAskSymbols.add(sym);
        }
        const universe = (shariaStocksRes.data ?? []).map((s) => String(s.symbol ?? "").toUpperCase());
        const coveredUniverse = universe.filter((s) => symbols.has(s) || tvSymbols.has(s));
        const missing = universe.filter((s) => !symbols.has(s) && !tvSymbols.has(s));
        const expectedRowsPer5m = universe.length * 5;
        const coveragePct = universe.length > 0 ? Math.round(coveredUniverse.length / universe.length * 100) : 0;
        const flagMap = new Map((flagsRowsRes.data ?? []).map((r) => [String(r.key), Boolean(r.enabled)]));
        const smartFlags = {
          enabled: flagMap.get("scalp-dip-smart-exit") ?? true,
          shadow: flagMap.get("scalp-dip-smart-exit-shadow") ?? true,
          prebuy: flagMap.get("scalp-dip-prebuy-volume-filter") ?? true
        };
        const recentLog = recentLogRes.data ?? [];
        const todayCounts = { HARD_FLOOR: 0, VOLUME_DEATH: 0, PREBUY_VOLUME_FILTER: 0 };
        for (const r of todayLogRes.data ?? []) {
          const k = r.rule;
          if (k in todayCounts) todayCounts[k]++;
        }
        const healthWindowSec = Math.round(healthWindowMs / 1e3);
        const marketwatchFresh = ageSec != null && ageSec <= healthWindowSec;
        const marketwatchVolumeConfirmed = marketwatchFresh && volumeSymbols.size > 0;
        const marketwatchBidAskConfirmed = marketwatchFresh && marketwatchBidAskSymbols.size > 0;
        const priceRecent = liveTickAgeSec != null && liveTickAgeSec <= 90;
        const l2Fresh = orderbookAgeSec != null && orderbookAgeSec <= healthWindowSec && orderbookBidSymbols.size > 0;
        const verdict = (() => {
          if (marketwatchVolumeConfirmed && marketwatchBidAskConfirmed) {
            return `✅ Volume وBid/Ask مؤكدين من marketwatch — ${volumeSymbols.size} سهم volume و${marketwatchBidAskSymbols.size} سهم Bid/Ask في آخر ${healthWindowSec}ث`;
          }
          if (marketwatchVolumeConfirmed && l2Fresh) {
            return `✅ Volume وL2 مؤكدين من ثاندر — ${volumeSymbols.size} سهم عليهم volume و${orderbookSymbols.size} سهم L2 في آخر ${healthWindowSec}ث`;
          }
          if (marketwatchVolumeConfirmed) {
            return priceRecent ? `✅ السعر حي والـvolume مؤكد من marketwatch — ${volumeSymbols.size} سهم عليهم volume في آخر ${healthWindowSec}ث` : `✅ الـvolume مؤكد من marketwatch — ${volumeSymbols.size} سهم. السعر الحي لم يرسل تحديثات جديدة (${liveTickAgeSec ?? "—"}ث)`;
          }
          if (marketwatchFresh) {
            return "⚠️ marketwatch وصل من ثاندر لكن آخر snapshot لا يحتوي volume مؤكد";
          }
          if (priceRecent) {
            return `⚠️ السعر الحي شغال (${liveTickSymbols.size} سهم/60ث) لكن marketwatch volume لم يصل حتى الآن`;
          }
          if (ageSec == null) return "❌ لا توجد بيانات marketwatch volume مؤكدة حتى الآن";
          return `⚠️ آخر marketwatch من ${ageSec}ث — لا تعتمد عليه للـvolume اللحظي`;
        })();
        return Response.json({
          ok: true,
          raw_scan_count: rawScanCount,
          window_seconds: healthWindowSec,
          now: now.toISOString(),
          last_captured_at: lastCaptured,
          age_seconds: ageSec,
          stale: !marketwatchFresh,
          marketwatch_volume_confirmed: marketwatchVolumeConfirmed,
          live_price_coverage: {
            window_seconds: COV_WINDOW_MS / 1e3,
            symbols: covAll.size,
            stocks: [...covAll].filter((s) => !/^(EGX|SHARIAH|EGGOLD|FADG|SPY|QQQ|DIA|EGX35-LV)/.test(s)).length,
            age_seconds: livePriceAgeSec,
            from_marketwatch: covMw.size,
            from_quotes: covQ.size,
            from_ticks: covT.size
          },
          last_60s: {
            rows: last60?.length ?? 0,
            distinct_symbols: symbols.size,
            with_volume: volumeSymbols.size,
            with_trades: tradesSymbols.size,
            with_price: priceSymbols.size,
            same_day: sameDaySymbols.size
          },
          last_5m: {
            rows: rows5m ?? 0,
            expected_approx: expectedRowsPer5m
          },
          tv_bridge: {
            last_ts: tvLastTs,
            age_seconds: tvAgeSec,
            distinct_symbols_60s: tvSymbols.size,
            fresh: tvAgeSec != null && tvAgeSec <= 30
          },
          freshest_price_age_seconds: freshestAgeSec,
          live_ticks: {
            last_ts: lastLiveTick,
            age_seconds: liveTickAgeSec,
            rows_60s: liveTicks60?.length ?? 0,
            distinct_symbols_60s: liveTickSymbols.size,
            with_price_60s: liveTickPriceSymbols.size,
            with_volume_60s: liveTickVolumeSymbols.size,
            volume_confirmed: liveTickVolumeSymbols.size > 0
          },
          marketwatch_bid_ask: {
            with_bid: marketwatchBidSymbols.size,
            with_ask: marketwatchAskSymbols.size,
            with_bid_ask: marketwatchBidAskSymbols.size
          },
          orderbook: {
            last_ts: lastOrderbook,
            age_seconds: orderbookAgeSec,
            rows_window: orderbookRows?.length ?? 0,
            distinct_symbols_window: orderbookSymbols.size,
            with_bid_window: orderbookBidSymbols.size
          },
          live_quotes: {
            last_ts: lastQuote,
            age_seconds: quoteAgeSec,
            rows_window: quoteRows?.length ?? 0,
            distinct_symbols_window: quoteSymbols.size,
            with_bid_ask_window: quoteBidAskSymbols.size
          },
          universe: {
            total_sharia: universe.length,
            covered: coveredUniverse.length,
            coverage_pct: coveragePct,
            missing_count: missing.length,
            missing_sample: missing.slice(0, 20)
          },
          smart_exit: {
            flags: smartFlags,
            today_counts: todayCounts,
            recent: recentLog ?? []
          },
          verdict
        });
      }
    }
  }
});
async function logDecisionEvent(params) {
  try {
    await supabaseAdmin$5.from("decision_audit_log").insert({
      event_type: params.event_type,
      symbol: params.symbol,
      trigger_price: params.trigger_price ?? null,
      reference_price: params.reference_price ?? null,
      pnl_pct: params.pnl_pct ?? null,
      details: params.details ?? {},
      user_action: params.user_action ?? "PENDING",
      action_ts: params.action_ts ?? (params.user_action ? (/* @__PURE__ */ new Date()).toISOString() : null)
    });
  } catch (e) {
    console.error("[decision_audit_log] failed to write:", e?.message);
  }
}
async function getRecentAuditLogs(limit = 50) {
  try {
    const { data } = await supabaseAdmin$5.from("decision_audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
    return (data ?? []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      event_type: r.event_type,
      symbol: r.symbol,
      trigger_price: r.trigger_price != null ? Number(r.trigger_price) : null,
      reference_price: r.reference_price != null ? Number(r.reference_price) : null,
      pnl_pct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
      details: typeof r.details === "object" && r.details ? JSON.stringify(r.details) : String(r.details ?? ""),
      user_action: r.user_action ?? "PENDING",
      action_ts: r.action_ts ?? null
    }));
  } catch {
    return [];
  }
}
const STAMP_DUTY = 25e-5;
function netPnl(buy, sell, shares) {
  const gross = (sell - buy) * shares;
  const duty = (buy + sell) * shares * STAMP_DUTY;
  return gross - duty;
}
async function persistScanSignals(today, candidates) {
  let written = 0;
  for (const c of candidates) {
    const { error } = await supabaseAdmin$5.from("scalp_dip_signals").upsert(
      {
        scan_date: today,
        symbol: c.symbol,
        entry_price: c.entry_price,
        gap_pct: c.gap_pct,
        bid_depth_at_entry: c.bid_depth_value,
        position_value: c.position_value,
        ...c.news_30h !== void 0 ? { news_30h: c.news_30h } : {}
      },
      { onConflict: "scan_date,symbol", ignoreDuplicates: true }
    );
    if (!error) written++;
  }
  return written;
}
async function updateShadowProgression(today) {
  const notes = [];
  const { data: openSignals } = await supabaseAdmin$5.from("scalp_dip_signals").select("*").is("exit_reason", null);
  if (!openSignals || openSignals.length === 0)
    return { updated: 0, exited: 0, sellSignaled: 0, notes };
  let updated = 0;
  let exited = 0;
  let sellSignaled = 0;
  const stateCache = /* @__PURE__ */ new Map();
  for (const sig of openSignals) {
    try {
      const daysHeld = tradingDaysElapsed$1(sig.scan_date, today);
      let st = stateCache.get(sig.symbol);
      if (!st) {
        st = await liveSymbolState(sig.symbol);
        stateCache.set(sig.symbol, st);
      }
      const candleClose = await todayCandleClose(sig.symbol, today);
      const livePrice = candleClose ?? st?.price ?? null;
      if (daysHeld <= 0) {
        await supabaseAdmin$5.from("scalp_dip_signals").update({
          day1_status: "HELD",
          day1_price: livePrice,
          updated_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", sig.id);
        updated++;
        continue;
      }
      if (livePrice == null) {
        notes.push(sig.symbol + ": no live price at EOD");
        continue;
      }
      const shares = Math.max(1, Math.floor(sig.position_value / sig.entry_price));
      const positionValueNow = shares * livePrice;
      const decision = decideExit({
        daysHeld,
        extraHoldGranted: sig.extra_hold_used,
        price: livePrice,
        bid: st.bid ?? 0,
        bidValue: st.bidValue,
        positionValue: positionValueNow,
        entryPrice: sig.entry_price,
        exitDue: null
      });
      const patch = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
      const dayField = daysHeld >= 3 ? "day3" : daysHeld === 2 ? "day2" : "day1";
      const dayStatus = decision.action === "HOLD" ? "HELD" : decision.action === "SELL" ? decision.reason : "EXTRA_HOLD_1";
      patch[dayField + "_status"] = dayStatus;
      patch[dayField + "_price"] = st.price;
      if (decision.action === "EXTEND_HOLD") patch.extra_hold_used = true;
      if (decision.action === "SELL") {
        const pnl = netPnl(sig.entry_price, decision.exit_price, shares);
        patch.exit_reason = decision.reason;
        patch.bid_confirmed_at_exit = decision.bid_confirmed;
        patch.shadow_exit_price = decision.exit_price;
        patch.shadow_pnl = pnl;
        patch.shadow_pnl_pct = pnl / sig.position_value;
        exited++;
        if (sig.bought && !sig.sold) {
          patch.sell_signal = true;
          patch.sell_signal_reason = decision.reason;
          sellSignaled++;
          notes.push("SELL NOW " + sig.symbol + ": " + decision.reason + " @ " + decision.exit_price);
        }
      }
      await supabaseAdmin$5.from("scalp_dip_signals").update(patch).eq("id", sig.id);
      updated++;
    } catch (e) {
      notes.push(sig.symbol + ": shadow update error " + (e?.message ?? ""));
    }
  }
  return { updated, exited, sellSignaled, notes };
}
async function markSignalBought(signalId, actualBuyPrice) {
  const { data: sig } = await supabaseAdmin$5.from("scalp_dip_signals").select("*").eq("id", signalId).maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.bought) return sig;
  const price = actualBuyPrice && actualBuyPrice > 0 ? actualBuyPrice : sig.entry_price;
  const { data: updated } = await supabaseAdmin$5.from("scalp_dip_signals").update({
    bought: true,
    actual_buy_price: price,
    buy_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", signalId).select("*").maybeSingle();
  if (updated) {
    await logDecisionEvent({
      event_type: "USER_BOUGHT",
      symbol: sig.symbol,
      trigger_price: price,
      reference_price: sig.entry_price,
      details: { gap_pct: sig.gap_pct, position_value: sig.position_value },
      user_action: "BOUGHT",
      action_ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return updated;
}
async function markSignalSold(signalId, actualSellPrice) {
  const { data: sig } = await supabaseAdmin$5.from("scalp_dip_signals").select("*").eq("id", signalId).maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.sold) return sig;
  if (!sig.bought) throw new Error("cannot sell before bought");
  const buyPrice = Number(sig.actual_buy_price ?? sig.entry_price);
  const sell = actualSellPrice && actualSellPrice > 0 ? actualSellPrice : buyPrice;
  const shares = Math.max(1, Math.floor(sig.position_value / buyPrice));
  const pnl = netPnl(buyPrice, sell, shares);
  const { data: updated } = await supabaseAdmin$5.from("scalp_dip_signals").update({
    sold: true,
    actual_sell_price: sell,
    sell_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    realized_pnl: pnl,
    realized_pnl_pct: pnl / sig.position_value,
    sell_signal: false,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", signalId).select("*").maybeSingle();
  if (updated) {
    await logDecisionEvent({
      event_type: "USER_SOLD",
      symbol: sig.symbol,
      trigger_price: sell,
      reference_price: buyPrice,
      pnl_pct: pnl / sig.position_value,
      details: { realized_pnl: pnl, exit_reason: sig.exit_reason || "MANUAL_EXIT" },
      user_action: "SOLD",
      action_ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return updated;
}
async function markWeeklyBought(signalId, actualBuyPrice) {
  const wdb = supabaseAdmin$5;
  const { data: sig } = await wdb.from("momentum_weekly_signals").select("*").eq("id", signalId).maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.bought) return sig;
  const price = actualBuyPrice && actualBuyPrice > 0 ? actualBuyPrice : Number(sig.last_close);
  const { data: updated, error } = await wdb.from("momentum_weekly_signals").update({
    bought: true,
    actual_buy_price: price,
    buy_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", signalId).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  if (updated) {
    await logDecisionEvent({
      event_type: "USER_BOUGHT",
      symbol: sig.symbol,
      trigger_price: price,
      reference_price: sig.last_close,
      details: { position_value: sig.position_value, entry_date: sig.entry_date },
      user_action: "BOUGHT",
      action_ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return updated;
}
async function markWeeklySold(signalId, actualSellPrice) {
  const wdb = supabaseAdmin$5;
  const { data: sig } = await wdb.from("momentum_weekly_signals").select("*").eq("id", signalId).maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.sold) return sig;
  if (!sig.bought) throw new Error("cannot sell before bought");
  const buyPrice = Number(sig.actual_buy_price ?? sig.last_close);
  const sell = actualSellPrice && actualSellPrice > 0 ? actualSellPrice : buyPrice;
  const shares = Number(sig.shares) || Math.max(1, Math.floor(Number(sig.position_value) / buyPrice));
  const gross = (sell - buyPrice) * shares;
  const costs = (buyPrice + sell) * shares * (MW_PARAMS.COST_RT / 2);
  const pnl = gross - costs;
  const { data: updated, error } = await wdb.from("momentum_weekly_signals").update({
    sold: true,
    actual_sell_price: sell,
    sell_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
    realized_pnl: pnl,
    realized_pnl_pct: pnl / (Number(sig.position_value) || 1),
    exit_reason: sig.exit_reason || "MANUAL_EXIT",
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", signalId).select("*").maybeSingle();
  if (error) throw new Error(error.message);
  if (updated) {
    await logDecisionEvent({
      event_type: "USER_SOLD",
      symbol: sig.symbol,
      trigger_price: sell,
      reference_price: buyPrice,
      pnl_pct: pnl / (Number(sig.position_value) || 1),
      details: { realized_pnl: pnl, exit_reason: sig.exit_reason || "MANUAL_EXIT" },
      user_action: "SOLD",
      action_ts: (/* @__PURE__ */ new Date()).toISOString()
    });
  }
  return updated;
}
async function currentPriceFor(symbol) {
  const st = await liveSymbolState(symbol);
  return st?.price ?? null;
}
async function todayCandleClose(symbol, dateISO) {
  const { data } = await supabaseAdmin$5.from("daily_candles").select("close").eq("symbol", symbol).eq("date", dateISO).maybeSingle();
  const c = Number(data?.close);
  return c > 0 ? c : null;
}
async function getTelegramConfig() {
  const envToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const envChat = process.env.TELEGRAM_CHAT_ID ?? "";
  if (envToken && envChat) return { token: envToken, chatId: envChat };
  const { data } = await supabaseAdmin$5.from("strategy_settings").select("key, numeric_value").in("key", ["telegram_bot_token", "telegram_chat_id"]);
  let chatId = envChat;
  for (const r of data ?? []) {
    if (r.key === "telegram_chat_id" && !chatId) chatId = String(r.numeric_value ?? "");
  }
  if (!envToken || !chatId) return null;
  return { token: envToken, chatId };
}
async function sendTelegram(text) {
  try {
    const cfg = await getTelegramConfig();
    if (!cfg) return false;
    const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: cfg.chatId, text })
    });
    const j2 = await res.json();
    return j2.ok === true;
  } catch {
    return false;
  }
}
const supabaseAdmin$2 = supabaseAdmin$5;
const SCANNER_URL = "https://scanner.tradingview.com/egypt/scan?label-product=screener-stock";
async function fetchEgxScannerSnapshot() {
  const res = await fetch(SCANNER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    body: JSON.stringify({
      filter: [{ left: "type", operation: "equal", right: "stock" }],
      options: { lang: "en" },
      markets: ["egypt"],
      symbols: { query: { types: [] }, tickers: [] },
      columns: ["name", "open", "high", "low", "close", "volume", "change"],
      sort: { sortBy: "name", sortOrder: "asc" }
    })
  });
  if (!res.ok) throw new Error(`scanner HTTP ${res.status}`);
  const j2 = await res.json();
  const out = [];
  for (const item of j2.data ?? []) {
    const d = item.d;
    const symbol = String(item.s || "").replace("EGX:", "").toUpperCase();
    const open = Number(d?.[1]);
    const high = Number(d?.[2]);
    const low = Number(d?.[3]);
    const close = Number(d?.[4]);
    const volume = Number(d?.[5]) || 0;
    if (!(close > 0) || !(open > 0)) continue;
    out.push({ symbol, open, high: high > 0 ? high : close, low: low > 0 ? low : open, close, volume });
  }
  return out;
}
async function syncMarketSnapshot(dateISO) {
  const rows = await fetchEgxScannerSnapshot();
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500).map((r) => ({ ...r, date: dateISO }));
    const { error } = await supabaseAdmin$2.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (error) throw new Error(`daily_candles upsert: ${error.message}`);
    written += batch.length;
  }
  return { written, total: rows.length };
}
async function fillMissingTodayCandles(dateISO) {
  const { data: existing } = await supabaseAdmin$2.from("daily_candles").select("symbol").eq("date", dateISO);
  const have = new Set((existing ?? []).map((r) => String(r.symbol).toUpperCase()));
  const snaps = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$2.from("marketwatch_snapshots").select("symbol, last_price, captured_at").gte("captured_at", `${dateISO}T00:00:00Z`).order("captured_at", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    snaps.push(...data);
    if (data.length < 1e3) break;
    from += 1e3;
  }
  const agg = /* @__PURE__ */ new Map();
  for (const r of snaps) {
    const sym = String(r.symbol).toUpperCase();
    if (have.has(sym)) continue;
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    const cur = agg.get(sym);
    if (!cur) agg.set(sym, { o: px, c: px, h: px, l: px });
    else {
      cur.c = px;
      cur.h = Math.max(cur.h, px);
      cur.l = Math.min(cur.l, px);
    }
  }
  let written = 0;
  const rows = [];
  for (const [sym, a] of agg) {
    rows.push({ symbol: sym, date: dateISO, open: a.o, high: a.h, low: a.l, close: a.c, volume: 0 });
  }
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin$2.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (!error) written += batch.length;
  }
  return written;
}
const supabaseAdmin$1 = supabaseAdmin$5;
async function upsertTodayCandles(todayISO) {
  const snaps = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$1.from("marketwatch_snapshots").select("symbol, last_price, captured_at").gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    snaps.push(...data);
    if (data.length < 1e3) break;
    from += 1e3;
  }
  const agg = /* @__PURE__ */ new Map();
  for (const r of snaps) {
    const sym = String(r.symbol).toUpperCase();
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    const cur = agg.get(sym);
    if (!cur) agg.set(sym, { o: px, c: px, h: px, l: px, ts: String(r.captured_at) });
    else {
      cur.c = px;
      cur.h = Math.max(cur.h, px);
      cur.l = Math.min(cur.l, px);
    }
  }
  const vol = /* @__PURE__ */ new Map();
  let vf = 0;
  while (true) {
    const { data } = await supabaseAdmin$1.from("live_ticks").select("symbol, volume, ts").gte("ts", `${todayISO}T00:00:00Z`).order("ts", { ascending: true }).range(vf, vf + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const v = Number(r.volume) || 0;
      vol.set(sym, (vol.get(sym) ?? 0) + v);
    }
    if (data.length < 1e3) break;
    vf += 1e3;
  }
  let written = 0;
  const rows = [];
  for (const [sym, a] of agg) {
    rows.push({
      symbol: sym,
      date: todayISO,
      open: a.o,
      high: a.h,
      low: a.l,
      close: a.c,
      volume: vol.get(sym) ?? 0
    });
  }
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin$1.from("daily_candles").upsert(batch, { onConflict: "symbol,date" });
    if (!error) written += batch.length;
    else console.error("[momentum-weekly] candle upsert error:", error.message);
  }
  return written;
}
async function persistWeeklyScan() {
  const status = await scanWeeklyCandidates();
  const sizing = computeSizing$1(null);
  const { data: capRow } = await supabaseAdmin$1.from("strategy_settings").select("numeric_value").eq("key", "momentum_weekly_user_capital").maybeSingle();
  const cap = Number(capRow?.numeric_value) || MW_PARAMS.TOTAL_CAPITAL;
  Object.assign(sizing, computeSizing$1(cap));
  if (status.status === "regime_off") {
    await logDecisionEvent({
      event_type: "MW_REGIME_CASH",
      symbol: "-",
      details: { regime_cum10: status.regimeCum10, signal_date: status.signalDate }
    });
    return { ok: true, status: status.status, label: status.statusLabelAr };
  }
  if (status.status !== "ready") {
    return { ok: true, status: status.status, label: status.statusLabelAr };
  }
  const selectedSymbols = new Set(status.selected.map((c) => c.symbol));
  const slotCapital = Math.round(sizing.slot_capital * (status.protectionScale ?? 1));
  let written = 0;
  for (const c of status.candidates) {
    const selected = selectedSymbols.has(c.symbol);
    const posValue = selected ? slotCapital : 0;
    const { error } = await supabaseAdmin$1.from("momentum_weekly_signals").upsert(
      {
        scan_date: status.signalDate,
        entry_date: status.entryDate,
        exit_date: status.exitDate,
        symbol: c.symbol,
        last_close: c.last_close,
        mom5: c.mom5,
        v20_money: c.v20_money,
        near_high: c.near_high,
        fresh_high: c.fresh_high,
        position_value: posValue,
        shares: selected && c.last_close > 0 ? Math.floor(posValue / c.last_close) : 0,
        selected,
        regime_on: true
      },
      { onConflict: "scan_date,symbol", ignoreDuplicates: true }
    );
    if (!error) written++;
  }
  await logDecisionEvent({
    event_type: "MW_WEEKLY_SCAN",
    symbol: "-",
    details: {
      signal_date: status.signalDate,
      entry_date: status.entryDate,
      exit_date: status.exitDate,
      selected: [...selectedSymbols],
      sizing,
      disclaimer: BACKTEST_DISCLAIMER_AR
    }
  });
  return { ok: true, status: "ready", written, selected: [...selectedSymbols], sizing };
}
async function fillWeeklyBuys(todayISO) {
  const { data: due, error } = await supabaseAdmin$1.from("momentum_weekly_signals").select("*").eq("selected", true).eq("bought", false).eq("entry_date", todayISO);
  if (error) {
    return { ok: true, skipped: "weekly table missing" };
  }
  const out = [];
  for (const sig of due ?? []) {
    const { data: todayCandle } = await supabaseAdmin$1.from("daily_candles").select("open").eq("symbol", sig.symbol).eq("date", todayISO).maybeSingle();
    const open = Number(todayCandle?.open);
    if (!(open > 0)) continue;
    const lastClose = Number(sig.last_close);
    const gap = lastClose > 0 ? open / lastClose - 1 : 0;
    if (gap < MW_PARAMS.GAP_MIN || gap > MW_PARAMS.GAP_MAX) {
      await logDecisionEvent({
        event_type: "MW_WEEKLY_GAP_SKIP",
        symbol: sig.symbol,
        details: { gap_pct: gap, open, last_close: lastClose, entry_date: todayISO }
      });
      continue;
    }
    const shares = Math.max(1, Math.floor(Number(sig.position_value) / open));
    const { error: upErr } = await supabaseAdmin$1.from("momentum_weekly_signals").update({
      bought: true,
      actual_buy_price: open,
      buy_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      shares,
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", sig.id).eq("bought", false);
    if (!upErr) {
      out.push({ symbol: sig.symbol, buy_price: open, gap_pct: gap, shares });
      await logDecisionEvent({
        event_type: "MW_WEEKLY_BUY",
        symbol: sig.symbol,
        trigger_price: open,
        reference_price: lastClose,
        details: { gap_pct: gap, position_value: sig.position_value, shares, entry_date: todayISO },
        user_action: "AUTO",
        action_ts: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  return { ok: true, buys: out };
}
async function markWeeklyExits(todayISO) {
  const { data: due, error } = await supabaseAdmin$1.from("momentum_weekly_signals").select("*").eq("selected", true).eq("bought", true).eq("sold", false).lte("exit_date", todayISO);
  if (error) {
    return { ok: true, skipped: "optional table missing — run migration SQL to enable" };
  }
  const out = [];
  for (const sig of due ?? []) {
    const { data: todayCandle } = await supabaseAdmin$1.from("daily_candles").select("open").eq("symbol", sig.symbol).eq("date", todayISO).maybeSingle();
    const { data: mw } = await supabaseAdmin$1.from("marketwatch_snapshots").select("last_price, captured_at").eq("symbol", sig.symbol).gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true }).limit(1).maybeSingle();
    const exitPrice = Number(todayCandle?.open) || Number(mw?.last_price) || Number(sig.last_close);
    const entry = Number(sig.actual_buy_price) || Number(sig.last_close);
    const shares = Math.max(1, Math.floor(Number(sig.position_value) / entry));
    const gross = (exitPrice - entry) * shares;
    const costs = (entry + exitPrice) * shares * MW_PARAMS.COST_RT / 2;
    const pnl = gross - costs;
    const { error: error2 } = await supabaseAdmin$1.from("momentum_weekly_signals").update({
      sold: true,
      actual_sell_price: exitPrice,
      sell_timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      exit_reason: "WEEKLY_TIME_EXIT",
      realized_pnl: pnl,
      realized_pnl_pct: pnl / (Number(sig.position_value) || 1),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }).eq("id", sig.id);
    if (!error2) {
      const pnlPct = pnl / (Number(sig.position_value) || 1);
      out.push({ symbol: sig.symbol, exit_price: exitPrice, pnl, pnl_pct: pnlPct, pos: Number(sig.position_value) || 0 });
      await logDecisionEvent({
        event_type: "MW_WEEKLY_EXIT",
        symbol: sig.symbol,
        trigger_price: exitPrice,
        reference_price: entry,
        pnl_pct: pnlPct,
        details: { exit_reason: "WEEKLY_TIME_EXIT" },
        user_action: "AUTO",
        action_ts: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  }
  if (out.length) {
    try {
      const capRow = await supabaseAdmin$1.from("strategy_settings").select("numeric_value").eq("key", "momentum_weekly_user_capital").maybeSingle();
      const cap = Number(capRow?.numeric_value) || MW_PARAMS.TOTAL_CAPITAL;
      const lines = out.map(
        (x) => `• ${x.symbol}: بيع @ ${Number(x.exit_price).toFixed(2)} → ${x.pnl_pct >= 0 ? "+" : ""}${(100 * x.pnl_pct).toFixed(2)}% (${x.pnl >= 0 ? "+" : ""}${Math.round(x.pnl).toLocaleString("en-US")} ج.م)`
      );
      const total = out.reduce((a, x) => a + x.pnl, 0);
      const deployed = out.reduce((a, x) => a + x.pos, 0);
      const msg = `📤 خروج أسبوعي — إغلاق الدفعة
${lines.join("\n")}
الإجمالي: ${total >= 0 ? "+" : ""}${Math.round(total).toLocaleString("en-US")} ج.م على مراكز منفذة ${Math.round(deployed).toLocaleString("en-US")} ج.م (رأس المال المحدد ${cap.toLocaleString("en-US")} ج.م)`;
      await sendTelegram(msg);
    } catch (e) {
      console.error("[momentum-weekly] exit telegram failed:", e?.message ?? e);
    }
  }
  return { ok: true, exits: out };
}
async function handleGet(url) {
  try {
    const phase = url.searchParams.get("phase") ?? "auto";
    const now = cairoNow$3();
    const todayISO = cairoDateISO$3(now);
    const result = { strategy: STRATEGY_ID$1, date: todayISO, session_day: isSessionDay$1(now) };
    if (phase === "candles" || phase === "auto") {
      if (isSessionDay$1(now)) {
        try {
          result.scanner = await syncMarketSnapshot(todayISO);
        } catch (e) {
          result.scanner = { error: e?.message ?? "scanner failed" };
        }
        result.candles = await upsertTodayCandles(todayISO);
        result.filled = await fillMissingTodayCandles(todayISO);
      }
    }
    if (phase === "scan" || phase === "auto") {
      const isEntryDay = now.getDay() === 0;
      if (!isEntryDay) {
        result.scan = {
          status: "skipped_not_entry_day",
          label: "نظام أسبوعي: الترشيح يوم الأحد فقط"
        };
      } else {
        const status = await scanWeeklyCandidates();
        result.scan = {
          status: status.status,
          label: status.statusLabelAr,
          signal_date: status.signalDate,
          entry_date: status.entryDate,
          regime_on: status.regimeOn,
          band_count: status.bandCount
        };
        if (status.signalDate) {
          const { data: existing } = await supabaseAdmin$1.from("momentum_weekly_signals").select("id").eq("scan_date", status.signalDate).limit(1);
          if (!existing?.length) result.persist = await persistWeeklyScan();
          const sendReady = status.status === "ready" && result.persist?.status === "ready";
          const { data: sentToday } = await supabaseAdmin$1.from("decision_audit_log").select("id").eq("event_type", "MW_WEEKLY_SCAN").contains("details", { telegram_sent: true }).gte("created_at", `${todayISO}T00:00:00Z`).limit(1);
          if (sendReady && !sentToday?.length) {
            const slot = Math.round(result.persist.sizing.slot_capital);
            const picked = status.selected.map((c) => {
              const lo = (c.last_close * (1 + MW_PARAMS.GAP_MIN)).toFixed(2);
              const hi = (c.last_close * (1 + MW_PARAMS.GAP_MAX)).toFixed(2);
              const sh = c.last_close > 0 ? Math.floor(slot / c.last_close) : 0;
              return `• ${c.symbol}${c.halal ? " ✅" : ""} — إغلاق الإشارة ${c.last_close} — اشترِ بين ${lo} و ${hi} فقط (~${sh} سهم)`;
            }).join("\n");
            const idleSlots = result.persist.sizing.top_n - status.selected.length;
            const idleNote = idleSlots > 0 ? `
💰 ${idleSlots} مركز فاضي (${(idleSlots * slot).toLocaleString("en-US")} ج.م) → حطهم أذون/صندوق نقدي` : "";
            await sendTelegram(
              `🔔 إشعار شراء أسبوعي — ${status.entryDate}
⏰ اشترِ في افتتاح السوق (10:00-10:15 صباحاً) وفي حدود السعر المكتوبة تحت فقط — لو السعر طلع بره الحدود متشتريش وسيب المركز فاضي
${picked}
💵 ${slot.toLocaleString("en-US")} ج.م لكل سهم (رأس المال ${result.persist.sizing.total_capital.toLocaleString("en-US")} ج.م ÷ ${result.persist.sizing.top_n})
📅 الخروج: افتتاح أول جلسة الأسبوع القادم — والبيع قبل الشراء عشان الفلوس تتحرر` + idleNote
            );
            await logDecisionEvent({
              event_type: "MW_WEEKLY_SCAN",
              symbol: "-",
              details: { signal_date: status.signalDate, entry_date: status.entryDate, telegram_sent: true }
            });
          } else if (status.status === "regime_off" && !sentToday?.length) {
            await sendTelegram(`⚠️ فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع سالب) — لا مرشحين
💰 إجراء أسبوع الكاش: حوّل رأس المال لأذون خزانة/صندوق نقدي (~0.46%/أسبوع مضمون) حتى إشعار الأحد القادم`);
            await logDecisionEvent({ event_type: "MW_WEEKLY_SCAN", symbol: "-", details: { regime_cash: true, signal_date: status.signalDate } });
          } else if (status.status === "no_candidates" && !sentToday?.length) {
            await sendTelegram(`ℹ️ لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — كاش
💰 إجراء أسبوع الكاش: حوّل رأس المال لأذون خزانة/صندوق نقدي (~0.46%/أسبوع مضمون) حتى إشعار الأحد القادم`);
            await logDecisionEvent({ event_type: "MW_WEEKLY_SCAN", symbol: "-", details: { no_candidates: true, signal_date: status.signalDate } });
          }
        }
      }
    }
    if (phase === "fill" || phase === "auto") {
      if (isSessionDay$1(now)) result.fill = await fillWeeklyBuys(todayISO);
    }
    if (phase === "exit" || phase === "auto") {
      if (isSessionDay$1(now)) result.exit = await markWeeklyExits(todayISO);
    }
    void sessionsBetween;
    return Response.json({ ok: true, ...result });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message ?? "runner failed" }, { status: 500 });
  }
}
const Route$V = createFileRoute("/api/public/hooks/momentum-weekly-run")({
  server: {
    handlers: {
      GET: ({ request }) => handleGet(new URL(request.url)),
      POST: ({ request }) => handleGet(new URL(request.url))
    }
  }
});
const getTodayPick = createServerFn({
  method: "GET"
}).handler(createSsrRpc("5039be14fc45716c0f391862fc42d4f2a18007e206f74220a1076c71af0a9032"));
createServerFn({
  method: "POST"
}).handler(createSsrRpc("3876fd19709c38e36f32c45f780ffca4010403cb698457f9bf9a27189db96cb7"));
const getTomorrowPicks = createServerFn({
  method: "GET"
}).handler(createSsrRpc("f4e1b8d86e3dc919d0d13545238ddd73f65bc20ae606e8f86ed153a5520a9e7f"));
const getMorningBrief = createServerFn({
  method: "GET"
}).handler(createSsrRpc("78159f80cdceda5ade8c338a0fe7b1373266ef4a13c2d6e93c51c370da643936"));
const getDailyOnePercent = createServerFn({
  method: "GET"
}).handler(createSsrRpc("0229551c3b9b04f9624a7aff779ff652107849eafe40f39ce7f0e2f5933047eb"));
const Route$U = createFileRoute("/api/public/hooks/monitor")({
  server: {
    handlers: {
      POST: async () => {
        const summary = {};
        try {
          const today = await getTodayPick();
          summary.today_pick = today?.pick?.symbol ?? null;
        } catch (e) {
          summary.today_error = e.message;
        }
        try {
          const brief = await getMorningBrief();
          const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
          for (const p of brief.picks ?? []) {
            await notifyNewPick({
              pick_date: date,
              symbol: p.symbol,
              name_ar: p.name_ar,
              entry: Number(p.close),
              target: Number(p.target ?? p.close),
              stop: Number(p.stop_loss ?? p.close),
              confidence: Number(p.confidence),
              reasons: p.reasons_ar ?? [],
              source: "morning_brief"
            });
          }
          summary.morning_brief = brief.picks?.length ?? 0;
        } catch (e) {
          summary.brief_error = e.message;
        }
        try {
          const news = await notifyNewsShocksForActive();
          summary.news_alerts = news.alerts;
        } catch (e) {
          summary.news_error = e.message;
        }
        try {
          const ev = await evaluatePositions();
          summary.positions = ev;
        } catch (e) {
          summary.positions_error = e.message;
        }
        return new Response(JSON.stringify({ ok: true, ...summary }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
});
const WAR_KEYWORDS = [
  "حرب",
  "حروب",
  "قصف",
  "غارة",
  "غارات",
  "تصعيد",
  "اشتباك",
  "اشتباكات",
  "صاروخ",
  "صواريخ",
  "هجوم",
  "عسكري",
  "احتلال",
  "غزو",
  "جيش",
  "إسرائيل",
  "غزة",
  "لبنان",
  "إيران",
  "اليمن",
  "الحوثي",
  "حزب الله",
  "البحر الأحمر",
  "قناة السويس",
  "ميناء",
  "حصار",
  "war",
  "strike",
  "missile",
  "attack",
  "invasion",
  "military",
  "israel",
  "gaza",
  "iran",
  "lebanon",
  "yemen",
  "houthi",
  "red sea",
  "suez"
];
const MACRO_RISK_KEYWORDS = [
  "تضخم",
  "ركود",
  "أزمة",
  "انهيار",
  "تخفيض تصنيف",
  "احتياطي",
  "سعر صرف",
  "تعويم",
  "أسعار الفائدة",
  "رفع الفائدة",
  "inflation",
  "recession",
  "crisis",
  "downgrade",
  "rate hike"
];
function hasAny(text, keywords) {
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase())) return kw;
  }
  return null;
}
const Route$T = createFileRoute("/api/public/hooks/news-watchdog")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 60 * 60 * 1e3).toISOString();
          const { data: news } = await supabaseAdmin$5.from("news_sentiment").select("id, symbol, headline, sentiment, sentiment_score, impact_level, published_at, created_at").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
          if (!news || news.length === 0) {
            return Response.json({ ok: true, reviewed: 0, message: "no fresh news" });
          }
          const newsIds = news.map((n) => n.id);
          const { data: forecasts } = await supabaseAdmin$5.from("news_impact_forecasts").select("news_id, symbol, category, horizon, expected_direction, expected_magnitude_pct, confidence, baladi_summary, is_rights_related").in("news_id", newsIds);
          const fcByNewsId = /* @__PURE__ */ new Map();
          for (const f of forecasts ?? []) {
            if (f.news_id) fcByNewsId.set(f.news_id, f);
          }
          const buyOpps = [];
          const seenSymbols = /* @__PURE__ */ new Set();
          for (const n of news) {
            if (!n.symbol || n.symbol === "EGX30" || n.symbol === "MARKET") continue;
            if (seenSymbols.has(n.symbol)) continue;
            const fc2 = fcByNewsId.get(n.id);
            const sentScore = Number(n.sentiment_score ?? 0);
            const isHighImpact = n.impact_level === "high";
            let qualifies = false;
            let reason = "";
            let score = 0;
            if (fc2 && fc2.expected_direction === "up" && Number(fc2.confidence ?? 0) >= 70) {
              qualifies = true;
              score = Number(fc2.confidence);
              reason = `تنبؤ صعود بثقة ${fc2.confidence}% (${fc2.category}, ${fc2.horizon})`;
            } else if (sentScore >= 0.6 && (isHighImpact || sentScore >= 0.75)) {
              qualifies = true;
              score = Math.round(sentScore * 100);
              reason = `خبر إيجابي قوي (sentiment ${sentScore.toFixed(2)}${isHighImpact ? ", تأثير عالي" : ""})`;
            }
            if (qualifies) {
              buyOpps.push({
                symbol: n.symbol,
                headline: n.headline ?? "",
                score,
                reason,
                baladi: fc2?.baladi_summary ?? null,
                magnitude: fc2?.expected_magnitude_pct != null ? Number(fc2.expected_magnitude_pct) : null
              });
              seenSymbols.add(n.symbol);
            }
          }
          buyOpps.sort((a, b) => b.score - a.score);
          const risks = [];
          const seenHeadlines = /* @__PURE__ */ new Set();
          for (const n of news) {
            const headline = (n.headline ?? "").trim();
            if (!headline || seenHeadlines.has(headline)) continue;
            const warHit = hasAny(headline, WAR_KEYWORDS);
            const macroHit = !warHit ? hasAny(headline, MACRO_RISK_KEYWORDS) : null;
            if (warHit || macroHit) {
              risks.push({
                headline,
                symbol: n.symbol ?? "MARKET",
                matched: warHit ?? macroHit,
                category: warHit ? "war" : "macro",
                sentScore: Number(n.sentiment_score ?? 0)
              });
              seenHeadlines.add(headline);
            }
            if (risks.length >= 8) break;
          }
          let telegram = null;
          if (buyOpps.length === 0 && risks.length === 0) {
            return Response.json({
              ok: true,
              reviewed: news.length,
              buys: 0,
              risks: 0,
              message: "no actionable signals"
            });
          }
          const lines = [];
          lines.push("🛡️ <b>مراقب الأخبار</b> — تحليل فوري");
          lines.push("");
          if (buyOpps.length) {
            lines.push("🎯 <b>فرص شراء محتملة (من الأخبار):</b>");
            for (const b of buyOpps.slice(0, 5)) {
              const mag = b.magnitude != null ? ` · متوقع ${b.magnitude > 0 ? "+" : ""}${b.magnitude.toFixed(1)}%` : "";
              lines.push(`🟢 <b>${escapeHtml(b.symbol)}</b> — قوة ${b.score}%${mag}`);
              lines.push(`  📰 ${escapeHtml(b.headline.slice(0, 110))}`);
              lines.push(`  💡 ${escapeHtml(b.reason)}`);
              if (b.baladi) lines.push(`  🗣️ <i>${escapeHtml(b.baladi.slice(0, 130))}</i>`);
            }
            lines.push("");
            lines.push("<i>⚠️ ده ترشيح أولي من الأخبار بس — راجع الفني و الـ daily-pick قبل الشراء.</i>");
            lines.push("");
          }
          if (risks.length) {
            const warRisks = risks.filter((r) => r.category === "war");
            const macroRisks = risks.filter((r) => r.category === "macro");
            if (warRisks.length) {
              lines.push("⚠️ <b>تنبيه مخاطر جيوسياسية (قد تأثر على البورصة):</b>");
              for (const r of warRisks.slice(0, 5)) {
                lines.push(`🔴 ${escapeHtml(r.headline.slice(0, 130))}`);
                lines.push(`   <i>كلمة مفتاحية: ${escapeHtml(r.matched)}</i>`);
              }
              lines.push("");
            }
            if (macroRisks.length) {
              lines.push("📉 <b>تنبيه مخاطر كلية (Macro):</b>");
              for (const r of macroRisks.slice(0, 5)) {
                lines.push(`🟠 ${escapeHtml(r.headline.slice(0, 130))}`);
                lines.push(`   <i>كلمة مفتاحية: ${escapeHtml(r.matched)}</i>`);
              }
              lines.push("");
            }
            lines.push("<i>🛡️ راجع مراكزك المفتوحة و خذ بالك من stop-loss.</i>");
          }
          telegram = await sendTelegram$1(lines.join("\n"));
          return Response.json({
            ok: true,
            reviewed: news.length,
            buys: buyOpps.length,
            risks: risks.length,
            telegram
          });
        } catch (e) {
          console.error("[news-watchdog] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const NumLike$1 = preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, number().finite());
const Schema$1 = object({
  symbol: string().trim().min(1).max(32),
  side: _enum(["buy", "sell"]),
  order_type: _enum(["limit", "market"]),
  requested_price: NumLike$1.optional().nullable(),
  requested_qty: NumLike$1.refine((n) => n > 0, "qty>0"),
  session_id: string().uuid().optional().nullable(),
  thunder_order_id: string().max(128).optional().nullable(),
  signal_source: string().max(128).optional().nullable(),
  strategy: string().max(64).optional().nullable(),
  metadata: record(string(), unknown()).optional().nullable(),
  // Execution context
  best_bid: NumLike$1.optional().nullable(),
  best_ask: NumLike$1.optional().nullable(),
  last_price: NumLike$1.optional().nullable(),
  safe_floor: NumLike$1.optional().nullable(),
  break_even: NumLike$1.optional().nullable(),
  decision_reason: string().max(256).optional().nullable(),
  snapshot_before: record(string(), unknown()).optional().nullable()
});
const CORS$d = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
const json$e = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS$d } });
const Route$S = createFileRoute("/api/public/hooks/order-placed")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$d }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$e({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$d });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$e({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = Schema$1.safeParse(raw);
        if (!parsed.success) return json$e({ ok: false, error: "invalid_body", issues: parsed.error.issues }, 400);
        const d = parsed.data;
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const insertRow = {
          symbol: d.symbol.toUpperCase(),
          side: d.side,
          order_type: d.order_type,
          requested_price: d.requested_price ?? null,
          requested_qty: d.requested_qty,
          remaining_qty: d.requested_qty,
          session_id: d.session_id ?? null,
          thunder_order_id: d.thunder_order_id ?? null,
          signal_source: d.signal_source ?? null,
          strategy: d.strategy ?? null,
          metadata: d.metadata ?? {}
        };
        const { data: created, error } = await supabaseAdmin2.from("order_lifecycle").insert(insertRow).select("id").single();
        if (error || !created) return json$e({ ok: false, error: error?.message ?? "insert_failed" }, 500);
        const ctxRow = {
          order_lifecycle_id: created.id,
          best_bid_at_placement: d.best_bid ?? null,
          best_ask_at_placement: d.best_ask ?? null,
          spread_at_placement: d.best_bid != null && d.best_ask != null ? d.best_ask - d.best_bid : null,
          last_price_at_placement: d.last_price ?? null,
          safe_floor: d.safe_floor ?? null,
          break_even: d.break_even ?? null,
          decision_reason: d.decision_reason ?? null,
          snapshot_before: d.snapshot_before ?? null
        };
        await supabaseAdmin2.from("execution_context").insert(ctxRow);
        return json$e({ ok: true, order_id: created.id });
      }
    }
  }
});
function cairoDate() {
  return new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
async function logEvent(ev) {
  try {
    await supabaseAdmin$5.from("trade_events").insert({
      trade_date: ev.trade_date ?? cairoDate(),
      symbol: String(ev.symbol || "").toUpperCase(),
      strategy: ev.strategy ?? null,
      paper_trade_id: ev.paper_trade_id ?? null,
      position_id: ev.position_id ?? null,
      pending_order_id: ev.pending_order_id ?? null,
      event_type: ev.event_type,
      state: ev.state ?? null,
      price: ev.price ?? null,
      qty: ev.qty ?? null,
      reason: ev.reason ?? null,
      source: ev.source ?? null,
      metadata: ev.metadata ?? {}
    });
  } catch (e) {
    console.error("[trade-ledger] logEvent failed:", e.message, ev.event_type, ev.symbol);
  }
}
const NumLike = preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, number().finite());
const Schema = object({
  order_id: string().uuid().optional().nullable(),
  thunder_order_id: string().max(128).optional().nullable(),
  status: _enum(["pending", "partial", "filled", "cancelled", "expired", "failed"]).optional(),
  fill_price_avg: NumLike.optional().nullable(),
  filled_qty: NumLike.optional().nullable(),
  remaining_qty: NumLike.optional().nullable(),
  confirmed_at: string().optional().nullable(),
  first_fill_at: string().optional().nullable(),
  fully_filled_at: string().optional().nullable(),
  cancelled_at: string().optional().nullable(),
  set_thunder_order_id: string().max(128).optional().nullable(),
  metadata_patch: record(string(), unknown()).optional().nullable()
}).refine((d) => !!(d.order_id || d.thunder_order_id), { message: "order_id or thunder_order_id required" });
const CORS$c = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
const json$d = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS$c } });
const Route$R = createFileRoute("/api/public/hooks/order-update")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$c }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$d({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$c });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$d({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = Schema.safeParse(raw);
        if (!parsed.success) return json$d({ ok: false, error: "invalid_body", issues: parsed.error.issues }, 400);
        const d = parsed.data;
        const patch = {};
        if (d.status) patch.status = d.status;
        if (d.fill_price_avg != null) patch.fill_price_avg = d.fill_price_avg;
        if (d.filled_qty != null) patch.filled_qty = d.filled_qty;
        if (d.remaining_qty != null) patch.remaining_qty = d.remaining_qty;
        if (d.confirmed_at) patch.confirmed_at = d.confirmed_at;
        if (d.first_fill_at) patch.first_fill_at = d.first_fill_at;
        if (d.fully_filled_at) patch.fully_filled_at = d.fully_filled_at;
        if (d.cancelled_at) patch.cancelled_at = d.cancelled_at;
        if (d.set_thunder_order_id) patch.thunder_order_id = d.set_thunder_order_id;
        if (Object.keys(patch).length === 0 && !d.metadata_patch) {
          return json$d({ ok: false, error: "empty_patch" }, 400);
        }
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        let target = d.order_id ? { by: "id", val: d.order_id } : { by: "thunder_order_id", val: d.thunder_order_id };
        if (d.metadata_patch) {
          const q = supabaseAdmin2.from("order_lifecycle").select("id, metadata").eq(target.by, target.val).limit(1).maybeSingle();
          const existing = await q;
          if (existing.data) {
            const merged = { ...existing.data.metadata ?? {}, ...d.metadata_patch };
            patch.metadata = merged;
            target = { by: "id", val: existing.data.id };
          }
        }
        const { data, error } = await supabaseAdmin2.from("order_lifecycle").update(patch).eq(target.by, target.val).select("id, status, symbol, side, filled_qty, fill_price_avg, metadata").maybeSingle();
        if (error) return json$d({ ok: false, error: error.message }, 500);
        if (!data) return json$d({ ok: false, error: "order_not_found" }, 404);
        try {
          if (d.status === "filled" || d.status === "partial" || d.status === "cancelled" || d.status === "failed" || d.status === "expired") {
            const side = String(data.side || "").toLowerCase();
            const et = d.status === "cancelled" || d.status === "failed" || d.status === "expired" ? "CANCELLED" : side === "sell" ? "SELL_FILLED" : "BUY_FILLED";
            await logEvent({
              symbol: String(data.symbol || ""),
              event_type: et,
              price: d.fill_price_avg != null ? Number(d.fill_price_avg) : null,
              qty: d.filled_qty != null ? Number(d.filled_qty) : null,
              reason: d.status,
              source: "order-update",
              metadata: { order_lifecycle_id: data.id, side, partial: d.status === "partial" }
            });
          }
        } catch (e) {
          console.error("[ledger] order-update log failed:", e.message);
        }
        return json$d({ ok: true, order_id: data.id, status: data.status });
      }
    }
  }
});
const NumberLike$2 = preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, number().finite().nonnegative());
const DepthLevel = object({
  price: NumberLike$2,
  qty: NumberLike$2
}).passthrough();
const SnapshotSchema = object({
  symbol: string().trim().min(1).max(32),
  ts: union([string(), number()]).optional(),
  best_bid: NumberLike$2.optional().nullable(),
  best_bid_qty: NumberLike$2.optional().nullable(),
  best_ask: NumberLike$2.optional().nullable(),
  best_ask_qty: NumberLike$2.optional().nullable(),
  last_price: NumberLike$2.optional().nullable(),
  bids: array(DepthLevel).max(20).optional().nullable(),
  asks: array(DepthLevel).max(20).optional().nullable(),
  session_id: string().uuid().optional().nullable(),
  source: string().max(32).optional()
});
const CORS$b = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
const json$c = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS$b } });
function normalizeTs(v, fallback) {
  if (v == null || v === "") return fallback;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : fallback;
}
const Route$Q = createFileRoute("/api/public/hooks/orderbook-snapshot")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$b }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$c({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$b });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$c({ ok: false, error: "invalid_json" }, 400);
        }
        const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray(raw.snapshots) ? raw.snapshots : [raw];
        if (items.length < 1 || items.length > 200) {
          return json$c({ ok: false, error: "invalid_body", reason: "1..200 snapshots" }, 400);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const valid = [];
        let invalid = 0;
        for (const item of items) {
          const r = SnapshotSchema.safeParse(item);
          if (r.success) valid.push(r.data);
          else invalid++;
        }
        if (valid.length === 0) return json$c({ ok: false, error: "all_invalid", invalid }, 400);
        const rows = valid.map((s) => {
          const bid = s.best_bid ?? (s.bids?.[0]?.price ?? null);
          const bidQty = s.best_bid_qty ?? (s.bids?.[0]?.qty ?? null);
          const ask = s.best_ask ?? (s.asks?.[0]?.price ?? null);
          const askQty = s.best_ask_qty ?? (s.asks?.[0]?.qty ?? null);
          return {
            symbol: s.symbol.toUpperCase(),
            ts: normalizeTs(s.ts, now),
            best_bid: bid,
            best_bid_qty: bidQty,
            best_ask: ask,
            best_ask_qty: askQty,
            last_price: s.last_price ?? null,
            bids_depth: s.bids ?? null,
            asks_depth: s.asks ?? null,
            source: s.source ?? "thunder_l2",
            session_id: s.session_id ?? null
          };
        });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error } = await supabaseAdmin2.from("orderbook_snapshots").insert(rows);
        if (error) return json$c({ ok: false, error: error.message }, 500);
        return json$c({ ok: true, inserted: rows.length, invalid });
      }
    }
  }
});
const Route$P = createFileRoute("/api/public/hooks/outcome-loop")({
  server: {
    handlers: {
      POST: async () => {
        const result = await ingestClosedTrades(500);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
});
const STRATEGY = "scalp-mr15";
const CAPITAL_PER_TRADE = 2e4;
const MAX_TRADES_PER_DAY$1 = Number.POSITIVE_INFINITY;
const WARMUP_MIN$1 = 30;
const LOOKBACK_SEC$1 = 180;
const TARGET_NET = 5e-3;
const SL_PCT = 5e-3;
const TRAIL_ARM = 6e-3;
const TRAIL_GAP = 2e-3;
const TIME_STOP_MIN = 10;
function cairoNow$2() {
  return new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function isInSession$1(d) {
  const dow = d.getDay();
  if (dow < 0 || dow > 4) return false;
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 10 * 60 && m <= 14 * 60 + 30;
}
function isEOD(d) {
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 14 * 60 + 25;
}
const Route$O = createFileRoute("/api/public/hooks/paper-scalp")({
  server: {
    handlers: {
      POST: async () => {
        const SUB_RUNS = 3;
        const SLEEP_MS = 15e3;
        let totalOpened = 0;
        let totalClosed = 0;
        let lastBody = {};
        for (let i = 0; i < SUB_RUNS; i++) {
          const res = await runOnce();
          lastBody = res;
          totalOpened += res.opened ?? 0;
          totalClosed += res.closed ?? 0;
          if (i < SUB_RUNS - 1) await new Promise((r) => setTimeout(r, SLEEP_MS));
        }
        return Response.json({ ...lastBody, opened: totalOpened, closed: totalClosed, sub_runs: SUB_RUNS });
      }
    }
  }
});
async function runOnce() {
  const now = cairoNow$2();
  if (!isInSession$1(now)) return { ok: true, skipped: "out_of_session" };
  const today = now.toISOString().slice(0, 10);
  const dayStart = `${today}T07:00:00Z`;
  const { data: openTrades } = await supabaseAdmin$5.from("paper_trades").select("*").eq("trade_date", today).eq("strategy", STRATEGY).eq("status", "open");
  let closedCount = 0;
  for (const tr of openTrades || []) {
    const { data: ticks } = await supabaseAdmin$5.from("live_ticks").select("price, ts").eq("symbol", tr.symbol).eq("source", "thunder_ext").gt("ts", tr.entry_ts).order("ts", { ascending: true });
    if (!ticks?.length) continue;
    const deadline = new Date(tr.entry_ts).getTime() + TIME_STOP_MIN * 6e4;
    const entryPx = Number(tr.entry_price);
    let peak = entryPx;
    let dynSl = Number(tr.sl_price);
    let exitPrice = null;
    let exitTs = null;
    let reason = null;
    for (const t of ticks) {
      const p = Number(t.price);
      const ts = new Date(t.ts).getTime();
      if (p > peak) peak = p;
      if ((peak - entryPx) / entryPx >= TRAIL_ARM) {
        const trailSl = peak * (1 - TRAIL_GAP);
        if (trailSl > dynSl) dynSl = trailSl;
      }
      if (p >= Number(tr.tp_price)) {
        exitPrice = Number(tr.tp_price);
        exitTs = t.ts;
        reason = "TP";
        break;
      }
      if (p <= dynSl) {
        exitPrice = dynSl;
        exitTs = t.ts;
        reason = dynSl > Number(tr.sl_price) ? "TRAIL" : "SL";
        break;
      }
      if (ts >= deadline) {
        exitPrice = p;
        exitTs = t.ts;
        reason = "TIME";
        break;
      }
    }
    if (!exitPrice && isEOD(now)) {
      const last = ticks[ticks.length - 1];
      exitPrice = Number(last.price);
      exitTs = last.ts;
      reason = "EOD";
    }
    if (exitPrice && exitTs && reason) {
      const entry = Number(tr.entry_price);
      const pnlPct = (exitPrice - entry) / entry;
      const pnl = Number(tr.capital) * pnlPct;
      await supabaseAdmin$5.from("paper_trades").update({
        exit_price: exitPrice,
        exit_ts: exitTs,
        exit_reason: reason,
        pnl,
        pnl_pct: pnlPct,
        status: "closed"
      }).eq("id", tr.id);
      closedCount++;
      const reasonAr = reason === "TP" ? "🎯 وصل الهدف" : reason === "SL" ? "🛑 وقف الخسارة" : reason === "TRAIL" ? "🪤 Trailing Stop" : reason === "TIME" ? "⏰ انتهى الوقت" : "🔔 إقفال آخر اليوم";
      void sendTelegram$1(
        `<b>🔴 إشارة بيع Scalp — ${tr.symbol}</b>
${reasonAr}

🛒 الدخول: <b>${entry.toFixed(2)}</b>
💵 الخروج: <b>${Number(exitPrice).toFixed(2)}</b>
📈 الربح/الخسارة: <b>${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ج (${(pnlPct * 100).toFixed(2)}%)</b>`
      );
    }
  }
  let openedCount = 0;
  const warmupCutoff = (/* @__PURE__ */ new Date(`${today}T07:${String(WARMUP_MIN$1).padStart(2, "0")}:00Z`)).getTime();
  const nowMs = Date.now();
  if (nowMs >= warmupCutoff) {
    const { count: openCount } = await supabaseAdmin$5.from("paper_trades").select("id", { count: "exact", head: true }).eq("trade_date", today).eq("strategy", STRATEGY).eq("status", "open");
    if ((openCount ?? 0) > 0) {
      return {
        ok: true,
        opened: 0,
        closed: closedCount,
        skipped: "busy_with_open_trade",
        cairo_time: now.toISOString()
      };
    }
    const { data: existing } = await supabaseAdmin$5.from("paper_trades").select("symbol").eq("trade_date", today).eq("strategy", STRATEGY);
    const taken = new Set((existing || []).map((e) => e.symbol));
    if (taken.size < MAX_TRADES_PER_DAY$1) {
      const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol").eq("is_sharia", true).eq("day_tradable", true).limit(150);
      const ticksBySymbol = /* @__PURE__ */ new Map();
      let from = 0;
      while (true) {
        const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, ts").gte("ts", dayStart).eq("source", "thunder_ext").order("symbol").order("ts").range(from, from + 999);
        if (!data?.length) break;
        for (const t of data) {
          if (!ticksBySymbol.has(t.symbol)) ticksBySymbol.set(t.symbol, []);
          ticksBySymbol.get(t.symbol).push({ price: Number(t.price), ts: new Date(t.ts).getTime() });
        }
        if (data.length < 1e3) break;
        from += 1e3;
      }
      const candidates = [];
      for (const s of stocks || []) {
        if (taken.has(s.symbol)) continue;
        const ticks = ticksBySymbol.get(s.symbol);
        if (!ticks || ticks.length < 3) continue;
        const dayOpen = ticks[0].price;
        if (dayOpen <= 0) continue;
        const last = ticks[ticks.length - 1];
        if (last.ts < warmupCutoff) continue;
        if (nowMs - last.ts > 5 * 6e4) continue;
        const cutoff = last.ts - LOOKBACK_SEC$1 * 1e3;
        let past = last.price;
        for (const t of ticks) {
          if (t.ts >= cutoff) {
            past = t.price;
            break;
          }
        }
        if (past <= 0) continue;
        const ret = (last.price - past) / past;
        if (!(ret <= -0.012 && last.price >= dayOpen)) continue;
        candidates.push({
          symbol: s.symbol,
          entry: last.price,
          entryTs: last.ts,
          aboveOpen: (last.price - dayOpen) / dayOpen,
          drop: Math.abs(ret),
          dayOpen,
          ret180s: ret,
          lookbackRefPrice: past
        });
      }
      const MIN_CASH = CAPITAL_PER_TRADE;
      const calcFee = (val) => 3 + 3e-4 * val;
      const safeSellAt = (entry, qty2) => {
        const buyVal = entry * qty2;
        return (buyVal + calcFee(buyVal) + 3 + buyVal * TARGET_NET) / (qty2 * (1 - 3e-4));
      };
      const viable = candidates.filter((c) => {
        const qty2 = Math.max(1, Math.floor(MIN_CASH / c.entry));
        if (qty2 * c.entry < 900) return false;
        const ss = safeSellAt(c.entry, qty2);
        const reqMove = (ss - c.entry) / c.entry;
        if (reqMove > 0.012) return false;
        if (ss > c.lookbackRefPrice * 1.001) return false;
        return true;
      });
      viable.sort((a, b) => {
        const qa = Math.max(1, Math.floor(MIN_CASH / a.entry));
        const qb = Math.max(1, Math.floor(MIN_CASH / b.entry));
        const ha = a.lookbackRefPrice - safeSellAt(a.entry, qa);
        const hb = b.lookbackRefPrice - safeSellAt(b.entry, qb);
        return hb - ha || a.aboveOpen - b.aboveOpen || a.drop - b.drop;
      });
      let pick = null;
      let qty = 0;
      let tp = 0;
      let gateOk = false;
      let gateReason = "no_l2_sellable_candidate";
      let gateRejects = 0;
      for (const candidate of viable) {
        const candidateQty = Math.max(1, Math.floor(CAPITAL_PER_TRADE / candidate.entry));
        const candidateTp = safeSellAt(candidate.entry, candidateQty);
        try {
          const { runPreBuyL2Gate } = await import("./pre-buy-gate.server-BTW6j08Z.mjs");
          const gate = await runPreBuyL2Gate({
            symbol: candidate.symbol,
            entry_price: candidate.entry,
            qty: candidateQty,
            tp_pct: TARGET_NET,
            fee_pct: 12e-4,
            max_snapshot_age_ms: 15e3,
            min_depth_multiplier: 1,
            source: "paper-scalp-liquidity-scan"
          });
          gateReason = gate.reason;
          if (gate.ok) {
            pick = candidate;
            qty = candidateQty;
            tp = candidateTp;
            gateOk = true;
            break;
          }
          gateRejects++;
        } catch (e) {
          gateReason = `gate_error:${e.message?.slice(0, 80) ?? "unknown"}`;
          gateRejects++;
        }
      }
      if (pick) {
        const enforce = true;
        const pickedTicks = ticksBySymbol.get(pick.symbol) ?? [];
        const dayHighSoFar = pickedTicks.reduce((mx, t) => Math.max(mx, Number(t.price) || 0), pick.entry);
        const dayLowSoFar = pickedTicks.reduce((mn, t) => Math.min(mn, Number(t.price) || pick.entry), pick.entry);
        const sl = pick.entry * (1 - SL_PCT);
        let freshPrice = null;
        let freshSource = null;
        let fetchError = null;
        let fetchMs = null;
        const cachedTsIso = new Date(pick.entryTs).toISOString();
        try {
          const t0 = Date.now();
          const { data: latest } = await supabaseAdmin$5.from("live_ticks").select("price, source, ts").eq("symbol", pick.symbol).eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle();
          fetchMs = Date.now() - t0;
          if (latest) {
            freshPrice = Number(latest.price);
            freshSource = latest.source;
          } else {
            fetchError = "no_thunder_tick";
          }
        } catch (e) {
          fetchError = e.message?.slice(0, 200) ?? "unknown";
        }
        const { error } = await supabaseAdmin$5.from("paper_trades").insert({
          trade_date: today,
          symbol: pick.symbol,
          strategy: STRATEGY,
          entry_price: pick.entry,
          entry_ts: new Date(pick.entryTs).toISOString(),
          tp_price: tp,
          sl_price: pick.entry * (1 - SL_PCT),
          capital: CAPITAL_PER_TRADE,
          status: "open"
        });
        if (!error) {
          openedCount++;
          void import("./l2-coverage-alert.server-ZR6KoGet.mjs").then((m) => m.checkL2CoverageAndAlert(pick.symbol)).catch(() => {
          });
          try {
            let extensionEnabled = true;
            try {
              const { data: setting } = await supabaseAdmin$5.from("strategy_settings").select("enabled").eq("key", "scalp-mr15").maybeSingle();
              if (setting && setting.enabled === false) extensionEnabled = false;
            } catch {
            }
            if (!extensionEnabled) {
              console.log("[paper-scalp] extension disabled by toggle — skipping pending_orders insert");
            } else {
              await supabaseAdmin$5.from("pending_orders").insert({
                symbol: pick.symbol,
                side: "buy",
                qty,
                ref_price: pick.entry,
                order_type: "market",
                signal_source: STRATEGY,
                trade_date: today,
                expires_at: new Date(Date.now() + 9e4).toISOString(),
                metadata: {
                  source: "paper_scalp_visible_signal",
                  entry_ts: new Date(pick.entryTs).toISOString(),
                  day_open: pick.dayOpen,
                  day_high_so_far: dayHighSoFar,
                  day_low_so_far: dayLowSoFar,
                  lookback_ref_price: pick.lookbackRefPrice,
                  recent_ceiling_price: pick.lookbackRefPrice,
                  tp_price: tp,
                  sl_price: sl,
                  target_net_profit_pct_after_fees: 5e-3,
                  ret_180s: pick.ret180s,
                  pre_buy_gate_ok: gateOk,
                  pre_buy_gate_reason: gateReason,
                  pre_buy_gate_enforced: enforce,
                  pre_buy_gate_rejected_candidates_before_pick: gateRejects
                }
              });
            }
          } catch (e) {
            console.error("pending_orders insert from visible scalp failed", e);
          }
          void sendTelegram$1(
            `<b>🟢 إشارة شراء Scalp — ${pick.symbol}</b>
🛒 ادخل عند: <b>${pick.entry.toFixed(2)}</b>

<b>على ثاندر اعمل الأمرين دول فوراً:</b>
🎯 طلب بسعر محدد (بيع) @ <b>${tp.toFixed(2)}</b>
🛑 طلب إيقاف @ <b>${sl.toFixed(2)}</b>`
          );
        }
        try {
          const diffPct = freshPrice != null ? (freshPrice - pick.entry) / pick.entry * 100 : null;
          const triggerStillValid = freshPrice != null ? freshPrice >= pick.entry * (1 - 5e-3) : null;
          await supabaseAdmin$5.from("scalp_fresh_fetch_log").insert({
            symbol: pick.symbol,
            cached_price: pick.entry,
            cached_ts: cachedTsIso,
            fresh_price: freshPrice,
            fresh_source: freshSource,
            diff_pct: diffPct,
            fetch_ms: fetchMs,
            fetch_error: fetchError,
            trigger_still_valid: triggerStillValid
          });
        } catch {
        }
      } else if (viable.length > 0) {
        return {
          ok: true,
          opened: 0,
          closed: closedCount,
          skipped: `no_sellable_l2_candidate:${gateReason}`,
          candidates_checked: viable.length,
          candidates_rejected_by_l2: gateRejects,
          cairo_time: now.toISOString()
        };
      }
    }
  }
  return {
    ok: true,
    opened: openedCount,
    closed: closedCount,
    cairo_time: now.toISOString()
  };
}
async function handleSignalAction(body) {
  try {
    if (body.action === "bought") {
      if (!body.signal_id) return Response.json({ ok: false, error: "signal_id required" }, { status: 400 });
      const row = await markSignalBought(body.signal_id, body.price);
      return Response.json({ ok: true, signal: row });
    }
    if (body.action === "sold") {
      if (!body.signal_id) return Response.json({ ok: false, error: "signal_id required" }, { status: 400 });
      const row = await markSignalSold(body.signal_id, body.price);
      return Response.json({ ok: true, signal: row });
    }
    if (body.action === "price") {
      if (!body.symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });
      const price = await currentPriceFor(body.symbol);
      return Response.json({ ok: true, price });
    }
    return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e) {
    return Response.json({ ok: false, error: e?.message ?? "action failed" }, { status: 400 });
  }
}
const Route$N = createFileRoute("/api/public/hooks/paper-scalp-dip")({
  server: {
    handlers: {
      // PART 5: browse/query signals by date (read-only, for the UI history view)
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get("date");
        let q = supabaseAdmin$5.from("scalp_dip_signals").select("*").order("scan_date", { ascending: false }).order("gap_pct", { ascending: true }).limit(500);
        if (date) q = q.eq("scan_date", date);
        const { data, error } = await q;
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, signals: data ?? [] });
      },
      POST: async ({ request }) => {
        let body = {};
        try {
          const text = await request.text();
          if (text) body = JSON.parse(text);
        } catch {
        }
        if (body && typeof body === "object" && body.action) {
          return handleSignalAction(body);
        }
        const now = cairoNow$3();
        const today = cairoDateISO$3(now);
        const minutes = cairoMinutesNow$1();
        if (!isSessionDay$1(now)) {
          return Response.json({ ok: true, skipped: "out_of_session", cairo_time: now.toISOString() });
        }
        const result = { opened: 0, closed: 0, extended: 0, recycled: 0, notes: [] };
        if (minutes >= GAP_PARAMS$1.EOD_CHECK_MIN) {
          const shadow = await updateShadowProgression(today);
          result.notes.push(...shadow.notes);
          result.extended += 0;
          const { data: openTrades } = await supabaseAdmin$5.from("paper_trades").select("id, symbol, entry_price, entry_ts, trade_date, capital, tp_price, sl_price, exit_reason, status").eq("strategy", STRATEGY_ID$1).eq("status", "open");
          for (const tr of openTrades ?? []) {
            const st = await liveSymbolState(tr.symbol);
            if (st.price == null) {
              result.notes.push(`${tr.symbol}: no live price`);
              continue;
            }
            const shares = Math.max(1, Math.floor(Number(tr.capital) / Number(tr.entry_price)));
            const positionValueNow = shares * st.price;
            const extraGranted = String(tr.exit_reason ?? "").startsWith("EXTRA_HOLD");
            const decision = decideExit({
              daysHeld: tradingDaysElapsed$1(String(tr.trade_date), today),
              extraHoldGranted: extraGranted,
              price: st.price,
              bid: st.bid ?? 0,
              bidValue: st.bidValue,
              positionValue: positionValueNow,
              entryPrice: Number(tr.entry_price),
              exitDue: null
            });
            if (decision.action === "HOLD") continue;
            if (decision.action === "EXTEND_HOLD") {
              await supabaseAdmin$5.from("paper_trades").update({ exit_reason: "EXTRA_HOLD_1" }).eq("id", tr.id);
              result.extended++;
              result.notes.push(`${tr.symbol}: TIME_EXIT extended 1 day (thin liquidity)`);
              continue;
            }
            const gross = (decision.exit_price - Number(tr.entry_price)) * shares;
            const net = gross - (Number(tr.entry_price) + decision.exit_price) * shares * 25e-5;
            await supabaseAdmin$5.from("paper_trades").update({
              exit_price: decision.exit_price,
              exit_ts: st.ts ?? (/* @__PURE__ */ new Date()).toISOString(),
              exit_reason: decision.reason,
              pnl: net,
              pnl_pct: net / Number(tr.capital),
              status: "closed"
            }).eq("id", tr.id);
            result.closed++;
            await logEvent({
              trade_date: today,
              symbol: tr.symbol,
              strategy: STRATEGY_ID$1,
              paper_trade_id: tr.id,
              event_type: "PAPER_CLOSED",
              state: decision.reason,
              price: decision.exit_price,
              qty: shares,
              reason: decision.reason,
              source: "gap-down-fade-3d",
              metadata: {
                net,
                bid_confirmed: decision.bid_confirmed,
                bid_value_at_exit: st.bidValue,
                position_value: positionValueNow,
                days_held: tradingDaysElapsed$1(String(tr.trade_date), today)
              }
            });
            result.notes.push(`${tr.symbol}: ${decision.reason} @ ${decision.exit_price} (confirmed=${decision.bid_confirmed})`);
          }
        }
        if (minutes >= GAP_PARAMS$1.SESSION_OPEN_MIN && minutes < GAP_PARAMS$1.EOD_CHECK_MIN) {
          const { count: alreadyToday } = await supabaseAdmin$5.from("paper_trades").select("id", { count: "exact", head: true }).eq("trade_date", today).eq("strategy", STRATEGY_ID$1);
          if ((alreadyToday ?? 0) === 0) {
            const plan = await scanDailyCandidates$1();
            if (plan.status === "trading") {
              const signalsWritten = await persistScanSignals(today, plan.candidates);
              result.notes.push(`signals: ${signalsWritten} candidate rows persisted to log`);
              for (const cand of plan.selected) {
                const capital = cand.shares * cand.entry_price;
                const { data: ptRow, error } = await supabaseAdmin$5.from("paper_trades").insert({
                  trade_date: today,
                  symbol: cand.symbol,
                  strategy: STRATEGY_ID$1,
                  entry_price: cand.entry_price,
                  entry_ts: cand.entry_ts || (/* @__PURE__ */ new Date()).toISOString(),
                  tp_price: cand.entry_price,
                  sl_price: cand.entry_price * (1 + GAP_PARAMS$1.STOP_LOSS_PCT),
                  capital,
                  status: "open",
                  dip_trigger_price: cand.prev_close
                }).select("id").maybeSingle();
                if (!error) {
                  result.opened++;
                  await logEvent({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID$1,
                    paper_trade_id: ptRow?.id ?? null,
                    event_type: "SIGNAL",
                    state: "SIGNALED",
                    price: cand.entry_price,
                    qty: cand.shares,
                    source: "gap-down-fade-3d",
                    metadata: {
                      gap_pct: cand.gap_pct,
                      prev_close: cand.prev_close,
                      bid_depth_value_at_entry: cand.bid_depth_value,
                      position_value: cand.position_value
                    }
                  });
                }
              }
              result.notes.push(`scan: ${plan.selected.length} selected of ${plan.candidates.length} gap-downs (universe ${plan.universeCount})`);
            } else {
              result.notes.push(`scan: ${plan.status} — ${plan.statusLabelAr}`);
            }
          } else {
            result.notes.push("entry: already scanned today");
          }
          if (result.closed > 0) {
            const { count: openNow } = await supabaseAdmin$5.from("paper_trades").select("id", { count: "exact", head: true }).eq("trade_date", today).eq("strategy", STRATEGY_ID$1).eq("status", "open");
            const sizingNow = await getEffectiveSizing$1();
            const freeSlots = sizingNow.top_n - (openNow ?? 0);
            if (freeSlots > 0) {
              const { data: enteredRows } = await supabaseAdmin$5.from("paper_trades").select("symbol").eq("trade_date", today).eq("strategy", STRATEGY_ID$1);
              const enteredSyms = new Set((enteredRows ?? []).map((r) => String(r.symbol).toUpperCase()));
              const plan2 = await scanDailyCandidates$1();
              for (const cand of plan2.selected.slice(0, freeSlots)) {
                if (enteredSyms.has(cand.symbol)) continue;
                const capital = cand.shares * cand.entry_price;
                const { data: ptRow, error } = await supabaseAdmin$5.from("paper_trades").insert({
                  trade_date: today,
                  symbol: cand.symbol,
                  strategy: STRATEGY_ID$1,
                  entry_price: cand.entry_price,
                  entry_ts: cand.entry_ts || (/* @__PURE__ */ new Date()).toISOString(),
                  tp_price: cand.entry_price,
                  sl_price: cand.entry_price * (1 + GAP_PARAMS$1.STOP_LOSS_PCT),
                  capital,
                  status: "open",
                  dip_trigger_price: cand.prev_close
                }).select("id").maybeSingle();
                if (!error) {
                  result.recycled++;
                  await logEvent({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID$1,
                    paper_trade_id: ptRow?.id ?? null,
                    event_type: "SIGNAL",
                    state: "SIGNALED",
                    // TradeState has no RECYCLED; metadata carries it
                    price: cand.entry_price,
                    qty: cand.shares,
                    source: "gap-down-fade-3d",
                    metadata: { recycled: true, gap_pct: cand.gap_pct }
                  });
                }
              }
            }
          }
        }
        return Response.json({
          ok: true,
          ...result,
          disclaimer: BACKTEST_DISCLAIMER_AR,
          cairo_time: now.toISOString()
        });
      }
    }
  }
});
const Route$M = createFileRoute("/api/public/hooks/paper-scalp-fresh")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ ok: true, skipped: "strategy_paused", opened: 0, closed: 0 });
      }
    }
  }
});
const Route$L = createFileRoute("/api/public/hooks/performance-digest")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
          const [recsRes, picksRes, alertsRes] = await Promise.all([
            supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, outcome, realized_pct, created_at").gte("created_at", since).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false),
            supabaseAdmin$5.from("daily_picks").select("symbol, confidence, status, pnl_pct, pick_date").gte("pick_date", since.slice(0, 10)),
            supabaseAdmin$5.from("sell_alerts").select("symbol, alert_type, created_at").gte("created_at", since)
          ]);
          const recs = recsRes.data ?? [];
          const picks = picksRes.data ?? [];
          const alerts = alertsRes.data ?? [];
          const recsResolved = recs.filter((r) => r.outcome && r.outcome !== "pending" && r.realized_pct != null);
          const recsWin = recsResolved.filter((r) => (r.realized_pct ?? 0) > 0).length;
          const recsLoss = recsResolved.filter((r) => (r.realized_pct ?? 0) <= 0).length;
          const recsAvg = recsResolved.length ? recsResolved.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / recsResolved.length : 0;
          const recsAccuracy = recsResolved.length ? recsWin / recsResolved.length * 100 : 0;
          const sortedRecs = [...recsResolved].sort((a, b) => Number(b.realized_pct ?? 0) - Number(a.realized_pct ?? 0));
          const best = sortedRecs[0];
          const worst = sortedRecs[sortedRecs.length - 1];
          const picksClosed = picks.filter((p) => p.status === "closed" && p.pnl_pct != null);
          const picksWin = picksClosed.filter((p) => (p.pnl_pct ?? 0) > 0).length;
          const picksAvg = picksClosed.length ? picksClosed.reduce((s, p) => s + Number(p.pnl_pct ?? 0), 0) / picksClosed.length : 0;
          const lines = [];
          lines.push("📈 <b>الملخص الأسبوعي للأداء</b>");
          lines.push(`الفترة: آخر 7 أيام`);
          lines.push("");
          lines.push("🎯 <b>التوصيات:</b>");
          lines.push(`• إجمالي: <b>${recs.length}</b> · مكتملة: <b>${recsResolved.length}</b>`);
          if (recsResolved.length) {
            lines.push(`• ناجحة: <b>${recsWin}</b> · خاسرة: <b>${recsLoss}</b>`);
            lines.push(`• الدقة: <b>${recsAccuracy.toFixed(1)}%</b>`);
            lines.push(`• متوسط العائد: <b>${recsAvg.toFixed(2)}%</b>`);
          } else {
            lines.push("• لا توصيات مكتملة بعد خلال الأسبوع.");
          }
          if (best && worst && best !== worst) {
            lines.push("");
            lines.push("🏆 <b>الأفضل/الأسوأ:</b>");
            lines.push(`🟢 ${escapeHtml(best.symbol)} — ${Number(best.realized_pct).toFixed(2)}%`);
            lines.push(`🔴 ${escapeHtml(worst.symbol)} — ${Number(worst.realized_pct).toFixed(2)}%`);
          }
          if (picks.length) {
            lines.push("");
            lines.push("⭐ <b>الترشيحات اليومية:</b>");
            lines.push(`• إجمالي: <b>${picks.length}</b> · مغلقة: <b>${picksClosed.length}</b>`);
            if (picksClosed.length) {
              lines.push(`• ناجحة: <b>${picksWin}</b> · متوسط العائد: <b>${picksAvg.toFixed(2)}%</b>`);
            }
          }
          if (alerts.length) {
            lines.push("");
            lines.push(`🚨 تنبيهات البيع المُرسلة: <b>${alerts.length}</b>`);
          }
          lines.push("");
          lines.push("📊 النظام يتعلم تلقائيًا من نتائج الأسبوع لتحسين دقة الترشيحات القادمة.");
          const tg = await sendTelegram$1(lines.join("\n"));
          return Response.json({
            ok: true,
            telegram: tg,
            recs: recs.length,
            recs_resolved: recsResolved.length,
            accuracy: recsAccuracy,
            avg_pct: recsAvg,
            picks: picks.length
          });
        } catch (e) {
          console.error("[performance-digest] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const Route$K = createFileRoute("/api/public/hooks/ping")({
  server: {
    handlers: {
      GET: async () => new Response("OK", {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Access-Control-Allow-Origin": "*"
        }
      }),
      HEAD: async () => new Response(null, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      })
    }
  }
});
const Route$J = createFileRoute("/api/public/hooks/premarket-brief")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 18 * 60 * 60 * 1e3).toISOString();
          const todayStart = /* @__PURE__ */ new Date();
          todayStart.setHours(0, 0, 0, 0);
          const todayISO = todayStart.toISOString();
          const [newsRes, picksRes, recsRes, positionsRes, marketRes] = await Promise.all([
            supabaseAdmin$5.from("news_sentiment").select("symbol, headline, sentiment_score, sentiment, published_at").gte("created_at", since).order("sentiment_score", { ascending: false }).limit(6),
            supabaseAdmin$5.from("daily_picks").select("symbol, confidence, target_pct, reasons, entry_price, target_price, stop_price").gte("created_at", todayISO).order("confidence", { ascending: false }).limit(5),
            supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, expected_next_day_pct, entry_min, entry_max, target, stop_loss, reasons_ar, created_at").gte("created_at", since).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).order("confidence", { ascending: false }).limit(5),
            supabaseAdmin$5.from("positions").select("symbol, entry_price, current_price, pnl_pct, status").eq("status", "open").limit(10),
            supabaseAdmin$5.from("market_snapshots").select("index_symbol, date, close, change_pct, change_5d_pct, trend").order("date", { ascending: false }).limit(1).maybeSingle()
          ]);
          const lines = [];
          lines.push("🌅 <b>ملخص ما قبل فتح السوق</b>");
          lines.push((/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
          lines.push("");
          const m = marketRes.data;
          if (m) {
            lines.push("📊 <b>حالة السوق:</b>");
            if (m.index_symbol) lines.push(`• المؤشر: <b>${escapeHtml(String(m.index_symbol))}</b>${m.close != null ? ` — ${Number(m.close).toFixed(2)}` : ""}`);
            if (m.trend) lines.push(`• الاتجاه: ${escapeHtml(String(m.trend))}`);
            if (m.change_pct != null) lines.push(`• تغير اليوم: ${Number(m.change_pct).toFixed(2)}%`);
            if (m.change_5d_pct != null) lines.push(`• تغير 5 أيام: ${Number(m.change_5d_pct).toFixed(2)}%`);
            lines.push("");
          }
          const picks = picksRes.data ?? [];
          if (picks.length) {
            lines.push(`⭐ <b>ترشيحات اليوم (${picks.length}):</b>`);
            for (const p of picks) {
              const exp = p.target_pct != null ? ` · هدف +${Number(p.target_pct).toFixed(1)}%` : "";
              lines.push(`• <b>${escapeHtml(p.symbol)}</b> — ثقة ${p.confidence}%${exp}`);
              if (p.entry_price && p.target_price) {
                lines.push(`  دخول ${Number(p.entry_price).toFixed(2)} · هدف ${Number(p.target_price).toFixed(2)}${p.stop_price ? ` · وقف ${Number(p.stop_price).toFixed(2)}` : ""}`);
              }
              const reasons = Array.isArray(p.reasons) ? p.reasons.map(String).slice(0, 1) : [];
              for (const r of reasons) lines.push(`  - ${escapeHtml(r.slice(0, 110))}`);
            }
            lines.push("");
          } else {
            const recs = recsRes.data ?? [];
            if (recs.length) {
              lines.push(`🎯 <b>أبرز توصيات الشراء الحديثة:</b>`);
              for (const r of recs) {
                const exp = r.expected_next_day_pct != null ? ` · متوقع +${Number(r.expected_next_day_pct).toFixed(1)}%` : "";
                lines.push(`• <b>${escapeHtml(r.symbol)}</b> — ثقة ${r.confidence}%${exp}`);
              }
              lines.push("");
            }
          }
          const news = newsRes.data ?? [];
          if (news.length) {
            lines.push("📰 <b>أبرز أخبار الليلة:</b>");
            for (const n of news.slice(0, 5)) {
              const emoji = (n.sentiment_score ?? 0) > 0.15 ? "📈" : (n.sentiment_score ?? 0) < -0.15 ? "📉" : "•";
              lines.push(`${emoji} ${escapeHtml(n.symbol)}: ${escapeHtml((n.headline ?? "").slice(0, 110))}`);
            }
            lines.push("");
          }
          const positions = positionsRes.data ?? [];
          if (positions.length) {
            lines.push(`💼 <b>المراكز المفتوحة (${positions.length}):</b>`);
            for (const p of positions.slice(0, 6)) {
              const pnl = p.pnl_pct != null ? `${Number(p.pnl_pct).toFixed(2)}%` : "—";
              const arrow = (p.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
              lines.push(`${arrow} ${escapeHtml(p.symbol)} — PnL ${pnl}`);
            }
            lines.push("");
          }
          if (lines.length <= 4) {
            lines.push("لا توجد بيانات كافية للعرض هذا الصباح — سيتم التحديث بعد فتح السوق.");
          }
          lines.push("");
          lines.push("⚡ بالتوفيق في تداول اليوم");
          const tg = await sendTelegram$1(lines.join("\n"));
          return Response.json({
            ok: true,
            telegram: tg,
            news: news.length,
            picks: picks.length,
            positions: positions.length
          });
        } catch (e) {
          console.error("[premarket-brief] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const Route$I = createFileRoute("/api/public/hooks/premarket-final")({
  server: {
    handlers: {
      POST: async () => {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const existing = await supabaseAdmin$5.from("premarket_shortlist").select("pick_date,sent_at").eq("pick_date", today).maybeSingle();
        if (existing.data?.sent_at) {
          return Response.json({ ok: true, already_sent: true });
        }
        let breadth = null;
        try {
          breadth = await computeMarketBreadth$1();
        } catch {
        }
        const brief = await getMorningBrief().catch((e) => {
          console.error("[premarket-final] morning brief failed", e);
          return null;
        });
        const picks = brief?.picks ?? [];
        const symbols = picks.map((p) => p.symbol);
        const reasons = picks.map((p) => ({
          symbol: p.symbol,
          confidence: p.confidence,
          expected_pct: p.expected_next_day_pct,
          reasons: p.reasons_ar?.slice(0, 2) ?? []
        }));
        const breadthOk = breadth == null ? true : breadth >= 40;
        const lines = [];
        lines.push("🎯 <b>المرشحون قبل الافتتاح</b>");
        lines.push((/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }));
        lines.push(breadth == null ? `اتساع السوق: غير متاح` : `اتساع السوق: <b>${breadth.toFixed(1)}%</b> ${breadthOk ? "✅" : "⚠️ ضعيف"}`);
        lines.push("");
        if (!picks.length) {
          lines.push(brief?.reason ?? "لا توجد ترشيحات تستوفي الشروط الصارمة اليوم.");
        } else if (!breadthOk) {
          lines.push("⚠️ السوق ضعيف — الترشيحات معلّقة حتى تتحسّن الحالة.");
          lines.push("");
          for (const p of picks) {
            lines.push(`• <code>${escapeHtml(p.symbol)}</code> — ثقة ${p.confidence}%`);
          }
        } else {
          for (const p of picks) {
            const exp = p.expected_next_day_pct != null ? ` · متوقع +${Number(p.expected_next_day_pct).toFixed(1)}%` : "";
            lines.push(`⭐ <b>${escapeHtml(p.symbol)}</b> (${escapeHtml(p.name_ar)})`);
            lines.push(`  ثقة <b>${p.confidence}%</b>${exp}`);
            if (p.entry_min && p.target && p.stop_loss) {
              lines.push(`  دخول ${Number(p.entry_min).toFixed(2)} · هدف ${Number(p.target).toFixed(2)} · وقف ${Number(p.stop_loss).toFixed(2)}`);
            }
          }
        }
        lines.push("");
        lines.push("⏰ السوق يفتح 10:00 — هتوصلك إشارات لحظية لو طلع breakout.");
        const tg = await sendTelegram$1(lines.join("\n"), { skipBaladi: true });
        await supabaseAdmin$5.from("premarket_shortlist").upsert({
          pick_date: today,
          symbols,
          reasons,
          breadth_pct: breadth,
          notes: breadthOk ? "ok" : "weak_breadth",
          sent_at: (/* @__PURE__ */ new Date()).toISOString()
        }, { onConflict: "pick_date" });
        return Response.json({ ok: true, picks: picks.length, breadth, telegram: tg.ok });
      }
    }
  }
});
const Route$H = createFileRoute("/api/public/hooks/premarket-gap-alert")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const since = new Date(Date.now() - 14 * 60 * 60 * 1e3).toISOString();
          const { data: news } = await supabaseAdmin$5.from("news_sentiment").select("symbol, headline, sentiment_score, published_at").gte("published_at", since).gte("sentiment_score", 0.6).order("sentiment_score", { ascending: false }).limit(30);
          if (!news || news.length === 0) {
            return Response.json({ ok: true, alerts: 0, reason: "no strong overnight news" });
          }
          const bySymbol = /* @__PURE__ */ new Map();
          for (const n of news) {
            const s = String(n.symbol);
            const cur = bySymbol.get(s);
            const score = Number(n.sentiment_score ?? 0);
            if (!cur || score > cur.score) {
              bySymbol.set(s, { headline: String(n.headline ?? ""), score });
            }
          }
          const symbols = [...bySymbol.keys()];
          if (symbols.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }
          const today = /* @__PURE__ */ new Date();
          today.setHours(0, 0, 0, 0);
          const { data: recs } = await supabaseAdmin$5.from("recommendations").select("symbol, confidence, target, price_at_reco, expected_gain_pct").in("symbol", symbols).gte("created_at", today.toISOString());
          const recMap = new Map(recs?.map((r) => [String(r.symbol), r]) ?? []);
          const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);
          const lines = ["🌅 <b>تنبيه ما قبل الافتتاح — أخبار قوية بالليل</b>", ""];
          let count = 0;
          for (const sym of symbols.slice(0, 10)) {
            const info = bySymbol.get(sym);
            const rec = recMap.get(sym);
            const name = escapeHtml(nameMap.get(sym) || sym);
            const sentPct = (info.score * 100).toFixed(0);
            lines.push(`📈 <b>${name}</b> (${sym})`);
            lines.push(`   مشاعر: +${sentPct}%`);
            if (rec) {
              lines.push(`   ✅ موصى به النهارده — ثقة ${rec.confidence}%`);
            }
            const truncated = escapeHtml(info.headline.length > 80 ? info.headline.slice(0, 80) + "…" : info.headline);
            lines.push(`   "${truncated}"`);
            lines.push("");
            count++;
          }
          lines.push("⚠️ راقب الافتتاح — احتمال فجوة سعرية صاعدة");
          await sendTelegram$1(lines.join("\n"));
          return Response.json({ ok: true, alerts: count });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("premarket-gap-alert failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
const CORS$a = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey"
};
function cairoDateISO$2(d) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
async function handler$3({ request }) {
  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const limit = Math.min(30, Math.max(5, Number(url.searchParams.get("limit") ?? "15")));
  const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
  const { data: stocks } = await supabaseAdmin2.from("stocks").select("symbol").eq("is_sharia", true).eq("day_tradable", true);
  const universe = new Set((stocks ?? []).map((s) => s.symbol));
  const since20 = new Date(Date.now() - 20 * 864e5).toISOString().slice(0, 10);
  const { data: sigRows } = await supabaseAdmin2.from("paper_trades").select("symbol").eq("strategy", "scalp-mr15").gte("trade_date", since20);
  const sigCount = /* @__PURE__ */ new Map();
  for (const r of sigRows ?? []) {
    if (!universe.has(r.symbol)) continue;
    sigCount.set(r.symbol, (sigCount.get(r.symbol) ?? 0) + 1);
  }
  const since5 = new Date(Date.now() - 5 * 864e5).toISOString();
  const tickCount = /* @__PURE__ */ new Map();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin2.from("live_ticks").select("symbol").gte("ts", since5).eq("source", "thunder_ext").range(from, from + 4999);
    if (!data?.length) break;
    for (const t of data) {
      if (!universe.has(t.symbol)) continue;
      tickCount.set(t.symbol, (tickCount.get(t.symbol) ?? 0) + 1);
    }
    if (data.length < 5e3) break;
    from += 5e3;
  }
  const maxSig = Math.max(1, ...sigCount.values());
  const maxTick = Math.max(1, ...tickCount.values());
  const scored = [];
  for (const sym of universe) {
    const s = sigCount.get(sym) ?? 0;
    const t = tickCount.get(sym) ?? 0;
    if (s === 0 && t === 0) continue;
    const score = 0.6 * (s / maxSig) + 0.4 * (t / maxTick);
    scored.push({ symbol: sym, score, signals: s, ticks: t });
  }
  scored.sort((a, b) => b.score - a.score);
  let top = scored.slice(0, limit);
  if (top.length === 0) {
    const { data: fb } = await supabaseAdmin2.rpc("top_active_day_tradable_today", { p_limit: limit });
    top = (fb ?? []).map((r) => ({
      symbol: r.symbol,
      score: 0,
      signals: 0,
      ticks: 0
    }));
  }
  const today = cairoDateISO$2(/* @__PURE__ */ new Date());
  const symbols = top.map((r) => r.symbol);
  const reasons = Object.fromEntries(top.map((r) => [r.symbol, {
    signals_20d: r.signals,
    ticks_5d: r.ticks,
    score: Number(r.score.toFixed(4))
  }]));
  if (!dry) {
    await supabaseAdmin2.from("premarket_shortlist").upsert({
      pick_date: today,
      symbols,
      reasons,
      sent_at: (/* @__PURE__ */ new Date()).toISOString(),
      notes: `top-${limit} scalp-mr15 (0.6*signals_20d + 0.4*ticks_5d)`
    }, { onConflict: "pick_date" });
    try {
      const { sendTelegram: sendTelegram2 } = await import("./telegram.server-D6g8flro.mjs").then((n) => n.t);
      const list = top.map((r, i) => `${i + 1}. <b>${r.symbol}</b>  <i>(sig:${r.signals} tk:${r.ticks})</i>`).join("\n");
      await sendTelegram2(
        `<b>📋 قائمة اليوم — ${today}</b>

افتح Thunder L2 على الـ ${limit} أسهم دول قبل ما البورصة تفتح:

${list}

<i>ده الترتيب المتوقع حسب أعلى احتمال إشارة scalp + سيولة.</i>`
      );
    } catch {
    }
  }
  return Response.json({
    ok: true,
    dry,
    today,
    count: top.length,
    symbols,
    reasons
  }, { headers: CORS$a });
}
const Route$G = createFileRoute("/api/public/hooks/premarket-shortlist")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$a }),
      GET: handler$3,
      POST: handler$3
    }
  }
});
const Route$F = createFileRoute("/api/public/hooks/premarket-warmup")({
  server: {
    handlers: {
      POST: async () => {
        const startedAt = (/* @__PURE__ */ new Date()).toISOString();
        const out = { startedAt };
        try {
          const snap = await fetchMarketSnapshot();
          if (snap) {
            out.market = { close: snap.close, trend: snap.trend, regime: snap.regime };
            await supabaseAdmin$5.from("market_snapshots").upsert(snap, {
              onConflict: "index_symbol,date"
            });
          }
        } catch (e) {
          out.market_error = e.message;
        }
        try {
          out.breadth_pct = await computeMarketBreadth$1();
        } catch (e) {
          out.breadth_error = e.message;
        }
        try {
          const { count } = await supabaseAdmin$5.from("stocks").select("*", { count: "exact", head: true }).eq("is_sharia", true).eq("is_active", true);
          out.sharia_universe = count ?? 0;
        } catch {
        }
        const breadth = typeof out.breadth_pct === "number" ? out.breadth_pct : null;
        const breadthLine = breadth == null ? "اتساع السوق: غير متاح" : `اتساع السوق: <b>${breadth.toFixed(1)}%</b> ${breadth >= 40 ? "✅" : "⚠️"}`;
        const market = out.market;
        const marketLine = market?.close ? `EGX30: <b>${Number(market.close).toFixed(2)}</b> · ${market.trend ?? "—"}` : "EGX30: بيانات غير متاحة";
        await sendTelegram$1(
          `🌅 <b>النظام صحي و جاهز للافتتاح</b>
الوقت: ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
${marketLine}
${breadthLine}
أسهم شرعية نشطة: <b>${out.sharia_universe ?? "—"}</b>`,
          { skipBaladi: true }
        ).catch(() => void 0);
        return Response.json({ ok: true, ...out });
      }
    }
  }
});
const Route$E = createFileRoute(
  "/api/public/hooks/recent-signal-symbols"
)({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
          const now = /* @__PURE__ */ new Date();
          const cairoDayStart = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              6,
              // 06:00 UTC = 08:00 Cairo, covers premarket + market
              0,
              0
            )
          ).toISOString();
          const [{ data: sigs }, { data: trades }, { data: active }] = await Promise.all([
            supabaseAdmin2.from("scalp_signal_log").select("symbol").eq("decision", "would_open").gte("ts", cairoDayStart).limit(500),
            supabaseAdmin2.from("paper_trades").select("symbol").eq("status", "open").limit(200),
            // Top-15 day_tradable symbols by tick count today
            supabaseAdmin2.rpc("top_active_day_tradable_today", { p_limit: 15 })
          ]);
          const set = /* @__PURE__ */ new Set();
          for (const r of sigs || []) if (r?.symbol) set.add(String(r.symbol));
          for (const r of trades || [])
            if (r?.symbol) set.add(String(r.symbol));
          for (const r of active || [])
            if (r?.symbol) set.add(String(r.symbol));
          return Response.json({ ok: true, symbols: Array.from(set) });
        } catch (e) {
          return Response.json(
            { ok: false, symbols: [], error: String(e.message) },
            { status: 200 }
          );
        }
      }
    }
  }
});
const Route$D = createFileRoute("/api/public/hooks/run-backtest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const result = await runBacktestJob({
          minConfidence: Number(body?.minConfidence),
          warmup: Number(body?.warmup),
          maxHold: Number(body?.maxHold),
          requireNews: body?.requireNews === true,
          newsLookbackDays: body?.newsLookbackDays ? Number(body.newsLookbackDays) : void 0,
          fromDateFilter: typeof body?.fromDateFilter === "string" ? body.fromDateFilter : void 0,
          init: body?.init === true,
          finalize: body?.finalize === true,
          backtestId: typeof body?.backtestId === "string" ? body.backtestId : void 0,
          symbols: Array.isArray(body?.symbols) ? body.symbols.filter((s) => typeof s === "string") : void 0
        });
        return Response.json(result);
      }
    }
  }
});
const CONCENTRATION_LIMIT = 0.2;
const BLOCK_DAYS = 14;
async function getConcentrationBlockedSymbols() {
  const blocked = /* @__PURE__ */ new Set();
  const activations = [];
  try {
    const { data } = await supabaseAdmin$5.from("paper_trades").select("symbol, pnl").eq("strategy", "scalp-dip").eq("status", "closed").gte("updated_at", new Date(Date.now() - 30 * 864e5).toISOString());
    if (!data?.length) return { blocked, activations };
    const bySym = /* @__PURE__ */ new Map();
    let net = 0;
    for (const r of data) {
      net += Number(r.pnl);
      const v = bySym.get(r.symbol) ?? 0;
      bySym.set(r.symbol, v + Number(r.pnl));
    }
    if (net <= 0) return { blocked, activations };
    for (const [sym, pnl] of bySym) {
      if (pnl <= 0) continue;
      const share = pnl / net;
      if (share > CONCENTRATION_LIMIT) {
        const { data: existing } = await supabaseAdmin$5.from("concentration_blocks").select("id").eq("symbol", sym).gte("created_at", new Date(Date.now() - BLOCK_DAYS * 864e5).toISOString()).limit(1);
        if (!existing?.length) {
          await supabaseAdmin$5.from("concentration_blocks").insert({
            symbol: sym,
            share,
            reason: `profit concentration ${Math.round(share * 100)}% > 20% limit`
          });
        }
        blocked.add(sym);
        activations.push({ symbol: sym, share });
      }
    }
  } catch {
  }
  return { blocked, activations };
}
const STRATEGY_ID = "scalp-dip";
const GAP_PARAMS = {
  TOTAL_CAPITAL: 1e5,
  // = 10,000 (validated: 10 slots beat 25 with new filters)
  BID_DEPTH_MIN_FRACTION: 0.4,
  // Step 2: bid_depth ≥ 0.4 × SLOT_CAPITAL
  POSITION_DEPTH_CAP: 0.15,
  // 14:25 Cairo — daily SL check window
  SESSION_OPEN_MIN: 10 * 60,
  SESSION_DAYS: [0, 1, 2, 3, 4]
};
const USER_CAPITAL_SETTING_KEY = "scalp_dip_user_capital";
const SLOT_UNIT_EGP = 1e4;
const TOP_N_MAX = 10;
function computeSizing(userCapital) {
  const cap = typeof userCapital === "number" && Number.isFinite(userCapital) && userCapital > 0 ? userCapital : GAP_PARAMS.TOTAL_CAPITAL;
  let topN = Math.round(cap / SLOT_UNIT_EGP);
  if (topN < 1) topN = 1;
  if (topN > TOP_N_MAX) topN = TOP_N_MAX;
  return { total_capital: cap, top_n: topN, slot_capital: cap / topN };
}
async function getUserCapital() {
  const { data } = await supabaseAdmin$5.from("strategy_settings").select("numeric_value").eq("key", USER_CAPITAL_SETTING_KEY).maybeSingle();
  const v = data ? data.numeric_value : null;
  const n = v == null ? null : Number(v);
  return n != null && Number.isFinite(n) ? n : null;
}
async function setUserCapital(capitalEgp) {
  const cap = Math.max(1, Math.round(capitalEgp));
  const { error } = await supabaseAdmin$5.from("strategy_settings").update({ numeric_value: cap, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("key", USER_CAPITAL_SETTING_KEY);
  if (error) throw new Error(`setUserCapital failed: ${error.message}`);
  await supabaseAdmin$5.from("strategy_settings").upsert(
    { key: "momentum_weekly_user_capital", numeric_value: cap, updated_at: (/* @__PURE__ */ new Date()).toISOString() },
    { onConflict: "key" }
  );
}
async function getEffectiveSizing() {
  return computeSizing(await getUserCapital());
}
function cairoNow$1() {
  return new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function cairoMinutesNow() {
  const n = cairoNow$1();
  return n.getHours() * 60 + n.getMinutes();
}
function cairoDateISO$1(d = cairoNow$1()) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
async function loadTodayFirstPrices(todayISO) {
  const first = /* @__PURE__ */ new Map();
  let mwFrom = 0;
  let mwDone = false;
  while (!mwDone) {
    const { data: mw } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol, last_price, captured_at").gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true }).range(mwFrom, mwFrom + 999);
    if (!mw?.length) break;
    for (const r of mw) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.last_price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.captured_at) });
    }
    if (mw.length < 1e3) mwDone = true;
    else mwFrom += 1e3;
  }
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, ts").gte("ts", `${todayISO}T00:00:00Z`).order("ts", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const px = Number(r.price);
      if (px > 0 && !first.has(sym)) first.set(sym, { price: px, ts: String(r.ts) });
    }
    if (data.length < 1e3) break;
    from += 1e3;
  }
  return first;
}
async function loadPrevCloses(todayISO) {
  const closes = /* @__PURE__ */ new Map();
  const since = new Date(Date.parse(`${todayISO}T00:00:00Z`) - 7 * 864e5).toISOString();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol, price, ts").gte("ts", since).lt("ts", `${todayISO}T00:00:00Z`).order("ts", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const px = Number(r.price);
      if (px > 0) closes.set(String(r.symbol).toUpperCase(), px);
    }
    if (data.length < 1e3) break;
    from += 1e3;
  }
  return closes;
}
async function loadBidDepthAtEntryMoments(todayISO, firstPrices) {
  const entryTs = /* @__PURE__ */ new Map();
  for (const [sym, fp] of firstPrices) entryTs.set(sym, Date.parse(fp.ts));
  const depth = /* @__PURE__ */ new Map();
  const taken = /* @__PURE__ */ new Set();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol, highest_bid, highest_bid_qty, captured_at").gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true }).range(from, from + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const need = entryTs.get(sym);
      if (need === void 0 || taken.has(sym)) continue;
      const t = Date.parse(String(r.captured_at));
      if (t + 6e4 < need) continue;
      const bid = Number(r.highest_bid) || 0;
      const qty = Number(r.highest_bid_qty) || 0;
      if (bid <= 0 || qty <= 0) {
        depth.set(sym, 0);
        taken.add(sym);
        continue;
      }
      depth.set(sym, bid * qty);
      taken.add(sym);
    }
    if (taken.size >= entryTs.size && data.length < 1e3) break;
    if (data.length < 1e3) break;
    from += 1e3;
  }
  return depth;
}
const MARKET_CAP_MAX_BN = 10;
async function loadMarketCaps() {
  const { data } = await supabaseAdmin$5.from("symbol_profile").select("symbol, market_cap");
  const caps = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const mc = Number(r.market_cap);
    if (mc > 0) caps.set(String(r.symbol).toUpperCase(), mc);
  }
  return caps;
}
async function loadPostEntryHigh(todayISO, firstPrices) {
  const result = /* @__PURE__ */ new Map();
  for (const [sym, fp] of firstPrices) {
    const t0 = new Date(fp.ts).getTime();
    const t1 = t0 + 10 * 6e4;
    const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("last_price, captured_at").eq("symbol", sym).gte("captured_at", new Date(t0).toISOString()).lte("captured_at", new Date(t1).toISOString()).order("last_price", { ascending: false }).limit(1).maybeSingle();
    result.set(sym, data?.last_price ? Number(data.last_price) : fp.price);
  }
  return result;
}
async function loadAtr5Map(todayISO, symbols) {
  const result = /* @__PURE__ */ new Map();
  const since = new Date(Date.now() - 7 * 864e5).toISOString();
  const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol, last_price, captured_at").in("symbol", symbols).gte("captured_at", since).order("captured_at", { ascending: true });
  const daily = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const sym = String(r.symbol).toUpperCase();
    const day = String(r.captured_at).slice(0, 10);
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    if (!daily.has(sym)) daily.set(sym, /* @__PURE__ */ new Map());
    const dm = daily.get(sym);
    const cur = dm.get(day) ?? { lo: px, hi: px, cl: px };
    cur.lo = Math.min(cur.lo, px);
    cur.hi = Math.max(cur.hi, px);
    cur.cl = px;
    dm.set(day, cur);
  }
  for (const [sym, dm] of daily) {
    const days = [...dm.values()].slice(-5);
    if (days.length < 2) {
      result.set(sym, 0.04);
      continue;
    }
    let sum = 0;
    for (const d of days) sum += (d.hi - d.lo) / d.cl;
    result.set(sym, sum / days.length);
  }
  return result;
}
function volParityMultiplier(atr) {
  if (atr == null || Number.isNaN(atr) || atr <= 0) return 1;
  return Math.min(1.5, Math.max(0.5, 0.04 / atr));
}
async function loadDailyBreadth(todayISO) {
  const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("symbol, last_price, previous_close, captured_at").gte("captured_at", `${todayISO}T00:00:00Z`).order("captured_at", { ascending: true });
  const seen = /* @__PURE__ */ new Map();
  for (const r of data ?? []) {
    const sym = String(r.symbol).toUpperCase();
    if (seen.has(sym)) continue;
    const lp = Number(r.last_price);
    const pc = Number(r.previous_close);
    if (lp > 0 && pc > 0) seen.set(sym, lp > pc);
  }
  let up = 0;
  for (const v of seen.values()) if (v) up++;
  const todayBreadth = seen.size ? up / seen.size : 0.7;
  return { todayBreadth, ma5: todayBreadth, medianAll: 0.72 };
}
async function loadPxAtScan(todayISO, firstPrices) {
  const result = /* @__PURE__ */ new Map();
  for (const [sym, fp] of firstPrices) {
    const t0 = new Date(fp.ts).getTime();
    const t1 = t0 + 10 * 6e4;
    const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("last_price, captured_at").eq("symbol", sym).gte("captured_at", new Date(t0).toISOString()).lte("captured_at", new Date(t1).toISOString()).order("captured_at", { ascending: false }).limit(1).maybeSingle();
    result.set(sym, data?.last_price ? Number(data.last_price) : fp.price);
  }
  return result;
}
async function scanDailyCandidates(dateISOOverride, ignoreSession = false) {
  const now = cairoNow$1();
  const todayISO = dateISOOverride ?? cairoDateISO$1(now);
  const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const sizing = await getEffectiveSizing();
  const base = {
    status: "no_data",
    statusLabelAr: "لا توجد بيانات",
    cairoTime: hhmm,
    scanDate: todayISO,
    universeCount: 0,
    candidates: [],
    selected: [],
    filteredOutIlliquid: [],
    sizing
  };
  if (!ignoreSession) {
    if (!isSessionDay(now)) return { ...base, status: "out_of_session", statusLabelAr: "السوق مغلق" };
    if (cairoMinutesNow() < GAP_PARAMS.SESSION_OPEN_MIN)
      return { ...base, status: "before_open", statusLabelAr: "الجلسة لم تفتح بعد" };
  }
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol").eq("is_active", true).eq("day_tradable", true);
  const universe = (stocks ?? []).map((s) => String(s.symbol).toUpperCase());
  base.universeCount = universe.length;
  if (!universe.length) return base;
  const { blocked: concentrationBlocked } = await getConcentrationBlockedSymbols();
  const firstPrices = await loadTodayFirstPrices(todayISO);
  if (firstPrices.size === 0)
    return { ...base, status: "no_data", statusLabelAr: "لا توجد أسعار اليوم بعد" };
  const [prevCloses, bidDepth, marketCaps] = await Promise.all([
    loadPrevCloses(todayISO),
    loadBidDepthAtEntryMoments(todayISO, firstPrices),
    loadMarketCaps()
  ]);
  const gapUps = [];
  const illiquid = [];
  const tooLarge = [];
  for (const sym of universe) {
    const fp = firstPrices.get(sym);
    const pc = prevCloses.get(sym);
    if (!fp || !pc || pc <= 0 || fp.price <= 0) continue;
    const gapPct = (fp.price - pc) / pc;
    if (gapPct <= 0) continue;
    if (gapPct < 1e-3 || gapPct > 0.015) continue;
    const mc = marketCaps.get(sym);
    if (mc !== void 0 && mc > MARKET_CAP_MAX_BN * 1e9) {
      tooLarge.push({
        symbol: sym,
        entry_price: fp.price,
        entry_ts: fp.ts,
        prev_close: pc,
        gap_pct: gapPct,
        bid_depth_value: bidDepth.get(sym) ?? 0,
        position_value: 0,
        shares: 0
      });
      continue;
    }
    const bidDepthValue = bidDepth.get(sym) ?? 0;
    const cand = {
      symbol: sym,
      entry_price: fp.price,
      entry_ts: fp.ts,
      prev_close: pc,
      gap_pct: gapPct,
      bid_depth_value: bidDepthValue,
      position_value: 0,
      shares: 0
    };
    if (bidDepthValue < GAP_PARAMS.BID_DEPTH_MIN_FRACTION * sizing.slot_capital) {
      illiquid.push(cand);
      continue;
    }
    cand.position_value = Math.min(sizing.slot_capital, GAP_PARAMS.POSITION_DEPTH_CAP * bidDepthValue);
    cand.shares = Math.floor(cand.position_value / cand.entry_price);
    if (cand.shares > 0 && !concentrationBlocked.has(cand.symbol)) gapUps.push(cand);
  }
  if (gapUps.length) {
    const postHighs = await loadPostEntryHigh(todayISO, firstPrices);
    const pxAtScan = await loadPxAtScan(todayISO, firstPrices);
    const strong = [];
    const weak = [];
    for (const c of gapUps) {
      const ph = postHighs.get(c.symbol) ?? c.entry_price;
      const px = pxAtScan.get(c.symbol) ?? c.entry_price;
      const madeNewHigh = ph > c.entry_price;
      const abovePrevClose = px >= c.prev_close;
      if (madeNewHigh && abovePrevClose) strong.push(c);
      else weak.push(c);
    }
    gapUps.length = 0;
    gapUps.push(...strong, ...weak);
  }
  gapUps.sort((a, b) => a.gap_pct - b.gap_pct);
  gapUps.sort((a, b) => a.gap_pct - b.gap_pct);
  const breadthInfo = await loadDailyBreadth(todayISO);
  const atrMap = await loadAtr5Map(todayISO, gapUps.map((cand) => cand.symbol));
  for (const cand of gapUps) {
    const a = atrMap.get(cand.symbol);
    let mult = volParityMultiplier(a);
    if (breadthInfo.todayBreadth < breadthInfo.medianAll) mult *= 0.5;
    if (breadthInfo.ma5 < 0.65) mult *= 0.5;
    cand.position_value = Math.round(cand.position_value * mult);
    cand.shares = Math.floor(cand.position_value / cand.entry_price);
  }
  gapUps.sort((a, b) => a.gap_pct - b.gap_pct);
  illiquid.sort((a, b) => a.gap_pct - b.gap_pct);
  if (!gapUps.length && illiquid.length)
    return { ...base, status: "all_illiquid", filteredOutIlliquid: illiquid, statusLabelAr: "كل فجوات الصعود مرفوضة لضعف السيولة" };
  if (!gapUps.length)
    return { ...base, status: "no_gap_downs", statusLabelAr: "لا توجد فجوات صعود مؤهلة اليوم" };
  const selected = gapUps.slice(0, sizing.top_n);
  const newsFlags = await loadNewsFlags(todayISO, selected.map((c) => c.symbol));
  for (const c of selected) c.news_30h = newsFlags.get(c.symbol) ?? false;
  return {
    ...base,
    status: "trading",
    statusLabelAr: `مرشحون: ${selected.length} (من ${gapUps.length} فجوة صعود)`,
    candidates: gapUps,
    selected,
    filteredOutIlliquid: illiquid
  };
}
function tradingDaysElapsed(entryDateISO, todayISO) {
  const start = Date.parse(`${entryDateISO}T00:00:00Z`);
  const end = Date.parse(`${todayISO}T00:00:00Z`);
  let n = 0;
  for (let t = start; t <= end; t += 864e5) {
    const dow = new Date(t).getUTCDay();
    if (GAP_PARAMS.SESSION_DAYS.includes(dow)) n++;
  }
  return n;
}
async function loadNewsFlags(todayISO, symbols) {
  const flags = /* @__PURE__ */ new Map();
  if (!symbols.length) return flags;
  const dow = (/* @__PURE__ */ new Date(`${todayISO}T00:00:00Z`)).getUTCDay();
  const backDays = dow === 0 ? 2 : 1;
  const startISO = new Date(
    Date.parse(`${todayISO}T01:00:00Z`) - backDays * 864e5
  ).toISOString();
  const endISO = `${todayISO}T07:00:00Z`;
  const { data: mapRows } = await supabaseAdmin$5.from("news_symbol_map").select("symbol, article_id").in("symbol", symbols);
  if (!mapRows?.length) return flags;
  const ids = mapRows.map((r) => String(r.article_id));
  const hit = /* @__PURE__ */ new Set();
  let from = 0;
  while (true) {
    const { data: arts } = await supabaseAdmin$5.from("mubasher_news").select("id").in("id", ids.slice(from, from + 500)).gte("published_at", startISO).lte("published_at", endISO);
    for (const a of arts ?? []) hit.add(String(a.id));
    if (!arts || arts.length < 500 || from + 500 >= ids.length) break;
    from += 500;
  }
  for (const r of mapRows) {
    if (hit.has(String(r.article_id))) flags.set(String(r.symbol).toUpperCase(), true);
  }
  return flags;
}
function isSessionDay(d = cairoNow$1()) {
  return GAP_PARAMS.SESSION_DAYS.includes(d.getDay());
}
const RISK_GUARDS = {
  /** Week-to-date realized P&L at/below this → block NEW entries until Sunday. */
  WEEK_LOSS_KILL_EGP: -8e3,
  // 2× worst observed week (−4,059)
  /** Equity drawdown from peak at/below this → halve new position sizes. */
  DD_HALVE_PCT: 0.1
  // 2.8× worst observed drawdown (−3.6%)
};
function evaluateGuards(args) {
  return {
    week_kill_active: args.weekPnlEgp <= RISK_GUARDS.WEEK_LOSS_KILL_EGP,
    week_pnl: args.weekPnlEgp,
    dd_halve_active: args.drawdownPct <= -RISK_GUARDS.DD_HALVE_PCT,
    drawdown_pct: args.drawdownPct
  };
}
const Route$C = createFileRoute("/api/public/hooks/scalp-brief")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const now = cairoNow$1();
          const todayISO = cairoDateISO$1(now);
          const dow = now.getDay();
          const sundayISO = new Date(Date.parse(`${todayISO}T00:00:00Z`) - dow * 864e5).toISOString().slice(0, 10);
          const [openRes, closedRes, startRes] = await Promise.all([
            supabaseAdmin$5.from("paper_trades").select("id, symbol, trade_date, capital, entry_price, sl_price, status, strategy").eq("strategy", STRATEGY_ID).eq("status", "open"),
            supabaseAdmin$5.from("paper_trades").select("symbol, pnl, exit_reason, status, trade_date, updated_at, strategy").eq("strategy", STRATEGY_ID).eq("status", "closed").gte("updated_at", new Date(Date.now() - 35 * 864e5).toISOString()).order("updated_at", { ascending: false }),
            supabaseAdmin$5.from("strategy_settings").select("numeric_value").eq("key", "scalp_dip_paper_start").maybeSingle()
          ]);
          const closed = closedRes.data ?? [];
          const todayClosed = closed.filter((c) => (c.updated_at ?? "").slice(0, 10) >= todayISO);
          const weekClosed = closed.filter((c) => (c.updated_at ?? "").slice(0, 10) >= sundayISO);
          const weekPnl = weekClosed.reduce((s, c) => s + (Number(c.pnl) || 0), 0);
          const byWeek = /* @__PURE__ */ new Map();
          for (const c of closed) {
            const d = (c.updated_at ?? "").slice(0, 10);
            const dd = /* @__PURE__ */ new Date(`${d}T00:00:00Z`);
            const wkSunday = new Date(dd.getTime() - dd.getUTCDay() * 864e5).toISOString().slice(0, 10);
            byWeek.set(wkSunday, (byWeek.get(wkSunday) ?? 0) + (Number(c.pnl) || 0));
          }
          const weeks = [...byWeek.entries()].sort(([a], [b]) => a < b ? -1 : 1).map(([week, pnl]) => ({ week, pnl }));
          const blocks = [];
          for (let i = 0; i + 4 <= weeks.length; i++) {
            const slice = weeks.slice(i, i + 4);
            blocks.push({
              from: slice[0].week,
              to: slice[3].week,
              pnl: slice.reduce((s, x) => s + x.pnl, 0),
              positive: slice.reduce((s, x) => s + x.pnl, 0) > 0
            });
          }
          const drawdownPct = (() => {
            const chrono = [...closed].reverse();
            let eq = 0, peak = 0, dd = 0;
            for (const c of chrono) {
              eq += Number(c.pnl) || 0;
              peak = Math.max(peak, eq);
              dd = Math.min(dd, eq - peak);
            }
            return peak > 0 ? dd / (1e5 + peak) : 0;
          })();
          const guards = evaluateGuards({ weekPnlEgp: weekPnl, drawdownPct });
          const startVal = startRes.data ? Number(startRes.data.numeric_value) : null;
          const paperGate = startVal ? {
            started: true,
            start_date: new Date(startVal).toISOString().slice(0, 10),
            weeks_elapsed: Math.min(4, Math.floor((Date.now() - startVal) / (7 * 864e5))),
            weeks_total: 4,
            realized_total: closed.reduce((s, c) => s + (Number(c.pnl) || 0), 0)
          } : { started: false, weeks_elapsed: 0, weeks_total: 4, realized_total: closed.reduce((s, c) => s + (Number(c.pnl) || 0), 0) };
          return Response.json({
            ok: true,
            cairo_date: todayISO,
            is_saturday_report: dow === 6,
            open_positions: (openRes.data ?? []).map((t) => ({
              symbol: String(t.symbol),
              capital: Number(t.capital) || 0,
              entry_price: Number(t.entry_price) || 0,
              days_held: tradingDaysElapsed(String(t.trade_date), todayISO),
              sl_price: Number(t.sl_price) || 0
            })),
            today_closed: todayClosed.map((c) => ({
              symbol: c.symbol,
              pnl: Number(c.pnl) || 0,
              exit_reason: c.exit_reason
            })),
            week_pnl: Math.round(weekPnl),
            guards: {
              week_kill_active: guards.week_kill_active,
              dd_halve_active: guards.dd_halve_active,
              thresholds: RISK_GUARDS
            },
            rolling_4w: { weeks, blocks },
            paper_gate: paperGate
          });
        } catch (e) {
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const Route$B = createFileRoute("/api/public/hooks/scalp-canary")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get("date") ?? "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return Response.json({ ok: false, error: "date=YYYY-MM-DD required" }, { status: 200 });
        try {
          const s = await scanDailyCandidates(date, true);
          return Response.json({
            ok: true,
            date,
            status: s.status,
            statusLabelAr: s.statusLabelAr,
            universe: s.universeCount,
            sizing: s.sizing,
            selected: s.selected.map((c) => ({
              symbol: c.symbol,
              gap_pct: +(c.gap_pct * 100).toFixed(2),
              entry: c.entry_price,
              position: Math.round(c.position_value),
              depth: Math.round(c.bid_depth_value),
              news_30h: c.news_30h ?? false
            })),
            illiquid_count: s.filteredOutIlliquid.length
          });
        } catch (e) {
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const supabaseAdmin = supabaseAdmin$5;
const ARABIC_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
function weeklyRowToSignal(r) {
  const buy = r.actual_buy_price != null ? Number(r.actual_buy_price) : null;
  const lastClose = Number(r.last_close);
  return {
    id: Number(r.id),
    scan_date: String(r.scan_date),
    symbol: String(r.symbol).toUpperCase(),
    entry_price: buy ?? lastClose,
    gap_pct: buy != null && lastClose > 0 ? buy / lastClose - 1 : 0,
    bid_depth_at_entry: 0,
    position_value: Number(r.position_value) || 0,
    bought: !!r.bought,
    actual_buy_price: buy,
    buy_timestamp: r.buy_timestamp ?? null,
    day1_status: null,
    day1_price: null,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: r.exit_reason ?? null,
    bid_confirmed_at_exit: null,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    sold: !!r.sold,
    actual_sell_price: r.actual_sell_price != null ? Number(r.actual_sell_price) : null,
    sell_timestamp: r.sell_timestamp ?? null,
    realized_pnl: r.realized_pnl != null ? Number(r.realized_pnl) : null,
    realized_pnl_pct: r.realized_pnl_pct != null ? Number(r.realized_pnl_pct) : null,
    sell_signal: false,
    sell_signal_reason: null,
    created_at: r.created_at ?? null,
    updated_at: r.updated_at ?? null
  };
}
const PLAN_CACHE_FILE = ".daily-plan-cache.json";
let planCache = null;
let planInFlight = null;
const PLAN_TTL = 60 * 6e4;
try {
  const raw = fs__default.readFileSync(PLAN_CACHE_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed && parsed.plan && parsed.plan.scanDate) planCache = parsed;
} catch {
}
function refreshPlanInBackground() {
  if (planInFlight) return planInFlight;
  planInFlight = scanDailyCandidates$1().then((plan) => {
    planCache = { at: Date.now(), plan };
    try {
      fs__default.writeFileSync(PLAN_CACHE_FILE, JSON.stringify(planCache));
    } catch {
    }
    planInFlight = null;
    return plan;
  }).catch((e) => {
    planInFlight = null;
    throw e;
  });
  return planInFlight;
}
async function ensurePlan() {
  if (planCache) {
    if (Date.now() - planCache.at > PLAN_TTL) refreshPlanInBackground();
    return planCache.plan;
  }
  if (planInFlight) return planInFlight;
  return refreshPlanInBackground();
}
setTimeout(() => {
  ensurePlan().catch(() => {
  });
}, 5e3);
async function buildDashboard() {
  const plan = await ensurePlan();
  const today = plan.scanDate;
  const { data: trades } = await supabaseAdmin.from("paper_trades").select("id, symbol, entry_price, entry_ts, exit_price, exit_ts, exit_reason, pnl, pnl_pct, status, trade_date, capital").eq("strategy", "scalp-dip").order("entry_ts", { ascending: false }).limit(200);
  const { data: weeklyBatchRows } = await supabaseAdmin.from("momentum_weekly_signals").select("*").order("scan_date", { ascending: false }).order("position_value", { ascending: false }).limit(80);
  const batchScanDate = weeklyBatchRows?.length ? String(weeklyBatchRows[0].scan_date) : today;
  const batchSignals = (weeklyBatchRows ?? []).filter((r) => String(r.scan_date) === batchScanDate);
  const liveCache = /* @__PURE__ */ new Map();
  const liveTracked = [];
  for (const r of batchSignals) {
    const row = weeklyRowToSignal(r);
    const sym = row.symbol;
    let st = liveCache.get(sym);
    if (!st) {
      st = await liveSymbolState(sym);
      liveCache.set(sym, st);
    }
    const entry = row.entry_price;
    const refClose = Number(r.last_close) > 0 ? Number(r.last_close) : null;
    liveTracked.push({
      ...row,
      _halal: getHalalSet().has(sym),
      livePrice: st.price,
      liveTs: st.ts,
      livePct: st.price != null && entry > 0 ? st.price / entry - 1 : null,
      batchScanDate,
      _bandLo: refClose != null ? refClose * 0.97 : null,
      _bandHi: refClose != null ? refClose * 1.02 : null
    });
  }
  const { data: openSignals } = await supabaseAdmin.from("momentum_weekly_signals").select("*").eq("selected", true).eq("bought", true).eq("sold", false).order("entry_date", { ascending: false });
  const enrichedOpen = await Promise.all(
    (openSignals ?? []).map(async (raw) => {
      const s = weeklyRowToSignal(raw);
      const live = await liveSymbolState(s.symbol);
      const buyPrice = Number(s.actual_buy_price ?? s.entry_price);
      const curPrice = live.price ?? buyPrice;
      const shares = Number(raw.shares) || Math.max(1, Math.floor(Number(s.position_value) / buyPrice));
      const pnlEgp = (curPrice - buyPrice) * shares;
      const pnlPct = buyPrice > 0 ? (curPrice - buyPrice) / buyPrice : 0;
      const entryISO = String(raw.entry_date);
      const exitISO = String(raw.exit_date);
      const daysHeld = tradingDaysElapsed$1(entryISO, today);
      const isScheduledExit = daysHeld >= 5;
      const exitDow = (/* @__PURE__ */ new Date(`${exitISO}T00:00:00Z`)).getUTCDay();
      return {
        ...s,
        scan_date: entryISO,
        currentPrice: curPrice,
        pnlEgp,
        pnlPct,
        daysHeld,
        daysRemaining: Math.max(0, 5 - daysHeld),
        exitDate: exitISO,
        exitDayName: ARABIC_DAY_NAMES[exitDow],
        isScheduledExit,
        isAnomaly: false,
        shares
      };
    })
  );
  const { data: recentSignals } = await supabaseAdmin.from("scalp_dip_signals").select("*").lt("scan_date", today).order("scan_date", { ascending: false }).order("gap_pct", { ascending: true }).limit(80);
  const { data: sellAlerts } = await supabaseAdmin.from("scalp_dip_signals").select("*").eq("sell_signal", true).eq("sold", false);
  const auditLogs = await getRecentAuditLogs(40);
  return {
    plan,
    halalList: [...getHalalSet()],
    trades: trades ?? [],
    todaySignals: liveTracked,
    batchScanDate,
    openPositions: enrichedOpen,
    recentSignals: recentSignals ?? [],
    sellAlerts: sellAlerts ?? [],
    auditLogs: auditLogs ?? []
  };
}
const dashboardBuilder = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  buildDashboard,
  weeklyRowToSignal
}, Symbol.toStringTag, { value: "Module" }));
const Route$A = createFileRoute("/api/public/hooks/scalp-dip-dashboard")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await buildDashboard();
          return Response.json({ ok: true, ...data });
        } catch (e) {
          return Response.json({ ok: false, error: e?.message ?? "dashboard failed" }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        try {
          if (body.action === "bought") {
            const signal = await markWeeklyBought(Number(body.signal_id), body.price != null ? Number(body.price) : void 0);
            return Response.json({ ok: true, signal });
          }
          if (body.action === "sold") {
            const signal = await markWeeklySold(Number(body.signal_id), body.price != null ? Number(body.price) : void 0);
            return Response.json({ ok: true, signal });
          }
          if (body.action === "capital") {
            const cap = Number(body.capital);
            if (!Number.isFinite(cap) || cap <= 0) return Response.json({ ok: false, error: "أدخل مبلغًا صحيحًا أكبر من صفر" });
            await setUserCapital(cap);
            const sizing = computeSizing(await getUserCapital());
            return Response.json({ ok: true, sizing });
          }
          return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
        } catch (e) {
          return Response.json({ ok: false, error: e?.message ?? "action failed" });
        }
      }
    }
  }
});
const CORS$9 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey"
};
function cairoDateISO(d) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
}
async function handler$2({ request }) {
  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const dateOverride = url.searchParams.get("date");
  const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
  const { sendTelegram: sendTelegram2 } = await import("./telegram.server-D6g8flro.mjs").then((n) => n.t);
  const now = /* @__PURE__ */ new Date();
  const today = dateOverride ?? cairoDateISO(now);
  const dayStart = `${today}T07:00:00Z`;
  const dayEnd = `${today}T13:00:00Z`;
  const [gateRows, tradeRows, cronRows] = await Promise.all([
    supabaseAdmin2.from("pre_buy_gate_log").select("decision, reason, snapshot_ts, symbol, ts").gte("ts", dayStart).lte("ts", dayEnd).eq("source", "paper-scalp"),
    supabaseAdmin2.from("paper_trades").select("symbol, entry_ts, exit_reason, pnl, pnl_pct").eq("trade_date", today).eq("strategy", "scalp-mr15"),
    supabaseAdmin2.rpc("get_cron_runs", { p_limit: 500 })
  ]);
  const gates = gateRows.data ?? [];
  const trades = tradeRows.data ?? [];
  const cronAll = cronRows.data ?? [];
  let tradesWithL2 = 0;
  const missing = [];
  for (const t of trades) {
    const et = new Date(t.entry_ts).getTime();
    const from = new Date(et - 5 * 6e4).toISOString();
    const to = new Date(et).toISOString();
    const { count } = await supabaseAdmin2.from("orderbook_snapshots").select("id", { count: "exact", head: true }).eq("symbol", t.symbol).gte("ts", from).lte("ts", to);
    if ((count ?? 0) > 0) tradesWithL2++;
    else missing.push(t.symbol);
  }
  const preEntryL2Pct = trades.length > 0 ? Math.round(tradesWithL2 / trades.length * 100) : 0;
  async function preEntryPctFor(day) {
    const { data: dTr } = await supabaseAdmin2.from("paper_trades").select("symbol, entry_ts").eq("trade_date", day).eq("strategy", "scalp-mr15");
    const rows = dTr ?? [];
    if (rows.length === 0) return { pct: 0, total: 0 };
    let w = 0;
    for (const t of rows) {
      const et = new Date(t.entry_ts).getTime();
      const { count } = await supabaseAdmin2.from("orderbook_snapshots").select("id", { count: "exact", head: true }).eq("symbol", t.symbol).gte("ts", new Date(et - 5 * 6e4).toISOString()).lte("ts", new Date(et).toISOString());
      if ((count ?? 0) > 0) w++;
    }
    return { pct: Math.round(w / rows.length * 100), total: rows.length };
  }
  function prevTradingDay(iso, back) {
    let d = /* @__PURE__ */ new Date(iso + "T00:00:00Z");
    let count = 0;
    while (count < back) {
      d = new Date(d.getTime() - 864e5);
      const dow = d.getUTCDay();
      if (dow !== 5 && dow !== 6) count++;
    }
    return d.toISOString().slice(0, 10);
  }
  const dayMinus1 = prevTradingDay(today, 1);
  const dayMinus2 = prevTradingDay(today, 2);
  const [p1, p2] = await Promise.all([preEntryPctFor(dayMinus1), preEntryPctFor(dayMinus2)]);
  const consecutive3d = preEntryL2Pct >= 70 && p1.pct >= 70 && p2.pct >= 70 && trades.length >= 3 && p1.total >= 3 && p2.total >= 3;
  const gateCount = gates.length;
  const accept = gates.filter((g) => g.decision === "accept").length;
  const reject = gateCount - accept;
  const hasL2 = gates.filter((g) => g.snapshot_ts != null).length;
  const l2Pct = gateCount > 0 ? Math.round(hasL2 / gateCount * 100) : 0;
  const rejReasons = /* @__PURE__ */ new Map();
  for (const g of gates.filter((g2) => g2.decision === "reject")) {
    const key = String(g.reason ?? "").split(":")[0] || "unknown";
    rejReasons.set(key, (rejReasons.get(key) ?? 0) + 1);
  }
  const topReasons = [...rejReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tp = trades.filter((t) => t.exit_reason === "TP" || t.exit_reason === "TRAIL").length;
  const sl = trades.filter((t) => t.exit_reason === "SL").length;
  const time = trades.filter((t) => t.exit_reason === "TIME").length;
  const eod = trades.filter((t) => t.exit_reason === "EOD").length;
  const pnlTotal = trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0);
  const cronToday = cronAll.filter((r) => r.jobname === "paper-scalp-runner" && new Date(r.start_time) >= new Date(dayStart) && new Date(r.start_time) <= new Date(dayEnd));
  const cronSuccess = cronToday.filter((r) => r.status === "succeeded").length;
  const cronTotal = cronToday.length;
  const cronPct = cronTotal > 0 ? Math.round(cronSuccess / cronTotal * 100) : 0;
  const check1 = gateCount >= 5;
  gateCount > 0 && gateCount === trades.length + reject;
  const check3 = preEntryL2Pct >= 70;
  const check4 = cronPct >= 90;
  const allPassed = check1 && check3 && check4;
  const enforcementReady = consecutive3d && check4;
  const reasonsText = topReasons.length ? topReasons.map(([k, v]) => `  • <code>${k}</code>: ${v}`).join("\n") : "  —";
  const text = `<b>📊 تقرير آخر اليوم — بوابة Scalp</b>
التاريخ: <b>${today}</b>

<b>1) الإشارات</b>
عدد الإشارات: <b>${gateCount}</b> (${check1 ? "✅ ≥5" : "⚠️ <5"})

<b>2) قرار البوابة</b>
قبول: <b>${accept}</b> | رفض: <b>${reject}</b>
أسباب الرفض:
${reasonsText}

<b>3) تغطية L2 قبل الدخول (5 دقايق)</b>
صفقات عندها L2: <b>${tradesWithL2}/${trades.length}</b> (${preEntryL2Pct}%) ${check3 ? "✅" : "⚠️ <70%"}
اليوم-1: ${p1.pct}% (${p1.total}) | اليوم-2: ${p2.pct}% (${p2.total})

<b>4) نتائج الصفقات (paper)</b>
TP/TRAIL: ${tp} | SL: ${sl} | TIME: ${time} | EOD: ${eod}
صافي PnL: <b>${pnlTotal.toFixed(2)} ج</b>

<b>5) صحة الـ Cron</b>
paper-scalp-runner: <b>${cronSuccess}/${cronTotal}</b> (${cronPct}%) ${check4 ? "✅" : "⚠️ <90%"}

<b>${enforcementReady ? "✅ جاهز للـ enforce (3 أيام متتالية ≥70%)" : allPassed ? "⚠️ اليوم كويس بس لسه محتاج أيام متتالية" : "⚠️ فيه معيار ما اتحققش"}</b>
` + (enforcementReady ? "تقدر تفعّل يدويًا PRE_BUY_L2_ENFORCE=1 بثقة." : "لسه ما نلمسش enforce. راجع الأرقام فوق.");
  if (!dry) await sendTelegram2(text);
  return Response.json({
    ok: true,
    today,
    dry,
    gate_count: gateCount,
    accept,
    reject,
    l2_pct: l2Pct,
    pre_entry_l2: { covered: tradesWithL2, total: trades.length, pct: preEntryL2Pct, missing },
    prev_days: { [dayMinus1]: p1, [dayMinus2]: p2 },
    enforcement_ready: enforcementReady,
    reject_reasons: Object.fromEntries(rejReasons),
    trades: { tp, sl, time, eod, pnl_total: pnlTotal, total: trades.length },
    cron: { success: cronSuccess, total: cronTotal, pct: cronPct },
    checks: { signals_ge_5: check1, l2_ge_70pct: check3, cron_ge_90pct: check4, all_passed: allPassed }
  }, { headers: CORS$9 });
}
const Route$z = createFileRoute("/api/public/hooks/scalp-eod-report")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$9 }),
      GET: handler$2,
      POST: handler$2
    }
  }
});
const WARMUP_MIN = 30;
const LOOKBACK_SEC = 180;
const TRIG_PCT = 0.012;
const MAX_TRADES_PER_DAY = 10;
function cairoNow() {
  return new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function isInSession(d) {
  const dow = d.getDay();
  if (dow < 0 || dow > 4) return false;
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 10 * 60 && m <= 14 * 60 + 30;
}
const Route$y = createFileRoute("/api/public/hooks/scalp-signal-logger")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
          const now = cairoNow();
          if (!isInSession(now)) return Response.json({ ok: true, skipped: "out_of_session" });
          const today = now.toISOString().slice(0, 10);
          const dayStart = `${today}T07:00:00Z`;
          const warmupCutoff = (/* @__PURE__ */ new Date(`${today}T07:${String(WARMUP_MIN).padStart(2, "0")}:00Z`)).getTime();
          const nowMs = Date.now();
          const { data: existing } = await supabaseAdmin2.from("paper_trades").select("symbol").eq("trade_date", today).eq("strategy", "scalp-mr15");
          const taken = new Set((existing || []).map((e) => e.symbol));
          const slotsLeft = MAX_TRADES_PER_DAY - taken.size;
          const { data: stocks } = await supabaseAdmin2.from("stocks").select("symbol").eq("is_sharia", true).eq("day_tradable", true).limit(150);
          const ticksBySymbol = /* @__PURE__ */ new Map();
          let from = 0;
          while (true) {
            const { data } = await supabaseAdmin2.from("live_ticks").select("symbol, price, ts").gte("ts", dayStart).eq("source", "thunder_ext").order("symbol").order("ts").range(from, from + 999);
            if (!data?.length) break;
            for (const t of data) {
              if (!ticksBySymbol.has(t.symbol)) ticksBySymbol.set(t.symbol, []);
              ticksBySymbol.get(t.symbol).push({ price: Number(t.price), ts: new Date(t.ts).getTime() });
            }
            if (data.length < 1e3) break;
            from += 1e3;
          }
          const rows = [];
          for (const s of stocks || []) {
            const ticks = ticksBySymbol.get(s.symbol);
            const base = { trade_date: today, symbol: s.symbol, ts: new Date(nowMs).toISOString() };
            if (taken.has(s.symbol)) {
              rows.push({ ...base, decision: "skipped_already_taken" });
              continue;
            }
            if (!ticks || ticks.length < 3) {
              rows.push({ ...base, decision: "skipped_no_ticks" });
              continue;
            }
            const dayOpen = ticks[0].price;
            if (dayOpen <= 0) {
              rows.push({ ...base, decision: "skipped_bad_open", day_open: dayOpen });
              continue;
            }
            const last = ticks[ticks.length - 1];
            const ageSec = Math.floor((nowMs - last.ts) / 1e3);
            if (last.ts < warmupCutoff) {
              rows.push({ ...base, decision: "skipped_warmup", last_price: last.price, day_open: dayOpen, last_tick_age_sec: ageSec });
              continue;
            }
            if (nowMs - last.ts > 5 * 6e4) {
              rows.push({ ...base, decision: "skipped_stale", last_price: last.price, day_open: dayOpen, last_tick_age_sec: ageSec });
              continue;
            }
            const cutoff = last.ts - LOOKBACK_SEC * 1e3;
            let past = last.price;
            for (const t of ticks) {
              if (t.ts >= cutoff) {
                past = t.price;
                break;
              }
            }
            const ret = past > 0 ? (last.price - past) / past : 0;
            if (!(ret <= -TRIG_PCT)) {
              rows.push({ ...base, decision: "skipped_no_drop", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            if (last.price < dayOpen) {
              rows.push({ ...base, decision: "skipped_below_open", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            if (slotsLeft <= 0) {
              rows.push({ ...base, decision: "skipped_cap", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            rows.push({ ...base, decision: "would_open", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
          }
          for (let i = 0; i < rows.length; i += 500) {
            try {
              await supabaseAdmin2.from("scalp_signal_log").insert(rows.slice(i, i + 500));
            } catch (e) {
              console.error("logger insert failed", e);
            }
          }
          return Response.json({
            ok: true,
            logged: rows.length,
            slots_left: slotsLeft,
            enqueued: 0,
            enqueue_source: "disabled_logger_is_read_only_visible_scalp_owns_orders"
          });
        } catch (e) {
          console.error("scalp-signal-logger error", e);
          return Response.json({ ok: false, error: String(e) }, { status: 200 });
        }
      }
    }
  }
});
const CORS$8 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey"
};
async function handler$1() {
  const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
  const { runPreBuyL2Gate } = await import("./pre-buy-gate.server-BTW6j08Z.mjs");
  const { sendTelegram: sendTelegram2 } = await import("./telegram.server-D6g8flro.mjs").then((n) => n.t);
  const start = Date.now();
  const errors = [];
  let symbol = "COMI";
  let gateReason = "";
  let gateOk = false;
  let rowWritten = false;
  try {
    const { data: latest } = await supabaseAdmin2.from("orderbook_snapshots").select("symbol").order("ts", { ascending: false }).limit(1).maybeSingle();
    if (latest?.symbol) symbol = String(latest.symbol);
    const { data: tick } = await supabaseAdmin2.from("live_ticks").select("price").eq("symbol", symbol).eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle();
    const entry_price = Number(tick?.price ?? 10);
    const qty = Math.max(1, Math.floor(1e4 / Math.max(0.01, entry_price)));
    const beforeCount = await supabaseAdmin2.from("pre_buy_gate_log").select("id", { count: "exact", head: true }).eq("source", "smoke_test");
    const gate = await runPreBuyL2Gate({
      symbol,
      entry_price,
      qty,
      tp_pct: 5e-3,
      fee_pct: 12e-4,
      source: "smoke_test"
    });
    gateOk = gate.ok;
    gateReason = gate.reason;
    const afterCount = await supabaseAdmin2.from("pre_buy_gate_log").select("id", { count: "exact", head: true }).eq("source", "smoke_test");
    rowWritten = (afterCount.count ?? 0) > (beforeCount.count ?? 0);
    if (!rowWritten) errors.push("row_not_written_to_pre_buy_gate_log");
  } catch (e) {
    errors.push(`throw:${e.message?.slice(0, 120) ?? "unknown"}`);
  }
  const passed = errors.length === 0;
  const elapsed = Date.now() - start;
  const emoji = passed ? "✅" : "🔴";
  const status = passed ? "الاختبار نجح" : "الاختبار فشل";
  const text = `<b>${emoji} Smoke Test — البوابة قبل السوق</b>
الحالة: <b>${status}</b>

العملة: <b>${symbol}</b>
قرار البوابة: <code>${gateOk ? "accept" : "reject"} — ${gateReason || "n/a"}</code>
الصف اتكتب في pre_buy_gate_log: <b>${rowWritten ? "نعم" : "لأ"}</b>
المدة: ${elapsed}ms
` + (errors.length ? `
<b>الأخطاء:</b>
${errors.map((e) => `• <code>${e}</code>`).join("\n")}` : "") + (passed ? "\n\nكل حاجة تمام. البوابة جاهزة." : "\n\n🔴 <b>لا تشتري اليوم بدون مراجعة</b> — فيه خطأ في البوابة.");
  await sendTelegram2(text);
  return Response.json({
    ok: passed,
    symbol,
    gate_ok: gateOk,
    gate_reason: gateReason,
    row_written: rowWritten,
    elapsed_ms: elapsed,
    errors
  }, { headers: CORS$8 });
}
const Route$x = createFileRoute("/api/public/hooks/scalp-smoke-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$8 }),
      GET: handler$1,
      POST: handler$1
    }
  }
});
const EventName = _enum([
  "signal_received",
  "tab_opened",
  "l2_modal_opened",
  "l2_snapshot_ready",
  "l2_guard_verdict",
  "buy_started",
  "buy_confirmed",
  "buy_failed",
  "sell_started",
  "sell_price_written",
  "sell_confirmed",
  "sell_failed"
]);
const EventSchema = object({
  signal_id: string().max(128).optional().nullable(),
  symbol: string().trim().min(1).max(32),
  uuid: string().max(64).optional().nullable(),
  event: EventName,
  at_ms: number().finite().positive(),
  meta: record(string(), unknown()).optional().nullable()
});
const CORS$7 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
const json$b = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS$7 } });
const Route$w = createFileRoute("/api/public/hooks/scalp-timeline")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$7 }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$b({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$7 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$b({ ok: false, error: "invalid_json" }, 400);
        }
        const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray(raw.events) ? raw.events : [raw];
        if (items.length < 1 || items.length > 200) {
          return json$b({ ok: false, error: "invalid_body", reason: "1..200 events" }, 400);
        }
        const valid = [];
        let invalid = 0;
        for (const item of items) {
          const r = EventSchema.safeParse(item);
          if (r.success) valid.push(r.data);
          else invalid++;
        }
        if (valid.length === 0) return json$b({ ok: false, error: "all_invalid", invalid }, 400);
        const rows = valid.map((e) => ({
          signal_id: e.signal_id ?? null,
          symbol: e.symbol.toUpperCase(),
          uuid: e.uuid ? e.uuid.toLowerCase() : null,
          event: e.event,
          at_ms: Math.floor(e.at_ms),
          meta: e.meta ?? {}
        }));
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error } = await supabaseAdmin2.from("scalp_timeline_events").insert(rows);
        if (error) return json$b({ ok: false, error: error.message }, 500);
        return json$b({ ok: true, inserted: rows.length, invalid });
      }
    }
  }
});
const Route$v = createFileRoute("/api/public/hooks/self-calibrate")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const calib = await runSelfCalibration();
          return new Response(JSON.stringify({ ok: true, calib }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: e.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }
  }
});
const Route$u = createFileRoute("/api/public/hooks/self-improve")({
  server: {
    handlers: {
      POST: async () => {
        const [threshold, weights, adversarial] = await Promise.allSettled([
          recomputeAutoThreshold(),
          updateEnsembleMetaWeights(),
          runAdversarialLearner()
        ]);
        return Response.json({
          ok: true,
          threshold: threshold.status === "fulfilled" ? threshold.value : null,
          weights: weights.status === "fulfilled" ? weights.value : null,
          adversarial: adversarial.status === "fulfilled" ? adversarial.value : null
        });
      },
      GET: async () => {
        return Response.json({ ok: true, hint: "POST to trigger self-improvement" });
      }
    }
  }
});
const CORS$6 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
async function runSelfTest(now) {
  const market = getMarketStatus(now);
  const marketOpen = market.isOpen;
  const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
  const since5m = new Date(now.getTime() - 5 * 6e4).toISOString();
  const since24h = new Date(now.getTime() - 24 * 60 * 6e4).toISOString();
  const today = new Date(now.getTime());
  today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);
  const [
    tickLatest,
    tick5m,
    obLatest,
    obMarketHours,
    obDiversity,
    wlLatest,
    feasLatest,
    feasFillL2,
    signalsToday
  ] = await Promise.all([
    supabaseAdmin2.from("live_ticks").select("ts").eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin2.from("live_ticks").select("symbol", { count: "exact", head: true }).eq("source", "thunder_ext").gte("ts", since5m),
    supabaseAdmin2.from("orderbook_snapshots").select("ts").order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin2.from("orderbook_snapshots").select("symbol", { count: "exact", head: true }).gte("ts", since24h),
    supabaseAdmin2.from("orderbook_snapshots").select("symbol").gte("ts", since24h).limit(2e3),
    supabaseAdmin2.from("thunder_watchlist_snapshots").select("ts").order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin2.from("scalp_feasibility_report").select("computed_at, l2_at_signal_ts").order("computed_at", { ascending: false }).limit(50),
    supabaseAdmin2.from("scalp_feasibility_report").select("l2_at_signal_ts", { count: "exact", head: true }).not("l2_at_signal_ts", "is", null).gte("computed_at", since24h),
    supabaseAdmin2.from("scalp_signal_log").select("id", { count: "exact", head: true }).eq("trade_date", todayIso)
  ]);
  const ageSec = (iso) => iso ? Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1e3)) : null;
  const tickAge = ageSec(tickLatest.data?.ts);
  const obAge = ageSec(obLatest.data?.ts);
  const wlAge = ageSec(wlLatest.data?.ts);
  const obDistinct = new Set((obDiversity.data ?? []).map((r) => r.symbol)).size;
  const feasLastAge = ageSec(feasLatest.data?.[0]?.computed_at);
  const feasTotal = feasLatest.data?.length ?? 0;
  const feasFilled = feasFillL2.count ?? 0;
  const checks = [];
  checks.push({
    key: "ticks",
    label: "💹 Live ticks",
    category: "data",
    status: !marketOpen ? "idle" : tickAge == null ? "red" : tickAge >= 180 ? "red" : tickAge >= 90 ? "yellow" : "green",
    evidence: tickAge == null ? "لا يوجد أي tick" : `آخر tick من ${tickAge}s · ${tick5m.count ?? 0} في آخر 5د`,
    expected: marketOpen ? "tick كل ~2ث" : "السوق مغلق",
    detail: "قراءة من live_ticks حيث source=thunder_ext"
  });
  const l2Ok = obMarketHours.count != null && obMarketHours.count >= 200 && obDistinct >= 30;
  const l2Warn = obMarketHours.count != null && obMarketHours.count >= 80 && obDistinct >= 15;
  checks.push({
    key: "l2",
    label: "📚 L2 Orderbook",
    category: "data",
    status: !marketOpen && obAge != null && obAge > 3600 ? "idle" : l2Ok ? "green" : l2Warn ? "yellow" : "red",
    evidence: `${obMarketHours.count ?? 0} snapshot / ${obDistinct} رمز في آخر 24س · آخر: ${obAge != null ? Math.round(obAge / 60) + "د" : "—"}`,
    expected: "≥200 snapshot و ≥30 رمز في آخر 24س",
    detail: "لو 14 رمز فقط = هي المشكلة اللي حصلت النهاردة"
  });
  checks.push({
    key: "watchlist",
    label: "👁️ Watchlist",
    category: "data",
    status: !marketOpen ? "idle" : wlAge == null ? "red" : wlAge >= 900 ? "red" : wlAge >= 400 ? "yellow" : "green",
    evidence: wlAge == null ? "لا يوجد" : `آخر تحديث من ${Math.round(wlAge / 60)}د`,
    expected: "تحديث كل ~دقيقة",
    detail: "thunder_watchlist_snapshots"
  });
  const cronRuns = await supabaseAdmin2.rpc("get_cron_runs", { p_limit: 500 });
  const runs = cronRuns.data ?? [];
  const latestPerJob = /* @__PURE__ */ new Map();
  for (const r of runs) {
    if (!r.jobname) continue;
    if (!latestPerJob.has(r.jobname)) latestPerJob.set(r.jobname, r);
  }
  function cronCheck(key, label, jobname, maxAgeSec, warnAgeSec) {
    const r = latestPerJob.get(jobname);
    if (!r) {
      checks.push({
        key,
        label,
        category: "cron",
        status: marketOpen ? "red" : "idle",
        evidence: "لم يشتغل نهائياً في آخر 500 تشغيل",
        expected: `كل ≤${Math.round(maxAgeSec / 60)}د`,
        detail: jobname
      });
      return;
    }
    const age = ageSec(r.start_time) ?? 999999;
    const failed = r.status !== "succeeded";
    const status = !marketOpen && age > maxAgeSec ? "idle" : failed ? "red" : age >= maxAgeSec ? "red" : age >= warnAgeSec ? "yellow" : "green";
    checks.push({
      key,
      label,
      category: "cron",
      status,
      evidence: `آخر تشغيل من ${Math.round(age / 60)}د · ${r.status}${r.return_message ? " — " + r.return_message.slice(0, 60) : ""}`,
      expected: `كل ≤${Math.round(maxAgeSec / 60)}د بنجاح`,
      detail: jobname
    });
  }
  cronCheck("cron_feas", "⚙️ compute-scalp-feasibility-15m", "compute-scalp-feasibility-15m", 30 * 60, 20 * 60);
  cronCheck("cron_paper", "⚙️ paper-scalp-runner", "paper-scalp-runner", 180, 120);
  cronCheck("cron_signals", "⚙️ scalp-signal-logger", "scalp-signal-logger", 180, 120);
  cronCheck("cron_sniper", "⚙️ sniper-orb-poll", "sniper-orb-poll", 30 * 60, 20 * 60);
  checks.push({
    key: "feas_recent",
    label: "📊 تقرير الجدوى محدث",
    category: "output",
    status: !marketOpen ? "idle" : feasLastAge == null ? "red" : feasLastAge >= 3600 ? "red" : feasLastAge >= 1800 ? "yellow" : "green",
    evidence: feasLastAge == null ? "لا يوجد" : `آخر حساب من ${Math.round(feasLastAge / 60)}د · ${feasTotal} صف`,
    expected: "≤30د",
    detail: "scalp_feasibility_report.computed_at"
  });
  const l2Pct = feasTotal > 0 ? feasFilled / feasTotal * 100 : 0;
  checks.push({
    key: "feas_l2_fill",
    label: "📊 L2 موجود في تقرير الجدوى",
    category: "output",
    status: !marketOpen ? "idle" : feasTotal === 0 ? "idle" : l2Pct >= 50 ? "green" : l2Pct >= 20 ? "yellow" : "red",
    evidence: `${feasFilled}/${feasTotal} صف عنده l2_at_signal_ts (${l2Pct.toFixed(0)}%)`,
    expected: "≥50% في ساعات السوق",
    detail: "لو المصدر 2 (L2) متعطل، الرقم ده هيسقط"
  });
  checks.push({
    key: "signals_today",
    label: "🎯 إشارات النهارده",
    category: "output",
    status: !marketOpen && (signalsToday.count ?? 0) === 0 ? "idle" : (signalsToday.count ?? 0) > 0 ? "green" : "yellow",
    evidence: `${signalsToday.count ?? 0} إشارة في scalp_signal_log للنهارده`,
    expected: "≥1 إشارة في يوم تداول عادي",
    detail: "قد يكون طبيعي في السوق الهادئ"
  });
  const overall = checks.some((c) => c.status === "red") ? "red" : checks.some((c) => c.status === "yellow") ? "yellow" : !marketOpen ? "idle" : "green";
  return { now: now.toISOString(), marketOpen, marketLabel: market.label, overall, checks };
}
const Route$t = createFileRoute("/api/public/hooks/self-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$6 }),
      GET: async () => {
        const result = await runSelfTest(/* @__PURE__ */ new Date());
        return new Response(JSON.stringify({ ok: true, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS$6 }
        });
      },
      POST: async () => {
        const result = await runSelfTest(/* @__PURE__ */ new Date());
        let telegramSent = false;
        if (result.overall === "red") {
          const failing = result.checks.filter((c) => c.status === "red");
          const lines = failing.map((c) => `• <b>${escapeHtml(c.label)}</b>
  ${escapeHtml(c.evidence)}
  <i>متوقع: ${escapeHtml(c.expected)}</i>`);
          const text = `⚠️ <b>فحص التجميع الشامل — فيه مشاكل</b>

${lines.join("\n\n")}

🕐 ${(/* @__PURE__ */ new Date()).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`;
          try {
            await sendTelegram$1(text);
            telegramSent = true;
          } catch (e) {
            console.error("telegram", e);
          }
        } else if (result.overall === "yellow") {
          const failing = result.checks.filter((c) => c.status === "yellow");
          const lines = failing.map((c) => `• ${escapeHtml(c.label)}: ${escapeHtml(c.evidence)}`);
          try {
            await sendTelegram$1(`🟡 <b>فحص التجميع — بطء</b>

${lines.join("\n")}`);
            telegramSent = true;
          } catch (e) {
            console.error("telegram", e);
          }
        }
        return new Response(JSON.stringify({ ok: true, telegramSent, ...result }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS$6 }
        });
      }
    }
  }
});
const SMART_EXIT_RULES = {
  HARD_FLOOR_PCT: -0.01,
  // -1.0% (Elite Sniper 5)
  VOLUME_DEATH_AFTER_SEC: 10 * 60,
  VOLUME_LOOKBACK_SEC: 5 * 60,
  MIN_TRADES_5M: 3,
  // Increased for quality
  MIN_VOLUME_5M: 1e4,
  // Increased for Elite liquidity
  // R2 — Early illiquidity exit: if 5m volume < qty * ILLIQ_MIN_RATIO
  // continuously for ILLIQ_HOLD_SEC seconds (after GRACE), exit at market.
  ILLIQ_MIN_RATIO: 5,
  // Higher requirement for instant sell
  ILLIQ_HOLD_SEC: 120
};
let flagCache = null;
async function getSmartExitFlags() {
  if (flagCache && Date.now() - flagCache.at < 5e3) return flagCache.flags;
  const { data } = await supabaseAdmin$5.from("strategy_settings").select("key,enabled").in("key", [
    "scalp-dip-smart-exit",
    "scalp-dip-smart-exit-shadow",
    "scalp-dip-prebuy-volume-filter"
  ]);
  const map = new Map((data ?? []).map((r) => [r.key, r.enabled]));
  const flags = {
    enabled: map.get("scalp-dip-smart-exit") ?? true,
    shadow: map.get("scalp-dip-smart-exit-shadow") ?? true,
    prebuy: map.get("scalp-dip-prebuy-volume-filter") ?? true
  };
  flagCache = { at: Date.now(), flags };
  return flags;
}
async function getMarketwatchLiveness(symbol) {
  const since = new Date(Date.now() - SMART_EXIT_RULES.VOLUME_LOOKBACK_SEC * 1e3).toISOString();
  const { data } = await supabaseAdmin$5.from("marketwatch_snapshots").select("total_volume,total_trades,captured_at").eq("symbol", symbol).gte("captured_at", since).order("captured_at", { ascending: true });
  if (!data || data.length === 0) return { trades5m: 0, volume5m: 0, lastSeen: null };
  const first = data[0];
  const last = data[data.length - 1];
  const trades5m = Math.max(0, Number(last.total_trades ?? 0) - Number(first.total_trades ?? 0));
  const volume5m = Math.max(0, Number(last.total_volume ?? 0) - Number(first.total_volume ?? 0));
  return { trades5m, volume5m, lastSeen: last.captured_at };
}
async function logSmartExit(row) {
  try {
    await supabaseAdmin$5.from("smart_exit_log").insert({
      trade_date: row.trade_date,
      symbol: row.symbol,
      strategy: row.strategy ?? "scalp-dip",
      rule: row.rule,
      action: row.action,
      shadow: row.shadow,
      price: row.price ?? null,
      entry_price: row.entry_price ?? null,
      pnl_pct: row.pnl_pct ?? null,
      seconds_since_entry: row.seconds_since_entry ?? null,
      mw_trades_5m: row.mw_trades_5m ?? null,
      mw_volume_5m: row.mw_volume_5m ?? null,
      position_id: row.position_id ?? null,
      metadata: row.metadata ?? {}
    });
  } catch (e) {
    console.error("smart_exit_log insert failed", e);
  }
}
const Route$s = createFileRoute("/api/public/hooks/sell-watcher")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const created = [];
        const errors = [];
        const { data: positions, error: posErr } = await supabaseAdmin2.from("positions").select("id, symbol, entry_price, quantity, stop_loss, target_price, trailing_stop, entry_date").eq("status", "open");
        if (posErr) return json$a({ ok: false, error: posErr.message }, 500);
        if (!positions || positions.length === 0) return json$a({ ok: true, scanned: 0, created });
        for (const p of positions) {
          try {
            const { data: tick } = await supabaseAdmin2.from("live_ticks").select("price, ts").eq("symbol", p.symbol).eq("source", "thunder_ext").gte("ts", new Date(Date.now() - 2 * 6e4).toISOString()).order("ts", { ascending: false }).limit(1).maybeSingle();
            const price = Number(tick?.price);
            if (!Number.isFinite(price) || price <= 0) continue;
            const tp = Number(p.target_price) || 0;
            const sl = Math.max(Number(p.stop_loss) || 0, Number(p.trailing_stop) || 0);
            let reason = null;
            if (tp > 0 && price >= tp) reason = "target_hit";
            else if (sl > 0 && price <= sl) reason = "stop_hit";
            if (!reason) {
              const flags = await getSmartExitFlags();
              if (flags.enabled) {
                const entryPx = Number(p.entry_price);
                const entryMs = new Date(p.entry_date).getTime();
                const secSinceEntry = Math.max(0, (Date.now() - entryMs) / 1e3);
                const pnlPct = entryPx > 0 ? (price - entryPx) / entryPx : 0;
                const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
                if (pnlPct <= SMART_EXIT_RULES.HARD_FLOOR_PCT) {
                  await logSmartExit({
                    trade_date: today,
                    symbol: p.symbol,
                    rule: "HARD_FLOOR",
                    action: flags.shadow ? "would_exit" : "exit",
                    shadow: flags.shadow,
                    price,
                    entry_price: entryPx,
                    pnl_pct: pnlPct,
                    seconds_since_entry: Math.round(secSinceEntry),
                    position_id: p.id
                  });
                  if (!flags.shadow) reason = "hard_floor";
                }
                if (!reason && secSinceEntry >= SMART_EXIT_RULES.VOLUME_DEATH_AFTER_SEC) {
                  const live = await getMarketwatchLiveness(p.symbol);
                  if (live.trades5m < SMART_EXIT_RULES.MIN_TRADES_5M) {
                    await logSmartExit({
                      trade_date: today,
                      symbol: p.symbol,
                      rule: "VOLUME_DEATH",
                      action: flags.shadow ? "would_exit" : "exit",
                      shadow: flags.shadow,
                      price,
                      entry_price: entryPx,
                      pnl_pct: pnlPct,
                      seconds_since_entry: Math.round(secSinceEntry),
                      mw_trades_5m: live.trades5m,
                      mw_volume_5m: live.volume5m,
                      position_id: p.id
                    });
                    if (!flags.shadow) reason = "volume_death";
                  }
                }
              }
            }
            if (!reason) continue;
            const qty = Math.max(1, Math.floor(Number(p.quantity) || 1));
            const limitPrice = reason === "target_hit" && tp > 0 ? tp : reason === "stop_hit" && sl > 0 ? sl : price;
            if (reason === "target_hit") {
              const { data: ptRow } = await supabaseAdmin2.from("paper_trades").select("strategy").eq("symbol", p.symbol).eq("trade_date", p.entry_date).in("strategy", ["scalp-mr15", "scalp-dip"]).order("entry_ts", { ascending: false }).limit(1).maybeSingle();
              const isDip = ptRow?.strategy === "scalp-dip";
              if (!isDip) {
                const { runTargetSellL2Gate } = await import("./pre-buy-gate.server-BTW6j08Z.mjs");
                const gate = await runTargetSellL2Gate({
                  symbol: p.symbol,
                  target_price: limitPrice,
                  qty,
                  max_snapshot_age_ms: 15e3,
                  min_depth_multiplier: 1
                });
                if (!gate.ok) {
                  errors.push(`${p.symbol}: sell_l2_gate:${gate.reason}`);
                  continue;
                }
              }
            }
            const { error: insErr } = await supabaseAdmin2.from("pending_orders").insert({
              symbol: p.symbol,
              side: "sell",
              qty,
              ref_price: price,
              order_type: "limit",
              limit_price: limitPrice,
              status: "pending",
              signal_source: `sell_watcher_${reason}`,
              expires_at: new Date(Date.now() + 5 * 6e4).toISOString(),
              metadata: { position_id: p.id, reason, entry_price: Number(p.entry_price), target_price: tp || null, stop_loss: sl || null, source: "thunder_ext" }
            });
            if (insErr && !String(insErr.message).includes("duplicate key")) {
              errors.push(`${p.symbol}: ${insErr.message}`);
              continue;
            }
            await logEvent({
              trade_date: p.entry_date,
              symbol: p.symbol,
              position_id: p.id,
              event_type: "SELL_QUEUED",
              state: "SELLING",
              price: limitPrice,
              qty,
              reason,
              source: "sell-watcher",
              metadata: { entry_price: Number(p.entry_price), target_price: tp || null, stop_loss: sl || null }
            });
            created.push({ symbol: p.symbol, reason, price });
          } catch (e) {
            errors.push(`${p.symbol}: ${e.message}`);
          }
        }
        return json$a({ ok: true, scanned: positions.length, created, errors });
      }
    }
  }
});
function json$a(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
const MessageSchema = object({
  kind: literal("message"),
  role: _enum(["user", "assistant"]),
  content: string().min(1).max(2e5),
  turn_id: string().max(64).nullish()
});
const EditSchema = object({
  kind: literal("edit"),
  turn_id: string().max(64).nullish(),
  summary: string().min(1).max(2e4),
  files_changed: array(string().max(500)).max(200).default([]),
  migrations: array(string().max(2e3)).max(50).default([]),
  version: string().max(64).nullish(),
  extra: record(string(), unknown()).optional()
});
const ReadSchema = object({
  kind: literal("read"),
  turn_id: string().max(64).nullish(),
  file_path: string().min(1).max(500),
  purpose: string().max(2e3).nullish(),
  key_findings: string().max(2e4).nullish()
});
const ItemSchema = discriminatedUnion("kind", [MessageSchema, EditSchema, ReadSchema]);
const BodySchema = object({
  items: array(ItemSchema).min(1).max(250),
  client_batch_id: string().max(120).nullish(),
  source: string().max(80).nullish()
});
const CORS$5 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$9(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS$5 }
  });
}
function sha256(parts) {
  return createHash("sha256").update(parts.map((part) => part ?? "").join("|")).digest("hex");
}
async function insertDeduped(supabaseAdmin2, table, rows) {
  if (!rows.length) return { inserted: 0, duplicates: 0, error: null };
  const hashes = [...new Set(rows.map((row) => row.content_hash))];
  const { data: existingRows, error: existingError } = await supabaseAdmin2.from(table).select("content_hash").in("content_hash", hashes);
  if (existingError) return { inserted: 0, duplicates: 0, error: existingError.message };
  const existing = new Set((existingRows ?? []).map((row) => row.content_hash).filter(Boolean));
  const seen = /* @__PURE__ */ new Set();
  const uniqueRows = rows.filter((row) => {
    if (existing.has(row.content_hash) || seen.has(row.content_hash)) return false;
    seen.add(row.content_hash);
    return true;
  });
  if (!uniqueRows.length) return { inserted: 0, duplicates: rows.length, error: null };
  const { error } = await supabaseAdmin2.from(table).insert(uniqueRows);
  if (error) {
    if (error.code === "23505") return { inserted: 0, duplicates: rows.length, error: null };
    return { inserted: 0, duplicates: rows.length - uniqueRows.length, error: error.message };
  }
  return { inserted: uniqueRows.length, duplicates: rows.length - uniqueRows.length, error: null };
}
const Route$r = createFileRoute("/api/public/hooks/session-log")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$5 }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$9({ ok: false, error: "no_token" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$5 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$9({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json$9({ ok: false, error: "invalid_body", issues: parsed.error.issues.slice(0, 5) }, 400);
        }
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const turnId = parsed.data.items.find((item) => item.turn_id)?.turn_id ?? null;
        const clientBatchId = parsed.data.client_batch_id ?? request.headers.get("x-session-log-batch-id") ?? null;
        const source = parsed.data.source ?? request.headers.get("x-session-log-source") ?? "lovable-agent";
        const messages = parsed.data.items.filter((i) => i.kind === "message").map((i) => ({
          role: i.role,
          content: i.content,
          turn_id: i.turn_id ?? null,
          content_hash: sha256(["message", i.role, i.turn_id, i.content])
        }));
        const edits = parsed.data.items.filter((i) => i.kind === "edit").map((i) => ({
          turn_id: i.turn_id ?? null,
          summary: i.summary,
          files_changed: i.files_changed,
          migrations: i.migrations,
          version: i.version ?? null,
          extra: i.extra ?? {},
          content_hash: sha256(["edit", i.turn_id, i.summary, i.files_changed.join(","), i.migrations.join(","), i.version])
        }));
        const reads = parsed.data.items.filter((i) => i.kind === "read").map((i) => ({
          turn_id: i.turn_id ?? null,
          file_path: i.file_path,
          purpose: i.purpose ?? null,
          key_findings: i.key_findings ?? null,
          content_hash: sha256(["read", i.turn_id, i.file_path, i.purpose, i.key_findings])
        }));
        const messageResult = await insertDeduped(supabaseAdmin2, "session_messages", messages);
        const editResult = await insertDeduped(supabaseAdmin2, "session_edits", edits);
        const readResult = await insertDeduped(supabaseAdmin2, "session_reads", reads);
        const stageError = messageResult.error ? ["messages", messageResult.error] : editResult.error ? ["edits", editResult.error] : readResult.error ? ["reads", readResult.error] : null;
        const inserted = {
          messages: messageResult.inserted,
          edits: editResult.inserted,
          reads: readResult.inserted
        };
        const duplicateCount = messageResult.duplicates + editResult.duplicates + readResult.duplicates;
        const audit = {
          turn_id: turnId,
          client_batch_id: clientBatchId,
          source,
          items_total: parsed.data.items.length,
          messages_count: inserted.messages,
          edits_count: inserted.edits,
          reads_count: inserted.reads,
          duplicate_count: duplicateCount,
          ok: !stageError,
          error_stage: stageError?.[0] ?? null,
          error_message: stageError?.[1] ?? null
        };
        await supabaseAdmin2.from("session_ingest_audit").insert(audit);
        if (stageError) return json$9({ ok: false, stage: stageError[0], error: stageError[1], inserted, duplicateCount }, 500);
        return json$9({ ok: true, inserted, duplicateCount, clientBatchId });
      }
    }
  }
});
const Route$q = createFileRoute("/api/public/hooks/shadow-report")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const url = new URL(request.url);
        const days = Math.max(1, Math.min(30, Number(url.searchParams.get("days") ?? 7)));
        const since = new Date(Date.now() - days * 864e5).toISOString();
        const { data: logs } = await supabaseAdmin2.from("smart_exit_log").select("id,ts,symbol,rule,action,shadow,price,entry_price,pnl_pct,seconds_since_entry,mw_trades_5m,mw_volume_5m").gte("ts", since).order("ts", { ascending: false }).limit(500);
        const decisions = logs ?? [];
        const evaluated = [];
        for (const d of decisions) {
          const refPrice = Number(d.price ?? 0);
          if (!refPrice || !d.ts) {
            evaluated.push({ ...d, verdict: "no_price" });
            continue;
          }
          const t0 = new Date(d.ts).getTime();
          const t30 = new Date(t0 + 30 * 6e4).toISOString();
          const { data: ticks } = await supabaseAdmin2.from("live_ticks").select("price,ts").eq("symbol", d.symbol).gte("ts", d.ts).lte("ts", t30).order("ts", { ascending: true });
          const rows = (ticks ?? []).map((t) => ({
            p: Number(t.price),
            dt: (new Date(t.ts).getTime() - t0) / 1e3
          }));
          if (rows.length === 0) {
            evaluated.push({ ...d, verdict: "no_ticks", ticks_count: 0 });
            continue;
          }
          let minP = rows[0].p;
          let maxP = rows[0].p;
          let minPBefore15m = rows[0].p;
          let maxPBefore15m = rows[0].p;
          let p5m = null;
          let p15m = null;
          let p30m = null;
          const tpLine = refPrice * 1.02;
          const slLine = refPrice * 0.996;
          let firstHit = null;
          for (const r of rows) {
            if (r.p < minP) minP = r.p;
            if (r.p > maxP) maxP = r.p;
            if (r.dt <= 900) {
              if (r.p < minPBefore15m) minPBefore15m = r.p;
              if (r.p > maxPBefore15m) maxPBefore15m = r.p;
            }
            if (p5m == null && r.dt >= 300) p5m = r.p;
            if (p15m == null && r.dt >= 900) p15m = r.p;
            if (p30m == null && r.dt >= 1800) p30m = r.p;
            if (!firstHit) {
              if (r.p >= tpLine) {
                firstHit = "TP";
              } else if (r.p <= slLine) {
                firstHit = "SL";
              }
            }
          }
          let verdict = "neutral";
          let wouldHaveBeenPnlPct = null;
          if (d.rule === "PREBUY_VOLUME_FILTER") {
            if (firstHit === "TP") verdict = "wrong";
            else if (maxP < refPrice * 1.015) verdict = "correct";
            else verdict = "neutral";
            wouldHaveBeenPnlPct = (maxP - refPrice) / refPrice * 100;
          } else {
            const recoverPct = (maxPBefore15m - refPrice) / refPrice * 100;
            if (recoverPct >= 0.8) verdict = "wrong";
            else if (recoverPct <= 0.3) verdict = "correct";
            else verdict = "neutral";
            wouldHaveBeenPnlPct = (maxPBefore15m - refPrice) / refPrice * 100;
          }
          evaluated.push({
            ...d,
            verdict,
            ticks_count: rows.length,
            min_after: minP,
            max_after: maxP,
            max_15m: maxPBefore15m,
            min_15m: minPBefore15m,
            p_5m: p5m,
            p_15m: p15m,
            p_30m: p30m,
            recover_pct: (maxPBefore15m - refPrice) / refPrice * 100,
            would_have_pnl_pct: wouldHaveBeenPnlPct,
            first_hit: firstHit
          });
        }
        const byRule = /* @__PURE__ */ new Map();
        for (const e of evaluated) {
          const rule = String(e.rule);
          if (!byRule.has(rule)) {
            byRule.set(rule, { rule, total: 0, correct: 0, wrong: 0, neutral: 0, no_ticks: 0, shadow: 0, live: 0 });
          }
          const b = byRule.get(rule);
          b.total++;
          if (e.verdict === "correct") b.correct++;
          else if (e.verdict === "wrong") b.wrong++;
          else if (e.verdict === "neutral") b.neutral++;
          else if (e.verdict === "no_ticks" || e.verdict === "no_price") b.no_ticks++;
          if (e.shadow) b.shadow++;
          else b.live++;
        }
        const summary = [...byRule.values()].map((b) => ({
          ...b,
          accuracy_pct: b.total - b.no_ticks - b.neutral > 0 ? Math.round(b.correct / (b.total - b.no_ticks - b.neutral) * 1e3) / 10 : null
        }));
        return Response.json({
          ok: true,
          window_days: days,
          since,
          total_decisions: decisions.length,
          summary,
          decisions: evaluated
        });
      }
    }
  }
});
const Route$p = createFileRoute("/api/public/hooks/smart-exit")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString();
          const { data: recs } = await supabaseAdmin$5.from("recommendations").select("id, symbol, price_at_reco, target, stop_loss, raw_ai_response").is("outcome", null).eq("rejected_by_rules", false).gte("created_at", cutoff);
          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }
          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin$5.from("stock_snapshots").select("symbol, close, rsi14, macd_hist, ema9, atr14, vol_ratio, ts").in("symbol", symbols).order("ts", { ascending: false });
          const snapMap = /* @__PURE__ */ new Map();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (snapMap.has(sym)) continue;
            snapMap.set(sym, {
              close: Number(s.close ?? 0),
              rsi14: s.rsi14 != null ? Number(s.rsi14) : null,
              macdHist: s.macd_hist != null ? Number(s.macd_hist) : null,
              ema9: s.ema9 != null ? Number(s.ema9) : null,
              atr14: s.atr14 != null ? Number(s.atr14) : null,
              volRatio: s.vol_ratio != null ? Number(s.vol_ratio) : null
            });
          }
          const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);
          const partialAlerts = [];
          const extendAlerts = [];
          let partialCount = 0;
          let extendCount = 0;
          const MAX_EXTENSIONS = 4;
          for (const r of recs) {
            const raw = r.raw_ai_response ?? {};
            const sym = String(r.symbol);
            const snap = snapMap.get(sym);
            const entry = Number(r.price_at_reco ?? 0);
            const target = Number(r.target ?? 0);
            if (!snap || !snap.close || entry <= 0 || target <= 0) continue;
            const px = snap.close;
            const name = escapeHtml(nameMap.get(sym) || sym);
            const gainPct = (px - entry) / entry * 100;
            if (px >= target) {
              const extensions = Number(raw.target_extensions ?? 0);
              const momentumOk = (snap.rsi14 == null || snap.rsi14 < 78) && (snap.macdHist == null || snap.macdHist > 0) && (snap.ema9 == null || px > snap.ema9) && (snap.volRatio == null || snap.volRatio >= 1);
              if (momentumOk && extensions < MAX_EXTENSIONS) {
                const atr = snap.atr14 && snap.atr14 > 0 ? snap.atr14 : px * 0.02;
                const newTarget = +(target + atr).toFixed(2);
                const lockedStop = +(entry + (px - entry) * 0.5).toFixed(2);
                const prevStop = r.stop_loss != null ? Number(r.stop_loss) : 0;
                const newStop = Math.max(prevStop, lockedStop);
                await supabaseAdmin$5.from("recommendations").update({
                  target: newTarget,
                  stop_loss: newStop,
                  raw_ai_response: {
                    ...raw,
                    target_extensions: extensions + 1,
                    last_extended_at: (/* @__PURE__ */ new Date()).toISOString(),
                    extension_history: [
                      ...Array.isArray(raw.extension_history) ? raw.extension_history : [],
                      { at: (/* @__PURE__ */ new Date()).toISOString(), from: target, to: newTarget, price: px, stop: newStop }
                    ]
                  }
                }).eq("id", r.id);
                const lockedPct = (newStop - entry) / entry * 100;
                extendAlerts.push(
                  `🚀 <b>${name}</b> (${sym}) — كمّل صعود (+${gainPct.toFixed(1)}%)`
                );
                extendAlerts.push(
                  `   ↳ تارجت جديد: <b>${newTarget}</b> · ستوب لوس: <b>${newStop}</b> (ربح مضمون +${lockedPct.toFixed(1)}%)`
                );
                extendCount++;
                continue;
              }
              if (!raw.full_exit_alerted) {
                await supabaseAdmin$5.from("recommendations").update({ raw_ai_response: { ...raw, full_exit_alerted: true, full_exit_at: (/* @__PURE__ */ new Date()).toISOString() } }).eq("id", r.id);
                extendAlerts.push(
                  `🎯 <b>${name}</b> (${sym}) — وصل الهدف (+${gainPct.toFixed(1)}%) والزخم ضعف`
                );
                extendAlerts.push(`   ↳ <b>اقتراح: بيع كامل الكمية</b>`);
                extendCount++;
                continue;
              }
            }
            if (raw.partial_exit_alerted) continue;
            const progress = (px - entry) / (target - entry);
            if (progress < 0.5) continue;
            partialAlerts.push(`💰 <b>${name}</b> (${sym}) — حقق +${gainPct.toFixed(1)}% (${(progress * 100).toFixed(0)}% من الهدف)`);
            partialAlerts.push(`   ↳ <b>اقتراح: بيع نصف الكمية</b>، والباقي مع وقف متحرّك`);
            await supabaseAdmin$5.from("recommendations").update({ raw_ai_response: { ...raw, partial_exit_alerted: true, alerted_at: (/* @__PURE__ */ new Date()).toISOString() } }).eq("id", r.id);
            partialCount++;
          }
          if (extendAlerts.length > 0) {
            await sendTelegram$1(["🚀 <b>توسيع الهدف الذكي (Let Winners Run)</b>", "", ...extendAlerts].join("\n"));
          }
          if (partialAlerts.length > 0) {
            await sendTelegram$1(["🎯 <b>تنبيه جني أرباح ذكي</b>", "", ...partialAlerts].join("\n"));
          }
          return Response.json({
            ok: true,
            checked: recs.length,
            partial_alerts: partialCount,
            target_extensions: extendCount
          });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("smart-exit failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
const ALLOWED_KEYS = /* @__PURE__ */ new Set([
  "scalp-dip-smart-exit",
  "scalp-dip-smart-exit-shadow",
  "scalp-dip-prebuy-volume-filter"
]);
const Route$o = createFileRoute("/api/public/hooks/smart-exit-toggle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const body = await request.json().catch(() => ({}));
        if (!body.key || !ALLOWED_KEYS.has(body.key)) {
          return new Response(JSON.stringify({ ok: false, error: "invalid_key" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        if (typeof body.enabled !== "boolean") {
          return new Response(JSON.stringify({ ok: false, error: "invalid_enabled" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }
        const { error } = await supabaseAdmin2.from("strategy_settings").upsert({ key: body.key, enabled: body.enabled, updated_at: (/* @__PURE__ */ new Date()).toISOString() });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
          });
        }
        return Response.json({ ok: true, key: body.key, enabled: body.enabled });
      }
    }
  }
});
const mubasherScraper = {
  name: "mubasher",
  async fetchTick(symbol) {
    const url = `https://www.mubasher.info/markets/EGX/stocks/${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9,ar;q=0.8"
      }
    });
    if (!res.ok) throw new Error(`mubasher HTTP ${res.status}`);
    const html = await res.text();
    const jsonLd = html.match(/"price"\s*:\s*"?([\d.]+)"?/);
    if (jsonLd?.[1]) {
      return { symbol, price: parseFloat(jsonLd[1]), source: "mubasher", ts: (/* @__PURE__ */ new Date()).toISOString(), meta: { strategy: "jsonld" } };
    }
    const m = html.match(/(?:last[-_]?price|data-last-price)[^>]*>?\s*([\d,]+\.?\d*)/i);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "mubasher", ts: (/* @__PURE__ */ new Date()).toISOString(), meta: { strategy: "regex" } };
    }
    const snippet = html.slice(0, 8e3);
    const err = new Error("mubasher: price not found in HTML");
    err.html = snippet;
    throw err;
  }
};
let _fc = null;
function fc() {
  const k = process.env.FIRECRAWL_API_KEY;
  if (!k) throw new Error("FIRECRAWL_API_KEY missing");
  if (!_fc) _fc = new index_default({ apiKey: k });
  return _fc;
}
const investingScraper = {
  name: "investing",
  async fetchTick(symbol, _yahoo, investingSlug) {
    if (!investingSlug) throw new Error("no investing_slug");
    const url = `https://www.investing.com/equities/${investingSlug}`;
    const res = await fc().scrape(url, {
      formats: ["rawHtml"],
      onlyMainContent: false,
      waitFor: 800
    });
    const html = res.rawHtml ?? res.data?.rawHtml ?? "";
    if (!html) throw new Error("investing: empty response");
    const m = html.match(/instrument-price-last[^>]*>\s*([\d,]+\.?\d*)/i) || html.match(/"last"\s*:\s*"?([\d.]+)"?/);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "investing", ts: (/* @__PURE__ */ new Date()).toISOString(), meta: { url } };
    }
    const err = new Error("investing: price not found");
    err.html = html.slice(0, 8e3);
    throw err;
  }
};
const egxScraper = {
  name: "egx",
  async fetchTick(symbol) {
    const url = `https://www.egx.com.eg/en/stocksdata.aspx?Isin=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        Accept: "text/html"
      }
    });
    if (!res.ok) throw new Error(`egx HTTP ${res.status}`);
    const html = await res.text();
    const m = html.match(/Last[^<]*<[^>]*>\s*([\d,]+\.?\d*)/i) || html.match(/lastTrade[^>]*>\s*([\d,]+\.?\d*)/i);
    if (m?.[1]) {
      const price = parseFloat(m[1].replace(/,/g, ""));
      if (price > 0) return { symbol, price, source: "egx", ts: (/* @__PURE__ */ new Date()).toISOString() };
    }
    const err = new Error("egx: price not found");
    err.html = html.slice(0, 8e3);
    throw err;
  }
};
async function extractPriceWithAI(symbol, html) {
  if (!html) return null;
  const gateway = getAiGateway();
  try {
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      prompt: `Extract the LAST TRADED PRICE (number only, no currency, no commas) for stock symbol "${symbol}" from this HTML. If you cannot find it, respond with "NONE".

HTML:
${html.slice(0, 6e3)}

Last price:`
    });
    const m = text.match(/[\d]+\.?\d*/);
    if (!m) return null;
    const n = parseFloat(m[0]);
    return n > 0 && n < 1e5 ? n : null;
  } catch {
    return null;
  }
}
const SCRAPERS = [mubasherScraper, investingScraper, egxScraper];
async function lastTick(symbol) {
  const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol,price,volume,source,ts").eq("symbol", symbol).order("ts", { ascending: false }).limit(10);
  const rows = (data ?? []).filter((r) => Number.isFinite(+r.price) && +r.price > 0);
  if (!rows.length) return null;
  const sorted = [...rows.map((r) => +r.price)].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const within5 = (p) => Math.abs(p - median) / median <= 0.05;
  const clean = rows.find((r) => within5(+r.price)) ?? rows[0];
  return { symbol: clean.symbol, price: +clean.price, volume: clean.volume, source: clean.source, ts: clean.ts };
}
function isPlausible(price, last) {
  if (!(price > 0 && price < 1e5)) return false;
  if (!last) return true;
  const diff = Math.abs(price - last.price) / last.price;
  return diff < 0.2;
}
async function fetchLiveTick(symbol, yahooSymbol, investingSlug, preferredIdx) {
  const last = await lastTick(symbol);
  const order = [
    SCRAPERS[preferredIdx % SCRAPERS.length],
    ...SCRAPERS.filter((_, i) => i !== preferredIdx % SCRAPERS.length)
  ];
  for (const scraper of order) {
    try {
      const tick = await scraper.fetchTick(symbol, yahooSymbol, investingSlug);
      if (!isPlausible(tick.price, last)) {
        continue;
      }
      await supabaseAdmin$5.from("live_ticks").insert({
        symbol,
        price: tick.price,
        volume: tick.volume ?? null,
        source: tick.source,
        ts: tick.ts,
        meta: tick.meta ?? null
      });
      return tick;
    } catch (e) {
      const html = e.html;
      if (html) {
        const aiPrice = await extractPriceWithAI(symbol, html);
        if (aiPrice && isPlausible(aiPrice, last)) {
          const tick = {
            symbol,
            price: aiPrice,
            source: "ai-fallback",
            ts: (/* @__PURE__ */ new Date()).toISOString(),
            meta: { recovered_from: scraper.name }
          };
          await supabaseAdmin$5.from("live_ticks").insert({
            symbol,
            price: tick.price,
            source: tick.source,
            ts: tick.ts,
            meta: tick.meta
          });
          return tick;
        }
      }
    }
  }
  return null;
}
async function getTicksBetween(symbol, fromIso, toIso) {
  const { data } = await supabaseAdmin$5.from("live_ticks").select("symbol,price,volume,source,ts").eq("symbol", symbol).gte("ts", fromIso).lte("ts", toIso).order("ts", { ascending: true });
  return (data ?? []).map((r) => ({
    symbol: r.symbol,
    price: +r.price,
    volume: r.volume,
    source: r.source,
    ts: r.ts
  }));
}
function cairoTodayAt(h, m) {
  const c = getCairoNow();
  c.setUTCHours(h, m, 0, 0);
  const realNow = /* @__PURE__ */ new Date();
  const fakeNow = getCairoNow(realNow);
  const offsetMs = fakeNow.getTime() - realNow.getTime();
  return new Date(c.getTime() - offsetMs).toISOString();
}
async function decideORB(symbol) {
  const from = cairoTodayAt(10, 0);
  const to = cairoTodayAt(10, 30);
  const ticks = await getTicksBetween(symbol, from, to);
  if (ticks.length < 2) {
    return {
      decision: "SKIP",
      positionPct: 0,
      confidence: 0,
      orbHigh: null,
      orbLow: null,
      currentPrice: null,
      rangePct: null,
      reason: "بيانات غير كافية في نافذة ORB"
    };
  }
  const prices = ticks.map((t) => t.price);
  const orbHigh = Math.max(...prices);
  const orbLow = Math.min(...prices);
  const current = prices[prices.length - 1];
  const rangePct = (orbHigh - orbLow) / orbLow * 100;
  const { data: pick } = await supabaseAdmin$5.from("sniper_picks").select("prev_close").eq("symbol", symbol).order("pick_date", { ascending: false }).limit(1);
  const prevClose = pick?.[0]?.prev_close ? +pick[0].prev_close : orbLow;
  const movePct = (current - prevClose) / prevClose * 100;
  if (movePct >= 1 && current >= orbHigh * 0.999) {
    return {
      decision: "BUY",
      positionPct: 70,
      confidence: Math.min(95, 70 + movePct * 3),
      orbHigh,
      orbLow,
      currentPrice: current,
      rangePct,
      reason: `breakout +${movePct.toFixed(2)}% فوق opening range`
    };
  }
  if (movePct <= -1) {
    return {
      decision: "SKIP",
      positionPct: 0,
      confidence: Math.min(95, 70 + Math.abs(movePct) * 3),
      orbHigh,
      orbLow,
      currentPrice: current,
      rangePct,
      reason: `هبوط ${movePct.toFixed(2)}% → الإشارة ضعيفة`
    };
  }
  return {
    decision: "BUY_LIGHT",
    positionPct: 30,
    confidence: 55,
    orbHigh,
    orbLow,
    currentPrice: current,
    rangePct,
    reason: `حركة هادئة (${movePct.toFixed(2)}%) — دخول مخفّض`
  };
}
async function getATR(symbol, entry) {
  const { data } = await supabaseAdmin$5.from("daily_candles").select("high,low,close").eq("symbol", symbol).order("date", { ascending: false }).limit(15);
  if (!data || data.length < 2) return entry * 0.02;
  const rows = data.slice().reverse();
  let sum = 0, n = 0;
  for (let i = 1; i < rows.length; i++) {
    const h = +rows[i].high, l = +rows[i].low, pc = +rows[i - 1].close;
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
    n++;
  }
  return n ? sum / n : entry * 0.02;
}
const Route$n = createFileRoute("/api/public/hooks/sniper-decide")({
  server: {
    handlers: {
      POST: async () => {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const { data: pick } = await supabaseAdmin$5.from("sniper_picks").select("*").eq("pick_date", today).maybeSingle();
        if (!pick) return Response.json({ ok: false, reason: "no pick" });
        const orb = await decideORB(pick.symbol);
        const entry = orb.currentPrice ?? (pick.entry_price ? +pick.entry_price : 0);
        if (!entry) return Response.json({ ok: false, reason: "no entry price available" });
        const atr = await getATR(pick.symbol, entry);
        const trailingPlan = {
          initial_stop: +(entry - 1.5 * atr).toFixed(2),
          activation_price: +(entry + 1 * atr).toFixed(2),
          trail_atr_mult: 2,
          step_pct: +(atr / entry * 100).toFixed(2),
          atr: +atr.toFixed(3),
          description_ar: `وقف ابتدائي عند ${(entry - 1.5 * atr).toFixed(2)}. بعد ${(entry + 1 * atr).toFixed(2)} يبدأ التحريك خلف القمة بمسافة ${(2 * atr).toFixed(2)}.`
        };
        await supabaseAdmin$5.from("sniper_picks").update({
          orb_high: orb.orbHigh,
          orb_low: orb.orbLow,
          orb_decision: orb.decision,
          orb_confidence: orb.confidence,
          position_pct: orb.positionPct,
          entry_price: entry,
          target_price: entry * 1.04,
          stop_price: trailingPlan.initial_stop,
          trailing_plan: trailingPlan,
          status: orb.decision === "SKIP" ? "skipped" : "active",
          notified_at: (/* @__PURE__ */ new Date()).toISOString()
        }).eq("id", pick.id);
        const tgKey = process.env.TELEGRAM_API_KEY;
        const tgChat = process.env.TELEGRAM_CHAT_ID;
        if (tgKey && tgChat) {
          const emoji = orb.decision === "BUY" ? "🟢" : orb.decision === "BUY_LIGHT" ? "🟡" : "🔴";
          const msg = `${emoji} *Sniper ${orb.decision}*
سهم: *${pick.symbol}* (${pick.name_ar ?? ""})
سعر: ${entry.toFixed(2)} ج.م
ORB: ${orb.orbLow?.toFixed(2)}-${orb.orbHigh?.toFixed(2)}
نسبة الدخول: ${orb.positionPct}%
ثقة: ${orb.confidence.toFixed(0)}%
${orb.reason}

🛡️ ${trailingPlan.description_ar}`;
          await fetch(`https://api.telegram.org/bot${tgKey}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: tgChat, text: msg, parse_mode: "Markdown" })
          }).catch(() => null);
        }
        return Response.json({ ok: true, orb });
      }
    }
  }
});
function sma(a, e, n) {
  if (e + 1 < n) return null;
  let s = 0;
  for (let i = e - n + 1; i <= e; i++) s += a[i].c;
  return s / n;
}
function avgV(a, e, n) {
  if (e + 1 < n) return null;
  let s = 0;
  for (let i = e - n + 1; i <= e; i++) s += a[i].v;
  return s / n;
}
function rsi(a, e, n = 14) {
  if (e < n) return null;
  let g = 0, l = 0;
  for (let i = e - n + 1; i <= e; i++) {
    const d = a[i].c - a[i - 1].c;
    if (d > 0) g += d;
    else l -= d;
  }
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / n / (l / n));
}
async function computeTodayPick() {
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol,name_ar,yahoo_symbol,investing_slug").eq("is_sharia", true).eq("is_active", true);
  if (!stocks?.length) return null;
  const symbols = stocks.map((s) => s.symbol);
  const rows = [];
  for (let f = 0; ; f += 1e3) {
    const { data } = await supabaseAdmin$5.from("daily_candles").select("symbol,date,open,high,low,close,volume").in("symbol", symbols).order("date", { ascending: false }).range(f, f + 999);
    if (!data?.length) break;
    rows.push(...data.map((r) => ({
      symbol: r.symbol,
      date: r.date.slice(0, 10),
      open: +r.open,
      high: +r.high,
      low: +r.low,
      close: +r.close,
      volume: +r.volume
    })));
    if (data.length < 1e3) break;
    if (rows.length > 2e5) break;
  }
  const bySym = /* @__PURE__ */ new Map();
  for (const r of rows) {
    const a = bySym.get(r.symbol) ?? [];
    a.push({ date: r.date, o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume });
    bySym.set(r.symbol, a);
  }
  for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));
  const cands = [];
  for (const s of stocks) {
    const a = bySym.get(s.symbol);
    if (!a || a.length < 60) continue;
    const i = a.length - 1;
    const today = a[i], yest = a[i - 1];
    const av20 = avgV(a, i, 20);
    if (!av20 || av20 < 5e3) continue;
    if (today.c < 1 || today.c > 500) continue;
    if (today.v === 0 || yest.v === 0) continue;
    const m20 = sma(a, i, 20), m50 = sma(a, i, 50);
    if (!m20 || !m50) continue;
    const av3 = avgV(a, i, 3);
    const volR = today.v / av20;
    const cp = today.h > today.l ? (today.c - today.l) / (today.h - today.l) : 0;
    const mom5 = today.c / a[i - 5].c - 1;
    const vt = av3 / av20;
    const dayPct = today.c / yest.c - 1;
    if (dayPct > 0.12) continue;
    const r = rsi(a, i, 14);
    let confidence = 0;
    const reasons = [];
    const negatives = [];
    if (volR >= 5) {
      confidence += 25;
      reasons.push(`🔥 حجم استثنائي ${volR.toFixed(1)}x المتوسط`);
    } else if (volR >= 3) {
      confidence += 18;
      reasons.push(`📊 حجم قوي ${volR.toFixed(1)}x المتوسط`);
    } else if (volR >= 2) {
      confidence += 10;
      reasons.push(`حجم فوق المتوسط ${volR.toFixed(1)}x`);
    } else if (volR >= 1) {
      confidence += 4;
      negatives.push(`⚠️ حجم تداول عادي (${volR.toFixed(1)}x المتوسط فقط)`);
    } else {
      negatives.push(`⚠️ حجم تداول منخفض جداً (${volR.toFixed(2)}x)`);
    }
    if (mom5 >= 0.06) {
      confidence += 20;
      reasons.push(`🚀 زخم قوي +${(mom5 * 100).toFixed(1)}% في 5 أيام`);
    } else if (mom5 >= 0.04) {
      confidence += 15;
      reasons.push(`📈 زخم جيد +${(mom5 * 100).toFixed(1)}% في 5 أيام`);
    } else if (mom5 >= 0.02) {
      confidence += 8;
      reasons.push(`زخم خفيف +${(mom5 * 100).toFixed(1)}%`);
    } else if (mom5 >= 0) {
      confidence += 3;
      negatives.push(`⚠️ زخم ضعيف (${(mom5 * 100).toFixed(1)}% في 5 أيام)`);
    } else {
      negatives.push(`❌ السهم نازل ${(mom5 * 100).toFixed(1)}% في آخر 5 أيام`);
    }
    if (cp >= 0.9) {
      confidence += 15;
      reasons.push(`✅ إغلاق عند القمة (${(cp * 100).toFixed(0)}% من المدى)`);
    } else if (cp >= 0.7) {
      confidence += 10;
      reasons.push(`إغلاق قوي قرب القمة`);
    } else if (cp >= 0.5) {
      confidence += 5;
    } else {
      negatives.push(`⚠️ إغلاق بعيد عن القمة (في ${(cp * 100).toFixed(0)}% من مدى اليوم فقط)`);
    }
    if (today.c > m20) {
      confidence += 10;
      reasons.push(`فوق متوسط 20 يوم`);
    } else {
      negatives.push(`❌ السعر تحت متوسط 20 يوم`);
    }
    if (today.c > m50) {
      confidence += 10;
      reasons.push(`فوق متوسط 50 يوم (اتجاه صاعد)`);
    } else {
      negatives.push(`❌ السعر تحت متوسط 50 يوم (الاتجاه الكبير هابط)`);
    }
    if (vt >= 2) {
      confidence += 10;
      reasons.push(`📊 الحجم بيتصاعد (${vt.toFixed(1)}x)`);
    } else if (vt >= 1.5) {
      confidence += 7;
    } else if (vt >= 1) {
      confidence += 4;
    } else {
      negatives.push(`⚠️ الحجم بيقل في آخر 3 أيام`);
    }
    if (r != null) {
      if (r >= 50 && r <= 70) {
        confidence += 10;
        reasons.push(`RSI متوازن (${r.toFixed(0)})`);
      } else if (r > 70 && r <= 78) {
        confidence += 5;
        negatives.push(`⚠️ RSI مرتفع (${r.toFixed(0)}) - قرب التشبع`);
      } else if (r > 78) {
        negatives.push(`🚨 تشبع شرائي خطير (RSI=${r.toFixed(0)})`);
      } else if (r >= 40) {
        confidence += 5;
      } else {
        negatives.push(`⚠️ RSI ضعيف (${r.toFixed(0)})`);
      }
    }
    if (dayPct > 0.08) negatives.push(`⚠️ ارتفاع كبير أمس (+${(dayPct * 100).toFixed(1)}%) - مخاطر تصحيح`);
    const score = volR + vt + mom5 * 10 + cp * 3 + (today.c > m50 ? 1 : 0) - (r != null && r > 78 ? 5 : 0);
    cands.push({
      stock: s,
      score,
      confidence: Math.max(0, Math.min(100, Math.round(confidence))),
      reasons,
      negatives,
      prevClose: today.c
    });
  }
  cands.sort((a, b) => b.confidence - a.confidence || b.score - a.score);
  let top = null;
  let newsReasons = [];
  let newsNegatives = [];
  let newsBonus = 0;
  for (const c of cands.slice(0, 5)) {
    const news = await getNewsSentiment(c.stock.symbol, c.stock.name_ar);
    if (news.blocked) {
      continue;
    }
    if (news.score >= 0.5) {
      newsBonus = 5;
      newsReasons = [`📰 خبر إيجابي مؤكد (${news.count} مصدر) — ثقة +5`];
    } else if (news.score >= 0.2) {
      newsReasons = [`📰 ${news.count} خبر إيجابي خفيف`];
    } else if (news.count > 0) {
      newsNegatives = [`📰 ${news.count} خبر محايد`];
    }
    top = c;
    break;
  }
  if (!top) top = cands[0];
  if (!top) return null;
  return {
    symbol: top.stock.symbol,
    name_ar: top.stock.name_ar,
    investing_slug: top.stock.investing_slug,
    yahoo_symbol: top.stock.yahoo_symbol,
    prev_close: top.prevClose,
    score: top.score,
    reasons: [...newsReasons, ...top.reasons],
    confidence: Math.min(100, top.confidence + newsBonus),
    negative_reasons: [...newsNegatives, ...top.negatives]
  };
}
function cairoDateString$1() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
const Route$m = createFileRoute("/api/public/hooks/sniper-pick")({
  server: {
    handlers: {
      POST: async () => {
        const today = cairoDateString$1();
        const pick = await computeTodayPick();
        if (!pick) {
          return Response.json({ ok: true, pick: null, reason: "no candidate passed STACK filter" });
        }
        const entry = pick.prev_close;
        const target = +(entry * 1.04).toFixed(2);
        const stop = +(entry * 0.98).toFixed(2);
        await supabaseAdmin$5.from("sniper_picks").upsert({
          pick_date: today,
          symbol: pick.symbol,
          name_ar: pick.name_ar,
          v3_score: pick.score,
          reasons: pick.reasons,
          confidence: pick.confidence,
          negative_reasons: pick.negative_reasons,
          prev_close: pick.prev_close,
          entry_price: entry,
          target_price: target,
          stop_price: stop,
          status: "pending"
        }, { onConflict: "pick_date" });
        const { data: existingDaily } = await supabaseAdmin$5.from("daily_picks").select("id,symbol").eq("pick_date", today).maybeSingle();
        if (!existingDaily) {
          await supabaseAdmin$5.from("daily_picks").insert({
            pick_date: today,
            symbol: pick.symbol,
            name_ar: pick.name_ar,
            entry_price: entry,
            target_price: target,
            stop_price: stop,
            target_pct: 4,
            stop_pct: 2,
            max_hold_days: 5,
            confidence: pick.confidence,
            kelly_pct: 0,
            score: pick.score,
            reasons: [...pick.reasons, ...pick.negative_reasons],
            status: "open"
          });
        }
        await notifyNewPick({
          pick_date: today,
          symbol: pick.symbol,
          name_ar: pick.name_ar,
          entry,
          target,
          stop,
          confidence: pick.confidence,
          reasons: [...pick.reasons, ...pick.negative_reasons],
          source: "today"
        }).catch((e) => console.error("[sniper-pick] notify failed", e));
        return Response.json({ ok: true, pick });
      }
    }
  }
});
const Route$l = createFileRoute("/api/public/hooks/sniper-poll")({
  server: {
    handlers: {
      POST: async () => {
        const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
        const { data: pick } = await supabaseAdmin$5.from("sniper_picks").select("symbol").eq("pick_date", today).maybeSingle();
        if (!pick) return Response.json({ ok: false, reason: "no pick for today" });
        const { data: stock } = await supabaseAdmin$5.from("stocks").select("symbol,yahoo_symbol,investing_slug").eq("symbol", pick.symbol).maybeSingle();
        if (!stock) return Response.json({ ok: false, reason: "stock not found" });
        const idx = Math.floor(Date.now() / 1e3 / 10) % 3;
        const tick = await fetchLiveTick(stock.symbol, stock.yahoo_symbol, stock.investing_slug, idx);
        return Response.json({ ok: !!tick, tick });
      }
    }
  }
});
function applyConfidenceDecay(originalConfidence, createdAt, now = /* @__PURE__ */ new Date()) {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt;
  const ageMs = now.getTime() - created.getTime();
  const ageDays = Math.max(0, Math.floor(ageMs / 864e5));
  if (ageDays <= 2) return { decayed: originalConfidence, ageDays, decayApplied: 0 };
  const days = ageDays - 2;
  const decayApplied = Math.min(originalConfidence - 30, days * 5);
  return {
    decayed: Math.max(30, originalConfidence - decayApplied),
    ageDays,
    decayApplied
  };
}
const Route$k = createFileRoute("/api/public/hooks/stale-position-alert")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
          const { data: recs } = await supabaseAdmin$5.from("recommendations").select("id, symbol, confidence, price_at_reco, created_at, raw_ai_response").is("outcome", null).eq("rejected_by_rules", false).gte("created_at", cutoff);
          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }
          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin$5.from("stock_snapshots").select("symbol, close").in("symbol", symbols).order("snapshot_date", { ascending: false });
          const priceMap = /* @__PURE__ */ new Map();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (!priceMap.has(sym)) priceMap.set(sym, Number(s.close ?? 0));
          }
          const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);
          const lines = [];
          let count = 0;
          for (const r of recs) {
            const raw = r.raw_ai_response ?? {};
            if (raw.stale_alerted) continue;
            const decay = applyConfidenceDecay(Number(r.confidence ?? 70), String(r.created_at));
            if (decay.ageDays < 5) continue;
            const px = priceMap.get(String(r.symbol));
            const entry = Number(r.price_at_reco ?? 0);
            if (!px || entry <= 0) continue;
            const movePct = (px - entry) / entry * 100;
            if (Math.abs(movePct) >= 2) continue;
            const name = escapeHtml(nameMap.get(String(r.symbol)) || r.symbol);
            lines.push(`⚠️ <b>${name}</b> (${r.symbol}) — ${decay.ageDays} يوم بدون حركة (${movePct.toFixed(1)}%)`);
            lines.push(`   ↳ الثقة هبطت لـ ${decay.decayed}%. <b>اقتراح: اخرج وحرّر رأس المال</b>`);
            await supabaseAdmin$5.from("recommendations").update({ raw_ai_response: { ...raw, stale_alerted: true, stale_at: (/* @__PURE__ */ new Date()).toISOString() } }).eq("id", r.id);
            count++;
          }
          if (lines.length > 0) {
            await sendTelegram$1(["💤 <b>صفقات راكدة — انسحاب مقترح</b>", "", ...lines].join("\n"));
          }
          return Response.json({ ok: true, alerts: count, checked: recs.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("stale-position-alert failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
const CORS$4 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400"
};
function json$8(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS$4 }
  });
}
function normalize(sym) {
  return sym.trim().toUpperCase().replace(/\.(CA|EG|EGX)$/i, "");
}
const Route$j = createFileRoute("/api/public/hooks/strategy-advice")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$4 }),
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const rawSymbol = url.searchParams.get("symbol");
        if (!rawSymbol) return json$8({ ok: false, error: "missing_symbol" }, 400);
        const symbol = normalize(rawSymbol);
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const [recoRes, tickRes, sniperRes, scalpRes] = await Promise.all([
          supabaseAdmin2.from("recommendations").select(
            "symbol,signal,confidence,entry_min,entry_max,target,stop_loss,price_at_reco,rr_ratio,position_size_pct,timeframe_days,reasons_ar,created_at"
          ).eq("symbol", symbol).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("live_ticks").select("price,source,ts").eq("symbol", symbol).eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("sniper_picks").select("symbol,entry_price,target_price,stop_price,status,v3_score,created_at").eq("symbol", symbol).order("created_at", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("paper_trades").select("symbol,strategy,entry_price,tp_price,sl_price,entry_ts,status").eq("symbol", symbol).in("strategy", ["scalp-mr15-fresh", "scalp-mr15"]).order("entry_ts", { ascending: false }).limit(1).maybeSingle()
        ]);
        const reco = recoRes.data;
        const tick = tickRes.data;
        const sniper = sniperRes.data;
        const scalp = scalpRes.data;
        let plan = null;
        const scalpFresh = scalp && scalp.status === "open";
        if (scalpFresh) {
          const e = Number(scalp.entry_price);
          plan = {
            source: "scalp",
            signal: "buy",
            confidence: null,
            buyMin: e,
            buyMax: e,
            target: Number(scalp.tp_price),
            stop: Number(scalp.sl_price),
            createdAt: scalp.entry_ts
          };
        } else if (reco) {
          plan = {
            source: "reco",
            signal: reco.signal,
            confidence: reco.confidence ?? null,
            buyMin: reco.entry_min != null ? Number(reco.entry_min) : null,
            buyMax: reco.entry_max != null ? Number(reco.entry_max) : null,
            target: reco.target != null ? Number(reco.target) : null,
            stop: reco.stop_loss != null ? Number(reco.stop_loss) : null,
            createdAt: reco.created_at
          };
        } else if (sniper) {
          const e = sniper.entry_price != null ? Number(sniper.entry_price) : null;
          plan = {
            source: "sniper",
            signal: "buy",
            confidence: sniper.v3_score != null ? Math.round(Number(sniper.v3_score)) : null,
            buyMin: e,
            buyMax: e,
            target: sniper.target_price != null ? Number(sniper.target_price) : null,
            stop: sniper.stop_price != null ? Number(sniper.stop_price) : null,
            createdAt: sniper.created_at
          };
        }
        const live = tick ? { price: Number(tick.price), source: tick.source, ts: tick.ts, ageSec: Math.round((Date.now() - new Date(tick.ts).getTime()) / 1e3) } : null;
        let verdict = "no_plan";
        let verdictAr = "لا توجد توصية بعد لهذا السهم";
        let upsidePct = null;
        let downsidePct = null;
        if (!plan) {
          verdict = "no_plan";
          verdictAr = "لا توجد توصية بعد لهذا السهم — استنى الاستراتيجية تحلله";
        } else if (!live) {
          verdict = "no_price";
          verdictAr = "مفيش سعر لحظي للسهم ده";
        } else {
          const p = live.price;
          if (plan.target) upsidePct = (plan.target - p) / p * 100;
          if (plan.stop) downsidePct = (p - plan.stop) / p * 100;
          if (plan.stop && p <= plan.stop) {
            verdict = "stop_zone";
            verdictAr = `⛔ السعر ${p} وصل/تحت وقف الخسارة ${plan.stop} — متشتريش`;
          } else if (plan.signal === "sell") {
            verdict = "expensive";
            verdictAr = `⚠️ الاستراتيجية بتقول بيع — متشتريش دلوقتي`;
          } else if (plan.buyMax != null && p > plan.buyMax * 1.005) {
            verdict = "expensive";
            verdictAr = `⚠️ السعر ${p} أعلى من منطقة الشراء (${plan.buyMin}–${plan.buyMax}) — هتشتري غالي`;
          } else if (plan.buyMin != null && plan.buyMax != null && p >= plan.buyMin * 0.995 && p <= plan.buyMax * 1.005) {
            verdict = "safe";
            verdictAr = `✅ السعر ${p} داخل منطقة الشراء (${plan.buyMin}–${plan.buyMax})`;
          } else if (plan.buyMin != null && p < plan.buyMin * 0.995) {
            verdict = "safe";
            verdictAr = `✅ السعر ${p} أقل من منطقة الشراء — فرصة كويسة`;
          } else {
            verdict = plan.signal === "buy" ? "safe" : "expensive";
            verdictAr = plan.signal === "buy" ? `✅ توصية شراء عند ~${p}` : `⚠️ الاستراتيجية مش بتنصح بالشراء دلوقتي`;
          }
        }
        return json$8({
          ok: true,
          symbol,
          live,
          plan,
          verdict,
          verdictAr,
          upsidePct,
          downsidePct,
          fetchedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    }
  }
});
const Route$i = createFileRoute("/api/public/hooks/target-stop-detector")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { data: positions } = await supabaseAdmin$5.from("positions").select("id, symbol, entry_price, current_price, target_price, stop_loss, status").eq("status", "open");
          const rows = positions ?? [];
          const targetHits = [];
          const stopHits = [];
          for (const p of rows) {
            const px = p.current_price;
            if (px == null) continue;
            if (p.target_price && Number(px) >= Number(p.target_price)) {
              const pct2 = (Number(px) - Number(p.entry_price)) / Number(p.entry_price) * 100;
              targetHits.push(`🎯 <b>${escapeHtml(p.symbol)}</b> وصل/تجاوز الهدف (${Number(p.target_price).toFixed(2)}) — سعر ${Number(px).toFixed(2)} (+${pct2.toFixed(2)}%)`);
            } else if (p.stop_loss && Number(px) <= Number(p.stop_loss)) {
              const pct2 = (Number(px) - Number(p.entry_price)) / Number(p.entry_price) * 100;
              stopHits.push(`🛑 <b>${escapeHtml(p.symbol)}</b> لمس وقف الخسارة (${Number(p.stop_loss).toFixed(2)}) — سعر ${Number(px).toFixed(2)} (${pct2.toFixed(2)}%)`);
            }
          }
          if (!targetHits.length && !stopHits.length) {
            return Response.json({ ok: true, hits: 0, checked: rows.length });
          }
          const lines = [];
          lines.push("⚡ <b>تنبيه وصول الهدف / وقف الخسارة</b>");
          if (targetHits.length) {
            lines.push("");
            lines.push(...targetHits);
          }
          if (stopHits.length) {
            lines.push("");
            lines.push(...stopHits);
          }
          const tg = await sendTelegram$1(lines.join("\n"));
          return Response.json({ ok: true, targets: targetHits.length, stops: stopHits.length, telegram: tg });
        } catch (e) {
          console.error("[target-stop-detector] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
function isIgnoredAuthEvent(event) {
  const kind = String(event.kind || "");
  const url = typeof event.url === "string" ? event.url : "";
  const extras = event.extras && typeof event.extras === "object" ? event.extras : {};
  try {
    const parsed = new URL(url);
    const isThunderX2fa = parsed.hostname === "x.thndr.app" && /^\/auth\/2fa(?:\/|$)/.test(parsed.pathname);
    return isThunderX2fa && kind === "login_page" && String(extras.reason || "") === "url";
  } catch {
    return false;
  }
}
const Route$h = createFileRoute("/api/public/hooks/thunder-auth-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const kind = String(body?.kind || "login_required").slice(0, 40);
          const url = body?.url ? String(body.url).slice(0, 500) : null;
          const message = body?.message ? String(body.message).slice(0, 500) : null;
          const client_id = body?.client_id ? String(body.client_id).slice(0, 120) : null;
          const extras = body?.extras ?? null;
          if (isIgnoredAuthEvent({ kind, url, extras })) {
            return Response.json({ ok: true, ignored: true });
          }
          const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
          const { error } = await supabaseAdmin2.from("thunder_auth_events").insert({ kind, url, message, client_id, extras });
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ ok: false, error: e.message }, { status: 500 });
        }
      },
      GET: async () => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const since = new Date(Date.now() - 10 * 6e4).toISOString();
        const { data } = await supabaseAdmin2.from("thunder_auth_events").select("ts, kind, url, message, client_id, extras").gte("ts", since).order("ts", { ascending: false }).limit(20);
        const recent = (data ?? []).filter((event) => !isIgnoredAuthEvent(event));
        const latest = recent[0] ?? null;
        const ageSec = latest ? Math.round((Date.now() - new Date(latest.ts).getTime()) / 1e3) : null;
        return Response.json({ ok: true, latest, age_seconds: ageSec, recent });
      }
    }
  }
});
const CORS$3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function cairoMinutes(d) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[wd] ?? 0, minutes: h * 60 + m };
}
const Route$g = createFileRoute("/api/public/hooks/thunder-health")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$3 }),
      GET: async () => {
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const now = /* @__PURE__ */ new Date();
        const since5m = new Date(now.getTime() - 5 * 6e4).toISOString();
        const [latestThunder, latestAny, recent] = await Promise.all([
          supabaseAdmin2.from("live_ticks").select("ts, symbol").eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("live_ticks").select("ts, source").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin2.from("live_ticks").select("symbol, source").gte("ts", since5m)
        ]);
        const thunderTs = latestThunder.data?.ts ?? null;
        const anyTs = latestAny.data?.ts ?? null;
        const thunderAgo = thunderTs ? Math.round((now.getTime() - new Date(thunderTs).getTime()) / 1e3) : null;
        const anyAgo = anyTs ? Math.round((now.getTime() - new Date(anyTs).getTime()) / 1e3) : null;
        const rows = recent.data ?? [];
        const thunderRows = rows.filter((r) => r.source === "thunder_ext");
        const thunderSymbols5m = new Set(thunderRows.map((r) => r.symbol)).size;
        const thunderTicks5m = thunderRows.length;
        const cairo = cairoMinutes(now);
        const isWeekday = cairo.day >= 0 && cairo.day <= 4;
        const marketOpen = isWeekday && cairo.minutes >= 600 && cairo.minutes < 870;
        let status = "ok";
        let message = "متصل بثاندر — البيانات لحظية";
        if (!marketOpen) {
          status = "closed";
          message = "السوق مغلق — لا توجد بيانات لحظية متوقعة";
        } else if (thunderAgo == null || thunderAgo > 600) {
          status = "critical";
          message = "انقطع الاتصال بثاندر — افتح صفحة web.thndr.app وتأكد إن الاكستنشن متصل";
        } else if (thunderAgo > 180) {
          status = "warn";
          message = `آخر تحديث من ثاندر منذ ${thunderAgo} ثانية — تحقق من الاكستنشن`;
        }
        return new Response(
          JSON.stringify({
            ok: true,
            status,
            message,
            marketOpen,
            thunder: { lastTickTs: thunderTs, lastTickAgoSec: thunderAgo, ticks5m: thunderTicks5m, symbols5m: thunderSymbols5m },
            any: { lastTickTs: anyTs, lastTickAgoSec: anyAgo, source: latestAny.data?.source ?? null },
            now: now.toISOString()
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...CORS$3 } }
        );
      }
    }
  }
});
const Num$1 = preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return v;
}, number().finite().nullable().optional());
const AssetSchema = object({
  symbol: string().trim().min(1).max(32),
  asset_id: string().nullish(),
  ref_price: Num$1,
  last_price: Num$1,
  avg_change_prc: Num$1,
  total_volume: Num$1,
  total_trades: Num$1,
  total_value: Num$1,
  total_bids: Num$1,
  total_asks: Num$1,
  total_buy: Num$1,
  total_sell: Num$1,
  high_price_limit: Num$1,
  low_price_limit: Num$1,
  avg_5_day: Num$1,
  avg_30_day: Num$1,
  avg_90_day: Num$1,
  is_same_day: boolean().nullish(),
  highest_bid: Num$1,
  lowest_ask: Num$1,
  highest_bid_qty: Num$1,
  lowest_ask_qty: Num$1,
  high_price: Num$1,
  low_price: Num$1,
  last_trade_volume: Num$1,
  last_change_prc: Num$1,
  symbol_state: string().nullish(),
  trade_rec_serial: Num$1,
  last_trade_date: string().nullish(),
  open_price: Num$1,
  previous_close: Num$1,
  close_price: Num$1,
  high_52_week: Num$1,
  low_52_week: Num$1,
  listed_shares: Num$1,
  avg_180_day: Num$1,
  raw: any().optional()
});
const CORS$2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$7(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS$2 }
  });
}
function normalizeNumber(v) {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n2 = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n2) ? n2 : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function rawObject(a) {
  return a.raw && typeof a.raw === "object" && !Array.isArray(a.raw) ? a.raw : null;
}
function firstRawNumber(a, keys) {
  const raw = rawObject(a);
  if (!raw) return null;
  for (const key of keys) {
    const n = normalizeNumber(raw[key]);
    if (n != null) return n;
  }
  return null;
}
function firstRawString(a, keys) {
  const raw = rawObject(a);
  if (!raw) return null;
  for (const key of keys) {
    const value = raw[key];
    if (value != null && String(value).trim()) return String(value);
  }
  return null;
}
function numWithRawFallback(value, a, keys) {
  return value ?? firstRawNumber(a, keys);
}
let lastWatchlistDerivedAt = 0;
async function deriveWatchlistSnapshot(rows) {
  const now = Date.now();
  if (now - lastWatchlistDerivedAt < 60 * 60 * 1e3) return;
  lastWatchlistDerivedAt = now;
  try {
    const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
    const { data: last } = await supabaseAdmin2.from("thunder_watchlist_snapshots").select("ts").order("ts", { ascending: false }).limit(1).maybeSingle();
    const lastTs = last?.ts;
    if (lastTs && now - new Date(lastTs).getTime() < 60 * 60 * 1e3) return;
    const seen = /* @__PURE__ */ new Set();
    const wl = rows.filter((r) => {
      const s = String(r.symbol ?? "");
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    }).map((r) => ({
      symbol: String(r.symbol),
      uuid: r.asset_id ?? null,
      previous_close: r.previous_close ?? null,
      min_price_limit: r.low_price_limit ?? null,
      max_price_limit: r.high_price_limit ?? null,
      feed_price: r.last_price ?? null,
      source: "thunder_x_marketwatch"
    }));
    if (wl.length) await supabaseAdmin2.from("thunder_watchlist_snapshots").insert(wl);
  } catch {
  }
}
async function runCompression() {
  try {
    const { cleanupMarketwatchSnapshots } = await import("./marketwatch-cleanup.server-BGBECtu9.mjs");
    await cleanupMarketwatchSnapshots();
  } catch (e) {
    console.error("marketwatch compression call failed", e);
  }
}
const Route$f = createFileRoute("/api/public/hooks/thunder-marketwatch")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$2 }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$7({ ok: false, error: "ingest_token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$2 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$7({ ok: false, error: "invalid_json" }, 400);
        }
        const body = raw;
        const assets = Array.isArray(body?.assets) ? body.assets : null;
        if (!assets || assets.length < 1 || assets.length > 500) {
          return json$7({ ok: false, error: "invalid_body" }, 400);
        }
        const capturedAt = (() => {
          if (typeof body.captured_at === "string") {
            const d = new Date(body.captured_at);
            if (Number.isFinite(d.getTime())) return d.toISOString();
          }
          return (/* @__PURE__ */ new Date()).toISOString();
        })();
        const validated = [];
        let invalid = 0;
        for (const a of assets) {
          const v = AssetSchema.safeParse(a);
          if (v.success) validated.push(v.data);
          else invalid++;
        }
        if (validated.length === 0) return json$7({ ok: false, error: "all_invalid", invalid }, 400);
        const toInt = (v) => v == null || !Number.isFinite(v) ? null : Math.round(v);
        const rows = validated.map((a) => ({
          captured_at: capturedAt,
          symbol: a.symbol.toUpperCase(),
          asset_id: a.asset_id ?? null,
          ref_price: numWithRawFallback(a.ref_price, a, ["ref_price", "refPrice", "reference_price", "referencePrice"]),
          last_price: numWithRawFallback(a.last_price, a, ["last_trade_price", "lastTradePrice", "last_price", "lastPrice", "price", "ltp"]),
          avg_change_prc: numWithRawFallback(a.avg_change_prc, a, ["avg_change_prc", "avgChangePrc", "avg_change", "change_percent", "changePercent"]),
          total_volume: toInt(numWithRawFallback(a.total_volume, a, ["total_volume", "totalVolume", "volume", "traded_volume", "tradedVolume", "cumVolume"])),
          total_trades: toInt(numWithRawFallback(a.total_trades, a, ["total_trades", "totalTrades", "trades", "trade_count", "tradeCount"])),
          total_value: numWithRawFallback(a.total_value, a, ["total_value", "totalValue", "value", "traded_value", "tradedValue"]),
          total_bids: toInt(numWithRawFallback(a.total_bids, a, ["total_bids", "totalBids"])),
          total_asks: toInt(numWithRawFallback(a.total_asks, a, ["total_asks", "totalAsks"])),
          total_buy: toInt(numWithRawFallback(a.total_buy, a, ["total_buy", "totalBuy"])),
          total_sell: toInt(numWithRawFallback(a.total_sell, a, ["total_sell", "totalSell"])),
          high_price_limit: numWithRawFallback(a.high_price_limit, a, ["high_price_limit", "highPriceLimit", "max_limit", "maxLimit"]),
          low_price_limit: numWithRawFallback(a.low_price_limit, a, ["low_price_limit", "lowPriceLimit", "min_limit", "minLimit"]),
          avg_5_day: numWithRawFallback(a.avg_5_day, a, ["avg_5_day", "avg5Day"]),
          avg_30_day: numWithRawFallback(a.avg_30_day, a, ["avg_30_day", "avg30Day"]),
          avg_90_day: numWithRawFallback(a.avg_90_day, a, ["avg_90_day", "avg90Day"]),
          is_same_day: a.is_same_day ?? null,
          highest_bid: numWithRawFallback(a.highest_bid, a, ["highest_bid", "highestBid", "best_bid", "bestBid", "bid_price", "bidPrice", "bid"]),
          lowest_ask: numWithRawFallback(a.lowest_ask, a, ["lowest_ask", "lowestAsk", "best_ask", "bestAsk", "ask_price", "askPrice", "ask", "offer_price", "offerPrice"]),
          highest_bid_qty: toInt(numWithRawFallback(a.highest_bid_qty, a, ["highest_bid_qty", "highestBidQty", "bid_qty", "bidQty", "bid_size", "bidSize", "bid_volume", "bidVolume"])),
          lowest_ask_qty: toInt(numWithRawFallback(a.lowest_ask_qty, a, ["lowest_ask_qty", "lowestAskQty", "ask_qty", "askQty", "ask_size", "askSize", "offer_qty", "offerQty", "ask_volume", "askVolume"])),
          high_price: numWithRawFallback(a.high_price, a, ["high_price", "highPrice", "day_high", "dayHigh"]),
          low_price: numWithRawFallback(a.low_price, a, ["low_price", "lowPrice", "day_low", "dayLow"]),
          last_trade_volume: numWithRawFallback(a.last_trade_volume, a, ["last_trade_volume", "lastTradeVolume"]),
          last_change_prc: numWithRawFallback(a.last_change_prc, a, ["last_change_prc", "lastChangePrc", "last_change", "change_prc", "changePrc"]),
          symbol_state: a.symbol_state ?? firstRawString(a, ["symbol_state", "symbolState"]),
          trade_rec_serial: toInt(numWithRawFallback(a.trade_rec_serial, a, ["trade_rec_serial", "tradeRecSerial", "symbols_rec_serial", "symbolsRecSerial"])),
          last_trade_date: (() => {
            const value = a.last_trade_date ?? firstRawString(a, ["last_trade_date", "lastTradeDate"]);
            if (!value) return null;
            const d = new Date(value);
            return Number.isFinite(d.getTime()) ? d.toISOString() : null;
          })(),
          open_price: numWithRawFallback(a.open_price, a, ["open_price", "openPrice"]),
          previous_close: numWithRawFallback(a.previous_close, a, ["previous_close", "previousClose", "prev_close", "prevClose"]),
          close_price: numWithRawFallback(a.close_price, a, ["close_price", "closePrice"]),
          high_52_week: numWithRawFallback(a.high_52_week, a, ["high_52_week", "high52Week", "week_52_high", "yearHigh"]),
          low_52_week: numWithRawFallback(a.low_52_week, a, ["low_52_week", "low52Week", "week_52_low", "yearLow"]),
          listed_shares: numWithRawFallback(a.listed_shares, a, ["listed_shares", "listedShares", "outstanding_shares", "outstandingShares"]),
          avg_180_day: numWithRawFallback(a.avg_180_day, a, ["avg_180_day", "avg180Day"]),
          raw: a.raw ?? null
        }));
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const DEDUP_KEYS = [
          "last_price",
          "total_volume",
          "total_trades",
          "highest_bid",
          "lowest_ask"
        ];
        function sameNumericValue(a, b) {
          if (a == null || b == null) return false;
          const na = Number(a);
          const nb = Number(b);
          if (!Number.isFinite(na) || !Number.isFinite(nb)) return false;
          return na === nb;
        }
        const incomingBySymbol = /* @__PURE__ */ new Map();
        for (const r of rows) {
          incomingBySymbol.set(r.symbol, r);
        }
        const dedupedIncoming = Array.from(incomingBySymbol.values());
        const symbols = Array.from(incomingBySymbol.keys());
        const lastRowsBySymbol = /* @__PURE__ */ new Map();
        if (symbols.length > 0) {
          const { data: rpcRows, error: rpcErr } = await supabaseAdmin2.rpc(
            "dedup_latest_for_symbols",
            { p_symbols: symbols }
          );
          if (rpcErr) {
            console.error("[thunder-marketwatch] dedup RPC failed, skipping dedup:", rpcErr.message);
          } else if (Array.isArray(rpcRows)) {
            for (const r of rpcRows) {
              lastRowsBySymbol.set(r.symbol, {
                last_price: r.last_price,
                total_volume: r.total_volume,
                total_trades: r.total_trades,
                highest_bid: r.highest_bid,
                lowest_ask: r.lowest_ask
              });
            }
          }
        }
        const skipped = [];
        const uniqueRows = [];
        for (const r of dedupedIncoming) {
          const sym = r.symbol;
          const prev = lastRowsBySymbol.get(sym);
          if (prev && DEDUP_KEYS.every(
            (k) => sameNumericValue(r[k], prev[k])
          )) {
            skipped.push(sym);
            continue;
          }
          uniqueRows.push(r);
        }
        if (skipped.length > 0) {
          console.log(
            `[thunder-marketwatch] dedup skipped ${skipped.length}/${dedupedIncoming.length} unchanged assets: ${[...new Set(skipped)].slice(0, 5).join(", ")}${skipped.length > 5 ? " ..." : ""}`
          );
        }
        const { error } = uniqueRows.length > 0 ? await supabaseAdmin2.from("marketwatch_snapshots").insert(uniqueRows) : { error: null };
        if (error) return json$7({ ok: false, error: error.message }, 500);
        if (uniqueRows.length > 0) {
          await deriveWatchlistSnapshot(uniqueRows);
        }
        if (Math.random() < 1e-3) {
          void runCompression();
        }
        return json$7({ ok: true, inserted: uniqueRows.length, skipped: skipped.length, invalid, captured_at: capturedAt });
      }
    }
  }
});
const CORS_HEADERS$3 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$6(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS$3 }
  });
}
function authOK$1(request) {
  const expected = process.env.THUNDER_INGEST_TOKEN ?? "";
  const provided = request.headers.get("x-thunder-token") ?? "";
  return expected.length > 0 && provided.length === expected.length && provided === expected;
}
const UpdateSchema = object({
  id: string().uuid(),
  status: _enum(["opened", "prepared", "confirmed", "error", "cancelled", "review_clicked"]),
  error_message: string().max(500).optional(),
  signal_to_review_ms: number().int().nonnegative().max(24 * 3600 * 1e3).optional()
});
const Route$e = createFileRoute("/api/public/hooks/thunder-orders")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS$3 }),
      GET: async ({ request }) => {
        if (!authOK$1(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$3 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        await supabaseAdmin2.from("pending_orders").update({ status: "expired" }).in("status", ["pending", "opened"]).lt("expires_at", (/* @__PURE__ */ new Date()).toISOString());
        const { data, error } = await supabaseAdmin2.from("pending_orders").select("id, symbol, side, qty, ref_price, order_type, limit_price, status, signal_source, created_at, expires_at, metadata").in("status", ["pending", "opened", "prepared"]).order("created_at", { ascending: true }).limit(20);
        if (error) return json$6({ ok: false, error: error.message }, 500);
        const orders = data ?? [];
        const symbols = Array.from(new Set(orders.map((o) => String(o.symbol || "").toUpperCase()).filter(Boolean)));
        const uuidBySymbol = /* @__PURE__ */ new Map();
        if (symbols.length) {
          const { data: ticks } = await supabaseAdmin2.from("live_ticks").select("symbol, ts, meta").in("symbol", symbols).eq("source", "thunder_ext").order("ts", { ascending: false }).limit(Math.max(200, symbols.length * 20));
          for (const t of ticks ?? []) {
            const sym = String(t.symbol || "").toUpperCase();
            const uuid = String(t.meta?.uuid ?? "").trim();
            if (sym && uuid && !uuidBySymbol.has(sym)) uuidBySymbol.set(sym, uuid);
          }
        }
        return json$6({ ok: true, orders: orders.map((o) => ({ ...o, uuid: uuidBySymbol.get(String(o.symbol || "").toUpperCase()) ?? null })) });
      },
      POST: async ({ request }) => {
        if (!authOK$1(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$3 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$6({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = UpdateSchema.safeParse(raw);
        if (!parsed.success) return json$6({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);
        const { id, status, error_message, signal_to_review_ms } = parsed.data;
        const nowIso = (/* @__PURE__ */ new Date()).toISOString();
        if (status === "review_clicked" || typeof signal_to_review_ms === "number") {
          const { data: row } = await supabaseAdmin2.from("pending_orders").select("metadata").eq("id", id).maybeSingle();
          const meta = { ...row?.metadata ?? {} };
          if (typeof signal_to_review_ms === "number") {
            meta.signal_to_review_ms = signal_to_review_ms;
            meta.review_clicked_at = nowIso;
          }
          const { error: mErr } = await supabaseAdmin2.from("pending_orders").update({ metadata: meta }).eq("id", id);
          if (mErr) return json$6({ ok: false, error: mErr.message }, 500);
          if (status === "review_clicked") {
            try {
              const { data: po } = await supabaseAdmin2.from("pending_orders").select("symbol, signal_source, trade_date, side").eq("id", id).maybeSingle();
              if (po) {
                await logEvent({
                  trade_date: po.trade_date ?? void 0,
                  symbol: String(po.symbol),
                  strategy: String(po.signal_source || ""),
                  pending_order_id: id,
                  event_type: "REVIEW_CLICKED",
                  state: po.side === "buy" ? "BUYING" : "SELLING",
                  source: "thunder-orders",
                  metadata: { signal_to_review_ms }
                });
              }
            } catch (e) {
              console.error("[ledger] review_clicked log failed:", e.message);
            }
            return json$6({ ok: true, recorded: true });
          }
        }
        const patch = status === "prepared" ? { status, prepared_at: nowIso, error_message: error_message ?? null } : status === "confirmed" ? { status, confirmed_at: nowIso, error_message: error_message ?? null } : { status, error_message: error_message ?? null };
        const { error } = await supabaseAdmin2.from("pending_orders").update(patch).eq("id", id);
        if (error) return json$6({ ok: false, error: error.message }, 500);
        try {
          const { data: po } = await supabaseAdmin2.from("pending_orders").select("symbol, side, ref_price, qty, signal_source, trade_date, metadata").eq("id", id).maybeSingle();
          if (po) {
            const map = {
              opened: { et: "ORDER_OPENED", st: po.side === "buy" ? "BUYING" : "SELLING" },
              prepared: { et: "ORDER_PREPARED", st: po.side === "buy" ? "BUYING" : "SELLING" },
              confirmed: { et: "ORDER_CONFIRMED", st: po.side === "buy" ? "BUYING" : "SELLING" },
              error: { et: "ERROR", st: "ERROR" },
              cancelled: { et: "CANCELLED", st: "CANCELLED" }
            };
            const m = map[status];
            if (m) {
              await logEvent({
                trade_date: po.trade_date ?? void 0,
                symbol: String(po.symbol),
                strategy: String(po.signal_source || ""),
                pending_order_id: id,
                event_type: m.et,
                state: m.st,
                price: Number(po.ref_price) || null,
                qty: Number(po.qty) || null,
                reason: error_message ?? null,
                source: "thunder-orders",
                metadata: { side: po.side, po_metadata: po.metadata }
              });
            }
          }
        } catch (e) {
          console.error("[ledger] thunder-orders log failed:", e.message);
        }
        return json$6({ ok: true });
      }
    }
  }
});
const CORS_HEADERS$2 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$5(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS$2 }
  });
}
function authOK(request) {
  const expected = process.env.THUNDER_INGEST_TOKEN ?? "";
  const provided = request.headers.get("x-thunder-token") ?? "";
  return expected.length > 0 && provided.length === expected.length && provided === expected;
}
const SellRequestSchema = object({
  action: literal("sell").optional(),
  position_id: string().uuid(),
  reason: _enum(["target_hit", "stop_hit", "drift_exit", "manual", "eod_force"]),
  ref_price: number().positive().optional()
});
const RegisterManualSchema = object({
  action: literal("register_manual"),
  symbol: string().min(1).max(16),
  qty: number().positive().max(1e6),
  entry_price: number().positive(),
  side: literal("buy").optional()
});
const RegisterBuyFillSchema = object({
  action: literal("register_buy_fill"),
  symbol: string().min(1).max(16),
  qty: number().positive().max(1e6),
  entry_price: number().positive(),
  source: string().max(64).optional()
});
const PostBodySchema = union([RegisterBuyFillSchema, RegisterManualSchema, SellRequestSchema]);
const Route$d = createFileRoute("/api/public/hooks/thunder-positions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS$2 }),
      GET: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$2 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { data, error } = await supabaseAdmin2.from("positions").select("id, symbol, quantity, entry_price, stop_loss, target_price, trailing_stop").eq("status", "open");
        if (error) return json$5({ ok: false, error: error.message }, 500);
        const rawPositions = data ?? [];
        const rawSymbols = Array.from(new Set(rawPositions.map((p) => String(p.symbol || "").toUpperCase()).filter(Boolean)));
        const { data: knownStocks } = rawSymbols.length ? await supabaseAdmin2.from("stocks").select("symbol").in("symbol", rawSymbols) : { data: [] };
        const knownSet = new Set((knownStocks ?? []).map((s) => String(s.symbol).toUpperCase()));
        const positions = rawPositions.filter((p) => knownSet.has(String(p.symbol || "").toUpperCase()));
        const symbols = Array.from(new Set(positions.map((p) => String(p.symbol || "").toUpperCase()).filter(Boolean)));
        const priceBySymbol = /* @__PURE__ */ new Map();
        if (symbols.length) {
          const { data: ticks } = await supabaseAdmin2.from("live_ticks").select("symbol, price, ts").in("symbol", symbols).eq("source", "thunder_ext").gte("ts", new Date(Date.now() - 10 * 6e4).toISOString()).order("ts", { ascending: false }).limit(Math.max(50, symbols.length * 8));
          for (const tick of ticks ?? []) {
            const sym = String(tick.symbol || "").toUpperCase();
            if (!priceBySymbol.has(sym)) priceBySymbol.set(sym, Number(tick.price) || 0);
          }
        }
        return json$5({
          ok: true,
          positions: positions.map((p) => ({ ...p, current_price: priceBySymbol.get(String(p.symbol || "").toUpperCase()) || null }))
        });
      },
      POST: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$2 });
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$5({ ok: false, error: "invalid_json" }, 400);
        }
        const parsed = PostBodySchema.safeParse(raw);
        if (!parsed.success) return json$5({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);
        const body = parsed.data;
        if (body.action === "register_manual") {
          return json$5({ ok: false, error: "auto_position_registration_disabled" }, 410);
        }
        if (body.action === "register_buy_fill") {
          const symbol = body.symbol.trim().toUpperCase();
          const qty2 = Math.max(1, Math.floor(Number(body.qty)));
          const entryPrice = Number(body.entry_price);
          const today = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" })).toISOString().slice(0, 10);
          const { data: stockRow } = await supabaseAdmin2.from("stocks").select("symbol").eq("symbol", symbol).maybeSingle();
          if (!stockRow) return json$5({ ok: false, reason: "symbol_not_whitelisted", symbol }, 200);
          const { data: existing } = await supabaseAdmin2.from("positions").select("id, entry_price, quantity").eq("symbol", symbol).eq("status", "open").eq("entry_date", today).maybeSingle();
          if (existing) {
            return json$5({ ok: true, already_open: true, position_id: existing.id, symbol });
          }
          const { data: pt, error: ptErr } = await supabaseAdmin2.from("paper_trades").select("id, entry_price, tp_price, sl_price, strategy, status").eq("symbol", symbol).eq("trade_date", today).eq("status", "open").in("strategy", ["scalp-mr15", "scalp-dip"]).order("entry_ts", { ascending: false }).limit(1).maybeSingle();
          if (ptErr) return json$5({ ok: false, error: ptErr.message }, 500);
          if (!pt) {
            return json$5({ ok: false, reason: "no_matching_paper_trade", symbol }, 200);
          }
          const ptEntry = Number(pt.entry_price) || 0;
          if (ptEntry > 0) {
            const drift = Math.abs(entryPrice - ptEntry) / ptEntry;
            if (drift > 0.15) {
              return json$5({ ok: false, reason: "fill_price_out_of_band", drift_pct: Number((drift * 100).toFixed(2)), entry_price: entryPrice, paper_trade_entry: ptEntry }, 200);
            }
          }
          const tpPct = ptEntry > 0 ? Number(pt.tp_price) / ptEntry - 1 : null;
          const slPct = ptEntry > 0 ? Number(pt.sl_price) / ptEntry - 1 : null;
          const target = tpPct != null ? Number((entryPrice * (1 + tpPct)).toFixed(4)) : Number(pt.tp_price);
          const stop = slPct != null ? Number((entryPrice * (1 + slPct)).toFixed(4)) : Number(pt.sl_price);
          const { data: inserted, error: insErr2 } = await supabaseAdmin2.from("positions").insert({
            symbol,
            quantity: qty2,
            entry_price: entryPrice,
            entry_date: today,
            target_price: target,
            stop_loss: stop,
            max_hold_days: 1,
            // scalp = same-session exit
            status: "open",
            notes: `auto:thunder_fill paper_trade=${pt.id} src=${body.source || "ext"}`
          }).select("id").maybeSingle();
          if (insErr2) {
            if (String(insErr2.message).includes("uniq_positions_open_symbol_entry_date") || String(insErr2.message).includes("duplicate key")) {
              return json$5({ ok: true, already_open: true, symbol });
            }
            return json$5({ ok: false, error: insErr2.message }, 500);
          }
          await logEvent({
            trade_date: today,
            symbol,
            strategy: pt.strategy ?? null,
            paper_trade_id: pt.id,
            position_id: inserted?.id ?? null,
            event_type: "BUY_FILLED",
            state: "HOLDING",
            price: entryPrice,
            qty: qty2,
            source: body.source || "extension",
            metadata: { target_price: target, stop_loss: stop }
          });
          return json$5({
            ok: true,
            created: true,
            position_id: inserted?.id,
            symbol,
            qty: qty2,
            entry_price: entryPrice,
            target_price: target,
            stop_loss: stop,
            paper_trade_id: pt.id
          });
        }
        const { position_id, reason, ref_price } = body;
        const { data: pos, error: posErr } = await supabaseAdmin2.from("positions").select("id, symbol, quantity, entry_price, target_price, stop_loss, status, entry_date").eq("id", position_id).maybeSingle();
        if (posErr) return json$5({ ok: false, error: posErr.message }, 500);
        if (!pos || pos.status !== "open") return json$5({ ok: false, error: "position_not_open" }, 404);
        const qty = Math.max(1, Math.floor(Number(pos.quantity) || 1));
        const targetPrice = Number(pos.target_price) || 0;
        const stopPrice = Number(pos.stop_loss) || 0;
        const sellLimitPrice = reason === "target_hit" && targetPrice > 0 ? targetPrice : reason === "eod_force" ? ref_price ?? null : ref_price ?? (stopPrice > 0 ? stopPrice : null);
        if (reason === "target_hit" && sellLimitPrice != null) {
          const { data: ptRow } = await supabaseAdmin2.from("paper_trades").select("strategy").eq("symbol", pos.symbol).eq("trade_date", pos.entry_date).in("strategy", ["scalp-mr15", "scalp-dip"]).order("entry_ts", { ascending: false }).limit(1).maybeSingle();
          const isDip = ptRow?.strategy === "scalp-dip";
          if (!isDip) {
            const { runTargetSellL2Gate } = await import("./pre-buy-gate.server-BTW6j08Z.mjs");
            const gate = await runTargetSellL2Gate({
              symbol: pos.symbol,
              target_price: sellLimitPrice,
              qty,
              max_snapshot_age_ms: 15e3,
              min_depth_multiplier: 1
            });
            if (!gate.ok) {
              return json$5({
                ok: false,
                reason: "sell_l2_gate_rejected",
                detail: gate.reason,
                symbol: pos.symbol,
                qty,
                target_price: sellLimitPrice,
                bid_sum_at_target: gate.bid_sum_at_target,
                snapshot_age_ms: gate.snapshot_age_ms
              }, 200);
            }
          }
        }
        const { error: insErr } = await supabaseAdmin2.from("pending_orders").insert({
          symbol: pos.symbol,
          side: "sell",
          qty,
          ref_price: ref_price ?? sellLimitPrice,
          order_type: "limit",
          limit_price: sellLimitPrice,
          status: "pending",
          signal_source: `ext_sell_${reason}`,
          expires_at: new Date(Date.now() + 5 * 6e4).toISOString(),
          metadata: { position_id: pos.id, reason, entry_price: Number(pos.entry_price), target_price: targetPrice || null, stop_loss: stopPrice || null, source: "extension_local_watcher" }
        });
        if (insErr && !String(insErr.message).includes("duplicate key")) {
          return json$5({ ok: false, error: insErr.message }, 500);
        }
        await logEvent({
          trade_date: pos.entry_date,
          symbol: pos.symbol,
          position_id: pos.id,
          event_type: "SELL_REQUESTED",
          state: "SELLING",
          price: Number(sellLimitPrice) || null,
          qty,
          reason,
          source: "thunder-positions",
          metadata: { entry_price: Number(pos.entry_price), target_price: targetPrice || null, stop_loss: stopPrice || null }
        });
        return json$5({ ok: true, queued: true, symbol: pos.symbol, qty, reason });
      }
    }
  }
});
const NumberLike$1 = preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, number().finite());
const QuoteSchema = object({
  symbol: string().trim().min(1).max(32).regex(/^[A-Z0-9.\-_]+$/i).optional().nullable(),
  uuid: string().trim().min(1).max(64).optional().nullable(),
  bid: NumberLike$1.refine((v) => v >= 0 && v < 1e5, "bid_out_of_range").nullable().optional(),
  ask: NumberLike$1.refine((v) => v >= 0 && v < 1e5, "ask_out_of_range").nullable().optional(),
  ts: union([string(), number()]).optional(),
  // Optional provenance tag: 'firebase' (legacy wire format), 'rest' (new REST
  // endpoint capture), or any future tag. Short string to keep payload small.
  // Validated loosely so unknown tags from older extension builds still pass.
  source: string().trim().min(1).max(32).optional().nullable()
});
const CORS_HEADERS$1 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$4(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS$1 }
  });
}
function normalizeTimestamp$1(value, fallback) {
  if (value == null || value === "") return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}
function extractQuotes(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  const body = raw;
  if (Array.isArray(body.quotes)) return body.quotes;
  if (body.quote) return [body.quote];
  return null;
}
const Route$c = createFileRoute("/api/public/hooks/thunder-quotes")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS$1 }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$4({ ok: false, error: "ingest_token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS$1 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$4({ ok: false, error: "invalid_json" }, 400);
        }
        const quotes = extractQuotes(raw);
        if (!quotes || quotes.length < 1 || quotes.length > 1e3) {
          return json$4({ ok: false, error: "invalid_body", reason: "expected quotes array with 1-1000 items" }, 400);
        }
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const rows = [];
        let invalid = 0;
        for (const q of quotes) {
          const v = QuoteSchema.safeParse(q);
          if (!v.success) {
            invalid++;
            continue;
          }
          const d = v.data;
          const symbol = (d.symbol || "").toUpperCase().trim();
          if (!symbol) {
            invalid++;
            continue;
          }
          const bid = d.bid ?? null;
          const ask = d.ask ?? null;
          if (bid == null && ask == null) {
            invalid++;
            continue;
          }
          const spread = bid != null && ask != null && ask > 0 && bid > 0 ? Number((ask - bid).toFixed(4)) : null;
          const src = typeof d.source === "string" ? d.source.replace(/[^\x20-\x7e]/g, "").slice(0, 32) || null : null;
          rows.push({
            symbol,
            uuid: d.uuid ?? null,
            bid,
            ask,
            spread,
            ts: normalizeTimestamp$1(d.ts, now),
            source: src
          });
        }
        if (rows.length === 0) {
          return json$4({ ok: true, inserted: 0, invalid });
        }
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error } = await supabaseAdmin2.from("live_quotes").insert(rows);
        if (error) {
          return json$4({ ok: false, error: "db_insert_failed", detail: error.message.slice(0, 200) }, 500);
        }
        return json$4({ ok: true, inserted: rows.length, invalid });
      }
    }
  }
});
const Num = preprocess((v) => {
  if (v === "" || v == null) return null;
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return v;
}, number().finite().nullable().optional());
const TradeSchema = object({
  cursor: union([number(), string()]),
  side: string().nullish(),
  price: Num,
  volume: Num,
  value: Num,
  time: string().nullish()
});
const CORS$1 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$3(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS$1 }
  });
}
const symbolCache = /* @__PURE__ */ new Map();
async function resolveSymbol(assetId) {
  const cached2 = symbolCache.get(assetId);
  if (cached2) return cached2;
  try {
    const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
    const { data } = await supabaseAdmin2.from("marketwatch_snapshots").select("symbol").eq("asset_id", assetId).order("captured_at", { ascending: false }).limit(1).maybeSingle();
    const sym = data?.symbol;
    if (sym) {
      symbolCache.set(assetId, sym.toUpperCase());
      return sym.toUpperCase();
    }
  } catch {
  }
  return null;
}
const Route$b = createFileRoute("/api/public/hooks/thunder-tape")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$1 }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json$3({ ok: false, error: "ingest_token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS$1 });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$3({ ok: false, error: "invalid_json" }, 400);
        }
        const body = raw;
        const assetId = typeof body.asset_id === "string" ? body.asset_id.trim() : "";
        if (!assetId || assetId.length > 64) return json$3({ ok: false, error: "missing_asset_id" }, 400);
        let symbol = typeof body.symbol === "string" && body.symbol.trim().length > 0 && body.symbol.length <= 32 ? body.symbol.trim().toUpperCase() : null;
        if (!symbol) symbol = await resolveSymbol(assetId);
        const trades = Array.isArray(body.trades) ? body.trades : null;
        if (!trades || trades.length < 1 || trades.length > 500) {
          return json$3({ ok: false, error: "invalid_trades" }, 400);
        }
        const capturedAt = (() => {
          if (typeof body.captured_at === "string") {
            const d = new Date(body.captured_at);
            if (Number.isFinite(d.getTime())) return d.toISOString();
          }
          return (/* @__PURE__ */ new Date()).toISOString();
        })();
        const rows = [];
        let invalid = 0;
        for (const t of trades) {
          const v = TradeSchema.safeParse(t);
          if (!v.success) {
            invalid++;
            continue;
          }
          const cursorNum = typeof v.data.cursor === "string" ? Number(v.data.cursor) : v.data.cursor;
          if (!Number.isFinite(cursorNum)) {
            invalid++;
            continue;
          }
          const side = typeof v.data.side === "string" ? v.data.side.toUpperCase() : null;
          const tradeTime = (() => {
            if (!v.data.time) return null;
            const d = new Date(v.data.time);
            return Number.isFinite(d.getTime()) ? d.toISOString() : null;
          })();
          rows.push({
            captured_at: capturedAt,
            asset_id: assetId,
            symbol,
            cursor: Math.round(cursorNum),
            trade_time: tradeTime,
            side: side === "BUY" || side === "SELL" ? side : side,
            price: v.data.price ?? null,
            volume: v.data.volume ?? null,
            value: v.data.value ?? null,
            raw: t
          });
        }
        if (rows.length === 0) return json$3({ ok: false, error: "all_invalid", invalid }, 400);
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error, count } = await supabaseAdmin2.from("thunder_tape").upsert(rows, { onConflict: "asset_id,cursor", ignoreDuplicates: true, count: "exact" });
        if (error) return json$3({ ok: false, error: error.message }, 500);
        return json$3({
          ok: true,
          received: rows.length,
          inserted: count ?? null,
          invalid,
          captured_at: capturedAt
        });
      }
    }
  }
});
const NumberLike = preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, number().finite());
const TickSchema = object({
  symbol: string().trim().min(1).max(32).regex(/^[A-Z0-9.\-_]+$/i),
  price: NumberLike.refine((value) => value > 0 && value < 1e5, "price_out_of_range"),
  volume: preprocess(
    (value) => value === "" || value == null ? null : value,
    NumberLike.refine((value) => value >= 0 && value < 1e12, "volume_out_of_range").nullable().optional()
  ),
  ts: union([string(), number()]).optional(),
  uuid: string().nullish()
});
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
function json$2(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS }
  });
}
function extractTicks(raw) {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  const body = raw;
  if (Array.isArray(body.ticks)) return body.ticks;
  if (Array.isArray(body.data?.ticks)) {
    return body.data.ticks;
  }
  if (body.tick) return [body.tick];
  if ("symbol" in body && "price" in body) return [body];
  return null;
}
function normalizeTimestamp(value, fallback) {
  if (value == null || value === "") return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}
function toIntegerOrNull(value) {
  return value == null || !Number.isFinite(value) ? null : Math.round(value);
}
const Route$a = createFileRoute("/api/public/hooks/thunder-ticks")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) {
          return json$2({ ok: false, error: "ingest_token_not_configured" }, 500);
        }
        const provided = request.headers.get("x-thunder-token") ?? "";
        let authorized = await isThunderAuthorized(provided, expected);
        if (!authorized) {
          try {
            const { supabaseAdmin: admin } = await import("./client.server-D5ro3rAQ.mjs");
            const { data } = await admin.from("ingest_tokens").select("token").eq("token", provided).limit(1);
            if (data && data.length > 0) authorized = true;
          } catch {
          }
        }
        if (!authorized) {
          try {
            if (provided.length >= 16 && provided.length <= 200) {
              const { supabaseAdmin: admin } = await import("./client.server-D5ro3rAQ.mjs");
              await admin.from("ingest_diag").upsert({ token: provided, last_seen: (/* @__PURE__ */ new Date()).toISOString() }, { onConflict: "token" });
            }
          } catch {
          }
          return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return json$2({ ok: false, error: "invalid_json" }, 400);
        }
        const ticks = extractTicks(raw);
        if (!ticks || ticks.length < 1 || ticks.length > 500) {
          return json$2({ ok: false, error: "invalid_body", reason: "expected ticks array with 1-500 items" }, 400);
        }
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const now = (/* @__PURE__ */ new Date()).toISOString();
        const validated = [];
        let invalid = 0;
        for (const t of ticks) {
          const v = TickSchema.safeParse(t);
          if (v.success) validated.push(v.data);
          else invalid++;
        }
        if (validated.length === 0) {
          return json$2({ ok: false, error: "all_ticks_invalid", invalid, received: ticks.length }, 400);
        }
        const rows = validated.map((t) => ({
          symbol: t.symbol.toUpperCase(),
          price: t.price,
          volume: toIntegerOrNull(t.volume),
          source: "thunder_ext",
          ts: normalizeTimestamp(t.ts, now),
          meta: t.uuid ? { uuid: t.uuid } : null
        }));
        const uniqueSymbols = Array.from(new Set(rows.map((r) => r.symbol)));
        const { data: known } = await supabaseAdmin2.from("stocks").select("symbol").in("symbol", uniqueSymbols);
        new Set((known ?? []).map((s) => s.symbol));
        const insertable = rows;
        const skipped = 0;
        const { error } = await supabaseAdmin2.from("live_ticks").insert(insertable);
        if (error) {
          return json$2({ ok: false, error: error.message }, 500);
        }
        try {
          const archiveRows = insertable.map((r) => ({
            symbol: r.symbol,
            ts: r.ts,
            price: r.price,
            volume: r.volume
          }));
          await supabaseAdmin2.from("thunder_tick_archive").upsert(archiveRows, { onConflict: "symbol,ts", ignoreDuplicates: true });
        } catch {
        }
        return json$2({ ok: true, inserted: insertable.length, skipped, invalid });
      }
    }
  }
});
const N = preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, number().finite()).nullable().optional();
const Item = object({
  symbol: string().trim().min(1).max(32),
  uuid: string().max(64).nullable().optional(),
  name: string().max(200).nullable().optional(),
  day_tradable: boolean().nullable().optional(),
  feed_price: N,
  previous_close: N,
  min_price_limit: N,
  max_price_limit: N,
  day_trade_limit: N,
  round_digits: number().int().nullable().optional(),
  market_id: string().max(32).nullable().optional()
});
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400"
};
const j = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });
const Route$9 = createFileRoute("/api/public/hooks/thunder-watchlist")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return j({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!await isThunderAuthorized(provided, expected)) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }
        let raw;
        try {
          raw = await request.json();
        } catch {
          return j({ ok: false, error: "invalid_json" }, 400);
        }
        const items = Array.isArray(raw) ? raw : raw && typeof raw === "object" && Array.isArray(raw.items) ? raw.items : [raw];
        if (items.length < 1 || items.length > 500) return j({ ok: false, error: "invalid_body" }, 400);
        const valid = [];
        let invalid = 0;
        for (const it of items) {
          const r = Item.safeParse(it);
          if (r.success) valid.push(r.data);
          else invalid++;
        }
        if (!valid.length) return j({ ok: false, error: "all_invalid", invalid }, 400);
        const rows = valid.map((v) => ({
          symbol: v.symbol.toUpperCase(),
          uuid: v.uuid ?? null,
          name: v.name ?? null,
          day_tradable: v.day_tradable ?? null,
          feed_price: v.feed_price ?? null,
          previous_close: v.previous_close ?? null,
          min_price_limit: v.min_price_limit ?? null,
          max_price_limit: v.max_price_limit ?? null,
          day_trade_limit: v.day_trade_limit ?? null,
          round_digits: v.round_digits ?? null,
          market_id: v.market_id ?? null,
          source: "thunder_ext"
        }));
        const { supabaseAdmin: supabaseAdmin2 } = await import("./client.server-D5ro3rAQ.mjs");
        const { error } = await supabaseAdmin2.from("thunder_watchlist_snapshots").insert(rows);
        if (error) return j({ ok: false, error: error.message }, 500);
        return j({ ok: true, inserted: rows.length, invalid });
      }
    }
  }
});
const Route$8 = createFileRoute("/api/public/hooks/trailing-stop")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1e3).toISOString();
          const { data: recs } = await supabaseAdmin$5.from("recommendations").select("id, symbol, price_at_reco, target, stop_loss, confidence").is("outcome", null).eq("rejected_by_rules", false).gte("created_at", cutoff);
          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, updated: 0, reason: "no open recommendations" });
          }
          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin$5.from("stock_snapshots").select("symbol, close, atr14, rsi14, macd_hist, ema9, vol_ratio").in("symbol", symbols).order("snapshot_date", { ascending: false });
          const priceMap = /* @__PURE__ */ new Map();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (!priceMap.has(sym)) {
              priceMap.set(sym, {
                close: Number(s.close ?? 0),
                atr: Number(s.atr14 ?? 0),
                rsi: s.rsi14 != null ? Number(s.rsi14) : null,
                macdHist: s.macd_hist != null ? Number(s.macd_hist) : null,
                ema9: s.ema9 != null ? Number(s.ema9) : null,
                volRatio: s.vol_ratio != null ? Number(s.vol_ratio) : null
              });
            }
          }
          const updates = [];
          let updatedCount = 0;
          for (const r of recs) {
            const sym = String(r.symbol);
            const px = priceMap.get(sym);
            if (!px || px.close <= 0) continue;
            const entry = Number(r.price_at_reco ?? 0);
            const target = Number(r.target ?? 0);
            const curStop = Number(r.stop_loss ?? 0);
            if (entry <= 0 || target <= 0) continue;
            const progress = (px.close - entry) / (target - entry);
            if (progress < 0.5) continue;
            const strongMomentum = (px.rsi == null || px.rsi < 78) && (px.macdHist == null || px.macdHist > 0) && (px.ema9 == null || px.close > px.ema9) && (px.volRatio == null || px.volRatio >= 1.2);
            const atrBase = px.atr > 0 ? px.atr : px.close * 0.015;
            const tightBuffer = Math.min(atrBase, px.close * 0.01);
            const buffer = strongMomentum ? atrBase * 1.8 : tightBuffer;
            const newStop = Math.max(entry * 1.005, px.close - buffer);
            if (newStop > curStop + 1e-3) {
              const { error } = await supabaseAdmin$5.from("recommendations").update({ stop_loss: Number(newStop.toFixed(2)) }).eq("id", r.id);
              if (!error) {
                updatedCount++;
                const gainPct = ((px.close - entry) / entry * 100).toFixed(1);
                const tag = strongMomentum ? " 🚀 زخم قوي" : "";
                updates.push(`🔒 ${escapeHtml(sym)}: وقف خسارة جديد ${newStop.toFixed(2)} (مكسب حالي +${gainPct}%)${tag}`);
              }
            }
          }
          if (updates.length > 0) {
            const msg = ["🛡️ <b>تحديث وقف الخسارة المتحرّك</b>", "", ...updates].join("\n");
            await sendTelegram$1(msg);
          }
          return Response.json({ ok: true, updated: updatedCount, checked: recs.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("trailing-stop failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
const Route$7 = createFileRoute("/api/public/hooks/update-outcomes")({
  server: {
    handlers: {
      POST: handler,
      GET: handler
    }
  }
});
async function handler() {
  const todayUpdated = await closeTodayBullishRecommendationsFromTicks();
  const { data: pending } = await supabaseAdmin$5.from("recommendations").select("id, symbol, price_at_reco, target, stop_loss, max_hold_days, created_at, confidence, signal").eq("outcome", "pending").lt("created_at", new Date(Date.now() - 20 * 60 * 60 * 1e3).toISOString()).limit(500);
  if (!pending || pending.length === 0) {
    return Response.json({ ok: true, updated: todayUpdated, todayUpdated, message: "no pending recos" });
  }
  const symbols = Array.from(new Set(pending.map((p) => p.symbol)));
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, yahoo_symbol").in("symbol", symbols);
  const history = await fetchHistoryBulk(stocks ?? [], 15, 8);
  let updated = 0;
  for (const reco of pending) {
    const candles = history.get(reco.symbol.toUpperCase());
    if (!candles || candles.length === 0) continue;
    const recoDate = new Date(reco.created_at).toISOString().slice(0, 10);
    const after = candles.filter((c) => c.date.slice(0, 10) > recoDate);
    if (after.length === 0) continue;
    const entry = Number(reco.price_at_reco);
    const target = Number(reco.target ?? 0);
    const stop = Number(reco.stop_loss ?? 0);
    const maxDays = reco.max_hold_days ?? 5;
    const window2 = after.slice(0, maxDays);
    let outcome = "expired";
    let outcomePrice = window2[window2.length - 1].close;
    let outcomeAt = window2[window2.length - 1].date;
    for (const c of window2) {
      if (stop > 0 && c.low <= stop) {
        outcome = "stop_hit";
        outcomePrice = stop;
        outcomeAt = c.date;
        break;
      }
      if (target > 0 && c.high >= target) {
        outcome = "target_hit";
        outcomePrice = target;
        outcomeAt = c.date;
        break;
      }
    }
    const realizedPct = entry > 0 ? +((outcomePrice - entry) / entry * 100).toFixed(2) : 0;
    await supabaseAdmin$5.from("recommendations").update({
      outcome,
      outcome_price: outcomePrice,
      outcome_at: new Date(outcomeAt).toISOString(),
      realized_pct: realizedPct
    }).eq("id", reco.id);
    updated++;
    if (reco.signal === "buy" || reco.signal === "strong_buy") {
      const won = outcome === "target_hit" || outcome === "expired" && realizedPct > 0;
      try {
        await nudgeCalibration(reco.confidence ?? 50, won);
      } catch {
      }
    }
  }
  return Response.json({ ok: true, pending: pending.length, updated: updated + todayUpdated, todayUpdated });
}
function cairoDateString() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}
async function closeTodayBullishRecommendationsFromTicks() {
  const today = cairoDateString();
  const { data: pending } = await supabaseAdmin$5.from("recommendations").select("id, symbol, price_at_reco, target, stop_loss, created_at, confidence, signal").eq("outcome", "pending").in("signal", ["buy", "strong_buy"]).gte("created_at", `${today}T00:00:00.000Z`).lt("created_at", `${today}T23:59:59.999Z`).limit(500);
  let updated = 0;
  for (const reco of pending ?? []) {
    const entry = Number(reco.price_at_reco);
    const target = Number(reco.target ?? 0);
    const stop = Number(reco.stop_loss ?? 0);
    if (!(entry > 0)) continue;
    const { data: ticks } = await supabaseAdmin$5.from("live_ticks").select("price, ts").eq("symbol", reco.symbol).gte("ts", reco.created_at).gte("ts", `${today}T07:00:00.000Z`).lte("ts", `${today}T12:30:59.999Z`).order("ts", { ascending: true });
    if (!ticks?.length) continue;
    let outcome = "expired";
    let outcomePrice = Number(ticks[ticks.length - 1].price);
    let outcomeAt = String(ticks[ticks.length - 1].ts);
    for (const tick of ticks) {
      const price = Number(tick.price);
      if (stop > 0 && price <= stop) {
        outcome = "stop_hit";
        outcomePrice = stop;
        outcomeAt = String(tick.ts);
        break;
      }
      if (target > 0 && price >= target) {
        outcome = "target_hit";
        outcomePrice = target;
        outcomeAt = String(tick.ts);
        break;
      }
    }
    const realizedPct = +((outcomePrice - entry) / entry * 100).toFixed(2);
    await supabaseAdmin$5.from("recommendations").update({ outcome, outcome_price: outcomePrice, outcome_at: outcomeAt, realized_pct: realizedPct }).eq("id", reco.id);
    updated++;
    try {
      const won = outcome === "target_hit" || outcome === "expired" && realizedPct > 0;
      await nudgeCalibration(reco.confidence ?? 50, won);
    } catch {
    }
  }
  return updated;
}
function json$1(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
function encodeSSE(obj) {
  const line = `data: ${JSON.stringify(obj)}

`;
  return new TextEncoder().encode(line);
}
const Route$6 = createFileRoute("/api/public/hooks/vacuum-cleanup")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) return json$1({ ok: false, local: false, reason: "PROD" }, 200);
        return json$1({ ok: true, local: true, reason: "ready", description: "POST to trigger full cleanup + archive + VACUUM FULL" }, 200);
      },
      POST: async ({ request }) => {
        const local = await isLocalRuntime();
        if (!local) return json$1({ ok: false, local: false, reason: "PROD" }, 200);
        const url = new URL(request.url);
        const dryRun = url.searchParams.get("dryRun") !== "false";
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        void writer.write(encodeSSE({ type: "connected", description: `Starting full cleanup + VACUUM FULL (dryRun=${dryRun})...` }));
        void runFullArchive({
          dryRun,
          onProgress: (event) => {
            void writer.write(encodeSSE(event));
          }
        }).then((summary) => {
          void writer.write(encodeSSE({ type: "all_done", summary }));
          void writer.close();
        }).catch((err) => {
          const msg = String(err?.message || err);
          console.error("[vacuum-cleanup] runFullArchive threw:", msg);
          void writer.write(encodeSSE({ type: "error", error: msg.slice(0, 500) }));
          void writer.close();
        });
        return new Response(readable, {
          status: 200,
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive"
          }
        });
      }
    }
  }
});
function json(body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}
async function getDbSize() {
  const { data, error } = await supabaseAdmin$5.rpc("get_db_size");
  if (error || !data?.[0]) return { pretty: "unknown", bytes: 0 };
  const row = data[0];
  return { pretty: row.human_size, bytes: row.total_bytes };
}
const Route$5 = createFileRoute("/api/public/hooks/vacuum-only")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204 }),
      GET: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }
        const size = await getDbSize();
        return json({ ok: true, local: true, currentDbSize: size }, 200);
      },
      POST: async () => {
        const local = await isLocalRuntime();
        if (!local) {
          return json({ ok: false, local: false, reason: "PROD" }, 200);
        }
        const sizeBefore = await getDbSize();
        const startTime = (/* @__PURE__ */ new Date()).toISOString();
        const tables = [
          "marketwatch_snapshots",
          "live_ticks",
          "orderbook_snapshots",
          "live_quotes",
          "smart_exit_log",
          "thunder_auth_events"
        ];
        const results = [];
        for (const table of tables) {
          try {
            const { error } = await supabaseAdmin$5.rpc("gsql_exec", {
              _query: `VACUUM (FULL, ANALYZE) ${table}`
            });
            if (error) {
              const { error: err2 } = await supabaseAdmin$5.from(table).select("id").limit(1);
              results.push({ table, vacuumed: false, error: error.message });
            } else {
              results.push({ table, vacuumed: true });
            }
          } catch (e) {
            results.push({
              table,
              vacuumed: false,
              error: String(e?.message || e)
            });
          }
        }
        const sizeAfter = await getDbSize();
        const endTime = (/* @__PURE__ */ new Date()).toISOString();
        const spaceReclaimed = Math.max(0, sizeBefore.bytes - sizeAfter.bytes);
        return json({
          ok: true,
          startTime,
          endTime,
          dbSizeBefore: sizeBefore,
          dbSizeAfter: sizeAfter,
          spaceReclaimedBytes: spaceReclaimed,
          spaceReclaimedPretty: `${spaceReclaimed / 1024 / 1024 | 0} MB freed`,
          tables: results
        });
      }
    }
  }
});
const Route$4 = createFileRoute("/api/public/hooks/volume-spike")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const todayStart = /* @__PURE__ */ new Date();
          todayStart.setHours(0, 0, 0, 0);
          const { data: snaps } = await supabaseAdmin$5.from("stock_snapshots").select("symbol, close, change_pct, vol_ratio, volume, ts").gte("ts", todayStart.toISOString()).order("ts", { ascending: false }).limit(2e3);
          if (!snaps || snaps.length === 0) {
            return Response.json({ ok: true, alerts: 0, reason: "no snapshots today" });
          }
          const latest = /* @__PURE__ */ new Map();
          for (const s of snaps) {
            const sym = String(s.symbol);
            if (!latest.has(sym)) latest.set(sym, s);
          }
          const spikes = [...latest.values()].filter((s) => {
            const vr = Number(s.vol_ratio ?? 0);
            const ch = Number(s.change_pct ?? 0);
            return vr >= 3 && ch >= 1.5;
          });
          if (spikes.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }
          const symbols = spikes.map((s) => String(s.symbol));
          const todayDate = todayStart.toISOString().slice(0, 10);
          const { data: alerted } = await supabaseAdmin$5.from("pick_notifications").select("symbol, kind, pick_date").eq("kind", "volume_spike").eq("pick_date", todayDate).in("symbol", symbols);
          const alreadyAlerted = new Set((alerted ?? []).map((a) => String(a.symbol)));
          const fresh = spikes.filter((s) => !alreadyAlerted.has(String(s.symbol)));
          if (fresh.length === 0) return Response.json({ ok: true, alerts: 0, reason: "all already alerted" });
          const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").in("symbol", fresh.map((s) => String(s.symbol)));
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);
          const lines = ["🚨 <b>دخول مؤسسات محتمل — انفجار حجم تداول</b>", ""];
          for (const s of fresh.slice(0, 8)) {
            const sym = String(s.symbol);
            const name = escapeHtml(nameMap.get(sym) || sym);
            lines.push(`⚡ <b>${name}</b> (${sym})`);
            lines.push(`   حجم: ${Number(s.vol_ratio).toFixed(1)}× المتوسط | سعر: +${Number(s.change_pct).toFixed(1)}%`);
          }
          lines.push("");
          lines.push("💡 غالباً مؤسسة كبيرة بتدخل — راقب عن قرب");
          await sendTelegram$1(lines.join("\n"));
          const rows = fresh.map((s) => ({
            symbol: String(s.symbol),
            kind: "volume_spike",
            pick_date: todayDate,
            payload: { vol_ratio: Number(s.vol_ratio), change_pct: Number(s.change_pct) }
          }));
          await supabaseAdmin$5.from("pick_notifications").insert(rows);
          return Response.json({ ok: true, alerts: fresh.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("volume-spike failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      }
    }
  }
});
const Route$3 = createFileRoute("/api/public/hooks/walk-forward")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body = {};
        try {
          body = await request.json();
        } catch {
        }
        const result = await runWalkForward({ data: body });
        return new Response(JSON.stringify({ success: true, ...result }, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      },
      GET: async () => {
        const result = await runWalkForward({ data: {} });
        return new Response(JSON.stringify({ success: true, ...result }, null, 2), {
          headers: { "Content-Type": "application/json" }
        });
      }
    }
  }
});
function bucketStats(rows, picker) {
  const xs = rows.filter((r) => picker(r) && r.next_day_return_pct != null);
  if (!xs.length) return { n: 0, avg: 0, winRate: 0 };
  const sum = xs.reduce((a, r) => a + (r.next_day_return_pct ?? 0), 0);
  const wins = xs.filter((r) => (r.next_day_return_pct ?? 0) > 0).length;
  return { n: xs.length, avg: sum / xs.length, winRate: wins / xs.length * 100 };
}
const Route$2 = createFileRoute("/api/public/hooks/weekly-deep-learn")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow2 = new Date((/* @__PURE__ */ new Date()).toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const cutoff = new Date(cairoNow2);
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffISO = cutoff.toISOString().slice(0, 10);
        const { data, error } = await supabaseAdmin$5.from("daily_intelligence").select("symbol, trade_date, rsi14, vol_ratio, composite_score, intraday_max_drawup_pct, news_sentiment_avg, breadth_pct, was_picked, next_day_return_pct, pick_pnl_pct").gte("trade_date", cutoffISO).not("next_day_return_pct", "is", null);
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        const rows = data ?? [];
        if (rows.length < 20) {
          return Response.json({ ok: true, rows: rows.length, skipped: "insufficient_data" });
        }
        const lessons = {
          rsi_oversold_lt30: bucketStats(rows, (r) => (r.rsi14 ?? 50) < 30),
          rsi_overbought_gt70: bucketStats(rows, (r) => (r.rsi14 ?? 50) > 70),
          rsi_sweet_50to65: bucketStats(rows, (r) => {
            const v = r.rsi14 ?? 0;
            return v >= 50 && v <= 65;
          }),
          vol_spike_gt2x: bucketStats(rows, (r) => (r.vol_ratio ?? 0) > 2),
          intraday_strong_drawup_gt3: bucketStats(rows, (r) => (r.intraday_max_drawup_pct ?? 0) > 3),
          news_positive: bucketStats(rows, (r) => (r.news_sentiment_avg ?? 0) > 0.3),
          news_negative: bucketStats(rows, (r) => (r.news_sentiment_avg ?? 0) < -0.3),
          breadth_strong_gt60: bucketStats(rows, (r) => (r.breadth_pct ?? 0) > 60),
          breadth_weak_lt40: bucketStats(rows, (r) => (r.breadth_pct ?? 100) < 40),
          composite_high_gt70: bucketStats(rows, (r) => (r.composite_score ?? 0) > 70),
          picks_only: bucketStats(rows, (r) => !!r.was_picked)
        };
        await supabaseAdmin$5.from("model_state").upsert({
          key: "weekly_deep_learn",
          data: { lessons, rows_analyzed: rows.length, generated_at: (/* @__PURE__ */ new Date()).toISOString() }
        }, { onConflict: "key" });
        const sorted = Object.entries(lessons).filter(([, v]) => v.n >= 5).sort(([, a], [, b]) => Math.abs(b.avg) - Math.abs(a.avg)).slice(0, 5);
        const labels = {
          rsi_oversold_lt30: "RSI < 30 (تشبع بيع)",
          rsi_overbought_gt70: "RSI > 70 (تشبع شراء)",
          rsi_sweet_50to65: "RSI 50-65 (المنطقة الذهبية)",
          vol_spike_gt2x: "حجم > 2× المتوسط",
          intraday_strong_drawup_gt3: "ارتفاع لحظي > 3%",
          news_positive: "أخبار إيجابية قوية",
          news_negative: "أخبار سلبية قوية",
          breadth_strong_gt60: "عرض السوق > 60%",
          breadth_weak_lt40: "عرض السوق < 40%",
          composite_high_gt70: "score مركّب > 70",
          picks_only: "الترشيحات الفعلية"
        };
        const lines = [`<b>🧠 دروس الأسبوع</b> (${rows.length} حالة)
`];
        for (const [k, v] of sorted) {
          const icon = v.avg > 0 ? "✅" : "❌";
          lines.push(`${icon} <b>${labels[k] ?? k}</b>: متوسط +${v.avg.toFixed(2)}% · win ${v.winRate.toFixed(0)}% · n=${v.n}`);
        }
        await sendTelegram$1(lines.join("\n")).catch(() => null);
        return Response.json({ ok: true, rows: rows.length, lessons });
      }
    }
  }
});
const Route$1 = createFileRoute("/api/public/hooks/weekly-learning")({
  server: {
    handlers: {
      POST: async () => {
        const result = await runAdaptiveLearning();
        return Response.json({ ok: true, ...result });
      }
    }
  }
});
async function buildBotContext(opts2) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1e3).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const [picksRes, recsRes, positionsRes, newsRes, alertsRes, marketRes, weekRecsRes, symbolSnapRes] = await Promise.all([
    supabaseAdmin$5.from("daily_picks").select("symbol, name_ar, confidence, entry_price, target_price, stop_price, target_pct, status, pnl_pct, pick_date").gte("pick_date", today).order("confidence", { ascending: false }).limit(8),
    supabaseAdmin$5.from("recommendations").select("symbol, signal, confidence, expected_next_day_pct, entry_min, entry_max, target, stop_loss, created_at").gte("created_at", since24h).in("signal", ["buy", "strong_buy"]).eq("rejected_by_rules", false).order("confidence", { ascending: false }).limit(10),
    supabaseAdmin$5.from("positions").select("symbol, entry_price, current_price, pnl_pct, target_price, stop_loss, entry_date, status").eq("status", "open").limit(20),
    supabaseAdmin$5.from("news_sentiment").select("symbol, headline, sentiment, sentiment_score, published_at").gte("created_at", since24h).order("created_at", { ascending: false }).limit(10),
    supabaseAdmin$5.from("sell_alerts").select("symbol, alert_type, message_ar, created_at").gte("created_at", since24h).order("created_at", { ascending: false }).limit(5),
    supabaseAdmin$5.from("market_snapshots").select("index_symbol, close, change_pct, change_5d_pct, trend, date").order("date", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin$5.from("recommendations").select("symbol, outcome, realized_pct").gte("created_at", since7d).eq("rejected_by_rules", false).neq("outcome", "pending").not("realized_pct", "is", null).limit(200),
    opts2?.symbol ? supabaseAdmin$5.from("stock_snapshots").select("symbol, close, change_pct, rsi14, macd_hist, vol_ratio, support, resistance, ts").eq("symbol", opts2.symbol).order("ts", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null })
  ]);
  const weekRecs = weekRecsRes.data ?? [];
  const weekTotal = weekRecs.length;
  const weekWins = weekRecs.filter((r) => (r.realized_pct ?? 0) > 0).length;
  const weekAvg = weekTotal ? weekRecs.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / weekTotal : 0;
  return {
    today,
    market: marketRes.data,
    picks: picksRes.data ?? [],
    recommendations: recsRes.data ?? [],
    positions: positionsRes.data ?? [],
    news: newsRes.data ?? [],
    alerts: alertsRes.data ?? [],
    weekStats: { total: weekTotal, wins: weekWins, avgReturnPct: Number(weekAvg.toFixed(2)) },
    symbolSnapshot: symbolSnapRes.data
  };
}
async function detectMentionedSymbol(text) {
  const upper = text.toUpperCase();
  const match = upper.match(/\b[A-Z]{2,6}\b/);
  if (match) {
    const { data } = await supabaseAdmin$5.from("stocks").select("symbol").eq("symbol", match[0]).maybeSingle();
    if (data) return data.symbol;
  }
  const { data: stocks } = await supabaseAdmin$5.from("stocks").select("symbol, name_ar").limit(500);
  if (!stocks) return null;
  for (const s of stocks) {
    if (s.name_ar && text.includes(s.name_ar.split(" ")[0])) return s.symbol;
  }
  return null;
}
function deriveWebhookSecret(apiKey) {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}
function safeEqual(a, b) {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}
function isAuthorizedChat(chatId) {
  const allowed = process.env.TELEGRAM_CHAT_ID;
  if (!allowed) return true;
  return String(chatId) === String(allowed);
}
const PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⭐ /picks" }, { text: "💼 /positions" }],
    [{ text: "📊 /status" }, { text: "📈 /perf" }],
    [{ text: "📰 /news" }, { text: "❓ /help" }]
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "اكتب سؤالك أو اختر أمر…"
};
function normalizeButtonText(text) {
  const m = text.match(/\/[a-zA-Z_]+/);
  return m ? m[0] : text;
}
async function handleSlash(cmd, ctx) {
  const c = cmd.toLowerCase().split(/\s+/)[0];
  if (c === "/start" || c === "/help") {
    return [
      "👋 <b>أهلًا بك في مساعد تحليل البورصة</b>",
      "",
      "اسألني أي حاجة بالعربي عن:",
      "• الترشيحات اليومية",
      "• المراكز المفتوحة",
      "• حالة السوق",
      "• أداء الأسبوع",
      "• خبر عن سهم معين",
      "",
      "أوامر سريعة:",
      "• /status — حالة النظام",
      "• /picks — ترشيحات اليوم",
      "• /positions — مراكزي المفتوحة",
      "• /news — آخر الأخبار",
      "• /perf — أداء آخر 7 أيام"
    ].join("\n");
  }
  if (c === "/status") {
    const m = ctx.market;
    const parts = ["📊 <b>حالة النظام:</b>"];
    if (m) parts.push(`• المؤشر ${escapeHtml(m.index_symbol ?? "—")}: ${m.close?.toFixed(2) ?? "—"} (${m.change_pct?.toFixed(2) ?? "0"}%)`);
    parts.push(`• ترشيحات اليوم: ${ctx.picks.length}`);
    parts.push(`• توصيات شراء حديثة: ${ctx.recommendations.length}`);
    parts.push(`• مراكز مفتوحة: ${ctx.positions.length}`);
    parts.push(`• أخبار آخر 24س: ${ctx.news.length}`);
    parts.push(`• تنبيهات بيع: ${ctx.alerts.length}`);
    return parts.join("\n");
  }
  if (c === "/picks") {
    if (!ctx.picks.length) return "لا توجد ترشيحات لهذا اليوم بعد.";
    const lines = ["⭐ <b>ترشيحات اليوم:</b>"];
    for (const p of ctx.picks) {
      lines.push(`• ${escapeHtml(p.symbol)} — ثقة ${p.confidence}% · هدف +${Number(p.target_pct ?? 0).toFixed(1)}%`);
      lines.push(`  دخول ${Number(p.entry_price).toFixed(2)} · هدف ${Number(p.target_price).toFixed(2)} · وقف ${Number(p.stop_price).toFixed(2)}`);
    }
    return lines.join("\n");
  }
  if (c === "/positions") {
    if (!ctx.positions.length) return "لا توجد مراكز مفتوحة حاليًا.";
    const lines = ["💼 <b>المراكز المفتوحة:</b>"];
    for (const p of ctx.positions) {
      const arrow = (p.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
      lines.push(`${arrow} ${escapeHtml(p.symbol)} — PnL ${p.pnl_pct?.toFixed(2) ?? "—"}%`);
      lines.push(`  دخول ${Number(p.entry_price).toFixed(2)}${p.current_price ? ` · حالي ${Number(p.current_price).toFixed(2)}` : ""}${p.target_price ? ` · هدف ${Number(p.target_price).toFixed(2)}` : ""}`);
    }
    return lines.join("\n");
  }
  if (c === "/news") {
    if (!ctx.news.length) return "لا توجد أخبار جديدة آخر 24 ساعة.";
    const lines = ["📰 <b>آخر الأخبار:</b>"];
    for (const n of ctx.news.slice(0, 8)) {
      const e = n.sentiment_score > 0.15 ? "📈" : n.sentiment_score < -0.15 ? "📉" : "•";
      lines.push(`${e} ${escapeHtml(n.symbol)}: ${escapeHtml((n.headline ?? "").slice(0, 120))}`);
    }
    return lines.join("\n");
  }
  if (c === "/perf") {
    const s = ctx.weekStats;
    if (!s.total) return "لا توجد توصيات مكتملة خلال آخر 7 أيام بعد.";
    const acc = (s.wins / s.total * 100).toFixed(1);
    return `📈 <b>أداء آخر 7 أيام:</b>
• مكتملة: ${s.total}
• ناجحة: ${s.wins}
• الدقة: ${acc}%
• متوسط العائد: ${s.avgReturnPct}%`;
  }
  return "أمر غير معروف. ابعت /help للأوامر المتاحة.";
}
function buildAiSystemPrompt(ctx) {
  const m = ctx.market;
  const picks = ctx.picks.map((p) => `${p.symbol}: ثقة ${p.confidence}%، دخول ${p.entry_price}، هدف ${p.target_price} (+${p.target_pct ?? 0}%)، وقف ${p.stop_price}`).join(" | ");
  const recs = ctx.recommendations.slice(0, 8).map((r) => `${r.symbol}(${r.signal} ${r.confidence}%${r.expected_next_day_pct != null ? `، متوقع +${r.expected_next_day_pct}%` : ""})`).join(", ");
  const positions = ctx.positions.map((p) => `${p.symbol}: PnL ${p.pnl_pct ?? "—"}%، دخول ${p.entry_price}، حالي ${p.current_price ?? "—"}، هدف ${p.target_price ?? "—"}`).join(" | ");
  const news = ctx.news.slice(0, 6).map((n) => `[${n.symbol} ${n.sentiment_score?.toFixed(2)}] ${n.headline}`).join("\n");
  const snap = ctx.symbolSnapshot;
  return [
    "أنت مساعد ذكي لنظام تحليل أسهم البورصة المصرية (EGX).",
    "ردّ بالعربية الفصحى أو العامية المصرية المختصرة. كن دقيقًا، ابن إجابتك على البيانات المتاحة فقط.",
    "لا تخترع أرقامًا أو أحداثًا غير موجودة. لو البيانات ناقصة قُل ذلك صراحة.",
    "نسّق الأرقام بفاصلة عشرية واحدة أو اثنين. استخدم HTML بسيط (<b>) عند اللزوم. لا تستخدم Markdown.",
    "تنبيه قانوني: لا تقدّم نصيحة استثمارية قاطعة — وضّح أن البيانات للاسترشاد.",
    "",
    "=== بيانات النظام الحالية ===",
    `التاريخ: ${ctx.today}`,
    m ? `السوق: ${m.index_symbol} ${m.close} (تغير اليوم ${m.change_pct ?? 0}%، 5 أيام ${m.change_5d_pct ?? 0}%، اتجاه ${m.trend ?? "—"})` : "السوق: لا توجد بيانات",
    "",
    `ترشيحات اليوم (${ctx.picks.length}): ${picks || "لا يوجد"}`,
    "",
    `توصيات شراء حديثة: ${recs || "لا يوجد"}`,
    "",
    `المراكز المفتوحة (${ctx.positions.length}): ${positions || "لا يوجد"}`,
    "",
    `إحصاء آخر 7 أيام: ${ctx.weekStats.total} توصية مكتملة، ${ctx.weekStats.wins} ناجحة، متوسط العائد ${ctx.weekStats.avgReturnPct}%`,
    "",
    "أحدث الأخبار:",
    news || "(لا يوجد)",
    snap ? `
بيانات السهم المذكور ${snap.symbol}: سعر ${snap.close}، تغير ${snap.change_pct}%، RSI ${snap.rsi14}، MACDhist ${snap.macd_hist}، نسبة الحجم ${snap.vol_ratio}، دعم ${snap.support}، مقاومة ${snap.resistance}` : ""
  ].join("\n");
}
async function answerWithAi(userText, ctx) {
  try {
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: buildAiSystemPrompt(ctx),
      prompt: userText.slice(0, 800),
      maxOutputTokens: 600,
      temperature: 0.4
    });
    const cleaned = (text ?? "").trim();
    return cleaned || "معذرة، مفيش رد متاح دلوقتي. حاول تاني بعد دقيقة.";
  } catch (e) {
    console.error("[telegram-webhook] ai error", e);
    return "حدث خطأ مؤقت في المحلل الذكي. حاول مرة أخرى أو استخدم /status للحصول على ملخص.";
  }
}
const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.TELEGRAM_API_KEY;
          if (!apiKey) return new Response("not configured", { status: 503 });
          const expected = deriveWebhookSecret(apiKey);
          const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
          if (!safeEqual(actual, expected)) {
            return new Response("Unauthorized", { status: 401 });
          }
          const update = await request.json().catch(() => null);
          const msg = update?.message ?? update?.edited_message;
          const chatId = msg?.chat?.id;
          const rawText = (msg?.text ?? "").trim();
          const text = rawText.startsWith("/") || /\/[a-zA-Z_]+/.test(rawText) ? normalizeButtonText(rawText) : rawText;
          if (!chatId || !text) return Response.json({ ok: true, ignored: true });
          if (!isAuthorizedChat(chatId)) {
            await sendTelegramTo(chatId, "هذا البوت مخصّص لمستخدم محدد. عذرًا.");
            return Response.json({ ok: true, unauthorized: true });
          }
          const symbol = await detectMentionedSymbol(text).catch(() => null);
          const ctx = await buildBotContext({ symbol: symbol ?? void 0 });
          let reply;
          if (text.startsWith("/")) {
            reply = await handleSlash(text, ctx);
          } else {
            reply = await answerWithAi(text, ctx);
          }
          if (reply.length > 3900) reply = reply.slice(0, 3900) + "\n…";
          await sendTelegramTo(chatId, reply, { reply_markup: PERSISTENT_KEYBOARD });
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[telegram-webhook] error", e);
          return Response.json({ ok: false, error: e.message }, { status: 200 });
        }
      }
    }
  }
});
const IndexRoute = Route$2i.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$2j
});
const ActivityRoute = Route$2h.update({
  id: "/activity",
  path: "/activity",
  getParentRoute: () => Route$2j
});
const AiSupervisorRoute = Route$2g.update({
  id: "/ai-supervisor",
  path: "/ai-supervisor",
  getParentRoute: () => Route$2j
});
const AutomationRoute = Route$2f.update({
  id: "/automation",
  path: "/automation",
  getParentRoute: () => Route$2j
});
const BacktestRoute = Route$2e.update({
  id: "/backtest",
  path: "/backtest",
  getParentRoute: () => Route$2j
});
const DailyRoute = Route$2d.update({
  id: "/daily",
  path: "/daily",
  getParentRoute: () => Route$2j
});
const DecisionEngineRoute = Route$2c.update({
  id: "/decision-engine",
  path: "/decision-engine",
  getParentRoute: () => Route$2j
});
const DeepRoute = Route$2b.update({
  id: "/deep",
  path: "/deep",
  getParentRoute: () => Route$2j
});
const ExecutionLabRoute = Route$2a.update({
  id: "/execution-lab",
  path: "/execution-lab",
  getParentRoute: () => Route$2j
});
const ExtDiagRoute = Route$29.update({
  id: "/ext-diag",
  path: "/ext-diag",
  getParentRoute: () => Route$2j
});
const ExtensionTelemetryRoute = Route$28.update({
  id: "/extension-telemetry",
  path: "/extension-telemetry",
  getParentRoute: () => Route$2j
});
const HalalDaytradeRoute = Route$27.update({
  id: "/halal-daytrade",
  path: "/halal-daytrade",
  getParentRoute: () => Route$2j
});
const HealthRoute = Route$26.update({
  id: "/health",
  path: "/health",
  getParentRoute: () => Route$2j
});
const HealthCheckRoute = Route$25.update({
  id: "/health-check",
  path: "/health-check",
  getParentRoute: () => Route$2j
});
const InvestmentRoute = Route$24.update({
  id: "/investment",
  path: "/investment",
  getParentRoute: () => Route$2j
});
const LearningRoute = Route$23.update({
  id: "/learning",
  path: "/learning",
  getParentRoute: () => Route$2j
});
const MarketwatchHealthRoute = Route$22.update({
  id: "/marketwatch-health",
  path: "/marketwatch-health",
  getParentRoute: () => Route$2j
});
const MissedSignalsRoute = Route$21.update({
  id: "/missed-signals",
  path: "/missed-signals",
  getParentRoute: () => Route$2j
});
const MorningRoute = Route$20.update({
  id: "/morning",
  path: "/morning",
  getParentRoute: () => Route$2j
});
const PaperRoute = Route$1$.update({
  id: "/paper",
  path: "/paper",
  getParentRoute: () => Route$2j
});
const PerformanceRoute = Route$1_.update({
  id: "/performance",
  path: "/performance",
  getParentRoute: () => Route$2j
});
const PingRoute = Route$1Z.update({
  id: "/ping",
  path: "/ping",
  getParentRoute: () => Route$2j
});
const PlanRoute = Route$1Y.update({
  id: "/plan",
  path: "/plan",
  getParentRoute: () => Route$2j
});
const PositionsRoute = Route$1X.update({
  id: "/positions",
  path: "/positions",
  getParentRoute: () => Route$2j
});
const RealityRoute = Route$1W.update({
  id: "/reality",
  path: "/reality",
  getParentRoute: () => Route$2j
});
const ReconciliationRoute = Route$1V.update({
  id: "/reconciliation",
  path: "/reconciliation",
  getParentRoute: () => Route$2j
});
const RightsRoute = Route$1U.update({
  id: "/rights",
  path: "/rights",
  getParentRoute: () => Route$2j
});
const ScalpRoute = Route$1T.update({
  id: "/scalp",
  path: "/scalp",
  getParentRoute: () => Route$2j
});
const ScalpDipRoute = Route$1S.update({
  id: "/scalp-dip",
  path: "/scalp-dip",
  getParentRoute: () => Route$2j
});
const ScalpFeasibilityRoute = Route$1R.update({
  id: "/scalp-feasibility",
  path: "/scalp-feasibility",
  getParentRoute: () => Route$2j
});
const ScalpFreshRoute = Route$1Q.update({
  id: "/scalp-fresh",
  path: "/scalp-fresh",
  getParentRoute: () => Route$2j
});
const SessionLogRoute = Route$1P.update({
  id: "/session-log",
  path: "/session-log",
  getParentRoute: () => Route$2j
});
const ShadowReportRoute = Route$1O.update({
  id: "/shadow-report",
  path: "/shadow-report",
  getParentRoute: () => Route$2j
});
const SignalQualityRoute = Route$1N.update({
  id: "/signal-quality",
  path: "/signal-quality",
  getParentRoute: () => Route$2j
});
const SlippageReportRoute = Route$1M.update({
  id: "/slippage-report",
  path: "/slippage-report",
  getParentRoute: () => Route$2j
});
const SniperRoute = Route$1L.update({
  id: "/sniper",
  path: "/sniper",
  getParentRoute: () => Route$2j
});
const ThrottleTestRoute = Route$1K.update({
  id: "/throttle-test",
  path: "/throttle-test",
  getParentRoute: () => Route$2j
});
const ThunderRoute = Route$1J.update({
  id: "/thunder",
  path: "/thunder",
  getParentRoute: () => Route$2j
});
const ThunderLiveRoute = Route$1I.update({
  id: "/thunder-live",
  path: "/thunder-live",
  getParentRoute: () => Route$2j
});
const ThunderTabsRoute = Route$1H.update({
  id: "/thunder-tabs",
  path: "/thunder-tabs",
  getParentRoute: () => Route$2j
});
const TiersRoute = Route$1G.update({
  id: "/tiers",
  path: "/tiers",
  getParentRoute: () => Route$2j
});
const TodayRoute = Route$1F.update({
  id: "/today",
  path: "/today",
  getParentRoute: () => Route$2j
});
const TomorrowRoute = Route$1E.update({
  id: "/tomorrow",
  path: "/tomorrow",
  getParentRoute: () => Route$2j
});
const TrackRecordRoute = Route$1D.update({
  id: "/track-record",
  path: "/track-record",
  getParentRoute: () => Route$2j
});
const TradeLifecycleRoute = Route$1C.update({
  id: "/trade-lifecycle",
  path: "/trade-lifecycle",
  getParentRoute: () => Route$2j
});
const StockSymbolRoute = Route$1B.update({
  id: "/stock/$symbol",
  path: "/stock/$symbol",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksAggregateIntradayCandlesRoute = Route$1A.update({
  id: "/api/public/hooks/aggregate-intraday-candles",
  path: "/api/public/hooks/aggregate-intraday-candles",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksAiSupervisorFeedRoute = Route$1z.update({
  id: "/api/public/hooks/ai-supervisor-feed",
  path: "/api/public/hooks/ai-supervisor-feed",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksAiSupervisorIdentityRoute = Route$1y.update({
  id: "/api/public/hooks/ai-supervisor-identity",
  path: "/api/public/hooks/ai-supervisor-identity",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksArchiveFolderRoute = Route$1x.update({
  id: "/api/public/hooks/archive-folder",
  path: "/api/public/hooks/archive-folder",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksArchiveTriggerRoute = Route$1w.update({
  id: "/api/public/hooks/archive-trigger",
  path: "/api/public/hooks/archive-trigger",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksAutoBacktestRoute = Route$1v.update({
  id: "/api/public/hooks/auto-backtest",
  path: "/api/public/hooks/auto-backtest",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksAutoRetrainRoute = Route$1u.update({
  id: "/api/public/hooks/auto-retrain",
  path: "/api/public/hooks/auto-retrain",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksBackfillTiersRoute = Route$1t.update({
  id: "/api/public/hooks/backfill-tiers",
  path: "/api/public/hooks/backfill-tiers",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksCollectionStatusRoute = Route$1s.update({
  id: "/api/public/hooks/collection-status",
  path: "/api/public/hooks/collection-status",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksCollectionWatchdogRoute = Route$1r.update({
  id: "/api/public/hooks/collection-watchdog",
  path: "/api/public/hooks/collection-watchdog",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksComputeScalpFeasibilityRoute = Route$1q.update({
  id: "/api/public/hooks/compute-scalp-feasibility",
  path: "/api/public/hooks/compute-scalp-feasibility",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksDailyPickRoute = Route$1p.update({
  id: "/api/public/hooks/daily-pick",
  path: "/api/public/hooks/daily-pick",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksDailyScanRoute = Route$1o.update({
  id: "/api/public/hooks/daily-scan",
  path: "/api/public/hooks/daily-scan",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksDataFreshnessRoute = Route$1n.update({
  id: "/api/public/hooks/data-freshness",
  path: "/api/public/hooks/data-freshness",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksDbSizeRoute = Route$1m.update({
  id: "/api/public/hooks/db-size",
  path: "/api/public/hooks/db-size",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksDrawdownGuardRoute = Route$1l.update({
  id: "/api/public/hooks/drawdown-guard",
  path: "/api/public/hooks/drawdown-guard",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksEnrichNewsMubasherRoute = Route$1k.update({
  id: "/api/public/hooks/enrich-news-mubasher",
  path: "/api/public/hooks/enrich-news-mubasher",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksEnrichNewsRssRoute = Route$1j.update({
  id: "/api/public/hooks/enrich-news-rss",
  path: "/api/public/hooks/enrich-news-rss",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksEodLearnRoute = Route$1i.update({
  id: "/api/public/hooks/eod-learn",
  path: "/api/public/hooks/eod-learn",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksEodRecapRoute = Route$1h.update({
  id: "/api/public/hooks/eod-recap",
  path: "/api/public/hooks/eod-recap",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExportBinaryRoute = Route$1g.update({
  id: "/api/public/hooks/export-binary",
  path: "/api/public/hooks/export-binary",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExportDirectRoute = Route$1f.update({
  id: "/api/public/hooks/export-direct",
  path: "/api/public/hooks/export-direct",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExportHistoryRoute = Route$1e.update({
  id: "/api/public/hooks/export-history",
  path: "/api/public/hooks/export-history",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExtDiagRoute = Route$1d.update({
  id: "/api/public/hooks/ext-diag",
  path: "/api/public/hooks/ext-diag",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExtensionTelemetryRoute = Route$1c.update({
  id: "/api/public/hooks/extension-telemetry",
  path: "/api/public/hooks/extension-telemetry",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksExtensionTradesRoute = Route$1b.update({
  id: "/api/public/hooks/extension-trades",
  path: "/api/public/hooks/extension-trades",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksFetchFundamentalsRoute = Route$1a.update({
  id: "/api/public/hooks/fetch-fundamentals",
  path: "/api/public/hooks/fetch-fundamentals",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksFetchMacroRoute = Route$19.update({
  id: "/api/public/hooks/fetch-macro",
  path: "/api/public/hooks/fetch-macro",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksFetchNewsAllRoute = Route$18.update({
  id: "/api/public/hooks/fetch-news-all",
  path: "/api/public/hooks/fetch-news-all",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksForecastNewsImpactsRoute = Route$17.update({
  id: "/api/public/hooks/forecast-news-impacts",
  path: "/api/public/hooks/forecast-news-impacts",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksHealthCheckRoute = Route$16.update({
  id: "/api/public/hooks/health-check",
  path: "/api/public/hooks/health-check",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksHourlyPulseRoute = Route$15.update({
  id: "/api/public/hooks/hourly-pulse",
  path: "/api/public/hooks/hourly-pulse",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksInstantTrainRoute = Route$14.update({
  id: "/api/public/hooks/instant-train",
  path: "/api/public/hooks/instant-train",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksIntradayBreakoutScanRoute = Route$13.update({
  id: "/api/public/hooks/intraday-breakout-scan",
  path: "/api/public/hooks/intraday-breakout-scan",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksL2CoverageTestRoute = Route$12.update({
  id: "/api/public/hooks/l2-coverage-test",
  path: "/api/public/hooks/l2-coverage-test",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksL2HealthCheckRoute = Route$11.update({
  id: "/api/public/hooks/l2-health-check",
  path: "/api/public/hooks/l2-health-check",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksLivePickMonitorRoute = Route$10.update({
  id: "/api/public/hooks/live-pick-monitor",
  path: "/api/public/hooks/live-pick-monitor",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksLivePriceStatusRoute = Route$$.update({
  id: "/api/public/hooks/live-price-status",
  path: "/api/public/hooks/live-price-status",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksLiveSignalScanRoute = Route$_.update({
  id: "/api/public/hooks/live-signal-scan",
  path: "/api/public/hooks/live-signal-scan",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksLiveTickPollRoute = Route$Z.update({
  id: "/api/public/hooks/live-tick-poll",
  path: "/api/public/hooks/live-tick-poll",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksMarketOpenCheckRoute = Route$Y.update({
  id: "/api/public/hooks/market-open-check",
  path: "/api/public/hooks/market-open-check",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksMarketStateRoute = Route$X.update({
  id: "/api/public/hooks/market-state",
  path: "/api/public/hooks/market-state",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksMarketwatchHealthRoute = Route$W.update({
  id: "/api/public/hooks/marketwatch-health",
  path: "/api/public/hooks/marketwatch-health",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksMomentumWeeklyRunRoute = Route$V.update({
  id: "/api/public/hooks/momentum-weekly-run",
  path: "/api/public/hooks/momentum-weekly-run",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksMonitorRoute = Route$U.update({
  id: "/api/public/hooks/monitor",
  path: "/api/public/hooks/monitor",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksNewsWatchdogRoute = Route$T.update({
  id: "/api/public/hooks/news-watchdog",
  path: "/api/public/hooks/news-watchdog",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksOrderPlacedRoute = Route$S.update({
  id: "/api/public/hooks/order-placed",
  path: "/api/public/hooks/order-placed",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksOrderUpdateRoute = Route$R.update({
  id: "/api/public/hooks/order-update",
  path: "/api/public/hooks/order-update",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksOrderbookSnapshotRoute = Route$Q.update({
  id: "/api/public/hooks/orderbook-snapshot",
  path: "/api/public/hooks/orderbook-snapshot",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksOutcomeLoopRoute = Route$P.update({
  id: "/api/public/hooks/outcome-loop",
  path: "/api/public/hooks/outcome-loop",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPaperScalpRoute = Route$O.update({
  id: "/api/public/hooks/paper-scalp",
  path: "/api/public/hooks/paper-scalp",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPaperScalpDipRoute = Route$N.update({
  id: "/api/public/hooks/paper-scalp-dip",
  path: "/api/public/hooks/paper-scalp-dip",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPaperScalpFreshRoute = Route$M.update({
  id: "/api/public/hooks/paper-scalp-fresh",
  path: "/api/public/hooks/paper-scalp-fresh",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPerformanceDigestRoute = Route$L.update({
  id: "/api/public/hooks/performance-digest",
  path: "/api/public/hooks/performance-digest",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPingRoute = Route$K.update({
  id: "/api/public/hooks/ping",
  path: "/api/public/hooks/ping",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPremarketBriefRoute = Route$J.update({
  id: "/api/public/hooks/premarket-brief",
  path: "/api/public/hooks/premarket-brief",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPremarketFinalRoute = Route$I.update({
  id: "/api/public/hooks/premarket-final",
  path: "/api/public/hooks/premarket-final",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPremarketGapAlertRoute = Route$H.update({
  id: "/api/public/hooks/premarket-gap-alert",
  path: "/api/public/hooks/premarket-gap-alert",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPremarketShortlistRoute = Route$G.update({
  id: "/api/public/hooks/premarket-shortlist",
  path: "/api/public/hooks/premarket-shortlist",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksPremarketWarmupRoute = Route$F.update({
  id: "/api/public/hooks/premarket-warmup",
  path: "/api/public/hooks/premarket-warmup",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksRecentSignalSymbolsRoute = Route$E.update({
  id: "/api/public/hooks/recent-signal-symbols",
  path: "/api/public/hooks/recent-signal-symbols",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksRunBacktestRoute = Route$D.update({
  id: "/api/public/hooks/run-backtest",
  path: "/api/public/hooks/run-backtest",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpBriefRoute = Route$C.update({
  id: "/api/public/hooks/scalp-brief",
  path: "/api/public/hooks/scalp-brief",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpCanaryRoute = Route$B.update({
  id: "/api/public/hooks/scalp-canary",
  path: "/api/public/hooks/scalp-canary",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpDipDashboardRoute = Route$A.update({
  id: "/api/public/hooks/scalp-dip-dashboard",
  path: "/api/public/hooks/scalp-dip-dashboard",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpEodReportRoute = Route$z.update({
  id: "/api/public/hooks/scalp-eod-report",
  path: "/api/public/hooks/scalp-eod-report",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpSignalLoggerRoute = Route$y.update({
  id: "/api/public/hooks/scalp-signal-logger",
  path: "/api/public/hooks/scalp-signal-logger",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpSmokeTestRoute = Route$x.update({
  id: "/api/public/hooks/scalp-smoke-test",
  path: "/api/public/hooks/scalp-smoke-test",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksScalpTimelineRoute = Route$w.update({
  id: "/api/public/hooks/scalp-timeline",
  path: "/api/public/hooks/scalp-timeline",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSelfCalibrateRoute = Route$v.update({
  id: "/api/public/hooks/self-calibrate",
  path: "/api/public/hooks/self-calibrate",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSelfImproveRoute = Route$u.update({
  id: "/api/public/hooks/self-improve",
  path: "/api/public/hooks/self-improve",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSelfTestRoute = Route$t.update({
  id: "/api/public/hooks/self-test",
  path: "/api/public/hooks/self-test",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSellWatcherRoute = Route$s.update({
  id: "/api/public/hooks/sell-watcher",
  path: "/api/public/hooks/sell-watcher",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSessionLogRoute = Route$r.update({
  id: "/api/public/hooks/session-log",
  path: "/api/public/hooks/session-log",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksShadowReportRoute = Route$q.update({
  id: "/api/public/hooks/shadow-report",
  path: "/api/public/hooks/shadow-report",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSmartExitRoute = Route$p.update({
  id: "/api/public/hooks/smart-exit",
  path: "/api/public/hooks/smart-exit",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSmartExitToggleRoute = Route$o.update({
  id: "/api/public/hooks/smart-exit-toggle",
  path: "/api/public/hooks/smart-exit-toggle",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSniperDecideRoute = Route$n.update({
  id: "/api/public/hooks/sniper-decide",
  path: "/api/public/hooks/sniper-decide",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSniperPickRoute = Route$m.update({
  id: "/api/public/hooks/sniper-pick",
  path: "/api/public/hooks/sniper-pick",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksSniperPollRoute = Route$l.update({
  id: "/api/public/hooks/sniper-poll",
  path: "/api/public/hooks/sniper-poll",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksStalePositionAlertRoute = Route$k.update({
  id: "/api/public/hooks/stale-position-alert",
  path: "/api/public/hooks/stale-position-alert",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksStrategyAdviceRoute = Route$j.update({
  id: "/api/public/hooks/strategy-advice",
  path: "/api/public/hooks/strategy-advice",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksTargetStopDetectorRoute = Route$i.update({
  id: "/api/public/hooks/target-stop-detector",
  path: "/api/public/hooks/target-stop-detector",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderAuthAlertRoute = Route$h.update({
  id: "/api/public/hooks/thunder-auth-alert",
  path: "/api/public/hooks/thunder-auth-alert",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderHealthRoute = Route$g.update({
  id: "/api/public/hooks/thunder-health",
  path: "/api/public/hooks/thunder-health",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderMarketwatchRoute = Route$f.update({
  id: "/api/public/hooks/thunder-marketwatch",
  path: "/api/public/hooks/thunder-marketwatch",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderOrdersRoute = Route$e.update({
  id: "/api/public/hooks/thunder-orders",
  path: "/api/public/hooks/thunder-orders",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderPositionsRoute = Route$d.update({
  id: "/api/public/hooks/thunder-positions",
  path: "/api/public/hooks/thunder-positions",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderQuotesRoute = Route$c.update({
  id: "/api/public/hooks/thunder-quotes",
  path: "/api/public/hooks/thunder-quotes",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderTapeRoute = Route$b.update({
  id: "/api/public/hooks/thunder-tape",
  path: "/api/public/hooks/thunder-tape",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderTicksRoute = Route$a.update({
  id: "/api/public/hooks/thunder-ticks",
  path: "/api/public/hooks/thunder-ticks",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksThunderWatchlistRoute = Route$9.update({
  id: "/api/public/hooks/thunder-watchlist",
  path: "/api/public/hooks/thunder-watchlist",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksTrailingStopRoute = Route$8.update({
  id: "/api/public/hooks/trailing-stop",
  path: "/api/public/hooks/trailing-stop",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksUpdateOutcomesRoute = Route$7.update({
  id: "/api/public/hooks/update-outcomes",
  path: "/api/public/hooks/update-outcomes",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksVacuumCleanupRoute = Route$6.update({
  id: "/api/public/hooks/vacuum-cleanup",
  path: "/api/public/hooks/vacuum-cleanup",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksVacuumOnlyRoute = Route$5.update({
  id: "/api/public/hooks/vacuum-only",
  path: "/api/public/hooks/vacuum-only",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksVolumeSpikeRoute = Route$4.update({
  id: "/api/public/hooks/volume-spike",
  path: "/api/public/hooks/volume-spike",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksWalkForwardRoute = Route$3.update({
  id: "/api/public/hooks/walk-forward",
  path: "/api/public/hooks/walk-forward",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksWeeklyDeepLearnRoute = Route$2.update({
  id: "/api/public/hooks/weekly-deep-learn",
  path: "/api/public/hooks/weekly-deep-learn",
  getParentRoute: () => Route$2j
});
const ApiPublicHooksWeeklyLearningRoute = Route$1.update({
  id: "/api/public/hooks/weekly-learning",
  path: "/api/public/hooks/weekly-learning",
  getParentRoute: () => Route$2j
});
const ApiPublicTelegramWebhookRoute = Route.update({
  id: "/api/public/telegram/webhook",
  path: "/api/public/telegram/webhook",
  getParentRoute: () => Route$2j
});
const rootRouteChildren = {
  IndexRoute,
  ActivityRoute,
  AiSupervisorRoute,
  AutomationRoute,
  BacktestRoute,
  DailyRoute,
  DecisionEngineRoute,
  DeepRoute,
  ExecutionLabRoute,
  ExtDiagRoute,
  ExtensionTelemetryRoute,
  HalalDaytradeRoute,
  HealthRoute,
  HealthCheckRoute,
  InvestmentRoute,
  LearningRoute,
  MarketwatchHealthRoute,
  MissedSignalsRoute,
  MorningRoute,
  PaperRoute,
  PerformanceRoute,
  PingRoute,
  PlanRoute,
  PositionsRoute,
  RealityRoute,
  ReconciliationRoute,
  RightsRoute,
  ScalpRoute,
  ScalpDipRoute,
  ScalpFeasibilityRoute,
  ScalpFreshRoute,
  SessionLogRoute,
  ShadowReportRoute,
  SignalQualityRoute,
  SlippageReportRoute,
  SniperRoute,
  ThrottleTestRoute,
  ThunderRoute,
  ThunderLiveRoute,
  ThunderTabsRoute,
  TiersRoute,
  TodayRoute,
  TomorrowRoute,
  TrackRecordRoute,
  TradeLifecycleRoute,
  StockSymbolRoute,
  ApiPublicHooksAggregateIntradayCandlesRoute,
  ApiPublicHooksAiSupervisorFeedRoute,
  ApiPublicHooksAiSupervisorIdentityRoute,
  ApiPublicHooksArchiveFolderRoute,
  ApiPublicHooksArchiveTriggerRoute,
  ApiPublicHooksAutoBacktestRoute,
  ApiPublicHooksAutoRetrainRoute,
  ApiPublicHooksBackfillTiersRoute,
  ApiPublicHooksCollectionStatusRoute,
  ApiPublicHooksCollectionWatchdogRoute,
  ApiPublicHooksComputeScalpFeasibilityRoute,
  ApiPublicHooksDailyPickRoute,
  ApiPublicHooksDailyScanRoute,
  ApiPublicHooksDataFreshnessRoute,
  ApiPublicHooksDbSizeRoute,
  ApiPublicHooksDrawdownGuardRoute,
  ApiPublicHooksEnrichNewsMubasherRoute,
  ApiPublicHooksEnrichNewsRssRoute,
  ApiPublicHooksEodLearnRoute,
  ApiPublicHooksEodRecapRoute,
  ApiPublicHooksExportBinaryRoute,
  ApiPublicHooksExportDirectRoute,
  ApiPublicHooksExportHistoryRoute,
  ApiPublicHooksExtDiagRoute,
  ApiPublicHooksExtensionTelemetryRoute,
  ApiPublicHooksExtensionTradesRoute,
  ApiPublicHooksFetchFundamentalsRoute,
  ApiPublicHooksFetchMacroRoute,
  ApiPublicHooksFetchNewsAllRoute,
  ApiPublicHooksForecastNewsImpactsRoute,
  ApiPublicHooksHealthCheckRoute,
  ApiPublicHooksHourlyPulseRoute,
  ApiPublicHooksInstantTrainRoute,
  ApiPublicHooksIntradayBreakoutScanRoute,
  ApiPublicHooksL2CoverageTestRoute,
  ApiPublicHooksL2HealthCheckRoute,
  ApiPublicHooksLivePickMonitorRoute,
  ApiPublicHooksLivePriceStatusRoute,
  ApiPublicHooksLiveSignalScanRoute,
  ApiPublicHooksLiveTickPollRoute,
  ApiPublicHooksMarketOpenCheckRoute,
  ApiPublicHooksMarketStateRoute,
  ApiPublicHooksMarketwatchHealthRoute,
  ApiPublicHooksMomentumWeeklyRunRoute,
  ApiPublicHooksMonitorRoute,
  ApiPublicHooksNewsWatchdogRoute,
  ApiPublicHooksOrderPlacedRoute,
  ApiPublicHooksOrderUpdateRoute,
  ApiPublicHooksOrderbookSnapshotRoute,
  ApiPublicHooksOutcomeLoopRoute,
  ApiPublicHooksPaperScalpRoute,
  ApiPublicHooksPaperScalpDipRoute,
  ApiPublicHooksPaperScalpFreshRoute,
  ApiPublicHooksPerformanceDigestRoute,
  ApiPublicHooksPingRoute,
  ApiPublicHooksPremarketBriefRoute,
  ApiPublicHooksPremarketFinalRoute,
  ApiPublicHooksPremarketGapAlertRoute,
  ApiPublicHooksPremarketShortlistRoute,
  ApiPublicHooksPremarketWarmupRoute,
  ApiPublicHooksRecentSignalSymbolsRoute,
  ApiPublicHooksRunBacktestRoute,
  ApiPublicHooksScalpBriefRoute,
  ApiPublicHooksScalpCanaryRoute,
  ApiPublicHooksScalpDipDashboardRoute,
  ApiPublicHooksScalpEodReportRoute,
  ApiPublicHooksScalpSignalLoggerRoute,
  ApiPublicHooksScalpSmokeTestRoute,
  ApiPublicHooksScalpTimelineRoute,
  ApiPublicHooksSelfCalibrateRoute,
  ApiPublicHooksSelfImproveRoute,
  ApiPublicHooksSelfTestRoute,
  ApiPublicHooksSellWatcherRoute,
  ApiPublicHooksSessionLogRoute,
  ApiPublicHooksShadowReportRoute,
  ApiPublicHooksSmartExitRoute,
  ApiPublicHooksSmartExitToggleRoute,
  ApiPublicHooksSniperDecideRoute,
  ApiPublicHooksSniperPickRoute,
  ApiPublicHooksSniperPollRoute,
  ApiPublicHooksStalePositionAlertRoute,
  ApiPublicHooksStrategyAdviceRoute,
  ApiPublicHooksTargetStopDetectorRoute,
  ApiPublicHooksThunderAuthAlertRoute,
  ApiPublicHooksThunderHealthRoute,
  ApiPublicHooksThunderMarketwatchRoute,
  ApiPublicHooksThunderOrdersRoute,
  ApiPublicHooksThunderPositionsRoute,
  ApiPublicHooksThunderQuotesRoute,
  ApiPublicHooksThunderTapeRoute,
  ApiPublicHooksThunderTicksRoute,
  ApiPublicHooksThunderWatchlistRoute,
  ApiPublicHooksTrailingStopRoute,
  ApiPublicHooksUpdateOutcomesRoute,
  ApiPublicHooksVacuumCleanupRoute,
  ApiPublicHooksVacuumOnlyRoute,
  ApiPublicHooksVolumeSpikeRoute,
  ApiPublicHooksWalkForwardRoute,
  ApiPublicHooksWeeklyDeepLearnRoute,
  ApiPublicHooksWeeklyLearningRoute,
  ApiPublicTelegramWebhookRoute
};
const routeTree = Route$2j._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  BACKTEST_MAXDD_PCT as A,
  BACKTEST_WEEKLY_EGP_LOW as B,
  CURRENT_REGIME_WEEKLY_LOW_EGP as C,
  DATA_TABLE_NAMES as D,
  ErrorView as E,
  BACKTEST_DISCLAIMER_AR as F,
  computeScalpFeasibility as G,
  getTodayPick as H,
  getTomorrowPicks as I,
  dashboardBuilder as J,
  router as K,
  Route$1B as R,
  activityQO as a,
  deepQueryOptions as b,
  createSsrRpc as c,
  deletePosition as d,
  opts as e,
  getMorningBrief as f,
  getDailyOnePercent as g,
  positionsQO as h,
  dailyPnlQO as i,
  evaluatePositions as j,
  acknowledgeAlert as k,
  closePosition as l,
  rightsQuery as m,
  alertBeep as n,
  openPosition as o,
  perfQO as p,
  ensureAudioUnlock as q,
  realityQuery as r,
  snapshotQO as s,
  fmtPrice as t,
  useServerFn as u,
  beep as v,
  CURRENT_REGIME_WEEKLY_HIGH_EGP as w,
  BACKTEST_WEEKLY_EGP_HIGH as x,
  BACKTEST_WEEKLY_EGP as y,
  BACKTEST_WORST_WEEK_PCT as z
};
