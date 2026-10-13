import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/scalp.tsx?tsr-split=component");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f3a543ee"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$(), _s2 = $RefreshSig$(), _s3 = $RefreshSig$(), _s4 = $RefreshSig$();
import { createClientRpc } from "/node_modules/@tanstack/react-start/dist/esm/client-rpc.js?v=f3a543ee";
import { Link } from "/node_modules/@tanstack/react-router/dist/esm/index.dev.js?v=f3a543ee";
import { createServerFn, useServerFn } from "/node_modules/@tanstack/react-start/dist/esm/index.js?v=f3a543ee";
import { useQuery } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=f3a543ee";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=f3a543ee"; const useEffect = __vite__cjsImport5_react["useEffect"]; const useRef = __vite__cjsImport5_react["useRef"]; const useState = __vite__cjsImport5_react["useState"];
import { supabase } from "/src/integrations/supabase/client.ts";
import { beep, alertBeep, ensureAudioUnlock } from "/src/lib/notify/beep.ts";
import { toast } from "/node_modules/.vite/deps/sonner.js?v=f3a543ee";
import { fmtPrice } from "/src/lib/format/price.ts";
import { ThunderConnectionBanner } from "/src/components/thunder-connection-banner.tsx";
import { CollectionWatchdogPanel } from "/src/components/collection-watchdog-panel.tsx";
const getScalpToday = createServerFn({
  method: "GET"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAudHN4P3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImdldFNjYWxwVG9kYXlfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9"));
const getScalpMr15Enabled = createServerFn({
  method: "GET"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAudHN4P3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6ImdldFNjYWxwTXIxNUVuYWJsZWRfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9"));
const setScalpMr15Enabled = createServerFn({
  method: "POST"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAudHN4P3Rzcy1zZXJ2ZXJmbi1zcGxpdCIsImV4cG9ydCI6InNldFNjYWxwTXIxNUVuYWJsZWRfY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9"));
function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString("ar-EG", {
    timeZone: "Africa/Cairo",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function ExtensionToggle() {
  _s();
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
  const [busy, setBusy] = useState(false);
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
  return /* @__PURE__ */ jsxDEV("div", { className: `rounded-lg border p-4 flex items-center justify-between gap-3 ${enabled ? "bg-bull/10 border-bull/40" : "bg-muted/40 border-muted"}`, "data-tsd-source": "/src/routes/scalp.tsx:167:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-sm", "data-tsd-source": "/src/routes/scalp.tsx:168:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "font-bold", "data-tsd-source": "/src/routes/scalp.tsx:169:9", children: isLoading ? "…" : enabled ? "🟢 فتح تابات ثاندر: مُفعّل" : "⛔ فتح تابات ثاندر: مُعطّل" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 85,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp.tsx:172:9", children: "الصفحة بتفضل شغّالة في الحالتين. لما يبقى مُعطّل، الإشارات بتظهر هنا لكن الاكستنشن مش هيفتح تابات ثاندر." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 88,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 84,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("button", { onClick: toggle, disabled: busy || isLoading, className: `rounded-md px-4 py-2 text-sm font-bold ${enabled ? "bg-bear text-white" : "bg-bull text-white"} disabled:opacity-50`, "data-tsd-source": "/src/routes/scalp.tsx:176:7", children: busy ? "..." : enabled ? "إيقاف" : "تفعيل" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 92,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
    lineNumber: 83,
    columnNumber: 10
  }, this);
}
_s(ExtensionToggle, "MX3bPZvf+ME883HSbl1wKz0o7gU=", false, function() {
  return [useServerFn, useServerFn, useQuery];
});
_c = ExtensionToggle;
function ScalpPage() {
  _s2();
  const fetchTrades = useServerFn(getScalpToday);
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["scalp-today"],
    queryFn: () => fetchTrades(),
    refetchInterval: 15e3
  });
  const [pulse, setPulse] = useState(0);
  const seenIdsRef = useRef(/* @__PURE__ */ new Set());
  const initializedRef = useRef(false);
  useEffect(() => {
    ensureAudioUnlock();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {
      });
    }
  }, []);
  useEffect(() => {
    if (!data?.trades || initializedRef.current) return;
    for (const t of data.trades) seenIdsRef.current.add(t.id);
    initializedRef.current = true;
  }, [data]);
  useEffect(() => {
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
  return /* @__PURE__ */ jsxDEV("div", { className: "p-4 md:p-6 max-w-5xl mx-auto space-y-5", "data-tsd-source": "/src/routes/scalp.tsx:273:5", children: [
    /* @__PURE__ */ jsxDEV(ThunderConnectionBanner, { "data-tsd-source": "/src/routes/scalp.tsx:274:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 195,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(CollectionWatchdogPanel, { "data-tsd-source": "/src/routes/scalp.tsx:275:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 196,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { className: "flex items-center justify-between", "data-tsd-source": "/src/routes/scalp.tsx:276:7", children: [
      /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp.tsx:277:9", children: [
        /* @__PURE__ */ jsxDEV(Link, { to: "/", className: "text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2", "data-tsd-source": "/src/routes/scalp.tsx:278:11", children: "← الرجوع للرئيسية" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 199,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("h1", { className: "text-3xl font-bold flex items-center gap-2", "data-tsd-source": "/src/routes/scalp.tsx:281:11", children: [
          "⚡ Scalp Live",
          /* @__PURE__ */ jsxDEV("span", { className: `inline-block h-2.5 w-2.5 rounded-full bg-bull ${pulse % 2 ? "animate-ping" : ""}`, "data-tsd-source": "/src/routes/scalp.tsx:283:13" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 204,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 202,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(Link, { to: "/scalp-feasibility", className: "mt-2 inline-block text-xs text-primary hover:underline", "data-tsd-source": "/src/routes/scalp.tsx:285:11", children: "📊 تقرير جدوى الإشارات (proof بأرقام حقيقية) →" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 206,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-muted-foreground text-sm mt-1", "data-tsd-source": "/src/routes/scalp.tsx:291:11", children: "إشعارات لحظية فورية (Realtime). الصوت + إشعار المتصفح يشتغلوا في نفس الثانية اللي بتطلع فيها الإشارة." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 209,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 198,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("button", { onClick: () => {
        ensureAudioUnlock();
        beep(880);
        toast("الصوت مفعّل ✅");
        if (typeof Notification !== "undefined") Notification.requestPermission().catch(() => {
        });
      }, className: "rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground", "data-tsd-source": "/src/routes/scalp.tsx:295:9", children: "فعّل الصوت + الإشعارات" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 213,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 197,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", "data-tsd-source": "/src/routes/scalp.tsx:303:7", children: [
      /* @__PURE__ */ jsxDEV(Stat, { label: "إشارات اليوم", value: String(trades.length), "data-tsd-source": "/src/routes/scalp.tsx:304:9" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 224,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Stat, { label: "مفتوحة / مقفولة", value: `${open.length} / ${closed.length}`, "data-tsd-source": "/src/routes/scalp.tsx:305:9" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 225,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Stat, { label: "PnL محقق", value: `${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`, tone: realized >= 0 ? "bull" : "bear", "data-tsd-source": "/src/routes/scalp.tsx:306:9" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 226,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV(Stat, { label: "نسبة النجاح", value: `${winRate.toFixed(0)}%`, "data-tsd-source": "/src/routes/scalp.tsx:307:9" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 227,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 223,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(ExtensionToggle, { "data-tsd-source": "/src/routes/scalp.tsx:310:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 230,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV(ManualOpenThunderTabWidget, { "data-tsd-source": "/src/routes/scalp.tsx:312:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 232,
      columnNumber: 7
    }, this),
    trades.length === 0 ? /* @__PURE__ */ jsxDEV("div", { className: "rounded-lg border bg-card p-10 text-center text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:315:9", children: "لسه مفيش إشارات Scalp النهارده. الإشعار هيوصلك لحظياً أول ما تطلع." }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 234,
      columnNumber: 30
    }, this) : /* @__PURE__ */ jsxDEV("div", { className: "space-y-2", "data-tsd-source": "/src/routes/scalp.tsx:319:9", children: trades.map((t) => {
      const ageMs = nowMs - new Date(t.entry_ts).getTime();
      const cur = t.current_price ?? null;
      const drift = cur != null && t.entry_price > 0 ? (cur - t.entry_price) / t.entry_price : 0;
      const priceMovedUp = cur != null && drift > MAX_DRIFT_PCT;
      const isFresh = t.status === "open" && ageMs <= FRESH_MS && !priceMovedUp;
      return /* @__PURE__ */ jsxDEV("div", { className: `rounded-lg border p-4 flex flex-wrap items-center gap-4 ${isFresh ? "bg-warn/15 border-warn shadow-md" : t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"}`, "data-tsd-source": "/src/routes/scalp.tsx:327:15", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "min-w-24", "data-tsd-source": "/src/routes/scalp.tsx:331:17", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-2xl", "data-tsd-source": "/src/routes/scalp.tsx:332:19", children: t.symbol }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 245,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:333:19", children: fmtTime(t.entry_ts) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 246,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV(OpenThunderTabButton, { symbol: t.symbol, "data-tsd-source": "/src/routes/scalp.tsx:334:19" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 247,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 244,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm", "data-tsd-source": "/src/routes/scalp.tsx:336:17", children: [
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp.tsx:337:19", children: [
            "دخول: ",
            /* @__PURE__ */ jsxDEV("strong", { "data-tsd-source": "/src/routes/scalp.tsx:337:30", children: fmtPrice(t.entry_price) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
              lineNumber: 250,
              columnNumber: 77
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 250,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:338:19", children: [
            "TP ",
            fmtPrice(t.tp_price),
            " / SL ",
            fmtPrice(t.sl_price)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 251,
            columnNumber: 19
          }, this),
          cur != null && /* @__PURE__ */ jsxDEV("div", { className: "text-xs mt-1", "data-tsd-source": "/src/routes/scalp.tsx:342:21", children: [
            "السعر الآن: ",
            /* @__PURE__ */ jsxDEV("strong", { className: drift > 0 ? "text-bear" : "text-bull", "data-tsd-source": "/src/routes/scalp.tsx:343:35", children: fmtPrice(cur) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
              lineNumber: 255,
              columnNumber: 35
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:344:23", children: [
              " (",
              drift >= 0 ? "+" : "",
              (drift * 100).toFixed(2),
              "%)"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
              lineNumber: 256,
              columnNumber: 23
            }, this),
            t.current_price_source && /* @__PURE__ */ jsxDEV("span", { className: `mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${t.current_price_source === "thunder_ext" ? "bg-bull/20 text-bull" : "bg-muted text-muted-foreground"}`, title: t.current_price_ts ?? void 0, "data-tsd-source": "/src/routes/scalp.tsx:346:25", children: [
              t.current_price_source === "thunder_ext" ? "⚡ Thunder" : t.current_price_source,
              t.current_price_ts && ` · ${Math.max(0, Math.round((Date.now() - new Date(t.current_price_ts).getTime()) / 1e3))}s`
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
              lineNumber: 257,
              columnNumber: 50
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 254,
            columnNumber: 35
          }, this),
          t.peak_price != null && t.peak_price > 0 && (() => {
            const peakDrift = t.entry_price > 0 ? (t.peak_price - t.entry_price) / t.entry_price : 0;
            const hitTp = t.peak_price >= t.tp_price;
            return /* @__PURE__ */ jsxDEV("div", { className: "text-xs mt-1", "data-tsd-source": "/src/routes/scalp.tsx:359:23", children: [
              "أعلى سعر: ",
              /* @__PURE__ */ jsxDEV("strong", { className: "text-bull", "data-tsd-source": "/src/routes/scalp.tsx:360:35", children: fmtPrice(t.peak_price) }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
                lineNumber: 266,
                columnNumber: 35
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:361:25", children: [
                " (",
                peakDrift >= 0 ? "+" : "",
                (peakDrift * 100).toFixed(2),
                "%)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
                lineNumber: 267,
                columnNumber: 25
              }, this),
              hitTp && /* @__PURE__ */ jsxDEV("span", { className: "mr-2 text-[10px] font-bold text-bull", "data-tsd-source": "/src/routes/scalp.tsx:362:35", children: "🎯 تخطّى TP" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
                lineNumber: 268,
                columnNumber: 35
              }, this),
              t.peak_price_ts && /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:364:27", children: [
                " · ",
                fmtTime(t.peak_price_ts)
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
                lineNumber: 269,
                columnNumber: 45
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
              lineNumber: 265,
              columnNumber: 22
            }, this);
          })()
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 249,
          columnNumber: 17
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "mr-auto text-left", "data-tsd-source": "/src/routes/scalp.tsx:370:17", children: [
          (t.max_gap_sec ?? 0) > 60 && /* @__PURE__ */ jsxDEV("div", { className: "mb-1 inline-block rounded bg-warn/20 border border-warn px-2 py-0.5 text-[11px] font-bold text-warn", title: `أكبر فجوة بين التيكات داخل نافذة الصفقة = ${t.max_gap_sec}s • عدد التيكات = ${t.tick_count ?? 0}`, "data-tsd-source": "/src/routes/scalp.tsx:372:21", children: [
            "⚠️ فجوة تيكات ",
            t.max_gap_sec,
            "s"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 274,
            columnNumber: 49
          }, this),
          isFresh ? /* @__PURE__ */ jsxDEV("span", { className: "text-warn font-bold text-lg", "data-tsd-source": "/src/routes/scalp.tsx:377:21", children: "🔥 ادخل دلوقتي" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 277,
            columnNumber: 30
          }, this) : t.status === "open" ? /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground font-semibold", "data-tsd-source": "/src/routes/scalp.tsx:379:21", children: priceMovedUp ? `⏳ النافذة فاتت — السعر فوق الدخول بـ ${(drift * 100).toFixed(2)}%` : "⏳ النافذة فاتت" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 277,
            columnNumber: 169
          }, this) : /* @__PURE__ */ jsxDEV("span", { className: Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold", "data-tsd-source": "/src/routes/scalp.tsx:383:21", children: [
            t.exit_reason,
            " • ",
            Number(t.pnl) >= 0 ? "+" : "",
            Number(t.pnl).toFixed(0),
            " EGP"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
            lineNumber: 279,
            columnNumber: 31
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
          lineNumber: 273,
          columnNumber: 17
        }, this)
      ] }, t.id, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
        lineNumber: 243,
        columnNumber: 16
      }, this);
    }) }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 236,
      columnNumber: 18
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
    lineNumber: 194,
    columnNumber: 10
  }, this);
}
_s2(ScalpPage, "s0DgN8GjmuI2Q1VTnodsdZtPJ74=", false, function() {
  return [useServerFn, useQuery];
});
_c2 = ScalpPage;
function Stat({
  label,
  value,
  tone
}) {
  const color = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "";
  return /* @__PURE__ */ jsxDEV("div", { className: "rounded border bg-card p-3", "data-tsd-source": "/src/routes/scalp.tsx:400:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground", "data-tsd-source": "/src/routes/scalp.tsx:401:7", children: label }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 299,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `text-xl font-bold ${color}`, "data-tsd-source": "/src/routes/scalp.tsx:402:7", children: value }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 300,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
    lineNumber: 298,
    columnNumber: 10
  }, this);
}
_c3 = Stat;
function OpenThunderTabButton({
  symbol
}) {
  _s3();
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  const onClick = () => requestOpenThunderTab(symbol, setState, setMsg);
  return /* @__PURE__ */ jsxDEV("button", { type: "button", onClick, title: msg || "افتح تاب ثاندر لهذا السهم مع قائمة معلومات السوق (المستوى الثاني) تلقائياً", className: `mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${state === "ok" ? "border-bull bg-bull/15 text-bull" : state === "err" || state === "noext" ? "border-bear bg-bear/15 text-bear" : "border-muted-foreground/30 bg-muted/30 hover:bg-accent hover:border-accent-foreground/50"}`, "data-tsd-source": "/src/routes/scalp.tsx:416:5", children: state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ الاكستنشن مش شغّال" : state === "err" ? "❌ فشل" : "⚡ فتح تاب ثاندر" }, void 0, false, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
    lineNumber: 316,
    columnNumber: 10
  }, this);
}
_s3(OpenThunderTabButton, "Zc/fI2YK2lrZ35qj1bzslHpjeVA=");
_c4 = OpenThunderTabButton;
function ManualOpenThunderTabWidget() {
  _s4();
  const [sym, setSym] = useState("");
  const [state, setState] = useState("idle");
  const [msg, setMsg] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const s = sym.trim().toUpperCase();
    if (!s) return;
    requestOpenThunderTab(s, setState, setMsg);
  };
  return /* @__PURE__ */ jsxDEV("form", { onSubmit: submit, className: "rounded-lg border bg-card p-3 flex flex-wrap items-center gap-2", title: msg || "افتح تاب ثاندر لأي سهم يدوياً — لو ثاندر عمل logout وقفل التاب", "data-tsd-source": "/src/routes/scalp.tsx:446:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-semibold", "data-tsd-source": "/src/routes/scalp.tsx:451:7", children: "⚡ فتح تاب ثاندر يدوي" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 334,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("input", { type: "text", value: sym, onChange: (e) => setSym(e.target.value), placeholder: "رمز السهم (مثل AALR)", className: "rounded border bg-background px-2 py-1 text-sm font-mono uppercase w-40", maxLength: 12, "data-tsd-source": "/src/routes/scalp.tsx:452:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 335,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("button", { type: "submit", className: `rounded border px-3 py-1 text-sm font-semibold transition-colors ${state === "ok" ? "border-bull bg-bull/20 text-bull" : state === "err" || state === "noext" ? "border-bear bg-bear/20 text-bear" : "border-muted-foreground/40 bg-muted/40 hover:bg-accent"}`, "data-tsd-source": "/src/routes/scalp.tsx:460:7", children: state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ ثبّت الاكستنشن v4.1.86" : state === "err" ? "❌ فشل" : "افتح التاب" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 336,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: "text-[11px] text-muted-foreground mr-auto", "data-tsd-source": "/src/routes/scalp.tsx:472:7", children: msg || "بيفتح صفحة السهم في ثاندر ويفتح قائمة معلومات السوق (L2) تلقائياً" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
      lineNumber: 339,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component",
    lineNumber: 333,
    columnNumber: 10
  }, this);
}
_s4(ManualOpenThunderTabWidget, "Y0MkKF4QAGTnA/vNmUpx1fUXI0I=");
_c5 = ManualOpenThunderTabWidget;
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
export { ScalpPage as component };
var _c, _c2, _c3, _c4, _c5;
$RefreshReg$(_c, "ExtensionToggle");
$RefreshReg$(_c2, "ScalpPage");
$RefreshReg$(_c3, "Stat");
$RefreshReg$(_c4, "OpenThunderTabButton");
$RefreshReg$(_c5, "ManualOpenThunderTabWidget");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "D:/meky-stock-main/meky-stock-main/src/routes/scalp.tsx?tsr-split=component " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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Q0FpQixlQUFBLE1BQUFuQixTQUFBO0FBQUEsRUFDQTtBQUNBO0FBQUEsU0FBQTNGLGFBQUFvSTtBQUFBLElBQUFDLElBQUFDLEtBQUEvQyxLQUFBZ0QsS0FBQUM7QUFBQSxhQUFBSCxJQUFBO0FBQUEsYUFBQUMsS0FBQTtBQUFBLGFBQUEvQyxLQUFBO0FBQUEsYUFBQWdELEtBQUE7QUFBQSxhQUFBQyxLQUFBIiwibmFtZXMiOlsiTGluayIsImNyZWF0ZVNlcnZlckZuIiwidXNlU2VydmVyRm4iLCJ1c2VRdWVyeSIsInVzZUVmZmVjdCIsInVzZVJlZiIsInVzZVN0YXRlIiwic3VwYWJhc2UiLCJiZWVwIiwiYWxlcnRCZWVwIiwiZW5zdXJlQXVkaW9VbmxvY2siLCJ0b2FzdCIsImZtdFByaWNlIiwiVGh1bmRlckNvbm5lY3Rpb25CYW5uZXIiLCJDb2xsZWN0aW9uV2F0Y2hkb2dQYW5lbCIsImdldFNjYWxwVG9kYXkiLCJtZXRob2QiLCJoYW5kbGVyIiwiY3JlYXRlQ2xpZW50UnBjIiwiZ2V0U2NhbHBNcjE1RW5hYmxlZCIsInNldFNjYWxwTXIxNUVuYWJsZWQiLCJmbXRUaW1lIiwiaXNvIiwiRGF0ZSIsInRvTG9jYWxlVGltZVN0cmluZyIsInRpbWVab25lIiwiaG91ciIsIm1pbnV0ZSIsInNlY29uZCIsIkV4dGVuc2lvblRvZ2dsZSIsIl9zIiwiZ2V0RW5hYmxlZCIsInNldEVuYWJsZWQiLCJkYXRhIiwicmVmZXRjaCIsImlzTG9hZGluZyIsInF1ZXJ5S2V5IiwicXVlcnlGbiIsInJlZmV0Y2hJbnRlcnZhbCIsImJ1c3kiLCJzZXRCdXN5IiwiZW5hYmxlZCIsInRvZ2dsZSIsIm5leHQiLCJlIiwiZXJyb3IiLCJtZXNzYWdlIiwiU2NhbHBQYWdlIiwiX3MyIiwiZmV0Y2hUcmFkZXMiLCJwdWxzZSIsInNldFB1bHNlIiwic2Vlbklkc1JlZiIsIlNldCIsImluaXRpYWxpemVkUmVmIiwiTm90aWZpY2F0aW9uIiwicGVybWlzc2lvbiIsInJlcXVlc3RQZXJtaXNzaW9uIiwiY2F0Y2giLCJ0cmFkZXMiLCJjdXJyZW50IiwidCIsImFkZCIsImlkIiwiY2hhbm5lbCIsIm9uIiwiZXZlbnQiLCJzY2hlbWEiLCJ0YWJsZSIsImZpbHRlciIsInBheWxvYWQiLCJuZXciLCJoYXMiLCJwIiwiZW50cnkiLCJlbnRyeV9wcmljZSIsInRwIiwidHBfcHJpY2UiLCJzbCIsInNsX3ByaWNlIiwiYm9keSIsInN1Y2Nlc3MiLCJzeW1ib2wiLCJkZXNjcmlwdGlvbiIsImR1cmF0aW9uIiwidGFnIiwicmVxdWlyZUludGVyYWN0aW9uIiwib2xkIiwic3RhdHVzIiwicG5sIiwiTnVtYmVyIiwiZXhpdF9yZWFzb24iLCJ0b0ZpeGVkIiwic3Vic2NyaWJlIiwicmVtb3ZlQ2hhbm5lbCIsIm9wZW4iLCJjbG9zZWQiLCJyZWFsaXplZCIsInJlZHVjZSIsImEiLCJ3aW5zIiwibGVuZ3RoIiwid2luUmF0ZSIsIm5vd01zIiwibm93IiwiRlJFU0hfTVMiLCJNQVhfRFJJRlRfUENUIiwiU3RyaW5nIiwibWFwIiwiYWdlTXMiLCJlbnRyeV90cyIsImdldFRpbWUiLCJjdXIiLCJjdXJyZW50X3ByaWNlIiwiZHJpZnQiLCJwcmljZU1vdmVkVXAiLCJpc0ZyZXNoIiwiY3VycmVudF9wcmljZV9zb3VyY2UiLCJjdXJyZW50X3ByaWNlX3RzIiwidW5kZWZpbmVkIiwiTWF0aCIsIm1heCIsInJvdW5kIiwicGVha19wcmljZSIsInBlYWtEcmlmdCIsImhpdFRwIiwicGVha19wcmljZV90cyIsIm1heF9nYXBfc2VjIiwidGlja19jb3VudCIsIlN0YXQiLCJsYWJlbCIsInZhbHVlIiwidG9uZSIsImNvbG9yIiwiX2MzIiwiT3BlblRodW5kZXJUYWJCdXR0b24iLCJfczMiLCJzdGF0ZSIsInNldFN0YXRlIiwibXNnIiwic2V0TXNnIiwib25DbGljayIsInJlcXVlc3RPcGVuVGh1bmRlclRhYiIsIk1hbnVhbE9wZW5UaHVuZGVyVGFiV2lkZ2V0IiwiX3M0Iiwic3ltIiwic2V0U3ltIiwic3VibWl0IiwicHJldmVudERlZmF1bHQiLCJzIiwidHJpbSIsInRvVXBwZXJDYXNlIiwidGFyZ2V0IiwibWFya2VyIiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJnZXRBdHRyaWJ1dGUiLCJzZXRUaW1lb3V0IiwicmVxSWQiLCJyYW5kb20iLCJ0b1N0cmluZyIsInNsaWNlIiwiZG9uZSIsIm9uTXNnIiwiZXYiLCJkIiwiX190aHVuZGVyUmVzcG9uc2UiLCJfX3JlcUlkIiwid2luZG93IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm9rIiwiZXJyIiwicmVzcCIsImFkZEV2ZW50TGlzdGVuZXIiLCJwb3N0TWVzc2FnZSIsIl9fdGh1bmRlciIsInR5cGUiLCJsb2NhdGlvbiIsIm9yaWdpbiIsImNvbXBvbmVudCIsIl9jIiwiX2MyIiwiX2M0IiwiX2M1Il0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbInNjYWxwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVGaWxlUm91dGUsIExpbmsgfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXJvdXRlclwiO1xuaW1wb3J0IHsgY3JlYXRlU2VydmVyRm4sIHVzZVNlcnZlckZuIH0gZnJvbSBcIkB0YW5zdGFjay9yZWFjdC1zdGFydFwiO1xuaW1wb3J0IHsgdXNlUXVlcnkgfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCI7XG5pbXBvcnQgeyB1c2VFZmZlY3QsIHVzZVJlZiwgdXNlU3RhdGUgfSBmcm9tIFwicmVhY3RcIjtcbmltcG9ydCB7IHN1cGFiYXNlQWRtaW4gfSBmcm9tIFwiQC9pbnRlZ3JhdGlvbnMvc3VwYWJhc2UvY2xpZW50LnNlcnZlclwiO1xuaW1wb3J0IHsgc3VwYWJhc2UgfSBmcm9tIFwiQC9pbnRlZ3JhdGlvbnMvc3VwYWJhc2UvY2xpZW50XCI7XG5pbXBvcnQgeyBiZWVwLCBhbGVydEJlZXAsIGVuc3VyZUF1ZGlvVW5sb2NrIH0gZnJvbSBcIkAvbGliL25vdGlmeS9iZWVwXCI7XG5pbXBvcnQgeyB0b2FzdCB9IGZyb20gXCJzb25uZXJcIjtcbmltcG9ydCB7IGZtdFByaWNlIH0gZnJvbSBcIkAvbGliL2Zvcm1hdC9wcmljZVwiO1xuaW1wb3J0IHsgVGh1bmRlckNvbm5lY3Rpb25CYW5uZXIgfSBmcm9tIFwiQC9jb21wb25lbnRzL3RodW5kZXItY29ubmVjdGlvbi1iYW5uZXJcIjtcbmltcG9ydCB7IENvbGxlY3Rpb25XYXRjaGRvZ1BhbmVsIH0gZnJvbSBcIkAvY29tcG9uZW50cy9jb2xsZWN0aW9uLXdhdGNoZG9nLXBhbmVsXCI7XG5cbnR5cGUgVHJhZGUgPSB7XG4gIGlkOiBzdHJpbmc7XG4gIHN5bWJvbDogc3RyaW5nO1xuICBzdHJhdGVneTogc3RyaW5nO1xuICBlbnRyeV9wcmljZTogbnVtYmVyO1xuICBlbnRyeV90czogc3RyaW5nO1xuICB0cF9wcmljZTogbnVtYmVyO1xuICBzbF9wcmljZTogbnVtYmVyO1xuICBleGl0X3ByaWNlOiBudW1iZXIgfCBudWxsO1xuICBleGl0X3RzOiBzdHJpbmcgfCBudWxsO1xuICBleGl0X3JlYXNvbjogc3RyaW5nIHwgbnVsbDtcbiAgcG5sOiBudW1iZXIgfCBudWxsO1xuICBzdGF0dXM6IHN0cmluZztcbiAgdHJhZGVfZGF0ZTogc3RyaW5nO1xuICBjdXJyZW50X3ByaWNlPzogbnVtYmVyIHwgbnVsbDtcbiAgY3VycmVudF9wcmljZV90cz86IHN0cmluZyB8IG51bGw7XG4gIGN1cnJlbnRfcHJpY2Vfc291cmNlPzogc3RyaW5nIHwgbnVsbDtcbiAgbWF4X2dhcF9zZWM/OiBudW1iZXIgfCBudWxsO1xuICB0aWNrX2NvdW50PzogbnVtYmVyIHwgbnVsbDtcbiAgcGVha19wcmljZT86IG51bWJlciB8IG51bGw7XG4gIHBlYWtfcHJpY2VfdHM/OiBzdHJpbmcgfCBudWxsO1xufTtcblxuY29uc3QgZ2V0U2NhbHBUb2RheSA9IGNyZWF0ZVNlcnZlckZuKHsgbWV0aG9kOiBcIkdFVFwiIH0pLmhhbmRsZXIoYXN5bmMgKCkgPT4ge1xuICBjb25zdCB0b2RheSA9IG5ldyBEYXRlKG5ldyBEYXRlKCkudG9Mb2NhbGVTdHJpbmcoXCJlbi1VU1wiLCB7IHRpbWVab25lOiBcIkFmcmljYS9DYWlyb1wiIH0pKVxuICAgIC50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTtcbiAgY29uc3QgeyBkYXRhLCBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VBZG1pblxuICAgIC5mcm9tKFwicGFwZXJfdHJhZGVzXCIpXG4gICAgLnNlbGVjdChcImlkLCBzeW1ib2wsIHN0cmF0ZWd5LCBlbnRyeV9wcmljZSwgZW50cnlfdHMsIHRwX3ByaWNlLCBzbF9wcmljZSwgZXhpdF9wcmljZSwgZXhpdF90cywgZXhpdF9yZWFzb24sIHBubCwgc3RhdHVzLCB0cmFkZV9kYXRlXCIpXG4gICAgLmVxKFwidHJhZGVfZGF0ZVwiLCB0b2RheSlcbiAgICAuZXEoXCJzdHJhdGVneVwiLCBcInNjYWxwLW1yMTVcIilcbiAgICAub3JkZXIoXCJlbnRyeV90c1wiLCB7IGFzY2VuZGluZzogZmFsc2UgfSk7XG4gIGlmIChlcnJvcikgdGhyb3cgZXJyb3I7XG4gIGNvbnN0IHRyYWRlcyA9IChkYXRhIHx8IFtdKSBhcyBUcmFkZVtdO1xuICAvLyBQdWxsIGFsbCB0aWNrcyBmb3IgaW52b2x2ZWQgc3ltYm9scyBvbmNlLCB0aGVuIGNvbXB1dGUgcGVyLXRyYWRlIGdhcCArIGxhdGVzdCBwcmljZVxuICBjb25zdCBhbGxTeW1zID0gQXJyYXkuZnJvbShuZXcgU2V0KHRyYWRlcy5tYXAodCA9PiB0LnN5bWJvbCkpKTtcbiAgaWYgKGFsbFN5bXMubGVuZ3RoKSB7XG4gICAgY29uc3QgZGF5U3RhcnQgPSBgJHt0b2RheX1UMDc6MDA6MDBaYDtcbiAgICBjb25zdCBieVByaWNlID0gbmV3IE1hcDxzdHJpbmcsIEFycmF5PHsgdHM6IG51bWJlcjsgcHJpY2U6IG51bWJlcjsgc291cmNlOiBzdHJpbmcgfT4+KCk7XG4gICAgbGV0IGZyb20gPSAwO1xuICAgIGNvbnN0IFBBR0UgPSAxMDAwO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCB7IGRhdGE6IHRpY2tzIH0gPSBhd2FpdCBzdXBhYmFzZUFkbWluXG4gICAgICAgIC5mcm9tKFwibGl2ZV90aWNrc1wiKVxuICAgICAgICAuc2VsZWN0KFwic3ltYm9sLCBwcmljZSwgdHMsIHNvdXJjZVwiKVxuICAgICAgICAuaW4oXCJzeW1ib2xcIiwgYWxsU3ltcylcbiAgICAgICAgLmd0ZShcInRzXCIsIGRheVN0YXJ0KVxuICAgICAgICAub3JkZXIoXCJ0c1wiLCB7IGFzY2VuZGluZzogdHJ1ZSB9KVxuICAgICAgICAucmFuZ2UoZnJvbSwgZnJvbSArIFBBR0UgLSAxKTtcbiAgICAgIGlmICghdGlja3MgfHwgdGlja3MubGVuZ3RoID09PSAwKSBicmVhaztcbiAgICAgIGZvciAoY29uc3QgciBvZiB0aWNrcykge1xuICAgICAgICBjb25zdCBhcnIgPSBieVByaWNlLmdldChyLnN5bWJvbCkgPz8gW107XG4gICAgICAgIGFyci5wdXNoKHsgdHM6IG5ldyBEYXRlKHIudHMgYXMgc3RyaW5nKS5nZXRUaW1lKCksIHByaWNlOiBOdW1iZXIoci5wcmljZSksIHNvdXJjZTogKHIuc291cmNlIGFzIHN0cmluZykgfHwgXCI/XCIgfSk7XG4gICAgICAgIGJ5UHJpY2Uuc2V0KHIuc3ltYm9sLCBhcnIpO1xuICAgICAgfVxuICAgICAgaWYgKHRpY2tzLmxlbmd0aCA8IFBBR0UpIGJyZWFrO1xuICAgICAgZnJvbSArPSBQQUdFO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IHQgb2YgdHJhZGVzKSB7XG4gICAgICBjb25zdCBhcnIgPSBieVByaWNlLmdldCh0LnN5bWJvbCkgPz8gW107XG4gICAgICAvLyBMYXRlc3QgcHJpY2UgZm9yIG9wZW4gdHJhZGVzXG4gICAgICBpZiAodC5zdGF0dXMgPT09IFwib3BlblwiICYmIGFyci5sZW5ndGgpIHtcbiAgICAgICAgY29uc3QgbGFzdCA9IGFyclthcnIubGVuZ3RoIC0gMV07XG4gICAgICAgIHQuY3VycmVudF9wcmljZSA9IGxhc3QucHJpY2U7XG4gICAgICAgIHQuY3VycmVudF9wcmljZV90cyA9IG5ldyBEYXRlKGxhc3QudHMpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIHQuY3VycmVudF9wcmljZV9zb3VyY2UgPSBsYXN0LnNvdXJjZTtcbiAgICAgIH1cbiAgICAgIC8vIE1heCBnYXAgd2l0aGluIFtlbnRyeV90cywgZXhpdF90cyB8fCBub3ddXG4gICAgICBjb25zdCBzdGFydCA9IG5ldyBEYXRlKHQuZW50cnlfdHMpLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGVuZCA9IHQuZXhpdF90cyA/IG5ldyBEYXRlKHQuZXhpdF90cykuZ2V0VGltZSgpIDogRGF0ZS5ub3coKTtcbiAgICAgIGxldCBwcmV2ID0gc3RhcnQ7XG4gICAgICBsZXQgbWF4R2FwID0gMDtcbiAgICAgIGxldCBjb3VudCA9IDA7XG4gICAgICBsZXQgcGVhayA9IDA7XG4gICAgICBsZXQgcGVha1RzID0gMDtcbiAgICAgIGZvciAoY29uc3QgdGsgb2YgYXJyKSB7XG4gICAgICAgIGlmICh0ay50cyA8IHN0YXJ0IHx8IHRrLnRzID4gZW5kKSBjb250aW51ZTtcbiAgICAgICAgY29uc3QgZ2FwID0gKHRrLnRzIC0gcHJldikgLyAxMDAwO1xuICAgICAgICBpZiAoZ2FwID4gbWF4R2FwKSBtYXhHYXAgPSBnYXA7XG4gICAgICAgIHByZXYgPSB0ay50cztcbiAgICAgICAgY291bnQrKztcbiAgICAgICAgaWYgKHRrLnByaWNlID4gcGVhaykgeyBwZWFrID0gdGsucHJpY2U7IHBlYWtUcyA9IHRrLnRzOyB9XG4gICAgICB9XG4gICAgICBjb25zdCB0YWlsR2FwID0gKGVuZCAtIHByZXYpIC8gMTAwMDtcbiAgICAgIGlmICh0YWlsR2FwID4gbWF4R2FwKSBtYXhHYXAgPSB0YWlsR2FwO1xuICAgICAgdC5tYXhfZ2FwX3NlYyA9IE1hdGgucm91bmQobWF4R2FwKTtcbiAgICAgIHQudGlja19jb3VudCA9IGNvdW50O1xuICAgICAgdC5wZWFrX3ByaWNlID0gcGVhayA+IDAgPyBwZWFrIDogbnVsbDtcbiAgICAgIHQucGVha19wcmljZV90cyA9IHBlYWtUcyA+IDAgPyBuZXcgRGF0ZShwZWFrVHMpLnRvSVNPU3RyaW5nKCkgOiBudWxsO1xuICAgIH1cbiAgfVxuICByZXR1cm4geyB0cmFkZXMsIGRhdGU6IHRvZGF5IH07XG59KTtcblxuY29uc3QgZ2V0U2NhbHBNcjE1RW5hYmxlZCA9IGNyZWF0ZVNlcnZlckZuKHsgbWV0aG9kOiBcIkdFVFwiIH0pLmhhbmRsZXIoYXN5bmMgKCkgPT4ge1xuICBjb25zdCB7IGRhdGEgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cbiAgICAuZnJvbShcInN0cmF0ZWd5X3NldHRpbmdzXCIpXG4gICAgLnNlbGVjdChcImVuYWJsZWRcIilcbiAgICAuZXEoXCJrZXlcIiwgXCJzY2FscC1tcjE1XCIpXG4gICAgLm1heWJlU2luZ2xlKCk7XG4gIHJldHVybiB7IGVuYWJsZWQ6IGRhdGE/LmVuYWJsZWQgPz8gdHJ1ZSB9O1xufSk7XG5cbmNvbnN0IHNldFNjYWxwTXIxNUVuYWJsZWQgPSBjcmVhdGVTZXJ2ZXJGbih7IG1ldGhvZDogXCJQT1NUXCIgfSlcbiAgLmlucHV0VmFsaWRhdG9yKChkOiB7IGVuYWJsZWQ6IGJvb2xlYW4gfSkgPT4gZClcbiAgLmhhbmRsZXIoYXN5bmMgKHsgZGF0YSB9KSA9PiB7XG4gICAgY29uc3QgeyBlcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VBZG1pblxuICAgICAgLmZyb20oXCJzdHJhdGVneV9zZXR0aW5nc1wiKVxuICAgICAgLnVwc2VydCh7IGtleTogXCJzY2FscC1tcjE1XCIsIGVuYWJsZWQ6IGRhdGEuZW5hYmxlZCwgdXBkYXRlZF9hdDogbmV3IERhdGUoKS50b0lTT1N0cmluZygpIH0sIHsgb25Db25mbGljdDogXCJrZXlcIiB9KTtcbiAgICBpZiAoZXJyb3IpIHRocm93IGVycm9yO1xuICAgIHJldHVybiB7IG9rOiB0cnVlLCBlbmFibGVkOiBkYXRhLmVuYWJsZWQgfTtcbiAgfSk7XG5cbmV4cG9ydCBjb25zdCBSb3V0ZSA9IGNyZWF0ZUZpbGVSb3V0ZShcIi9zY2FscFwiKSh7XG4gIGNvbXBvbmVudDogU2NhbHBQYWdlLFxuICBlcnJvckNvbXBvbmVudDogKHsgZXJyb3IgfSkgPT4gPGRpdiBjbGFzc05hbWU9XCJwLTYgdGV4dC1kZXN0cnVjdGl2ZVwiPtiu2LfYozoge2Vycm9yLm1lc3NhZ2V9PC9kaXY+LFxuICBub3RGb3VuZENvbXBvbmVudDogKCkgPT4gPGRpdiBjbGFzc05hbWU9XCJwLTZcIj7YutmK2LEg2YXZiNis2YjYrzwvZGl2PixcbiAgaGVhZDogKCkgPT4gKHtcbiAgICBtZXRhOiBbXG4gICAgICB7IHRpdGxlOiBcIlNjYWxwIOKAlCDYpdi02KfYsdin2Kog2YTYrdi42YrYqVwiIH0sXG4gICAgICB7IG5hbWU6IFwiZGVzY3JpcHRpb25cIiwgY29udGVudDogXCLYtdmB2K3YqSBTY2FscCDZhdiu2LXYtdipINio2KXYtNi52KfYsdin2Kog2YTYrdi42YrYqSDZgdmI2LHZitipLlwiIH0sXG4gICAgXSxcbiAgfSksXG59KTtcblxuZnVuY3Rpb24gZm10VGltZShpc286IHN0cmluZykge1xuICByZXR1cm4gbmV3IERhdGUoaXNvKS50b0xvY2FsZVRpbWVTdHJpbmcoXCJhci1FR1wiLCB7IHRpbWVab25lOiBcIkFmcmljYS9DYWlyb1wiLCBob3VyOiBcIjItZGlnaXRcIiwgbWludXRlOiBcIjItZGlnaXRcIiwgc2Vjb25kOiBcIjItZGlnaXRcIiB9KTtcbn1cblxuZnVuY3Rpb24gRXh0ZW5zaW9uVG9nZ2xlKCkge1xuICBjb25zdCBnZXRFbmFibGVkID0gdXNlU2VydmVyRm4oZ2V0U2NhbHBNcjE1RW5hYmxlZCk7XG4gIGNvbnN0IHNldEVuYWJsZWQgPSB1c2VTZXJ2ZXJGbihzZXRTY2FscE1yMTVFbmFibGVkKTtcbiAgY29uc3QgeyBkYXRhLCByZWZldGNoLCBpc0xvYWRpbmcgfSA9IHVzZVF1ZXJ5KHtcbiAgICBxdWVyeUtleTogW1wic2NhbHAtbXIxNS1lbmFibGVkXCJdLFxuICAgIHF1ZXJ5Rm46ICgpID0+IGdldEVuYWJsZWQoKSxcbiAgICByZWZldGNoSW50ZXJ2YWw6IDMwXzAwMCxcbiAgfSk7XG4gIGNvbnN0IFtidXN5LCBzZXRCdXN5XSA9IHVzZVN0YXRlKGZhbHNlKTtcbiAgY29uc3QgZW5hYmxlZCA9IGRhdGE/LmVuYWJsZWQgPz8gdHJ1ZTtcbiAgY29uc3QgdG9nZ2xlID0gYXN5bmMgKCkgPT4ge1xuICAgIGlmIChidXN5KSByZXR1cm47XG4gICAgc2V0QnVzeSh0cnVlKTtcbiAgICB0cnkge1xuICAgICAgY29uc3QgbmV4dCA9ICFlbmFibGVkO1xuICAgICAgYXdhaXQgc2V0RW5hYmxlZCh7IGRhdGE6IHsgZW5hYmxlZDogbmV4dCB9IH0pO1xuICAgICAgYXdhaXQgcmVmZXRjaCgpO1xuICAgICAgdG9hc3QobmV4dCA/IFwi2KrZhSDYqtmB2LnZitmEINmB2KrYrSDYqtin2KjYp9iqINir2KfZhtiv2LEg4pyFXCIgOiBcItiq2YUg2KXZitmC2KfZgSDZgdiq2K0g2KrYp9io2KfYqiDYq9in2YbYr9ixIOKblFwiKTtcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICAgIHRvYXN0LmVycm9yKGDZgdi02YQg2KfZhNiq2LrZitmK2LE6ICR7ZT8ubWVzc2FnZSA/PyBcItiu2LfYo1wifWApO1xuICAgIH0gZmluYWxseSB7XG4gICAgICBzZXRCdXN5KGZhbHNlKTtcbiAgICB9XG4gIH07XG4gIHJldHVybiAoXG4gICAgPGRpdiBjbGFzc05hbWU9e2Byb3VuZGVkLWxnIGJvcmRlciBwLTQgZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zICR7ZW5hYmxlZCA/IFwiYmctYnVsbC8xMCBib3JkZXItYnVsbC80MFwiIDogXCJiZy1tdXRlZC80MCBib3JkZXItbXV0ZWRcIn1gfT5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbVwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtYm9sZFwiPlxuICAgICAgICAgIHtpc0xvYWRpbmcgPyBcIuKAplwiIDogZW5hYmxlZCA/IFwi8J+foiDZgdiq2K0g2KrYp9io2KfYqiDYq9in2YbYr9ixOiDZhdmP2YHYudmR2YRcIiA6IFwi4puUINmB2KrYrSDYqtin2KjYp9iqINir2KfZhtiv2LE6INmF2Y/Yudi32ZHZhFwifVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XG4gICAgICAgICAg2KfZhNi12YHYrdipINio2KrZgdi22YQg2LTYutmR2KfZhNipINmB2Yog2KfZhNit2KfZhNiq2YrZhi4g2YTZhdinINmK2KjZgtmJINmF2Y/Yudi32ZHZhNiMINin2YTYpdi02KfYsdin2Kog2KjYqti42YfYsSDZh9mG2Kcg2YTZg9mGINin2YTYp9mD2LPYqtmG2LTZhiDZhdi0INmH2YrZgdiq2K0g2KrYp9io2KfYqiDYq9in2YbYr9ixLlxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgICAgPGJ1dHRvblxuICAgICAgICBvbkNsaWNrPXt0b2dnbGV9XG4gICAgICAgIGRpc2FibGVkPXtidXN5IHx8IGlzTG9hZGluZ31cbiAgICAgICAgY2xhc3NOYW1lPXtgcm91bmRlZC1tZCBweC00IHB5LTIgdGV4dC1zbSBmb250LWJvbGQgJHtlbmFibGVkID8gXCJiZy1iZWFyIHRleHQtd2hpdGVcIiA6IFwiYmctYnVsbCB0ZXh0LXdoaXRlXCJ9IGRpc2FibGVkOm9wYWNpdHktNTBgfVxuICAgICAgPlxuICAgICAgICB7YnVzeSA/IFwiLi4uXCIgOiBlbmFibGVkID8gXCLYpdmK2YLYp9mBXCIgOiBcItiq2YHYudmK2YRcIn1cbiAgICAgIDwvYnV0dG9uPlxuICAgIDwvZGl2PlxuICApO1xufVxuXG5mdW5jdGlvbiBTY2FscFBhZ2UoKSB7XG4gIGNvbnN0IGZldGNoVHJhZGVzID0gdXNlU2VydmVyRm4oZ2V0U2NhbHBUb2RheSk7XG4gIGNvbnN0IHsgZGF0YSwgcmVmZXRjaCB9ID0gdXNlUXVlcnkoe1xuICAgIHF1ZXJ5S2V5OiBbXCJzY2FscC10b2RheVwiXSxcbiAgICBxdWVyeUZuOiAoKSA9PiBmZXRjaFRyYWRlcygpLFxuICAgIHJlZmV0Y2hJbnRlcnZhbDogMTVfMDAwLFxuICB9KTtcbiAgY29uc3QgW3B1bHNlLCBzZXRQdWxzZV0gPSB1c2VTdGF0ZSgwKTtcbiAgY29uc3Qgc2Vlbklkc1JlZiA9IHVzZVJlZjxTZXQ8c3RyaW5nPj4obmV3IFNldCgpKTtcbiAgY29uc3QgaW5pdGlhbGl6ZWRSZWYgPSB1c2VSZWYoZmFsc2UpO1xuXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgZW5zdXJlQXVkaW9VbmxvY2soKTtcbiAgICBpZiAodHlwZW9mIE5vdGlmaWNhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJkZWZhdWx0XCIpIHtcbiAgICAgIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbigpLmNhdGNoKCgpID0+IHt9KTtcbiAgICB9XG4gIH0sIFtdKTtcblxuICAvLyBTZWVkIHNlZW4gaWRzIGZyb20gZmlyc3QgbG9hZCBzbyByZWFsdGltZSBvbmx5IGFsZXJ0cyBvbiB0cnVseSBuZXcgcm93c1xuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIGlmICghZGF0YT8udHJhZGVzIHx8IGluaXRpYWxpemVkUmVmLmN1cnJlbnQpIHJldHVybjtcbiAgICBmb3IgKGNvbnN0IHQgb2YgZGF0YS50cmFkZXMpIHNlZW5JZHNSZWYuY3VycmVudC5hZGQodC5pZCk7XG4gICAgaW5pdGlhbGl6ZWRSZWYuY3VycmVudCA9IHRydWU7XG4gIH0sIFtkYXRhXSk7XG5cbiAgLy8gUmVhbHRpbWU6IGluc3RhbnQgcHVzaCBmb3IgbmV3IHNjYWxwIHRyYWRlcyArIGV4aXRzXG4gIHVzZUVmZmVjdCgoKSA9PiB7XG4gICAgY29uc3QgY2hhbm5lbCA9IHN1cGFiYXNlXG4gICAgICAuY2hhbm5lbChcInNjYWxwLWxpdmVcIilcbiAgICAgIC5vbihcbiAgICAgICAgXCJwb3N0Z3Jlc19jaGFuZ2VzXCIsXG4gICAgICAgIHsgZXZlbnQ6IFwiSU5TRVJUXCIsIHNjaGVtYTogXCJwdWJsaWNcIiwgdGFibGU6IFwicGFwZXJfdHJhZGVzXCIsIGZpbHRlcjogXCJzdHJhdGVneT1lcS5zY2FscC1tcjE1XCIgfSxcbiAgICAgICAgKHBheWxvYWQpID0+IHtcbiAgICAgICAgICBjb25zdCB0ID0gcGF5bG9hZC5uZXcgYXMgVHJhZGU7XG4gICAgICAgICAgaWYgKHNlZW5JZHNSZWYuY3VycmVudC5oYXModC5pZCkpIHJldHVybjtcbiAgICAgICAgICBzZWVuSWRzUmVmLmN1cnJlbnQuYWRkKHQuaWQpO1xuICAgICAgICAgIGFsZXJ0QmVlcCgpO1xuICAgICAgICAgIHNldFB1bHNlKChwKSA9PiBwICsgMSk7XG4gICAgICAgICAgY29uc3QgZW50cnkgPSBmbXRQcmljZSh0LmVudHJ5X3ByaWNlKTtcbiAgICAgICAgICBjb25zdCB0cCA9IGZtdFByaWNlKHQudHBfcHJpY2UpO1xuICAgICAgICAgIGNvbnN0IHNsID0gZm10UHJpY2UodC5zbF9wcmljZSk7XG4gICAgICAgICAgY29uc3QgYm9keSA9IGDYr9iu2YjZhCAke2VudHJ5fSDigKIgVFAgJHt0cH0g4oCiIFNMICR7c2x9YDtcbiAgICAgICAgICB0b2FzdC5zdWNjZXNzKGDwn5SlINil2LTYp9ix2KkgU2NhbHAg2KzYr9mK2K/YqTogJHt0LnN5bWJvbH1gLCB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYm9keSxcbiAgICAgICAgICAgIGR1cmF0aW9uOiAzMF8wMDAsXG4gICAgICAgICAgfSk7XG4gICAgICAgICAgaWYgKHR5cGVvZiBOb3RpZmljYXRpb24gIT09IFwidW5kZWZpbmVkXCIgJiYgTm90aWZpY2F0aW9uLnBlcm1pc3Npb24gPT09IFwiZ3JhbnRlZFwiKSB7XG4gICAgICAgICAgICB0cnkgeyBuZXcgTm90aWZpY2F0aW9uKGDwn5SlIFNjYWxwICR7dC5zeW1ib2x9YCwgeyBib2R5LCB0YWc6IHQuaWQsIHJlcXVpcmVJbnRlcmFjdGlvbjogdHJ1ZSB9KTsgfSBjYXRjaCB7fVxuICAgICAgICAgIH1cbiAgICAgICAgICByZWZldGNoKCk7XG4gICAgICAgIH0sXG4gICAgICApXG4gICAgICAub24oXG4gICAgICAgIFwicG9zdGdyZXNfY2hhbmdlc1wiLFxuICAgICAgICB7IGV2ZW50OiBcIlVQREFURVwiLCBzY2hlbWE6IFwicHVibGljXCIsIHRhYmxlOiBcInBhcGVyX3RyYWRlc1wiLCBmaWx0ZXI6IFwic3RyYXRlZ3k9ZXEuc2NhbHAtbXIxNVwiIH0sXG4gICAgICAgIChwYXlsb2FkKSA9PiB7XG4gICAgICAgICAgY29uc3QgdCA9IHBheWxvYWQubmV3IGFzIFRyYWRlO1xuICAgICAgICAgIGNvbnN0IG9sZCA9IHBheWxvYWQub2xkIGFzIFBhcnRpYWw8VHJhZGU+O1xuICAgICAgICAgIGlmICh0LnN0YXR1cyAhPT0gXCJjbG9zZWRcIiB8fCBvbGQuc3RhdHVzID09PSBcImNsb3NlZFwiKSByZXR1cm47XG4gICAgICAgICAgYmVlcCh0LnBubCAmJiB0LnBubCA+IDAgPyAxMzIwIDogNTIwKTtcbiAgICAgICAgICBjb25zdCBwbmwgPSBOdW1iZXIodC5wbmwgPz8gMCk7XG4gICAgICAgICAgdG9hc3QoYCR7cG5sID49IDAgPyBcIvCfjq9cIiA6IFwi8J+bkVwifSDYrtix2YjYrCBTY2FscDogJHt0LnN5bWJvbH1gLCB7XG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogYCR7dC5leGl0X3JlYXNvbiA/PyBcIlwifSDigKIgJHtwbmwgPj0gMCA/IFwiK1wiIDogXCJcIn0ke3BubC50b0ZpeGVkKDApfSBFR1BgLFxuICAgICAgICAgICAgZHVyYXRpb246IDIwXzAwMCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBpZiAodHlwZW9mIE5vdGlmaWNhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiAmJiBOb3RpZmljYXRpb24ucGVybWlzc2lvbiA9PT0gXCJncmFudGVkXCIpIHtcbiAgICAgICAgICAgIHRyeSB7IG5ldyBOb3RpZmljYXRpb24oYCR7cG5sID49IDAgPyBcIvCfjq9cIiA6IFwi8J+bkVwifSAke3Quc3ltYm9sfWAsIHsgYm9keTogYCR7dC5leGl0X3JlYXNvbn0g4oCiICR7cG5sLnRvRml4ZWQoMCl9IEVHUGAsIHRhZzogYCR7dC5pZH0tZXhpdGAgfSk7IH0gY2F0Y2gge31cbiAgICAgICAgICB9XG4gICAgICAgICAgcmVmZXRjaCgpO1xuICAgICAgICB9LFxuICAgICAgKVxuICAgICAgLnN1YnNjcmliZSgpO1xuICAgIHJldHVybiAoKSA9PiB7IHN1cGFiYXNlLnJlbW92ZUNoYW5uZWwoY2hhbm5lbCk7IH07XG4gIH0sIFtyZWZldGNoXSk7XG5cbiAgY29uc3QgdHJhZGVzID0gZGF0YT8udHJhZGVzID8/IFtdO1xuICBjb25zdCBvcGVuID0gdHJhZGVzLmZpbHRlcih0ID0+IHQuc3RhdHVzID09PSBcIm9wZW5cIik7XG4gIGNvbnN0IGNsb3NlZCA9IHRyYWRlcy5maWx0ZXIodCA9PiB0LnN0YXR1cyA9PT0gXCJjbG9zZWRcIik7XG4gIGNvbnN0IHJlYWxpemVkID0gY2xvc2VkLnJlZHVjZSgoYSwgdCkgPT4gYSArIChOdW1iZXIodC5wbmwpIHx8IDApLCAwKTtcbiAgY29uc3Qgd2lucyA9IGNsb3NlZC5maWx0ZXIodCA9PiBOdW1iZXIodC5wbmwpID4gMCkubGVuZ3RoO1xuICBjb25zdCB3aW5SYXRlID0gY2xvc2VkLmxlbmd0aCA/ICh3aW5zIC8gY2xvc2VkLmxlbmd0aCkgKiAxMDAgOiAwO1xuICBjb25zdCBub3dNcyA9IERhdGUubm93KCk7XG4gIGNvbnN0IEZSRVNIX01TID0gOTAgKiAxMDAwO1xuICBjb25zdCBNQVhfRFJJRlRfUENUID0gMC4wMDM7IC8vIDAuMyUgYWJvdmUgZW50cnkg4oaSIHdpbmRvdyBjbG9zZWRcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IG1kOnAtNiBtYXgtdy01eGwgbXgtYXV0byBzcGFjZS15LTVcIj5cbiAgICAgIDxUaHVuZGVyQ29ubmVjdGlvbkJhbm5lciAvPlxuICAgICAgPENvbGxlY3Rpb25XYXRjaGRvZ1BhbmVsIC8+XG4gICAgICA8aGVhZGVyIGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxMaW5rIHRvPVwiL1wiIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGhvdmVyOnRleHQtZm9yZWdyb3VuZCBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgbWItMlwiPlxuICAgICAgICAgICAg4oaQINin2YTYsdis2YjYuSDZhNmE2LHYptmK2LPZitipXG4gICAgICAgICAgPC9MaW5rPlxuICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTN4bCBmb250LWJvbGQgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cbiAgICAgICAgICAgIOKaoSBTY2FscCBMaXZlXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e2BpbmxpbmUtYmxvY2sgaC0yLjUgdy0yLjUgcm91bmRlZC1mdWxsIGJnLWJ1bGwgJHtwdWxzZSAlIDIgPyBcImFuaW1hdGUtcGluZ1wiIDogXCJcIn1gfSAvPlxuICAgICAgICAgIDwvaDE+XG4gICAgICAgICAgPExpbmtcbiAgICAgICAgICAgIHRvPVwiL3NjYWxwLWZlYXNpYmlsaXR5XCJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTIgaW5saW5lLWJsb2NrIHRleHQteHMgdGV4dC1wcmltYXJ5IGhvdmVyOnVuZGVybGluZVwiXG4gICAgICAgICAgPlxuICAgICAgICAgICAg8J+TiiDYqtmC2LHZitixINis2K/ZiNmJINin2YTYpdi02KfYsdin2KogKHByb29mINio2KPYsdmC2KfZhSDYrdmC2YrZgtmK2KkpIOKGklxuICAgICAgICAgIDwvTGluaz5cbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmQgdGV4dC1zbSBtdC0xXCI+XG4gICAgICAgICAgICDYpdi02LnYp9ix2KfYqiDZhNit2LjZitipINmB2YjYsdmK2KkgKFJlYWx0aW1lKS4g2KfZhNi12YjYqiArINil2LTYudin2LEg2KfZhNmF2KrYtdmB2K0g2YrYtNiq2LrZhNmI2Kcg2YHZiiDZhtmB2LMg2KfZhNir2KfZhtmK2Kkg2KfZhNmE2Yog2KjYqti32YTYuSDZgdmK2YfYpyDYp9mE2KXYtNin2LHYqS5cbiAgICAgICAgICA8L3A+XG4gICAgICAgIDwvZGl2PlxuICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgb25DbGljaz17KCkgPT4geyBlbnN1cmVBdWRpb1VubG9jaygpOyBiZWVwKDg4MCk7IHRvYXN0KFwi2KfZhNi12YjYqiDZhdmB2LnZkdmEIOKchVwiKTsgaWYgKHR5cGVvZiBOb3RpZmljYXRpb24gIT09IFwidW5kZWZpbmVkXCIpIE5vdGlmaWNhdGlvbi5yZXF1ZXN0UGVybWlzc2lvbigpLmNhdGNoKCgpID0+IHt9KTsgfX1cbiAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLW1kIGJnLXByaW1hcnkgcHgtMyBweS0yIHRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1wcmltYXJ5LWZvcmVncm91bmRcIlxuICAgICAgICA+XG4gICAgICAgICAg2YHYudmR2YQg2KfZhNi12YjYqiArINin2YTYpdi02LnYp9ix2KfYqlxuICAgICAgICA8L2J1dHRvbj5cbiAgICAgIDwvaGVhZGVyPlxuXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTIgbWQ6Z3JpZC1jb2xzLTQgZ2FwLTNcIj5cbiAgICAgICAgPFN0YXQgbGFiZWw9XCLYpdi02KfYsdin2Kog2KfZhNmK2YjZhVwiIHZhbHVlPXtTdHJpbmcodHJhZGVzLmxlbmd0aCl9IC8+XG4gICAgICAgIDxTdGF0IGxhYmVsPVwi2YXZgdiq2YjYrdipIC8g2YXZgtmB2YjZhNipXCIgdmFsdWU9e2Ake29wZW4ubGVuZ3RofSAvICR7Y2xvc2VkLmxlbmd0aH1gfSAvPlxuICAgICAgICA8U3RhdCBsYWJlbD1cIlBuTCDZhdit2YLZglwiIHZhbHVlPXtgJHtyZWFsaXplZCA+PSAwID8gXCIrXCIgOiBcIlwifSR7cmVhbGl6ZWQudG9GaXhlZCgwKX0gRUdQYH0gdG9uZT17cmVhbGl6ZWQgPj0gMCA/IFwiYnVsbFwiIDogXCJiZWFyXCJ9IC8+XG4gICAgICAgIDxTdGF0IGxhYmVsPVwi2YbYs9io2Kkg2KfZhNmG2KzYp9itXCIgdmFsdWU9e2Ake3dpblJhdGUudG9GaXhlZCgwKX0lYH0gLz5cbiAgICAgIDwvZGl2PlxuXG4gICAgICA8RXh0ZW5zaW9uVG9nZ2xlIC8+XG5cbiAgICAgIDxNYW51YWxPcGVuVGh1bmRlclRhYldpZGdldCAvPlxuXG4gICAgICB7dHJhZGVzLmxlbmd0aCA9PT0gMCA/IChcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLWxnIGJvcmRlciBiZy1jYXJkIHAtMTAgdGV4dC1jZW50ZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XG4gICAgICAgICAg2YTYs9mHINmF2YHZiti0INil2LTYp9ix2KfYqiBTY2FscCDYp9mE2YbZh9in2LHYr9mHLiDYp9mE2KXYtNi52KfYsSDZh9mK2YjYtdmE2YMg2YTYrdi42YrYp9mLINij2YjZhCDZhdinINiq2LfZhNi5LlxuICAgICAgICA8L2Rpdj5cbiAgICAgICkgOiAoXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0yXCI+XG4gICAgICAgICAge3RyYWRlcy5tYXAodCA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZ2VNcyA9IG5vd01zIC0gbmV3IERhdGUodC5lbnRyeV90cykuZ2V0VGltZSgpO1xuICAgICAgICAgICAgY29uc3QgY3VyID0gdC5jdXJyZW50X3ByaWNlID8/IG51bGw7XG4gICAgICAgICAgICBjb25zdCBkcmlmdCA9IGN1ciAhPSBudWxsICYmIHQuZW50cnlfcHJpY2UgPiAwID8gKGN1ciAtIHQuZW50cnlfcHJpY2UpIC8gdC5lbnRyeV9wcmljZSA6IDA7XG4gICAgICAgICAgICBjb25zdCBwcmljZU1vdmVkVXAgPSBjdXIgIT0gbnVsbCAmJiBkcmlmdCA+IE1BWF9EUklGVF9QQ1Q7XG4gICAgICAgICAgICBjb25zdCBpc0ZyZXNoID0gdC5zdGF0dXMgPT09IFwib3BlblwiICYmIGFnZU1zIDw9IEZSRVNIX01TICYmICFwcmljZU1vdmVkVXA7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICA8ZGl2IGtleT17dC5pZH0gY2xhc3NOYW1lPXtgcm91bmRlZC1sZyBib3JkZXIgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBnYXAtNCAke1xuICAgICAgICAgICAgICAgIGlzRnJlc2ggPyBcImJnLXdhcm4vMTUgYm9yZGVyLXdhcm4gc2hhZG93LW1kXCIgOlxuICAgICAgICAgICAgICAgIHQuc3RhdHVzID09PSBcIm9wZW5cIiA/IFwiYmctYWNjZW50LzMwIGJvcmRlci1hY2NlbnRcIiA6IFwiYmctY2FyZFwiXG4gICAgICAgICAgICAgIH1gfT5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi13LTI0XCI+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LTJ4bFwiPnt0LnN5bWJvbH08L2Rpdj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e2ZtdFRpbWUodC5lbnRyeV90cyl9PC9kaXY+XG4gICAgICAgICAgICAgICAgICA8T3BlblRodW5kZXJUYWJCdXR0b24gc3ltYm9sPXt0LnN5bWJvbH0gLz5cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc21cIj5cbiAgICAgICAgICAgICAgICAgIDxkaXY+2K/YrtmI2YQ6IDxzdHJvbmc+e2ZtdFByaWNlKHQuZW50cnlfcHJpY2UpfTwvc3Ryb25nPjwvZGl2PlxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxuICAgICAgICAgICAgICAgICAgICBUUCB7Zm10UHJpY2UodC50cF9wcmljZSl9IC8gU0wge2ZtdFByaWNlKHQuc2xfcHJpY2UpfVxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICB7Y3VyICE9IG51bGwgJiYgKFxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgbXQtMVwiPlxuICAgICAgICAgICAgICAgICAgICAgINin2YTYs9i52LEg2KfZhNii2YY6IDxzdHJvbmcgY2xhc3NOYW1lPXtkcmlmdCA+IDAgPyBcInRleHQtYmVhclwiIDogXCJ0ZXh0LWJ1bGxcIn0+e2ZtdFByaWNlKGN1cil9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+ICh7ZHJpZnQgPj0gMCA/IFwiK1wiIDogXCJcIn17KGRyaWZ0ICogMTAwKS50b0ZpeGVkKDIpfSUpPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgICAgIHt0LmN1cnJlbnRfcHJpY2Vfc291cmNlICYmIChcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YG1yLTIgaW5saW5lLWJsb2NrIHB4LTEuNSBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSBmb250LXNlbWlib2xkICR7XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHQuY3VycmVudF9wcmljZV9zb3VyY2UgPT09IFwidGh1bmRlcl9leHRcIiA/IFwiYmctYnVsbC8yMCB0ZXh0LWJ1bGxcIiA6IFwiYmctbXV0ZWQgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfSB0aXRsZT17dC5jdXJyZW50X3ByaWNlX3RzID8/IHVuZGVmaW5lZH0+XG4gICAgICAgICAgICAgICAgICAgICAgICAgIHt0LmN1cnJlbnRfcHJpY2Vfc291cmNlID09PSBcInRodW5kZXJfZXh0XCIgPyBcIuKaoSBUaHVuZGVyXCIgOiB0LmN1cnJlbnRfcHJpY2Vfc291cmNlfVxuICAgICAgICAgICAgICAgICAgICAgICAgICB7dC5jdXJyZW50X3ByaWNlX3RzICYmIGAgwrcgJHtNYXRoLm1heCgwLCBNYXRoLnJvdW5kKChEYXRlLm5vdygpIC0gbmV3IERhdGUodC5jdXJyZW50X3ByaWNlX3RzKS5nZXRUaW1lKCkpLzEwMDApKX1zYH1cbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICB7dC5wZWFrX3ByaWNlICE9IG51bGwgJiYgdC5wZWFrX3ByaWNlID4gMCAmJiAoKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBwZWFrRHJpZnQgPSB0LmVudHJ5X3ByaWNlID4gMCA/ICh0LnBlYWtfcHJpY2UhIC0gdC5lbnRyeV9wcmljZSkgLyB0LmVudHJ5X3ByaWNlIDogMDtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgaGl0VHAgPSB0LnBlYWtfcHJpY2UhID49IHQudHBfcHJpY2U7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAoXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXhzIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgINij2LnZhNmJINiz2LnYsTogPHN0cm9uZyBjbGFzc05hbWU9XCJ0ZXh0LWJ1bGxcIj57Zm10UHJpY2UodC5wZWFrX3ByaWNlISl9PC9zdHJvbmc+XG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj4gKHtwZWFrRHJpZnQgPj0gMCA/IFwiK1wiIDogXCJcIn17KHBlYWtEcmlmdCAqIDEwMCkudG9GaXhlZCgyKX0lKTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtoaXRUcCAmJiA8c3BhbiBjbGFzc05hbWU9XCJtci0yIHRleHQtWzEwcHhdIGZvbnQtYm9sZCB0ZXh0LWJ1bGxcIj7wn46vINiq2K7Yt9mR2YkgVFA8L3NwYW4+fVxuICAgICAgICAgICAgICAgICAgICAgICAge3QucGVha19wcmljZV90cyAmJiAoXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPiDCtyB7Zm10VGltZSh0LnBlYWtfcHJpY2VfdHMpfTwvc3Bhbj5cbiAgICAgICAgICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgICB9KSgpfVxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwibXItYXV0byB0ZXh0LWxlZnRcIj5cbiAgICAgICAgICAgICAgICAgIHsodC5tYXhfZ2FwX3NlYyA/PyAwKSA+IDYwICYmIChcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJtYi0xIGlubGluZS1ibG9jayByb3VuZGVkIGJnLXdhcm4vMjAgYm9yZGVyIGJvcmRlci13YXJuIHB4LTIgcHktMC41IHRleHQtWzExcHhdIGZvbnQtYm9sZCB0ZXh0LXdhcm5cIiB0aXRsZT17YNij2YPYqNixINmB2KzZiNipINio2YrZhiDYp9mE2KrZitmD2KfYqiDYr9in2K7ZhCDZhtin2YHYsNipINin2YTYtdmB2YLYqSA9ICR7dC5tYXhfZ2FwX3NlY31zIOKAoiDYudiv2K8g2KfZhNiq2YrZg9in2KogPSAke3QudGlja19jb3VudCA/PyAwfWB9PlxuICAgICAgICAgICAgICAgICAgICAgIOKaoO+4jyDZgdis2YjYqSDYqtmK2YPYp9iqIHt0Lm1heF9nYXBfc2VjfXNcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICAgICAge2lzRnJlc2ggPyAoXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtd2FybiBmb250LWJvbGQgdGV4dC1sZ1wiPvCflKUg2KfYr9iu2YQg2K/ZhNmI2YLYqtmKPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKSA6IHQuc3RhdHVzID09PSBcIm9wZW5cIiA/IChcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGZvbnQtc2VtaWJvbGRcIj5cbiAgICAgICAgICAgICAgICAgICAgICB7cHJpY2VNb3ZlZFVwID8gYOKPsyDYp9mE2YbYp9mB2LDYqSDZgdin2KrYqiDigJQg2KfZhNiz2LnYsSDZgdmI2YIg2KfZhNiv2K7ZiNmEINio2YAgJHsoZHJpZnQgKiAxMDApLnRvRml4ZWQoMil9JWAgOiBcIuKPsyDYp9mE2YbYp9mB2LDYqSDZgdin2KrYqlwifVxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XG4gICAgICAgICAgICAgICAgICApIDogKFxuICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e051bWJlcih0LnBubCkgPj0gMCA/IFwidGV4dC1idWxsIGZvbnQtYm9sZFwiIDogXCJ0ZXh0LWJlYXIgZm9udC1ib2xkXCJ9PlxuICAgICAgICAgICAgICAgICAgICAgIHt0LmV4aXRfcmVhc29ufSDigKIge051bWJlcih0LnBubCkgPj0gMCA/IFwiK1wiIDogXCJcIn17TnVtYmVyKHQucG5sKS50b0ZpeGVkKDApfSBFR1BcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICAgKX1cbiAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0pfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICl9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmZ1bmN0aW9uIFN0YXQoeyBsYWJlbCwgdmFsdWUsIHRvbmUgfTogeyBsYWJlbDogc3RyaW5nOyB2YWx1ZTogc3RyaW5nOyB0b25lPzogXCJidWxsXCIgfCBcImJlYXJcIiB9KSB7XG4gIGNvbnN0IGNvbG9yID0gdG9uZSA9PT0gXCJidWxsXCIgPyBcInRleHQtYnVsbFwiIDogdG9uZSA9PT0gXCJiZWFyXCIgPyBcInRleHQtYmVhclwiIDogXCJcIjtcbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQgYm9yZGVyIGJnLWNhcmQgcC0zXCI+XG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+e2xhYmVsfTwvZGl2PlxuICAgICAgPGRpdiBjbGFzc05hbWU9e2B0ZXh0LXhsIGZvbnQtYm9sZCAke2NvbG9yfWB9Pnt2YWx1ZX08L2Rpdj5cbiAgICA8L2Rpdj5cbiAgKTtcbn1cblxuLy8gTWFudWFsIHJlLW9wZW4gb2YgYSBwZXJzaXN0ZW50IFRodW5kZXIgdGFiIGZvciB0aGlzIHN5bWJvbC5cbi8vIFVzZXMgdGhlIGV4dGVuc2lvbiBicmlkZ2UgKHdpbmRvdy5wb3N0TWVzc2FnZSDihpIgY29udGVudC5qcyDihpIgYmFja2dyb3VuZC5qc1xuLy8g4oaSIHBlcnNpc3RPcGVuU3ltYm9sKS4gSWYgdGhlIGV4dGVuc2lvbiBpc24ndCBpbnN0YWxsZWQsIHRoZSBidXR0b24gZmFsbHNcbi8vIGJhY2sgdG8gYSBwbGFpbiBUaHVuZGVyIHNlYXJjaCBsaW5rLlxuZnVuY3Rpb24gT3BlblRodW5kZXJUYWJCdXR0b24oeyBzeW1ib2wgfTogeyBzeW1ib2w6IHN0cmluZyB9KSB7XG4gIGNvbnN0IFtzdGF0ZSwgc2V0U3RhdGVdID0gdXNlU3RhdGU8XCJpZGxlXCIgfCBcIm9rXCIgfCBcImVyclwiIHwgXCJub2V4dFwiPihcImlkbGVcIik7XG4gIGNvbnN0IFttc2csIHNldE1zZ10gPSB1c2VTdGF0ZTxzdHJpbmc+KFwiXCIpO1xuICBjb25zdCBvbkNsaWNrID0gKCkgPT4gcmVxdWVzdE9wZW5UaHVuZGVyVGFiKHN5bWJvbCwgc2V0U3RhdGUsIHNldE1zZyk7XG4gIHJldHVybiAoXG4gICAgPGJ1dHRvblxuICAgICAgdHlwZT1cImJ1dHRvblwiXG4gICAgICBvbkNsaWNrPXtvbkNsaWNrfVxuICAgICAgdGl0bGU9e21zZyB8fCBcItin2YHYqtitINiq2KfYqCDYq9in2YbYr9ixINmE2YfYsNinINin2YTYs9mH2YUg2YXYuSDZgtin2KbZhdipINmF2LnZhNmI2YXYp9iqINin2YTYs9mI2YIgKNin2YTZhdiz2KrZiNmJINin2YTYq9in2YbZiikg2KrZhNmC2KfYptmK2KfZi1wifVxuICAgICAgY2xhc3NOYW1lPXtgbXQtMSBpbmxpbmUtZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTEgcm91bmRlZCBib3JkZXIgcHgtMS41IHB5LTAuNSB0ZXh0LVsxMHB4XSBmb250LXNlbWlib2xkIHRyYW5zaXRpb24tY29sb3JzICR7XG4gICAgICAgIHN0YXRlID09PSBcIm9rXCJcbiAgICAgICAgICA/IFwiYm9yZGVyLWJ1bGwgYmctYnVsbC8xNSB0ZXh0LWJ1bGxcIlxuICAgICAgICAgIDogc3RhdGUgPT09IFwiZXJyXCIgfHwgc3RhdGUgPT09IFwibm9leHRcIlxuICAgICAgICAgICAgPyBcImJvcmRlci1iZWFyIGJnLWJlYXIvMTUgdGV4dC1iZWFyXCJcbiAgICAgICAgICAgIDogXCJib3JkZXItbXV0ZWQtZm9yZWdyb3VuZC8zMCBiZy1tdXRlZC8zMCBob3ZlcjpiZy1hY2NlbnQgaG92ZXI6Ym9yZGVyLWFjY2VudC1mb3JlZ3JvdW5kLzUwXCJcbiAgICAgIH1gfVxuICAgID5cbiAgICAgIHtzdGF0ZSA9PT0gXCJva1wiID8gXCLinIUg2KfYqtmB2KrYrVwiIDogc3RhdGUgPT09IFwibm9leHRcIiA/IFwi4pqg77iPINin2YTYp9mD2LPYqtmG2LTZhiDZhdi0INi02LrZkdin2YRcIiA6IHN0YXRlID09PSBcImVyclwiID8gXCLinYwg2YHYtNmEXCIgOiBcIuKaoSDZgdiq2K0g2KrYp9ioINir2KfZhtiv2LFcIn1cbiAgICA8L2J1dHRvbj5cbiAgKTtcbn1cblxuLy8gQWx3YXlzLXZpc2libGUgbWFudWFsIHdpZGdldDogdHlwZSBhbnkgc3ltYm9sIOKGkiBvcGVucyB0aGUgVGh1bmRlciB0YWJcbi8vIHdpdGggdGhlIEwyIHBhbmVsIGFscmVhZHkgb3Blbi4gV29ya3MgZXZlbiB3aGVuIHRoZXJlIGFyZSAwIHNpZ25hbHMuXG5mdW5jdGlvbiBNYW51YWxPcGVuVGh1bmRlclRhYldpZGdldCgpIHtcbiAgY29uc3QgW3N5bSwgc2V0U3ltXSA9IHVzZVN0YXRlKFwiXCIpO1xuICBjb25zdCBbc3RhdGUsIHNldFN0YXRlXSA9IHVzZVN0YXRlPFwiaWRsZVwiIHwgXCJva1wiIHwgXCJlcnJcIiB8IFwibm9leHRcIj4oXCJpZGxlXCIpO1xuICBjb25zdCBbbXNnLCBzZXRNc2ddID0gdXNlU3RhdGUoXCJcIik7XG4gIGNvbnN0IHN1Ym1pdCA9IChlOiBSZWFjdC5Gb3JtRXZlbnQpID0+IHtcbiAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgY29uc3QgcyA9IHN5bS50cmltKCkudG9VcHBlckNhc2UoKTtcbiAgICBpZiAoIXMpIHJldHVybjtcbiAgICByZXF1ZXN0T3BlblRodW5kZXJUYWIocywgc2V0U3RhdGUsIHNldE1zZyk7XG4gIH07XG4gIHJldHVybiAoXG4gICAgPGZvcm1cbiAgICAgIG9uU3VibWl0PXtzdWJtaXR9XG4gICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLWxnIGJvcmRlciBiZy1jYXJkIHAtMyBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIgZ2FwLTJcIlxuICAgICAgdGl0bGU9e21zZyB8fCBcItin2YHYqtitINiq2KfYqCDYq9in2YbYr9ixINmE2KPZiiDYs9mH2YUg2YrYr9mI2YrYp9mLIOKAlCDZhNmIINir2KfZhtiv2LEg2LnZhdmEIGxvZ291dCDZiNmC2YHZhCDYp9mE2KrYp9ioXCJ9XG4gICAgPlxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtc2VtaWJvbGRcIj7imqEg2YHYqtitINiq2KfYqCDYq9in2YbYr9ixINmK2K/ZiNmKPC9kaXY+XG4gICAgICA8aW5wdXRcbiAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICB2YWx1ZT17c3ltfVxuICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFN5bShlLnRhcmdldC52YWx1ZSl9XG4gICAgICAgIHBsYWNlaG9sZGVyPVwi2LHZhdiyINin2YTYs9mH2YUgKNmF2KvZhCBBQUxSKVwiXG4gICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMiBweS0xIHRleHQtc20gZm9udC1tb25vIHVwcGVyY2FzZSB3LTQwXCJcbiAgICAgICAgbWF4TGVuZ3RoPXsxMn1cbiAgICAgIC8+XG4gICAgICA8YnV0dG9uXG4gICAgICAgIHR5cGU9XCJzdWJtaXRcIlxuICAgICAgICBjbGFzc05hbWU9e2Byb3VuZGVkIGJvcmRlciBweC0zIHB5LTEgdGV4dC1zbSBmb250LXNlbWlib2xkIHRyYW5zaXRpb24tY29sb3JzICR7XG4gICAgICAgICAgc3RhdGUgPT09IFwib2tcIlxuICAgICAgICAgICAgPyBcImJvcmRlci1idWxsIGJnLWJ1bGwvMjAgdGV4dC1idWxsXCJcbiAgICAgICAgICAgIDogc3RhdGUgPT09IFwiZXJyXCIgfHwgc3RhdGUgPT09IFwibm9leHRcIlxuICAgICAgICAgICAgICA/IFwiYm9yZGVyLWJlYXIgYmctYmVhci8yMCB0ZXh0LWJlYXJcIlxuICAgICAgICAgICAgICA6IFwiYm9yZGVyLW11dGVkLWZvcmVncm91bmQvNDAgYmctbXV0ZWQvNDAgaG92ZXI6YmctYWNjZW50XCJcbiAgICAgICAgfWB9XG4gICAgICA+XG4gICAgICAgIHtzdGF0ZSA9PT0gXCJva1wiID8gXCLinIUg2KfYqtmB2KrYrVwiIDogc3RhdGUgPT09IFwibm9leHRcIiA/IFwi4pqg77iPINir2KjZkdiqINin2YTYp9mD2LPYqtmG2LTZhiB2NC4xLjg2XCIgOiBzdGF0ZSA9PT0gXCJlcnJcIiA/IFwi4p2MINmB2LTZhFwiIDogXCLYp9mB2KrYrSDYp9mE2KrYp9ioXCJ9XG4gICAgICA8L2J1dHRvbj5cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1yLWF1dG9cIj5cbiAgICAgICAge21zZyB8fCBcItio2YrZgdiq2K0g2LXZgdit2Kkg2KfZhNiz2YfZhSDZgdmKINir2KfZhtiv2LEg2YjZitmB2KrYrSDZgtin2KbZhdipINmF2LnZhNmI2YXYp9iqINin2YTYs9mI2YIgKEwyKSDYqtmE2YLYp9im2YrYp9mLXCJ9XG4gICAgICA8L2Rpdj5cbiAgICA8L2Zvcm0+XG4gICk7XG59XG5cbi8vIEJyaWRnZSB0byB0aGUgVGh1bmRlciB2NCBleHRlbnNpb24uIFVzZXMgd2luZG93LnBvc3RNZXNzYWdlICsgYSByZXF1ZXN0IGlkO1xuLy8gY29udGVudC5qcyByZWxheXMgdGhlIFNXIHJlc3BvbnNlIGJhY2sgc28gd2UgY2FuIHNob3cgYSByZWFsIGVycm9yIGluc3RlYWRcbi8vIG9mIGEgZmFrZSBcInN1Y2Nlc3NcIi4gRmFsbHMgYmFjayB0byBhIGNsZWFyIFwiZXh0ZW5zaW9uIG5vdCBkZXRlY3RlZFwiIHN0YXRlXG4vLyB3aGVuIHRoZSBET00gbWFya2VyIGlzbid0IHByZXNlbnQgKGV4dGVuc2lvbiBub3QgaW5zdGFsbGVkIG9yIG91dGRhdGVkKS5cbmZ1bmN0aW9uIHJlcXVlc3RPcGVuVGh1bmRlclRhYihcbiAgc3ltYm9sOiBzdHJpbmcsXG4gIHNldFN0YXRlOiAoczogXCJpZGxlXCIgfCBcIm9rXCIgfCBcImVyclwiIHwgXCJub2V4dFwiKSA9PiB2b2lkLFxuICBzZXRNc2c6IChzOiBzdHJpbmcpID0+IHZvaWQsXG4pIHtcbiAgY29uc3QgbWFya2VyID0gdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiXG4gICAgPyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ/LmdldEF0dHJpYnV0ZShcImRhdGEtdGh1bmRlci1leHQtdjRcIilcbiAgICA6IG51bGw7XG4gIGlmICghbWFya2VyKSB7XG4gICAgc2V0U3RhdGUoXCJub2V4dFwiKTtcbiAgICBzZXRNc2coXCLYp9mE2KfZg9iz2KrZhti02YYgdjQuMS44NiDZhdi0INmF2KrYq9io2ZHYqiDYo9mIINmG2LPYrtipINmC2K/ZitmF2Kkg4oCUINmG2LLZkdmEINin2YTZgFpJUCDYp9mE2KzYr9mK2K8g2YXZhiDYtdmB2K3YqSBUaHVuZGVyINmI2KPYudivINiq2K3ZhdmK2YTZhyDZhdmGIGNocm9tZTovL2V4dGVuc2lvbnMuXCIpO1xuICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0U3RhdGUoXCJpZGxlXCIpLCA0MDAwKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgcmVxSWQgPSBgb3Blbi0ke0RhdGUubm93KCl9LSR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMiwgOCl9YDtcbiAgbGV0IGRvbmUgPSBmYWxzZTtcbiAgY29uc3Qgb25Nc2cgPSAoZXY6IE1lc3NhZ2VFdmVudCkgPT4ge1xuICAgIGNvbnN0IGQ6IGFueSA9IGV2LmRhdGE7XG4gICAgaWYgKCFkIHx8IGQuX190aHVuZGVyUmVzcG9uc2UgIT09IHRydWUgfHwgZC5fX3JlcUlkICE9PSByZXFJZCkgcmV0dXJuO1xuICAgIGRvbmUgPSB0cnVlO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBvbk1zZyk7XG4gICAgaWYgKGQub2spIHtcbiAgICAgIHNldFN0YXRlKFwib2tcIik7XG4gICAgICBzZXRNc2coXCJcIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHNldFN0YXRlKFwiZXJyXCIpO1xuICAgICAgc2V0TXNnKGQuZXJyIHx8IGQucmVzcD8uZXJyb3IgfHwgXCLZgdi02YQg2LrZitixINmF2LnYsdmI2YFcIik7XG4gICAgfVxuICAgIHNldFRpbWVvdXQoKCkgPT4gc2V0U3RhdGUoXCJpZGxlXCIpLCAzMDAwKTtcbiAgfTtcbiAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsIG9uTXNnKTtcbiAgdHJ5IHtcbiAgICB3aW5kb3cucG9zdE1lc3NhZ2UoXG4gICAgICB7IF9fdGh1bmRlcjogdHJ1ZSwgdHlwZTogXCJvcGVuUGVyc2lzdFRhYlwiLCBwYXlsb2FkOiB7IHN5bWJvbCB9LCBfX3JlcUlkOiByZXFJZCB9LFxuICAgICAgd2luZG93LmxvY2F0aW9uLm9yaWdpbixcbiAgICApO1xuICB9IGNhdGNoIChlOiBhbnkpIHtcbiAgICB3aW5kb3cucmVtb3ZlRXZlbnRMaXN0ZW5lcihcIm1lc3NhZ2VcIiwgb25Nc2cpO1xuICAgIHNldFN0YXRlKFwiZXJyXCIpO1xuICAgIHNldE1zZyhTdHJpbmcoZT8ubWVzc2FnZSB8fCBlKSk7XG4gICAgc2V0VGltZW91dCgoKSA9PiBzZXRTdGF0ZShcImlkbGVcIiksIDMwMDApO1xuICAgIHJldHVybjtcbiAgfVxuICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICBpZiAoZG9uZSkgcmV0dXJuO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBvbk1zZyk7XG4gICAgc2V0U3RhdGUoXCJlcnJcIik7XG4gICAgc2V0TXNnKFwi2YXZgdmK2LQg2LHYryDZhdmGINin2YTYp9mD2LPYqtmG2LTZhiDigJQg2KrYo9mD2K8g2KXZhiDYq9in2YbYr9ixINmF2LPYrNmR2YQg2K/YrtmI2YQg2KvZhSDYp9i22LrYtyDYqtin2YbZii5cIik7XG4gICAgc2V0VGltZW91dCgoKSA9PiBzZXRTdGF0ZShcImlkbGVcIiksIDQwMDApO1xuICB9LCAyNTAwKTtcbn1cbiJdLCJmaWxlIjoiRDovbWVreS1zdG9jay1tYWluL21la3ktc3RvY2stbWFpbi9zcmMvcm91dGVzL3NjYWxwLnRzeCJ9