import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/scalp-dip.tsx?tss-serverfn-lookup");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f3a543ee"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import { createClientRpc } from "/node_modules/@tanstack/react-start/dist/esm/client-rpc.js?v=f3a543ee";
import { createFileRoute } from "/node_modules/@tanstack/react-router/dist/esm/index.dev.js?v=f3a543ee";
import { createServerFn, useServerFn } from "/node_modules/@tanstack/react-start/dist/esm/index.js?v=f3a543ee";
import { useQuery } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=f3a543ee";
import __vite__cjsImport5_react from "/node_modules/.vite/deps/react.js?v=f3a543ee"; const useState = __vite__cjsImport5_react["useState"]; const useEffect = __vite__cjsImport5_react["useEffect"]; const useRef = __vite__cjsImport5_react["useRef"];
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
export const Route = createFileRoute("/scalp-dip")({
  component: ScalpDipOperationalPage,
  errorComponent: ({
    error
  }) => /* @__PURE__ */ jsxDEV("div", { className: "p-6 text-destructive", "data-tsd-source": "/src/routes/scalp-dip.tsx:301:34", children: [
    "خطأ: ",
    error.message
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
    lineNumber: 57,
    columnNumber: 9
  }, this),
  notFoundComponent: () => /* @__PURE__ */ jsxDEV("div", { className: "p-6", "data-tsd-source": "/src/routes/scalp-dip.tsx:302:28", children: "غير موجود" }, void 0, false, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
    lineNumber: 58,
    columnNumber: 28
  }, this),
  head: () => ({
    meta: [{
      title: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)"
    }, {
      name: "description",
      content: "لوحة التحكم الأسبوعية: ترشيحات الأحد مع عداد التنفيذ 15 دقيقة، تتبع حي للصفقات طوال الأسبوع، إشعارات طوارئ صوتية وبصرية، وتقويم EGX الصريح."
    }]
  })
});
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
  return /* @__PURE__ */ jsxDEV("div", { className: "bg-card border rounded-xl p-3 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:338:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] uppercase font-medium tracking-wider text-muted-foreground mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:339:7", children: label }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 105,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `text-lg font-extrabold font-mono ${cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:340:7", children: value }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 106,
      columnNumber: 7
    }, this),
    sub && /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:341:15", children: sub }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 107,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
    lineNumber: 104,
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
  return /* @__PURE__ */ jsxDEV("div", { className: "p-4 md:p-6 max-w-6xl mx-auto space-y-5", dir: "rtl", "data-tsd-source": "/src/routes/scalp-dip.tsx:637:5", children: [
    /* @__PURE__ */ jsxDEV(DataFreshnessBanner, { "data-tsd-source": "/src/routes/scalp-dip.tsx:638:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 397,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { className: "flex flex-wrap items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:641:7", children: [
      /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:642:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:643:11", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:644:13", children: "⚡" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 403,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-black tracking-tight", "data-tsd-source": "/src/routes/scalp-dip.tsx:645:13", children: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 404,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 402,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:647:11", children: "أتمتة كاملة للمسح والمتابعة • نظام أسبوعي: دخول الأحد، خروج افتتاح الأسبوع القادم • دورك الوحيد: ضغط زر الشراء أو البيع في ثاندر بعد التنبيه." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 406,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "mt-2 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-accent transition", onClick: async () => {
          try {
            const r = await fetch("/api/public/hooks/archive-folder?action=open");
            const j = await r.json();
            if (j.ok) console.log("archive:", j.catchup);
          } catch {
          }
        }, "data-tsd-source": "/src/routes/scalp-dip.tsx:650:11", children: "📁 فتح مجلد أرشيف البيانات اليومية" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 409,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 401,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:664:9", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setDryRunActive(!dryRunActive);
          if (!dryRunActive) {
            playSignalChime();
          }
        }, className: `rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${dryRunActive ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10" : "bg-muted hover:bg-muted/70 text-foreground border-border"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:665:11", children: dryRunActive ? "🧪 وضع المحاكاة مفعّل ✓ (إيقاف)" : "🧪 تجربة المحاكاة (Dry Run)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 421,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => refetch(), className: "rounded-xl px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/70 text-foreground border border-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:680:11", children: "تحديث البيانات 🔄" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 429,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 420,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 400,
      columnNumber: 7
    }, this),
    dryRunActive && /* @__PURE__ */ jsxDEV("div", { className: "bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:691:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:692:11", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-lg", "data-tsd-source": "/src/routes/scalp-dip.tsx:693:13", children: "💡" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 438,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-amber-200", "data-tsd-source": "/src/routes/scalp-dip.tsx:694:13", children: "أنت الآن في وضع المحاكاة التجريبية: اختبر مظهر العداد التنازلي وتنبيهات الطوارئ وتجربة الأصوات قبل بدء الجلسة الحقيقية." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 439,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 437,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:698:11", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playSignalChime(), className: "bg-bull/20 hover:bg-bull/30 text-bull px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:699:13", children: "🔔 نغمة الإشارة (10:00)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 444,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playEmergencySiren(), className: "bg-bear/20 hover:bg-bear/30 text-bear px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:705:13", children: "🚨 صفارة الطوارئ" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 447,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playScheduledExitTone(), className: "bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:711:13", children: "📅 نغمة البيع المجدول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 450,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 443,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 436,
      columnNumber: 24
    }, this),
    (emergencyAnomalyPositions.length > 0 || sellAlerts.length > 0) && /* @__PURE__ */ jsxDEV("section", { className: "space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:723:9", children: [
      emergencyAnomalyPositions.map((p) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-4 shadow-md flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:726:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:730:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:731:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 461,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:732:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-amber-300", "data-tsd-source": "/src/routes/scalp-dip.tsx:733:19", children: [
              "تنبيه طوارئ: ",
              p.symbol,
              " — تحقق فوراً من السهم!"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 463,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-200/90 mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:736:19", children: "السبب: رصد خبر سلبي حاد أو تقلب استثنائي غير متوقع يهدد الصفقة قبل اكتمال مدة المسك." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 466,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 462,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 460,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(p), disabled: busySignal === p.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white", "data-tsd-source": "/src/routes/scalp-dip.tsx:741:15", children: "تخارج اضطراري" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 471,
          columnNumber: 15
        }, this)
      ] }, `anom-${p.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 459,
        columnNumber: 49
      }, this)),
      sellAlerts.map((s) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-primary/50 bg-primary/15 p-4 flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:753:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:757:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:758:17", children: "📅" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 479,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:759:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-primary-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:760:19", children: [
              "حان وقت البيع المجدول: ",
              s.symbol,
              " (اكتملت 5 جلسات — خروج افتتاح الأسبوع القادم)"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 481,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:763:19", children: "نهاية فترة المسك الأسبوعية. الخروج بسعر السوق في تطبيق ثاندر عند الافتتاح — نفس قاعدة القياس التاريخي." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 484,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 480,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 478,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90", "data-tsd-source": "/src/routes/scalp-dip.tsx:768:15", children: busySignal === s.id ? "..." : "تم البيع ✓" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 489,
          columnNumber: 15
        }, this)
      ] }, `sa-${s.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 477,
        columnNumber: 34
      }, this))
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 457,
      columnNumber: 75
    }, this),
    actionMsg && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-card p-3 text-xs font-bold text-bull flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:781:9", children: [
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:782:11", children: "🔔" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 496,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:783:11", children: actionMsg }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 497,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 495,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:788:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:789:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:790:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:791:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:792:15", children: "🎯" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 505,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:793:15", children: "إشارات اليوم (الساعة 10:00 صباحاً)" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 506,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:794:15", children: [
              activeCandidatesList.length,
              " مرشح"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 507,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 504,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:798:13", children: "الأسهم المؤهلة بعد كل فلاتر النظام الصادق: شريعة فقط + سيولة ≥ 200 ألف ج.م/يوم (أعلى 100) + زخم 5 جلسات بين 8%-45% + فلتر النظام (تراكم 10 أسابيع) + قاعدة الفجوة عند الافتتاح (-3% إلى +2%)." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 511,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 503,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:804:11", children: !isWindowExpired ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-bull/15 border border-bull/30 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:806:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base animate-pulse", "data-tsd-source": "/src/routes/scalp-dip.tsx:807:17", children: "⏱️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 519,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:808:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-bull font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:809:19", children: "نافذة التنفيذ الموصى بها" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 521,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-base font-black font-mono text-bull tracking-wider", "data-tsd-source": "/src/routes/scalp-dip.tsx:810:19", children: [
              "متبقي ",
              mm,
              ":",
              ss,
              " دقيقة"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 522,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 520,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 518,
          columnNumber: 33
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:816:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base", "data-tsd-source": "/src/routes/scalp-dip.tsx:817:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 527,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:818:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-amber-400 font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:819:19", children: "انتهت نافذة الـ 15 دقيقة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 529,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-300 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:820:19", children: "الفرصة الأصلية بعيدة — تحقق من السعر قبل الشراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 530,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 528,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 526,
          columnNumber: 24
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 517,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 502,
        columnNumber: 9
      }, this),
      isWindowExpired && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:831:11", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:832:13", children: "⚠️" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 540,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:833:13", children: [
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:834:15", children: "تنبيه تأخر:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 542,
            columnNumber: 15
          }, this),
          " تجاوزت مدة الـ 15 دقيقة الأولى من الجلسة. الإشارات لا تُحذف تلقائياً حرصاً على عدم تفويت الفرص، ولكن تأكد من سعر السهم الحالي في تطبيق ثاندر قبل الضغط على الشراء."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 541,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 539,
        columnNumber: 29
      }, this),
      activeCandidatesList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:840:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:841:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:842:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:843:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:844:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 550,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:845:19", children: "سعر إشارة الدخول" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 551,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:846:19", children: "زخم 5 جلسات %" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 552,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:847:19", children: "قيمة المركز المخطط" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 553,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:848:19", children: "السعر المنفذ (إن اختلف)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 554,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-center font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:849:19", children: "الإجراء في ثاندر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 555,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 549,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 548,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:852:15", children: activeCandidatesList.map((s) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:854:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:855:21", children: [
            s.symbol,
            s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:858:25", children: "شريعة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 562,
              columnNumber: 45
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 560,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:861:21", children: [
            fmtPrice(Number(s.entry_price)),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 564,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:864:21", children: [
            "+",
            (Number(s.gap_pct) * 100).toFixed(2),
            "%"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 567,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:867:21", children: [
            Math.round(Number(s.position_value)).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 570,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:870:21", children: /* @__PURE__ */ jsxDEV("input", { type: "number", step: "0.01", placeholder: fmtPrice(Number(s.entry_price)), value: priceOverrides[s.id] ?? "", onChange: (e) => setPriceOverrides((p) => ({
            ...p,
            [s.id]: e.target.value
          })), className: "w-24 rounded-lg border bg-background px-2 py-1 text-xs font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:871:23" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 574,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 573,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:880:21", children: !s.bought ? /* @__PURE__ */ jsxDEV("button", { onClick: () => onBought(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bull text-bull-foreground hover:bg-bull/90 transition-all shadow-sm disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:882:25", children: busySignal === s.id ? "جاري الحفظ..." : "تم الشراء ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 580,
            columnNumber: 36
          }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-bull bg-bull/20 px-3 py-1 rounded-full", "data-tsd-source": "/src/routes/scalp-dip.tsx:890:25", children: "تم الشراء قيد المتابعة ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 582,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 579,
            columnNumber: 21
          }, this)
        ] }, s.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 559,
          columnNumber: 50
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 558,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 547,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 546,
        columnNumber: 44
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:901:11", children: isBeforeMarket ? "🕒 ننتظر بدء جلسة التداول في تمام الساعة 10:00 صباحاً لإطلاق إشارات اليوم." : "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — أو فلتر النظام أوقف التداول. النظام أسبوعي: الدخول الأحد فقط." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 589,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 501,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:910:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:911:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:912:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:913:13", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:914:15", children: "🔎" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 599,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:915:15", children: "التتبع الحي — كل إشارة في الدفعة الحالية" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 600,
            columnNumber: 15
          }, this),
          batchScanDate && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:917:17", children: [
            "دفعة مسح ",
            batchScanDate
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 601,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 598,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:922:13", children: "رُشِّح بكام (سعر الترشيح) ← السعر الحي الآن ← الفرق اللحظي %. تحديث تلقائي كل 15 ثانية. «—» يعني لا يوجد سعر لحظي لهذا السهم الآن (السعر المرجعي يظل سعر الترشيح)." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 605,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 597,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 596,
        columnNumber: 9
      }, this),
      todaySignals.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:930:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:931:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:932:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:933:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:934:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 616,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:935:19", children: "رُشِّح @" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 617,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:936:19", children: "حدود الشراء" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 618,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:937:19", children: "السعر الحي" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 619,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:938:19", children: "% حي من الترشيح" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 620,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:939:19", children: "الحالة" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 621,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 615,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 614,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:942:15", children: todaySignals.map((s) => {
          const st = trackStatus(s);
          return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:946:21", children: [
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:947:23", children: [
              s.symbol,
              s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:950:27", children: "شريعة" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 630,
                columnNumber: 38
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 628,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:953:23", children: s._bandLo != null && s._bandHi != null ? `${fmtPrice(s._bandLo)} – ${fmtPrice(s._bandHi)}` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 632,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:956:23", children: s.livePrice != null ? `${fmtPrice(s.livePrice)} ج.م` : /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:960:27", children: "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 636,
              columnNumber: 81
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 635,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: `p-3 font-mono font-bold ${s.livePct == null ? "text-muted-foreground" : s.livePct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:963:23", children: s.livePct != null ? `${s.livePct >= 0 ? "+" : ""}${(s.livePct * 100).toFixed(2)}%` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 638,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:966:23", children: /* @__PURE__ */ jsxDEV("span", { className: `text-[11px] font-bold px-2 py-0.5 rounded bg-muted/60 ${st.cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:967:25", children: st.label }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 642,
              columnNumber: 25
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 641,
              columnNumber: 23
            }, this)
          ] }, `lt-${s.id}`, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 627,
            columnNumber: 22
          }, this);
        }) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 624,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 613,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 612,
        columnNumber: 36
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:976:11", children: "لا توجد إشارات في الدفعة الحالية — ستظهر هنا فور أول مسح أسبوعي (الأحد)." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 648,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 595,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:983:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:984:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:985:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:986:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:987:15", children: "💼" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 658,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:988:15", children: [
              "الصفقات المفتوحة قيد المتابعة (",
              activeOpenPositionsList.length,
              ")"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 659,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 657,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:992:13", children: "متابعة حية مستمرة لكل صفقة تم تأكيد شرائها طوال الأسبوع (5 جلسات) — الخروج الوحيد: افتتاح أول جلسة الأسبوع القادم. بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية عبر تصغير الحجم تلقائياً." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 663,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 656,
          columnNumber: 11
        }, this),
        activeOpenPositionsList.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:998:13", children: [
          "إجمالي الأرباح اللحظية:",
          " ",
          /* @__PURE__ */ jsxDEV("span", { className: totalOpenPnlEgp >= 0 ? "text-bull" : "text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:1000:15", children: [
            totalOpenPnlEgp >= 0 ? "+" : "",
            Math.round(totalOpenPnlEgp).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 670,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 668,
          columnNumber: 50
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 655,
        columnNumber: 9
      }, this),
      activeOpenPositionsList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:1009:11", children: activeOpenPositionsList.map((pos) => {
        const progressPct = Math.min(100, Math.round(pos.daysHeld / 5 * 100));
        return /* @__PURE__ */ jsxDEV("div", { className: `rounded-2xl border p-4 space-y-3 transition-all ${pos.isAnomaly ? "border-amber-500 bg-amber-500/10" : "bg-card border-border hover:border-border/80"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1013:17", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", "data-tsd-source": "/src/routes/scalp-dip.tsx:1021:19", children: [
            /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1022:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-base font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1023:23", children: pos.symbol }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 683,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground mr-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1024:23", children: [
                "دخول: ",
                fmtDate(pos.scan_date),
                " @ ",
                fmtPrice(Number(pos.actual_buy_price ?? pos.entry_price)),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 684,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 682,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1028:21", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1029:23", children: [
                fmtPrice(pos.currentPrice),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 689,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: `text-[11px] font-bold font-mono ${pos.pnlPct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1032:23", children: [
                pos.pnlPct >= 0 ? "+" : "",
                (pos.pnlPct * 100).toFixed(2),
                "% (",
                pos.pnlEgp >= 0 ? "+" : "",
                Math.round(pos.pnlEgp).toLocaleString(),
                " ج.م)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 692,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 688,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 681,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1045:19", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:1046:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1047:23", children: "مسار الأسبوع (تقويم EGX):" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 703,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1050:23", children: [
                "جلسة ",
                Math.min(pos.daysHeld, 5),
                " من 5 (متبقي ",
                pos.daysRemaining,
                " جلسة)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 706,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 702,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-muted rounded-full h-2 overflow-hidden", "data-tsd-source": "/src/routes/scalp-dip.tsx:1054:21", children: /* @__PURE__ */ jsxDEV("div", { className: `h-full rounded-full transition-all ${pos.daysHeld >= 5 ? "bg-primary" : "bg-bull"}`, style: {
              width: `${progressPct}%`
            }, "data-tsd-source": "/src/routes/scalp-dip.tsx:1055:23" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 711,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 710,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground pt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1062:21", children: [
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1063:23", children: "بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية: تصغير الحجم التلقائي" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 716,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1064:23", children: [
                "الخروج: ",
                pos.exitDayName,
                " ",
                pos.exitDate,
                " عند الافتتاح"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
                lineNumber: 717,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 715,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 701,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1069:19", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1070:21", children: [
              pos.shares.toLocaleString(),
              " سهم"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 723,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(pos), disabled: busySignal === pos.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bear/20 text-bear hover:bg-bear/30 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:1073:21", children: busySignal === pos.id ? "..." : "تم البيع في ثاندر ✓" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 726,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 722,
            columnNumber: 19
          }, this)
        ] }, pos.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 680,
          columnNumber: 18
        }, this);
      }) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 677,
        columnNumber: 47
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1086:11", children: "لا توجد صفقات مفتوحة حالياً. عند ظهور إشارة وضغطك على «تم الشراء»، ستظهر الصفقة هنا وتخضع للمراقبة الحية بالثواني." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 732,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 654,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-muted/20 p-4 space-y-3 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1093:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-foreground font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1094:9", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1095:11", children: "📅" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 740,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1096:11", children: "التقويم التشغيلي الصريح لـ EGX وتوزيع الأيام:" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 741,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 739,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-3 text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1098:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1099:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1100:13", children: "دورة الأسبوع (5 جلسات، يتخطى عطلة نهاية الأسبوع):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 745,
            columnNumber: 13
          }, this),
          "الدخول: افتتاح أول جلسة الأسبوع (الأحد) — الخروج: افتتاح أول جلسة الأسبوع القادم.",
          /* @__PURE__ */ jsxDEV("br", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1102:13" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 747,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1103:13", children: "مثال حي:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 748,
            columnNumber: 13
          }, this),
          " دخول ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1103:34", children: "الأحد" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 748,
            columnNumber: 86
          }, this),
          " ➔ الأسبوع يمشي (الأحد-الخميس) ➔ الجمعة والسبت خارج الحساب ➔ خروج ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1103:112", children: "الأحد القادم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 748,
            columnNumber: 216
          }, this),
          " عند الافتتاح. بلا وقف خسارة ولا جني أرباح — الاتنين مُقاسين: يزيدوا الخسارة."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 744,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1105:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1106:13", children: "مهام عطلة الجمعة والسبت (التحليل المستقل):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 751,
            columnNumber: 13
          }, this),
          "تُستغل عطلة الجمعة والسبت في تشغيل العمليات التحليلية غير الحية دون تعارض مع التداول:",
          /* @__PURE__ */ jsxDEV("ul", { className: "list-disc pr-4 mt-1 space-y-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1108:13", children: [
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1109:15", children: "إصدار التقرير الأسبوعي الشامل للمحفظة." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 754,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1110:15", children: "فحص مؤشر الألفا (Alpha) ومقارنة الأداء بـ EGX30." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 755,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1111:15", children: "مراجعة وتحديث قائمة أسهم الشريعة (كل 6 شهور)." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 756,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 753,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 750,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 743,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 738,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:1118:7", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-end gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1119:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-56", "data-tsd-source": "/src/routes/scalp-dip.tsx:1120:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:1121:13", children: "💰 رأس المال المتاح للتداول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 766,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mb-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1122:13", children: "يُحسب عدد المراكز تلقائيًا: TOP_N = رأس المال ÷ 20,000 (من 1 إلى 5 مراكز — الإعداد المدروس N5: أفضل توازن عائد/اتساق مقاس). فوق 100 ألف يزيد حجم المركز الواحد." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 767,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 items-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:1125:13", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "number", min: 1, step: 1e3, value: capitalInput, onChange: (e) => setCapitalInput(e.target.value), placeholder: "مثال: 100000", className: "w-40 rounded-xl border bg-background px-3 py-1.5 text-sm font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1126:15" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 771,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: onSaveCapital, disabled: savingCap, className: "rounded-xl px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:1135:15", children: savingCap ? "جاري الحفظ…" : "حفظ" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 772,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 770,
          columnNumber: 13
        }, this),
        capMsg && /* @__PURE__ */ jsxDEV("div", { className: "mt-1 text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:1143:24", children: capMsg }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 776,
          columnNumber: 24
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 765,
        columnNumber: 11
      }, this),
      sizing && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-2 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:1146:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1147:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1148:17", children: "رأس المال الفعّال" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 780,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1149:17", children: [
            Math.round(sizing.total_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 781,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 779,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1151:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1152:17", children: "عدد المراكز (TOP_N)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 784,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1153:17", children: sizing.top_n }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 785,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 783,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1155:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1156:17", children: "حجم المركز (SLOT)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 788,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1157:17", children: [
            Math.round(sizing.slot_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 789,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 787,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 778,
        columnNumber: 22
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 764,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 763,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1165:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1166:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1167:11", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1168:13", children: "📜 سجل القرارات والتنبيهات الموثق (Decision Audit Log)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 799,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1169:13", children: "سجل دائم ومؤرخ بالثانية لكل إشارة صدرت، كل إنذار طوارئ، ورد فعل المستخدم لتوثيق الأداء تاريخياً." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 800,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 798,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 797,
        columnNumber: 9
      }, this),
      auditLogs.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto max-h-60", "data-tsd-source": "/src/routes/scalp-dip.tsx:1176:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1177:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground sticky top-0", "data-tsd-source": "/src/routes/scalp-dip.tsx:1178:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1179:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1180:19", children: "التوقيت" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 810,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1181:19", children: "نوع الحدث" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 811,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1182:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 812,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1183:19", children: "السعر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 813,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1184:19", children: "تصرف المستخدم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 814,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 809,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 808,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1187:15", children: auditLogs.map((log) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15", "data-tsd-source": "/src/routes/scalp-dip.tsx:1189:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono text-[10px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1190:21", children: log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : "—" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 819,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1193:21", children: [
            log.event_type === "USER_BOUGHT" && /* @__PURE__ */ jsxDEV("span", { className: "text-bull", "data-tsd-source": "/src/routes/scalp-dip.tsx:1194:60", children: "🛒 تأكيد شراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 823,
              columnNumber: 60
            }, this),
            log.event_type === "USER_SOLD" && /* @__PURE__ */ jsxDEV("span", { className: "text-primary", "data-tsd-source": "/src/routes/scalp-dip.tsx:1195:58", children: "💰 تأكيد بيع" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 824,
              columnNumber: 58
            }, this),
            log.event_type === "EMERGENCY_STOP_LOSS" && /* @__PURE__ */ jsxDEV("span", { className: "text-bear font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1196:68", children: "🚨 إنذار وقف خسارة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 825,
              columnNumber: 68
            }, this),
            log.event_type === "SIGNAL_10AM" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1197:60", children: "🎯 إشارة 10:00 صباحاً" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 826,
              columnNumber: 60
            }, this),
            log.event_type === "SCHEDULED_EXIT" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1198:63", children: "📅 خروج أسبوعي مجدول" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
              lineNumber: 827,
              columnNumber: 63
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 822,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1200:21", children: log.symbol }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 829,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1201:21", children: [
            log.trigger_price ? fmtPrice(Number(log.trigger_price)) : "—",
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 830,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1202:21", children: /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-muted", "data-tsd-source": "/src/routes/scalp-dip.tsx:1203:23", children: log.user_action }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 832,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
            lineNumber: 831,
            columnNumber: 21
          }, this)
        ] }, log.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 818,
          columnNumber: 41
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 817,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 807,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 806,
        columnNumber: 33
      }, this) : /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1213:11", children: "لا توجد سجلات قرارات سابقة بعد. كل نقرة شراء أو بيع أو تنبيه طوارئ ستُوثق هنا تلقائياً." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 839,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 796,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border border-warn/40 bg-warn/10 p-4 space-y-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1220:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:1221:9", children: "📋 الأداء المُقاس (شريعة فقط — باك-تست صادق 512 أسبوع 2016-2026، تكلفة ثاندر 0.05%)" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 846,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1222:9", children: [
        /* @__PURE__ */ jsxDEV(StatCard, { label: "النظام الحالي (آخر 90 يوم)", value: `~${CURRENT_REGIME_WEEKLY_LOW_EGP.toLocaleString()}-${CURRENT_REGIME_WEEKLY_HIGH_EGP.toLocaleString()} ج.م`, tone: "bull", sub: "أفضل فترة في العقد — ليس حقاً مكتسباً", "data-tsd-source": "/src/routes/scalp-dip.tsx:1223:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 848,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "المتوسط الطويل الموثوق (10 سنين)", value: `${BACKTEST_WEEKLY_EGP.toLocaleString()} ج.م`, tone: "default", sub: `فاصل ثقة 95%: ${BACKTEST_WEEKLY_EGP_LOW.toLocaleString()}-${BACKTEST_WEEKLY_EGP_HIGH.toLocaleString()}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1224:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 849,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أسوأ أسبوع (10 سنين)", value: `${BACKTEST_WORST_WEEK_PCT.toLocaleString()}%`, tone: "bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:1225:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 850,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أقصى تراجع (10 سنين)", value: `${BACKTEST_MAXDD_PCT.toLocaleString()}%`, tone: "bear", sub: "مع الحمايات التلقائية: ~27-30%", "data-tsd-source": "/src/routes/scalp-dip.tsx:1226:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 851,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 847,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-border/50 bg-card/60 p-2.5 text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1228:9", children: [
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1229:11", children: "شكل الأسابيع الحقيقي (مقاس):" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 854,
          columnNumber: 11
        }, this),
        " ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 — أغلب الأسابيع صغيرة أو سالبة والمتوسط بيتحقق من قفزات نادرة (زي +21,500 و+34,900 في يونيو/يوليو 2026) لا يمكن توقيتها.",
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1231:11", children: " ولا يوجد وعد بربح ثابت — مرفوض من كل الأطراف." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
          lineNumber: 856,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 853,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1233:9", children: BACKTEST_DISCLAIMER_AR }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
        lineNumber: 858,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 845,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "text-center py-4 text-xs text-muted-foreground border-t", "data-tsd-source": "/src/routes/scalp-dip.tsx:1237:7", children: "قواعد فلاتر الاستراتيجية ومعادلاتها مجمدة لمدة 4-6 أسابيع للاختبار والمراقبة الصارمة." }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
      lineNumber: 862,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup",
    lineNumber: 396,
    columnNumber: 10
  }, this);
}
_s(ScalpDipOperationalPage, "yhgpTxvPB39tGbXDNqn7U+mTBrA=", false, function() {
  return [useServerFn, useServerFn, useServerFn, useServerFn, useQuery];
});
_c2 = ScalpDipOperationalPage;
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
    RefreshRuntime.registerExportsForReactRefresh("D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tss-serverfn-lookup " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QXhGLCtCQUFBd0YsZUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQW1PO0FBQUEsUUFDbk8sd0ZBQUE5RixvQkFBQThGLGVBQUEsZ0RBQUE3Rix3QkFBQTZGLGVBQUEsS0FBQTVGLHlCQUFBNEYsZUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQWlQO0FBQUEsUUFDalAsNEVBQUEzRix3QkFBQTJGLGVBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxlQUFvSDtBQUFBLFFBQ3BILDRFQUFBMUYsbUJBQUEwRixlQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBb0o7QUFBQSxXQUpwSjtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBS0E7QUFBQSxNQUNBLHVNQUNBO0FBQUEsNEhBQXdDLDRDQUF4QztBQUFBO0FBQUE7QUFBQTtBQUFBLGVBQXdDO0FBQUE7QUFBQSxRQUV4QyxvSEFBd0MsOERBQXhDO0FBQUE7QUFBQTtBQUFBO0FBQUEsZUFBd0M7QUFBQSxXQUh4QztBQUFBO0FBQUE7QUFBQTtBQUFBLGFBSUE7QUFBQSxNQUNBLGlKQUFvRS9GLG9DQUFwRTtBQUFBO0FBQUE7QUFBQTtBQUFBLGFBQW9FO0FBQUEsU0FicEU7QUFBQTtBQUFBO0FBQUE7QUFBQSxXQWNBO0FBQUEsSUFHQSxnS0FBaUYscUdBQWpGO0FBQUE7QUFBQTtBQUFBO0FBQUEsV0FFQTtBQUFBLE9BMWxCQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBMmxCQTtBQUVBO0FBQUE2QyxHQWg0QkF6QjtBQUFBQSxVQUNBM0IsYUFDQUEsYUFDQUEsYUFDQUEsYUFFQUMsUUFBQTtBQUFBO0FBQUEsTUFOQTBCO0FBQUFBO0FBQUFBO0FBQUFBIiwibmFtZXMiOlsiY3JlYXRlRmlsZVJvdXRlIiwiY3JlYXRlU2VydmVyRm4iLCJ1c2VTZXJ2ZXJGbiIsInVzZVF1ZXJ5IiwidXNlU3RhdGUiLCJ1c2VFZmZlY3QiLCJ1c2VSZWYiLCJmbXRQcmljZSIsIkRhdGFGcmVzaG5lc3NCYW5uZXIiLCJCQUNLVEVTVF9ESVNDTEFJTUVSX0FSIiwiQkFDS1RFU1RfV0VFS0xZX0VHUCIsIkJBQ0tURVNUX1dFRUtMWV9FR1BfTE9XIiwiQkFDS1RFU1RfV0VFS0xZX0VHUF9ISUdIIiwiQkFDS1RFU1RfV09SU1RfV0VFS19QQ1QiLCJCQUNLVEVTVF9NQVhERF9QQ1QiLCJDVVJSRU5UX1JFR0lNRV9XRUVLTFlfTE9XX0VHUCIsIkNVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUCIsInBsYXlTaWduYWxDaGltZSIsInBsYXlFbWVyZ2VuY3lTaXJlbiIsInBsYXlTY2hlZHVsZWRFeGl0VG9uZSIsImdldFBhZ2VEYXRhIiwibWV0aG9kIiwiaGFuZGxlciIsImNyZWF0ZUNsaWVudFJwYyIsIm1hcmtCb3VnaHRGbiIsIm1hcmtTb2xkRm4iLCJzYXZlQ2FwaXRhbCIsIlJvdXRlIiwiY29tcG9uZW50IiwiU2NhbHBEaXBPcGVyYXRpb25hbFBhZ2UiLCJlcnJvckNvbXBvbmVudCIsImVycm9yIiwibWVzc2FnZSIsIm5vdEZvdW5kQ29tcG9uZW50IiwiaGVhZCIsIm1ldGEiLCJ0aXRsZSIsIm5hbWUiLCJjb250ZW50IiwiZm10RGF0ZSIsImlzbyIsInNsaWNlIiwidHJhY2tTdGF0dXMiLCJzIiwic29sZCIsImxhYmVsIiwiY2xzIiwic2VsbF9zaWduYWwiLCJib3VnaHQiLCJTdGF0Q2FyZCIsInZhbHVlIiwic3ViIiwidG9uZSIsIl9jIiwiX3MiLCJmZXRjaFBhZ2UiLCJzYXZlQ2FwaXRhbEZuIiwibWFya0JvdWdodEZuVWkiLCJtYXJrU29sZEZuVWkiLCJkYXRhIiwicmVmZXRjaCIsInF1ZXJ5S2V5IiwicXVlcnlGbiIsInJlZmV0Y2hJbnRlcnZhbCIsInNpemluZyIsInBsYW4iLCJjYXBpdGFsSW5wdXQiLCJzZXRDYXBpdGFsSW5wdXQiLCJTdHJpbmciLCJNYXRoIiwicm91bmQiLCJ0b3RhbF9jYXBpdGFsIiwic2F2aW5nQ2FwIiwic2V0U2F2aW5nQ2FwIiwiY2FwTXNnIiwic2V0Q2FwTXNnIiwiYnVzeVNpZ25hbCIsInNldEJ1c3lTaWduYWwiLCJhY3Rpb25Nc2ciLCJzZXRBY3Rpb25Nc2ciLCJwcmljZU92ZXJyaWRlcyIsInNldFByaWNlT3ZlcnJpZGVzIiwic2Vjb25kc1JlbWFpbmluZyIsInNldFNlY29uZHNSZW1haW5pbmciLCJpc1dpbmRvd0V4cGlyZWQiLCJzZXRJc1dpbmRvd0V4cGlyZWQiLCJpc0JlZm9yZU1hcmtldCIsInNldElzQmVmb3JlTWFya2V0IiwiZHJ5UnVuQWN0aXZlIiwic2V0RHJ5UnVuQWN0aXZlIiwiZHJ5UnVuU2ltdWxhdGlvblRpbWUiLCJzZXREcnlSdW5TaW11bGF0aW9uVGltZSIsInNpcmVuUGxheWVkUmVmIiwiaGFzRW1lcmdlbmN5Iiwib3BlblBvc2l0aW9ucyIsInNvbWUiLCJwIiwiaXNBbm9tYWx5IiwiY3VycmVudCIsInVwZGF0ZUNvdW50ZG93biIsInByZXYiLCJub3ciLCJEYXRlIiwiY2Fpcm9TdHIiLCJ0b0xvY2FsZVN0cmluZyIsInRpbWVab25lIiwiY2Fpcm8iLCJoIiwiZ2V0SG91cnMiLCJtIiwiZ2V0TWludXRlcyIsImdldFNlY29uZHMiLCJzZWNvbmRzU2luY2VNaWRuaWdodCIsIndpbmRvd1N0YXJ0Iiwid2luZG93RHVyYXRpb24iLCJlbGFwc2VkIiwiaW50ZXJ2YWwiLCJzZXRJbnRlcnZhbCIsImNsZWFySW50ZXJ2YWwiLCJkaXNwbGF5U2Vjb25kcyIsIm1tIiwiZmxvb3IiLCJwYWRTdGFydCIsInNzIiwib25TYXZlQ2FwaXRhbCIsInYiLCJOdW1iZXIiLCJpc0Zpbml0ZSIsInIiLCJjYXBpdGFsIiwib2siLCJ0b3BfbiIsInNsb3RfY2FwaXRhbCIsImUiLCJvbkJvdWdodCIsInNpZyIsImlkIiwib3ZlcnJpZGVSYXciLCJwcmljZSIsInVuZGVmaW5lZCIsInNpZ25hbF9pZCIsInN5bWJvbCIsInNpZ25hbCIsImFjdHVhbF9idXlfcHJpY2UiLCJlbnRyeV9wcmljZSIsIm9uU29sZCIsInBubCIsInJlYWxpemVkX3BubCIsInJlYWxpemVkX3BubF9wY3QiLCJ0b0ZpeGVkIiwidG9kYXlTaWduYWxzIiwiYmF0Y2hTY2FuRGF0ZSIsImF1ZGl0TG9ncyIsInNlbGxBbGVydHMiLCJ0b3RhbE9wZW5QbmxFZ3AiLCJyZWR1Y2UiLCJzdW0iLCJwbmxFZ3AiLCJzaW11bGF0ZWRDYW5kaWRhdGVzIiwic2Nhbl9kYXRlIiwiZ2FwX3BjdCIsInBvc2l0aW9uX3ZhbHVlIiwic2ltdWxhdGVkUG9zaXRpb25zIiwiYnV5X3RpbWVzdGFtcCIsImJpZF9kZXB0aF9hdF9lbnRyeSIsImRheTFfc3RhdHVzIiwiZGF5MV9wcmljZSIsImRheTJfc3RhdHVzIiwiZGF5Ml9wcmljZSIsImRheTNfc3RhdHVzIiwiZGF5M19wcmljZSIsImV4aXRfcmVhc29uIiwiYmlkX2NvbmZpcm1lZF9hdF9leGl0IiwiZXh0cmFfaG9sZF91c2VkIiwic2hhZG93X2V4aXRfcHJpY2UiLCJzaGFkb3dfcG5sIiwic2hhZG93X3BubF9wY3QiLCJhY3R1YWxfc2VsbF9wcmljZSIsInNlbGxfdGltZXN0YW1wIiwic2VsbF9zaWduYWxfcmVhc29uIiwiY3JlYXRlZF9hdCIsInVwZGF0ZWRfYXQiLCJjdXJyZW50UHJpY2UiLCJwbmxQY3QiLCJkYXlzSGVsZCIsImRheXNSZW1haW5pbmciLCJleGl0RGF0ZSIsImV4aXREYXlOYW1lIiwiaXNTY2hlZHVsZWRFeGl0Iiwic2hhcmVzIiwiYWN0aXZlQ2FuZGlkYXRlc0xpc3QiLCJhY3RpdmVPcGVuUG9zaXRpb25zTGlzdCIsImVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMiLCJmaWx0ZXIiLCJzY2hlZHVsZWRFeGl0UG9zaXRpb25zIiwiZmV0Y2giLCJqIiwianNvbiIsImNvbnNvbGUiLCJsb2ciLCJjYXRjaHVwIiwibGVuZ3RoIiwibWFwIiwiX2hhbGFsIiwidGFyZ2V0Iiwic3QiLCJfYmFuZExvIiwiX2JhbmRIaSIsImxpdmVQcmljZSIsImxpdmVQY3QiLCJwb3MiLCJwcm9ncmVzc1BjdCIsIm1pbiIsIndpZHRoIiwicmVwbGFjZSIsImV2ZW50X3R5cGUiLCJ0cmlnZ2VyX3ByaWNlIiwidXNlcl9hY3Rpb24iXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZXMiOlsic2NhbHAtZGlwLnRzeCJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBjcmVhdGVGaWxlUm91dGUgfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXJvdXRlclwiO1xyXG5pbXBvcnQgeyBjcmVhdGVTZXJ2ZXJGbiwgdXNlU2VydmVyRm4gfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXN0YXJ0XCI7XHJcbmltcG9ydCB7IHVzZVF1ZXJ5IH0gZnJvbSBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiO1xyXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tIFwicmVhY3RcIjtcclxuaW1wb3J0IHsgc3VwYWJhc2VBZG1pbiB9IGZyb20gXCJAL2ludGVncmF0aW9ucy9zdXBhYmFzZS9jbGllbnQuc2VydmVyXCI7XHJcbmltcG9ydCB7IGZtdFByaWNlIH0gZnJvbSBcIkAvbGliL2Zvcm1hdC9wcmljZVwiO1xyXG5pbXBvcnQgeyBEYXRhRnJlc2huZXNzQmFubmVyIH0gZnJvbSBcIkAvY29tcG9uZW50cy9kYXRhLWZyZXNobmVzcy1iYW5uZXJcIjtcclxuaW1wb3J0IHtcclxuICBHQVBfUEFSQU1TLFxyXG4gIEJBQ0tURVNUX0RJU0NMQUlNRVJfQVIsXHJcbiAgQkFDS1RFU1RfV0VFS0xZX0VHUCxcclxuICBCQUNLVEVTVF9XRUVLTFlfRUdQX0xPVyxcclxuICBCQUNLVEVTVF9XRUVLTFlfRUdQX0hJR0gsXHJcbiAgQkFDS1RFU1RfV09SU1RfV0VFS19QQ1QsXHJcbiAgQkFDS1RFU1RfTUFYRERfUENULFxyXG4gIENVUlJFTlRfUkVHSU1FX1dFRUtMWV9MT1dfRUdQLFxyXG4gIENVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUCxcclxuICBzY2FuRGFpbHlDYW5kaWRhdGVzLFxyXG4gIHRyYWRpbmdEYXlzRWxhcHNlZCxcclxuICBsaXZlU3ltYm9sU3RhdGUsXHJcbiAgdHlwZSBDYW5kaWRhdGUsXHJcbn0gZnJvbSBcIkAvbGliL3NjYWxwLWRpcC9tb21lbnR1bS13ZWVrbHkuc2VydmVyXCI7XHJcbmltcG9ydCB7IGdldEhhbGFsU2V0IH0gZnJvbSBcIkAvbGliL3NjYWxwLWRpcC9oYWxhbC1saXN0LnNlcnZlclwiO1xyXG5pbXBvcnQge1xyXG4gIG1hcmtXZWVrbHlCb3VnaHQsXHJcbiAgbWFya1dlZWtseVNvbGQsXHJcbiAgZ2V0UmVjZW50QXVkaXRMb2dzLFxyXG4gIHR5cGUgU2lnbmFsUm93LFxyXG4gIHR5cGUgRGVjaXNpb25BdWRpdFJvdyxcclxufSBmcm9tIFwiQC9saWIvc2NhbHAtZGlwL3NjYWxwLWRpcC1zaWduYWxzLnNlcnZlclwiO1xyXG5pbXBvcnQge1xyXG4gIHBsYXlTaWduYWxDaGltZSxcclxuICBwbGF5RW1lcmdlbmN5U2lyZW4sXHJcbiAgcGxheVNjaGVkdWxlZEV4aXRUb25lLFxyXG59IGZyb20gXCJAL2xpYi9zY2FscC1kaXAvb3BlcmF0aW9uYWwtYXVkaW9cIjtcclxuXHJcbi8qKlxyXG4gKiAvc2NhbHAtZGlwIC0gXCLYutix2YHYqSDYp9mE2LnZhdmE2YrYp9iqIOKAlCDYp9mE2YXZiNmF2YbYqtmFINin2YTYo9iz2KjZiNi52Yog2KfZhNit2YTYp9mEICg1INis2YTYs9in2KrYjCDYr9iu2YjZhCDYp9mE2KPYrdivKVwiXHJcbiAqIFVuaWZpZWQgT3BlcmF0aW9uYWwgRGFzaGJvYXJkOlxyXG4gKiAxKSAxMDowMCBBTSBxdWFsaWZpZWQgY2FuZGlkYXRlcyB3aXRoIDE1LW1pbnV0ZSBjb3VudGRvd24gZXhlY3V0aW9uIHdpbmRvdy5cclxuICogMikgUmVhbC10aW1lIHRyYWNraW5nIG9mIGJvdWdodCBwb3NpdGlvbnMgd2l0aCA0LWRheSBob2xkaW5nIHByb2dyZXNzaW9uLlxyXG4gKiAzKSBWaXN1YWxseSBhbmQgYWNvdXN0aWNhbGx5IGRpc3RpbmN0IGVtZXJnZW5jeSBhbGVydHMgKGFub21hbHkpICsgd2Vla2x5IGV4aXQgc2NoZWR1bGUuXHJcbiAqIDQpIEV4cGxpY2l0IEVHWCBjYWxlbmRhciBoYW5kbGluZyAoc2tpcHBpbmcgRnJpL1NhdCkuXHJcbiAqIDUpIFBlcm1hbmVudCBEZWNpc2lvbiBBdWRpdCBMb2cuXHJcbiAqIDYpIEZ1bGwgRHJ5IFJ1biBzaW11bGF0aW9uIG1vZGUgZm9yIHRlc3RpbmcuXHJcbiAqL1xyXG5cclxuY29uc3QgU1RSQVRFR1kgPSBcInNjYWxwLWRpcFwiO1xyXG5cclxuY29uc3QgQVJBQklDX0RBWV9OQU1FUyA9IFtcItin2YTYo9it2K9cIiwgXCLYp9mE2KfYq9mG2YrZhlwiLCBcItin2YTYq9mE2KfYq9in2KFcIiwgXCLYp9mE2KPYsdio2LnYp9ihXCIsIFwi2KfZhNiu2YXZitizXCIsIFwi2KfZhNis2YXYudipXCIsIFwi2KfZhNiz2KjYqlwiXTtcclxuXHJcbi8qKiBtb21lbnR1bV93ZWVrbHlfc2lnbmFscyByb3cg4oaSIFNpZ25hbFJvdy1jb21wYXRpYmxlIHNoYXBlIGZvciB0aGUgVUlcclxuICogKGVudHJ5IHJlZmVyZW5jZSA9IGFjdHVhbCBidXkgcHJpY2Ugb25jZSBmaWxsZWQsIGVsc2UgdGhlIHNpZ25hbCBjbG9zZSkuICovXHJcbmZ1bmN0aW9uIHdlZWtseVJvd1RvU2lnbmFsKHI6IGFueSk6IFNpZ25hbFJvdyB7XHJcbiAgY29uc3QgYnV5ID0gci5hY3R1YWxfYnV5X3ByaWNlICE9IG51bGwgPyBOdW1iZXIoci5hY3R1YWxfYnV5X3ByaWNlKSA6IG51bGw7XHJcbiAgY29uc3QgbGFzdENsb3NlID0gTnVtYmVyKHIubGFzdF9jbG9zZSk7XHJcbiAgcmV0dXJuIHtcclxuICAgIGlkOiBOdW1iZXIoci5pZCksXHJcbiAgICBzY2FuX2RhdGU6IFN0cmluZyhyLnNjYW5fZGF0ZSksXHJcbiAgICBzeW1ib2w6IFN0cmluZyhyLnN5bWJvbCkudG9VcHBlckNhc2UoKSxcclxuICAgIGVudHJ5X3ByaWNlOiBidXkgPz8gbGFzdENsb3NlLFxyXG4gICAgZ2FwX3BjdDogYnV5ICE9IG51bGwgJiYgbGFzdENsb3NlID4gMCA/IGJ1eSAvIGxhc3RDbG9zZSAtIDEgOiAwLFxyXG4gICAgYmlkX2RlcHRoX2F0X2VudHJ5OiAwLFxyXG4gICAgcG9zaXRpb25fdmFsdWU6IE51bWJlcihyLnBvc2l0aW9uX3ZhbHVlKSB8fCAwLFxyXG4gICAgYm91Z2h0OiAhIXIuYm91Z2h0LFxyXG4gICAgYWN0dWFsX2J1eV9wcmljZTogYnV5LFxyXG4gICAgYnV5X3RpbWVzdGFtcDogci5idXlfdGltZXN0YW1wID8/IG51bGwsXHJcbiAgICBkYXkxX3N0YXR1czogbnVsbCxcclxuICAgIGRheTFfcHJpY2U6IG51bGwsXHJcbiAgICBkYXkyX3N0YXR1czogbnVsbCxcclxuICAgIGRheTJfcHJpY2U6IG51bGwsXHJcbiAgICBkYXkzX3N0YXR1czogbnVsbCxcclxuICAgIGRheTNfcHJpY2U6IG51bGwsXHJcbiAgICBleGl0X3JlYXNvbjogci5leGl0X3JlYXNvbiA/PyBudWxsLFxyXG4gICAgYmlkX2NvbmZpcm1lZF9hdF9leGl0OiBudWxsLFxyXG4gICAgZXh0cmFfaG9sZF91c2VkOiBmYWxzZSxcclxuICAgIHNoYWRvd19leGl0X3ByaWNlOiBudWxsLFxyXG4gICAgc2hhZG93X3BubDogbnVsbCxcclxuICAgIHNoYWRvd19wbmxfcGN0OiBudWxsLFxyXG4gICAgc29sZDogISFyLnNvbGQsXHJcbiAgICBhY3R1YWxfc2VsbF9wcmljZTogci5hY3R1YWxfc2VsbF9wcmljZSAhPSBudWxsID8gTnVtYmVyKHIuYWN0dWFsX3NlbGxfcHJpY2UpIDogbnVsbCxcclxuICAgIHNlbGxfdGltZXN0YW1wOiByLnNlbGxfdGltZXN0YW1wID8/IG51bGwsXHJcbiAgICByZWFsaXplZF9wbmw6IHIucmVhbGl6ZWRfcG5sICE9IG51bGwgPyBOdW1iZXIoci5yZWFsaXplZF9wbmwpIDogbnVsbCxcclxuICAgIHJlYWxpemVkX3BubF9wY3Q6IHIucmVhbGl6ZWRfcG5sX3BjdCAhPSBudWxsID8gTnVtYmVyKHIucmVhbGl6ZWRfcG5sX3BjdCkgOiBudWxsLFxyXG4gICAgc2VsbF9zaWduYWw6IGZhbHNlLFxyXG4gICAgc2VsbF9zaWduYWxfcmVhc29uOiBudWxsLFxyXG4gICAgY3JlYXRlZF9hdDogci5jcmVhdGVkX2F0ID8/IG51bGwsXHJcbiAgICB1cGRhdGVkX2F0OiByLnVwZGF0ZWRfYXQgPz8gbnVsbCxcclxuICB9O1xyXG59XHJcblxyXG50eXBlIFRyYWRlID0ge1xyXG4gIGlkOiBzdHJpbmc7XHJcbiAgc3ltYm9sOiBzdHJpbmc7XHJcbiAgZW50cnlfcHJpY2U6IG51bWJlcjtcclxuICBlbnRyeV90czogc3RyaW5nO1xyXG4gIGV4aXRfcHJpY2U6IG51bWJlciB8IG51bGw7XHJcbiAgZXhpdF90czogc3RyaW5nIHwgbnVsbDtcclxuICBleGl0X3JlYXNvbjogc3RyaW5nIHwgbnVsbDtcclxuICBwbmw6IG51bWJlciB8IG51bGw7XHJcbiAgcG5sX3BjdDogbnVtYmVyIHwgbnVsbDtcclxuICBzdGF0dXM6IHN0cmluZztcclxuICB0cmFkZV9kYXRlOiBzdHJpbmc7XHJcbiAgY2FwaXRhbDogbnVtYmVyO1xyXG59O1xyXG5cclxuZXhwb3J0IHR5cGUgRW5yaWNoZWRQb3NpdGlvbiA9IFNpZ25hbFJvdyAmIHtcclxuICBjdXJyZW50UHJpY2U6IG51bWJlcjtcclxuICBwbmxFZ3A6IG51bWJlcjtcclxuICBwbmxQY3Q6IG51bWJlcjtcclxuICBkYXlzSGVsZDogbnVtYmVyO1xyXG4gIGRheXNSZW1haW5pbmc6IG51bWJlcjtcclxuICBleGl0RGF0ZTogc3RyaW5nO1xyXG4gIGV4aXREYXlOYW1lOiBzdHJpbmc7XHJcbiAgaXNTY2hlZHVsZWRFeGl0OiBib29sZWFuO1xyXG4gIGlzQW5vbWFseTogYm9vbGVhbjtcclxuICBzaGFyZXM6IG51bWJlcjtcclxufTtcclxuXHJcbi8qKiBPbmUgc2NhbHBfZGlwX3NpZ25hbHMgcm93ICh0aGUgbGF0ZXN0IHdlZWtseSBiYXRjaCkgd2l0aCBpdHMgTElWRSBwcmljZVxyXG4gKiBmcm9tIGxpdmVTeW1ib2xTdGF0ZSDigJQgdGhlIGxpdmUtdHJhY2tpbmcgc2VjdGlvbidzIGRhdGEgc2hhcGUuIGxpdmVQY3QgaXNcclxuICogbGl2ZSB2cyB0aGUgbm9taW5hdGlvbiBwcmljZSAoZW50cnlfcHJpY2UpOyBudWxsIHdoZW4gbm8gbGl2ZSBmZWVkLiAqL1xyXG5leHBvcnQgdHlwZSBMaXZlVHJhY2tlZFNpZ25hbCA9IFNpZ25hbFJvdyAmIHtcclxuICBfaGFsYWw6IGJvb2xlYW47XHJcbiAgbGl2ZVByaWNlOiBudW1iZXIgfCBudWxsO1xyXG4gIGxpdmVUczogc3RyaW5nIHwgbnVsbDtcclxuICBsaXZlUGN0OiBudW1iZXIgfCBudWxsO1xyXG4gIGJhdGNoU2NhbkRhdGU6IHN0cmluZztcclxuICBfYmFuZExvOiBudW1iZXIgfCBudWxsO1xyXG4gIF9iYW5kSGk6IG51bWJlciB8IG51bGw7XHJcbn07XHJcblxyXG5jb25zdCBnZXRQYWdlRGF0YSA9IGNyZWF0ZVNlcnZlckZuKHsgbWV0aG9kOiBcIkdFVFwiIH0pLmhhbmRsZXIoYXN5bmMgKCkgPT4ge1xyXG4gIGNvbnN0IHBsYW4gPSBhd2FpdCBzY2FuRGFpbHlDYW5kaWRhdGVzKCk7XHJcbiAgY29uc3QgdG9kYXkgPSBwbGFuLnNjYW5EYXRlO1xyXG5cclxuICAvLyAxKSBQYXBlciB0cmFkZXMgaGlzdG9yeVxyXG4gIGNvbnN0IHsgZGF0YTogdHJhZGVzIH0gPSBhd2FpdCBzdXBhYmFzZUFkbWluXHJcbiAgICAuZnJvbShcInBhcGVyX3RyYWRlc1wiKVxyXG4gICAgLnNlbGVjdChcImlkLCBzeW1ib2wsIGVudHJ5X3ByaWNlLCBlbnRyeV90cywgZXhpdF9wcmljZSwgZXhpdF90cywgZXhpdF9yZWFzb24sIHBubCwgcG5sX3BjdCwgc3RhdHVzLCB0cmFkZV9kYXRlLCBjYXBpdGFsXCIpXHJcbiAgICAuZXEoXCJzdHJhdGVneVwiLCBTVFJBVEVHWSlcclxuICAgIC5vcmRlcihcImVudHJ5X3RzXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxyXG4gICAgLmxpbWl0KDIwMCk7XHJcblxyXG4gIC8vIDIpIExhdGVzdCBXRUVLTFkgYmF0Y2ggKG1vbWVudHVtX3dlZWtseV9zaWduYWxzIOKAlCB0aGUgd2Vla2x5IGdhdGUncyBvd25cclxuICAvLyB0YWJsZSkgKyBMSVZFIHRyYWNraW5nIHBlciByb3c6IHJlZmVyZW5jZSA9IGFjdHVhbCBidXkgcHJpY2Ugb25jZSBmaWxsZWQsXHJcbiAgLy8gZWxzZSB0aGUgc2lnbmFsLXNlc3Npb24gY2xvc2U7IGxpdmUgcHJpY2Ug4oaQIGxpdmUgJS4gVGhlIGJhdGNoIGlzIHRoZVxyXG4gIC8vIG5ld2VzdCBzY2FuX2RhdGUgcHJlc2VudCwgc28gU3VuZGF5J3MgcGlja3Mgc3RheSB0cmFja2VkIGFsbCB3ZWVrLlxyXG4gIC8vICh0YWJsZSBub3QgaW4gZ2VuZXJhdGVkIHR5cGVzIHlldCDigJQgc2FtZSBlc2NhcGUgaGF0Y2ggYXMgdGhlIHJ1bm5lcilcclxuICBjb25zdCB3ZGIgPSBzdXBhYmFzZUFkbWluIGFzIGFueTtcclxuICBjb25zdCB7IGRhdGE6IHdlZWtseUJhdGNoUm93cyB9ID0gYXdhaXQgd2RiXHJcbiAgICAuZnJvbShcIm1vbWVudHVtX3dlZWtseV9zaWduYWxzXCIpXHJcbiAgICAuc2VsZWN0KFwiKlwiKVxyXG4gICAgLm9yZGVyKFwic2Nhbl9kYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxyXG4gICAgLm9yZGVyKFwicG9zaXRpb25fdmFsdWVcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAubGltaXQoODApO1xyXG5cclxuICBjb25zdCBiYXRjaFNjYW5EYXRlID0gd2Vla2x5QmF0Y2hSb3dzPy5sZW5ndGggPyBTdHJpbmcod2Vla2x5QmF0Y2hSb3dzWzBdLnNjYW5fZGF0ZSkgOiB0b2RheTtcclxuICBjb25zdCBiYXRjaFNpZ25hbHMgPSAod2Vla2x5QmF0Y2hSb3dzID8/IFtdKS5maWx0ZXIoKHI6IGFueSkgPT4gU3RyaW5nKHIuc2Nhbl9kYXRlKSA9PT0gYmF0Y2hTY2FuRGF0ZSk7XHJcbiAgY29uc3QgbGl2ZUNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIEF3YWl0ZWQ8UmV0dXJuVHlwZTx0eXBlb2YgbGl2ZVN5bWJvbFN0YXRlPj4+KCk7XHJcbiAgY29uc3QgbGl2ZVRyYWNrZWQ6IExpdmVUcmFja2VkU2lnbmFsW10gPSBbXTtcclxuICBmb3IgKGNvbnN0IHIgb2YgYmF0Y2hTaWduYWxzKSB7XHJcbiAgICBjb25zdCByb3cgPSB3ZWVrbHlSb3dUb1NpZ25hbChyKTtcclxuICAgIGNvbnN0IHN5bSA9IHJvdy5zeW1ib2w7XHJcbiAgICBsZXQgc3QgPSBsaXZlQ2FjaGUuZ2V0KHN5bSk7XHJcbiAgICBpZiAoIXN0KSB7XHJcbiAgICAgIHN0ID0gYXdhaXQgbGl2ZVN5bWJvbFN0YXRlKHN5bSk7XHJcbiAgICAgIGxpdmVDYWNoZS5zZXQoc3ltLCBzdCk7XHJcbiAgICB9XHJcbiAgICBjb25zdCBlbnRyeSA9IHJvdy5lbnRyeV9wcmljZTtcclxuICAgIGNvbnN0IHJlZkNsb3NlID0gTnVtYmVyKChyIGFzIGFueSkubGFzdF9jbG9zZSkgPiAwID8gTnVtYmVyKChyIGFzIGFueSkubGFzdF9jbG9zZSkgOiBudWxsO1xyXG4gICAgbGl2ZVRyYWNrZWQucHVzaCh7XHJcbiAgICAgIC4uLnJvdyxcclxuICAgICAgX2hhbGFsOiBnZXRIYWxhbFNldCgpLmhhcyhzeW0pLFxyXG4gICAgICBsaXZlUHJpY2U6IHN0LnByaWNlLFxyXG4gICAgICBsaXZlVHM6IHN0LnRzLFxyXG4gICAgICBsaXZlUGN0OiBzdC5wcmljZSAhPSBudWxsICYmIGVudHJ5ID4gMCA/IHN0LnByaWNlIC8gZW50cnkgLSAxIDogbnVsbCxcclxuICAgICAgYmF0Y2hTY2FuRGF0ZSxcclxuICAgICAgX2JhbmRMbzogcmVmQ2xvc2UgIT0gbnVsbCA/IHJlZkNsb3NlICogMC45NyA6IG51bGwsIC8vIGdhcCBiYW5kIC0zJS4uKzIlIChkZXNpZ24gY29uc3RhbnRzKVxyXG4gICAgICBfYmFuZEhpOiByZWZDbG9zZSAhPSBudWxsID8gcmVmQ2xvc2UgKiAxLjAyIDogbnVsbCxcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgLy8gMykgT3BlbiBib3VnaHQgcG9zaXRpb25zIChhY3RpdmUgcmVhbC10cmFja2luZykg4oCUIHdlZWtseSB0YWJsZTsgcm93c1xyXG4gIC8vIGNhcnJ5IHRoZWlyIG93biBlbnRyeV9kYXRlL2V4aXRfZGF0ZSAoZXhpdCA9IG5leHQgd2VlaydzIGZpcnN0IHNlc3Npb24pLlxyXG4gIGNvbnN0IHsgZGF0YTogb3BlblNpZ25hbHMgfSA9IGF3YWl0IHdkYlxyXG4gICAgLmZyb20oXCJtb21lbnR1bV93ZWVrbHlfc2lnbmFsc1wiKVxyXG4gICAgLnNlbGVjdChcIipcIilcclxuICAgIC5lcShcInNlbGVjdGVkXCIsIHRydWUpXHJcbiAgICAuZXEoXCJib3VnaHRcIiwgdHJ1ZSlcclxuICAgIC5lcShcInNvbGRcIiwgZmFsc2UpXHJcbiAgICAub3JkZXIoXCJlbnRyeV9kYXRlXCIsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KTtcclxuXHJcbiAgY29uc3QgZW5yaWNoZWRPcGVuOiBFbnJpY2hlZFBvc2l0aW9uW10gPSBhd2FpdCBQcm9taXNlLmFsbChcclxuICAgIChvcGVuU2lnbmFscyA/PyBbXSkubWFwKGFzeW5jIChyYXc6IGFueSkgPT4ge1xyXG4gICAgICBjb25zdCBzID0gd2Vla2x5Um93VG9TaWduYWwocmF3KTtcclxuICAgICAgY29uc3QgbGl2ZSA9IGF3YWl0IGxpdmVTeW1ib2xTdGF0ZShzLnN5bWJvbCk7XHJcbiAgICAgIGNvbnN0IGJ1eVByaWNlID0gTnVtYmVyKHMuYWN0dWFsX2J1eV9wcmljZSA/PyBzLmVudHJ5X3ByaWNlKTtcclxuICAgICAgY29uc3QgY3VyUHJpY2UgPSBsaXZlLnByaWNlID8/IGJ1eVByaWNlO1xyXG4gICAgICBjb25zdCBzaGFyZXMgPSBOdW1iZXIocmF3LnNoYXJlcykgfHwgTWF0aC5tYXgoMSwgTWF0aC5mbG9vcihOdW1iZXIocy5wb3NpdGlvbl92YWx1ZSkgLyBidXlQcmljZSkpO1xyXG4gICAgICBjb25zdCBwbmxFZ3AgPSAoY3VyUHJpY2UgLSBidXlQcmljZSkgKiBzaGFyZXM7XHJcbiAgICAgIGNvbnN0IHBubFBjdCA9IGJ1eVByaWNlID4gMCA/IChjdXJQcmljZSAtIGJ1eVByaWNlKSAvIGJ1eVByaWNlIDogMDtcclxuICAgICAgY29uc3QgZW50cnlJU08gPSBTdHJpbmcocmF3LmVudHJ5X2RhdGUpO1xyXG4gICAgICBjb25zdCBleGl0SVNPID0gU3RyaW5nKHJhdy5leGl0X2RhdGUpO1xyXG4gICAgICBjb25zdCBkYXlzSGVsZCA9IHRyYWRpbmdEYXlzRWxhcHNlZChlbnRyeUlTTywgdG9kYXkpO1xyXG4gICAgICAvLyBXZWVrbHkgc3lzdGVtOiBOTyBzdG9wLWxvc3MgKG1lYXN1cmVkIG5ldC1uZWdhdGl2ZSBvbiAxMHkpLiBUaGUgb25seVxyXG4gICAgICAvLyBleGl0IGlzIG5leHQgd2VlaydzIGZpcnN0LXNlc3Npb24gb3BlbjsgcHJvdGVjdGlvbnMgc2NhbGUgcG9zaXRpb24gc2l6ZS5cclxuICAgICAgY29uc3QgaXNTY2hlZHVsZWRFeGl0ID0gZGF5c0hlbGQgPj0gNTtcclxuICAgICAgY29uc3QgZXhpdERvdyA9IG5ldyBEYXRlKGAke2V4aXRJU099VDAwOjAwOjAwWmApLmdldFVUQ0RheSgpO1xyXG5cclxuICAgICAgcmV0dXJuIHtcclxuICAgICAgICAuLi5zLFxyXG4gICAgICAgIC8vIHRoZSBvcGVuLXBvc2l0aW9uIGNhcmQgcHJpbnRzIHNjYW5fZGF0ZSBhcyBcItiv2K7ZiNmEXCIg4oCUIGZvciB3ZWVrbHkgcm93c1xyXG4gICAgICAgIC8vIHRoZSBlbnRyeSBzZXNzaW9uIGlzIHRoZSByZWFsIGVudHJ5IGRhdGUsIG5vdCB0aGUgc2lnbmFsIHNlc3Npb25cclxuICAgICAgICBzY2FuX2RhdGU6IGVudHJ5SVNPLFxyXG4gICAgICAgIGN1cnJlbnRQcmljZTogY3VyUHJpY2UsXHJcbiAgICAgICAgcG5sRWdwLFxyXG4gICAgICAgIHBubFBjdCxcclxuICAgICAgICBkYXlzSGVsZCxcclxuICAgICAgICBkYXlzUmVtYWluaW5nOiBNYXRoLm1heCgwLCA1IC0gZGF5c0hlbGQpLFxyXG4gICAgICAgIGV4aXREYXRlOiBleGl0SVNPLFxyXG4gICAgICAgIGV4aXREYXlOYW1lOiBBUkFCSUNfREFZX05BTUVTW2V4aXREb3ddLFxyXG4gICAgICAgIGlzU2NoZWR1bGVkRXhpdCxcclxuICAgICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICAgIHNoYXJlcyxcclxuICAgICAgfSBhcyBFbnJpY2hlZFBvc2l0aW9uO1xyXG4gICAgfSlcclxuICApO1xyXG5cclxuICAvLyA0KSBIaXN0b3JpY2FsIHNpZ25hbHNcclxuICBjb25zdCB7IGRhdGE6IHJlY2VudFNpZ25hbHMgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cclxuICAgIC5mcm9tKFwic2NhbHBfZGlwX3NpZ25hbHNcIilcclxuICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAubHQoXCJzY2FuX2RhdGVcIiwgdG9kYXkpXHJcbiAgICAub3JkZXIoXCJzY2FuX2RhdGVcIiwgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXHJcbiAgICAub3JkZXIoXCJnYXBfcGN0XCIsIHsgYXNjZW5kaW5nOiB0cnVlIH0pXHJcbiAgICAubGltaXQoODApO1xyXG5cclxuICAvLyA1KSBBY3RpdmUgU2VsbCBhbGVydHNcclxuICBjb25zdCB7IGRhdGE6IHNlbGxBbGVydHMgfSA9IGF3YWl0IHN1cGFiYXNlQWRtaW5cclxuICAgIC5mcm9tKFwic2NhbHBfZGlwX3NpZ25hbHNcIilcclxuICAgIC5zZWxlY3QoXCIqXCIpXHJcbiAgICAuZXEoXCJzZWxsX3NpZ25hbFwiLCB0cnVlKVxyXG4gICAgLmVxKFwic29sZFwiLCBmYWxzZSk7XHJcblxyXG4gIC8vIDYpIFJlY2VudCBEZWNpc2lvbiBBdWRpdCBMb2dzXHJcbiAgY29uc3QgYXVkaXRMb2dzID0gYXdhaXQgZ2V0UmVjZW50QXVkaXRMb2dzKDQwKTtcclxuXHJcbiAgcmV0dXJuIHtcclxuICAgIHBsYW4sXHJcbiAgICBoYWxhbExpc3Q6IFsuLi5nZXRIYWxhbFNldCgpXSxcclxuICAgIHRyYWRlczogKHRyYWRlcyA/PyBbXSkgYXMgVHJhZGVbXSxcclxuICAgIHRvZGF5U2lnbmFsczogbGl2ZVRyYWNrZWQsXHJcbiAgICBiYXRjaFNjYW5EYXRlLFxyXG4gICAgb3BlblBvc2l0aW9uczogZW5yaWNoZWRPcGVuLFxyXG4gICAgcmVjZW50U2lnbmFsczogKHJlY2VudFNpZ25hbHMgPz8gW10pIGFzIFNpZ25hbFJvd1tdLFxyXG4gICAgc2VsbEFsZXJ0czogKHNlbGxBbGVydHMgPz8gW10pIGFzIFNpZ25hbFJvd1tdLFxyXG4gICAgYXVkaXRMb2dzOiAoYXVkaXRMb2dzID8/IFtdKSBhcyBEZWNpc2lvbkF1ZGl0Um93W10sXHJcbiAgfTtcclxufSk7XHJcblxyXG4vLyBTZXJ2ZXIgYWN0aW9uc1xyXG5jb25zdCBtYXJrQm91Z2h0Rm4gPSBjcmVhdGVTZXJ2ZXJGbih7IG1ldGhvZDogXCJQT1NUXCIgfSlcclxuICAudmFsaWRhdG9yKChkOiB7IHNpZ25hbF9pZDogbnVtYmVyOyBwcmljZT86IG51bWJlciB9KSA9PiBkKVxyXG4gIC5oYW5kbGVyKGFzeW5jICh7IGRhdGEgfSkgPT4ge1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgcm93ID0gYXdhaXQgbWFya1dlZWtseUJvdWdodChkYXRhLnNpZ25hbF9pZCwgZGF0YS5wcmljZSk7XHJcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlLCBzaWduYWw6IHJvdyB9O1xyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6IGU/Lm1lc3NhZ2UgPz8gXCJmYWlsZWRcIiB9O1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuY29uc3QgbWFya1NvbGRGbiA9IGNyZWF0ZVNlcnZlckZuKHsgbWV0aG9kOiBcIlBPU1RcIiB9KVxyXG4gIC52YWxpZGF0b3IoKGQ6IHsgc2lnbmFsX2lkOiBudW1iZXI7IHByaWNlPzogbnVtYmVyIH0pID0+IGQpXHJcbiAgLmhhbmRsZXIoYXN5bmMgKHsgZGF0YSB9KSA9PiB7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb25zdCByb3cgPSBhd2FpdCBtYXJrV2Vla2x5U29sZChkYXRhLnNpZ25hbF9pZCwgZGF0YS5wcmljZSk7XHJcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlLCBzaWduYWw6IHJvdyB9O1xyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6IGU/Lm1lc3NhZ2UgPz8gXCJmYWlsZWRcIiB9O1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuY29uc3Qgc2F2ZUNhcGl0YWwgPSBjcmVhdGVTZXJ2ZXJGbih7IG1ldGhvZDogXCJQT1NUXCIgfSlcclxuICAudmFsaWRhdG9yKChkOiB7IGNhcGl0YWw6IG51bWJlciB9KSA9PiAoeyBjYXBpdGFsOiBOdW1iZXIoZC5jYXBpdGFsKSB9KSlcclxuICAuaGFuZGxlcihhc3luYyAoeyBkYXRhIH0pID0+IHtcclxuICAgIGNvbnN0IHsgc2V0VXNlckNhcGl0YWwsIGdldFVzZXJDYXBpdGFsLCBjb21wdXRlU2l6aW5nIH0gPSBhd2FpdCBpbXBvcnQoXHJcbiAgICAgIFwiQC9saWIvc2NhbHAtZGlwL2dhcC1mYWRlLTNkLnNlcnZlclwiXHJcbiAgICApO1xyXG4gICAgaWYgKCFOdW1iZXIuaXNGaW5pdGUoZGF0YS5jYXBpdGFsKSB8fCBkYXRhLmNhcGl0YWwgPD0gMCkge1xyXG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGVycm9yOiBcItij2K/YrtmEINmF2KjZhNi62YvYpyDYtdit2YrYrdmL2Kcg2KPZg9io2LEg2YXZhiDYtdmB2LFcIiB9O1xyXG4gICAgfVxyXG4gICAgYXdhaXQgc2V0VXNlckNhcGl0YWwoZGF0YS5jYXBpdGFsKTtcclxuICAgIGNvbnN0IHNhdmVkID0gYXdhaXQgZ2V0VXNlckNhcGl0YWwoKTtcclxuICAgIHJldHVybiB7IG9rOiB0cnVlLCBzaXppbmc6IGNvbXB1dGVTaXppbmcoc2F2ZWQgPz8gdW5kZWZpbmVkKSB9O1xyXG4gIH0pO1xyXG5cclxuZXhwb3J0IGNvbnN0IFJvdXRlID0gY3JlYXRlRmlsZVJvdXRlKFwiL3NjYWxwLWRpcFwiKSh7XHJcbiAgY29tcG9uZW50OiBTY2FscERpcE9wZXJhdGlvbmFsUGFnZSxcclxuICBlcnJvckNvbXBvbmVudDogKHsgZXJyb3IgfSkgPT4gPGRpdiBjbGFzc05hbWU9XCJwLTYgdGV4dC1kZXN0cnVjdGl2ZVwiPtiu2LfYozoge2Vycm9yLm1lc3NhZ2V9PC9kaXY+LFxyXG4gIG5vdEZvdW5kQ29tcG9uZW50OiAoKSA9PiA8ZGl2IGNsYXNzTmFtZT1cInAtNlwiPti62YrYsSDZhdmI2KzZiNivPC9kaXY+LFxyXG4gIGhlYWQ6ICgpID0+ICh7XHJcbiAgICBtZXRhOiBbXHJcbiAgICAgIHsgdGl0bGU6IFwi2LrYsdmB2Kkg2KfZhNi52YXZhNmK2KfYqiDigJQg2KfZhNmF2YjZhdmG2KrZhSDYp9mE2KPYs9io2YjYudmKICjZgtmF2Kkg2LPZhtmI2YrYqSDYt9in2LLYqSlcIiB9LFxyXG4gICAgICB7XHJcbiAgICAgICAgbmFtZTogXCJkZXNjcmlwdGlvblwiLFxyXG4gICAgICAgIGNvbnRlbnQ6XHJcbiAgICAgICAgICBcItmE2YjYrdipINin2YTYqtit2YPZhSDYp9mE2KPYs9io2YjYudmK2Kk6INiq2LHYtNmK2K3Yp9iqINin2YTYo9it2K8g2YXYuSDYudiv2KfYryDYp9mE2KrZhtmB2YrYsCAxNSDYr9mC2YrZgtip2Iwg2KrYqtio2Lkg2K3ZiiDZhNmE2LXZgdmC2KfYqiDYt9mI2KfZhCDYp9mE2KPYs9io2YjYudiMINil2LTYudin2LHYp9iqINi32YjYp9ix2KYg2LXZiNiq2YrYqSDZiNio2LXYsdmK2KnYjCDZiNiq2YLZiNmK2YUgRUdYINin2YTYtdix2YrYrS5cIixcclxuICAgICAgfSxcclxuICAgIF0sXHJcbiAgfSksXHJcbn0pO1xyXG5cclxuZnVuY3Rpb24gZm10RGF0ZShpc286IHN0cmluZykge1xyXG4gIHJldHVybiBpc28gPyBpc28uc2xpY2UoMCwgMTApIDogXCLigJRcIjtcclxufVxyXG5cclxuZnVuY3Rpb24gdHJhY2tTdGF0dXMoczogTGl2ZVRyYWNrZWRTaWduYWwpOiB7IGxhYmVsOiBzdHJpbmc7IGNsczogc3RyaW5nIH0ge1xyXG4gIGlmIChzLnNvbGQpIHJldHVybiB7IGxhYmVsOiBcItmF2Y/YutmE2YLYqSDigJQg2KjZiti5INmF2LPYrNmEIOKck1wiLCBjbHM6IFwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgfTtcclxuICBpZiAocy5zZWxsX3NpZ25hbCkgcmV0dXJuIHsgbGFiZWw6IFwi2KXYtNin2LHYqSDYqNmK2Lkg2KfZhNii2YYg4pqgXCIsIGNsczogXCJ0ZXh0LWFtYmVyLTQwMFwiIH07XHJcbiAgaWYgKHMuYm91Z2h0KSByZXR1cm4geyBsYWJlbDogXCLZgtmK2K8g2KfZhNmF2KrYp9io2LnYqVwiLCBjbHM6IFwidGV4dC1idWxsXCIgfTtcclxuICByZXR1cm4geyBsYWJlbDogXCLYqNin2YbYqti42KfYsSDYp9mE2KrZhtmB2YrYsFwiLCBjbHM6IFwidGV4dC1mb3JlZ3JvdW5kXCIgfTtcclxufVxyXG5cclxuZnVuY3Rpb24gU3RhdENhcmQoeyBsYWJlbCwgdmFsdWUsIHN1YiwgdG9uZSA9IFwiZGVmYXVsdFwiIH06IHsgbGFiZWw6IHN0cmluZzsgdmFsdWU6IHN0cmluZzsgc3ViPzogc3RyaW5nOyB0b25lPzogXCJkZWZhdWx0XCIgfCBcImJ1bGxcIiB8IFwiYmVhclwiIHwgXCJtdXRlZFwiIHwgXCJ3YXJuXCIgfSkge1xyXG4gIGNvbnN0IGNscyA9XHJcbiAgICB0b25lID09PSBcImJ1bGxcIlxyXG4gICAgICA/IFwidGV4dC1idWxsXCJcclxuICAgICAgOiB0b25lID09PSBcImJlYXJcIlxyXG4gICAgICAgID8gXCJ0ZXh0LWJlYXJcIlxyXG4gICAgICAgIDogdG9uZSA9PT0gXCJ3YXJuXCJcclxuICAgICAgICAgID8gXCJ0ZXh0LWFtYmVyLTQwMFwiXHJcbiAgICAgICAgICA6IHRvbmUgPT09IFwibXV0ZWRcIlxyXG4gICAgICAgICAgICA/IFwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCJcclxuICAgICAgICAgICAgOiBcInRleHQtZm9yZWdyb3VuZFwiO1xyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWNhcmQgYm9yZGVyIHJvdW5kZWQteGwgcC0zIHNoYWRvdy1zbVwiPlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHVwcGVyY2FzZSBmb250LW1lZGl1bSB0cmFja2luZy13aWRlciB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMVwiPntsYWJlbH08L2Rpdj5cclxuICAgICAgPGRpdiBjbGFzc05hbWU9e2B0ZXh0LWxnIGZvbnQtZXh0cmFib2xkIGZvbnQtbW9ubyAke2Nsc31gfT57dmFsdWV9PC9kaXY+XHJcbiAgICAgIHtzdWIgJiYgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMC41XCI+e3N1Yn08L2Rpdj59XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBTY2FscERpcE9wZXJhdGlvbmFsUGFnZSgpIHtcclxuICBjb25zdCBmZXRjaFBhZ2UgPSB1c2VTZXJ2ZXJGbihnZXRQYWdlRGF0YSk7XHJcbiAgY29uc3Qgc2F2ZUNhcGl0YWxGbiA9IHVzZVNlcnZlckZuKHNhdmVDYXBpdGFsKTtcclxuICBjb25zdCBtYXJrQm91Z2h0Rm5VaSA9IHVzZVNlcnZlckZuKG1hcmtCb3VnaHRGbik7XHJcbiAgY29uc3QgbWFya1NvbGRGblVpID0gdXNlU2VydmVyRm4obWFya1NvbGRGbik7XHJcblxyXG4gIGNvbnN0IHsgZGF0YSwgcmVmZXRjaCB9ID0gdXNlUXVlcnkoe1xyXG4gICAgcXVlcnlLZXk6IFtcInNjYWxwLWRpcC1vcGVyYXRpb25hbC1kYXNoYm9hcmRcIl0sXHJcbiAgICBxdWVyeUZuOiAoKSA9PiBmZXRjaFBhZ2UoKSxcclxuICAgIHJlZmV0Y2hJbnRlcnZhbDogMTVfMDAwLFxyXG4gIH0pO1xyXG5cclxuICAvLyBDYXBpdGFsIHNldHRpbmdzIHN0YXRlXHJcbiAgY29uc3Qgc2l6aW5nID0gZGF0YT8ucGxhbj8uc2l6aW5nO1xyXG4gIGNvbnN0IFtjYXBpdGFsSW5wdXQsIHNldENhcGl0YWxJbnB1dF0gPSB1c2VTdGF0ZTxzdHJpbmc+KHNpemluZyA/IFN0cmluZyhNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKSkgOiBcIlwiKTtcclxuICBjb25zdCBbc2F2aW5nQ2FwLCBzZXRTYXZpbmdDYXBdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFtjYXBNc2csIHNldENhcE1zZ10gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGlmIChzaXppbmcgJiYgIWNhcGl0YWxJbnB1dCkgc2V0Q2FwaXRhbElucHV0KFN0cmluZyhNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKSkpO1xyXG4gIH0sIFtzaXppbmc/LnRvdGFsX2NhcGl0YWxdKTtcclxuXHJcbiAgLy8gQWN0aW9uIHN0YXRlc1xyXG4gIGNvbnN0IFtidXN5U2lnbmFsLCBzZXRCdXN5U2lnbmFsXSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xyXG4gIGNvbnN0IFthY3Rpb25Nc2csIHNldEFjdGlvbk1zZ10gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbcHJpY2VPdmVycmlkZXMsIHNldFByaWNlT3ZlcnJpZGVzXSA9IHVzZVN0YXRlPFJlY29yZDxudW1iZXIsIHN0cmluZz4+KHt9KTtcclxuXHJcbiAgLy8gQ291bnRkb3duIHRpbWVyIHN0YXRlICgxNS1taW4gd2luZG93IGZyb20gMTA6MDAgQU0pXHJcbiAgY29uc3QgW3NlY29uZHNSZW1haW5pbmcsIHNldFNlY29uZHNSZW1haW5pbmddID0gdXNlU3RhdGU8bnVtYmVyPigxNSAqIDYwKTtcclxuICBjb25zdCBbaXNXaW5kb3dFeHBpcmVkLCBzZXRJc1dpbmRvd0V4cGlyZWRdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGNvbnN0IFtpc0JlZm9yZU1hcmtldCwgc2V0SXNCZWZvcmVNYXJrZXRdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG5cclxuICAvLyBTaW11bGF0aW9uIChEcnkgUnVuKSBTdGF0ZVxyXG4gIGNvbnN0IFtkcnlSdW5BY3RpdmUsIHNldERyeVJ1bkFjdGl2ZV0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XHJcbiAgY29uc3QgW2RyeVJ1blNpbXVsYXRpb25UaW1lLCBzZXREcnlSdW5TaW11bGF0aW9uVGltZV0gPSB1c2VTdGF0ZTxudW1iZXI+KDEyICogNjAgKyAzNCk7IC8vIDEybSAzNHNcclxuXHJcbiAgY29uc3Qgc2lyZW5QbGF5ZWRSZWYgPSB1c2VSZWY8Ym9vbGVhbj4oZmFsc2UpO1xyXG5cclxuICAvLyBBdWRpbyBBbGVydHMgb24gRW1lcmdlbmN5IGNvbmRpdGlvbnNcclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgaGFzRW1lcmdlbmN5ID0gKGRhdGE/Lm9wZW5Qb3NpdGlvbnMgPz8gW10pLnNvbWUoKHApID0+IHAuaXNBbm9tYWx5KTtcclxuICAgIGlmIChoYXNFbWVyZ2VuY3kgJiYgIXNpcmVuUGxheWVkUmVmLmN1cnJlbnQpIHtcclxuICAgICAgcGxheUVtZXJnZW5jeVNpcmVuKCk7XHJcbiAgICAgIHNpcmVuUGxheWVkUmVmLmN1cnJlbnQgPSB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICghaGFzRW1lcmdlbmN5KSB7XHJcbiAgICAgIHNpcmVuUGxheWVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9LCBbZGF0YT8ub3BlblBvc2l0aW9uc10pO1xyXG5cclxuICAvLyBSZWFsLXRpbWUgQ2Fpcm8gY291bnRkb3duIGNhbGN1bGF0aW9uXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNvdW50ZG93bigpIHtcclxuICAgICAgaWYgKGRyeVJ1bkFjdGl2ZSkge1xyXG4gICAgICAgIHNldERyeVJ1blNpbXVsYXRpb25UaW1lKChwcmV2KSA9PiAocHJldiA+IDAgPyBwcmV2IC0gMSA6IDApKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGNhaXJvU3RyID0gbm93LnRvTG9jYWxlU3RyaW5nKFwiZW4tVVNcIiwgeyB0aW1lWm9uZTogXCJBZnJpY2EvQ2Fpcm9cIiB9KTtcclxuICAgICAgICBjb25zdCBjYWlybyA9IG5ldyBEYXRlKGNhaXJvU3RyKTtcclxuICAgICAgICBjb25zdCBoID0gY2Fpcm8uZ2V0SG91cnMoKTtcclxuICAgICAgICBjb25zdCBtID0gY2Fpcm8uZ2V0TWludXRlcygpO1xyXG4gICAgICAgIGNvbnN0IHMgPSBjYWlyby5nZXRTZWNvbmRzKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY29uZHNTaW5jZU1pZG5pZ2h0ID0gKGggKiA2MCArIG0pICogNjAgKyBzO1xyXG4gICAgICAgIGNvbnN0IHdpbmRvd1N0YXJ0ID0gMTAgKiAzNjAwOyAvLyAxMDowMCBBTVxyXG4gICAgICAgIGNvbnN0IHdpbmRvd0R1cmF0aW9uID0gMTUgKiA2MDsgLy8gMTUgbWlucyAoOTAwcylcclxuXHJcbiAgICAgICAgaWYgKHNlY29uZHNTaW5jZU1pZG5pZ2h0IDwgd2luZG93U3RhcnQpIHtcclxuICAgICAgICAgIHNldElzQmVmb3JlTWFya2V0KHRydWUpO1xyXG4gICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZyh3aW5kb3dEdXJhdGlvbik7XHJcbiAgICAgICAgICBzZXRJc1dpbmRvd0V4cGlyZWQoZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzZXRJc0JlZm9yZU1hcmtldChmYWxzZSk7XHJcbiAgICAgICAgICBjb25zdCBlbGFwc2VkID0gc2Vjb25kc1NpbmNlTWlkbmlnaHQgLSB3aW5kb3dTdGFydDtcclxuICAgICAgICAgIGlmIChlbGFwc2VkIDwgd2luZG93RHVyYXRpb24pIHtcclxuICAgICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZyh3aW5kb3dEdXJhdGlvbiAtIGVsYXBzZWQpO1xyXG4gICAgICAgICAgICBzZXRJc1dpbmRvd0V4cGlyZWQoZmFsc2UpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZygwKTtcclxuICAgICAgICAgICAgc2V0SXNXaW5kb3dFeHBpcmVkKHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCB7fVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZUNvdW50ZG93bigpO1xyXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh1cGRhdGVDb3VudGRvd24sIDEwMDApO1xyXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gIH0sIFtkcnlSdW5BY3RpdmVdKTtcclxuXHJcbiAgY29uc3QgZGlzcGxheVNlY29uZHMgPSBkcnlSdW5BY3RpdmUgPyBkcnlSdW5TaW11bGF0aW9uVGltZSA6IHNlY29uZHNSZW1haW5pbmc7XHJcbiAgY29uc3QgbW0gPSBTdHJpbmcoTWF0aC5mbG9vcihkaXNwbGF5U2Vjb25kcyAvIDYwKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xyXG4gIGNvbnN0IHNzID0gU3RyaW5nKGRpc3BsYXlTZWNvbmRzICUgNjApLnBhZFN0YXJ0KDIsIFwiMFwiKTtcclxuXHJcbiAgY29uc3Qgb25TYXZlQ2FwaXRhbCA9IGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHYgPSBOdW1iZXIoY2FwaXRhbElucHV0KTtcclxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHYpIHx8IHYgPD0gMCkge1xyXG4gICAgICBzZXRDYXBNc2coXCLimqDvuI8g2KPYr9iu2YQg2YXYqNmE2LrZi9inINi12K3Zitit2YvYpyDYo9mD2KjYsSDZhdmGINi12YHYsVwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc2V0U2F2aW5nQ2FwKHRydWUpO1xyXG4gICAgc2V0Q2FwTXNnKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgciA9IGF3YWl0IHNhdmVDYXBpdGFsRm4oeyBkYXRhOiB7IGNhcGl0YWw6IHYgfSB9KTtcclxuICAgICAgaWYgKHIub2spIHtcclxuICAgICAgICBzZXRDYXBNc2coYOKchSDYqtmFINin2YTYrdmB2Lg6ICR7ci5zaXppbmcudG9wX259INmF2LHZg9iyIMOXICR7TWF0aC5yb3VuZChyLnNpemluZy5zbG90X2NhcGl0YWwpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFYCk7XHJcbiAgICAgICAgYXdhaXQgcmVmZXRjaCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldENhcE1zZyhg4p2MICR7ci5lcnJvcn1gKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHNldENhcE1zZyhg4p2MINiu2LfYozogJHtlPy5tZXNzYWdlID8/IFwi2LrZitixINmF2LnYsdmI2YFcIn1gKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldFNhdmluZ0NhcChmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgb25Cb3VnaHQgPSBhc3luYyAoc2lnOiBTaWduYWxSb3cpID0+IHtcclxuICAgIHNldEJ1c3lTaWduYWwoc2lnLmlkKTtcclxuICAgIHNldEFjdGlvbk1zZyhudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG92ZXJyaWRlUmF3ID0gcHJpY2VPdmVycmlkZXNbc2lnLmlkXTtcclxuICAgICAgY29uc3QgcHJpY2UgPSBvdmVycmlkZVJhdyA/IE51bWJlcihvdmVycmlkZVJhdykgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBtYXJrQm91Z2h0Rm5VaSh7IGRhdGE6IHsgc2lnbmFsX2lkOiBzaWcuaWQsIHByaWNlIH0gfSk7XHJcbiAgICAgIGlmIChyLm9rKSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinIUgJHtzaWcuc3ltYm9sfTog2KrZhSDYqtiz2KzZitmEINin2YTYtNix2KfYoSBAICR7Zm10UHJpY2Uoci5zaWduYWw/LmFjdHVhbF9idXlfcHJpY2UgPz8gc2lnLmVudHJ5X3ByaWNlKX0g2Kwu2YVgKTtcclxuICAgICAgICBhd2FpdCByZWZldGNoKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtyLmVycm9yfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtlPy5tZXNzYWdlID8/IFwi2K7Yt9ijXCJ9YCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRCdXN5U2lnbmFsKG51bGwpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uU29sZCA9IGFzeW5jIChzaWc6IFNpZ25hbFJvdykgPT4ge1xyXG4gICAgc2V0QnVzeVNpZ25hbChzaWcuaWQpO1xyXG4gICAgc2V0QWN0aW9uTXNnKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgb3ZlcnJpZGVSYXcgPSBwcmljZU92ZXJyaWRlc1tzaWcuaWRdO1xyXG4gICAgICBjb25zdCBwcmljZSA9IG92ZXJyaWRlUmF3ID8gTnVtYmVyKG92ZXJyaWRlUmF3KSA6IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgciA9IGF3YWl0IG1hcmtTb2xkRm5VaSh7IGRhdGE6IHsgc2lnbmFsX2lkOiBzaWcuaWQsIHByaWNlIH0gfSk7XHJcbiAgICAgIGlmIChyLm9rKSB7XHJcbiAgICAgICAgY29uc3QgcG5sID0gci5zaWduYWw/LnJlYWxpemVkX3BubDtcclxuICAgICAgICBzZXRBY3Rpb25Nc2coXHJcbiAgICAgICAgICBwbmwgIT0gbnVsbFxyXG4gICAgICAgICAgICA/IGDinIUgJHtzaWcuc3ltYm9sfTog2KrZhSDYqtiz2KzZitmEINin2YTYqNmK2Lkg4oCUINi12KfZgdmKICR7TWF0aC5yb3VuZChOdW1iZXIocG5sKSkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YUgKCR7KE51bWJlcihyLnNpZ25hbD8ucmVhbGl6ZWRfcG5sX3BjdCkgKiAxMDApLnRvRml4ZWQoMil9JSlgXHJcbiAgICAgICAgICAgIDogYOKchSAke3NpZy5zeW1ib2x9OiDYqtmFINiq2LPYrNmK2YQg2KfZhNio2YrYuWAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCByZWZldGNoKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtyLmVycm9yfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtlPy5tZXNzYWdlID8/IFwi2K7Yt9ijXCJ9YCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRCdXN5U2lnbmFsKG51bGwpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHBsYW4gPSBkYXRhPy5wbGFuO1xyXG4gIGNvbnN0IHRvZGF5U2lnbmFscyA9IGRhdGE/LnRvZGF5U2lnbmFscyA/PyBbXTtcclxuICBjb25zdCBiYXRjaFNjYW5EYXRlID0gZGF0YT8uYmF0Y2hTY2FuRGF0ZSA/PyBcIlwiO1xyXG4gIGNvbnN0IG9wZW5Qb3NpdGlvbnMgPSBkYXRhPy5vcGVuUG9zaXRpb25zID8/IFtdO1xyXG4gIGNvbnN0IGF1ZGl0TG9ncyA9IGRhdGE/LmF1ZGl0TG9ncyA/PyBbXTtcclxuICBjb25zdCBzZWxsQWxlcnRzID0gZGF0YT8uc2VsbEFsZXJ0cyA/PyBbXTtcclxuXHJcbiAgLy8gUCZMIE1ldHJpY3NcclxuICBjb25zdCB0b3RhbE9wZW5QbmxFZ3AgPSBvcGVuUG9zaXRpb25zLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLnBubEVncCwgMCk7XHJcblxyXG4gIC8vIFNpbXVsYXRlZCBjYW5kaWRhdGVzIGFuZCBwb3NpdGlvbnMgZm9yIERyeSBSdW4gTW9kZVxyXG4gIGNvbnN0IHNpbXVsYXRlZENhbmRpZGF0ZXMgPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiA5OTkxLFxyXG4gICAgICBzY2FuX2RhdGU6IFwiMjAyNi0wOS0xN1wiLFxyXG4gICAgICBzeW1ib2w6IFwiVE1HSFwiLFxyXG4gICAgICBlbnRyeV9wcmljZTogNTQuMjAsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDE4NSxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogOTk5MixcclxuICAgICAgc2Nhbl9kYXRlOiBcIjIwMjYtMDktMTdcIixcclxuICAgICAgc3ltYm9sOiBcIkZXUllcIixcclxuICAgICAgZW50cnlfcHJpY2U6IDguNjUsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDIxMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogZmFsc2UsXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IHNpbXVsYXRlZFBvc2l0aW9uczogRW5yaWNoZWRQb3NpdGlvbltdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogOTk5MyxcclxuICAgICAgc2Nhbl9kYXRlOiBcIjIwMjYtMDktMTdcIixcclxuICAgICAgc3ltYm9sOiBcIkNPTUlcIixcclxuICAgICAgZW50cnlfcHJpY2U6IDEzMi41MCxcclxuICAgICAgYWN0dWFsX2J1eV9wcmljZTogMTMyLjUwLFxyXG4gICAgICBidXlfdGltZXN0YW1wOiBcIjIwMjYtMDktMTdUMDg6MDU6MDBaXCIsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDE0LFxyXG4gICAgICBiaWRfZGVwdGhfYXRfZW50cnk6IDQ1MDAwMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogdHJ1ZSxcclxuICAgICAgc29sZDogZmFsc2UsXHJcbiAgICAgIGRheTFfc3RhdHVzOiBcIkhFTERcIixcclxuICAgICAgZGF5MV9wcmljZTogMTMyLjUwLFxyXG4gICAgICBkYXkyX3N0YXR1czogbnVsbCxcclxuICAgICAgZGF5Ml9wcmljZTogbnVsbCxcclxuICAgICAgZGF5M19zdGF0dXM6IG51bGwsXHJcbiAgICAgIGRheTNfcHJpY2U6IG51bGwsXHJcbiAgICAgIGV4aXRfcmVhc29uOiBudWxsLFxyXG4gICAgICBiaWRfY29uZmlybWVkX2F0X2V4aXQ6IG51bGwsXHJcbiAgICAgIGV4dHJhX2hvbGRfdXNlZDogZmFsc2UsXHJcbiAgICAgIHNoYWRvd19leGl0X3ByaWNlOiBudWxsLFxyXG4gICAgICBzaGFkb3dfcG5sOiBudWxsLFxyXG4gICAgICBzaGFkb3dfcG5sX3BjdDogbnVsbCxcclxuICAgICAgYWN0dWFsX3NlbGxfcHJpY2U6IG51bGwsXHJcbiAgICAgIHNlbGxfdGltZXN0YW1wOiBudWxsLFxyXG4gICAgICByZWFsaXplZF9wbmw6IG51bGwsXHJcbiAgICAgIHJlYWxpemVkX3BubF9wY3Q6IG51bGwsXHJcbiAgICAgIHNlbGxfc2lnbmFsOiBmYWxzZSxcclxuICAgICAgc2VsbF9zaWduYWxfcmVhc29uOiBudWxsLFxyXG4gICAgICBjcmVhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIHVwZGF0ZWRfYXQ6IFwiMjAyNi0wOS0xN1QwODowMDowMFpcIixcclxuICAgICAgY3VycmVudFByaWNlOiAxMzUuMjAsXHJcbiAgICAgIHBubEVncDogMTAyLFxyXG4gICAgICBwbmxQY3Q6IDAuMDIwNCxcclxuICAgICAgZGF5c0hlbGQ6IDIsXHJcbiAgICAgIGRheXNSZW1haW5pbmc6IDMsXHJcbiAgICAgIGV4aXREYXRlOiBcIjIwMjYtMDktMjJcIixcclxuICAgICAgZXhpdERheU5hbWU6IFwi2KfZhNir2YTYp9ir2KfYoVwiLFxyXG4gICAgICBpc1NjaGVkdWxlZEV4aXQ6IGZhbHNlLFxyXG4gICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICBzaGFyZXM6IDM3LFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaWQ6IDk5OTQsXHJcbiAgICAgIHNjYW5fZGF0ZTogXCIyMDI2LTA5LTE3XCIsXHJcbiAgICAgIHN5bWJvbDogXCJFS0hPXCIsXHJcbiAgICAgIGVudHJ5X3ByaWNlOiAxLjMwLFxyXG4gICAgICBhY3R1YWxfYnV5X3ByaWNlOiAxLjMwLFxyXG4gICAgICBidXlfdGltZXN0YW1wOiBcIjIwMjYtMDktMTdUMDg6MDU6MDBaXCIsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDIyLFxyXG4gICAgICBiaWRfZGVwdGhfYXRfZW50cnk6IDEyMDAwMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogdHJ1ZSxcclxuICAgICAgc29sZDogZmFsc2UsXHJcbiAgICAgIGRheTFfc3RhdHVzOiBcIkhFTERcIixcclxuICAgICAgZGF5MV9wcmljZTogMS4zMCxcclxuICAgICAgZGF5Ml9zdGF0dXM6IG51bGwsXHJcbiAgICAgIGRheTJfcHJpY2U6IG51bGwsXHJcbiAgICAgIGRheTNfc3RhdHVzOiBudWxsLFxyXG4gICAgICBkYXkzX3ByaWNlOiBudWxsLFxyXG4gICAgICBleGl0X3JlYXNvbjogXCJTVE9QX0xPU1NcIixcclxuICAgICAgYmlkX2NvbmZpcm1lZF9hdF9leGl0OiB0cnVlLFxyXG4gICAgICBleHRyYV9ob2xkX3VzZWQ6IGZhbHNlLFxyXG4gICAgICBzaGFkb3dfZXhpdF9wcmljZTogbnVsbCxcclxuICAgICAgc2hhZG93X3BubDogbnVsbCxcclxuICAgICAgc2hhZG93X3BubF9wY3Q6IG51bGwsXHJcbiAgICAgIGFjdHVhbF9zZWxsX3ByaWNlOiBudWxsLFxyXG4gICAgICBzZWxsX3RpbWVzdGFtcDogbnVsbCxcclxuICAgICAgcmVhbGl6ZWRfcG5sOiBudWxsLFxyXG4gICAgICByZWFsaXplZF9wbmxfcGN0OiBudWxsLFxyXG4gICAgICBzZWxsX3NpZ25hbDogdHJ1ZSxcclxuICAgICAgc2VsbF9zaWduYWxfcmVhc29uOiBcIlNUT1BfTE9TU1wiLFxyXG4gICAgICBjcmVhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIHVwZGF0ZWRfYXQ6IFwiMjAyNi0wOS0xN1QwODowMDowMFpcIixcclxuICAgICAgY3VycmVudFByaWNlOiAxLjE1LFxyXG4gICAgICBwbmxFZ3A6IC01NzYsXHJcbiAgICAgIHBubFBjdDogLTAuMTE1NCxcclxuICAgICAgZGF5c0hlbGQ6IDIsXHJcbiAgICAgIGRheXNSZW1haW5pbmc6IDMsXHJcbiAgICAgIGV4aXREYXRlOiBcIjIwMjYtMDktMjJcIixcclxuICAgICAgZXhpdERheU5hbWU6IFwi2KfZhNir2YTYp9ir2KfYoVwiLFxyXG4gICAgICBpc1NjaGVkdWxlZEV4aXQ6IGZhbHNlLFxyXG4gICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICBzaGFyZXM6IDM4NDYsXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGFjdGl2ZUNhbmRpZGF0ZXNMaXN0ID0gZHJ5UnVuQWN0aXZlID8gc2ltdWxhdGVkQ2FuZGlkYXRlcyA6IHRvZGF5U2lnbmFscztcclxuICBjb25zdCBhY3RpdmVPcGVuUG9zaXRpb25zTGlzdCA9IGRyeVJ1bkFjdGl2ZSA/IHNpbXVsYXRlZFBvc2l0aW9ucyA6IG9wZW5Qb3NpdGlvbnM7XHJcblxyXG4gIGNvbnN0IGVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMgPSBhY3RpdmVPcGVuUG9zaXRpb25zTGlzdC5maWx0ZXIoKHApID0+IHAuaXNBbm9tYWx5KTtcclxuICBjb25zdCBzY2hlZHVsZWRFeGl0UG9zaXRpb25zID0gYWN0aXZlT3BlblBvc2l0aW9uc0xpc3QuZmlsdGVyKChwKSA9PiBwLmlzU2NoZWR1bGVkRXhpdCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBtZDpwLTYgbWF4LXctNnhsIG14LWF1dG8gc3BhY2UteS01XCIgZGlyPVwicnRsXCI+XHJcbiAgICAgIDxEYXRhRnJlc2huZXNzQmFubmVyIC8+XHJcblxyXG4gICAgICB7LyogQ29udHJvbCBIZWFkZXIgJiBEcnkgUnVuIFN3aXRjaCAqL31cclxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIGJnLWNhcmQgYm9yZGVyIHJvdW5kZWQtMnhsIHAtNCBzaGFkb3ctc21cIj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPuKaoTwvc3Bhbj5cclxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdHJhY2tpbmctdGlnaHRcIj7Yutix2YHYqSDYp9mE2LnZhdmE2YrYp9iqIOKAlCDYp9mE2YXZiNmF2YbYqtmFINin2YTYo9iz2KjZiNi52YogKNmC2YXYqSDYs9mG2YjZitipINi32KfYstipKTwvaDE+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cclxuICAgICAgICAgICAg2KPYqtmF2KrYqSDZg9in2YXZhNipINmE2YTZhdiz2K0g2YjYp9mE2YXYqtin2KjYudipIOKAoiDZhti42KfZhSDYo9iz2KjZiNi52Yo6INiv2K7ZiNmEINin2YTYo9it2K/YjCDYrtix2YjYrCDYp9mB2KrYqtin2K0g2KfZhNij2LPYqNmI2Lkg2KfZhNmC2KfYr9mFIOKAoiDYr9mI2LHZgyDYp9mE2YjYrdmK2K86INi22LrYtyDYstixINin2YTYtNix2KfYoSDYo9mIINin2YTYqNmK2Lkg2YHZiiDYq9in2YbYr9ixINio2LnYryDYp9mE2KrZhtio2YrZhy5cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMiB0ZXh0LXhzIHB4LTMgcHktMS41IHJvdW5kZWQtbGcgYm9yZGVyIGJnLW11dGVkIGhvdmVyOmJnLWFjY2VudCB0cmFuc2l0aW9uXCJcclxuICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goXCIvYXBpL3B1YmxpYy9ob29rcy9hcmNoaXZlLWZvbGRlcj9hY3Rpb249b3BlblwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGogPSBhd2FpdCByLmpzb24oKTtcclxuICAgICAgICAgICAgICAgIGlmIChqLm9rKSBjb25zb2xlLmxvZyhcImFyY2hpdmU6XCIsIGouY2F0Y2h1cCk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICDwn5OBINmB2KrYrSDZhdis2YTYryDYo9ix2LTZitmBINin2YTYqNmK2KfZhtin2Kog2KfZhNmK2YjZhdmK2KlcclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcclxuICAgICAgICAgICAgICBzZXREcnlSdW5BY3RpdmUoIWRyeVJ1bkFjdGl2ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKCFkcnlSdW5BY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHBsYXlTaWduYWxDaGltZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBib3JkZXIgJHtcclxuICAgICAgICAgICAgICBkcnlSdW5BY3RpdmVcclxuICAgICAgICAgICAgICAgID8gXCJiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCBzaGFkb3ctc20gc2hhZG93LWFtYmVyLTUwMC8xMFwiXHJcbiAgICAgICAgICAgICAgICA6IFwiYmctbXV0ZWQgaG92ZXI6YmctbXV0ZWQvNzAgdGV4dC1mb3JlZ3JvdW5kIGJvcmRlci1ib3JkZXJcIlxyXG4gICAgICAgICAgICB9YH1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge2RyeVJ1bkFjdGl2ZSA/IFwi8J+nqiDZiNi22Lkg2KfZhNmF2K3Yp9mD2KfYqSDZhdmB2LnZkdmEIOKckyAo2KXZitmC2KfZgSlcIiA6IFwi8J+nqiDYqtis2LHYqNipINin2YTZhdit2KfZg9in2KkgKERyeSBSdW4pXCJ9XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVmZXRjaCgpfVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy1tdXRlZCBob3ZlcjpiZy1tdXRlZC83MCB0ZXh0LWZvcmVncm91bmQgYm9yZGVyIGJvcmRlci1ib3JkZXJcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICDYqtit2K/ZitirINin2YTYqNmK2KfZhtin2Kog8J+UhFxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvaGVhZGVyPlxyXG5cclxuICAgICAgey8qIERyeSBSdW4gQ29udHJvbHMgJiBBdWRpbyBUZXN0IEJ1dHRvbnMgKi99XHJcbiAgICAgIHtkcnlSdW5BY3RpdmUgJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctYW1iZXItOTUwLzMwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQteGwgcC0zIGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgdGV4dC14c1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWxnXCI+8J+SoTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWFtYmVyLTIwMFwiPlxyXG4gICAgICAgICAgICAgINij2YbYqiDYp9mE2KLZhiDZgdmKINmI2LbYuSDYp9mE2YXYrdin2YPYp9ipINin2YTYqtis2LHZitio2YrYqTog2KfYrtiq2KjYsSDZhdi42YfYsSDYp9mE2LnYr9in2K8g2KfZhNiq2YbYp9iy2YTZiiDZiNiq2YbYqNmK2YfYp9iqINin2YTYt9mI2KfYsdimINmI2KrYrNix2KjYqSDYp9mE2KPYtdmI2KfYqiDZgtio2YQg2KjYr9ihINin2YTYrNmE2LPYqSDYp9mE2K3ZgtmK2YLZitipLlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHBsYXlTaWduYWxDaGltZSgpfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWJ1bGwvMjAgaG92ZXI6YmctYnVsbC8zMCB0ZXh0LWJ1bGwgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGRcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAg8J+UlCDZhti62YXYqSDYp9mE2KXYtNin2LHYqSAoMTA6MDApXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcGxheUVtZXJnZW5jeVNpcmVuKCl9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctYmVhci8yMCBob3ZlcjpiZy1iZWFyLzMwIHRleHQtYmVhciBweC0yLjUgcHktMSByb3VuZGVkIHRleHQtWzExcHhdIGZvbnQtYm9sZFwiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICDwn5qoINi12YHYp9ix2Kkg2KfZhNi32YjYp9ix2KZcclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBwbGF5U2NoZWR1bGVkRXhpdFRvbmUoKX1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1wcmltYXJ5LzIwIGhvdmVyOmJnLXByaW1hcnkvMzAgdGV4dC1wcmltYXJ5LWZvcmVncm91bmQgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGRcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAg8J+ThSDZhti62YXYqSDYp9mE2KjZiti5INin2YTZhdis2K/ZiNmEXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFBSSU9SSVRZIDE6IEVNRVJHRU5DWSBBTEVSVFMgKEFOT01BTElFUyAmIFNDSEVEVUxFRCBFWElUUykg4pSA4pSAICovfVxyXG4gICAgICB7KGVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMubGVuZ3RoID4gMCB8fCBzZWxsQWxlcnRzLmxlbmd0aCA+IDApICYmIChcclxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cclxuICAgICAgICAgIHsvKiBBbm9tYWx5IC8gTmVnYXRpdmUgTmV3cyBFbWVyZ2VuY3kgQmFubmVyICovfVxyXG4gICAgICAgICAge2VtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMubWFwKChwKSA9PiAoXHJcbiAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICBrZXk9e2Bhbm9tLSR7cC5pZH1gfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlci0yIGJvcmRlci1hbWJlci01MDAgYmctYW1iZXItNTAwLzIwIHAtNCBzaGFkb3ctbWQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtYW1iZXItMzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2KrZhtio2YrZhyDYt9mI2KfYsdimOiB7cC5zeW1ib2x9IOKAlCDYqtit2YLZgiDZgdmI2LHYp9mLINmF2YYg2KfZhNiz2YfZhSFcclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWFtYmVyLTIwMC85MCBtdC0wLjVcIj5cclxuICAgICAgICAgICAgICAgICAgICDYp9mE2LPYqNioOiDYsdi12K8g2K7YqNixINiz2YTYqNmKINit2KfYryDYo9mIINiq2YLZhNioINin2LPYqtir2YbYp9im2Yog2LrZitixINmF2KrZiNmC2Lkg2YrZh9iv2K8g2KfZhNi12YHZgtipINmC2KjZhCDYp9mD2KrZhdin2YQg2YXYr9ipINin2YTZhdiz2YMuXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Tb2xkKHApfVxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2J1c3lTaWduYWwgPT09IHAuaWR9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTQgcHktMiB0ZXh0LXhzIGZvbnQtYm9sZCBiZy1hbWJlci02MDAgaG92ZXI6YmctYW1iZXItNTAwIHRleHQtd2hpdGVcIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgINiq2K7Yp9ix2Kwg2KfYtti32LHYp9ix2YpcclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApKX1cclxuXHJcbiAgICAgICAgICB7LyogU2NoZWR1bGVkIFNlbGwgQWxlcnRzIGZyb20gYmFja2VuZCAqL31cclxuICAgICAgICAgIHtzZWxsQWxlcnRzLm1hcCgocykgPT4gKFxyXG4gICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAga2V5PXtgc2EtJHtzLmlkfWB9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyLTIgYm9yZGVyLXByaW1hcnkvNTAgYmctcHJpbWFyeS8xNSBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPvCfk4U8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgINit2KfZhiDZiNmC2Kog2KfZhNio2YrYuSDYp9mE2YXYrNiv2YjZhDoge3Muc3ltYm9sfSAo2KfZg9iq2YXZhNiqIDUg2KzZhNiz2KfYqiDigJQg2K7YsdmI2Kwg2KfZgdiq2KrYp9itINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhSlcclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMC41XCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2YbZh9in2YrYqSDZgdiq2LHYqSDYp9mE2YXYs9mDINin2YTYo9iz2KjZiNi52YrYqS4g2KfZhNiu2LHZiNisINio2LPYudixINin2YTYs9mI2YIg2YHZiiDYqti32KjZitmCINir2KfZhtiv2LEg2LnZhtivINin2YTYp9mB2KrYqtin2K0g4oCUINmG2YHYsyDZgtin2LnYr9ipINin2YTZgtmK2KfYsyDYp9mE2KrYp9ix2YrYrtmKLlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uU29sZChzKX1cclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtidXN5U2lnbmFsID09PSBzLmlkfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTIgdGV4dC14cyBmb250LWJvbGQgYmctcHJpbWFyeSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCBob3ZlcjpiZy1wcmltYXJ5LzkwXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcy5pZCA/IFwiLi4uXCIgOiBcItiq2YUg2KfZhNio2YrYuSDinJNcIn1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApKX1cclxuICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7YWN0aW9uTXNnICYmIChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLWNhcmQgcC0zIHRleHQteHMgZm9udC1ib2xkIHRleHQtYnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgPHNwYW4+8J+UlDwvc3Bhbj5cclxuICAgICAgICAgIDxzcGFuPnthY3Rpb25Nc2d9PC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDE6IDEwOjAwIEFNIFFVQUxJRklFRCBDQU5ESURBVEVTICYgQ09VTlRET1dOIFRJTUVSIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn46vPC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj7Ypdi02KfYsdin2Kog2KfZhNmK2YjZhSAo2KfZhNiz2KfYudipIDEwOjAwINi12KjYp9it2KfZiyk8L2gyPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctcHJpbWFyeS8yMCB0ZXh0LXByaW1hcnkgZm9udC1ib2xkXCI+XHJcbiAgICAgICAgICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubGVuZ3RofSDZhdix2LTYrVxyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cclxuICAgICAgICAgICAgICDYp9mE2KPYs9mH2YUg2KfZhNmF2KTZh9mE2Kkg2KjYudivINmD2YQg2YHZhNin2KrYsSDYp9mE2YbYuNin2YUg2KfZhNi12KfYr9mCOiDYtNix2YrYudipINmB2YLYtyArINiz2YrZiNmE2Kkg4omlIDIwMCDYo9mE2YEg2Kwu2YUv2YrZiNmFICjYo9i52YTZiSAxMDApICsg2LLYrtmFIDUg2KzZhNiz2KfYqiDYqNmK2YYgOCUtNDUlICsg2YHZhNiq2LEg2KfZhNmG2LjYp9mFICjYqtix2KfZg9mFIDEwINij2LPYp9io2YrYuSkgKyDZgtin2LnYr9ipINin2YTZgdis2YjYqSDYudmG2K8g2KfZhNin2YHYqtiq2KfYrSAoLTMlINil2YTZiSArMiUpLlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7LyogMTUtTWludXRlIENvdW50ZG93biBXaW5kb3cgKi99XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgIHshaXNXaW5kb3dFeHBpcmVkID8gKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC14bCBiZy1idWxsLzE1IGJvcmRlciBib3JkZXItYnVsbC8zMCBweC0zLjUgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIGFuaW1hdGUtcHVsc2VcIj7ij7HvuI88L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYnVsbCBmb250LWJvbGRcIj7Zhtin2YHYsNipINin2YTYqtmG2YHZitiwINin2YTZhdmI2LXZiSDYqNmH2Kc8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayBmb250LW1vbm8gdGV4dC1idWxsIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2YXYqtio2YLZiiB7bW19Ontzc30g2K/ZgtmK2YLYqVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC14bCBiZy1hbWJlci01MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgcHgtMy41IHB5LTJcIj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAgZm9udC1ib2xkXCI+2KfZhtiq2YfYqiDZhtin2YHYsNipINin2YTZgCAxNSDYr9mC2YrZgtipPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWFtYmVyLTMwMCBmb250LXNlbWlib2xkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2KfZhNmB2LHYtdipINin2YTYo9i12YTZitipINio2LnZitiv2Kkg4oCUINiq2K3ZgtmCINmF2YYg2KfZhNiz2LnYsSDZgtio2YQg2KfZhNi02LHYp9ihXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICl9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgey8qIFdhcm5pbmcgQmFubmVyIGlmIExhdGUgKi99XHJcbiAgICAgICAge2lzV2luZG93RXhwaXJlZCAmJiAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgYmctYW1iZXItNTAwLzEwIHAtMyB0ZXh0LXhzIHRleHQtYW1iZXItMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgIDxzcGFuPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4+XHJcbiAgICAgICAgICAgICAgPGI+2KrZhtio2YrZhyDYqtij2K7YsTo8L2I+INiq2KzYp9mI2LLYqiDZhdiv2Kkg2KfZhNmAIDE1INiv2YLZitmC2Kkg2KfZhNij2YjZhNmJINmF2YYg2KfZhNis2YTYs9ipLiDYp9mE2KXYtNin2LHYp9iqINmE2Kcg2KrZj9it2LDZgSDYqtmE2YLYp9im2YrYp9mLINit2LHYtdin2Ysg2LnZhNmJINi52K/ZhSDYqtmB2YjZitiqINin2YTZgdix2LXYjCDZiNmE2YPZhiDYqtij2YPYryDZhdmGINiz2LnYsSDYp9mE2LPZh9mFINin2YTYrdin2YTZiiDZgdmKINiq2LfYqNmK2YIg2KvYp9mG2K/YsSDZgtio2YQg2KfZhNi22LrYtyDYudmE2Ykg2KfZhNi02LHYp9ihLlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG5cclxuICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLWJcIj5cclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9mH2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2LPYudixINil2LTYp9ix2Kkg2KfZhNiv2K7ZiNmEPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtiy2K7ZhSA1INis2YTYs9in2KogJTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7ZgtmK2YXYqSDYp9mE2YXYsdmD2LIg2KfZhNmF2K7Yt9i3PC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9i52LEg2KfZhNmF2YbZgdiwICjYpdmGINin2K7YqtmE2YEpPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LWNlbnRlciBmb250LWJvbGRcIj7Yp9mE2KXYrNix2KfYoSDZgdmKINir2KfZhtiv2LE8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtYm9yZGVyXCI+XHJcbiAgICAgICAgICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubWFwKChzKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3MuaWR9IGNsYXNzTmFtZT1cImhvdmVyOmJnLW11dGVkLzE1IHRyYW5zaXRpb24tY29sb3JzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMyBmb250LWJvbGQgZm9udC1tb25vIHRleHQtc21cIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtzLnN5bWJvbH1cclxuICAgICAgICAgICAgICAgICAgICAgIHsocyBhcyBhbnkpLl9oYWxhbCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTEgdGV4dC1bMTBweF0gcHgtMS41IHB5LTAuNSByb3VuZGVkIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC01MDAgZm9udC1zYW5zXCI+2LTYsdmK2LnYqTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1mb3JlZ3JvdW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7Zm10UHJpY2UoTnVtYmVyKHMuZW50cnlfcHJpY2UpKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LWJlYXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICt7KE51bWJlcihzLmdhcF9wY3QpICogMTAwKS50b0ZpeGVkKDIpfSVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtc2VtaWJvbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtNYXRoLnJvdW5kKE51bWJlcihzLnBvc2l0aW9uX3ZhbHVlKSkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcD1cIjAuMDFcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17Zm10UHJpY2UoTnVtYmVyKHMuZW50cnlfcHJpY2UpKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3ByaWNlT3ZlcnJpZGVzW3MuaWRdID8/IFwiXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0UHJpY2VPdmVycmlkZXMoKHApID0+ICh7IC4uLnAsIFtzLmlkXTogZS50YXJnZXQudmFsdWUgfSkpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IHJvdW5kZWQtbGcgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMiBweS0xIHRleHQteHMgZm9udC1tb25vXCJcclxuICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIHRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7IXMuYm91Z2h0ID8gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Cb3VnaHQocyBhcyBTaWduYWxSb3cpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtidXN5U2lnbmFsID09PSBzLmlkfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQteGwgcHgtNCBweS0xLjUgdGV4dC14cyBmb250LWJsYWNrIGJnLWJ1bGwgdGV4dC1idWxsLWZvcmVncm91bmQgaG92ZXI6YmctYnVsbC85MCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctc20gZGlzYWJsZWQ6b3BhY2l0eS01MFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcy5pZCA/IFwi2KzYp9ix2Yog2KfZhNit2YHYuC4uLlwiIDogXCLYqtmFINin2YTYtNix2KfYoSDinJNcIn1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWJ1bGwgYmctYnVsbC8yMCBweC0zIHB5LTEgcm91bmRlZC1mdWxsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAg2KrZhSDYp9mE2LTYsdin2KEg2YLZitivINin2YTZhdiq2KfYqNi52Kkg4pyTXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS02IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICAgIHtpc0JlZm9yZU1hcmtldFxyXG4gICAgICAgICAgICAgID8gXCLwn5WSINmG2YbYqti42LEg2KjYr9ihINis2YTYs9ipINin2YTYqtiv2KfZiNmEINmB2Yog2KrZhdin2YUg2KfZhNiz2KfYudipIDEwOjAwINi12KjYp9it2KfZiyDZhNil2LfZhNin2YIg2KXYtNin2LHYp9iqINin2YTZitmI2YUuXCJcclxuICAgICAgICAgICAgICA6IFwi2YTYpyDZhdix2LTYrdmK2YYg2K/Yp9iu2YQg2YbYt9in2YIg2KfZhNiy2K7ZhSAoOCUtNDUlKSDZh9iw2Kcg2KfZhNij2LPYqNmI2Lkg4oCUINij2Ygg2YHZhNiq2LEg2KfZhNmG2LjYp9mFINij2YjZgtmBINin2YTYqtiv2KfZiNmELiDYp9mE2YbYuNin2YUg2KPYs9io2YjYudmKOiDYp9mE2K/YrtmI2YQg2KfZhNij2K3YryDZgdmC2LcuXCJ9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gMS41OiBMSVZFIFRSQUNLSU5HIOKAlCBFVkVSWSBTSUdOQUwgUk9XOiBOT01JTkFUSU9OIOKGkCBMSVZFIOKGkCAlIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn5SOPC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj7Yp9mE2KrYqtio2Lkg2KfZhNit2Yog4oCUINmD2YQg2KXYtNin2LHYqSDZgdmKINin2YTYr9mB2LnYqSDYp9mE2K3Yp9mE2YrYqTwvaDI+XHJcbiAgICAgICAgICAgICAge2JhdGNoU2NhbkRhdGUgJiYgKFxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJnLW11dGVkIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBmb250LWJvbGQgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAgICAgINiv2YHYudipINmF2LPYrSB7YmF0Y2hTY2FuRGF0ZX1cclxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMVwiPlxyXG4gICAgICAgICAgICAgINix2Y/YtNmQ2ZHYrSDYqNmD2KfZhSAo2LPYudixINin2YTYqtix2LTZititKSDihpAg2KfZhNiz2LnYsSDYp9mE2K3ZiiDYp9mE2KLZhiDihpAg2KfZhNmB2LHZgiDYp9mE2YTYrdi42YogJS4g2KrYrdiv2YrYqyDYqtmE2YLYp9im2Yog2YPZhCAxNSDYq9in2YbZitipLlxyXG4gICAgICAgICAgICAgIMKr4oCUwrsg2YrYudmG2Yog2YTYpyDZitmI2KzYryDYs9i52LEg2YTYrdi42Yog2YTZh9iw2Kcg2KfZhNiz2YfZhSDYp9mE2KLZhiAo2KfZhNiz2LnYsSDYp9mE2YXYsdis2LnZiiDZiti42YQg2LPYudixINin2YTYqtix2LTZititKS5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHt0b2RheVNpZ25hbHMubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLWJcIj5cclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9mH2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2LHZj9i02ZDZkditIEA8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2K3Yr9mI2K8g2KfZhNi02LHYp9ihPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9i52LEg2KfZhNit2Yo8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+JSDYrdmKINmF2YYg2KfZhNiq2LHYtNmK2K08L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2KfZhNit2KfZhNipPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmRlclwiPlxyXG4gICAgICAgICAgICAgICAge3RvZGF5U2lnbmFscy5tYXAoKHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc3QgPSB0cmFja1N0YXR1cyhzKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtgbHQtJHtzLmlkfWB9IGNsYXNzTmFtZT1cImhvdmVyOmJnLW11dGVkLzE1IHRyYW5zaXRpb24tY29sb3JzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtYm9sZCBmb250LW1vbm8gdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5zeW1ib2x9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtzLl9oYWxhbCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMSB0ZXh0LVsxMHB4XSBweC0xLjUgcHktMC41IHJvdW5kZWQgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTUwMCBmb250LXNhbnNcIj7YtNix2YrYudipPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIHRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5fYmFuZExvICE9IG51bGwgJiYgcy5fYmFuZEhpICE9IG51bGwgPyBgJHtmbXRQcmljZShzLl9iYW5kTG8pfSDigJMgJHtmbXRQcmljZShzLl9iYW5kSGkpfWAgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5saXZlUHJpY2UgIT0gbnVsbCA/IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtmbXRQcmljZShzLmxpdmVQcmljZSl9INisLtmFYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPuKAlDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtgcC0zIGZvbnQtbW9ubyBmb250LWJvbGQgJHtzLmxpdmVQY3QgPT0gbnVsbCA/IFwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgOiBzLmxpdmVQY3QgPj0gMCA/IFwidGV4dC1idWxsXCIgOiBcInRleHQtYmVhclwifWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5saXZlUGN0ICE9IG51bGwgPyBgJHtzLmxpdmVQY3QgPj0gMCA/IFwiK1wiIDogXCJcIn0keyhzLmxpdmVQY3QgKiAxMDApLnRvRml4ZWQoMil9JWAgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdGV4dC1bMTFweF0gZm9udC1ib2xkIHB4LTIgcHktMC41IHJvdW5kZWQgYmctbXV0ZWQvNjAgJHtzdC5jbHN9YH0+e3N0LmxhYmVsfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS02IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICAgINmE2Kcg2KrZiNis2K8g2KXYtNin2LHYp9iqINmB2Yog2KfZhNiv2YHYudipINin2YTYrdin2YTZitipIOKAlCDYs9iq2LjZh9ixINmH2YbYpyDZgdmI2LEg2KPZiNmEINmF2LPYrSDYo9iz2KjZiNi52YogKNin2YTYo9it2K8pLlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDI6IEFDVElWRSBPUEVOIFBPU0lUSU9OUyAoVFJBQ0tJTkcgJiA0LURBWSBFR1ggUFJPR1JFU1NJT04pIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn5K8PC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj5cclxuICAgICAgICAgICAgICAgINin2YTYtdmB2YLYp9iqINin2YTZhdmB2KrZiNit2Kkg2YLZitivINin2YTZhdiq2KfYqNi52KkgKHthY3RpdmVPcGVuUG9zaXRpb25zTGlzdC5sZW5ndGh9KVxyXG4gICAgICAgICAgICAgIDwvaDI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XHJcbiAgICAgICAgICAgICAg2YXYqtin2KjYudipINit2YrYqSDZhdiz2KrZhdix2Kkg2YTZg9mEINi12YHZgtipINiq2YUg2KrYo9mD2YrYryDYtNix2KfYptmH2Kcg2LfZiNin2YQg2KfZhNij2LPYqNmI2LkgKDUg2KzZhNiz2KfYqikg4oCUINin2YTYrtix2YjYrCDYp9mE2YjYrdmK2K86INin2YHYqtiq2KfYrSDYo9mI2YQg2KzZhNiz2Kkg2KfZhNij2LPYqNmI2Lkg2KfZhNmC2KfYr9mFLiDYqNmE2Kcg2YjZgtmBINiu2LPYp9ix2KkgKNmF2Y/Zgtin2LM6INmK2LLZitivINin2YTYrtiz2KfYsdipKSDigJQg2KfZhNit2YXYp9mK2Kkg2LnYqNixINiq2LXYutmK2LEg2KfZhNit2KzZhSDYqtmE2YLYp9im2YrYp9mLLlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubGVuZ3RoID4gMCAmJiAoXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAg2KXYrNmF2KfZhNmKINin2YTYo9ix2KjYp9itINin2YTZhNit2LjZitipOntcIiBcIn1cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3RvdGFsT3BlblBubEVncCA+PSAwID8gXCJ0ZXh0LWJ1bGxcIiA6IFwidGV4dC1iZWFyXCJ9PlxyXG4gICAgICAgICAgICAgICAge3RvdGFsT3BlblBubEVncCA+PSAwID8gXCIrXCIgOiBcIlwifVxyXG4gICAgICAgICAgICAgICAge01hdGgucm91bmQodG90YWxPcGVuUG5sRWdwKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhVxyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApfVxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBtZDpncmlkLWNvbHMtMiBnYXAtNFwiPlxyXG4gICAgICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubWFwKChwb3MpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBwcm9ncmVzc1BjdCA9IE1hdGgubWluKDEwMCwgTWF0aC5yb3VuZCgocG9zLmRheXNIZWxkIC8gNSkgKiAxMDApKTtcclxuICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgICAgICBrZXk9e3Bvcy5pZH1cclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcm91bmRlZC0yeGwgYm9yZGVyIHAtNCBzcGFjZS15LTMgdHJhbnNpdGlvbi1hbGwgJHtcclxuICAgICAgICAgICAgICAgICAgICBwb3MuaXNBbm9tYWx5XHJcbiAgICAgICAgICAgICAgICAgICAgICA/IFwiYm9yZGVyLWFtYmVyLTUwMCBiZy1hbWJlci01MDAvMTBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBcImJnLWNhcmQgYm9yZGVyLWJvcmRlciBob3Zlcjpib3JkZXItYm9yZGVyLzgwXCJcclxuICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LWJsYWNrIGZvbnQtbW9ub1wiPntwb3Muc3ltYm9sfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtci0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgINiv2K7ZiNmEOiB7Zm10RGF0ZShwb3Muc2Nhbl9kYXRlKX0gQCB7Zm10UHJpY2UoTnVtYmVyKHBvcy5hY3R1YWxfYnV5X3ByaWNlID8/IHBvcy5lbnRyeV9wcmljZSkpfSDYrC7ZhVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1yaWdodFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmbXRQcmljZShwb3MuY3VycmVudFByaWNlKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B0ZXh0LVsxMXB4XSBmb250LWJvbGQgZm9udC1tb25vICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLnBubFBjdCA+PSAwID8gXCJ0ZXh0LWJ1bGxcIiA6IFwidGV4dC1iZWFyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtwb3MucG5sUGN0ID49IDAgPyBcIitcIiA6IFwiXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsocG9zLnBubFBjdCAqIDEwMCkudG9GaXhlZCgyKX0lICh7cG9zLnBubEVncCA+PSAwID8gXCIrXCIgOiBcIlwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7TWF0aC5yb3VuZChwb3MucG5sRWdwKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhSlcclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBXZWVrbHkgaG9sZGluZyBwcm9ncmVzc2lvbiAoNSBzZXNzaW9ucywgU3VuLi5UaHUpICovfVxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41IGJnLW11dGVkLzQwIHAtMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ib3JkZXIvNTAgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDZhdiz2KfYsSDYp9mE2KPYs9io2YjYuSAo2KrZgtmI2YrZhSBFR1gpOlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDYrNmE2LPYqSB7TWF0aC5taW4ocG9zLmRheXNIZWxkLCA1KX0g2YXZhiA1ICjZhdiq2KjZgtmKIHtwb3MuZGF5c1JlbWFpbmluZ30g2KzZhNiz2KkpXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctbXV0ZWQgcm91bmRlZC1mdWxsIGgtMiBvdmVyZmxvdy1oaWRkZW5cIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWFsbCAke1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5kYXlzSGVsZCA+PSA1ID8gXCJiZy1wcmltYXJ5XCIgOiBcImJnLWJ1bGxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGN0fSVgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzEwcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBwdC0wLjVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtio2YTYpyDZiNmC2YEg2K7Ys9in2LHYqSAo2YXZj9mC2KfYszog2YrYstmK2K8g2KfZhNiu2LPYp9ix2KkpIOKAlCDYp9mE2K3Zhdin2YrYqTog2KrYtdi62YrYsSDYp9mE2K3YrNmFINin2YTYqtmE2YLYp9im2Yo8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7Yp9mE2K7YsdmI2Kw6IHtwb3MuZXhpdERheU5hbWV9IHtwb3MuZXhpdERhdGV9INi52YbYryDYp9mE2KfZgdiq2KrYp9itPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBBY3Rpb24gYnV0dG9uICovfVxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwdC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7cG9zLnNoYXJlcy50b0xvY2FsZVN0cmluZygpfSDYs9mH2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Tb2xkKHBvcyl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17YnVzeVNpZ25hbCA9PT0gcG9zLmlkfVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTEuNSB0ZXh0LXhzIGZvbnQtYmxhY2sgYmctYmVhci8yMCB0ZXh0LWJlYXIgaG92ZXI6YmctYmVhci8zMCBkaXNhYmxlZDpvcGFjaXR5LTUwXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcG9zLmlkID8gXCIuLi5cIiA6IFwi2KrZhSDYp9mE2KjZiti5INmB2Yog2KvYp9mG2K/YsSDinJNcIn1cclxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9KX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTYgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHRleHQteHNcIj5cclxuICAgICAgICAgICAg2YTYpyDYqtmI2KzYryDYtdmB2YLYp9iqINmF2YHYqtmI2K3YqSDYrdin2YTZitin2YsuINi52YbYryDYuNmH2YjYsSDYpdi02KfYsdipINmI2LbYuti32YMg2LnZhNmJIMKr2KrZhSDYp9mE2LTYsdin2KHCu9iMINiz2KrYuNmH2LEg2KfZhNi12YHZgtipINmH2YbYpyDZiNiq2K7Ytti5INmE2YTZhdix2KfZgtio2Kkg2KfZhNit2YrYqSDYqNin2YTYq9mI2KfZhtmKLlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDM6IEVHWCBUUkFESU5HIENBTEVOREFSICYgV0VFS0VORCBQUk9UT0NPTCDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1tdXRlZC8yMCBwLTQgc3BhY2UteS0zIHRleHQteHNcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQtZm9yZWdyb3VuZCBmb250LWJvbGRcIj5cclxuICAgICAgICAgIDxzcGFuPvCfk4U8L3NwYW4+XHJcbiAgICAgICAgICA8c3Bhbj7Yp9mE2KrZgtmI2YrZhSDYp9mE2KrYtNi62YrZhNmKINin2YTYtdix2YrYrSDZhNmAIEVHWCDZiNiq2YjYstmK2Lkg2KfZhNij2YrYp9mFOjwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGxlYWRpbmctcmVsYXhlZFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1jYXJkIHAtMyByb3VuZGVkLXhsIGJvcmRlclwiPlxyXG4gICAgICAgICAgICA8YiBjbGFzc05hbWU9XCJ0ZXh0LWZvcmVncm91bmQgYmxvY2sgbWItMVwiPtiv2YjYsdipINin2YTYo9iz2KjZiNi5ICg1INis2YTYs9in2KrYjCDZitiq2K7Yt9mJINi52LfZhNipINmG2YfYp9mK2Kkg2KfZhNij2LPYqNmI2LkpOjwvYj5cclxuICAgICAgICAgICAg2KfZhNiv2K7ZiNmEOiDYp9mB2KrYqtin2K0g2KPZiNmEINis2YTYs9ipINin2YTYo9iz2KjZiNi5ICjYp9mE2KPYrdivKSDigJQg2KfZhNiu2LHZiNisOiDYp9mB2KrYqtin2K0g2KPZiNmEINis2YTYs9ipINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhS5cclxuICAgICAgICAgICAgPGJyIC8+XHJcbiAgICAgICAgICAgIDxiPtmF2KvYp9mEINit2Yo6PC9iPiDYr9iu2YjZhCA8Yj7Yp9mE2KPYrdivPC9iPiDinpQg2KfZhNij2LPYqNmI2Lkg2YrZhdi02YogKNin2YTYo9it2K8t2KfZhNiu2YXZitizKSDinpQg2KfZhNis2YXYudipINmI2KfZhNiz2KjYqiDYrtin2LHYrCDYp9mE2K3Ys9in2Kgg4p6UINiu2LHZiNisIDxiPtin2YTYo9it2K8g2KfZhNmC2KfYr9mFPC9iPiDYudmG2K8g2KfZhNin2YHYqtiq2KfYrS4g2KjZhNinINmI2YLZgSDYrtiz2KfYsdipINmI2YTYpyDYrNmG2Yog2KPYsdio2KfYrSDigJQg2KfZhNin2KrZhtmK2YYg2YXZj9mC2KfYs9mK2YY6INmK2LLZitiv2YjYpyDYp9mE2K7Ys9in2LHYqS5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1jYXJkIHAtMyByb3VuZGVkLXhsIGJvcmRlclwiPlxyXG4gICAgICAgICAgICA8YiBjbGFzc05hbWU9XCJ0ZXh0LWZvcmVncm91bmQgYmxvY2sgbWItMVwiPtmF2YfYp9mFINi52LfZhNipINin2YTYrNmF2LnYqSDZiNin2YTYs9io2KogKNin2YTYqtit2YTZitmEINin2YTZhdiz2KrZgtmEKTo8L2I+XHJcbiAgICAgICAgICAgINiq2Y/Ys9iq2LrZhCDYudi32YTYqSDYp9mE2KzZhdi52Kkg2YjYp9mE2LPYqNiqINmB2Yog2KrYtNi62YrZhCDYp9mE2LnZhdmE2YrYp9iqINin2YTYqtit2YTZitmE2YrYqSDYutmK2LEg2KfZhNit2YrYqSDYr9mI2YYg2KrYudin2LHYtiDZhdi5INin2YTYqtiv2KfZiNmEOlxyXG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibGlzdC1kaXNjIHByLTQgbXQtMSBzcGFjZS15LTAuNVwiPlxyXG4gICAgICAgICAgICAgIDxsaT7Ypdi12K/Yp9ixINin2YTYqtmC2LHZitixINin2YTYo9iz2KjZiNi52Yog2KfZhNi02KfZhdmEINmE2YTZhdit2YHYuNipLjwvbGk+XHJcbiAgICAgICAgICAgICAgPGxpPtmB2K3YtSDZhdik2LTYsSDYp9mE2KPZhNmB2KcgKEFscGhhKSDZiNmF2YLYp9ix2YbYqSDYp9mE2KPYr9in2KEg2KjZgCBFR1gzMC48L2xpPlxyXG4gICAgICAgICAgICAgIDxsaT7Zhdix2KfYrNi52Kkg2YjYqtit2K/ZitirINmC2KfYptmF2Kkg2KPYs9mH2YUg2KfZhNi02LHZiti52KkgKNmD2YQgNiDYtNmH2YjYsSkuPC9saT5cclxuICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gNDogQ0FQSVRBTCBTRVRUSU5HUyDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1jYXJkIHAtNCBzaGFkb3ctc21cIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWVuZCBnYXAtM1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctNTZcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCBtYi0xXCI+8J+SsCDYsdij2LMg2KfZhNmF2KfZhCDYp9mE2YXYqtin2K0g2YTZhNiq2K/Yp9mI2YQ8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMlwiPlxyXG4gICAgICAgICAgICAgINmK2Y/Yrdiz2Kgg2LnYr9ivINin2YTZhdix2KfZg9iyINiq2YTZgtin2KbZitmL2Kc6IFRPUF9OID0g2LHYo9izINin2YTZhdin2YQgw7cgMjAsMDAwICjZhdmGIDEg2KXZhNmJIDUg2YXYsdin2YPYsiDigJQg2KfZhNil2LnYr9in2K8g2KfZhNmF2K/YsdmI2LMgTjU6INij2YHYttmEINiq2YjYp9iy2YYg2LnYp9im2K8v2KfYqtiz2KfZgiDZhdmC2KfYsykuINmB2YjZgiAxMDAg2KPZhNmBINmK2LLZitivINit2KzZhSDYp9mE2YXYsdmD2LIg2KfZhNmI2KfYrdivLlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yIGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgICBtaW49ezF9XHJcbiAgICAgICAgICAgICAgICBzdGVwPXsxMDAwfVxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2NhcGl0YWxJbnB1dH1cclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q2FwaXRhbElucHV0KGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6IDEwMDAwMFwiXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTQwIHJvdW5kZWQteGwgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMyBweS0xLjUgdGV4dC1zbSBmb250LW1vbm9cIlxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17b25TYXZlQ2FwaXRhbH1cclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtzYXZpbmdDYXB9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTQgcHktMS41IHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy1wcmltYXJ5IHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIGhvdmVyOmJnLXByaW1hcnkvOTAgZGlzYWJsZWQ6b3BhY2l0eS01MFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge3NhdmluZ0NhcCA/IFwi2KzYp9ix2Yog2KfZhNit2YHYuOKAplwiIDogXCLYrdmB2LhcIn1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIHtjYXBNc2cgJiYgPGRpdiBjbGFzc05hbWU9XCJtdC0xIHRleHQtWzExcHhdXCI+e2NhcE1zZ308L2Rpdj59XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIHtzaXppbmcgJiYgKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTMgZ2FwLTIgdGV4dC1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLW11dGVkLzQwIHB4LTMgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPtix2KPYsyDYp9mE2YXYp9mEINin2YTZgdi52ZHYp9mEPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIGZvbnQtbW9ub1wiPntNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhTwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC14bCBib3JkZXIgYmctbXV0ZWQvNDAgcHgtMyBweS0yXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+2LnYr9ivINin2YTZhdix2KfZg9iyIChUT1BfTik8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJvbGQgZm9udC1tb25vXCI+e3NpemluZy50b3Bfbn08L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLW11dGVkLzQwIHB4LTMgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPtit2KzZhSDYp9mE2YXYsdmD2LIgKFNMT1QpPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIGZvbnQtbW9ub1wiPntNYXRoLnJvdW5kKHNpemluZy5zbG90X2NhcGl0YWwpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDU6IERFQ0lTSU9OIEFVRElUIExPRyAoUEVSTUFORU5UIFJFQ09SRCkg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYmctY2FyZCBwLTUgc2hhZG93LXNtIHNwYWNlLXktM1wiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIHBiLTNcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ib2xkXCI+8J+TnCDYs9is2YQg2KfZhNmC2LHYp9ix2KfYqiDZiNin2YTYqtmG2KjZitmH2KfYqiDYp9mE2YXZiNir2YIgKERlY2lzaW9uIEF1ZGl0IExvZyk8L2gyPlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMC41XCI+XHJcbiAgICAgICAgICAgICAg2LPYrNmEINiv2KfYptmFINmI2YXYpNix2K4g2KjYp9mE2KvYp9mG2YrYqSDZhNmD2YQg2KXYtNin2LHYqSDYtdiv2LHYqtiMINmD2YQg2KXZhtiw2KfYsSDYt9mI2KfYsdim2Iwg2YjYsdivINmB2LnZhCDYp9mE2YXYs9iq2K7Yr9mFINmE2KrZiNir2YrZgiDYp9mE2KPYr9in2KEg2KrYp9ix2YrYrtmK2KfZiy5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHthdWRpdExvZ3MubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvIG1heC1oLTYwXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgc3RpY2t5IHRvcC0wXCI+XHJcbiAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtin2YTYqtmI2YLZitiqPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0XCI+2YbZiNi5INin2YTYrdiv2Ks8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yIHRleHQtcmlnaHRcIj7Yp9mE2LPZh9mFPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0XCI+2KfZhNiz2LnYsTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtiq2LXYsdmBINin2YTZhdiz2KrYrtiv2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtYm9yZGVyXCI+XHJcbiAgICAgICAgICAgICAgICB7YXVkaXRMb2dzLm1hcCgobG9nKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e2xvZy5pZH0gY2xhc3NOYW1lPVwiaG92ZXI6YmctbXV0ZWQvMTVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yIGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuY3JlYXRlZF9hdCA/IGxvZy5jcmVhdGVkX2F0LnNsaWNlKDAsIDE5KS5yZXBsYWNlKFwiVFwiLCBcIiBcIikgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMiBmb250LXNlbWlib2xkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bG9nLmV2ZW50X3R5cGUgPT09IFwiVVNFUl9CT1VHSFRcIiAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJ1bGxcIj7wn5uSINiq2KPZg9mK2K8g2LTYsdin2KE8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIlVTRVJfU09MRFwiICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcHJpbWFyeVwiPvCfkrAg2KrYo9mD2YrYryDYqNmK2Lk8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIkVNRVJHRU5DWV9TVE9QX0xPU1NcIiAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJlYXIgZm9udC1ib2xkXCI+8J+aqCDYpdmG2LDYp9ixINmI2YLZgSDYrtiz2KfYsdipPC9zcGFuPn1cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZXZlbnRfdHlwZSA9PT0gXCJTSUdOQUxfMTBBTVwiICYmIDxzcGFuPvCfjq8g2KXYtNin2LHYqSAxMDowMCDYtdio2KfYrdin2Ys8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIlNDSEVEVUxFRF9FWElUXCIgJiYgPHNwYW4+8J+ThSDYrtix2YjYrCDYo9iz2KjZiNi52Yog2YXYrNiv2YjZhDwvc3Bhbj59XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yIGZvbnQtbW9ubyBmb250LWJvbGRcIj57bG9nLnN5bWJvbH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIgZm9udC1tb25vXCI+e2xvZy50cmlnZ2VyX3ByaWNlID8gZm10UHJpY2UoTnVtYmVyKGxvZy50cmlnZ2VyX3ByaWNlKSkgOiBcIuKAlFwifSDYrC7ZhTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYmctbXV0ZWRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2xvZy51c2VyX2FjdGlvbn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiAoXHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICDZhNinINiq2YjYrNivINiz2KzZhNin2Kog2YLYsdin2LHYp9iqINiz2KfYqNmC2Kkg2KjYudivLiDZg9mEINmG2YLYsdipINi02LHYp9ihINij2Ygg2KjZiti5INij2Ygg2KrZhtio2YrZhyDYt9mI2KfYsdimINiz2KrZj9mI2KvZgiDZh9mG2Kcg2KrZhNmC2KfYptmK2KfZiy5cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICApfVxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gNjogTUVBU1VSRUQgUEVSRk9STUFOQ0UgKGhvbmVzdCwgaGFsYWwtb25seSkg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXdhcm4vNDAgYmctd2Fybi8xMCBwLTQgc3BhY2UteS0yXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbVwiPvCfk4sg2KfZhNij2K/Yp9ihINin2YTZhdmP2YLYp9izICjYtNix2YrYudipINmB2YLYtyDigJQg2KjYp9mDLdiq2LPYqiDYtdin2K/ZgiA1MTIg2KPYs9io2YjYuSAyMDE2LTIwMjbYjCDYqtmD2YTZgdipINir2KfZhtiv2LEgMC4wNSUpPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIG1kOmdyaWQtY29scy00IGdhcC0yIHRleHQteHNcIj5cclxuICAgICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cItin2YTZhti42KfZhSDYp9mE2K3Yp9mE2YogKNii2K7YsSA5MCDZitmI2YUpXCIgdmFsdWU9e2B+JHtDVVJSRU5UX1JFR0lNRV9XRUVLTFlfTE9XX0VHUC50b0xvY2FsZVN0cmluZygpfS0ke0NVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUC50b0xvY2FsZVN0cmluZygpfSDYrC7ZhWB9IHRvbmU9XCJidWxsXCIgc3ViPVwi2KPZgdi22YQg2YHYqtix2Kkg2YHZiiDYp9mE2LnZgtivIOKAlCDZhNmK2LMg2K3Zgtin2Ysg2YXZg9iq2LPYqNin2YtcIiAvPlxyXG4gICAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwi2KfZhNmF2KrZiNiz2Lcg2KfZhNi32YjZitmEINin2YTZhdmI2KvZiNmCICgxMCDYs9mG2YrZhilcIiB2YWx1ZT17YCR7QkFDS1RFU1RfV0VFS0xZX0VHUC50b0xvY2FsZVN0cmluZygpfSDYrC7ZhWB9IHRvbmU9XCJkZWZhdWx0XCIgc3ViPXtg2YHYp9i12YQg2KvZgtipIDk1JTogJHtCQUNLVEVTVF9XRUVLTFlfRUdQX0xPVy50b0xvY2FsZVN0cmluZygpfS0ke0JBQ0tURVNUX1dFRUtMWV9FR1BfSElHSC50b0xvY2FsZVN0cmluZygpfWB9IC8+XHJcbiAgICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCLYo9iz2YjYoyDYo9iz2KjZiNi5ICgxMCDYs9mG2YrZhilcIiB2YWx1ZT17YCR7QkFDS1RFU1RfV09SU1RfV0VFS19QQ1QudG9Mb2NhbGVTdHJpbmcoKX0lYH0gdG9uZT1cImJlYXJcIiAvPlxyXG4gICAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwi2KPZgti12Ykg2KrYsdin2KzYuSAoMTAg2LPZhtmK2YYpXCIgdmFsdWU9e2Ake0JBQ0tURVNUX01BWEREX1BDVC50b0xvY2FsZVN0cmluZygpfSVgfSB0b25lPVwiYmVhclwiIHN1Yj1cItmF2Lkg2KfZhNit2YXYp9mK2KfYqiDYp9mE2KrZhNmC2KfYptmK2Kk6IH4yNy0zMCVcIiAvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWJvcmRlci81MCBiZy1jYXJkLzYwIHAtMi41IHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGxlYWRpbmctcmVsYXhlZFwiPlxyXG4gICAgICAgICAgPGIgY2xhc3NOYW1lPVwidGV4dC1mb3JlZ3JvdW5kXCI+2LTZg9mEINin2YTYo9iz2KfYqNmK2Lkg2KfZhNit2YLZitmC2YogKNmF2YLYp9izKTo8L2I+IH4yNS0zMCUg2YHZgti3INmF2YYg2KfZhNij2LPYp9io2YrYuSDYqtiq2KzYp9mI2LIgMiw1MDAg2Kwu2YUg2YjZiNiz2YrYtyDYp9mE2KPYs9io2YjYuSDiiYggMCDigJRcclxuICAgICAgICAgINij2LrZhNioINin2YTYo9iz2KfYqNmK2Lkg2LXYutmK2LHYqSDYo9mIINiz2KfZhNio2Kkg2YjYp9mE2YXYqtmI2LPYtyDYqNmK2KrYrdmC2YIg2YXZhiDZgtmB2LLYp9iqINmG2KfYr9ix2KkgKNiy2YogKzIxLDUwMCDZiCszNCw5MDAg2YHZiiDZitmI2YbZitmIL9mK2YjZhNmK2YggMjAyNikg2YTYpyDZitmF2YPZhiDYqtmI2YLZitiq2YfYpy5cclxuICAgICAgICAgIDxiIGNsYXNzTmFtZT1cInRleHQtZm9yZWdyb3VuZFwiPiDZiNmE2Kcg2YrZiNis2K8g2YjYudivINio2LHYqNitINir2KfYqNiqIOKAlCDZhdix2YHZiNi2INmF2YYg2YPZhCDYp9mE2KPYt9ix2KfZgS48L2I+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbGVhZGluZy1yZWxheGVkXCI+e0JBQ0tURVNUX0RJU0NMQUlNRVJfQVJ9PC9wPlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7LyogUnVsZXMgRm9vdGVyICovfVxyXG4gICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTQgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLXRcIj5cclxuICAgICAgICDZgtmI2KfYudivINmB2YTYp9iq2LEg2KfZhNin2LPYqtix2KfYqtmK2KzZitipINmI2YXYudin2K/ZhNin2KrZh9inINmF2KzZhdiv2Kkg2YTZhdiv2KkgNC02INij2LPYp9io2YrYuSDZhNmE2KfYrtiq2KjYp9ixINmI2KfZhNmF2LHYp9mC2KjYqSDYp9mE2LXYp9ix2YXYqS5cclxuICAgICAgPC9mb290ZXI+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcbiJdLCJmaWxlIjoiRDovbWVreS1zdG9jay1tYWluL21la3ktc3RvY2stbWFpbi9zcmMvcm91dGVzL3NjYWxwLWRpcC50c3gifQ==