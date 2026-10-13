import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { D as DATA_TABLE_NAMES } from "./router-BYsPPCpA.mjs";
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
import "../_libs/tanstack__react-query.mjs";
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
function Page() {
  const [h, setH] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  const [tick, setTick] = reactExports.useState(0);
  const [busy, setBusy] = reactExports.useState(null);
  const [marketOpen, setMarketOpen] = reactExports.useState(false);
  const [authAlert, setAuthAlert] = reactExports.useState(null);
  const [storageInfo, setStorageInfo] = reactExports.useState(null);
  const [storageError, setStorageError] = reactExports.useState(null);
  const fetchStorageSize = async () => {
    try {
      const res = await fetch("/api/public/hooks/db-size");
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed to fetch storage size");
      const used_mb = Math.round(data.total_bytes / 1024 / 1024);
      const limit_mb = 500;
      const percent = Math.round(used_mb / limit_mb * 100);
      let level = "green";
      let message = "";
      if (used_mb >= 450) {
        level = "red";
        message = "عاجل: لازم تنزّل البيانات دلوقتي قبل ما تمتلئ المساحة";
      } else if (used_mb >= 350) {
        level = "yellow";
        message = "قرّب الوقت لتنزيل البيانات من Supabase للهارد";
      }
      setStorageInfo({
        total_bytes: data.total_bytes,
        human_size: data.human_size,
        used_mb,
        percent,
        level,
        message
      });
      setStorageError(null);
    } catch (e) {
      setStorageError(String(e?.message || e).slice(0, 200));
    }
  };
  reactExports.useEffect(() => {
    fetchStorageSize();
    const interval = setInterval(fetchStorageSize, 3 * 60 * 1e3);
    return () => clearInterval(interval);
  }, []);
  const isEgxOpen = () => {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Cairo",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).formatToParts(/* @__PURE__ */ new Date());
    const wd = parts.find((p) => p.type === "weekday")?.value || "";
    const hh = Number(parts.find((p) => p.type === "hour")?.value || 0);
    const mm = Number(parts.find((p) => p.type === "minute")?.value || 0);
    const dayOk = ["Sun", "Mon", "Tue", "Wed", "Thu"].includes(wd);
    const mins = hh * 60 + mm;
    return dayOk && mins >= 600 && mins <= 870;
  };
  reactExports.useEffect(() => {
    let alive = true;
    let abortMain = null;
    let abortAuth = null;
    setMarketOpen(isEgxOpen());
    const load = async () => {
      abortMain = new AbortController();
      try {
        const r = await fetch("/api/public/hooks/marketwatch-health", {
          cache: "no-store",
          signal: abortMain.signal
        });
        const j = await r.json();
        if (alive) {
          setH(j);
          setErr(null);
          firstLoadDone = true;
        }
      } catch (e) {
        if (alive && e.name !== "AbortError") setErr(e.message);
      }
    };
    let firstLoadDone = false;
    load();
    const iv = setInterval(() => {
      if (isEgxOpen()) load();
    }, 1e3);
    const loadAuth = async () => {
      if (!alive) return;
      abortAuth = new AbortController();
      try {
        await new Promise((r2) => setTimeout(r2, 0));
        if (!alive) return;
        const r = await fetch("/api/public/hooks/thunder-auth-alert", {
          cache: "no-store",
          signal: abortAuth.signal
        });
        const j = await r.json();
        if (alive) setAuthAlert({
          latest: j.latest,
          age_seconds: j.age_seconds
        });
      } catch (e) {
        if (alive && e.name !== "AbortError") {
          console.debug("[thunder-auth-alert] skipped:", e.message);
        }
      }
    };
    const startAuthPolling = () => {
      loadAuth();
      const ivAuth2 = setInterval(loadAuth, 15e3);
      return ivAuth2;
    };
    let ivAuth = null;
    const checkAndStartAuth = setInterval(() => {
      if (firstLoadDone) {
        clearInterval(checkAndStartAuth);
        ivAuth = startAuthPolling();
      }
    }, 500);
    const t = setInterval(() => {
      const open = isEgxOpen();
      setMarketOpen(open);
      if (open) setTick((x) => x + 1);
    }, 1e3);
    return () => {
      alive = false;
      abortMain?.abort();
      abortAuth?.abort();
      clearInterval(iv);
      clearInterval(checkAndStartAuth);
      if (ivAuth) clearInterval(ivAuth);
      clearInterval(t);
    };
  }, []);
  const liveAge = h?.last_captured_at ? Math.round((Date.now() - new Date(h.last_captured_at).getTime()) / 1e3) : null;
  const tickAge = h?.live_ticks?.last_ts ? Math.round((Date.now() - new Date(h.live_ticks.last_ts).getTime()) / 1e3) : null;
  const TICK_FRESH_WINDOW_SEC = 1800;
  const isPriceLive = marketOpen && tickAge != null && tickAge <= TICK_FRESH_WINDOW_SEC;
  const healthWindow = h?.window_seconds ?? 150;
  const isMarketwatchVolumeConfirmed = marketOpen && (h?.marketwatch_volume_confirmed === true || liveAge != null && liveAge <= healthWindow && (h?.last_60s.with_volume ?? 0) > 0);
  const isMarketwatchBidAskConfirmed = marketOpen && liveAge != null && liveAge <= healthWindow && (h?.marketwatch_bid_ask?.with_bid_ask ?? 0) > 0;
  const isVolumeConfirmed = marketOpen && (isMarketwatchVolumeConfirmed || h?.live_ticks?.volume_confirmed === true);
  const toggle = async (key, next) => {
    setBusy(key);
    try {
      await fetch("/api/public/hooks/smart-exit-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          key,
          enabled: next
        })
      });
    } finally {
      setBusy(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { dir: "rtl", className: "min-h-screen bg-background p-6 font-sans", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("header", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold", children: "فحص Volume وBid/Ask لحظي" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm", children: [
        storageInfo && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${storageInfo.level === "green" ? "bg-green-100 text-green-800" : storageInfo.level === "yellow" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800 animate-pulse"}`, title: `المستخدمة: ${storageInfo.human_size} (${storageInfo.percent}%)`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-2 w-2 rounded-full bg-current" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "سعة Supabase: ",
            storageInfo.used_mb,
            " MB / 500 MB (",
            storageInfo.percent,
            "%)"
          ] }),
          storageInfo.message && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: storageInfo.message })
        ] }),
        storageError && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex h-2 w-2 rounded-full bg-current" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "تعذر قراءة سعة التخزين" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/shadow-report", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "📊 Shadow Report" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/trade-lifecycle", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "🔎 Trade Lifecycle" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/slippage-report", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "📐 Slippage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/missed-signals", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "🎯 Missed Signals" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/decision-engine", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "🧠 Decision Engine" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/reconciliation", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "📒 Reconciliation" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/signal-quality", className: "rounded border px-2 py-1 text-xs hover:bg-muted", children: "⭐ Signal Quality" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `inline-block h-3 w-3 rounded-full ${!marketOpen ? "bg-gray-500" : isPriceLive ? "animate-pulse bg-green-500" : "bg-red-500"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: !marketOpen ? "السوق مغلق · آخر بيانات محفوظة" : `${isPriceLive ? "السعر متصل" : "السعر غير متصل"} · تحديث كل ثانية · ${tick}` })
      ] })
    ] }),
    err && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 p-4 text-red-500", children: [
      "خطأ: ",
      err
    ] }),
    authAlert?.latest && authAlert.age_seconds != null && authAlert.age_seconds <= 300 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "animate-pulse rounded-lg border-2 border-red-600 bg-red-600/15 p-4 text-red-500", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: "🚨 انتهت جلسة ثاندر — سجّل دخول فوراً" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-sm", children: [
        "آخر تنبيه من ",
        authAlert.age_seconds,
        "ث ·",
        " ",
        authAlert.latest.message ?? authAlert.latest.kind
      ] }),
      authAlert.latest.url && /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: authAlert.latest.url, target: "_blank", rel: "noreferrer", className: "mt-2 inline-block rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700", children: "افتح تاب ثاندر" })
    ] }),
    h && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `rounded-lg border p-4 text-lg font-semibold ${!marketOpen ? "border-gray-500/40 bg-gray-500/10 text-muted-foreground" : isVolumeConfirmed ? "border-green-500/40 bg-green-500/10 text-green-600" : isPriceLive ? "border-green-500/40 bg-green-500/10 text-green-600" : "border-yellow-500/40 bg-yellow-500/10 text-yellow-600"}`, children: !marketOpen ? "🌙 السوق مغلق — البيانات المعروضة هي آخر snapshot محفوظ" : h.verdict }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 md:grid-cols-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "إجمالي الأسهم المرصودة (Raw Scan)", value: String(h.raw_scan_count ?? 0), good: (h.raw_scan_count ?? 0) >= 100 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "عمر آخر سعر حي (الإكستنشن)", value: !marketOpen || h.live_price_coverage?.age_seconds == null ? "—" : `${h.live_price_coverage?.age_seconds}ث`, good: marketOpen ? (h.live_price_coverage?.age_seconds ?? 9999) <= 120 : void 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `جسر TV بدون جهاز/${healthWindow}ث`, value: String(h.tv_bridge?.distinct_symbols_60s ?? 0), good: h.tv_bridge?.fresh === true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `قديم/معطل — أسهم Firebase/Ticks فقط (${h.live_ticks?.age_seconds != null ? h.live_ticks.age_seconds + "ث" : "—"})`, value: String(h.live_ticks?.distinct_symbols_60s ?? 0), good: marketOpen ? (h.live_ticks?.distinct_symbols_60s ?? 0) > 0 : void 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `تغطية الأسعار المجمعة (كل المصادر/${h.live_price_coverage?.window_seconds ?? 900}ث)`, value: String(h.live_price_coverage?.symbols ?? 0), good: (h.live_price_coverage?.symbols ?? 0) >= 100 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `تغطية Marketwatch الفعالة`, value: `${h.universe.covered} / ${h.universe.total_sharia}`, good: isVolumeConfirmed }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `Marketwatch/${healthWindow}ث`, value: `${h.universe.covered} / ${h.universe.total_sharia}`, good: h.universe.coverage_pct >= 40 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `L2/${healthWindow}ث`, value: String(h.orderbook?.distinct_symbols_window ?? 0), good: (h.orderbook?.distinct_symbols_window ?? 0) > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `Bid/Ask Marketwatch/${healthWindow}ث`, value: String(h.marketwatch_bid_ask?.with_bid_ask ?? 0), good: isMarketwatchBidAskConfirmed }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: `قديم/معطل — Bid/Ask Firebase/${healthWindow}ث`, value: String(h.live_quotes?.with_bid_ask_window ?? 0) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Marketwatch فيه volume", value: String(h.last_60s.with_volume), good: h.last_60s.with_volume > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "Marketwatch فيه سعر", value: String(h.last_60s.with_price), good: h.last_60s.with_price > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "نفس يوم التداول", value: String(h.last_60s.same_day ?? 0), good: (h.last_60s.same_day ?? 0) > 0 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "صفوف/90ث", value: String(h.last_60s.rows) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "صفوف/5د", value: String(h.last_5m.rows) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "متوقع/5د", value: `~${h.last_5m.expected_approx}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Stat, { label: "تغطية", value: `${h.universe.coverage_pct}%`, good: h.universe.coverage_pct >= 40 })
      ] }),
      h.universe.missing_sample.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 text-sm text-muted-foreground", children: [
          "أسهم مش موصلة (",
          h.universe.missing_count,
          ") — أول 20:"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1 text-xs", children: h.universe.missing_sample.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-2 py-1 font-mono", children: s }, s)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
        "آخر captured_at: ",
        h.last_captured_at ?? "لا يوجد"
      ] }),
      marketOpen && !isVolumeConfirmed && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm leading-7 text-yellow-600", children: "السعر الحي واصل من ثاندر، لكن لا يوجد Marketwatch Volume مؤكد حتى الآن. الإصدار v4.6.2 Ultimate Safe يجلب البيانات مباشرة من API ثاندر لضمان تغطية 100% للسوق؛ تأكد من تحميل الإصدار الجديد من صفحة الإكستنشن." }),
      h.smart_exit && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 rounded-lg border p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-lg font-bold", children: "🧠 النظام الذكي للخروج" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded px-2 py-0.5 text-xs ${!h.smart_exit.flags.enabled ? "bg-red-500/20 text-red-500" : h.smart_exit.flags.shadow ? "bg-yellow-500/20 text-yellow-600" : "bg-green-500/20 text-green-600"}`, children: !h.smart_exit.flags.enabled ? "⏸ متوقف" : h.smart_exit.flags.shadow ? "👁 وضع ظلي (تسجيل فقط)" : "▶ نشط" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRow, { label: "تفعيل النظام الذكي", desc: "الـ Kill Switch الرئيسي", on: h.smart_exit.flags.enabled, busy: busy === "scalp-dip-smart-exit", onToggle: () => toggle("scalp-dip-smart-exit", !h.smart_exit.flags.enabled) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRow, { label: "الوضع الظلي", desc: "سجّل بس، متنفذش", on: h.smart_exit.flags.shadow, busy: busy === "scalp-dip-smart-exit-shadow", onToggle: () => toggle("scalp-dip-smart-exit-shadow", !h.smart_exit.flags.shadow) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ToggleRow, { label: "فلتر الفوليوم قبل الشراء", desc: "تجاهل الأسهم الميتة", on: h.smart_exit.flags.prebuy, busy: busy === "scalp-dip-prebuy-volume-filter", onToggle: () => toggle("scalp-dip-prebuy-volume-filter", !h.smart_exit.flags.prebuy) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 text-center text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-muted p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "إشارات مرفوضة (فوليوم)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: h.smart_exit.today_counts.PREBUY_VOLUME_FILTER })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-muted p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Hard Floor" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: h.smart_exit.today_counts.HARD_FLOOR })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-muted p-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "Volume Death" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: h.smart_exit.today_counts.VOLUME_DEATH })
          ] })
        ] }),
        h.smart_exit.recent.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 text-xs text-muted-foreground", children: "آخر 15 قرار:" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-auto rounded border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "الوقت" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "السهم" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "القاعدة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "الإجراء" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "P&L" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "Trades/5د" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: h.smart_exit.recent.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 font-mono", children: new Date(r.ts).toLocaleTimeString("ar-EG") }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 font-mono font-bold", children: r.symbol }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: r.rule }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: `p-1 ${r.shadow ? "text-yellow-600" : "text-red-500"}`, children: r.action }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 tabular-nums", children: r.pnl_pct != null ? `${(r.pnl_pct * 100).toFixed(2)}%` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 tabular-nums", children: r.mw_trades_5m ?? "—" })
            ] }, i)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded bg-muted/50 p-2 text-xs leading-6 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("b", { children: "القواعد:" }),
          " Hard Floor خروج فوري لو الخسارة ≥ 1.5% · Volume Death خروج breakeven لو عدّى 10د بدون trades · فلتر الفوليوم يتجاهل الإشارات في الأسهم الميتة قبل الدخول. ابدأ بالوضع الظلي أسبوع للمقارنة قبل التفعيل الحقيقي."
        ] })
      ] })
    ] }),
    !h && !err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-muted-foreground", children: "جاري التحميل…" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 border-t border-border/60 pt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryExportSection, {}) })
  ] }) });
}
function Stat({
  label,
  value,
  good
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-xl font-bold tabular-nums ${good === true ? "text-green-600" : good === false ? "text-red-500" : ""}`, children: value })
  ] });
}
function ToggleRow({
  label,
  desc,
  on,
  busy,
  onToggle
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: onToggle, disabled: busy, className: `flex flex-col items-start gap-1 rounded-lg border p-3 text-right transition ${on ? "border-green-500/40 bg-green-500/10" : "border-red-500/40 bg-red-500/10"} ${busy ? "opacity-50" : "hover:brightness-110"}`, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex w-full items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-semibold", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs ${on ? "text-green-600" : "text-red-500"}`, children: on ? "ON" : "OFF" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: desc })
  ] });
}
const EXPORT_TABLES = DATA_TABLE_NAMES;
function todayStr() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function addDaysStr(iso, n) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
function HistoryExportSection() {
  const [open, setOpen] = reactExports.useState(false);
  const [tables, setTables] = reactExports.useState(["live_ticks"]);
  const [mode, setMode] = reactExports.useState("single");
  const [singleDate, setSingleDate] = reactExports.useState(todayStr());
  const [lastN, setLastN] = reactExports.useState(7);
  const [customStart, setCustomStart] = reactExports.useState(addDaysStr(todayStr(), -7));
  const [customEnd, setCustomEnd] = reactExports.useState(todayStr());
  const exportMode = "unified";
  const [busy, setBusy] = reactExports.useState(false);
  const [err, setErr] = reactExports.useState(null);
  const [local, setLocal] = reactExports.useState(null);
  const [summary, setSummary] = reactExports.useState(null);
  const [saved, setSaved] = reactExports.useState([]);
  const [directSelect, setDirectSelect] = reactExports.useState("core");
  const [isArchiving, setIsArchiving] = reactExports.useState(false);
  const [archiveReady, setArchiveReady] = reactExports.useState(null);
  const [archiveProgress, setArchiveProgress] = reactExports.useState([]);
  const [archiveError, setArchiveError] = reactExports.useState(null);
  const [isFullCleaning, setIsFullCleaning] = reactExports.useState(false);
  const [fullCleanError, setFullCleanError] = reactExports.useState(null);
  const [fullCleanProgress, setFullCleanProgress] = reactExports.useState([]);
  reactExports.useEffect(() => {
    fetch("/api/public/hooks/export-history", {
      cache: "no-store"
    }).then((r) => r.json()).then((j) => setLocal(j?.local === true)).catch(() => setLocal(false));
  }, []);
  reactExports.useEffect(() => {
    fetch("/api/public/hooks/archive-trigger", {
      cache: "no-store"
    }).then((r) => setArchiveReady(r.ok)).catch(() => setArchiveReady(false));
  }, []);
  const startDate = mode === "single" ? singleDate : mode === "last" ? addDaysStr(todayStr(), -(Math.max(1, Math.min(180, lastN)) - 1)) : customStart;
  const endDate = mode === "single" ? singleDate : mode === "last" ? todayStr() : customEnd;
  const toggleTable = (t) => {
    if (t === "all") {
      setTables(tables.length === EXPORT_TABLES.length ? [] : [...EXPORT_TABLES]);
    } else {
      setTables((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
    }
  };
  const run = async () => {
    console.log("[export] handler-start-ms", Date.now(), {
      mode,
      startDate,
      endDate,
      tables,
      exportMode
    });
    if (startDate > endDate) {
      console.error("[export] INVALID_RANGE rejected before fetch:", {
        startDate,
        endDate
      });
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      setBusy(false);
      return;
    }
    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    let res = null;
    try {
      console.log("[export] about-to-fetch-ms", Date.now(), JSON.stringify({
        startDate,
        endDate,
        tables,
        mode: exportMode
      }));
      res = await fetch("/api/public/hooks/export-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tables,
          start: startDate,
          end: endDate,
          mode: exportMode
        })
      });
      console.log("[export] fetch-done-ms", Date.now());
      console.log("[export] response-status", res.status);
      const j = await res.json();
      console.log("[export] json-rows", j.tables?.reduce((n, t) => n + (t.rows || 0), 0) ?? 0);
      setSummary(j);
      if (!j.ok) {
        setErr(j.reason || "تصدير فشل — حاول اختيار جداول وتواريخ أقل.");
        return;
      }
      if (j.unifiedCsv) {
        const blob = new Blob([j.unifiedCsv], {
          type: "text/csv"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "unified_export.csv";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5e3);
        setSaved(["unified_export.csv"]);
      }
      if (j.qualityCsv) {
        const qBlob = new Blob([(j.qualityReadme ? j.qualityReadme.split("\n").map((l) => "# " + l).join("\n") + "\n\n" : "") + j.qualityCsv], {
          type: "text/csv"
        });
        const qUrl = URL.createObjectURL(qBlob);
        const qa = document.createElement("a");
        qa.href = qUrl;
        qa.download = `data_quality_${startDate}_to_${endDate}.csv`;
        qa.click();
        setTimeout(() => URL.revokeObjectURL(qUrl), 5e3);
        setSaved((prev) => [...prev, `data_quality_${startDate}_to_${endDate}.csv`]);
      }
    } catch (e) {
      console.error("[export] fetch-error", e);
      setErr(String(e?.message || e));
    } finally {
      console.log("[export] handler-done-ms", Date.now());
      setBusy(false);
    }
  };
  const runDirect = async () => {
    if (startDate > endDate) {
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      return;
    }
    if (!tables.length) {
      setErr("لم تختر أي جدول للتصدير.");
      return;
    }
    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    try {
      const res = await fetch("/api/public/hooks/export-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tables,
          start: startDate,
          end: endDate,
          select: directSelect
        })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setErr(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const blob = await res.blob();
      const sizeMb = (blob.size / 1024 / 1024).toFixed(1);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const ext = directSelect === "all" ? "csv" : "csv";
      a.download = `historical_${directSelect}_${startDate}_to_${endDate}.${ext}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      setSaved([`historical_${directSelect}_${startDate}_to_${endDate}.${ext}`]);
      console.log("[export-direct] saved", sizeMb, "MB, mode =", directSelect);
    } catch (e) {
      console.error("[export-direct] error", e);
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };
  const runBinary = async () => {
    if (startDate > endDate) {
      setErr("نطاق التاريخ غير صالح: البداية بعد النهاية.");
      return;
    }
    if (!tables.length) {
      setErr("لم تختر أي جدول للتصدير.");
      return;
    }
    setBusy(true);
    setErr(null);
    setSummary(null);
    setSaved([]);
    try {
      const res = await fetch("/api/public/hooks/export-binary", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tables,
          start: startDate,
          end: endDate
        })
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setErr(`HTTP ${res.status}: ${txt.slice(0, 200)}`);
        return;
      }
      const blob = await res.blob();
      const sizeMb = (blob.size / 1024 / 1024).toFixed(2);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `historical_${startDate}_to_${endDate}.mkb2`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5e3);
      setSaved([`historical_${startDate}_to_${endDate}.mkb2`]);
      console.log("[export-binary] saved", sizeMb, "MB, MKB2 format");
    } catch (e) {
      console.error("[export-binary] error", e);
      setErr(String(e?.message || e));
    } finally {
      setBusy(false);
    }
  };
  const runFullClean = async () => {
    setIsFullCleaning(true);
    setFullCleanError(null);
    setFullCleanProgress([]);
    const url = `/api/public/hooks/vacuum-cleanup?dryRun=false`;
    let reader = null;
    try {
      const res = await fetch(url, {
        method: "POST"
      });
      if (!res.ok) {
        setFullCleanError(`HTTP ${res.status}: ${res.statusText}`);
        return;
      }
      if (!res.body) {
        setFullCleanError("استجابة بدون محتوى - تعذر بدء البث.");
        return;
      }
      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const line = event.trim();
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              setFullCleanProgress((prev) => [...prev, parsed]);
            } catch {
            }
          }
        }
      }
    } catch (e) {
      setFullCleanError(String(e?.message || e));
    } finally {
      reader?.releaseLock();
      setIsFullCleaning(false);
    }
  };
  const runArchive = async (dryRun) => {
    setIsArchiving(true);
    setArchiveError(null);
    setArchiveProgress([]);
    const url = `/api/public/hooks/archive-trigger?dry_run=${dryRun}`;
    let reader = null;
    try {
      const res = await fetch(url, {
        method: "POST"
      });
      if (!res.ok) {
        setArchiveError(`HTTP ${res.status}: ${res.statusText}`);
        return;
      }
      if (!res.body) {
        setArchiveError("استجابة بدون محتوى — تعذر بدء البث.");
        return;
      }
      reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const {
          done,
          value
        } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, {
          stream: true
        });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const event of events) {
          const line = event.trim();
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              setArchiveProgress((prev) => [...prev, parsed]);
            } catch {
            }
          } else if (line.startsWith("event: error")) {
            setArchiveError("خطأ في البث من الخادم");
          }
        }
      }
    } catch (e) {
      setArchiveError(String(e?.message || e));
    } finally {
      reader?.releaseLock();
      setIsArchiving(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border bg-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen((o) => !o), className: "flex w-full items-center justify-between rounded-lg border border-border/40 bg-muted/40 px-3 py-2 text-right font-semibold", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "📦 تصدير بيانات تاريخية (Historical Data Export)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: open ? "▲" : "▼" })
    ] }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 space-y-2", children: [
      local === false && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-3 text-sm leading-6 text-yellow-600", children: "هذه الميزة تعمل محليًا فقط (bun run dev). على موقع Render/الإنتاج لن تعمل نوافذ اختيار الملفات أو قراءة القرص D:. شغّل الموقع محليًا ثم عد هنا لاستخدام التصدير." }),
      local === true && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mb-1", children: "اختر الجداول:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleTable("all"), className: `rounded border px-2 py-1 text-xs ${tables.length === EXPORT_TABLES.length ? "bg-blue-500/20 text-blue-600" : "bg-muted/40 text-muted-foreground"}`, children: "الكل" }),
          EXPORT_TABLES.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => toggleTable(t), className: `rounded border px-2 py-1 text-xs ${tables.includes(t) ? "bg-blue-500/20 text-blue-600" : "bg-muted/40 text-muted-foreground"}`, children: t }, t))
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "نمط المدى:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode("single"), className: `rounded border px-2 py-1 text-xs ${mode === "single" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`, children: "يوم واحد" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode("last"), className: `rounded border px-2 py-1 text-xs ${mode === "last" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`, children: "آخر N يوم" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setMode("custom"), className: `rounded border px-2 py-1 text-xs ${mode === "custom" ? "bg-blue-500/20 text-blue-600" : "bg-muted/40"}`, children: "مدى مخصص" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-2 text-xs", children: [
          mode === "single" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
            "التاريخ:",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: singleDate, onChange: (e) => setSingleDate(e.target.value), className: "ml-2 rounded border bg-muted px-2 py-1" })
          ] }),
          mode === "last" && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { children: [
            "آخر",
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 1, max: 180, value: lastN, onChange: (e) => setLastN(Number(e.target.value)), className: "w-16 rounded border bg-muted px-2 py-1 ml-2" }),
            "يوم"
          ] }),
          mode === "custom" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "من:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: customStart, onChange: (e) => setCustomStart(e.target.value), className: "rounded border bg-muted px-2 py-1" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("label", { children: "إلى:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "date", value: customEnd, onChange: (e) => setCustomEnd(e.target.value), className: "rounded border bg-muted px-2 py-1" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: run, disabled: busy || !tables.length, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50", children: busy ? "جارٍ التصدير…" : "تصدير" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runDirect, disabled: busy || !tables.length, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50", title: "تنزيل streaming مباشر من القرص — CSV + gzip (~138 MB لـ 10 أيام × 6 جداول)", children: busy ? "جارٍ التنزيل المباشر…" : "⬇ تنزيل مباشر (CSV.gz)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runBinary, disabled: busy || !tables.length, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50", title: "تنزيل MKB2 (custom binary, columnar + dictionary + zlib) — أصغر بكثير من CSV.gz، lossless 100%، بدون استهلاك ذاكرة على السيرفر", children: busy ? "جارٍ التنزيل المضغوط…" : "⬇ تنزيل مضغوط جداً (MKB2)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: "مستوى البيانات في الملف:" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDirectSelect("all"), className: `rounded border px-2 py-1 text-xs ${directSelect === "all" ? "bg-emerald-500/20 text-emerald-600" : "bg-muted/40 text-muted-foreground"}`, title: "كل الأعمدة (138 MB gz لـ 10 أيام × 6 جداول)", children: "كل البيانات" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDirectSelect("core"), className: `rounded border px-2 py-1 text-xs ${directSelect === "core" ? "bg-emerald-500/20 text-emerald-600" : "bg-muted/40 text-muted-foreground"}`, title: "بدون JSON/metadata — id+symbol+prices+volume+ts (11 MB gz)", children: "بدون بيانات وصفية" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setDirectSelect("minimal"), className: `rounded border px-2 py-1 text-xs ${directSelect === "minimal" ? "bg-emerald-500/20 text-emerald-600" : "bg-muted/40 text-muted-foreground"}`, title: "أعمدة أساسية فقط — id+symbol+price+volume+ts (9 MB gz)", children: "أعمدة أساسية" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-border/40 space-y-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-muted-foreground", children: "أرشفة (يصدّر صفوف أقدم من 48h إلى CSV.gz ثم يحذفها)" }),
          archiveReady === false && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-2 text-xs text-yellow-600", children: "ميزة الأرشفة غير متاحة في هذه البيئة." }),
          archiveReady === true && !isArchiving && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => runArchive(true), disabled: isArchiving, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50", children: "أرشفة تجريبية (بدون حذف)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => runArchive(false), disabled: isArchiving, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50", children: "أرشفة وحذف" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-border/40", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold text-muted-foreground mb-1", children: "تنظيف شامل (ينزّل كل البيانات ثم VACUUM FULL)" }),
            archiveReady === true && !isFullCleaning && !isArchiving && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: runFullClean, className: "w-full rounded px-3 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50", children: "تنظيف شامل + أرشفة" }),
            isFullCleaning && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-green-600", children: [
              "جارٍ التنظيف الشامل... ",
              fullCleanProgress.length,
              " حدثًا"
            ] }),
            fullCleanError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500", children: fullCleanError }),
            fullCleanProgress.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto rounded border border-border/40 bg-muted/30 p-2 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono whitespace-pre-wrap", children: fullCleanProgress.map((evt, i) => {
              if (evt.type === "connected") return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "🔌 متصل - التنظيف الشامل" }, i);
              if (evt.type === "table_start") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "📊 [",
                evt.currentTable,
                "/",
                evt.totalTables,
                "] ",
                evt.table,
                ": بدأ"
              ] }, i);
              if (evt.type === "table_progress") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                " ",
                "↳ ",
                evt.table,
                " (",
                evt.phase,
                "): ",
                evt.fetchedRows ?? 0
              ] }, i);
              if (evt.type === "table_done") return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "✓ ",
                evt.table,
                ": صدر ",
                evt.exportedRows ?? 0
              ] }, i);
              if (evt.type === "all_done" && evt.summary) {
                const s = evt.summary;
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-green-600 font-bold", children: "✓✓✓ مكتمل!" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    "المساحة قبل: ",
                    s.dbSizeBefore?.pretty
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    "المساحة بعد: ",
                    s.dbSizeAfter?.pretty
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    "تم توفير:",
                    " ",
                    s.spaceFreedBytes ? Math.round(s.spaceFreedBytes / 1024 / 1024) + " MB" : "0 MB"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    "VACUUM: ",
                    s.vacuumSuccess ? "نجاح" : "خطأ"
                  ] }),
                  s.tables.map((t, ti) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                    " ",
                    "- ",
                    t.table,
                    ": ",
                    t.rowsExported,
                    " صف مصدّر"
                  ] }, ti))
                ] }, i);
              }
              return null;
            }) }) })
          ] }),
          isArchiving && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-blue-600", children: [
            "جارٍ الأرشفة… ",
            archiveProgress.length,
            " حدثًا"
          ] }),
          archiveError && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500", children: archiveError }),
          archiveProgress.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-64 overflow-y-auto rounded border border-border/40 bg-muted/30 p-2 text-xs", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono whitespace-pre-wrap", children: archiveProgress.map((evt, i) => {
            if (evt.type === "connected") return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: "🔌 متصل" }, i);
            if (evt.type === "table_start") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "📊 [",
                evt.currentTable,
                "/",
                evt.totalTables,
                "] ",
                evt.table,
                ": بدأ -",
                " ",
                evt.phase,
                " - ",
                evt.totalRows,
                " صف"
              ] }, i);
            }
            if (evt.type === "table_progress") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                " ",
                "↳ ",
                evt.table,
                " (",
                evt.phase,
                "): ",
                evt.fetchedRows ?? 0,
                "→",
                evt.exportedRows ?? 0,
                "→",
                evt.deletedRows ?? 0
              ] }, i);
            }
            if (evt.type === "table_done") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                "✓ ",
                evt.table,
                ": أنهى - ",
                evt.phase,
                " - صدر ",
                evt.exportedRows ?? 0,
                "، حُذف",
                " ",
                evt.deletedRows ?? 0
              ] }, i);
            }
            if (evt.type === "all_done" && evt.summary) {
              const s = evt.summary;
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  "✓✓✓ مكتمل! ",
                  s.success ? "نجاح" : "أخطاء",
                  " - ",
                  s.startTime,
                  " →",
                  " ",
                  s.endTime
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  "حُرر ",
                  s.dbSizeFreedPretty,
                  " من قاعدة البيانات"
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  "المجلد: ",
                  s.archiveDir
                ] }),
                s.tables.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  t.table,
                  ": ",
                  t.totalInDb,
                  " مجموع / ",
                  t.olderThan2Days,
                  " أقدم / صدر",
                  " ",
                  t.rowsExported,
                  " / حُذف ",
                  t.rowsDeleted,
                  t.errors && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                    " ⚠ ",
                    t.errors
                  ] })
                ] }, t.table))
              ] }, i);
            }
            if (evt.type === "error") {
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
                "⚠ ",
                evt.error
              ] }, i);
            }
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { children: JSON.stringify(evt) }, i);
          }) }) })
        ] }),
        err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-lg border border-red-500/40 bg-red-500/10 p-2 text-xs text-red-500", children: err }),
        summary?.ok && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-green-500/40 bg-green-500/10 p-3 space-y-2 text-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-semibold text-green-700", children: [
            "✅",
            " تم دمج ",
            summary.tables?.reduce((n, t) => n + (t.rows || 0), 0) ?? 0,
            " ",
            "صف في ",
            summary.tables?.length ?? 0,
            " جداول"
          ] }),
          summary.from && summary.to && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            "المدى: ",
            summary.from,
            " ← ",
            summary.to
          ] }),
          summary.gaps && summary.gaps.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-yellow-600", children: [
            "فجوات (لا توجد محليًا ولا في Supabase):",
            " ",
            summary.gaps.map((g) => `${g.table}@${g.date}`).join("، ")
          ] }),
          summary.errors && summary.errors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-red-600", children: [
            "أخطاء: ",
            summary.errors.map((e) => `${e.table}: ${e.error}`).join("، ")
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-auto rounded border max-h-56", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-xs", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "sticky top-0 bg-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "الجداول" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "التاريخ" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "المصدر" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "p-1 text-right", children: "عدد الصفوف" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { children: summary.tables?.flatMap((t) => t.breakdown.map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "border-t", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 font-mono", children: t.table }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 font-mono", children: b.date }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1", children: b.source === "local" ? "من القرص" : b.source === "cache" ? "جديد من Supabase (تم تخزينه محليًا)" : "فجوة" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "p-1 tabular-nums", children: b.rows })
            ] }, `${t.table}-${b.date}`))) })
          ] }) }),
          saved.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-green-600", children: [
            "✓ حُفظت الملفات: ",
            saved.join("، ")
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Page as component
};
