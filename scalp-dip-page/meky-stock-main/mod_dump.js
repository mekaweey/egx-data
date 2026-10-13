import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/scalp-dip.tsx?tsr-split=component");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f3a543ee"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import { createClientRpc } from "/node_modules/@tanstack/react-start/dist/esm/client-rpc.js?v=f3a543ee";
import { createServerFn, useServerFn } from "/node_modules/@tanstack/react-start/dist/esm/index.js?v=f3a543ee";
import { useQuery } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=f3a543ee";
import __vite__cjsImport4_react from "/node_modules/.vite/deps/react.js?v=f3a543ee"; const useState = __vite__cjsImport4_react["useState"]; const useEffect = __vite__cjsImport4_react["useEffect"]; const useRef = __vite__cjsImport4_react["useRef"];
import { fmtPrice } from "/src/lib/format/price.ts";
import { DataFreshnessBanner } from "/src/components/data-freshness-banner.tsx";
import { BACKTEST_DISCLAIMER_AR, BACKTEST_WEEKLY_EGP, BACKTEST_WEEKLY_EGP_LOW, BACKTEST_WEEKLY_EGP_HIGH, BACKTEST_WORST_WEEK_PCT, BACKTEST_MAXDD_PCT, CURRENT_REGIME_WEEKLY_LOW_EGP, CURRENT_REGIME_WEEKLY_HIGH_EGP } from "/src/lib/scalp-dip/momentum-weekly.server.ts";
import { playSignalChime, playEmergencySiren, playScheduledExitTone } from "/src/lib/scalp-dip/operational-audio.ts";
const getPageData = createServerFn({
  method: "GET"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAtZGlwLnRzeD90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJnZXRQYWdlRGF0YV9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0"));
const markBoughtFn = createServerFn({
  method: "POST"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAtZGlwLnRzeD90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJtYXJrQm91Z2h0Rm5fY3JlYXRlU2VydmVyRm5faGFuZGxlciJ9"));
const markSoldFn = createServerFn({
  method: "POST"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAtZGlwLnRzeD90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJtYXJrU29sZEZuX2NyZWF0ZVNlcnZlckZuX2hhbmRsZXIifQ"));
const saveCapital = createServerFn({
  method: "POST"
}).handler(createClientRpc("eyJmaWxlIjoiL3NyYy9yb3V0ZXMvc2NhbHAtZGlwLnRzeD90c3Mtc2VydmVyZm4tc3BsaXQiLCJleHBvcnQiOiJzYXZlQ2FwaXRhbF9jcmVhdGVTZXJ2ZXJGbl9oYW5kbGVyIn0"));
function fmtDate(iso) {
  return iso ? iso.slice(0, 10) : "—";
}
function trackStatus(s) {
  if (s.sold) return {
    label: "مُغلقة — بيع مسجل ✓",
    cls: "text-muted-foreground"
  };
  if (s.sell_signal) return {
    label: "إشارة بيع الآن ⚠",
    cls: "text-amber-400"
  };
  if (s.bought) return {
    label: "قيد المتابعة",
    cls: "text-bull"
  };
  return {
    label: "بانتظار التنفيذ",
    cls: "text-foreground"
  };
}
function StatCard({
  label,
  value,
  sub,
  tone = "default"
}) {
  const cls = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : tone === "warn" ? "text-amber-400" : tone === "muted" ? "text-muted-foreground" : "text-foreground";
  return /* @__PURE__ */ jsxDEV("div", { className: "bg-card border rounded-xl p-3 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:339:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] uppercase font-medium tracking-wider text-muted-foreground mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:340:7", children: label }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 89,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `text-lg font-extrabold font-mono ${cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:341:7", children: value }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 90,
      columnNumber: 7
    }, this),
    sub && /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:342:15", children: sub }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 91,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
    lineNumber: 88,
    columnNumber: 10
  }, this);
}
_c = StatCard;
function ScalpDipOperationalPage() {
  _s();
  const fetchPage = useServerFn(getPageData);
  const saveCapitalFn = useServerFn(saveCapital);
  const markBoughtFnUi = useServerFn(markBoughtFn);
  const markSoldFnUi = useServerFn(markSoldFn);
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["scalp-dip-operational-dashboard"],
    queryFn: () => fetchPage(),
    refetchInterval: 15e3
  });
  const sizing = data?.plan?.sizing;
  const [capitalInput, setCapitalInput] = useState(sizing ? String(Math.round(sizing.total_capital)) : "");
  const [savingCap, setSavingCap] = useState(false);
  const [capMsg, setCapMsg] = useState(null);
  useEffect(() => {
    if (sizing && !capitalInput) setCapitalInput(String(Math.round(sizing.total_capital)));
  }, [sizing?.total_capital]);
  const [busySignal, setBusySignal] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [priceOverrides, setPriceOverrides] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const [isWindowExpired, setIsWindowExpired] = useState(false);
  const [isBeforeMarket, setIsBeforeMarket] = useState(false);
  const [dryRunActive, setDryRunActive] = useState(false);
  const [dryRunSimulationTime, setDryRunSimulationTime] = useState(12 * 60 + 34);
  const sirenPlayedRef = useRef(false);
  useEffect(() => {
    const hasEmergency = (data?.openPositions ?? []).some((p) => p.isAnomaly);
    if (hasEmergency && !sirenPlayedRef.current) {
      playEmergencySiren();
      sirenPlayedRef.current = true;
    } else if (!hasEmergency) {
      sirenPlayedRef.current = false;
    }
  }, [data?.openPositions]);
  useEffect(() => {
    function updateCountdown() {
      if (dryRunActive) {
        setDryRunSimulationTime((prev) => prev > 0 ? prev - 1 : 0);
        return;
      }
      try {
        const now = /* @__PURE__ */ new Date();
        const cairoStr = now.toLocaleString("en-US", {
          timeZone: "Africa/Cairo"
        });
        const cairo = new Date(cairoStr);
        const h = cairo.getHours();
        const m = cairo.getMinutes();
        const s = cairo.getSeconds();
        const secondsSinceMidnight = (h * 60 + m) * 60 + s;
        const windowStart = 10 * 3600;
        const windowDuration = 15 * 60;
        if (secondsSinceMidnight < windowStart) {
          setIsBeforeMarket(true);
          setSecondsRemaining(windowDuration);
          setIsWindowExpired(false);
        } else {
          setIsBeforeMarket(false);
          const elapsed = secondsSinceMidnight - windowStart;
          if (elapsed < windowDuration) {
            setSecondsRemaining(windowDuration - elapsed);
            setIsWindowExpired(false);
          } else {
            setSecondsRemaining(0);
            setIsWindowExpired(true);
          }
        }
      } catch {
      }
    }
    updateCountdown();
    const interval = setInterval(updateCountdown, 1e3);
    return () => clearInterval(interval);
  }, [dryRunActive]);
  const displaySeconds = dryRunActive ? dryRunSimulationTime : secondsRemaining;
  const mm = String(Math.floor(displaySeconds / 60)).padStart(2, "0");
  const ss = String(displaySeconds % 60).padStart(2, "0");
  const onSaveCapital = async () => {
    const v = Number(capitalInput);
    if (!Number.isFinite(v) || v <= 0) {
      setCapMsg("⚠️ أدخل مبلغًا صحيحًا أكبر من صفر");
      return;
    }
    setSavingCap(true);
    setCapMsg(null);
    try {
      const r = await saveCapitalFn({
        data: {
          capital: v
        }
      });
      if (r.ok) {
        setCapMsg(`✅ تم الحفظ: ${r.sizing.top_n} مركز × ${Math.round(r.sizing.slot_capital).toLocaleString()} ج.م`);
        await refetch();
      } else {
        setCapMsg(`❌ ${r.error}`);
      }
    } catch (e) {
      setCapMsg(`❌ خطأ: ${e?.message ?? "غير معروف"}`);
    } finally {
      setSavingCap(false);
    }
  };
  const onBought = async (sig) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : void 0;
      const r = await markBoughtFnUi({
        data: {
          signal_id: sig.id,
          price
        }
      });
      if (r.ok) {
        setActionMsg(`✅ ${sig.symbol}: تم تسجيل الشراء @ ${fmtPrice(r.signal?.actual_buy_price ?? sig.entry_price)} ج.م`);
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e) {
      setActionMsg(`❌ ${sig.symbol}: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusySignal(null);
    }
  };
  const onSold = async (sig) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : void 0;
      const r = await markSoldFnUi({
        data: {
          signal_id: sig.id,
          price
        }
      });
      if (r.ok) {
        const pnl = r.signal?.realized_pnl;
        setActionMsg(pnl != null ? `✅ ${sig.symbol}: تم تسجيل البيع — صافي ${Math.round(Number(pnl)).toLocaleString()} ج.م (${(Number(r.signal?.realized_pnl_pct) * 100).toFixed(2)}%)` : `✅ ${sig.symbol}: تم تسجيل البيع`);
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e) {
      setActionMsg(`❌ ${sig.symbol}: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusySignal(null);
    }
  };
  const plan = data?.plan;
  const todaySignals = data?.todaySignals ?? [];
  const batchScanDate = data?.batchScanDate ?? "";
  const openPositions = data?.openPositions ?? [];
  const auditLogs = data?.auditLogs ?? [];
  const sellAlerts = data?.sellAlerts ?? [];
  const totalOpenPnlEgp = openPositions.reduce((sum, p) => sum + p.pnlEgp, 0);
  const simulatedCandidates = [{
    id: 9991,
    scan_date: "2026-09-17",
    symbol: "TMGH",
    entry_price: 54.2,
    gap_pct: 0.0185,
    position_value: 5e3,
    bought: false
  }, {
    id: 9992,
    scan_date: "2026-09-17",
    symbol: "FWRY",
    entry_price: 8.65,
    gap_pct: 0.021,
    position_value: 5e3,
    bought: false
  }];
  const simulatedPositions = [{
    id: 9993,
    scan_date: "2026-09-17",
    symbol: "COMI",
    entry_price: 132.5,
    actual_buy_price: 132.5,
    buy_timestamp: "2026-09-17T08:05:00Z",
    gap_pct: 0.014,
    bid_depth_at_entry: 45e4,
    position_value: 5e3,
    bought: true,
    sold: false,
    day1_status: "HELD",
    day1_price: 132.5,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: null,
    bid_confirmed_at_exit: null,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    actual_sell_price: null,
    sell_timestamp: null,
    realized_pnl: null,
    realized_pnl_pct: null,
    sell_signal: false,
    sell_signal_reason: null,
    created_at: "2026-09-17T08:00:00Z",
    updated_at: "2026-09-17T08:00:00Z",
    currentPrice: 135.2,
    pnlEgp: 102,
    pnlPct: 0.0204,
    daysHeld: 2,
    daysRemaining: 3,
    exitDate: "2026-09-22",
    exitDayName: "الثلاثاء",
    isScheduledExit: false,
    isAnomaly: false,
    shares: 37
  }, {
    id: 9994,
    scan_date: "2026-09-17",
    symbol: "EKHO",
    entry_price: 1.3,
    actual_buy_price: 1.3,
    buy_timestamp: "2026-09-17T08:05:00Z",
    gap_pct: 0.022,
    bid_depth_at_entry: 12e4,
    position_value: 5e3,
    bought: true,
    sold: false,
    day1_status: "HELD",
    day1_price: 1.3,
    day2_status: null,
    day2_price: null,
    day3_status: null,
    day3_price: null,
    exit_reason: "STOP_LOSS",
    bid_confirmed_at_exit: true,
    extra_hold_used: false,
    shadow_exit_price: null,
    shadow_pnl: null,
    shadow_pnl_pct: null,
    actual_sell_price: null,
    sell_timestamp: null,
    realized_pnl: null,
    realized_pnl_pct: null,
    sell_signal: true,
    sell_signal_reason: "STOP_LOSS",
    created_at: "2026-09-17T08:00:00Z",
    updated_at: "2026-09-17T08:00:00Z",
    currentPrice: 1.15,
    pnlEgp: -576,
    pnlPct: -0.1154,
    daysHeld: 2,
    daysRemaining: 3,
    exitDate: "2026-09-22",
    exitDayName: "الثلاثاء",
    isScheduledExit: false,
    isAnomaly: false,
    shares: 3846
  }];
  const activeCandidatesList = dryRunActive ? simulatedCandidates : todaySignals;
  const activeOpenPositionsList = dryRunActive ? simulatedPositions : openPositions;
  const emergencyAnomalyPositions = activeOpenPositionsList.filter((p) => p.isAnomaly);
  const scheduledExitPositions = activeOpenPositionsList.filter((p) => p.isScheduledExit);
  return /* @__PURE__ */ jsxDEV("div", { className: "p-4 md:p-6 max-w-6xl mx-auto space-y-5", dir: "rtl", "data-tsd-source": "/src/routes/scalp-dip.tsx:638:5", children: [
    /* @__PURE__ */ jsxDEV(DataFreshnessBanner, { "data-tsd-source": "/src/routes/scalp-dip.tsx:639:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 381,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { className: "flex flex-wrap items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:642:7", children: [
      /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:643:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:644:11", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:645:13", children: "⚡" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 387,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-black tracking-tight", "data-tsd-source": "/src/routes/scalp-dip.tsx:646:13", children: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 388,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 386,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:648:11", children: "أتمتة كاملة للمسح والمتابعة • نظام أسبوعي: دخول الأحد، خروج افتتاح الأسبوع القادم • دورك الوحيد: ضغط زر الشراء أو البيع في ثاندر بعد التنبيه." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 390,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "mt-2 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-accent transition", onClick: async () => {
          try {
            const r = await fetch("/api/public/hooks/archive-folder?action=open");
            const j = await r.json();
            if (j.ok) console.log("archive:", j.catchup);
          } catch {
          }
        }, "data-tsd-source": "/src/routes/scalp-dip.tsx:651:11", children: "📁 فتح مجلد أرشيف البيانات اليومية" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 393,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 385,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:665:9", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setDryRunActive(!dryRunActive);
          if (!dryRunActive) {
            playSignalChime();
          }
        }, className: `rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${dryRunActive ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10" : "bg-muted hover:bg-muted/70 text-foreground border-border"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:666:11", children: dryRunActive ? "🧪 وضع المحاكاة مفعّل ✓ (إيقاف)" : "🧪 تجربة المحاكاة (Dry Run)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 405,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => refetch(), className: "rounded-xl px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/70 text-foreground border border-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:681:11", children: "تحديث البيانات 🔄" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 413,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 404,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 384,
      columnNumber: 7
    }, this),
    dryRunActive && /* @__PURE__ */ jsxDEV("div", { className: "bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:692:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:693:11", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-lg", "data-tsd-source": "/src/routes/scalp-dip.tsx:694:13", children: "💡" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 422,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-amber-200", "data-tsd-source": "/src/routes/scalp-dip.tsx:695:13", children: "أنت الآن في وضع المحاكاة التجريبية: اختبر مظهر العداد التنازلي وتنبيهات الطوارئ وتجربة الأصوات قبل بدء الجلسة الحقيقية." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 423,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 421,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:699:11", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playSignalChime(), className: "bg-bull/20 hover:bg-bull/30 text-bull px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:700:13", children: "🔔 نغمة الإشارة (10:00)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 428,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playEmergencySiren(), className: "bg-bear/20 hover:bg-bear/30 text-bear px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:706:13", children: "🚨 صفارة الطوارئ" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 431,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playScheduledExitTone(), className: "bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:712:13", children: "📅 نغمة البيع المجدول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 434,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 427,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 420,
      columnNumber: 24
    }, this),
    (emergencyAnomalyPositions.length > 0 || sellAlerts.length > 0) && /* @__PURE__ */ jsxDEV("section", { className: "space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:724:9", children: [
      emergencyAnomalyPositions.map((p) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-4 shadow-md flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:727:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:731:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:732:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 445,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:733:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-amber-300", "data-tsd-source": "/src/routes/scalp-dip.tsx:734:19", children: [
              "تنبيه طوارئ: ",
              p.symbol,
              " — تحقق فوراً من السهم!"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 447,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-200/90 mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:737:19", children: "السبب: رصد خبر سلبي حاد أو تقلب استثنائي غير متوقع يهدد الصفقة قبل اكتمال مدة المسك." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 450,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 446,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 444,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(p), disabled: busySignal === p.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white", "data-tsd-source": "/src/routes/scalp-dip.tsx:742:15", children: "تخارج اضطراري" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 455,
          columnNumber: 15
        }, this)
      ] }, `anom-${p.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 443,
        columnNumber: 49
      }, this)),
      sellAlerts.map((s) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-primary/50 bg-primary/15 p-4 flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:754:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:758:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:759:17", children: "📅" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 463,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:760:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-primary-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:761:19", children: [
              "حان وقت البيع المجدول: ",
              s.symbol,
              " (اكتملت 5 جلسات — خروج افتتاح الأسبوع القادم)"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 465,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:764:19", children: "نهاية فترة المسك الأسبوعية. الخروج بسعر السوق في تطبيق ثاندر عند الافتتاح — نفس قاعدة القياس التاريخي." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 468,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 464,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 462,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90", "data-tsd-source": "/src/routes/scalp-dip.tsx:769:15", children: busySignal === s.id ? "..." : "تم البيع ✓" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 473,
          columnNumber: 15
        }, this)
      ] }, `sa-${s.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 461,
        columnNumber: 34
      }, this))
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 441,
      columnNumber: 75
    }, this),
    actionMsg && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-card p-3 text-xs font-bold text-bull flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:782:9", children: [
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:783:11", children: "🔔" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 480,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:784:11", children: actionMsg }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 481,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 479,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:789:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:790:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:791:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:792:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:793:15", children: "🎯" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 489,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:794:15", children: "إشارات اليوم (الساعة 10:00 صباحاً)" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 490,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:795:15", children: [
              activeCandidatesList.length,
              " مرشح"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 491,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 488,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:799:13", children: "الأسهم المؤهلة بعد كل فلاتر النظام الصادق: شريعة فقط + سيولة ≥ 200 ألف ج.م/يوم (أعلى 100) + زخم 5 جلسات بين 8%-45% + فلتر النظام (تراكم 10 أسابيع) + قاعدة الفجوة عند الافتتاح (-3% إلى +2%)." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 495,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 487,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:805:11", children: !isWindowExpired ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-bull/15 border border-bull/30 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:807:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base animate-pulse", "data-tsd-source": "/src/routes/scalp-dip.tsx:808:17", children: "⏱️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 503,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:809:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-bull font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:810:19", children: "نافذة التنفيذ الموصى بها" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 505,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-base font-black font-mono text-bull tracking-wider", "data-tsd-source": "/src/routes/scalp-dip.tsx:811:19", children: [
              "متبقي ",
              mm,
              ":",
              ss,
              " دقيقة"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 506,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 504,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 502,
          columnNumber: 33
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:817:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base", "data-tsd-source": "/src/routes/scalp-dip.tsx:818:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 511,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:819:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-amber-400 font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:820:19", children: "انتهت نافذة الـ 15 دقيقة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 513,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-300 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:821:19", children: "الفرصة الأصلية بعيدة — تحقق من السعر قبل الشراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 514,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 512,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 510,
          columnNumber: 24
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 501,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 486,
        columnNumber: 9
      }, this),
      isWindowExpired && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:832:11", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:833:13", children: "⚠️" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 524,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:834:13", children: [
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:835:15", children: "تنبيه تأخر:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 526,
            columnNumber: 15
          }, this),
          " تجاوزت مدة الـ 15 دقيقة الأولى من الجلسة. الإشارات لا تُحذف تلقائياً حرصاً على عدم تفويت الفرص، ولكن تأكد من سعر السهم الحالي في تطبيق ثاندر قبل الضغط على الشراء."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 525,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 523,
        columnNumber: 29
      }, this),
      activeCandidatesList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:841:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:842:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:843:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:844:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:845:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 534,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:846:19", children: "سعر إشارة الدخول" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 535,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:847:19", children: "زخم 5 جلسات %" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 536,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:848:19", children: "قيمة المركز المخطط" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 537,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:849:19", children: "السعر المنفذ (إن اختلف)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 538,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-center font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:850:19", children: "الإجراء في ثاندر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 539,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 533,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 532,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:853:15", children: activeCandidatesList.map((s) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:855:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:856:21", children: [
            s.symbol,
            s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:859:25", children: "شريعة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 546,
              columnNumber: 45
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 544,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:862:21", children: [
            fmtPrice(Number(s.entry_price)),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 548,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:865:21", children: [
            "+",
            (Number(s.gap_pct) * 100).toFixed(2),
            "%"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 551,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:868:21", children: [
            Math.round(Number(s.position_value)).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 554,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:871:21", children: /* @__PURE__ */ jsxDEV("input", { type: "number", step: "0.01", placeholder: fmtPrice(Number(s.entry_price)), value: priceOverrides[s.id] ?? "", onChange: (e) => setPriceOverrides((p) => ({
            ...p,
            [s.id]: e.target.value
          })), className: "w-24 rounded-lg border bg-background px-2 py-1 text-xs font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:872:23" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 558,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 557,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:881:21", children: !s.bought ? /* @__PURE__ */ jsxDEV("button", { onClick: () => onBought(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bull text-bull-foreground hover:bg-bull/90 transition-all shadow-sm disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:883:25", children: busySignal === s.id ? "جاري الحفظ..." : "تم الشراء ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 564,
            columnNumber: 36
          }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-bull bg-bull/20 px-3 py-1 rounded-full", "data-tsd-source": "/src/routes/scalp-dip.tsx:891:25", children: "تم الشراء قيد المتابعة ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 566,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 563,
            columnNumber: 21
          }, this)
        ] }, s.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 543,
          columnNumber: 50
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 542,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 531,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 530,
        columnNumber: 44
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:902:11", children: isBeforeMarket ? "🕒 ننتظر بدء جلسة التداول في تمام الساعة 10:00 صباحاً لإطلاق إشارات اليوم." : "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — أو فلتر النظام أوقف التداول. النظام أسبوعي: الدخول الأحد فقط." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 573,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 485,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:911:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:912:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:913:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:914:13", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:915:15", children: "🔎" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 583,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:916:15", children: "التتبع الحي — كل إشارة في الدفعة الحالية" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 584,
            columnNumber: 15
          }, this),
          batchScanDate && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:918:17", children: [
            "دفعة مسح ",
            batchScanDate
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 585,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 582,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:923:13", children: "رُشِّح بكام (سعر الترشيح) ← السعر الحي الآن ← الفرق اللحظي %. تحديث تلقائي كل 15 ثانية. «—» يعني لا يوجد سعر لحظي لهذا السهم الآن (السعر المرجعي يظل سعر الترشيح)." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 589,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 581,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 580,
        columnNumber: 9
      }, this),
      todaySignals.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:931:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:932:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:933:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:934:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:935:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 600,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:936:19", children: "رُشِّح @" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 601,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:937:19", children: "حدود الشراء" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 602,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:938:19", children: "السعر الحي" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 603,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:939:19", children: "% حي من الترشيح" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 604,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:940:19", children: "الحالة" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 605,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 599,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 598,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:943:15", children: todaySignals.map((s) => {
          const st = trackStatus(s);
          return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:947:21", children: [
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:948:23", children: [
              s.symbol,
              s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:951:27", children: "شريعة" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 614,
                columnNumber: 38
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 612,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:954:23", children: s._bandLo != null && s._bandHi != null ? `${fmtPrice(s._bandLo)} – ${fmtPrice(s._bandHi)}` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 616,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:957:23", children: s.livePrice != null ? `${fmtPrice(s.livePrice)} ج.م` : /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:961:27", children: "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 620,
              columnNumber: 81
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 619,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: `p-3 font-mono font-bold ${s.livePct == null ? "text-muted-foreground" : s.livePct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:964:23", children: s.livePct != null ? `${s.livePct >= 0 ? "+" : ""}${(s.livePct * 100).toFixed(2)}%` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 622,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:967:23", children: /* @__PURE__ */ jsxDEV("span", { className: `text-[11px] font-bold px-2 py-0.5 rounded bg-muted/60 ${st.cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:968:25", children: st.label }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 626,
              columnNumber: 25
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 625,
              columnNumber: 23
            }, this)
          ] }, `lt-${s.id}`, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 611,
            columnNumber: 22
          }, this);
        }) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 608,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 597,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 596,
        columnNumber: 36
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:977:11", children: "لا توجد إشارات في الدفعة الحالية — ستظهر هنا فور أول مسح أسبوعي (الأحد)." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 632,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 579,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:984:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:985:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:986:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:987:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:988:15", children: "💼" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 642,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:989:15", children: [
              "الصفقات المفتوحة قيد المتابعة (",
              activeOpenPositionsList.length,
              ")"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 643,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 641,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:993:13", children: "متابعة حية مستمرة لكل صفقة تم تأكيد شرائها طوال الأسبوع (5 جلسات) — الخروج الوحيد: افتتاح أول جلسة الأسبوع القادم. بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية عبر تصغير الحجم تلقائياً." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 647,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 640,
          columnNumber: 11
        }, this),
        activeOpenPositionsList.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:999:13", children: [
          "إجمالي الأرباح اللحظية:",
          " ",
          /* @__PURE__ */ jsxDEV("span", { className: totalOpenPnlEgp >= 0 ? "text-bull" : "text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:1001:15", children: [
            totalOpenPnlEgp >= 0 ? "+" : "",
            Math.round(totalOpenPnlEgp).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 654,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 652,
          columnNumber: 50
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 639,
        columnNumber: 9
      }, this),
      activeOpenPositionsList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:1010:11", children: activeOpenPositionsList.map((pos) => {
        const progressPct = Math.min(100, Math.round(pos.daysHeld / 5 * 100));
        return /* @__PURE__ */ jsxDEV("div", { className: `rounded-2xl border p-4 space-y-3 transition-all ${pos.isAnomaly ? "border-amber-500 bg-amber-500/10" : "bg-card border-border hover:border-border/80"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1014:17", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", "data-tsd-source": "/src/routes/scalp-dip.tsx:1022:19", children: [
            /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1023:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-base font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1024:23", children: pos.symbol }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 667,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground mr-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1025:23", children: [
                "دخول: ",
                fmtDate(pos.scan_date),
                " @ ",
                fmtPrice(Number(pos.actual_buy_price ?? pos.entry_price)),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 668,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 666,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1029:21", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1030:23", children: [
                fmtPrice(pos.currentPrice),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 673,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: `text-[11px] font-bold font-mono ${pos.pnlPct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1033:23", children: [
                pos.pnlPct >= 0 ? "+" : "",
                (pos.pnlPct * 100).toFixed(2),
                "% (",
                pos.pnlEgp >= 0 ? "+" : "",
                Math.round(pos.pnlEgp).toLocaleString(),
                " ج.م)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 676,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 672,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 665,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1046:19", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:1047:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1048:23", children: "مسار الأسبوع (تقويم EGX):" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 687,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1051:23", children: [
                "جلسة ",
                Math.min(pos.daysHeld, 5),
                " من 5 (متبقي ",
                pos.daysRemaining,
                " جلسة)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 690,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 686,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-muted rounded-full h-2 overflow-hidden", "data-tsd-source": "/src/routes/scalp-dip.tsx:1055:21", children: /* @__PURE__ */ jsxDEV("div", { className: `h-full rounded-full transition-all ${pos.daysHeld >= 5 ? "bg-primary" : "bg-bull"}`, style: {
              width: `${progressPct}%`
            }, "data-tsd-source": "/src/routes/scalp-dip.tsx:1056:23" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 695,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 694,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground pt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1063:21", children: [
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1064:23", children: "بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية: تصغير الحجم التلقائي" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 700,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1065:23", children: [
                "الخروج: ",
                pos.exitDayName,
                " ",
                pos.exitDate,
                " عند الافتتاح"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 701,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 699,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 685,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1070:19", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1071:21", children: [
              pos.shares.toLocaleString(),
              " سهم"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 707,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(pos), disabled: busySignal === pos.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bear/20 text-bear hover:bg-bear/30 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:1074:21", children: busySignal === pos.id ? "..." : "تم البيع في ثاندر ✓" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 710,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 706,
            columnNumber: 19
          }, this)
        ] }, pos.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 664,
          columnNumber: 18
        }, this);
      }) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 661,
        columnNumber: 47
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1087:11", children: "لا توجد صفقات مفتوحة حالياً. عند ظهور إشارة وضغطك على «تم الشراء»، ستظهر الصفقة هنا وتخضع للمراقبة الحية بالثواني." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 716,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 638,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-muted/20 p-4 space-y-3 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1094:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-foreground font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1095:9", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1096:11", children: "📅" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 724,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1097:11", children: "التقويم التشغيلي الصريح لـ EGX وتوزيع الأيام:" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 725,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 723,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-3 text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1099:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1100:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1101:13", children: "دورة الأسبوع (5 جلسات، يتخطى عطلة نهاية الأسبوع):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 729,
            columnNumber: 13
          }, this),
          "الدخول: افتتاح أول جلسة الأسبوع (الأحد) — الخروج: افتتاح أول جلسة الأسبوع القادم.",
          /* @__PURE__ */ jsxDEV("br", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1103:13" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 731,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1104:13", children: "مثال حي:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 732,
            columnNumber: 13
          }, this),
          " دخول ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1104:34", children: "الأحد" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 732,
            columnNumber: 86
          }, this),
          " ➔ الأسبوع يمشي (الأحد-الخميس) ➔ الجمعة والسبت خارج الحساب ➔ خروج ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1104:112", children: "الأحد القادم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 732,
            columnNumber: 216
          }, this),
          " عند الافتتاح. بلا وقف خسارة ولا جني أرباح — الاتنين مُقاسين: يزيدوا الخسارة."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 728,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1106:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1107:13", children: "مهام عطلة الجمعة والسبت (التحليل المستقل):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 735,
            columnNumber: 13
          }, this),
          "تُستغل عطلة الجمعة والسبت في تشغيل العمليات التحليلية غير الحية دون تعارض مع التداول:",
          /* @__PURE__ */ jsxDEV("ul", { className: "list-disc pr-4 mt-1 space-y-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1109:13", children: [
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1110:15", children: "إصدار التقرير الأسبوعي الشامل للمحفظة." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 738,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1111:15", children: "فحص مؤشر الألفا (Alpha) ومقارنة الأداء بـ EGX30." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 739,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1112:15", children: "مراجعة وتحديث قائمة أسهم الشريعة (كل 6 شهور)." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 740,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 737,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 734,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 727,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 722,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:1119:7", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-end gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1120:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-56", "data-tsd-source": "/src/routes/scalp-dip.tsx:1121:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1122:13", children: "💰 رأس المال المتاح للتداول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 750,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mb-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1123:13", children: "يُحسب عدد المراكز تلقائيًا: TOP_N = رأس المال ÷ 20,000 (من 1 إلى 5 مراكز — الإعداد المدروس N5: أفضل توازن عائد/اتساق مقاس). فوق 100 ألف يزيد حجم المركز الواحد." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 751,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 items-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:1126:13", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "number", min: 1, step: 1e3, value: capitalInput, onChange: (e) => setCapitalInput(e.target.value), placeholder: "مثال: 100000", className: "w-40 rounded-xl border bg-background px-3 py-1.5 text-sm font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1127:15" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 755,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: onSaveCapital, disabled: savingCap, className: "rounded-xl px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:1136:15", children: savingCap ? "جاري الحفظ…" : "حفظ" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 756,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 754,
          columnNumber: 13
        }, this),
        capMsg && /* @__PURE__ */ jsxDEV("div", { className: "mt-1 text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:1144:24", children: capMsg }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 760,
          columnNumber: 24
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 749,
        columnNumber: 11
      }, this),
      sizing && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-2 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:1147:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1148:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1149:17", children: "رأس المال الفعّال" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 764,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1150:17", children: [
            Math.round(sizing.total_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 765,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 763,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1152:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1153:17", children: "عدد المراكز (TOP_N)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 768,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1154:17", children: sizing.top_n }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 769,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 767,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1156:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1157:17", children: "حجم المركز (SLOT)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 772,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1158:17", children: [
            Math.round(sizing.slot_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 773,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 771,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 762,
        columnNumber: 22
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 748,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 747,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1166:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1167:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1168:11", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1169:13", children: "📜 سجل القرارات والتنبيهات الموثق (Decision Audit Log)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 783,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1170:13", children: "سجل دائم ومؤرخ بالثانية لكل إشارة صدرت، كل إنذار طوارئ، ورد فعل المستخدم لتوثيق الأداء تاريخياً." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 784,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 782,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 781,
        columnNumber: 9
      }, this),
      auditLogs.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto max-h-60", "data-tsd-source": "/src/routes/scalp-dip.tsx:1177:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1178:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground sticky top-0", "data-tsd-source": "/src/routes/scalp-dip.tsx:1179:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1180:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1181:19", children: "التوقيت" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 794,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1182:19", children: "نوع الحدث" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 795,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1183:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 796,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1184:19", children: "السعر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 797,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1185:19", children: "تصرف المستخدم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 798,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 793,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 792,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1188:15", children: auditLogs.map((log) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15", "data-tsd-source": "/src/routes/scalp-dip.tsx:1190:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono text-[10px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1191:21", children: log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : "—" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 803,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1194:21", children: [
            log.event_type === "USER_BOUGHT" && /* @__PURE__ */ jsxDEV("span", { className: "text-bull", "data-tsd-source": "/src/routes/scalp-dip.tsx:1195:60", children: "🛒 تأكيد شراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 807,
              columnNumber: 60
            }, this),
            log.event_type === "USER_SOLD" && /* @__PURE__ */ jsxDEV("span", { className: "text-primary", "data-tsd-source": "/src/routes/scalp-dip.tsx:1196:58", children: "💰 تأكيد بيع" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 808,
              columnNumber: 58
            }, this),
            log.event_type === "EMERGENCY_STOP_LOSS" && /* @__PURE__ */ jsxDEV("span", { className: "text-bear font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1197:68", children: "🚨 إنذار وقف خسارة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 809,
              columnNumber: 68
            }, this),
            log.event_type === "SIGNAL_10AM" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1198:60", children: "🎯 إشارة 10:00 صباحاً" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 810,
              columnNumber: 60
            }, this),
            log.event_type === "SCHEDULED_EXIT" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1199:63", children: "📅 خروج أسبوعي مجدول" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 811,
              columnNumber: 63
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 806,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1201:21", children: log.symbol }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 813,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1202:21", children: [
            log.trigger_price ? fmtPrice(Number(log.trigger_price)) : "—",
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 814,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1203:21", children: /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-muted", "data-tsd-source": "/src/routes/scalp-dip.tsx:1204:23", children: log.user_action }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 816,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 815,
            columnNumber: 21
          }, this)
        ] }, log.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 802,
          columnNumber: 41
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 801,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 791,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 790,
        columnNumber: 33
      }, this) : /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1214:11", children: "لا توجد سجلات قرارات سابقة بعد. كل نقرة شراء أو بيع أو تنبيه طوارئ ستُوثق هنا تلقائياً." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 823,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 780,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border border-warn/40 bg-warn/10 p-4 space-y-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1221:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:1222:9", children: "📋 الأداء المُقاس (شريعة فقط — باك-تست صادق 512 أسبوع 2016-2026، تكلفة ثاندر 0.05%)" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 830,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1223:9", children: [
        /* @__PURE__ */ jsxDEV(StatCard, { label: "النظام الحالي (آخر 90 يوم)", value: `~${CURRENT_REGIME_WEEKLY_LOW_EGP.toLocaleString()}-${CURRENT_REGIME_WEEKLY_HIGH_EGP.toLocaleString()} ج.م`, tone: "bull", sub: "أفضل فترة في العقد — ليس حقاً مكتسباً", "data-tsd-source": "/src/routes/scalp-dip.tsx:1224:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 832,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "المتوسط الطويل الموثوق (10 سنين)", value: `${BACKTEST_WEEKLY_EGP.toLocaleString()} ج.م`, tone: "default", sub: `فاصل ثقة 95%: ${BACKTEST_WEEKLY_EGP_LOW.toLocaleString()}-${BACKTEST_WEEKLY_EGP_HIGH.toLocaleString()}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1225:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 833,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أسوأ أسبوع (10 سنين)", value: `${BACKTEST_WORST_WEEK_PCT.toLocaleString()}%`, tone: "bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:1226:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 834,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أقصى تراجع (10 سنين)", value: `${BACKTEST_MAXDD_PCT.toLocaleString()}%`, tone: "bear", sub: "مع الحمايات التلقائية: ~27-30%", "data-tsd-source": "/src/routes/scalp-dip.tsx:1227:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 835,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 831,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-border/50 bg-card/60 p-2.5 text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1229:9", children: [
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1230:11", children: "شكل الأسابيع الحقيقي (مقاس):" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 838,
          columnNumber: 11
        }, this),
        " ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 — أغلب الأسابيع صغيرة أو سالبة والمتوسط بيتحقق من قفزات نادرة (زي +21,500 و+34,900 في يونيو/يوليو 2026) لا يمكن توقيتها.",
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1232:11", children: " ولا يوجد وعد بربح ثابت — مرفوض من كل الأطراف." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 840,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 837,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1234:9", children: BACKTEST_DISCLAIMER_AR }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 842,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 829,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "text-center py-4 text-xs text-muted-foreground border-t", "data-tsd-source": "/src/routes/scalp-dip.tsx:1238:7", children: "قواعد فلاتر الاستراتيجية ومعادلاتها مجمدة لمدة 4-6 أسابيع للاختبار والمراقبة الصارمة." }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 846,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
    lineNumber: 380,
    columnNumber: 10
  }, this);
}
_s(ScalpDipOperationalPage, "yhgpTxvPB39tGbXDNqn7U+mTBrA=", false, function() {
  return [useServerFn, useServerFn, useServerFn, useServerFn, useQuery];
});
_c2 = ScalpDipOperationalPage;
export { ScalpDipOperationalPage as component };
var _c, _c2;
$RefreshReg$(_c, "StatCard");
$RefreshReg$(_c2, "ScalpDipOperationalPage");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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d0M7QUFBQTtBQUFBLFFBRXhDLG9IQUF3Qyw4REFBeEM7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUF3QztBQUFBLFdBSHhDO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFJQTtBQUFBLE1BQ0EsaUpBQW9FcEYsb0NBQXBFO0FBQUE7QUFBQTtBQUFBO0FBQUEsYUFBb0U7QUFBQSxTQWJwRTtBQUFBO0FBQUE7QUFBQTtBQUFBLFdBY0E7QUFBQSxJQUdBLGdLQUFpRixxR0FBakY7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQUVBO0FBQUEsT0ExbEJBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0EybEJBO0FBRUE7QUFBQWtDLEdBaDRCQUQ7QUFBQUEsVUFDQXhDLGFBQ0FBLGFBQ0FBLGFBQ0FBLGFBRUFDLFFBQUE7QUFBQTtBQUFBLE1BTkF1QztBQWc0QkEsU0FBQUEsMkJBQUF1SztBQUFBLElBQUF4SyxJQUFBeUs7QUFBQSxhQUFBekssSUFBQTtBQUFBLGFBQUF5SyxLQUFBIiwibmFtZXMiOlsiY3JlYXRlU2VydmVyRm4iLCJ1c2VTZXJ2ZXJGbiIsInVzZVF1ZXJ5IiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJmbXRQcmljZSIsIkRhdGFGcmVzaG5lc3NCYW5uZXIiLCJCQUNLVEVTVF9ESVNDTEFJTUVSX0FSIiwiQkFDS1RFU1RfV0VFS0xZX0VHUCIsIkJBQ0tURVNUX1dFRUtMWV9FR1BfTE9XIiwiQkFDS1RFU1RfV0VFS0xZX0VHUF9ISUdIIiwiQkFDS1RFU1RfV09SU1RfV0VFS19QQ1QiLCJCQUNLVEVTVF9NQVhERF9QQ1QiLCJDVVJSRU5UX1JFR0lNRV9XRUVLTFlfTE9XX0VHUCIsIkNVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUCIsInBsYXlTaWduYWxDaGltZSIsInBsYXlFbWVyZ2VuY3lTaXJlbiIsInBsYXlTY2hlZHVsZWRFeGl0VG9uZSIsImdldFBhZ2VEYXRhIiwibWV0aG9kIiwiaGFuZGxlciIsImNyZWF0ZUNsaWVudFJwYyIsIm1hcmtCb3VnaHRGbiIsIm1hcmtTb2xkRm4iLCJzYXZlQ2FwaXRhbCIsImZtdERhdGUiLCJpc28iLCJzbGljZSIsInRyYWNrU3RhdHVzIiwicyIsInNvbGQiLCJsYWJlbCIsImNscyIsInNlbGxfc2lnbmFsIiwiYm91Z2h0IiwiU3RhdENhcmQiLCJ2YWx1ZSIsInN1YiIsInRvbmUiLCJfYyIsIlNjYWxwRGlwT3BlcmF0aW9uYWxQYWdlIiwiX3MiLCJmZXRjaFBhZ2UiLCJzYXZlQ2FwaXRhbEZuIiwibWFya0JvdWdodEZuVWkiLCJtYXJrU29sZEZuVWkiLCJkYXRhIiwicmVmZXRjaCIsInF1ZXJ5S2V5IiwicXVlcnlGbiIsInJlZmV0Y2hJbnRlcnZhbCIsInNpemluZyIsInBsYW4iLCJjYXBpdGFsSW5wdXQiLCJzZXRDYXBpdGFsSW5wdXQiLCJTdHJpbmciLCJNYXRoIiwicm91bmQiLCJ0b3RhbF9jYXBpdGFsIiwic2F2aW5nQ2FwIiwic2V0U2F2aW5nQ2FwIiwiY2FwTXNnIiwic2V0Q2FwTXNnIiwiYnVzeVNpZ25hbCIsInNldEJ1c3lTaWduYWwiLCJhY3Rpb25Nc2ciLCJzZXRBY3Rpb25Nc2ciLCJwcmljZU92ZXJyaWRlcyIsInNldFByaWNlT3ZlcnJpZGVzIiwic2Vjb25kc1JlbWFpbmluZyIsInNldFNlY29uZHNSZW1haW5pbmciLCJpc1dpbmRvd0V4cGlyZWQiLCJzZXRJc1dpbmRvd0V4cGlyZWQiLCJpc0JlZm9yZU1hcmtldCIsInNldElzQmVmb3JlTWFya2V0IiwiZHJ5UnVuQWN0aXZlIiwic2V0RHJ5UnVuQWN0aXZlIiwiZHJ5UnVuU2ltdWxhdGlvblRpbWUiLCJzZXREcnlSdW5TaW11bGF0aW9uVGltZSIsInNpcmVuUGxheWVkUmVmIiwiaGFzRW1lcmdlbmN5Iiwib3BlblBvc2l0aW9ucyIsInNvbWUiLCJwIiwiaXNBbm9tYWx5IiwiY3VycmVudCIsInVwZGF0ZUNvdW50ZG93biIsInByZXYiLCJub3ciLCJEYXRlIiwiY2Fpcm9TdHIiLCJ0b0xvY2FsZVN0cmluZyIsInRpbWVab25lIiwiY2Fpcm8iLCJoIiwiZ2V0SG91cnMiLCJtIiwiZ2V0TWludXRlcyIsImdldFNlY29uZHMiLCJzZWNvbmRzU2luY2VNaWRuaWdodCIsIndpbmRvd1N0YXJ0Iiwid2luZG93RHVyYXRpb24iLCJlbGFwc2VkIiwiaW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsImNsZWFySW50ZXJ2YWwiLCJkaXNwbGF5U2Vjb25kcyIsIm1tIiwiZmxvb3IiLCJwYWRTdGFydCIsInNzIiwib25TYXZlQ2FwaXRhbCIsInYiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsInIiLCJjYXBpdGFsIiwib2siLCJ0b3BfbiIsInNsb3RfY2FwaXRhbCIsImVycm9yIiwiZSIsIm1lc3NhZ2UiLCJvbkJvdWdodCIsInNpZyIsImlkIiwib3ZlcnJpZGVSYXciLCJwcmljZSIsInVuZGVmaW5lZCIsInNpZ25hbF9pZCIsInN5bWJvbCIsInNpZ25hbCIsImFjdHVhbF9idXlfcHJpY2UiLCJlbnRyeV9wcmljZSIsIm9uU29sZCIsInBubCIsInJlYWxpemVkX3BubCIsInJlYWxpemVkX3BubF9wY3QiLCJ0b0ZpeGVkIiwidG9kYXlTaWduYWxzIiwiYmF0Y2hTY2FuRGF0ZSIsImF1ZGl0TG9ncyIsInNlbGxBbGVydHMiLCJ0b3RhbE9wZW5QbmxFZ3AiLCJyZWR1Y2UiLCJzdW0iLCJwbmxFZ3AiLCJzaW11bGF0ZWRDYW5kaWRhdGVzIiwic2Nhbl9kYXRlIiwiZ2FwX3BjdCIsInBvc2l0aW9uX3ZhbHVlIiwic2ltdWxhdGVkUG9zaXRpb25zIiwiYnV5X3RpbWVzdGFtcCIsImJpZF9kZXB0aF9hdF9lbnRyeSIsImRheTFfc3RhdHVzIiwiZGF5MV9wcmljZSIsImRheTJfc3RhdHVzIiwiZGF5Ml9wcmljZSIsImRheTNfc3RhdHVzIiwiZGF5M19wcmljZSIsImV4aXRfcmVhc29uIiwiYmlkX2NvbmZpcm1lZF9hdF9leGl0IiwiZXh0cmFfaG9sZF91c2VkIiwic2hhZG93X2V4aXRfcHJpY2UiLCJzaGFkb3dfcG5sIiwic2hhZG93X3BubF9wY3QiLCJhY3R1YWxfc2VsbF9wcmljZSIsInNlbGxfdGltZXN0YW1wIiwic2VsbF9zaWduYWxfcmVhc29uIiwiY3JlYXRlZF9hdCIsInVwZGF0ZWRfYXQiLCJjdXJyZW50UHJpY2UiLCJwbmxQY3QiLCJkYXlzSGVsZCIsImRheXNSZW1haW5pbmciLCJleGl0RGF0ZSIsImV4aXREYXlOYW1lIiwiaXNTY2hlZHVsZWRFeGl0Iiwic2hhcmVzIiwiYWN0aXZlQ2FuZGlkYXRlc0xpc3QiLCJhY3RpdmVPcGVuUG9zaXRpb25zTGlzdCIsImVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMiLCJmaWx0ZXIiLCJzY2hlZHVsZWRFeGl0UG9zaXRpb25zIiwiZmV0Y2giLCJqIiwianNvbiIsImNvbnNvbGUiLCJsb2ciLCJjYXRjaHVwIiwibGVuZ3RoIiwibWFwIiwiX2hhbGFsIiwidGFyZ2V0Iiwic3QiLCJfYmFuZExvIiwiX2JhbmRIaSIsImxpdmVQcmljZSIsImxpdmVQY3QiLCJwb3MiLCJwcm9ncmVzc1BjdCIsIm1pbiIsIndpZHRoIiwicmVwbGFjZSIsImV2ZW50X3R5cGUiLCJ0cmlnZ2VyX3ByaWNlIiwidXNlcl9hY3Rpb24iLCJjb21wb25lbnQiLCJfYzIiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsic2NhbHAtZGlwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVGaWxlUm91dGUgfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXJvdXRlclwiO1xyXG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXJGbiwgdXNlU2VydmVyRm4gfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXN0YXJ0XCI7XHJcbmltcG9ydCB7IHVzZVF1ZXJ5IH0gZnJvbSBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiO1xyXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcclxuaW1wb3J0IHsgc3VwYWJhc2VBZG1pbiB9IGZyb20gXCJAL2ludGVncmF0aW9ucy9zdXBhYmFzZS9jbGllbnQuc2VydmVyXCI7XHJcbmltcG9ydCB7IGZtdFByaWNlIH0gZnJvbSBcIkAvbGliL2Zvcm1hdC9wcmljZVwiO1xyXG5pbXBvcnQgeyBEYXRhRnJlc2huZXNzQmFubmVyIH0gZnJvbSBcIkAvY29tcG9uZW50cy9kYXRhLWZyZXNobmVzcy1iYW5uZXJcIjtcclxuaW1wb3J0IHtcclxuICBHQVBfUEFSQU1TLFxyXG4gIEJBQ0tURVNUX0RJU0NMQUlNRVJfQVIsXHJcbiAgQkFDS1RFU1RfV0VFS0xZX0VHUCxcclxuICBCQUNLVEVTVF9XRUVLTFlfRUdQX0xPVyxcclxuICBCQUNLVEVTVF9XRUVLTFlfRUdQX0hJR0gsXHJcbiAgQkFDS1RFU1RfV09SU1RfV0VFS19QQ1QsXHJcbiAgQkFDS1RFU1RfTUFYRERfUENULFxyXG4gIENVUlJFTlRfUkVHSU1FX1dFRUtMWV9MT1dfRUdQLFxyXG4gIENVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUCxcclxuICBzY2FuRGFpbHlDYW5kaWRhdGVzLFxyXG4gIHRyYWRpbmdEYXlzRWxhcHNlZCxcclxuICBsaXZlU3ltYm9sU3RhdGUsXHJcbiAgdHlwZSBDYW5kaWRhdGUsXHJcbn0gZnJvbSBcIkAvbGliL3NjYWxwLWRpcC9tb21lbnR1bS13ZWVrbHkuc2VydmVyXCI7XHJcbmltcG9ydCB7IGdldEhhbGFsU2V0IH0gZnJvbSBcIkAvbGliL3NjYWxwLWRpcC9oYWxhbC1saXN0LnNlcnZlclwiO1xyXG5pbXBvcnQge1xyXG4gIG1hcmtXZWVrbHlCb3VnaHQsXHJcbiAgbWFya1dlZWtseVNvbGQsXHJcbiAgZ2V0UmVjZW50QXVkaXRMb2dzLFxyXG4gIHR5cGUgU2lnbmFsUm93LFxyXG4gIHR5cGUgRGVjaXNpb25BdWRpdFJvdyxcclxufSBmcm9tIFwiQC9saWIvc2NhbHAtZGlwL3NjYWxwLWRpcC1zaWduYWxzLnNlcnZlclwiO1xyXG5pbXBvcnQge1xyXG4gIHBsYXlTaWduYWxDaGltZSxcclxuICBwbGF5RW1lcmdlbmN5U2lyZW4sXHJcbiAgcGxheVNjaGVkdWxlZEV4aXRUb25lLFxyXG59IGZyb20gXCJAL2xpYi9zY2FscC1kaXAvb3BlcmF0aW9uYWwtYXVkaW9cIjtcclxuXHJcbi8qKlxyXG4gKiAvc2NhbHAtZGlwIC0gXCLYutix2YHYqSDYp9mE2LnZhdmE2YrYp9iqIOKAlCDYp9mE2YXZiNmF2YbYqtmFINin2YTYo9iz2KjZiNi52Yog2KfZhNit2YTYp9mEICg1INis2YTYs9in2KrYjCDYr9iu2YjZhCDYp9mE2KPYrdivKVwiXHJcbiAqIFVuaWZpZWQgT3BlcmF0aW9uYWwgRGFzaGJvYXJkOlxyXG4gKiAxKSAxMDowMCBBTSBxdWFsaWZpZWQgY2FuZGlkYXRlcyB3aXRoIDE1LW1pbnV0ZSBjb3VudGRvd24gZXhlY3V0aW9uIHdpbmRvdy5cclxuICogMikgUmVhbC10aW1lIHRyYWNraW5nIG9mIGJvdWdodCBwb3NpdGlvbnMgd2l0aCA0LWRheSBob2xkaW5nIHByb2dyZXNzaW9uLlxyXG4gKiAzKSBWaXN1YWxseSBhbmQgYWNvdXN0aWNhbGx5IGRpc3RpbmN0IGVtZXJnZW5jeSBhbGVydHMgKGFub21hbHkpICsgd2Vla2x5IGV4aXQgc2NoZWR1bGUuXHJcbiAqIDQpIEV4cGxpY2l0IEVHWCBjYWxlbmRhciBoYW5kbGluZyAoc2tpcHBpbmcgRnJpL1NhdCkuXHJcbiAqIDUpIFBlcm1hbmVudCBEZWNpc2lvbiBBdWRpdCBMb2cuXHJcbiAqIDYpIEZ1bGwgRHJ5IFJ1biBzaW11bGF0aW9uIG1vZGUgZm9yIHRlc3RpbmcuXHJcbiAqL1xyXG5cclxuY29uc3QgU1RSQVRFR1kgPSBcInNjYWxwLWRpcFwiO1xyXG5cclxuY29uc3QgQVJBQklDX0RBWV9OQU1FUyA9IFtcItin2YTYo9it2K9cIiwgXCLYp9mE2KfYq9mG2YrZhlwiLCBcItin2YTYq9mE2KfYq9in2KFcIiwgXCLYp9mE2KPYsdio2LnYp9ihXCIsIFwi2KfZhNiu2YXZitizXCIsIFwi2KfZhNis2YXYudipXCIsIFwi2KfZhNiz2KjYqlwiXTtcclxuXHJcbi8qKiBtb21lbnR1bV93ZWVrbHlfc2lnbmFscyByb3cg4oaSIFNpZ25hbFJvdy1jb21wYXRpYmxlIHNoYXBlIGZvciB0aGUgVUlcclxuICogKGVudHJ5IHJlZmVyZW5jZSA9IGFjdHVhbCBidXkgcHJpY2Ugb25jZSBmaWxsZWQsIGVsc2UgdGhlIHNpZ25hbCBjbG9zZSkuICovXHJcbmZ1bmN0aW9uIHdlZWtseVJvd1RvU2lnbmFsKHI6IGFueSk6IFNpZ25hbFJvdyB7XHJcbiAgY29uc3QgYnV5ID0gci5hY3R1YWxfYnV5X3ByaWNlICE9IG51bGwgPyBOdW1iZXIoci5hY3R1YWxfYnV5X3ByaWNlKSA6IG51bGw7XHJcbiAgY29uc3QgbGFzdENsb3NlID0gTnVtYmVyKHIubGFzdF9jbG9zZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBOdW1iZXIoci5pZCksXHJcbiAgICBzY2FuX2RhdGU6IFN0cmluZyhyLnNjYW5fZGF0ZSksXHJcbiAgICBzeW1ib2w6IFN0cmluZyhyLnN5bWJvbCkudG9VcHBlckNhc2UoKSxcclxuICAgIGVudHJ5X3ByaWNlOiBidXkgPz8gbGFzdENsb3NlLFxyXG4gICAgZ2FwX3BjdDogYnV5ICE9IG51bGwgJiYgbGFzdENsb3NlID4gMCA/IGJ1eSAvIGxhc3RDbG9zZSAtIDEgOiAwLFxyXG4gICAgYmlkX2RlcHRoX2F0X2VudHJ5OiAwLFxyXG4gICAgcG9zaXRpb25fdmFsdWU6IE51bWJlcihyLnBvc2l0aW9uX3ZhbHVlKSB8fCAwLFxyXG4gICAgYm91Z2h0OiAhIXIuYm91Z2h0LFxyXG4gICAgYWN0dWFsX2J1eV9wcmljZTogYnV5LFxyXG4gICAgYnV5X3RpbWVzdGFtcDogci5idXlfdGltZXN0YW1wID8/IG51bGwsXHJcbiAgICBkYXkxX3N0YXR1czogbnVsbCxcclxuICAgIGRheTFfcHJpY2U6IG51bGwsXHJcbiAgICBkYXkyX3N0YXR1czogbnVsbCxcclxuICAgIGRheTJfcHJpY2U6IG51bGwsXHJcbiAgICBkYXkzX3N0YXR1czogbnVsbCxcclxuICAgIGRheTNfcHJpY2U6IG51bGwsXHJcbiAgICBleGl0X3JlYXNvbjogci5leGl0X3JlYXNvbiA/PyBudWxsLFxyXG4gICAgYmlkX2NvbmZpcm1lZF9hdF9leGl0OiBudWxsLFxyXG4gICAgZXh0cmFfaG9sZF91c2VkOiBmYWxzZSxcclxuICAgIHNoYWRvd19leGl0X3ByaWNlOiBudWxsLFxyXG4gICAgc2hhZG93X3BubDogbnVsbCxcclxuICAgIHNoYWRvd19wbmxfcGN0OiBudWxsLFxyXG4gICAgc29sZDogISFyLnNvbGQsXHJcbiAgICBhY3R1YWxfc2VsbF9wcmljZTogci5hY3R1YWxfc2VsbF9wcmljZSAhPSBudWxsID8gTnVtYmVyKHIuYWN0dWFsX3NlbGxfcHJpY2UpIDogbnVsbCxcclxuICAgIHNlbGxfdGltZXN0YW1wOiByLnNlbGxfdGltZXN0YW1wID8/IG51bGwsXHJcbiAgICByZWFsaXplZF9wbmw6IHIucmVhbGl6ZWRfcG5sICE9IG51bGwgPyBOdW1iZXIoci5yZWFsaXplZF9wbmwpIDogbnVsbCxcclxuICAgIHJlYWxpemVkX3BubF9wY3Q6IHIucmVhbGl6ZWRfcG5sX3BjdCAhPSBudWxsID8gTnVtYmVyKHIucmVhbGl6ZWRfcG5sX3BjdCkgOiBudWxsLFxyXG4gICAgc2VsbF9zaWduYWw6IGZhbHNlLFxyXG4gICAgc2VsbF9zaWduYWxfcmVhc29uOiBudWxsLFxyXG4gICAgY3JlYXRlZF9hdDogci5jcmVhdGVkX2F0ID8/IG51bGwsXHJcbiAgICB1cGRhdGVkX2F0OiByLnVwZGF0ZWRfYXQgPz8gbnVsbCxcclxuICB9O1xyXG59XHJcblxyXG50eXBlIFRyYWRlID0ge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgc3ltYm9sOiBzdHJpbmc7XHJcbiAgZW50cnlfcHJpY2U6IG51bWJlcjtcclxuICBlbnRyeV90czogc3RyaW5nO1xyXG4gIGV4aXRfcHJpY2U6IG51bWJlciB8IG51bGw7XHJcbiAgZXhpdF90czogc3RyaW5nIHwgbnVsbDtcclxuICBleGl0X3JlYXNvbjogc3RyaW5nIHwgbnVsbDtcclxuICBwbmw6IG51bWJlciB8IG51bGw7XHJcbiAgcG5sX3BjdDogbnVtYmVyIHwgbnVsbDtcclxuICBzdGF0dXM6IHN0cmluZztcclxuICB0cmFkZV9kYXRlOiBzdHJpbmc7XHJcbiAgY2FwaXRhbDogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgRW5yaWNoZWRQb3NpdGlvbiA9IFNpZ25hbFJvdyAmIHtcclxuICBjdXJyZW50UHJpY2U6IG51bWJlcjtcclxuICBwbmxFZ3A6IG51bWJlcjtcclxuICBwbmxQY3Q6IG51bWJlcjtcclxuICBkYXlzSGVsZDogbnVtYmVyO1xyXG4gIGRheXNSZW1haW5pbmc6IG51bWJlcjtcclxuICBleGl0RGF0ZTogc3RyaW5nO1xyXG4gIGV4aXREYXlOYW1lOiBzdHJpbmc7XHJcbiAgaXNTY2hlZHVsZWRFeGl0OiBib29sZWFuO1xyXG4gIGlzQW5vbWFseTogYm9vbGVhbjtcclxuICBzaGFyZXM6IG51bWJlcjtcclxufTtcclxuXHJcbi8qKiBPbmUgc2NhbHBfZGlwX3NpZ25hbHMgcm93ICh0aGUgbGF0ZXN0IHdlZWtseSBiYXRjaCkgd2l0aCBpdHMgTElWRSBwcmljZVxyXG4gKiBmcm9tIGxpdmVTeW1ib2xTdGF0ZSDigJQgdGhlIGxpdmUtdHJhY2tpbmcgc2VjdGlvbidzIGRhdGEgc2hhcGUuIGxpdmVQY3QgaXNcclxuICogbGl2ZSB2cyB0aGUgbm9taW5hdGlvbiBwcmljZSAoZW50cnlfcHJpY2UpOyBudWxsIHdoZW4gbm8gbGl2ZSBmZWVkLiAqL1xyXG5leHBvcnQgdHlwZSBMaXZlVHJhY2tlZFNpZ25hbCA9IFNpZ25hbFJvdyAmIHtcclxuICBfaGFsYWw6IGJvb2xlYW47XHJcbiAgbGl2ZVByaWNlOiBudW1iZXIgfCBudWxsO1xyXG4gIGxpdmVUczogc3RyaW5nIHwgbnVsbDtcclxuICBsaXZlUGN0OiBudW1iZXIgfCBudWxsO1xyXG4gIGJhdGNoU2NhbkRhdGU6IHN0cmluZztcclxuICBfYmFuZExvOiBudW1iZXIgfCBudWxsO1xyXG4gIF9iYW5kSGk6IG51bWJlciB8IG51bGw7XHJcbn07XHJcblxyXG5jb25zdCBnZXRQYWdlRGF0YSA9IGNyZWF0ZVNlcnZlckZuKHsgbWV0aG9kOiBcIkdFVFwiIH0pLmhhbmRsZXIoYXN5bmMgKCkgPT4geyB0cnkge1xyXG4gIGNvbnN0IHBsYW4gPSBhd2FpdCBzY2FuRGFpbHlDYW5kaWRhdGVzKCk7XHJcbiAgY29uc3QgdG9kYXkgPSBwbGFuLnNjYW5EYXRlO1xyXG5cclxuICAvLyAxKSBQYXBlciB0cmFkZXMgaGlzdG9yeVxyXG4gIGNvbnN0IHsgZGF0YTogdHJhZGVzIH0gPSBhd2FpdCBzdXBhYmFzZUFkbWluXHJcbiAgICAuZnJvbShcInBhcGVyX3RyYWRlc1wiKVxyXG4gICAgLnNlbGVjdChcImlkLCBzeW1ib2wsIGVudHJ5X3ByaWNlLCBlbnRyeV90cywgZXhpdF9wcmljZSwgZXhpdF90cywgZXhpdF9yZWFzb24sIHBubCwgcG5sX3BjdCwgc3RhdHVzLCB0cmFkZV9kYXRlLCBjYXBpdGFsXCIpXHJcbiAgICAuZXEoXCJzdHJhdGVneVwiLCBTVFJBVEVHWSlcclxuICAgIC5vcmRlcihcImVudHJ5X3RzXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxyXG4gICAgLmxpbWl0KDIwMCk7XHJcblxyXG4gIC8vIDIpIExhdGVzdCBXRUVLTFkgYmF0Y2ggKG1vbWVudHVtX3dlZWtseV9zaWduYWxzIOKAlCB0aGUgd2Vla2x5IGdhdGUncyBvd25cclxuICAvLyB0YWJsZSkgKyBMSVZFIHRyYWNraW5nIHBlciByb3c6IHJlZmVyZW5jZSA9IGFjdHVhbCBidXkgcHJpY2Ugb25jZSBmaWxsZWQsXHJcbiAgLy8gZWxzZSB0aGUgc2lnbmFsLXNlc3Npb24gY2xvc2U7IGxpdmUgcHJpY2Ug4oaQIGxpdmUgJS4gVGhlIGJhdGNoIGlzIHRoZVxyXG4gIC8vIG5ld2VzdCBzY2FuX2RhdGUgcHJlc2VudCwgc28gU3VuZGF5J3MgcGlja3Mgc3RheSB0cmFja2VkIGFsbCB3ZWVrLlxyXG4gIC8vICh0YWJsZSBub3QgaW4gZ2VuZXJhdGVkIHR5cGVzIHlldCDigJQgc2FtZSBlc2NhcGUgaGF0Y2ggYXMgdGhlIHJ1bm5lcilcclxuICBjb25zdCB3ZGIgPSBzdXBhYmFzZUFkbWluIGFzIGFueTtcclxuICBjb25zdCB7IGRhdGE6IHdlZWtseUJhdGNoUm93cyB9ID0gYXdhaXQgd2RiXHJcbiAgICAuZnJvbShcIm1vbWVudHVtX3dlZWtseV9zaWduYWxzXCIpXHJcbiAgICAuc2VsZWN0KFwiKlwiKVxyXG4gICAgLm9yZGVyKFwic2Nhbl9kYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxyXG4gICAgLm9yZGVyKFwicG9zaXRpb25fdmFsdWVcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAubGltaXQoODApO1xyXG5cclxuICBjb25zdCBiYXRjaFNjYW5EYXRlID0gd2Vla2x5QmF0Y2hSb3dzPy5sZW5ndGggPyBTdHJpbmcod2Vla2x5QmF0Y2hSb3dzWzBdLnNjYW5fZGF0ZSkgOiB0b2RheTtcclxuICBjb25zdCBiYXRjaFNpZ25hbHMgPSAod2Vla2x5QmF0Y2hSb3dzID8/IFtdKS5maWx0ZXIoKHI6IGFueSkgPT4gU3RyaW5nKHIuc2Nhbl9kYXRlKSA9PT0gYmF0Y2hTY2FuRGF0ZSk7XHJcbiAgY29uc3QgbGl2ZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbGl2ZVN5bWJvbFN0YXRlPj4+KCk7XHJcbiAgY29uc3QgbGl2ZVRyYWNrZWQ6IExpdmVUcmFja2VkU2lnbmFsW10gPSBbXTtcclxuICBmb3IgKGNvbnN0IHIgb2YgYmF0Y2hTaWduYWxzKSB7XHJcbiAgICBjb25zdCByb3cgPSB3ZWVrbHlSb3dUb1NpZ25hbChyKTtcclxuICAgIGNvbnN0IHN5bSA9IHJvdy5zeW1ib2w7XHJcbiAgICBsZXQgc3QgPSBsaXZlQ2FjaGUuZ2V0KHN5bSk7XHJcbiAgICBpZiAoIXN0KSB7XHJcbiAgICAgIHN0ID0gYXdhaXQgbGl2ZVN5bWJvbFN0YXRlKHN5bSk7XHJcbiAgICAgIGxpdmVDYWNoZS5zZXQoc3ltLCBzdCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBlbnRyeSA9IHJvdy5lbnRyeV9wcmljZTtcclxuICAgIGNvbnN0IHJlZkNsb3NlID0gTnVtYmVyKChyIGFzIGFueSkubGFzdF9jbG9zZSkgPiAwID8gTnVtYmVyKChyIGFzIGFueSkubGFzdF9jbG9zZSkgOiBudWxsO1xyXG4gICAgbGl2ZVRyYWNrZWQucHVzaCh7XHJcbiAgICAgIC4uLnJvdyxcclxuICAgICAgX2hhbGFsOiBnZXRIYWxhbFNldCgpLmhhcyhzeW0pLFxyXG4gICAgICBsaXZlUHJpY2U6IHN0LnByaWNlLFxyXG4gICAgICBsaXZlVHM6IHN0LnRzLFxyXG4gICAgICBsaXZlUGN0OiBzdC5wcmljZSAhPSBudWxsICYmIGVudHJ5ID4gMCA/IHN0LnByaWNlIC8gZW50cnkgLSAxIDogbnVsbCxcclxuICAgICAgYmF0Y2hTY2FuRGF0ZSxcclxuICAgICAgX2JhbmRMbzogcmVmQ2xvc2UgIT0gbnVsbCA/IHJlZkNsb3NlICogMC45NyA6IG51bGwsIC8vIGdhcCBiYW5kIC0zJS4uKzIlIChkZXNpZ24gY29uc3RhbnRzKVxyXG4gICAgICBfYmFuZEhpOiByZWZDbG9zZSAhPSBudWxsID8gcmVmQ2xvc2UgKiAxLjAyIDogbnVsbCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gMykgT3BlbiBib3VnaHQgcG9zaXRpb25zIChhY3RpdmUgcmVhbC10cmFja2luZykg4oCUIHdlZWtseSB0YWJsZTsgcm93c1xyXG4gIC8vIGNhcnJ5IHRoZWlyIG93biBlbnRyeV9kYXRlL2V4aXRfZGF0ZSAoZXhpdCA9IG5leHQgd2VlaydzIGZpcnN0IHNlc3Npb24pLlxyXG4gIGNvbnN0IHsgZGF0YTogb3BlblNpZ25hbHMgfSA9IGF3YWl0IHdkYlxyXG4gICAgLmZyb20oXCJtb21lbnR1bV93ZWVrbHlfc2lnbmFsc1wiKVxyXG4gICAgLnNlbGVjdChcIipcIilcclxuICAgIC5lcShcInNlbGVjdGVkXCIsIHRydWUpXHJcbiAgICAuZXEoXCJib3VnaHRcIiwgdHJ1ZSlcclxuICAgIC5lcShcInNvbGRcIiwgZmFsc2UpXHJcbiAgICAub3JkZXIoXCJlbnRyeV9kYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgY29uc3QgZW5yaWNoZWRPcGVuOiBFbnJpY2hlZFBvc2l0aW9uW10gPSBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgIChvcGVuU2lnbmFscyA/PyBbXSkubWFwKGFzeW5jIChyYXc6IGFueSkgPT4ge1xyXG4gICAgICBjb25zdCBzID0gd2Vla2x5Um93VG9TaWduYWwocmF3KTtcclxuICAgICAgY29uc3QgbGl2ZSA9IGF3YWl0IGxpdmVTeW1ib2xTdGF0ZShzLnN5bWJvbCk7XHJcbiAgICAgIGNvbnN0IGJ1eVByaWNlID0gTnVtYmVyKHMuYWN0dWFsX2J1eV9wcmljZSA/PyBzLmVudHJ5X3ByaWNlKTtcclxuICAgICAgY29uc3QgY3VyUHJpY2UgPSBsaXZlLnByaWNlID8/IGJ1eVByaWNlO1xyXG4gICAgICBjb25zdCBzaGFyZXMgPSBOdW1iZXIocmF3LnNoYXJlcykgfHwgTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihOdW1iZXIocy5wb3NpdGlvbl92YWx1ZSkgLyBidXlQcmljZSkpO1xyXG4gICAgICBjb25zdCBwbmxFZ3AgPSAoY3VyUHJpY2UgLSBidXlQcmljZSkgKiBzaGFyZXM7XHJcbiAgICAgIGNvbnN0IHBubFBjdCA9IGJ1eVByaWNlID4gMCA/IChjdXJQcmljZSAtIGJ1eVByaWNlKSAvIGJ1eVByaWNlIDogMDtcclxuICAgICAgY29uc3QgZW50cnlJU08gPSBTdHJpbmcocmF3LmVudHJ5X2RhdGUpO1xyXG4gICAgICBjb25zdCBleGl0SVNPID0gU3RyaW5nKHJhdy5leGl0X2RhdGUpO1xyXG4gICAgICBjb25zdCBkYXlzSGVsZCA9IHRyYWRpbmdEYXlzRWxhcHNlZChlbnRyeUlTTywgdG9kYXkpO1xyXG4gICAgICAvLyBXZWVrbHkgc3lzdGVtOiBOTyBzdG9wLWxvc3MgKG1lYXN1cmVkIG5ldC1uZWdhdGl2ZSBvbiAxMHkpLiBUaGUgb25seVxyXG4gICAgICAvLyBleGl0IGlzIG5leHQgd2VlaydzIGZpcnN0LXNlc3Npb24gb3BlbjsgcHJvdGVjdGlvbnMgc2NhbGUgcG9zaXRpb24gc2l6ZS5cclxuICAgICAgY29uc3QgaXNTY2hlZHVsZWRFeGl0ID0gZGF5c0hlbGQgPj0gNTtcclxuICAgICAgY29uc3QgZXhpdERvdyA9IG5ldyBEYXRlKGAke2V4aXRJU099VDAwOjAwOjAwWmApLmdldFVUQ0RheSgpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5zLFxyXG4gICAgICAgIC8vIHRoZSBvcGVuLXBvc2l0aW9uIGNhcmQgcHJpbnRzIHNjYW5fZGF0ZSBhcyBcItiv2K7ZiNmEXCIg4oCUIGZvciB3ZWVrbHkgcm93c1xyXG4gICAgICAgIC8vIHRoZSBlbnRyeSBzZXNzaW9uIGlzIHRoZSByZWFsIGVudHJ5IGRhdGUsIG5vdCB0aGUgc2lnbmFsIHNlc3Npb25cclxuICAgICAgICBzY2FuX2RhdGU6IGVudHJ5SVNPLFxyXG4gICAgICAgIGN1cnJlbnRQcmljZTogY3VyUHJpY2UsXHJcbiAgICAgICAgcG5sRWdwLFxyXG4gICAgICAgIHBubFBjdCxcclxuICAgICAgICBkYXlzSGVsZCxcclxuICAgICAgICBkYXlzUmVtYWluaW5nOiBNYXRoLm1heCgwLCA1IC0gZGF5c0hlbGQpLFxyXG4gICAgICAgIGV4aXREYXRlOiBleGl0SVNPLFxyXG4gICAgICAgIGV4aXREYXlOYW1lOiBBUkFCSUNfREFZX05BTUVTW2V4aXREb3ddLFxyXG4gICAgICAgIGlzU2NoZWR1bGVkRXhpdCxcclxuICAgICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICAgIHNoYXJlcyxcclxuICAgICAgfSBhcyBFbnJpY2hlZFBvc2l0aW9uO1xyXG4gICAgfSlcclxuICApO1xyXG5cclxuICAvLyA0KSBIaXN0b3JpY2FsIHNpZ25hbHNcclxuICBjb25zdCB7IGRhdGE6IHJlY2VudFNpZ25hbHMgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cclxuICAgIC5mcm9tKFwic2NhbHBfZGlwX3NpZ25hbHNcIilcclxuICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAubHQoXCJzY2FuX2RhdGVcIiwgdG9kYXkpXHJcbiAgICAub3JkZXIoXCJzY2FuX2RhdGVcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAub3JkZXIoXCJnYXBfcGN0XCIsIHsgYXNjZW5kaW5nOiB0cnVlIH0pXHJcbiAgICAubGltaXQoODApO1xyXG5cclxuICAvLyA1KSBBY3RpdmUgU2VsbCBhbGVydHNcclxuICBjb25zdCB7IGRhdGE6IHNlbGxBbGVydHMgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cclxuICAgIC5mcm9tKFwic2NhbHBfZGlwX3NpZ25hbHNcIilcclxuICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAuZXEoXCJzZWxsX3NpZ25hbFwiLCB0cnVlKVxyXG4gICAgLmVxKFwic29sZFwiLCBmYWxzZSk7XHJcblxyXG4gIC8vIDYpIFJlY2VudCBEZWNpc2lvbiBBdWRpdCBMb2dzXHJcbiAgY29uc3QgYXVkaXRMb2dzID0gYXdhaXQgZ2V0UmVjZW50QXVkaXRMb2dzKDQwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsYW4sXHJcbiAgICBoYWxhbExpc3Q6IFsuLi5nZXRIYWxhbFNldCgpXSxcclxuICAgIHRyYWRlczogKHRyYWRlcyA/PyBbXSkgYXMgVHJhZGVbXSxcclxuICAgIHRvZGF5U2lnbmFsczogbGl2ZVRyYWNrZWQsXHJcbiAgICBiYXRjaFNjYW5EYXRlLFxyXG4gICAgb3BlblBvc2l0aW9uczogZW5yaWNoZWRPcGVuLFxyXG4gICAgcmVjZW50U2lnbmFsczogKHJlY2VudFNpZ25hbHMgPz8gW10pIGFzIFNpZ25hbFJvd1tdLFxyXG4gICAgc2VsbEFsZXJ0czogKHNlbGxBbGVydHMgPz8gW10pIGFzIFNpZ25hbFJvd1tdLFxyXG4gICAgYXVkaXRMb2dzOiAoYXVkaXRMb2dzID8/IFtdKSBhcyBEZWNpc2lvbkF1ZGl0Um93W10sXHJcbiAgfTtcclxuICB9IGNhdGNoIChlOiBhbnkpIHsgY29uc29sZS5lcnJvcignW3NjYWxwLWRpcF0gZ2V0UGFnZURhdGEgRkFJTEVEOicsIGUgJiYgZS5zdGFjayA/IGUuc3RhY2sgOiBTdHJpbmcoZSkpOyB0aHJvdyBlOyB9XHJcbn0pO1xyXG5cclxuLy8gU2VydmVyIGFjdGlvbnNcclxuY29uc3QgbWFya0JvdWdodEZuID0gY3JlYXRlU2VydmVyRm4oeyBtZXRob2Q6IFwiUE9TVFwiIH0pXHJcbiAgLnZhbGlkYXRvcigoZDogeyBzaWduYWxfaWQ6IG51bWJlcjsgcHJpY2U/OiBudW1iZXIgfSkgPT4gZClcclxuICAuaGFuZGxlcihhc3luYyAoeyBkYXRhIH0pID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHJvdyA9IGF3YWl0IG1hcmtXZWVrbHlCb3VnaHQoZGF0YS5zaWduYWxfaWQsIGRhdGEucHJpY2UpO1xyXG4gICAgICByZXR1cm4geyBvazogdHJ1ZSwgc2lnbmFsOiByb3cgfTtcclxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGVycm9yOiBlPy5tZXNzYWdlID8/IFwiZmFpbGVkXCIgfTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbmNvbnN0IG1hcmtTb2xkRm4gPSBjcmVhdGVTZXJ2ZXJGbih7IG1ldGhvZDogXCJQT1NUXCIgfSlcclxuICAudmFsaWRhdG9yKChkOiB7IHNpZ25hbF9pZDogbnVtYmVyOyBwcmljZT86IG51bWJlciB9KSA9PiBkKVxyXG4gIC5oYW5kbGVyKGFzeW5jICh7IGRhdGEgfSkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgbWFya1dlZWtseVNvbGQoZGF0YS5zaWduYWxfaWQsIGRhdGEucHJpY2UpO1xyXG4gICAgICByZXR1cm4geyBvazogdHJ1ZSwgc2lnbmFsOiByb3cgfTtcclxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGVycm9yOiBlPy5tZXNzYWdlID8/IFwiZmFpbGVkXCIgfTtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbmNvbnN0IHNhdmVDYXBpdGFsID0gY3JlYXRlU2VydmVyRm4oeyBtZXRob2Q6IFwiUE9TVFwiIH0pXHJcbiAgLnZhbGlkYXRvcigoZDogeyBjYXBpdGFsOiBudW1iZXIgfSkgPT4gKHsgY2FwaXRhbDogTnVtYmVyKGQuY2FwaXRhbCkgfSkpXHJcbiAgLmhhbmRsZXIoYXN5bmMgKHsgZGF0YSB9KSA9PiB7XHJcbiAgICBjb25zdCB7IHNldFVzZXJDYXBpdGFsLCBnZXRVc2VyQ2FwaXRhbCwgY29tcHV0ZVNpemluZyB9ID0gYXdhaXQgaW1wb3J0KFxyXG4gICAgICBcIkAvbGliL3NjYWxwLWRpcC9nYXAtZmFkZS0zZC5zZXJ2ZXJcIlxyXG4gICAgKTtcclxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKGRhdGEuY2FwaXRhbCkgfHwgZGF0YS5jYXBpdGFsIDw9IDApIHtcclxuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogXCLYo9iv2K7ZhCDZhdio2YTYutmL2Kcg2LXYrdmK2K3Zi9inINij2YPYqNixINmF2YYg2LXZgdixXCIgfTtcclxuICAgIH1cclxuICAgIGF3YWl0IHNldFVzZXJDYXBpdGFsKGRhdGEuY2FwaXRhbCk7XHJcbiAgICBjb25zdCBzYXZlZCA9IGF3YWl0IGdldFVzZXJDYXBpdGFsKCk7XHJcbiAgICByZXR1cm4geyBvazogdHJ1ZSwgc2l6aW5nOiBjb21wdXRlU2l6aW5nKHNhdmVkID8/IHVuZGVmaW5lZCkgfTtcclxuICB9KTtcclxuXHJcbmV4cG9ydCBjb25zdCBSb3V0ZSA9IGNyZWF0ZUZpbGVSb3V0ZShcIi9zY2FscC1kaXBcIikoe1xyXG4gIGNvbXBvbmVudDogU2NhbHBEaXBPcGVyYXRpb25hbFBhZ2UsXHJcbiAgZXJyb3JDb21wb25lbnQ6ICh7IGVycm9yIH0pID0+IDxkaXYgY2xhc3NOYW1lPVwicC02IHRleHQtZGVzdHJ1Y3RpdmVcIj7Yrti32KM6IHtlcnJvci5tZXNzYWdlfTwvZGl2PixcclxuICBub3RGb3VuZENvbXBvbmVudDogKCkgPT4gPGRpdiBjbGFzc05hbWU9XCJwLTZcIj7YutmK2LEg2YXZiNis2YjYrzwvZGl2PixcclxuICBoZWFkOiAoKSA9PiAoe1xyXG4gICAgbWV0YTogW1xyXG4gICAgICB7IHRpdGxlOiBcIti62LHZgdipINin2YTYudmF2YTZitin2Kog4oCUINin2YTZhdmI2YXZhtiq2YUg2KfZhNij2LPYqNmI2LnZiiAo2YLZhdipINiz2YbZiNmK2Kkg2LfYp9iy2KkpXCIgfSxcclxuICAgICAge1xyXG4gICAgICAgIG5hbWU6IFwiZGVzY3JpcHRpb25cIixcclxuICAgICAgICBjb250ZW50OlxyXG4gICAgICAgICAgXCLZhNmI2K3YqSDYp9mE2KrYrdmD2YUg2KfZhNij2LPYqNmI2LnZitipOiDYqtix2LTZitit2KfYqiDYp9mE2KPYrdivINmF2Lkg2LnYr9in2K8g2KfZhNiq2YbZgdmK2LAgMTUg2K/ZgtmK2YLYqdiMINiq2KrYqNi5INit2Yog2YTZhNi12YHZgtin2Kog2LfZiNin2YQg2KfZhNij2LPYqNmI2LnYjCDYpdi02LnYp9ix2KfYqiDYt9mI2KfYsdimINi12YjYqtmK2Kkg2YjYqNi12LHZitip2Iwg2YjYqtmC2YjZitmFIEVHWCDYp9mE2LXYsdmK2K0uXCIsXHJcbiAgICAgIH0sXHJcbiAgICBdLFxyXG4gIH0pLFxyXG59KTtcclxuXHJcbmZ1bmN0aW9uIGZtdERhdGUoaXNvOiBzdHJpbmcpIHtcclxuICByZXR1cm4gaXNvID8gaXNvLnNsaWNlKDAsIDEwKSA6IFwi4oCUXCI7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHRyYWNrU3RhdHVzKHM6IExpdmVUcmFja2VkU2lnbmFsKTogeyBsYWJlbDogc3RyaW5nOyBjbHM6IHN0cmluZyB9IHtcclxuICBpZiAocy5zb2xkKSByZXR1cm4geyBsYWJlbDogXCLZhdmP2LrZhNmC2Kkg4oCUINio2YrYuSDZhdiz2KzZhCDinJNcIiwgY2xzOiBcInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiIH07XHJcbiAgaWYgKHMuc2VsbF9zaWduYWwpIHJldHVybiB7IGxhYmVsOiBcItil2LTYp9ix2Kkg2KjZiti5INin2YTYotmGIOKaoFwiLCBjbHM6IFwidGV4dC1hbWJlci00MDBcIiB9O1xyXG4gIGlmIChzLmJvdWdodCkgcmV0dXJuIHsgbGFiZWw6IFwi2YLZitivINin2YTZhdiq2KfYqNi52KlcIiwgY2xzOiBcInRleHQtYnVsbFwiIH07XHJcbiAgcmV0dXJuIHsgbGFiZWw6IFwi2KjYp9mG2KrYuNin2LEg2KfZhNiq2YbZgdmK2LBcIiwgY2xzOiBcInRleHQtZm9yZWdyb3VuZFwiIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFN0YXRDYXJkKHsgbGFiZWwsIHZhbHVlLCBzdWIsIHRvbmUgPSBcImRlZmF1bHRcIiB9OiB7IGxhYmVsOiBzdHJpbmc7IHZhbHVlOiBzdHJpbmc7IHN1Yj86IHN0cmluZzsgdG9uZT86IFwiZGVmYXVsdFwiIHwgXCJidWxsXCIgfCBcImJlYXJcIiB8IFwibXV0ZWRcIiB8IFwid2FyblwiIH0pIHtcclxuICBjb25zdCBjbHMgPVxyXG4gICAgdG9uZSA9PT0gXCJidWxsXCJcclxuICAgICAgPyBcInRleHQtYnVsbFwiXHJcbiAgICAgIDogdG9uZSA9PT0gXCJiZWFyXCJcclxuICAgICAgICA/IFwidGV4dC1iZWFyXCJcclxuICAgICAgICA6IHRvbmUgPT09IFwid2FyblwiXHJcbiAgICAgICAgICA/IFwidGV4dC1hbWJlci00MDBcIlxyXG4gICAgICAgICAgOiB0b25lID09PSBcIm11dGVkXCJcclxuICAgICAgICAgICAgPyBcInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiXHJcbiAgICAgICAgICAgIDogXCJ0ZXh0LWZvcmVncm91bmRcIjtcclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJiZy1jYXJkIGJvcmRlciByb3VuZGVkLXhsIHAtMyBzaGFkb3ctc21cIj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB1cHBlcmNhc2UgZm9udC1tZWRpdW0gdHJhY2tpbmctd2lkZXIgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTFcIj57bGFiZWx9PC9kaXY+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPXtgdGV4dC1sZyBmb250LWV4dHJhYm9sZCBmb250LW1vbm8gJHtjbHN9YH0+e3ZhbHVlfTwvZGl2PlxyXG4gICAgICB7c3ViICYmIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTAuNVwiPntzdWJ9PC9kaXY+fVxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gU2NhbHBEaXBPcGVyYXRpb25hbFBhZ2UoKSB7XHJcbiAgY29uc3QgZmV0Y2hQYWdlID0gdXNlU2VydmVyRm4oZ2V0UGFnZURhdGEpO1xyXG4gIGNvbnN0IHNhdmVDYXBpdGFsRm4gPSB1c2VTZXJ2ZXJGbihzYXZlQ2FwaXRhbCk7XHJcbiAgY29uc3QgbWFya0JvdWdodEZuVWkgPSB1c2VTZXJ2ZXJGbihtYXJrQm91Z2h0Rm4pO1xyXG4gIGNvbnN0IG1hcmtTb2xkRm5VaSA9IHVzZVNlcnZlckZuKG1hcmtTb2xkRm4pO1xyXG5cclxuICBjb25zdCB7IGRhdGEsIHJlZmV0Y2ggfSA9IHVzZVF1ZXJ5KHtcclxuICAgIHF1ZXJ5S2V5OiBbXCJzY2FscC1kaXAtb3BlcmF0aW9uYWwtZGFzaGJvYXJkXCJdLFxyXG4gICAgcXVlcnlGbjogKCkgPT4gZmV0Y2hQYWdlKCksXHJcbiAgICByZWZldGNoSW50ZXJ2YWw6IDE1XzAwMCxcclxuICB9KTtcclxuXHJcbiAgLy8gQ2FwaXRhbCBzZXR0aW5ncyBzdGF0ZVxyXG4gIGNvbnN0IHNpemluZyA9IGRhdGE/LnBsYW4/LnNpemluZztcclxuICBjb25zdCBbY2FwaXRhbElucHV0LCBzZXRDYXBpdGFsSW5wdXRdID0gdXNlU3RhdGU8c3RyaW5nPihzaXppbmcgPyBTdHJpbmcoTWF0aC5yb3VuZChzaXppbmcudG90YWxfY2FwaXRhbCkpIDogXCJcIik7XHJcbiAgY29uc3QgW3NhdmluZ0NhcCwgc2V0U2F2aW5nQ2FwXSA9IHVzZVN0YXRlKGZhbHNlKTtcclxuICBjb25zdCBbY2FwTXNnLCBzZXRDYXBNc2ddID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XHJcblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBpZiAoc2l6aW5nICYmICFjYXBpdGFsSW5wdXQpIHNldENhcGl0YWxJbnB1dChTdHJpbmcoTWF0aC5yb3VuZChzaXppbmcudG90YWxfY2FwaXRhbCkpKTtcclxuICB9LCBbc2l6aW5nPy50b3RhbF9jYXBpdGFsXSk7XHJcblxyXG4gIC8vIEFjdGlvbiBzdGF0ZXNcclxuICBjb25zdCBbYnVzeVNpZ25hbCwgc2V0QnVzeVNpZ25hbF0gPSB1c2VTdGF0ZTxudW1iZXIgfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbYWN0aW9uTXNnLCBzZXRBY3Rpb25Nc2ddID0gdXNlU3RhdGU8c3RyaW5nIHwgbnVsbD4obnVsbCk7XHJcbiAgY29uc3QgW3ByaWNlT3ZlcnJpZGVzLCBzZXRQcmljZU92ZXJyaWRlc10gPSB1c2VTdGF0ZTxSZWNvcmQ8bnVtYmVyLCBzdHJpbmc+Pih7fSk7XHJcblxyXG4gIC8vIENvdW50ZG93biB0aW1lciBzdGF0ZSAoMTUtbWluIHdpbmRvdyBmcm9tIDEwOjAwIEFNKVxyXG4gIGNvbnN0IFtzZWNvbmRzUmVtYWluaW5nLCBzZXRTZWNvbmRzUmVtYWluaW5nXSA9IHVzZVN0YXRlPG51bWJlcj4oMTUgKiA2MCk7XHJcbiAgY29uc3QgW2lzV2luZG93RXhwaXJlZCwgc2V0SXNXaW5kb3dFeHBpcmVkXSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcclxuICBjb25zdCBbaXNCZWZvcmVNYXJrZXQsIHNldElzQmVmb3JlTWFya2V0XSA9IHVzZVN0YXRlPGJvb2xlYW4+KGZhbHNlKTtcclxuXHJcbiAgLy8gU2ltdWxhdGlvbiAoRHJ5IFJ1bikgU3RhdGVcclxuICBjb25zdCBbZHJ5UnVuQWN0aXZlLCBzZXREcnlSdW5BY3RpdmVdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGNvbnN0IFtkcnlSdW5TaW11bGF0aW9uVGltZSwgc2V0RHJ5UnVuU2ltdWxhdGlvblRpbWVdID0gdXNlU3RhdGU8bnVtYmVyPigxMiAqIDYwICsgMzQpOyAvLyAxMm0gMzRzXHJcblxyXG4gIGNvbnN0IHNpcmVuUGxheWVkUmVmID0gdXNlUmVmPGJvb2xlYW4+KGZhbHNlKTtcclxuXHJcbiAgLy8gQXVkaW8gQWxlcnRzIG9uIEVtZXJnZW5jeSBjb25kaXRpb25zXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGNvbnN0IGhhc0VtZXJnZW5jeSA9IChkYXRhPy5vcGVuUG9zaXRpb25zID8/IFtdKS5zb21lKChwKSA9PiBwLmlzQW5vbWFseSk7XHJcbiAgICBpZiAoaGFzRW1lcmdlbmN5ICYmICFzaXJlblBsYXllZFJlZi5jdXJyZW50KSB7XHJcbiAgICAgIHBsYXlFbWVyZ2VuY3lTaXJlbigpO1xyXG4gICAgICBzaXJlblBsYXllZFJlZi5jdXJyZW50ID0gdHJ1ZTtcclxuICAgIH0gZWxzZSBpZiAoIWhhc0VtZXJnZW5jeSkge1xyXG4gICAgICBzaXJlblBsYXllZFJlZi5jdXJyZW50ID0gZmFsc2U7XHJcbiAgICB9XHJcbiAgfSwgW2RhdGE/Lm9wZW5Qb3NpdGlvbnNdKTtcclxuXHJcbiAgLy8gUmVhbC10aW1lIENhaXJvIGNvdW50ZG93biBjYWxjdWxhdGlvblxyXG4gIHVzZUVmZmVjdCgoKSA9PiB7XHJcbiAgICBmdW5jdGlvbiB1cGRhdGVDb3VudGRvd24oKSB7XHJcbiAgICAgIGlmIChkcnlSdW5BY3RpdmUpIHtcclxuICAgICAgICBzZXREcnlSdW5TaW11bGF0aW9uVGltZSgocHJldikgPT4gKHByZXYgPiAwID8gcHJldiAtIDEgOiAwKSk7XHJcbiAgICAgICAgcmV0dXJuO1xyXG4gICAgICB9XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3Qgbm93ID0gbmV3IERhdGUoKTtcclxuICAgICAgICBjb25zdCBjYWlyb1N0ciA9IG5vdy50b0xvY2FsZVN0cmluZyhcImVuLVVTXCIsIHsgdGltZVpvbmU6IFwiQWZyaWNhL0NhaXJvXCIgfSk7XHJcbiAgICAgICAgY29uc3QgY2Fpcm8gPSBuZXcgRGF0ZShjYWlyb1N0cik7XHJcbiAgICAgICAgY29uc3QgaCA9IGNhaXJvLmdldEhvdXJzKCk7XHJcbiAgICAgICAgY29uc3QgbSA9IGNhaXJvLmdldE1pbnV0ZXMoKTtcclxuICAgICAgICBjb25zdCBzID0gY2Fpcm8uZ2V0U2Vjb25kcygpO1xyXG5cclxuICAgICAgICBjb25zdCBzZWNvbmRzU2luY2VNaWRuaWdodCA9IChoICogNjAgKyBtKSAqIDYwICsgcztcclxuICAgICAgICBjb25zdCB3aW5kb3dTdGFydCA9IDEwICogMzYwMDsgLy8gMTA6MDAgQU1cclxuICAgICAgICBjb25zdCB3aW5kb3dEdXJhdGlvbiA9IDE1ICogNjA7IC8vIDE1IG1pbnMgKDkwMHMpXHJcblxyXG4gICAgICAgIGlmIChzZWNvbmRzU2luY2VNaWRuaWdodCA8IHdpbmRvd1N0YXJ0KSB7XHJcbiAgICAgICAgICBzZXRJc0JlZm9yZU1hcmtldCh0cnVlKTtcclxuICAgICAgICAgIHNldFNlY29uZHNSZW1haW5pbmcod2luZG93RHVyYXRpb24pO1xyXG4gICAgICAgICAgc2V0SXNXaW5kb3dFeHBpcmVkKGZhbHNlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgc2V0SXNCZWZvcmVNYXJrZXQoZmFsc2UpO1xyXG4gICAgICAgICAgY29uc3QgZWxhcHNlZCA9IHNlY29uZHNTaW5jZU1pZG5pZ2h0IC0gd2luZG93U3RhcnQ7XHJcbiAgICAgICAgICBpZiAoZWxhcHNlZCA8IHdpbmRvd0R1cmF0aW9uKSB7XHJcbiAgICAgICAgICAgIHNldFNlY29uZHNSZW1haW5pbmcod2luZG93RHVyYXRpb24gLSBlbGFwc2VkKTtcclxuICAgICAgICAgICAgc2V0SXNXaW5kb3dFeHBpcmVkKGZhbHNlKTtcclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNldFNlY29uZHNSZW1haW5pbmcoMCk7XHJcbiAgICAgICAgICAgIHNldElzV2luZG93RXhwaXJlZCh0cnVlKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH0gY2F0Y2gge31cclxuICAgIH1cclxuXHJcbiAgICB1cGRhdGVDb3VudGRvd24oKTtcclxuICAgIGNvbnN0IGludGVydmFsID0gc2V0SW50ZXJ2YWwodXBkYXRlQ291bnRkb3duLCAxMDAwKTtcclxuICAgIHJldHVybiAoKSA9PiBjbGVhckludGVydmFsKGludGVydmFsKTtcclxuICB9LCBbZHJ5UnVuQWN0aXZlXSk7XHJcblxyXG4gIGNvbnN0IGRpc3BsYXlTZWNvbmRzID0gZHJ5UnVuQWN0aXZlID8gZHJ5UnVuU2ltdWxhdGlvblRpbWUgOiBzZWNvbmRzUmVtYWluaW5nO1xyXG4gIGNvbnN0IG1tID0gU3RyaW5nKE1hdGguZmxvb3IoZGlzcGxheVNlY29uZHMgLyA2MCkpLnBhZFN0YXJ0KDIsIFwiMFwiKTtcclxuICBjb25zdCBzcyA9IFN0cmluZyhkaXNwbGF5U2Vjb25kcyAlIDYwKS5wYWRTdGFydCgyLCBcIjBcIik7XHJcblxyXG4gIGNvbnN0IG9uU2F2ZUNhcGl0YWwgPSBhc3luYyAoKSA9PiB7XHJcbiAgICBjb25zdCB2ID0gTnVtYmVyKGNhcGl0YWxJbnB1dCk7XHJcbiAgICBpZiAoIU51bWJlci5pc0Zpbml0ZSh2KSB8fCB2IDw9IDApIHtcclxuICAgICAgc2V0Q2FwTXNnKFwi4pqg77iPINij2K/YrtmEINmF2KjZhNi62YvYpyDYtdit2YrYrdmL2Kcg2KPZg9io2LEg2YXZhiDYtdmB2LFcIik7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIHNldFNhdmluZ0NhcCh0cnVlKTtcclxuICAgIHNldENhcE1zZyhudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBzYXZlQ2FwaXRhbEZuKHsgZGF0YTogeyBjYXBpdGFsOiB2IH0gfSk7XHJcbiAgICAgIGlmIChyLm9rKSB7XHJcbiAgICAgICAgc2V0Q2FwTXNnKGDinIUg2KrZhSDYp9mE2K3Zgdi4OiAke3Iuc2l6aW5nLnRvcF9ufSDZhdix2YPYsiDDlyAke01hdGgucm91bmQoci5zaXppbmcuc2xvdF9jYXBpdGFsKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhWApO1xyXG4gICAgICAgIGF3YWl0IHJlZmV0Y2goKTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBzZXRDYXBNc2coYOKdjCAke3IuZXJyb3J9YCk7XHJcbiAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGU6IGFueSkge1xyXG4gICAgICBzZXRDYXBNc2coYOKdjCDYrti32KM6ICR7ZT8ubWVzc2FnZSA/PyBcIti62YrYsSDZhdi52LHZiNmBXCJ9YCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRTYXZpbmdDYXAoZmFsc2UpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uQm91Z2h0ID0gYXN5bmMgKHNpZzogU2lnbmFsUm93KSA9PiB7XHJcbiAgICBzZXRCdXN5U2lnbmFsKHNpZy5pZCk7XHJcbiAgICBzZXRBY3Rpb25Nc2cobnVsbCk7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCBvdmVycmlkZVJhdyA9IHByaWNlT3ZlcnJpZGVzW3NpZy5pZF07XHJcbiAgICAgIGNvbnN0IHByaWNlID0gb3ZlcnJpZGVSYXcgPyBOdW1iZXIob3ZlcnJpZGVSYXcpIDogdW5kZWZpbmVkO1xyXG4gICAgICBjb25zdCByID0gYXdhaXQgbWFya0JvdWdodEZuVWkoeyBkYXRhOiB7IHNpZ25hbF9pZDogc2lnLmlkLCBwcmljZSB9IH0pO1xyXG4gICAgICBpZiAoci5vaykge1xyXG4gICAgICAgIHNldEFjdGlvbk1zZyhg4pyFICR7c2lnLnN5bWJvbH06INiq2YUg2KrYs9is2YrZhCDYp9mE2LTYsdin2KEgQCAke2ZtdFByaWNlKHIuc2lnbmFsPy5hY3R1YWxfYnV5X3ByaWNlID8/IHNpZy5lbnRyeV9wcmljZSl9INisLtmFYCk7XHJcbiAgICAgICAgYXdhaXQgcmVmZXRjaCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldEFjdGlvbk1zZyhg4p2MICR7c2lnLnN5bWJvbH06ICR7ci5lcnJvcn1gKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHNldEFjdGlvbk1zZyhg4p2MICR7c2lnLnN5bWJvbH06ICR7ZT8ubWVzc2FnZSA/PyBcItiu2LfYo1wifWApO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0QnVzeVNpZ25hbChudWxsKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBvblNvbGQgPSBhc3luYyAoc2lnOiBTaWduYWxSb3cpID0+IHtcclxuICAgIHNldEJ1c3lTaWduYWwoc2lnLmlkKTtcclxuICAgIHNldEFjdGlvbk1zZyhudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG92ZXJyaWRlUmF3ID0gcHJpY2VPdmVycmlkZXNbc2lnLmlkXTtcclxuICAgICAgY29uc3QgcHJpY2UgPSBvdmVycmlkZVJhdyA/IE51bWJlcihvdmVycmlkZVJhdykgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBtYXJrU29sZEZuVWkoeyBkYXRhOiB7IHNpZ25hbF9pZDogc2lnLmlkLCBwcmljZSB9IH0pO1xyXG4gICAgICBpZiAoci5vaykge1xyXG4gICAgICAgIGNvbnN0IHBubCA9IHIuc2lnbmFsPy5yZWFsaXplZF9wbmw7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKFxyXG4gICAgICAgICAgcG5sICE9IG51bGxcclxuICAgICAgICAgICAgPyBg4pyFICR7c2lnLnN5bWJvbH06INiq2YUg2KrYs9is2YrZhCDYp9mE2KjZiti5IOKAlCDYtdin2YHZiiAke01hdGgucm91bmQoTnVtYmVyKHBubCkpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFICgkeyhOdW1iZXIoci5zaWduYWw/LnJlYWxpemVkX3BubF9wY3QpICogMTAwKS50b0ZpeGVkKDIpfSUpYFxyXG4gICAgICAgICAgICA6IGDinIUgJHtzaWcuc3ltYm9sfTog2KrZhSDYqtiz2KzZitmEINin2YTYqNmK2LlgLFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgYXdhaXQgcmVmZXRjaCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldEFjdGlvbk1zZyhg4p2MICR7c2lnLnN5bWJvbH06ICR7ci5lcnJvcn1gKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHNldEFjdGlvbk1zZyhg4p2MICR7c2lnLnN5bWJvbH06ICR7ZT8ubWVzc2FnZSA/PyBcItiu2LfYo1wifWApO1xyXG4gICAgfSBmaW5hbGx5IHtcclxuICAgICAgc2V0QnVzeVNpZ25hbChudWxsKTtcclxuICAgIH1cclxuICB9O1xyXG5cclxuICBjb25zdCBwbGFuID0gZGF0YT8ucGxhbjtcclxuICBjb25zdCB0b2RheVNpZ25hbHMgPSBkYXRhPy50b2RheVNpZ25hbHMgPz8gW107XHJcbiAgY29uc3QgYmF0Y2hTY2FuRGF0ZSA9IGRhdGE/LmJhdGNoU2NhbkRhdGUgPz8gXCJcIjtcclxuICBjb25zdCBvcGVuUG9zaXRpb25zID0gZGF0YT8ub3BlblBvc2l0aW9ucyA/PyBbXTtcclxuICBjb25zdCBhdWRpdExvZ3MgPSBkYXRhPy5hdWRpdExvZ3MgPz8gW107XHJcbiAgY29uc3Qgc2VsbEFsZXJ0cyA9IGRhdGE/LnNlbGxBbGVydHMgPz8gW107XHJcblxyXG4gIC8vIFAmTCBNZXRyaWNzXHJcbiAgY29uc3QgdG90YWxPcGVuUG5sRWdwID0gb3BlblBvc2l0aW9ucy5yZWR1Y2UoKHN1bSwgcCkgPT4gc3VtICsgcC5wbmxFZ3AsIDApO1xyXG5cclxuICAvLyBTaW11bGF0ZWQgY2FuZGlkYXRlcyBhbmQgcG9zaXRpb25zIGZvciBEcnkgUnVuIE1vZGVcclxuICBjb25zdCBzaW11bGF0ZWRDYW5kaWRhdGVzID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogOTk5MSxcclxuICAgICAgc2Nhbl9kYXRlOiBcIjIwMjYtMDktMTdcIixcclxuICAgICAgc3ltYm9sOiBcIlRNR0hcIixcclxuICAgICAgZW50cnlfcHJpY2U6IDU0LjIwLFxyXG4gICAgICBnYXBfcGN0OiAwLjAxODUsXHJcbiAgICAgIHBvc2l0aW9uX3ZhbHVlOiA1MDAwLFxyXG4gICAgICBib3VnaHQ6IGZhbHNlLFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaWQ6IDk5OTIsXHJcbiAgICAgIHNjYW5fZGF0ZTogXCIyMDI2LTA5LTE3XCIsXHJcbiAgICAgIHN5bWJvbDogXCJGV1JZXCIsXHJcbiAgICAgIGVudHJ5X3ByaWNlOiA4LjY1LFxyXG4gICAgICBnYXBfcGN0OiAwLjAyMTAsXHJcbiAgICAgIHBvc2l0aW9uX3ZhbHVlOiA1MDAwLFxyXG4gICAgICBib3VnaHQ6IGZhbHNlLFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICBjb25zdCBzaW11bGF0ZWRQb3NpdGlvbnM6IEVucmljaGVkUG9zaXRpb25bXSA9IFtcclxuICAgIHtcclxuICAgICAgaWQ6IDk5OTMsXHJcbiAgICAgIHNjYW5fZGF0ZTogXCIyMDI2LTA5LTE3XCIsXHJcbiAgICAgIHN5bWJvbDogXCJDT01JXCIsXHJcbiAgICAgIGVudHJ5X3ByaWNlOiAxMzIuNTAsXHJcbiAgICAgIGFjdHVhbF9idXlfcHJpY2U6IDEzMi41MCxcclxuICAgICAgYnV5X3RpbWVzdGFtcDogXCIyMDI2LTA5LTE3VDA4OjA1OjAwWlwiLFxyXG4gICAgICBnYXBfcGN0OiAwLjAxNCxcclxuICAgICAgYmlkX2RlcHRoX2F0X2VudHJ5OiA0NTAwMDAsXHJcbiAgICAgIHBvc2l0aW9uX3ZhbHVlOiA1MDAwLFxyXG4gICAgICBib3VnaHQ6IHRydWUsXHJcbiAgICAgIHNvbGQ6IGZhbHNlLFxyXG4gICAgICBkYXkxX3N0YXR1czogXCJIRUxEXCIsXHJcbiAgICAgIGRheTFfcHJpY2U6IDEzMi41MCxcclxuICAgICAgZGF5Ml9zdGF0dXM6IG51bGwsXHJcbiAgICAgIGRheTJfcHJpY2U6IG51bGwsXHJcbiAgICAgIGRheTNfc3RhdHVzOiBudWxsLFxyXG4gICAgICBkYXkzX3ByaWNlOiBudWxsLFxyXG4gICAgICBleGl0X3JlYXNvbjogbnVsbCxcclxuICAgICAgYmlkX2NvbmZpcm1lZF9hdF9leGl0OiBudWxsLFxyXG4gICAgICBleHRyYV9ob2xkX3VzZWQ6IGZhbHNlLFxyXG4gICAgICBzaGFkb3dfZXhpdF9wcmljZTogbnVsbCxcclxuICAgICAgc2hhZG93X3BubDogbnVsbCxcclxuICAgICAgc2hhZG93X3BubF9wY3Q6IG51bGwsXHJcbiAgICAgIGFjdHVhbF9zZWxsX3ByaWNlOiBudWxsLFxyXG4gICAgICBzZWxsX3RpbWVzdGFtcDogbnVsbCxcclxuICAgICAgcmVhbGl6ZWRfcG5sOiBudWxsLFxyXG4gICAgICByZWFsaXplZF9wbmxfcGN0OiBudWxsLFxyXG4gICAgICBzZWxsX3NpZ25hbDogZmFsc2UsXHJcbiAgICAgIHNlbGxfc2lnbmFsX3JlYXNvbjogbnVsbCxcclxuICAgICAgY3JlYXRlZF9hdDogXCIyMDI2LTA5LTE3VDA4OjAwOjAwWlwiLFxyXG4gICAgICB1cGRhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIGN1cnJlbnRQcmljZTogMTM1LjIwLFxyXG4gICAgICBwbmxFZ3A6IDEwMixcclxuICAgICAgcG5sUGN0OiAwLjAyMDQsXHJcbiAgICAgIGRheXNIZWxkOiAyLFxyXG4gICAgICBkYXlzUmVtYWluaW5nOiAzLFxyXG4gICAgICBleGl0RGF0ZTogXCIyMDI2LTA5LTIyXCIsXHJcbiAgICAgIGV4aXREYXlOYW1lOiBcItin2YTYq9mE2KfYq9in2KFcIixcclxuICAgICAgaXNTY2hlZHVsZWRFeGl0OiBmYWxzZSxcclxuICAgICAgaXNBbm9tYWx5OiBmYWxzZSxcclxuICAgICAgc2hhcmVzOiAzNyxcclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIGlkOiA5OTk0LFxyXG4gICAgICBzY2FuX2RhdGU6IFwiMjAyNi0wOS0xN1wiLFxyXG4gICAgICBzeW1ib2w6IFwiRUtIT1wiLFxyXG4gICAgICBlbnRyeV9wcmljZTogMS4zMCxcclxuICAgICAgYWN0dWFsX2J1eV9wcmljZTogMS4zMCxcclxuICAgICAgYnV5X3RpbWVzdGFtcDogXCIyMDI2LTA5LTE3VDA4OjA1OjAwWlwiLFxyXG4gICAgICBnYXBfcGN0OiAwLjAyMixcclxuICAgICAgYmlkX2RlcHRoX2F0X2VudHJ5OiAxMjAwMDAsXHJcbiAgICAgIHBvc2l0aW9uX3ZhbHVlOiA1MDAwLFxyXG4gICAgICBib3VnaHQ6IHRydWUsXHJcbiAgICAgIHNvbGQ6IGZhbHNlLFxyXG4gICAgICBkYXkxX3N0YXR1czogXCJIRUxEXCIsXHJcbiAgICAgIGRheTFfcHJpY2U6IDEuMzAsXHJcbiAgICAgIGRheTJfc3RhdHVzOiBudWxsLFxyXG4gICAgICBkYXkyX3ByaWNlOiBudWxsLFxyXG4gICAgICBkYXkzX3N0YXR1czogbnVsbCxcclxuICAgICAgZGF5M19wcmljZTogbnVsbCxcclxuICAgICAgZXhpdF9yZWFzb246IFwiU1RPUF9MT1NTXCIsXHJcbiAgICAgIGJpZF9jb25maXJtZWRfYXRfZXhpdDogdHJ1ZSxcclxuICAgICAgZXh0cmFfaG9sZF91c2VkOiBmYWxzZSxcclxuICAgICAgc2hhZG93X2V4aXRfcHJpY2U6IG51bGwsXHJcbiAgICAgIHNoYWRvd19wbmw6IG51bGwsXHJcbiAgICAgIHNoYWRvd19wbmxfcGN0OiBudWxsLFxyXG4gICAgICBhY3R1YWxfc2VsbF9wcmljZTogbnVsbCxcclxuICAgICAgc2VsbF90aW1lc3RhbXA6IG51bGwsXHJcbiAgICAgIHJlYWxpemVkX3BubDogbnVsbCxcclxuICAgICAgcmVhbGl6ZWRfcG5sX3BjdDogbnVsbCxcclxuICAgICAgc2VsbF9zaWduYWw6IHRydWUsXHJcbiAgICAgIHNlbGxfc2lnbmFsX3JlYXNvbjogXCJTVE9QX0xPU1NcIixcclxuICAgICAgY3JlYXRlZF9hdDogXCIyMDI2LTA5LTE3VDA4OjAwOjAwWlwiLFxyXG4gICAgICB1cGRhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIGN1cnJlbnRQcmljZTogMS4xNSxcclxuICAgICAgcG5sRWdwOiAtNTc2LFxyXG4gICAgICBwbmxQY3Q6IC0wLjExNTQsXHJcbiAgICAgIGRheXNIZWxkOiAyLFxyXG4gICAgICBkYXlzUmVtYWluaW5nOiAzLFxyXG4gICAgICBleGl0RGF0ZTogXCIyMDI2LTA5LTIyXCIsXHJcbiAgICAgIGV4aXREYXlOYW1lOiBcItin2YTYq9mE2KfYq9in2KFcIixcclxuICAgICAgaXNTY2hlZHVsZWRFeGl0OiBmYWxzZSxcclxuICAgICAgaXNBbm9tYWx5OiBmYWxzZSxcclxuICAgICAgc2hhcmVzOiAzODQ2LFxyXG4gICAgfSxcclxuICBdO1xyXG5cclxuICBjb25zdCBhY3RpdmVDYW5kaWRhdGVzTGlzdCA9IGRyeVJ1bkFjdGl2ZSA/IHNpbXVsYXRlZENhbmRpZGF0ZXMgOiB0b2RheVNpZ25hbHM7XHJcbiAgY29uc3QgYWN0aXZlT3BlblBvc2l0aW9uc0xpc3QgPSBkcnlSdW5BY3RpdmUgPyBzaW11bGF0ZWRQb3NpdGlvbnMgOiBvcGVuUG9zaXRpb25zO1xyXG5cclxuICBjb25zdCBlbWVyZ2VuY3lBbm9tYWx5UG9zaXRpb25zID0gYWN0aXZlT3BlblBvc2l0aW9uc0xpc3QuZmlsdGVyKChwKSA9PiBwLmlzQW5vbWFseSk7XHJcbiAgY29uc3Qgc2NoZWR1bGVkRXhpdFBvc2l0aW9ucyA9IGFjdGl2ZU9wZW5Qb3NpdGlvbnNMaXN0LmZpbHRlcigocCkgPT4gcC5pc1NjaGVkdWxlZEV4aXQpO1xyXG5cclxuICByZXR1cm4gKFxyXG4gICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgbWQ6cC02IG1heC13LTZ4bCBteC1hdXRvIHNwYWNlLXktNVwiIGRpcj1cInJ0bFwiPlxyXG4gICAgICA8RGF0YUZyZXNobmVzc0Jhbm5lciAvPlxyXG5cclxuICAgICAgey8qIENvbnRyb2wgSGVhZGVyICYgRHJ5IFJ1biBTd2l0Y2ggKi99XHJcbiAgICAgIDxoZWFkZXIgY2xhc3NOYW1lPVwiZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtMyBiZy1jYXJkIGJvcmRlciByb3VuZGVkLTJ4bCBwLTQgc2hhZG93LXNtXCI+XHJcbiAgICAgICAgPGRpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj7imqE8L3NwYW4+XHJcbiAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LTJ4bCBmb250LWJsYWNrIHRyYWNraW5nLXRpZ2h0XCI+2LrYsdmB2Kkg2KfZhNi52YXZhNmK2KfYqiDigJQg2KfZhNmF2YjZhdmG2KrZhSDYp9mE2KPYs9io2YjYudmKICjZgtmF2Kkg2LPZhtmI2YrYqSDYt9in2LLYqSk8L2gxPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XHJcbiAgICAgICAgICAgINij2KrZhdiq2Kkg2YPYp9mF2YTYqSDZhNmE2YXYs9itINmI2KfZhNmF2KrYp9io2LnYqSDigKIg2YbYuNin2YUg2KPYs9io2YjYudmKOiDYr9iu2YjZhCDYp9mE2KPYrdiv2Iwg2K7YsdmI2Kwg2KfZgdiq2KrYp9itINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhSDigKIg2K/ZiNix2YMg2KfZhNmI2K3ZitivOiDYtti62Lcg2LLYsSDYp9mE2LTYsdin2KEg2KPZiCDYp9mE2KjZiti5INmB2Yog2KvYp9mG2K/YsSDYqNi52K8g2KfZhNiq2YbYqNmK2YcuXHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT1cIm10LTIgdGV4dC14cyBweC0zIHB5LTEuNSByb3VuZGVkLWxnIGJvcmRlciBiZy1tdXRlZCBob3ZlcjpiZy1hY2NlbnQgdHJhbnNpdGlvblwiXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9e2FzeW5jICgpID0+IHtcclxuICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgciA9IGF3YWl0IGZldGNoKFwiL2FwaS9wdWJsaWMvaG9va3MvYXJjaGl2ZS1mb2xkZXI/YWN0aW9uPW9wZW5cIik7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBqID0gYXdhaXQgci5qc29uKCk7XHJcbiAgICAgICAgICAgICAgICBpZiAoai5vaykgY29uc29sZS5sb2coXCJhcmNoaXZlOlwiLCBqLmNhdGNodXApO1xyXG4gICAgICAgICAgICAgIH0gY2F0Y2gge31cclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAg8J+TgSDZgdiq2K0g2YXYrNmE2K8g2KPYsdi02YrZgSDYp9mE2KjZitin2YbYp9iqINin2YTZitmI2YXZitipXHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiB7XHJcbiAgICAgICAgICAgICAgc2V0RHJ5UnVuQWN0aXZlKCFkcnlSdW5BY3RpdmUpO1xyXG4gICAgICAgICAgICAgIGlmICghZHJ5UnVuQWN0aXZlKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5U2lnbmFsQ2hpbWUoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH19XHJcbiAgICAgICAgICAgIGNsYXNzTmFtZT17YHJvdW5kZWQteGwgcHgtMy41IHB5LTIgdGV4dC14cyBmb250LWJvbGQgdHJhbnNpdGlvbi1hbGwgYm9yZGVyICR7XHJcbiAgICAgICAgICAgICAgZHJ5UnVuQWN0aXZlXHJcbiAgICAgICAgICAgICAgICA/IFwiYmctYW1iZXItNTAwLzIwIHRleHQtYW1iZXItMzAwIGJvcmRlci1hbWJlci01MDAvNDAgc2hhZG93LXNtIHNoYWRvdy1hbWJlci01MDAvMTBcIlxyXG4gICAgICAgICAgICAgICAgOiBcImJnLW11dGVkIGhvdmVyOmJnLW11dGVkLzcwIHRleHQtZm9yZWdyb3VuZCBib3JkZXItYm9yZGVyXCJcclxuICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICA+XHJcbiAgICAgICAgICAgIHtkcnlSdW5BY3RpdmUgPyBcIvCfp6og2YjYtti5INin2YTZhdit2KfZg9in2Kkg2YXZgdi52ZHZhCDinJMgKNil2YrZgtin2YEpXCIgOiBcIvCfp6og2KrYrNix2KjYqSDYp9mE2YXYrdin2YPYp9ipIChEcnkgUnVuKVwifVxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHJlZmV0Y2goKX1cclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgYmctbXV0ZWQgaG92ZXI6YmctbXV0ZWQvNzAgdGV4dC1mb3JlZ3JvdW5kIGJvcmRlciBib3JkZXItYm9yZGVyXCJcclxuICAgICAgICAgID5cclxuICAgICAgICAgICAg2KrYrdiv2YrYqyDYp9mE2KjZitin2YbYp9iqIPCflIRcclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L2hlYWRlcj5cclxuXHJcbiAgICAgIHsvKiBEcnkgUnVuIENvbnRyb2xzICYgQXVkaW8gVGVzdCBCdXR0b25zICovfVxyXG4gICAgICB7ZHJ5UnVuQWN0aXZlICYmIChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWFtYmVyLTk1MC8zMCBib3JkZXIgYm9yZGVyLWFtYmVyLTUwMC8zMCByb3VuZGVkLXhsIHAtMyBmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0yIHRleHQteHNcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1sZ1wiPvCfkqE8L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGQgdGV4dC1hbWJlci0yMDBcIj5cclxuICAgICAgICAgICAgICDYo9mG2Kog2KfZhNii2YYg2YHZiiDZiNi22Lkg2KfZhNmF2K3Yp9mD2KfYqSDYp9mE2KrYrNix2YrYqNmK2Kk6INin2K7Yqtio2LEg2YXYuNmH2LEg2KfZhNi52K/Yp9ivINin2YTYqtmG2KfYstmE2Yog2YjYqtmG2KjZitmH2KfYqiDYp9mE2LfZiNin2LHYpiDZiNiq2KzYsdio2Kkg2KfZhNij2LXZiNin2Kog2YLYqNmEINio2K/YoSDYp9mE2KzZhNiz2Kkg2KfZhNit2YLZitmC2YrYqS5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBwbGF5U2lnbmFsQ2hpbWUoKX1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1idWxsLzIwIGhvdmVyOmJnLWJ1bGwvMzAgdGV4dC1idWxsIHB4LTIuNSBweS0xIHJvdW5kZWQgdGV4dC1bMTFweF0gZm9udC1ib2xkXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIPCflJQg2YbYutmF2Kkg2KfZhNil2LTYp9ix2KkgKDEwOjAwKVxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHBsYXlFbWVyZ2VuY3lTaXJlbigpfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWJlYXIvMjAgaG92ZXI6YmctYmVhci8zMCB0ZXh0LWJlYXIgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGRcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAg8J+aqCDYtdmB2KfYsdipINin2YTYt9mI2KfYsdimXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcGxheVNjaGVkdWxlZEV4aXRUb25lKCl9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctcHJpbWFyeS8yMCBob3ZlcjpiZy1wcmltYXJ5LzMwIHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIHB4LTIuNSBweS0xIHJvdW5kZWQgdGV4dC1bMTFweF0gZm9udC1ib2xkXCJcclxuICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgIPCfk4Ug2YbYutmF2Kkg2KfZhNio2YrYuSDYp9mE2YXYrNiv2YjZhFxyXG4gICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG5cclxuICAgICAgey8qIOKUgOKUgCBQUklPUklUWSAxOiBFTUVSR0VOQ1kgQUxFUlRTIChBTk9NQUxJRVMgJiBTQ0hFRFVMRUQgRVhJVFMpIOKUgOKUgCAqL31cclxuICAgICAgeyhlbWVyZ2VuY3lBbm9tYWx5UG9zaXRpb25zLmxlbmd0aCA+IDAgfHwgc2VsbEFsZXJ0cy5sZW5ndGggPiAwKSAmJiAoXHJcbiAgICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwic3BhY2UteS0zXCI+XHJcbiAgICAgICAgICB7LyogQW5vbWFseSAvIE5lZ2F0aXZlIE5ld3MgRW1lcmdlbmN5IEJhbm5lciAqL31cclxuICAgICAgICAgIHtlbWVyZ2VuY3lBbm9tYWx5UG9zaXRpb25zLm1hcCgocCkgPT4gKFxyXG4gICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAga2V5PXtgYW5vbS0ke3AuaWR9YH1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXItMiBib3JkZXItYW1iZXItNTAwIGJnLWFtYmVyLTUwMC8yMCBwLTQgc2hhZG93LW1kIGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj7imqDvuI88L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LWFtYmVyLTMwMFwiPlxyXG4gICAgICAgICAgICAgICAgICAgINiq2YbYqNmK2Ycg2LfZiNin2LHYpjoge3Auc3ltYm9sfSDigJQg2KrYrdmC2YIg2YHZiNix2KfZiyDZhdmGINin2YTYs9mH2YUhXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1hbWJlci0yMDAvOTAgbXQtMC41XCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2KfZhNiz2KjYqDog2LHYtdivINiu2KjYsSDYs9mE2KjZiiDYrdin2K8g2KPZiCDYqtmC2YTYqCDYp9iz2KrYq9mG2KfYptmKINi62YrYsSDZhdiq2YjZgti5INmK2YfYr9ivINin2YTYtdmB2YLYqSDZgtio2YQg2KfZg9iq2YXYp9mEINmF2K/YqSDYp9mE2YXYs9mDLlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uU29sZChwKX1cclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtidXN5U2lnbmFsID09PSBwLmlkfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTIgdGV4dC14cyBmb250LWJvbGQgYmctYW1iZXItNjAwIGhvdmVyOmJnLWFtYmVyLTUwMCB0ZXh0LXdoaXRlXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICDYqtiu2KfYsdisINin2LbYt9ix2KfYsdmKXHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKSl9XHJcblxyXG4gICAgICAgICAgey8qIFNjaGVkdWxlZCBTZWxsIEFsZXJ0cyBmcm9tIGJhY2tlbmQgKi99XHJcbiAgICAgICAgICB7c2VsbEFsZXJ0cy5tYXAoKHMpID0+IChcclxuICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgIGtleT17YHNhLSR7cy5pZH1gfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlci0yIGJvcmRlci1wcmltYXJ5LzUwIGJnLXByaW1hcnkvMTUgcC00IGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTNcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtM1wiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC0yeGxcIj7wn5OFPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgdGV4dC1wcmltYXJ5LWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICDYrdin2YYg2YjZgtiqINin2YTYqNmK2Lkg2KfZhNmF2KzYr9mI2YQ6IHtzLnN5bWJvbH0gKNin2YPYqtmF2YTYqiA1INis2YTYs9in2Kog4oCUINiu2LHZiNisINin2YHYqtiq2KfYrSDYp9mE2KPYs9io2YjYuSDYp9mE2YLYp9iv2YUpXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTAuNVwiPlxyXG4gICAgICAgICAgICAgICAgICAgINmG2YfYp9mK2Kkg2YHYqtix2Kkg2KfZhNmF2LPZgyDYp9mE2KPYs9io2YjYudmK2KkuINin2YTYrtix2YjYrCDYqNiz2LnYsSDYp9mE2LPZiNmCINmB2Yog2KrYt9io2YrZgiDYq9in2YbYr9ixINi52YbYryDYp9mE2KfZgdiq2KrYp9itIOKAlCDZhtmB2LMg2YLYp9i52K/YqSDYp9mE2YLZitin2LMg2KfZhNiq2KfYsdmK2K7Zii5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBvblNvbGQocyl9XHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17YnVzeVNpZ25hbCA9PT0gcy5pZH1cclxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQteGwgcHgtNCBweS0yIHRleHQteHMgZm9udC1ib2xkIGJnLXByaW1hcnkgdGV4dC1wcmltYXJ5LWZvcmVncm91bmQgaG92ZXI6YmctcHJpbWFyeS85MFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge2J1c3lTaWduYWwgPT09IHMuaWQgPyBcIi4uLlwiIDogXCLYqtmFINin2YTYqNmK2Lkg4pyTXCJ9XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKSl9XHJcbiAgICAgICAgPC9zZWN0aW9uPlxyXG4gICAgICApfVxyXG5cclxuICAgICAge2FjdGlvbk1zZyAmJiAoXHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIGJvcmRlciBiZy1jYXJkIHAtMyB0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWJ1bGwgZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgIDxzcGFuPvCflJQ8L3NwYW4+XHJcbiAgICAgICAgICA8c3Bhbj57YWN0aW9uTXNnfTwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgKX1cclxuXHJcbiAgICAgIHsvKiDilIDilIAgU0VDVElPTiAxOiAxMDowMCBBTSBRVUFMSUZJRUQgQ0FORElEQVRFUyAmIENPVU5URE9XTiBUSU1FUiDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1jYXJkIHAtNSBzaGFkb3ctc20gc3BhY2UteS00XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIGJvcmRlci1iIHBiLTNcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+8J+Orzwvc3Bhbj5cclxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrXCI+2KXYtNin2LHYp9iqINin2YTZitmI2YUgKNin2YTYs9in2LnYqSAxMDowMCDYtdio2KfYrdin2YspPC9oMj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIHB4LTIuNSBweS0wLjUgcm91bmRlZC1mdWxsIGJnLXByaW1hcnkvMjAgdGV4dC1wcmltYXJ5IGZvbnQtYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAge2FjdGl2ZUNhbmRpZGF0ZXNMaXN0Lmxlbmd0aH0g2YXYsdi02K1cclxuICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XHJcbiAgICAgICAgICAgICAg2KfZhNij2LPZh9mFINin2YTZhdik2YfZhNipINio2LnYryDZg9mEINmB2YTYp9iq2LEg2KfZhNmG2LjYp9mFINin2YTYtdin2K/Zgjog2LTYsdmK2LnYqSDZgdmC2LcgKyDYs9mK2YjZhNipIOKJpSAyMDAg2KPZhNmBINisLtmFL9mK2YjZhSAo2KPYudmE2YkgMTAwKSArINiy2K7ZhSA1INis2YTYs9in2Kog2KjZitmGIDglLTQ1JSArINmB2YTYqtixINin2YTZhti42KfZhSAo2KrYsdin2YPZhSAxMCDYo9iz2KfYqNmK2LkpICsg2YLYp9i52K/YqSDYp9mE2YHYrNmI2Kkg2LnZhtivINin2YTYp9mB2KrYqtin2K0gKC0zJSDYpdmE2YkgKzIlKS5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgey8qIDE1LU1pbnV0ZSBDb3VudGRvd24gV2luZG93ICovfVxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICB7IWlzV2luZG93RXhwaXJlZCA/IChcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHJvdW5kZWQteGwgYmctYnVsbC8xNSBib3JkZXIgYm9yZGVyLWJ1bGwvMzAgcHgtMy41IHB5LTJcIj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZSBhbmltYXRlLXB1bHNlXCI+4o+x77iPPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LWJ1bGwgZm9udC1ib2xkXCI+2YbYp9mB2LDYqSDYp9mE2KrZhtmB2YrYsCDYp9mE2YXZiNi12Ykg2KjZh9inPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYmxhY2sgZm9udC1tb25vIHRleHQtYnVsbCB0cmFja2luZy13aWRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgINmF2KrYqNmC2Yoge21tfTp7c3N9INiv2YLZitmC2KlcclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHJvdW5kZWQteGwgYmctYW1iZXItNTAwLzE1IGJvcmRlciBib3JkZXItYW1iZXItNTAwLzQwIHB4LTMuNSBweS0yXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2VcIj7imqDvuI88L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYW1iZXItNDAwIGZvbnQtYm9sZFwiPtin2YbYqtmH2Kog2YbYp9mB2LDYqSDYp9mE2YAgMTUg2K/ZgtmK2YLYqTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1hbWJlci0zMDAgZm9udC1zZW1pYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgINin2YTZgdix2LXYqSDYp9mE2KPYtdmE2YrYqSDYqNi52YrYr9ipIOKAlCDYqtit2YLZgiDZhdmGINin2YTYs9i52LEg2YLYqNmEINin2YTYtNix2KfYoVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApfVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHsvKiBXYXJuaW5nIEJhbm5lciBpZiBMYXRlICovfVxyXG4gICAgICAgIHtpc1dpbmRvd0V4cGlyZWQgJiYgKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIGJnLWFtYmVyLTUwMC8xMCBwLTMgdGV4dC14cyB0ZXh0LWFtYmVyLTMwMCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c3Bhbj7imqDvuI88L3NwYW4+XHJcbiAgICAgICAgICAgIDxzcGFuPlxyXG4gICAgICAgICAgICAgIDxiPtiq2YbYqNmK2Ycg2KrYo9iu2LE6PC9iPiDYqtis2KfZiNiy2Kog2YXYr9ipINin2YTZgCAxNSDYr9mC2YrZgtipINin2YTYo9mI2YTZiSDZhdmGINin2YTYrNmE2LPYqS4g2KfZhNil2LTYp9ix2KfYqiDZhNinINiq2Y/Yrdiw2YEg2KrZhNmC2KfYptmK2KfZiyDYrdix2LXYp9mLINi52YTZiSDYudiv2YUg2KrZgdmI2YrYqiDYp9mE2YHYsdi12Iwg2YjZhNmD2YYg2KrYo9mD2K8g2YXZhiDYs9i52LEg2KfZhNiz2YfZhSDYp9mE2K3Yp9mE2Yog2YHZiiDYqti32KjZitmCINir2KfZhtiv2LEg2YLYqNmEINin2YTYtti62Lcg2LnZhNmJINin2YTYtNix2KfYoS5cclxuICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuXHJcbiAgICAgICAge2FjdGl2ZUNhbmRpZGF0ZXNMaXN0Lmxlbmd0aCA+IDAgPyAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LXgtYXV0b1wiPlxyXG4gICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHNcIj5cclxuICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctbXV0ZWQvNDAgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGJvcmRlci1iXCI+XHJcbiAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7Yp9mE2LPZh9mFPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtiz2LnYsSDYpdi02KfYsdipINin2YTYr9iu2YjZhDwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7Ystiu2YUgNSDYrNmE2LPYp9iqICU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2YLZitmF2Kkg2KfZhNmF2LHZg9iyINin2YTZhdiu2LfYtzwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7Yp9mE2LPYudixINin2YTZhdmG2YHYsCAo2KXZhiDYp9iu2KrZhNmBKTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1jZW50ZXIgZm9udC1ib2xkXCI+2KfZhNil2KzYsdin2KEg2YHZiiDYq9in2YbYr9ixPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmRlclwiPlxyXG4gICAgICAgICAgICAgICAge2FjdGl2ZUNhbmRpZGF0ZXNMaXN0Lm1hcCgocykgPT4gKFxyXG4gICAgICAgICAgICAgICAgICA8dHIga2V5PXtzLmlkfSBjbGFzc05hbWU9XCJob3ZlcjpiZy1tdXRlZC8xNSB0cmFuc2l0aW9uLWNvbG9yc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1ib2xkIGZvbnQtbW9ubyB0ZXh0LXNtXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7cy5zeW1ib2x9XHJcbiAgICAgICAgICAgICAgICAgICAgICB7KHMgYXMgYW55KS5faGFsYWwgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC0xIHRleHQtWzEwcHhdIHB4LTEuNSBweS0wLjUgcm91bmRlZCBiZy1lbWVyYWxkLTUwMC8xNSB0ZXh0LWVtZXJhbGQtNTAwIGZvbnQtc2Fuc1wiPti02LHZiti52Kk8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMyBmb250LW1vbm8gZm9udC1ib2xkIHRleHQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2ZtdFByaWNlKE51bWJlcihzLmVudHJ5X3ByaWNlKSl9INisLtmFXHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1iZWFyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAreyhOdW1iZXIocy5nYXBfcGN0KSAqIDEwMCkudG9GaXhlZCgyKX0lXHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyBmb250LXNlbWlib2xkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7TWF0aC5yb3VuZChOdW1iZXIocy5wb3NpdGlvbl92YWx1ZSkpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFXHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXA9XCIwLjAxXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGxhY2Vob2xkZXI9e2ZtdFByaWNlKE51bWJlcihzLmVudHJ5X3ByaWNlKSl9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlPXtwcmljZU92ZXJyaWRlc1tzLmlkXSA/PyBcIlwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldFByaWNlT3ZlcnJpZGVzKChwKSA9PiAoeyAuLi5wLCBbcy5pZF06IGUudGFyZ2V0LnZhbHVlIH0pKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy0yNCByb3VuZGVkLWxnIGJvcmRlciBiZy1iYWNrZ3JvdW5kIHB4LTIgcHktMSB0ZXh0LXhzIGZvbnQtbW9ub1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMyB0ZXh0LWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgeyFzLmJvdWdodCA/IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uQm91Z2h0KHMgYXMgU2lnbmFsUm93KX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17YnVzeVNpZ25hbCA9PT0gcy5pZH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTQgcHktMS41IHRleHQteHMgZm9udC1ibGFjayBiZy1idWxsIHRleHQtYnVsbC1mb3JlZ3JvdW5kIGhvdmVyOmJnLWJ1bGwvOTAgdHJhbnNpdGlvbi1hbGwgc2hhZG93LXNtIGRpc2FibGVkOm9wYWNpdHktNTBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAge2J1c3lTaWduYWwgPT09IHMuaWQgPyBcItis2KfYsdmKINin2YTYrdmB2LguLi5cIiA6IFwi2KrZhSDYp9mE2LTYsdin2KEg4pyTXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgdGV4dC1idWxsIGJnLWJ1bGwvMjAgcHgtMyBweS0xIHJvdW5kZWQtZnVsbFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgINiq2YUg2KfZhNi02LHYp9ihINmC2YrYryDYp9mE2YXYqtin2KjYudipIOKck1xyXG4gICAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICApKX1cclxuICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKSA6IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktNiB0ZXh0LW11dGVkLWZvcmVncm91bmQgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICB7aXNCZWZvcmVNYXJrZXRcclxuICAgICAgICAgICAgICA/IFwi8J+VkiDZhtmG2KrYuNixINio2K/YoSDYrNmE2LPYqSDYp9mE2KrYr9in2YjZhCDZgdmKINiq2YXYp9mFINin2YTYs9in2LnYqSAxMDowMCDYtdio2KfYrdin2Ysg2YTYpdi32YTYp9mCINil2LTYp9ix2KfYqiDYp9mE2YrZiNmFLlwiXHJcbiAgICAgICAgICAgICAgOiBcItmE2Kcg2YXYsdi02K3ZitmGINiv2KfYrtmEINmG2LfYp9mCINin2YTYstiu2YUgKDglLTQ1JSkg2YfYsNinINin2YTYo9iz2KjZiNi5IOKAlCDYo9mIINmB2YTYqtixINin2YTZhti42KfZhSDYo9mI2YLZgSDYp9mE2KrYr9in2YjZhC4g2KfZhNmG2LjYp9mFINij2LPYqNmI2LnZijog2KfZhNiv2K7ZiNmEINin2YTYo9it2K8g2YHZgti3LlwifVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDEuNTogTElWRSBUUkFDS0lORyDigJQgRVZFUlkgU0lHTkFMIFJPVzogTk9NSU5BVElPTiDihpAgTElWRSDihpAgJSDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1jYXJkIHAtNSBzaGFkb3ctc20gc3BhY2UteS00XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIGJvcmRlci1iIHBiLTNcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+8J+Ujjwvc3Bhbj5cclxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrXCI+2KfZhNiq2KrYqNi5INin2YTYrdmKIOKAlCDZg9mEINil2LTYp9ix2Kkg2YHZiiDYp9mE2K/Zgdi52Kkg2KfZhNit2KfZhNmK2Kk8L2gyPlxyXG4gICAgICAgICAgICAgIHtiYXRjaFNjYW5EYXRlICYmIChcclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHB4LTIgcHktMC41IHJvdW5kZWQtZnVsbCBiZy1tdXRlZCB0ZXh0LW11dGVkLWZvcmVncm91bmQgZm9udC1ib2xkIGZvbnQtbW9ub1wiPlxyXG4gICAgICAgICAgICAgICAgICDYr9mB2LnYqSDZhdiz2K0ge2JhdGNoU2NhbkRhdGV9XHJcbiAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cclxuICAgICAgICAgICAgICDYsdmP2LTZkNmR2K0g2KjZg9in2YUgKNiz2LnYsSDYp9mE2KrYsdi02YrYrSkg4oaQINin2YTYs9i52LEg2KfZhNit2Yog2KfZhNii2YYg4oaQINin2YTZgdix2YIg2KfZhNmE2K3YuNmKICUuINiq2K3Yr9mK2Ksg2KrZhNmC2KfYptmKINmD2YQgMTUg2KvYp9mG2YrYqS5cclxuICAgICAgICAgICAgICDCq+KAlMK7INmK2LnZhtmKINmE2Kcg2YrZiNis2K8g2LPYudixINmE2K3YuNmKINmE2YfYsNinINin2YTYs9mH2YUg2KfZhNii2YYgKNin2YTYs9i52LEg2KfZhNmF2LHYrNi52Yog2YrYuNmEINiz2LnYsSDYp9mE2KrYsdi02YrYrSkuXHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7dG9kYXlTaWduYWxzLmxlbmd0aCA+IDAgPyAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LXgtYXV0b1wiPlxyXG4gICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHNcIj5cclxuICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctbXV0ZWQvNDAgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGJvcmRlci1iXCI+XHJcbiAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7Yp9mE2LPZh9mFPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtix2Y/YtNmQ2ZHYrSBAPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtit2K/ZiNivINin2YTYtNix2KfYoTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7Yp9mE2LPYudixINin2YTYrdmKPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPiUg2K3ZiiDZhdmGINin2YTYqtix2LTZititPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYrdin2YTYqTwvdGg+XHJcbiAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgIDwvdGhlYWQ+XHJcbiAgICAgICAgICAgICAgPHRib2R5IGNsYXNzTmFtZT1cImRpdmlkZS15IGRpdmlkZS1ib3JkZXJcIj5cclxuICAgICAgICAgICAgICAgIHt0b2RheVNpZ25hbHMubWFwKChzKSA9PiB7XHJcbiAgICAgICAgICAgICAgICAgIGNvbnN0IHN0ID0gdHJhY2tTdGF0dXMocyk7XHJcbiAgICAgICAgICAgICAgICAgIHJldHVybiAoXHJcbiAgICAgICAgICAgICAgICAgICAgPHRyIGtleT17YGx0LSR7cy5pZH1gfSBjbGFzc05hbWU9XCJob3ZlcjpiZy1tdXRlZC8xNSB0cmFuc2l0aW9uLWNvbG9yc1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMyBmb250LWJvbGQgZm9udC1tb25vIHRleHQtc21cIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3Muc3ltYm9sfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5faGFsYWwgJiYgKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTEgdGV4dC1bMTBweF0gcHgtMS41IHB5LTAuNSByb3VuZGVkIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC01MDAgZm9udC1zYW5zXCI+2LTYsdmK2LnYqTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyB0ZXh0LVsxMXB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3MuX2JhbmRMbyAhPSBudWxsICYmIHMuX2JhbmRIaSAhPSBudWxsID8gYCR7Zm10UHJpY2Uocy5fYmFuZExvKX0g4oCTICR7Zm10UHJpY2Uocy5fYmFuZEhpKX1gIDogXCLigJRcIn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyBmb250LWJvbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3MubGl2ZVByaWNlICE9IG51bGwgPyAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7Zm10UHJpY2Uocy5saXZlUHJpY2UpfSDYrC7ZhWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgKSA6IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7igJQ8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT17YHAtMyBmb250LW1vbm8gZm9udC1ib2xkICR7cy5saXZlUGN0ID09IG51bGwgPyBcInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiIDogcy5saXZlUGN0ID49IDAgPyBcInRleHQtYnVsbFwiIDogXCJ0ZXh0LWJlYXJcIn1gfT5cclxuICAgICAgICAgICAgICAgICAgICAgICAge3MubGl2ZVBjdCAhPSBudWxsID8gYCR7cy5saXZlUGN0ID49IDAgPyBcIitcIiA6IFwiXCJ9JHsocy5saXZlUGN0ICogMTAwKS50b0ZpeGVkKDIpfSVgIDogXCLigJRcIn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT17YHRleHQtWzExcHhdIGZvbnQtYm9sZCBweC0yIHB5LTAuNSByb3VuZGVkIGJnLW11dGVkLzYwICR7c3QuY2xzfWB9PntzdC5sYWJlbH08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgICAgICB9KX1cclxuICAgICAgICAgICAgICA8L3Rib2R5PlxyXG4gICAgICAgICAgICA8L3RhYmxlPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKSA6IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1jZW50ZXIgcHktNiB0ZXh0LW11dGVkLWZvcmVncm91bmQgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICDZhNinINiq2YjYrNivINil2LTYp9ix2KfYqiDZgdmKINin2YTYr9mB2LnYqSDYp9mE2K3Yp9mE2YrYqSDigJQg2LPYqti42YfYsSDZh9mG2Kcg2YHZiNixINij2YjZhCDZhdiz2K0g2KPYs9io2YjYudmKICjYp9mE2KPYrdivKS5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIHsvKiDilIDilIAgU0VDVElPTiAyOiBBQ1RJVkUgT1BFTiBQT1NJVElPTlMgKFRSQUNLSU5HICYgNC1EQVkgRUdYIFBST0dSRVNTSU9OKSDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1jYXJkIHAtNSBzaGFkb3ctc20gc3BhY2UteS00XCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIGJvcmRlci1iIHBiLTNcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhsXCI+8J+SvDwvc3Bhbj5cclxuICAgICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC1sZyBmb250LWJsYWNrXCI+XHJcbiAgICAgICAgICAgICAgICDYp9mE2LXZgdmC2KfYqiDYp9mE2YXZgdiq2YjYrdipINmC2YrYryDYp9mE2YXYqtin2KjYudipICh7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubGVuZ3RofSlcclxuICAgICAgICAgICAgICA8L2gyPlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMVwiPlxyXG4gICAgICAgICAgICAgINmF2KrYp9io2LnYqSDYrdmK2Kkg2YXYs9iq2YXYsdipINmE2YPZhCDYtdmB2YLYqSDYqtmFINiq2KPZg9mK2K8g2LTYsdin2KbZh9inINi32YjYp9mEINin2YTYo9iz2KjZiNi5ICg1INis2YTYs9in2KopIOKAlCDYp9mE2K7YsdmI2Kwg2KfZhNmI2K3ZitivOiDYp9mB2KrYqtin2K0g2KPZiNmEINis2YTYs9ipINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhS4g2KjZhNinINmI2YLZgSDYrtiz2KfYsdipICjZhdmP2YLYp9izOiDZitiy2YrYryDYp9mE2K7Ys9in2LHYqSkg4oCUINin2YTYrdmF2KfZitipINi52KjYsSDYqti12LrZitixINin2YTYrdis2YUg2KrZhNmC2KfYptmK2KfZiy5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAge2FjdGl2ZU9wZW5Qb3NpdGlvbnNMaXN0Lmxlbmd0aCA+IDAgJiYgKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgZm9udC1ib2xkIGZvbnQtbW9ub1wiPlxyXG4gICAgICAgICAgICAgINil2KzZhdin2YTZiiDYp9mE2KPYsdio2KfYrSDYp9mE2YTYrdi42YrYqTp7XCIgXCJ9XHJcbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXt0b3RhbE9wZW5QbmxFZ3AgPj0gMCA/IFwidGV4dC1idWxsXCIgOiBcInRleHQtYmVhclwifT5cclxuICAgICAgICAgICAgICAgIHt0b3RhbE9wZW5QbmxFZ3AgPj0gMCA/IFwiK1wiIDogXCJcIn1cclxuICAgICAgICAgICAgICAgIHtNYXRoLnJvdW5kKHRvdGFsT3BlblBubEVncCkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YVcclxuICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKX1cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAge2FjdGl2ZU9wZW5Qb3NpdGlvbnNMaXN0Lmxlbmd0aCA+IDAgPyAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTRcIj5cclxuICAgICAgICAgICAge2FjdGl2ZU9wZW5Qb3NpdGlvbnNMaXN0Lm1hcCgocG9zKSA9PiB7XHJcbiAgICAgICAgICAgICAgY29uc3QgcHJvZ3Jlc3NQY3QgPSBNYXRoLm1pbigxMDAsIE1hdGgucm91bmQoKHBvcy5kYXlzSGVsZCAvIDUpICogMTAwKSk7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAga2V5PXtwb3MuaWR9XHJcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YHJvdW5kZWQtMnhsIGJvcmRlciBwLTQgc3BhY2UteS0zIHRyYW5zaXRpb24tYWxsICR7XHJcbiAgICAgICAgICAgICAgICAgICAgcG9zLmlzQW5vbWFseVxyXG4gICAgICAgICAgICAgICAgICAgICAgPyBcImJvcmRlci1hbWJlci01MDAgYmctYW1iZXItNTAwLzEwXCJcclxuICAgICAgICAgICAgICAgICAgICAgIDogXCJiZy1jYXJkIGJvcmRlci1ib3JkZXIgaG92ZXI6Ym9yZGVyLWJvcmRlci84MFwiXHJcbiAgICAgICAgICAgICAgICAgIH1gfVxyXG4gICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlblwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayBmb250LW1vbm9cIj57cG9zLnN5bWJvbH08L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LVsxMXB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXItMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDYr9iu2YjZhDoge2ZtdERhdGUocG9zLnNjYW5fZGF0ZSl9IEAge2ZtdFByaWNlKE51bWJlcihwb3MuYWN0dWFsX2J1eV9wcmljZSA/PyBwb3MuZW50cnlfcHJpY2UpKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtcmlnaHRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIGZvbnQtbW9ub1wiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7Zm10UHJpY2UocG9zLmN1cnJlbnRQcmljZSl9INisLtmFXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdGV4dC1bMTFweF0gZm9udC1ib2xkIGZvbnQtbW9ubyAke1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5wbmxQY3QgPj0gMCA/IFwidGV4dC1idWxsXCIgOiBcInRleHQtYmVhclwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1gfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cG9zLnBubFBjdCA+PSAwID8gXCIrXCIgOiBcIlwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7KHBvcy5wbmxQY3QgKiAxMDApLnRvRml4ZWQoMil9JSAoe3Bvcy5wbmxFZ3AgPj0gMCA/IFwiK1wiIDogXCJcIn1cclxuICAgICAgICAgICAgICAgICAgICAgICAge01hdGgucm91bmQocG9zLnBubEVncCkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YUpXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICB7LyogV2Vla2x5IGhvbGRpbmcgcHJvZ3Jlc3Npb24gKDUgc2Vzc2lvbnMsIFN1bi4uVGh1KSAqL31cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJzcGFjZS15LTEuNSBiZy1tdXRlZC80MCBwLTIuNSByb3VuZGVkLXhsIGJvcmRlciBib3JkZXItYm9yZGVyLzUwIHRleHQteHNcIj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LVsxMXB4XVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAg2YXYs9in2LEg2KfZhNij2LPYqNmI2LkgKNiq2YLZiNmK2YUgRUdYKTpcclxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cImZvbnQtYm9sZCB0ZXh0LWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAg2KzZhNiz2Kkge01hdGgubWluKHBvcy5kYXlzSGVsZCwgNSl9INmF2YYgNSAo2YXYqtio2YLZiiB7cG9zLmRheXNSZW1haW5pbmd9INis2YTYs9ipKVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidy1mdWxsIGJnLW11dGVkIHJvdW5kZWQtZnVsbCBoLTIgb3ZlcmZsb3ctaGlkZGVuXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YGgtZnVsbCByb3VuZGVkLWZ1bGwgdHJhbnNpdGlvbi1hbGwgJHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBwb3MuZGF5c0hlbGQgPj0gNSA/IFwiYmctcHJpbWFyeVwiIDogXCJiZy1idWxsXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlPXt7IHdpZHRoOiBgJHtwcm9ncmVzc1BjdH0lYCB9fVxyXG4gICAgICAgICAgICAgICAgICAgICAgLz5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiB0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgcHQtMC41XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7YqNmE2Kcg2YjZgtmBINiu2LPYp9ix2KkgKNmF2Y/Zgtin2LM6INmK2LLZitivINin2YTYrtiz2KfYsdipKSDigJQg2KfZhNit2YXYp9mK2Kk6INiq2LXYutmK2LEg2KfZhNit2KzZhSDYp9mE2KrZhNmC2KfYptmKPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4+2KfZhNiu2LHZiNisOiB7cG9zLmV4aXREYXlOYW1lfSB7cG9zLmV4aXREYXRlfSDYudmG2K8g2KfZhNin2YHYqtiq2KfYrTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgICAgICAgICAgICB7LyogQWN0aW9uIGJ1dHRvbiAqL31cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gcHQtMVwiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge3Bvcy5zaGFyZXMudG9Mb2NhbGVTdHJpbmcoKX0g2LPZh9mFXHJcbiAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uU29sZChwb3MpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2J1c3lTaWduYWwgPT09IHBvcy5pZH1cclxuICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQteGwgcHgtNCBweS0xLjUgdGV4dC14cyBmb250LWJsYWNrIGJnLWJlYXIvMjAgdGV4dC1iZWFyIGhvdmVyOmJnLWJlYXIvMzAgZGlzYWJsZWQ6b3BhY2l0eS01MFwiXHJcbiAgICAgICAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2J1c3lTaWduYWwgPT09IHBvcy5pZCA/IFwiLi4uXCIgOiBcItiq2YUg2KfZhNio2YrYuSDZgdmKINir2KfZhtiv2LEg4pyTXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgfSl9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS02IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICAgINmE2Kcg2KrZiNis2K8g2LXZgdmC2KfYqiDZhdmB2KrZiNit2Kkg2K3Yp9mE2YrYp9mLLiDYudmG2K8g2LjZh9mI2LEg2KXYtNin2LHYqSDZiNi22LrYt9mDINi52YTZiSDCq9iq2YUg2KfZhNi02LHYp9ihwrvYjCDYs9iq2LjZh9ixINin2YTYtdmB2YLYqSDZh9mG2Kcg2YjYqtiu2LbYuSDZhNmE2YXYsdin2YLYqNipINin2YTYrdmK2Kkg2KjYp9mE2KvZiNin2YbZii5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICl9XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIHsvKiDilIDilIAgU0VDVElPTiAzOiBFR1ggVFJBRElORyBDQUxFTkRBUiAmIFdFRUtFTkQgUFJPVE9DT0wg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYmctbXV0ZWQvMjAgcC00IHNwYWNlLXktMyB0ZXh0LXhzXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMiB0ZXh0LWZvcmVncm91bmQgZm9udC1ib2xkXCI+XHJcbiAgICAgICAgICA8c3Bhbj7wn5OFPC9zcGFuPlxyXG4gICAgICAgICAgPHNwYW4+2KfZhNiq2YLZiNmK2YUg2KfZhNiq2LTYutmK2YTZiiDYp9mE2LXYsdmK2K0g2YTZgCBFR1gg2YjYqtmI2LLZiti5INin2YTYo9mK2KfZhTo8L3NwYW4+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIG1kOmdyaWQtY29scy0yIGdhcC0zIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBsZWFkaW5nLXJlbGF4ZWRcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctY2FyZCBwLTMgcm91bmRlZC14bCBib3JkZXJcIj5cclxuICAgICAgICAgICAgPGIgY2xhc3NOYW1lPVwidGV4dC1mb3JlZ3JvdW5kIGJsb2NrIG1iLTFcIj7Yr9mI2LHYqSDYp9mE2KPYs9io2YjYuSAoNSDYrNmE2LPYp9iq2Iwg2YrYqtiu2LfZiSDYudi32YTYqSDZhtmH2KfZitipINin2YTYo9iz2KjZiNi5KTo8L2I+XHJcbiAgICAgICAgICAgINin2YTYr9iu2YjZhDog2KfZgdiq2KrYp9itINij2YjZhCDYrNmE2LPYqSDYp9mE2KPYs9io2YjYuSAo2KfZhNij2K3Yrykg4oCUINin2YTYrtix2YjYrDog2KfZgdiq2KrYp9itINij2YjZhCDYrNmE2LPYqSDYp9mE2KPYs9io2YjYuSDYp9mE2YLYp9iv2YUuXHJcbiAgICAgICAgICAgIDxiciAvPlxyXG4gICAgICAgICAgICA8Yj7Zhdir2KfZhCDYrdmKOjwvYj4g2K/YrtmI2YQgPGI+2KfZhNij2K3YrzwvYj4g4p6UINin2YTYo9iz2KjZiNi5INmK2YXYtNmKICjYp9mE2KPYrdivLdin2YTYrtmF2YrYsykg4p6UINin2YTYrNmF2LnYqSDZiNin2YTYs9io2Kog2K7Yp9ix2Kwg2KfZhNit2LPYp9ioIOKelCDYrtix2YjYrCA8Yj7Yp9mE2KPYrdivINin2YTZgtin2K/ZhTwvYj4g2LnZhtivINin2YTYp9mB2KrYqtin2K0uINio2YTYpyDZiNmC2YEg2K7Ys9in2LHYqSDZiNmE2Kcg2KzZhtmKINij2LHYqNin2K0g4oCUINin2YTYp9iq2YbZitmGINmF2Y/Zgtin2LPZitmGOiDZitiy2YrYr9mI2Kcg2KfZhNiu2LPYp9ix2KkuXHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctY2FyZCBwLTMgcm91bmRlZC14bCBib3JkZXJcIj5cclxuICAgICAgICAgICAgPGIgY2xhc3NOYW1lPVwidGV4dC1mb3JlZ3JvdW5kIGJsb2NrIG1iLTFcIj7ZhdmH2KfZhSDYudi32YTYqSDYp9mE2KzZhdi52Kkg2YjYp9mE2LPYqNiqICjYp9mE2KrYrdmE2YrZhCDYp9mE2YXYs9iq2YLZhCk6PC9iPlxyXG4gICAgICAgICAgICDYqtmP2LPYqti62YQg2LnYt9mE2Kkg2KfZhNis2YXYudipINmI2KfZhNiz2KjYqiDZgdmKINiq2LTYutmK2YQg2KfZhNi52YXZhNmK2KfYqiDYp9mE2KrYrdmE2YrZhNmK2Kkg2LrZitixINin2YTYrdmK2Kkg2K/ZiNmGINiq2LnYp9ix2LYg2YXYuSDYp9mE2KrYr9in2YjZhDpcclxuICAgICAgICAgICAgPHVsIGNsYXNzTmFtZT1cImxpc3QtZGlzYyBwci00IG10LTEgc3BhY2UteS0wLjVcIj5cclxuICAgICAgICAgICAgICA8bGk+2KXYtdiv2KfYsSDYp9mE2KrZgtix2YrYsSDYp9mE2KPYs9io2YjYudmKINin2YTYtNin2YXZhCDZhNmE2YXYrdmB2LjYqS48L2xpPlxyXG4gICAgICAgICAgICAgIDxsaT7Zgdit2LUg2YXYpNi02LEg2KfZhNij2YTZgdinIChBbHBoYSkg2YjZhdmC2KfYsdmG2Kkg2KfZhNij2K/Yp9ihINio2YAgRUdYMzAuPC9saT5cclxuICAgICAgICAgICAgICA8bGk+2YXYsdin2KzYudipINmI2KrYrdiv2YrYqyDZgtin2KbZhdipINij2LPZh9mFINin2YTYtNix2YrYudipICjZg9mEIDYg2LTZh9mI2LEpLjwvbGk+XHJcbiAgICAgICAgICAgIDwvdWw+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDQ6IENBUElUQUwgU0VUVElOR1Mg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYmctY2FyZCBwLTQgc2hhZG93LXNtXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1lbmQgZ2FwLTNcIj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIG1pbi13LTU2XCI+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJvbGQgbWItMVwiPvCfkrAg2LHYo9izINin2YTZhdin2YQg2KfZhNmF2KrYp9itINmE2YTYqtiv2KfZiNmEPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG1iLTJcIj5cclxuICAgICAgICAgICAgICDZitmP2K3Ys9ioINi52K/YryDYp9mE2YXYsdin2YPYsiDYqtmE2YLYp9im2YrZi9inOiBUT1BfTiA9INix2KPYsyDYp9mE2YXYp9mEIMO3IDIwLDAwMCAo2YXZhiAxINil2YTZiSA1INmF2LHYp9mD2LIg4oCUINin2YTYpdi52K/Yp9ivINin2YTZhdiv2LHZiNizIE41OiDYo9mB2LbZhCDYqtmI2KfYstmGINi52KfYptivL9in2KrYs9in2YIg2YXZgtin2LMpLiDZgdmI2YIgMTAwINij2YTZgSDZitiy2YrYryDYrdis2YUg2KfZhNmF2LHZg9iyINin2YTZiNin2K3Yry5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBnYXAtMiBpdGVtcy1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICA8aW5wdXRcclxuICAgICAgICAgICAgICAgIHR5cGU9XCJudW1iZXJcIlxyXG4gICAgICAgICAgICAgICAgbWluPXsxfVxyXG4gICAgICAgICAgICAgICAgc3RlcD17MTAwMH1cclxuICAgICAgICAgICAgICAgIHZhbHVlPXtjYXBpdGFsSW5wdXR9XHJcbiAgICAgICAgICAgICAgICBvbkNoYW5nZT17KGUpID0+IHNldENhcGl0YWxJbnB1dChlLnRhcmdldC52YWx1ZSl9XHJcbiAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj1cItmF2KvYp9mEOiAxMDAwMDBcIlxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy00MCByb3VuZGVkLXhsIGJvcmRlciBiZy1iYWNrZ3JvdW5kIHB4LTMgcHktMS41IHRleHQtc20gZm9udC1tb25vXCJcclxuICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9e29uU2F2ZUNhcGl0YWx9XHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17c2F2aW5nQ2FwfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTEuNSB0ZXh0LXhzIGZvbnQtc2VtaWJvbGQgYmctcHJpbWFyeSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCBob3ZlcjpiZy1wcmltYXJ5LzkwIGRpc2FibGVkOm9wYWNpdHktNTBcIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgIHtzYXZpbmdDYXAgPyBcItis2KfYsdmKINin2YTYrdmB2LjigKZcIiA6IFwi2K3Zgdi4XCJ9XHJcbiAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICB7Y2FwTXNnICYmIDxkaXYgY2xhc3NOYW1lPVwibXQtMSB0ZXh0LVsxMXB4XVwiPntjYXBNc2d9PC9kaXY+fVxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICB7c2l6aW5nICYmIChcclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0zIGdhcC0yIHRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIGJvcmRlciBiZy1tdXRlZC80MCBweC0zIHB5LTJcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7Ysdij2LMg2KfZhNmF2KfZhCDYp9mE2YHYudmR2KfZhDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCBmb250LW1vbm9cIj57TWF0aC5yb3VuZChzaXppbmcudG90YWxfY2FwaXRhbCkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YU8L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLW11dGVkLzQwIHB4LTMgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPti52K/YryDYp9mE2YXYsdin2YPYsiAoVE9QX04pPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIGZvbnQtbW9ub1wiPntzaXppbmcudG9wX259PC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIGJvcmRlciBiZy1tdXRlZC80MCBweC0zIHB5LTJcIj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bOXB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj7Yrdis2YUg2KfZhNmF2LHZg9iyIChTTE9UKTwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCBmb250LW1vbm9cIj57TWF0aC5yb3VuZChzaXppbmcuc2xvdF9jYXBpdGFsKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhTwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICl9XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvc2VjdGlvbj5cclxuXHJcbiAgICAgIHsvKiDilIDilIAgU0VDVElPTiA1OiBERUNJU0lPTiBBVURJVCBMT0cgKFBFUk1BTkVOVCBSRUNPUkQpIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTNcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBib3JkZXItYiBwYi0zXCI+XHJcbiAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICA8aDIgY2xhc3NOYW1lPVwidGV4dC1iYXNlIGZvbnQtYm9sZFwiPvCfk5wg2LPYrNmEINin2YTZgtix2KfYsdin2Kog2YjYp9mE2KrZhtio2YrZh9in2Kog2KfZhNmF2YjYq9mCIChEZWNpc2lvbiBBdWRpdCBMb2cpPC9oMj5cclxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTAuNVwiPlxyXG4gICAgICAgICAgICAgINiz2KzZhCDYr9in2KbZhSDZiNmF2KTYsdiuINio2KfZhNir2KfZhtmK2Kkg2YTZg9mEINil2LTYp9ix2Kkg2LXYr9ix2KrYjCDZg9mEINil2YbYsNin2LEg2LfZiNin2LHYptiMINmI2LHYryDZgdi52YQg2KfZhNmF2LPYqtiu2K/ZhSDZhNiq2YjYq9mK2YIg2KfZhNij2K/Yp9ihINiq2KfYsdmK2K7Zitin2YsuXHJcbiAgICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7YXVkaXRMb2dzLmxlbmd0aCA+IDAgPyAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cIm92ZXJmbG93LXgtYXV0byBtYXgtaC02MFwiPlxyXG4gICAgICAgICAgICA8dGFibGUgY2xhc3NOYW1lPVwidy1mdWxsIHRleHQteHNcIj5cclxuICAgICAgICAgICAgICA8dGhlYWQgY2xhc3NOYW1lPVwiYmctbXV0ZWQvNDAgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHN0aWNreSB0b3AtMFwiPlxyXG4gICAgICAgICAgICAgICAgPHRyPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yIHRleHQtcmlnaHRcIj7Yp9mE2KrZiNmC2YrYqjwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtmG2YjYuSDYp9mE2K3Yr9irPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0XCI+2KfZhNiz2YfZhTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtin2YTYs9i52LE8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yIHRleHQtcmlnaHRcIj7Yqti12LHZgSDYp9mE2YXYs9iq2K7Yr9mFPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmRlclwiPlxyXG4gICAgICAgICAgICAgICAge2F1ZGl0TG9ncy5tYXAoKGxvZykgPT4gKFxyXG4gICAgICAgICAgICAgICAgICA8dHIga2V5PXtsb2cuaWR9IGNsYXNzTmFtZT1cImhvdmVyOmJnLW11dGVkLzE1XCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMiBmb250LW1vbm8gdGV4dC1bMTBweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bG9nLmNyZWF0ZWRfYXQgPyBsb2cuY3JlYXRlZF9hdC5zbGljZSgwLCAxOSkucmVwbGFjZShcIlRcIiwgXCIgXCIpIDogXCLigJRcIn1cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIgZm9udC1zZW1pYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIlVTRVJfQk9VR0hUXCIgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1idWxsXCI+8J+bkiDYqtij2YPZitivINi02LHYp9ihPC9zcGFuPn1cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZXZlbnRfdHlwZSA9PT0gXCJVU0VSX1NPTERcIiAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXByaW1hcnlcIj7wn5KwINiq2KPZg9mK2K8g2KjZiti5PC9zcGFuPn1cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZXZlbnRfdHlwZSA9PT0gXCJFTUVSR0VOQ1lfU1RPUF9MT1NTXCIgJiYgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iZWFyIGZvbnQtYm9sZFwiPvCfmqgg2KXZhtiw2KfYsSDZiNmC2YEg2K7Ys9in2LHYqTwvc3Bhbj59XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bG9nLmV2ZW50X3R5cGUgPT09IFwiU0lHTkFMXzEwQU1cIiAmJiA8c3Bhbj7wn46vINil2LTYp9ix2KkgMTA6MDAg2LXYqNin2K3Yp9mLPC9zcGFuPn1cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZXZlbnRfdHlwZSA9PT0gXCJTQ0hFRFVMRURfRVhJVFwiICYmIDxzcGFuPvCfk4Ug2K7YsdmI2Kwg2KPYs9io2YjYudmKINmF2KzYr9mI2YQ8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMiBmb250LW1vbm8gZm9udC1ib2xkXCI+e2xvZy5zeW1ib2x9PC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yIGZvbnQtbW9ub1wiPntsb2cudHJpZ2dlcl9wcmljZSA/IGZtdFByaWNlKE51bWJlcihsb2cudHJpZ2dlcl9wcmljZSkpIDogXCLigJRcIn0g2Kwu2YU8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInB4LTIgcHktMC41IHJvdW5kZWQgdGV4dC1bMTBweF0gZm9udC1ib2xkIGJnLW11dGVkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtsb2cudXNlcl9hY3Rpb259XHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAg2YTYpyDYqtmI2KzYryDYs9is2YTYp9iqINmC2LHYp9ix2KfYqiDYs9in2KjZgtipINio2LnYry4g2YPZhCDZhtmC2LHYqSDYtNix2KfYoSDYo9mIINio2YrYuSDYo9mIINiq2YbYqNmK2Ycg2LfZiNin2LHYpiDYs9iq2Y/ZiNir2YIg2YfZhtinINiq2YTZgtin2KbZitin2YsuXHJcbiAgICAgICAgICA8L3A+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDY6IE1FQVNVUkVEIFBFUkZPUk1BTkNFIChob25lc3QsIGhhbGFsLW9ubHkpIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJvcmRlci13YXJuLzQwIGJnLXdhcm4vMTAgcC00IHNwYWNlLXktMlwiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtc21cIj7wn5OLINin2YTYo9iv2KfYoSDYp9mE2YXZj9mC2KfYsyAo2LTYsdmK2LnYqSDZgdmC2Lcg4oCUINio2KfZgy3Yqtiz2Kog2LXYp9iv2YIgNTEyINij2LPYqNmI2LkgMjAxNi0yMDI22Iwg2KrZg9mE2YHYqSDYq9in2YbYr9ixIDAuMDUlKTwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBncmlkLWNvbHMtMiBtZDpncmlkLWNvbHMtNCBnYXAtMiB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCLYp9mE2YbYuNin2YUg2KfZhNit2KfZhNmKICjYotiu2LEgOTAg2YrZiNmFKVwiIHZhbHVlPXtgfiR7Q1VSUkVOVF9SRUdJTUVfV0VFS0xZX0xPV19FR1AudG9Mb2NhbGVTdHJpbmcoKX0tJHtDVVJSRU5UX1JFR0lNRV9XRUVLTFlfSElHSF9FR1AudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YVgfSB0b25lPVwiYnVsbFwiIHN1Yj1cItij2YHYttmEINmB2KrYsdipINmB2Yog2KfZhNi52YLYryDigJQg2YTZitizINit2YLYp9mLINmF2YPYqtiz2KjYp9mLXCIgLz5cclxuICAgICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cItin2YTZhdiq2YjYs9i3INin2YTYt9mI2YrZhCDYp9mE2YXZiNir2YjZgiAoMTAg2LPZhtmK2YYpXCIgdmFsdWU9e2Ake0JBQ0tURVNUX1dFRUtMWV9FR1AudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YVgfSB0b25lPVwiZGVmYXVsdFwiIHN1Yj17YNmB2KfYtdmEINir2YLYqSA5NSU6ICR7QkFDS1RFU1RfV0VFS0xZX0VHUF9MT1cudG9Mb2NhbGVTdHJpbmcoKX0tJHtCQUNLVEVTVF9XRUVLTFlfRUdQX0hJR0gudG9Mb2NhbGVTdHJpbmcoKX1gfSAvPlxyXG4gICAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwi2KPYs9mI2KMg2KPYs9io2YjYuSAoMTAg2LPZhtmK2YYpXCIgdmFsdWU9e2Ake0JBQ0tURVNUX1dPUlNUX1dFRUtfUENULnRvTG9jYWxlU3RyaW5nKCl9JWB9IHRvbmU9XCJiZWFyXCIgLz5cclxuICAgICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cItij2YLYtdmJINiq2LHYp9is2LkgKDEwINiz2YbZitmGKVwiIHZhbHVlPXtgJHtCQUNLVEVTVF9NQVhERF9QQ1QudG9Mb2NhbGVTdHJpbmcoKX0lYH0gdG9uZT1cImJlYXJcIiBzdWI9XCLZhdi5INin2YTYrdmF2KfZitin2Kog2KfZhNiq2YTZgtin2KbZitipOiB+MjctMzAlXCIgLz5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ib3JkZXIvNTAgYmctY2FyZC82MCBwLTIuNSB0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBsZWFkaW5nLXJlbGF4ZWRcIj5cclxuICAgICAgICAgIDxiIGNsYXNzTmFtZT1cInRleHQtZm9yZWdyb3VuZFwiPti02YPZhCDYp9mE2KPYs9in2KjZiti5INin2YTYrdmC2YrZgtmKICjZhdmC2KfYsyk6PC9iPiB+MjUtMzAlINmB2YLYtyDZhdmGINin2YTYo9iz2KfYqNmK2Lkg2KrYqtis2KfZiNiyIDIsNTAwINisLtmFINmI2YjYs9mK2Lcg2KfZhNij2LPYqNmI2Lkg4omIIDAg4oCUXHJcbiAgICAgICAgICDYo9i62YTYqCDYp9mE2KPYs9in2KjZiti5INi12LrZitix2Kkg2KPZiCDYs9in2YTYqNipINmI2KfZhNmF2KrZiNiz2Lcg2KjZitiq2K3ZgtmCINmF2YYg2YLZgdiy2KfYqiDZhtin2K/YsdipICjYstmKICsyMSw1MDAg2YgrMzQsOTAwINmB2Yog2YrZiNmG2YrZiC/ZitmI2YTZitmIIDIwMjYpINmE2Kcg2YrZhdmD2YYg2KrZiNmC2YrYqtmH2KcuXHJcbiAgICAgICAgICA8YiBjbGFzc05hbWU9XCJ0ZXh0LWZvcmVncm91bmRcIj4g2YjZhNinINmK2YjYrNivINmI2LnYryDYqNix2KjYrSDYq9in2KjYqiDigJQg2YXYsdmB2YjYtiDZhdmGINmD2YQg2KfZhNij2LfYsdin2YEuPC9iPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGxlYWRpbmctcmVsYXhlZFwiPntCQUNLVEVTVF9ESVNDTEFJTUVSX0FSfTwvcD5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIFJ1bGVzIEZvb3RlciAqL31cclxuICAgICAgPGZvb3RlciBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS00IHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGJvcmRlci10XCI+XHJcbiAgICAgICAg2YLZiNin2LnYryDZgdmE2KfYqtixINin2YTYp9iz2KrYsdin2KrZitis2YrYqSDZiNmF2LnYp9iv2YTYp9iq2YfYpyDZhdis2YXYr9ipINmE2YXYr9ipIDQtNiDYo9iz2KfYqNmK2Lkg2YTZhNin2K7Yqtio2KfYsSDZiNin2YTZhdix2KfZgtio2Kkg2KfZhNi12KfYsdmF2KkuXHJcbiAgICAgIDwvZm9vdGVyPlxyXG4gICAgPC9kaXY+XHJcbiAgKTtcclxufVxyXG4iXSwiZmlsZSI6IkQ6L21la3ktc3RvY2stbWFpbi9tZWt5LXN0b2NrLW1haW4vc3JjL3JvdXRlcy9zY2FscC1kaXAudHN4In0=