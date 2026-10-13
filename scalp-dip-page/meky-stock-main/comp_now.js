import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/routes/scalp-dip.tsx?tsr-split=component");import __vite__cjsImport0_react_jsxDevRuntime from "/node_modules/.vite/deps/react_jsx-dev-runtime.js?v=f3a543ee"; const jsxDEV = __vite__cjsImport0_react_jsxDevRuntime["jsxDEV"];
var _s = $RefreshSig$();
import { useQuery } from "/node_modules/.vite/deps/@tanstack_react-query.js?v=f3a543ee";
import __vite__cjsImport2_react from "/node_modules/.vite/deps/react.js?v=f3a543ee"; const useState = __vite__cjsImport2_react["useState"]; const useEffect = __vite__cjsImport2_react["useEffect"]; const useRef = __vite__cjsImport2_react["useRef"];
import { fmtPrice } from "/src/lib/format/price.ts";
import { DataFreshnessBanner } from "/src/components/data-freshness-banner.tsx";
import { BACKTEST_DISCLAIMER_AR, BACKTEST_WEEKLY_EGP, BACKTEST_WEEKLY_EGP_LOW, BACKTEST_WEEKLY_EGP_HIGH, BACKTEST_WORST_WEEK_PCT, BACKTEST_MAXDD_PCT, CURRENT_REGIME_WEEKLY_LOW_EGP, CURRENT_REGIME_WEEKLY_HIGH_EGP } from "/src/lib/scalp-dip/momentum-weekly.server.ts";
import { playSignalChime, playEmergencySiren, playScheduledExitTone } from "/src/lib/scalp-dip/operational-audio.ts";
const STRATEGY = "scalp-dip";
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
async function fetchDashboard() {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard");
  return res.json();
}
const markBoughtFnUi = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "bought",
      signal_id: args.data.signal_id,
      price: args.data.price
    })
  });
  return res.json();
};
const markSoldFnUi = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "sold",
      signal_id: args.data.signal_id,
      price: args.data.price
    })
  });
  return res.json();
};
const saveCapitalFn = async (args) => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "capital",
      capital: args.data.capital
    })
  });
  return res.json();
};
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
  return /* @__PURE__ */ jsxDEV("div", { className: "bg-card border rounded-xl p-3 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:214:5", children: [
    /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] uppercase font-medium tracking-wider text-muted-foreground mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:215:7", children: label }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 188,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("div", { className: `text-lg font-extrabold font-mono ${cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:216:7", children: value }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 189,
      columnNumber: 7
    }, this),
    sub && /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:217:15", children: sub }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 190,
      columnNumber: 15
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
    lineNumber: 187,
    columnNumber: 10
  }, this);
}
_c = StatCard;
function ScalpDipOperationalPage() {
  _s();
  const {
    data,
    refetch
  } = useQuery({
    queryKey: ["scalp-dip-operational-dashboard"],
    queryFn: () => fetchDashboard(),
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
  return /* @__PURE__ */ jsxDEV("div", { className: "p-4 md:p-6 max-w-6xl mx-auto space-y-5", dir: "rtl", "data-tsd-source": "/src/routes/scalp-dip.tsx:509:5", children: [
    /* @__PURE__ */ jsxDEV(DataFreshnessBanner, { "data-tsd-source": "/src/routes/scalp-dip.tsx:510:7" }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 476,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("header", { className: "flex flex-wrap items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:513:7", children: [
      /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:514:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:515:11", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:516:13", children: "⚡" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 482,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("h1", { className: "text-2xl font-black tracking-tight", "data-tsd-source": "/src/routes/scalp-dip.tsx:517:13", children: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 483,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 481,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:519:11", children: "أتمتة كاملة للمسح والمتابعة • نظام أسبوعي: دخول الأحد، خروج افتتاح الأسبوع القادم • دورك الوحيد: ضغط زر الشراء أو البيع في ثاندر بعد التنبيه." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 485,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { className: "mt-2 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-accent transition", onClick: async () => {
          try {
            const r = await fetch("/api/public/hooks/archive-folder?action=open");
            const j = await r.json();
            if (j.ok) console.log("archive:", j.catchup);
          } catch {
          }
        }, "data-tsd-source": "/src/routes/scalp-dip.tsx:522:11", children: "📁 فتح مجلد أرشيف البيانات اليومية" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 488,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 480,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:536:9", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => {
          setDryRunActive(!dryRunActive);
          if (!dryRunActive) {
            playSignalChime();
          }
        }, className: `rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${dryRunActive ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10" : "bg-muted hover:bg-muted/70 text-foreground border-border"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:537:11", children: dryRunActive ? "🧪 وضع المحاكاة مفعّل ✓ (إيقاف)" : "🧪 تجربة المحاكاة (Dry Run)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 500,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => refetch(), className: "rounded-xl px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/70 text-foreground border border-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:552:11", children: "تحديث البيانات 🔄" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 508,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 499,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 479,
      columnNumber: 7
    }, this),
    dryRunActive && /* @__PURE__ */ jsxDEV("div", { className: "bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:563:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:564:11", children: [
        /* @__PURE__ */ jsxDEV("span", { className: "text-lg", "data-tsd-source": "/src/routes/scalp-dip.tsx:565:13", children: "💡" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 517,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-amber-200", "data-tsd-source": "/src/routes/scalp-dip.tsx:566:13", children: "أنت الآن في وضع المحاكاة التجريبية: اختبر مظهر العداد التنازلي وتنبيهات الطوارئ وتجربة الأصوات قبل بدء الجلسة الحقيقية." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 518,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 516,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:570:11", children: [
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playSignalChime(), className: "bg-bull/20 hover:bg-bull/30 text-bull px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:571:13", children: "🔔 نغمة الإشارة (10:00)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 523,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playEmergencySiren(), className: "bg-bear/20 hover:bg-bear/30 text-bear px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:577:13", children: "🚨 صفارة الطوارئ" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 526,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => playScheduledExitTone(), className: "bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2.5 py-1 rounded text-[11px] font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:583:13", children: "📅 نغمة البيع المجدول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 529,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 522,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 515,
      columnNumber: 24
    }, this),
    (emergencyAnomalyPositions.length > 0 || sellAlerts.length > 0) && /* @__PURE__ */ jsxDEV("section", { className: "space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:595:9", children: [
      emergencyAnomalyPositions.map((p) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-4 shadow-md flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:598:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:602:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:603:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 540,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:604:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-amber-300", "data-tsd-source": "/src/routes/scalp-dip.tsx:605:19", children: [
              "تنبيه طوارئ: ",
              p.symbol,
              " — تحقق فوراً من السهم!"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 542,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-200/90 mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:608:19", children: "السبب: رصد خبر سلبي حاد أو تقلب استثنائي غير متوقع يهدد الصفقة قبل اكتمال مدة المسك." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 545,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 541,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 539,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(p), disabled: busySignal === p.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white", "data-tsd-source": "/src/routes/scalp-dip.tsx:613:15", children: "تخارج اضطراري" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 550,
          columnNumber: 15
        }, this)
      ] }, `anom-${p.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 538,
        columnNumber: 49
      }, this)),
      sellAlerts.map((s) => /* @__PURE__ */ jsxDEV("div", { className: "rounded-2xl border-2 border-primary/50 bg-primary/15 p-4 flex flex-wrap items-center justify-between gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:625:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:629:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-2xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:630:17", children: "📅" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 558,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:631:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black text-primary-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:632:19", children: [
              "حان وقت البيع المجدول: ",
              s.symbol,
              " (اكتملت 5 جلسات — خروج افتتاح الأسبوع القادم)"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 560,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:635:19", children: "نهاية فترة المسك الأسبوعية. الخروج بسعر السوق في تطبيق ثاندر عند الافتتاح — نفس قاعدة القياس التاريخي." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 563,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 559,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 557,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90", "data-tsd-source": "/src/routes/scalp-dip.tsx:640:15", children: busySignal === s.id ? "..." : "تم البيع ✓" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 568,
          columnNumber: 15
        }, this)
      ] }, `sa-${s.id}`, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 556,
        columnNumber: 34
      }, this))
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 536,
      columnNumber: 75
    }, this),
    actionMsg && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-card p-3 text-xs font-bold text-bull flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:653:9", children: [
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:654:11", children: "🔔" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 575,
        columnNumber: 11
      }, this),
      /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:655:11", children: actionMsg }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 576,
        columnNumber: 11
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 574,
      columnNumber: 21
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:660:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:661:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:662:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:663:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:664:15", children: "🎯" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 584,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:665:15", children: "إشارات اليوم (الساعة 10:00 صباحاً)" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 585,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("span", { className: "text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:666:15", children: [
              activeCandidatesList.length,
              " مرشح"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 586,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 583,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:670:13", children: "الأسهم المؤهلة بعد كل فلاتر النظام الصادق: شريعة فقط + سيولة ≥ 200 ألف ج.م/يوم (أعلى 100) + زخم 5 جلسات بين 8%-45% + فلتر النظام (تراكم 10 أسابيع) + قاعدة الفجوة عند الافتتاح (-3% إلى +2%)." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 590,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 582,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:676:11", children: !isWindowExpired ? /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-bull/15 border border-bull/30 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:678:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base animate-pulse", "data-tsd-source": "/src/routes/scalp-dip.tsx:679:17", children: "⏱️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 598,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:680:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-bull font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:681:19", children: "نافذة التنفيذ الموصى بها" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 600,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-base font-black font-mono text-bull tracking-wider", "data-tsd-source": "/src/routes/scalp-dip.tsx:682:19", children: [
              "متبقي ",
              mm,
              ":",
              ss,
              " دقيقة"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 601,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 599,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 597,
          columnNumber: 33
        }, this) : /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:688:15", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-base", "data-tsd-source": "/src/routes/scalp-dip.tsx:689:17", children: "⚠️" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 606,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:690:17", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-amber-400 font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:691:19", children: "انتهت نافذة الـ 15 دقيقة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 608,
              columnNumber: 19
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-xs text-amber-300 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:692:19", children: "الفرصة الأصلية بعيدة — تحقق من السعر قبل الشراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 609,
              columnNumber: 19
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 607,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 605,
          columnNumber: 24
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 596,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 581,
        columnNumber: 9
      }, this),
      isWindowExpired && /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:703:11", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:704:13", children: "⚠️" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 619,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:705:13", children: [
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:706:15", children: "تنبيه تأخر:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 621,
            columnNumber: 15
          }, this),
          " تجاوزت مدة الـ 15 دقيقة الأولى من الجلسة. الإشارات لا تُحذف تلقائياً حرصاً على عدم تفويت الفرص، ولكن تأكد من سعر السهم الحالي في تطبيق ثاندر قبل الضغط على الشراء."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 620,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 618,
        columnNumber: 29
      }, this),
      activeCandidatesList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:712:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:713:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:714:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:715:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:716:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 629,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:717:19", children: "سعر إشارة الدخول" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 630,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:718:19", children: "زخم 5 جلسات %" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 631,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:719:19", children: "قيمة المركز المخطط" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 632,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:720:19", children: "السعر المنفذ (إن اختلف)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 633,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-center font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:721:19", children: "الإجراء في ثاندر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 634,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 628,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 627,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:724:15", children: activeCandidatesList.map((s) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:726:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:727:21", children: [
            s.symbol,
            s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:730:25", children: "شريعة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 641,
              columnNumber: 45
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 639,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:733:21", children: [
            fmtPrice(Number(s.entry_price)),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 643,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:736:21", children: [
            "+",
            (Number(s.gap_pct) * 100).toFixed(2),
            "%"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 646,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:739:21", children: [
            Math.round(Number(s.position_value)).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 649,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:742:21", children: /* @__PURE__ */ jsxDEV("input", { type: "number", step: "0.01", placeholder: fmtPrice(Number(s.entry_price)), value: priceOverrides[s.id] ?? "", onChange: (e) => setPriceOverrides((p) => ({
            ...p,
            [s.id]: e.target.value
          })), className: "w-24 rounded-lg border bg-background px-2 py-1 text-xs font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:743:23" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 653,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 652,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-3 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:752:21", children: !s.bought ? /* @__PURE__ */ jsxDEV("button", { onClick: () => onBought(s), disabled: busySignal === s.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bull text-bull-foreground hover:bg-bull/90 transition-all shadow-sm disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:754:25", children: busySignal === s.id ? "جاري الحفظ..." : "تم الشراء ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 659,
            columnNumber: 36
          }, this) : /* @__PURE__ */ jsxDEV("span", { className: "text-xs font-bold text-bull bg-bull/20 px-3 py-1 rounded-full", "data-tsd-source": "/src/routes/scalp-dip.tsx:762:25", children: "تم الشراء قيد المتابعة ✓" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 661,
            columnNumber: 37
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 658,
            columnNumber: 21
          }, this)
        ] }, s.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 638,
          columnNumber: 50
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 637,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 626,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 625,
        columnNumber: 44
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:773:11", children: isBeforeMarket ? "🕒 ننتظر بدء جلسة التداول في تمام الساعة 10:00 صباحاً لإطلاق إشارات اليوم." : "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — أو فلتر النظام أوقف التداول. النظام أسبوعي: الدخول الأحد فقط." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 668,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 580,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:782:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:783:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:784:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:785:13", children: [
          /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:786:15", children: "🔎" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 678,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:787:15", children: "التتبع الحي — كل إشارة في الدفعة الحالية" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 679,
            columnNumber: 15
          }, this),
          batchScanDate && /* @__PURE__ */ jsxDEV("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:789:17", children: [
            "دفعة مسح ",
            batchScanDate
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 680,
            columnNumber: 33
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 677,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:794:13", children: "رُشِّح بكام (سعر الترشيح) ← السعر الحي الآن ← الفرق اللحظي %. تحديث تلقائي كل 15 ثانية. «—» يعني لا يوجد سعر لحظي لهذا السهم الآن (السعر المرجعي يظل سعر الترشيح)." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 684,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 676,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 675,
        columnNumber: 9
      }, this),
      todaySignals.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto", "data-tsd-source": "/src/routes/scalp-dip.tsx:802:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:803:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground border-b", "data-tsd-source": "/src/routes/scalp-dip.tsx:804:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:805:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:806:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 695,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:807:19", children: "رُشِّح @" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 696,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:808:19", children: "حدود الشراء" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 697,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:809:19", children: "السعر الحي" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 698,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:810:19", children: "% حي من الترشيح" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 699,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-3 text-right font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:811:19", children: "الحالة" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 700,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 694,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 693,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:814:15", children: todaySignals.map((s) => {
          const st = trackStatus(s);
          return /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15 transition-colors", "data-tsd-source": "/src/routes/scalp-dip.tsx:818:21", children: [
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-bold font-mono text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:819:23", children: [
              s.symbol,
              s._halal && /* @__PURE__ */ jsxDEV("span", { className: "ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans", "data-tsd-source": "/src/routes/scalp-dip.tsx:822:27", children: "شريعة" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 709,
                columnNumber: 38
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 707,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:825:23", children: s._bandLo != null && s._bandHi != null ? `${fmtPrice(s._bandLo)} – ${fmtPrice(s._bandHi)}` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 711,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:828:23", children: s.livePrice != null ? `${fmtPrice(s.livePrice)} ج.م` : /* @__PURE__ */ jsxDEV("span", { className: "text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:832:27", children: "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 715,
              columnNumber: 81
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 714,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: `p-3 font-mono font-bold ${s.livePct == null ? "text-muted-foreground" : s.livePct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:835:23", children: s.livePct != null ? `${s.livePct >= 0 ? "+" : ""}${(s.livePct * 100).toFixed(2)}%` : "—" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 717,
              columnNumber: 23
            }, this),
            /* @__PURE__ */ jsxDEV("td", { className: "p-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:838:23", children: /* @__PURE__ */ jsxDEV("span", { className: `text-[11px] font-bold px-2 py-0.5 rounded bg-muted/60 ${st.cls}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:839:25", children: st.label }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 721,
              columnNumber: 25
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 720,
              columnNumber: 23
            }, this)
          ] }, `lt-${s.id}`, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 706,
            columnNumber: 22
          }, this);
        }) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 703,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 692,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 691,
        columnNumber: 36
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:848:11", children: "لا توجد إشارات في الدفعة الحالية — ستظهر هنا فور أول مسح أسبوعي (الأحد)." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 727,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 674,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:855:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:856:9", children: [
        /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:857:11", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:858:13", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-xl", "data-tsd-source": "/src/routes/scalp-dip.tsx:859:15", children: "💼" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 737,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("h2", { className: "text-lg font-black", "data-tsd-source": "/src/routes/scalp-dip.tsx:860:15", children: [
              "الصفقات المفتوحة قيد المتابعة (",
              activeOpenPositionsList.length,
              ")"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 738,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 736,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground mt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:864:13", children: "متابعة حية مستمرة لكل صفقة تم تأكيد شرائها طوال الأسبوع (5 جلسات) — الخروج الوحيد: افتتاح أول جلسة الأسبوع القادم. بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية عبر تصغير الحجم تلقائياً." }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 742,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 735,
          columnNumber: 11
        }, this),
        activeOpenPositionsList.length > 0 && /* @__PURE__ */ jsxDEV("div", { className: "text-xs font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:870:13", children: [
          "إجمالي الأرباح اللحظية:",
          " ",
          /* @__PURE__ */ jsxDEV("span", { className: totalOpenPnlEgp >= 0 ? "text-bull" : "text-bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:872:15", children: [
            totalOpenPnlEgp >= 0 ? "+" : "",
            Math.round(totalOpenPnlEgp).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 749,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 747,
          columnNumber: 50
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 734,
        columnNumber: 9
      }, this),
      activeOpenPositionsList.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-4", "data-tsd-source": "/src/routes/scalp-dip.tsx:881:11", children: activeOpenPositionsList.map((pos) => {
        const progressPct = Math.min(100, Math.round(pos.daysHeld / 5 * 100));
        return /* @__PURE__ */ jsxDEV("div", { className: `rounded-2xl border p-4 space-y-3 transition-all ${pos.isAnomaly ? "border-amber-500 bg-amber-500/10" : "bg-card border-border hover:border-border/80"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:885:17", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between", "data-tsd-source": "/src/routes/scalp-dip.tsx:893:19", children: [
            /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:894:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "text-base font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:895:23", children: pos.symbol }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 762,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground mr-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:896:23", children: [
                "دخول: ",
                fmtDate(pos.scan_date),
                " @ ",
                fmtPrice(Number(pos.actual_buy_price ?? pos.entry_price)),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 763,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 761,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:900:21", children: [
              /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-black font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:901:23", children: [
                fmtPrice(pos.currentPrice),
                " ج.م"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 768,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("div", { className: `text-[11px] font-bold font-mono ${pos.pnlPct >= 0 ? "text-bull" : "text-bear"}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:904:23", children: [
                pos.pnlPct >= 0 ? "+" : "",
                (pos.pnlPct * 100).toFixed(2),
                "% (",
                pos.pnlEgp >= 0 ? "+" : "",
                Math.round(pos.pnlEgp).toLocaleString(),
                " ج.م)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 771,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 767,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 760,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "space-y-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:917:19", children: [
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:918:21", children: [
              /* @__PURE__ */ jsxDEV("span", { className: "font-semibold text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:919:23", children: "مسار الأسبوع (تقويم EGX):" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 782,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { className: "font-bold text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:922:23", children: [
                "جلسة ",
                Math.min(pos.daysHeld, 5),
                " من 5 (متبقي ",
                pos.daysRemaining,
                " جلسة)"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 785,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 781,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "w-full bg-muted rounded-full h-2 overflow-hidden", "data-tsd-source": "/src/routes/scalp-dip.tsx:926:21", children: /* @__PURE__ */ jsxDEV("div", { className: `h-full rounded-full transition-all ${pos.daysHeld >= 5 ? "bg-primary" : "bg-bull"}`, style: {
              width: `${progressPct}%`
            }, "data-tsd-source": "/src/routes/scalp-dip.tsx:927:23" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 790,
              columnNumber: 23
            }, this) }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 789,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between text-[10px] text-muted-foreground pt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:934:21", children: [
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:935:23", children: "بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية: تصغير الحجم التلقائي" }, void 0, false, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 795,
                columnNumber: 23
              }, this),
              /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:936:23", children: [
                "الخروج: ",
                pos.exitDayName,
                " ",
                pos.exitDate,
                " عند الافتتاح"
              ] }, void 0, true, {
                fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
                lineNumber: 796,
                columnNumber: 23
              }, this)
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 794,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 780,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between pt-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:941:19", children: [
            /* @__PURE__ */ jsxDEV("span", { className: "text-[11px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:942:21", children: [
              pos.shares.toLocaleString(),
              " سهم"
            ] }, void 0, true, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 802,
              columnNumber: 21
            }, this),
            /* @__PURE__ */ jsxDEV("button", { onClick: () => onSold(pos), disabled: busySignal === pos.id, className: "rounded-xl px-4 py-1.5 text-xs font-black bg-bear/20 text-bear hover:bg-bear/30 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:945:21", children: busySignal === pos.id ? "..." : "تم البيع في ثاندر ✓" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 805,
              columnNumber: 21
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 801,
            columnNumber: 19
          }, this)
        ] }, pos.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 759,
          columnNumber: 18
        }, this);
      }) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 756,
        columnNumber: 47
      }, this) : /* @__PURE__ */ jsxDEV("div", { className: "text-center py-6 text-muted-foreground text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:958:11", children: "لا توجد صفقات مفتوحة حالياً. عند ظهور إشارة وضغطك على «تم الشراء»، ستظهر الصفقة هنا وتخضع للمراقبة الحية بالثواني." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 811,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 733,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-muted/20 p-4 space-y-3 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:965:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center gap-2 text-foreground font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:966:9", children: [
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:967:11", children: "📅" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 819,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:968:11", children: "التقويم التشغيلي الصريح لـ EGX وتوزيع الأيام:" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 820,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 818,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid md:grid-cols-2 gap-3 text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:970:9", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:971:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:972:13", children: "دورة الأسبوع (5 جلسات، يتخطى عطلة نهاية الأسبوع):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 824,
            columnNumber: 13
          }, this),
          "الدخول: افتتاح أول جلسة الأسبوع (الأحد) — الخروج: افتتاح أول جلسة الأسبوع القادم.",
          /* @__PURE__ */ jsxDEV("br", { "data-tsd-source": "/src/routes/scalp-dip.tsx:974:13" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 826,
            columnNumber: 13
          }, this),
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:975:13", children: "مثال حي:" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 827,
            columnNumber: 13
          }, this),
          " دخول ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:975:34", children: "الأحد" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 827,
            columnNumber: 85
          }, this),
          " ➔ الأسبوع يمشي (الأحد-الخميس) ➔ الجمعة والسبت خارج الحساب ➔ خروج ",
          /* @__PURE__ */ jsxDEV("b", { "data-tsd-source": "/src/routes/scalp-dip.tsx:975:112", children: "الأحد القادم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 827,
            columnNumber: 214
          }, this),
          " عند الافتتاح. بلا وقف خسارة ولا جني أرباح — الاتنين مُقاسين: يزيدوا الخسارة."
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 823,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "bg-card p-3 rounded-xl border", "data-tsd-source": "/src/routes/scalp-dip.tsx:977:11", children: [
          /* @__PURE__ */ jsxDEV("b", { className: "text-foreground block mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:978:13", children: "مهام عطلة الجمعة والسبت (التحليل المستقل):" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 830,
            columnNumber: 13
          }, this),
          "تُستغل عطلة الجمعة والسبت في تشغيل العمليات التحليلية غير الحية دون تعارض مع التداول:",
          /* @__PURE__ */ jsxDEV("ul", { className: "list-disc pr-4 mt-1 space-y-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:980:13", children: [
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:981:15", children: "إصدار التقرير الأسبوعي الشامل للمحفظة." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 833,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:982:15", children: "فحص مؤشر الألفا (Alpha) ومقارنة الأداء بـ EGX30." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 834,
              columnNumber: 15
            }, this),
            /* @__PURE__ */ jsxDEV("li", { "data-tsd-source": "/src/routes/scalp-dip.tsx:983:15", children: "مراجعة وتحديث قائمة أسهم الشريعة (كل 6 شهور)." }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 835,
              columnNumber: 15
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 832,
            columnNumber: 13
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 829,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 822,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 817,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-4 shadow-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:990:7", children: /* @__PURE__ */ jsxDEV("div", { className: "flex flex-wrap items-end gap-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:991:9", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex-1 min-w-56", "data-tsd-source": "/src/routes/scalp-dip.tsx:992:11", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold mb-1", "data-tsd-source": "/src/routes/scalp-dip.tsx:993:13", children: "💰 رأس المال المتاح للتداول" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 845,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "text-[10px] text-muted-foreground mb-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:994:13", children: "يُحسب عدد المراكز تلقائيًا: TOP_N = رأس المال ÷ 20,000 (من 1 إلى 5 مراكز — الإعداد المدروس N5: أفضل توازن عائد/اتساق مقاس). فوق 100 ألف يزيد حجم المركز الواحد." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 846,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "flex gap-2 items-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:997:13", children: [
          /* @__PURE__ */ jsxDEV("input", { type: "number", min: 1, step: 1e3, value: capitalInput, onChange: (e) => setCapitalInput(e.target.value), placeholder: "مثال: 100000", className: "w-40 rounded-xl border bg-background px-3 py-1.5 text-sm font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:998:15" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 850,
            columnNumber: 15
          }, this),
          /* @__PURE__ */ jsxDEV("button", { onClick: onSaveCapital, disabled: savingCap, className: "rounded-xl px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50", "data-tsd-source": "/src/routes/scalp-dip.tsx:1007:15", children: savingCap ? "جاري الحفظ…" : "حفظ" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 851,
            columnNumber: 15
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 849,
          columnNumber: 13
        }, this),
        capMsg && /* @__PURE__ */ jsxDEV("div", { className: "mt-1 text-[11px]", "data-tsd-source": "/src/routes/scalp-dip.tsx:1015:24", children: capMsg }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 855,
          columnNumber: 24
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 844,
        columnNumber: 11
      }, this),
      sizing && /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-3 gap-2 text-center", "data-tsd-source": "/src/routes/scalp-dip.tsx:1018:13", children: [
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1019:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1020:17", children: "رأس المال الفعّال" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 859,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1021:17", children: [
            Math.round(sizing.total_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 860,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 858,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1023:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1024:17", children: "عدد المراكز (TOP_N)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 863,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1025:17", children: sizing.top_n }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 864,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 862,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border bg-muted/40 px-3 py-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1027:15", children: [
          /* @__PURE__ */ jsxDEV("div", { className: "text-[9px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1028:17", children: "حجم المركز (SLOT)" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 867,
            columnNumber: 17
          }, this),
          /* @__PURE__ */ jsxDEV("div", { className: "text-sm font-bold font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1029:17", children: [
            Math.round(sizing.slot_capital).toLocaleString(),
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 868,
            columnNumber: 17
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 866,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 857,
        columnNumber: 22
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 843,
      columnNumber: 9
    }, this) }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 842,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border bg-card p-5 shadow-sm space-y-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1037:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "flex items-center justify-between border-b pb-3", "data-tsd-source": "/src/routes/scalp-dip.tsx:1038:9", children: /* @__PURE__ */ jsxDEV("div", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1039:11", children: [
        /* @__PURE__ */ jsxDEV("h2", { className: "text-base font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1040:13", children: "📜 سجل القرارات والتنبيهات الموثق (Decision Audit Log)" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 878,
          columnNumber: 13
        }, this),
        /* @__PURE__ */ jsxDEV("p", { className: "text-[10px] text-muted-foreground mt-0.5", "data-tsd-source": "/src/routes/scalp-dip.tsx:1041:13", children: "سجل دائم ومؤرخ بالثانية لكل إشارة صدرت، كل إنذار طوارئ، ورد فعل المستخدم لتوثيق الأداء تاريخياً." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 879,
          columnNumber: 13
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 877,
        columnNumber: 11
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 876,
        columnNumber: 9
      }, this),
      auditLogs.length > 0 ? /* @__PURE__ */ jsxDEV("div", { className: "overflow-x-auto max-h-60", "data-tsd-source": "/src/routes/scalp-dip.tsx:1048:11", children: /* @__PURE__ */ jsxDEV("table", { className: "w-full text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1049:13", children: [
        /* @__PURE__ */ jsxDEV("thead", { className: "bg-muted/40 text-muted-foreground sticky top-0", "data-tsd-source": "/src/routes/scalp-dip.tsx:1050:15", children: /* @__PURE__ */ jsxDEV("tr", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1051:17", children: [
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1052:19", children: "التوقيت" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 889,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1053:19", children: "نوع الحدث" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 890,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1054:19", children: "السهم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 891,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1055:19", children: "السعر" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 892,
            columnNumber: 19
          }, this),
          /* @__PURE__ */ jsxDEV("th", { className: "p-2 text-right", "data-tsd-source": "/src/routes/scalp-dip.tsx:1056:19", children: "تصرف المستخدم" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 893,
            columnNumber: 19
          }, this)
        ] }, void 0, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 888,
          columnNumber: 17
        }, this) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 887,
          columnNumber: 15
        }, this),
        /* @__PURE__ */ jsxDEV("tbody", { className: "divide-y divide-border", "data-tsd-source": "/src/routes/scalp-dip.tsx:1059:15", children: auditLogs.map((log) => /* @__PURE__ */ jsxDEV("tr", { className: "hover:bg-muted/15", "data-tsd-source": "/src/routes/scalp-dip.tsx:1061:19", children: [
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono text-[10px] text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1062:21", children: log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : "—" }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 898,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-semibold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1065:21", children: [
            log.event_type === "USER_BOUGHT" && /* @__PURE__ */ jsxDEV("span", { className: "text-bull", "data-tsd-source": "/src/routes/scalp-dip.tsx:1066:60", children: "🛒 تأكيد شراء" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 902,
              columnNumber: 60
            }, this),
            log.event_type === "USER_SOLD" && /* @__PURE__ */ jsxDEV("span", { className: "text-primary", "data-tsd-source": "/src/routes/scalp-dip.tsx:1067:58", children: "💰 تأكيد بيع" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 903,
              columnNumber: 58
            }, this),
            log.event_type === "EMERGENCY_STOP_LOSS" && /* @__PURE__ */ jsxDEV("span", { className: "text-bear font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1068:68", children: "🚨 إنذار وقف خسارة" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 904,
              columnNumber: 68
            }, this),
            log.event_type === "SIGNAL_10AM" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1069:60", children: "🎯 إشارة 10:00 صباحاً" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 905,
              columnNumber: 60
            }, this),
            log.event_type === "SCHEDULED_EXIT" && /* @__PURE__ */ jsxDEV("span", { "data-tsd-source": "/src/routes/scalp-dip.tsx:1070:63", children: "📅 خروج أسبوعي مجدول" }, void 0, false, {
              fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
              lineNumber: 906,
              columnNumber: 63
            }, this)
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 901,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono font-bold", "data-tsd-source": "/src/routes/scalp-dip.tsx:1072:21", children: log.symbol }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 908,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2 font-mono", "data-tsd-source": "/src/routes/scalp-dip.tsx:1073:21", children: [
            log.trigger_price ? fmtPrice(Number(log.trigger_price)) : "—",
            " ج.م"
          ] }, void 0, true, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 909,
            columnNumber: 21
          }, this),
          /* @__PURE__ */ jsxDEV("td", { className: "p-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1074:21", children: /* @__PURE__ */ jsxDEV("span", { className: "px-2 py-0.5 rounded text-[10px] font-bold bg-muted", "data-tsd-source": "/src/routes/scalp-dip.tsx:1075:23", children: log.user_action }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 911,
            columnNumber: 23
          }, this) }, void 0, false, {
            fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
            lineNumber: 910,
            columnNumber: 21
          }, this)
        ] }, log.id, true, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 897,
          columnNumber: 41
        }, this)) }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 896,
          columnNumber: 15
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 886,
        columnNumber: 13
      }, this) }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 885,
        columnNumber: 33
      }, this) : /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1085:11", children: "لا توجد سجلات قرارات سابقة بعد. كل نقرة شراء أو بيع أو تنبيه طوارئ ستُوثق هنا تلقائياً." }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 918,
        columnNumber: 20
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 875,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("section", { className: "rounded-2xl border border-warn/40 bg-warn/10 p-4 space-y-2", "data-tsd-source": "/src/routes/scalp-dip.tsx:1092:7", children: [
      /* @__PURE__ */ jsxDEV("div", { className: "font-bold text-sm", "data-tsd-source": "/src/routes/scalp-dip.tsx:1093:9", children: "📋 الأداء المُقاس (شريعة فقط — باك-تست صادق 512 أسبوع 2016-2026، تكلفة ثاندر 0.05%)" }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 925,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-2 text-xs", "data-tsd-source": "/src/routes/scalp-dip.tsx:1094:9", children: [
        /* @__PURE__ */ jsxDEV(StatCard, { label: "النظام الحالي (آخر 90 يوم)", value: `~${CURRENT_REGIME_WEEKLY_LOW_EGP.toLocaleString()}-${CURRENT_REGIME_WEEKLY_HIGH_EGP.toLocaleString()} ج.م`, tone: "bull", sub: "أفضل فترة في العقد — ليس حقاً مكتسباً", "data-tsd-source": "/src/routes/scalp-dip.tsx:1095:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 927,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "المتوسط الطويل الموثوق (10 سنين)", value: `${BACKTEST_WEEKLY_EGP.toLocaleString()} ج.م`, tone: "default", sub: `فاصل ثقة 95%: ${BACKTEST_WEEKLY_EGP_LOW.toLocaleString()}-${BACKTEST_WEEKLY_EGP_HIGH.toLocaleString()}`, "data-tsd-source": "/src/routes/scalp-dip.tsx:1096:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 928,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أسوأ أسبوع (10 سنين)", value: `${BACKTEST_WORST_WEEK_PCT.toLocaleString()}%`, tone: "bear", "data-tsd-source": "/src/routes/scalp-dip.tsx:1097:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 929,
          columnNumber: 11
        }, this),
        /* @__PURE__ */ jsxDEV(StatCard, { label: "أقصى تراجع (10 سنين)", value: `${BACKTEST_MAXDD_PCT.toLocaleString()}%`, tone: "bear", sub: "مع الحمايات التلقائية: ~27-30%", "data-tsd-source": "/src/routes/scalp-dip.tsx:1098:11" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 930,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 926,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("div", { className: "rounded-xl border border-border/50 bg-card/60 p-2.5 text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1100:9", children: [
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1101:11", children: "شكل الأسابيع الحقيقي (مقاس):" }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 933,
          columnNumber: 11
        }, this),
        " ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 — أغلب الأسابيع صغيرة أو سالبة والمتوسط بيتحقق من قفزات نادرة (زي +21,500 و+34,900 في يونيو/يوليو 2026) لا يمكن توقيتها.",
        /* @__PURE__ */ jsxDEV("b", { className: "text-foreground", "data-tsd-source": "/src/routes/scalp-dip.tsx:1103:11", children: " ولا يوجد وعد بربح ثابت — مرفوض من كل الأطراف." }, void 0, false, {
          fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
          lineNumber: 935,
          columnNumber: 11
        }, this)
      ] }, void 0, true, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 932,
        columnNumber: 9
      }, this),
      /* @__PURE__ */ jsxDEV("p", { className: "text-xs text-muted-foreground leading-relaxed", "data-tsd-source": "/src/routes/scalp-dip.tsx:1105:9", children: BACKTEST_DISCLAIMER_AR }, void 0, false, {
        fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
        lineNumber: 937,
        columnNumber: 9
      }, this)
    ] }, void 0, true, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 924,
      columnNumber: 7
    }, this),
    /* @__PURE__ */ jsxDEV("footer", { className: "text-center py-4 text-xs text-muted-foreground border-t", "data-tsd-source": "/src/routes/scalp-dip.tsx:1109:7", children: "قواعد فلاتر الاستراتيجية ومعادلاتها مجمدة لمدة 4-6 أسابيع للاختبار والمراقبة الصارمة." }, void 0, false, {
      fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
      lineNumber: 941,
      columnNumber: 7
    }, this)
  ] }, void 0, true, {
    fileName: "D:/meky-stock-main/meky-stock-main/src/routes/scalp-dip.tsx?tsr-split=component",
    lineNumber: 475,
    columnNumber: 10
  }, this);
}
_s(ScalpDipOperationalPage, "vsiiMxyW1jxOKWs5X82F/oNZVVM=", false, function() {
  return [useQuery];
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

//# sourceMappingURL=data:application/json;base64,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QUFBLGFBQUFnSSxLQUFBIiwibmFtZXMiOlsidXNlUXVlcnkiLCJ1c2VTdGF0ZSIsInVzZUVmZmVjdCIsInVzZVJlZiIsImZtdFByaWNlIiwiRGF0YUZyZXNobmVzc0Jhbm5lciIsIkJBQ0tURVNUX0RJU0NMQUlNRVJfQVIiLCJCQUNLVEVTVF9XRUVLTFlfRUdQIiwiQkFDS1RFU1RfV0VFS0xZX0VHUF9MT1ciLCJCQUNLVEVTVF9XRUVLTFlfRUdQX0hJR0giLCJCQUNLVEVTVF9XT1JTVF9XRUVLX1BDVCIsIkJBQ0tURVNUX01BWEREX1BDVCIsIkNVUlJFTlRfUkVHSU1FX1dFRUtMWV9MT1dfRUdQIiwiQ1VSUkVOVF9SRUdJTUVfV0VFS0xZX0hJR0hfRUdQIiwicGxheVNpZ25hbENoaW1lIiwicGxheUVtZXJnZW5jeVNpcmVuIiwicGxheVNjaGVkdWxlZEV4aXRUb25lIiwiU1RSQVRFR1kiLCJBUkFCSUNfREFZX05BTUVTIiwid2Vla2x5Um93VG9TaWduYWwiLCJyIiwiYnV5IiwiYWN0dWFsX2J1eV9wcmljZSIsIk51bWJlciIsImxhc3RDbG9zZSIsImxhc3RfY2xvc2UiLCJpZCIsInNjYW5fZGF0ZSIsIlN0cmluZyIsInN5bWJvbCIsInRvVXBwZXJDYXNlIiwiZW50cnlfcHJpY2UiLCJnYXBfcGN0IiwiYmlkX2RlcHRoX2F0X2VudHJ5IiwicG9zaXRpb25fdmFsdWUiLCJib3VnaHQiLCJidXlfdGltZXN0YW1wIiwiZGF5MV9zdGF0dXMiLCJkYXkxX3ByaWNlIiwiZGF5Ml9zdGF0dXMiLCJkYXkyX3ByaWNlIiwiZGF5M19zdGF0dXMiLCJkYXkzX3ByaWNlIiwiZXhpdF9yZWFzb24iLCJiaWRfY29uZmlybWVkX2F0X2V4aXQiLCJleHRyYV9ob2xkX3VzZWQiLCJzaGFkb3dfZXhpdF9wcmljZSIsInNoYWRvd19wbmwiLCJzaGFkb3dfcG5sX3BjdCIsInNvbGQiLCJhY3R1YWxfc2VsbF9wcmljZSIsInNlbGxfdGltZXN0YW1wIiwicmVhbGl6ZWRfcG5sIiwicmVhbGl6ZWRfcG5sX3BjdCIsInNlbGxfc2lnbmFsIiwic2VsbF9zaWduYWxfcmVhc29uIiwiY3JlYXRlZF9hdCIsInVwZGF0ZWRfYXQiLCJmZXRjaERhc2hib2FyZCIsInJlcyIsImZldGNoIiwianNvbiIsIm1hcmtCb3VnaHRGblVpIiwiYXJncyIsIm1ldGhvZCIsImhlYWRlcnMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImFjdGlvbiIsInNpZ25hbF9pZCIsImRhdGEiLCJwcmljZSIsIm1hcmtTb2xkRm5VaSIsInNhdmVDYXBpdGFsRm4iLCJjYXBpdGFsIiwiZm10RGF0ZSIsImlzbyIsInNsaWNlIiwidHJhY2tTdGF0dXMiLCJzIiwibGFiZWwiLCJjbHMiLCJTdGF0Q2FyZCIsInZhbHVlIiwic3ViIiwidG9uZSIsIl9jIiwiU2NhbHBEaXBPcGVyYXRpb25hbFBhZ2UiLCJfcyIsInJlZmV0Y2giLCJxdWVyeUtleSIsInF1ZXJ5Rm4iLCJyZWZldGNoSW50ZXJ2YWwiLCJzaXppbmciLCJwbGFuIiwiY2FwaXRhbElucHV0Iiwic2V0Q2FwaXRhbElucHV0IiwiTWF0aCIsInJvdW5kIiwidG90YWxfY2FwaXRhbCIsInNhdmluZ0NhcCIsInNldFNhdmluZ0NhcCIsImNhcE1zZyIsInNldENhcE1zZyIsImJ1c3lTaWduYWwiLCJzZXRCdXN5U2lnbmFsIiwiYWN0aW9uTXNnIiwic2V0QWN0aW9uTXNnIiwicHJpY2VPdmVycmlkZXMiLCJzZXRQcmljZU92ZXJyaWRlcyIsInNlY29uZHNSZW1haW5pbmciLCJzZXRTZWNvbmRzUmVtYWluaW5nIiwiaXNXaW5kb3dFeHBpcmVkIiwic2V0SXNXaW5kb3dFeHBpcmVkIiwiaXNCZWZvcmVNYXJrZXQiLCJzZXRJc0JlZm9yZU1hcmtldCIsImRyeVJ1bkFjdGl2ZSIsInNldERyeVJ1bkFjdGl2ZSIsImRyeVJ1blNpbXVsYXRpb25UaW1lIiwic2V0RHJ5UnVuU2ltdWxhdGlvblRpbWUiLCJzaXJlblBsYXllZFJlZiIsImhhc0VtZXJnZW5jeSIsIm9wZW5Qb3NpdGlvbnMiLCJzb21lIiwicCIsImlzQW5vbWFseSIsImN1cnJlbnQiLCJ1cGRhdGVDb3VudGRvd24iLCJwcmV2Iiwibm93IiwiRGF0ZSIsImNhaXJvU3RyIiwidG9Mb2NhbGVTdHJpbmciLCJ0aW1lWm9uZSIsImNhaXJvIiwiaCIsImdldEhvdXJzIiwibSIsImdldE1pbnV0ZXMiLCJnZXRTZWNvbmRzIiwic2Vjb25kc1NpbmNlTWlkbmlnaHQiLCJ3aW5kb3dTdGFydCIsIndpbmRvd0R1cmF0aW9uIiwiZWxhcHNlZCIsImludGVydmFsIiwic2V0SW50ZXJ2YWwiLCJjbGVhckludGVydmFsIiwiZGlzcGxheVNlY29uZHMiLCJtbSIsImZsb29yIiwicGFkU3RhcnQiLCJzcyIsIm9uU2F2ZUNhcGl0YWwiLCJ2IiwiaXNGaW5pdGUiLCJvayIsInRvcF9uIiwic2xvdF9jYXBpdGFsIiwiZXJyb3IiLCJlIiwibWVzc2FnZSIsIm9uQm91Z2h0Iiwic2lnIiwib3ZlcnJpZGVSYXciLCJ1bmRlZmluZWQiLCJzaWduYWwiLCJvblNvbGQiLCJwbmwiLCJ0b0ZpeGVkIiwidG9kYXlTaWduYWxzIiwiYmF0Y2hTY2FuRGF0ZSIsImF1ZGl0TG9ncyIsInNlbGxBbGVydHMiLCJ0b3RhbE9wZW5QbmxFZ3AiLCJyZWR1Y2UiLCJzdW0iLCJwbmxFZ3AiLCJzaW11bGF0ZWRDYW5kaWRhdGVzIiwic2ltdWxhdGVkUG9zaXRpb25zIiwiY3VycmVudFByaWNlIiwicG5sUGN0IiwiZGF5c0hlbGQiLCJkYXlzUmVtYWluaW5nIiwiZXhpdERhdGUiLCJleGl0RGF5TmFtZSIsImlzU2NoZWR1bGVkRXhpdCIsInNoYXJlcyIsImFjdGl2ZUNhbmRpZGF0ZXNMaXN0IiwiYWN0aXZlT3BlblBvc2l0aW9uc0xpc3QiLCJlbWVyZ2VuY3lBbm9tYWx5UG9zaXRpb25zIiwiZmlsdGVyIiwic2NoZWR1bGVkRXhpdFBvc2l0aW9ucyIsImoiLCJjb25zb2xlIiwibG9nIiwiY2F0Y2h1cCIsImxlbmd0aCIsIm1hcCIsIl9oYWxhbCIsInRhcmdldCIsInN0IiwiX2JhbmRMbyIsIl9iYW5kSGkiLCJsaXZlUHJpY2UiLCJsaXZlUGN0IiwicG9zIiwicHJvZ3Jlc3NQY3QiLCJtaW4iLCJ3aWR0aCIsInJlcGxhY2UiLCJldmVudF90eXBlIiwidHJpZ2dlcl9wcmljZSIsInVzZXJfYWN0aW9uIiwiY29tcG9uZW50IiwiX2MyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbInNjYWxwLWRpcC50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3JlYXRlRmlsZVJvdXRlIH0gZnJvbSBcIkB0YW5zdGFjay9yZWFjdC1yb3V0ZXJcIjtcclxuaW1wb3J0IHsgdXNlUXVlcnkgfSBmcm9tIFwiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCI7XHJcbmltcG9ydCB7IHVzZVN0YXRlLCB1c2VFZmZlY3QsIHVzZVJlZiB9IGZyb20gXCJyZWFjdFwiO1xyXG5pbXBvcnQgeyBzdXBhYmFzZUFkbWluIH0gZnJvbSBcIkAvaW50ZWdyYXRpb25zL3N1cGFiYXNlL2NsaWVudC5zZXJ2ZXJcIjtcclxuaW1wb3J0IHsgZm10UHJpY2UgfSBmcm9tIFwiQC9saWIvZm9ybWF0L3ByaWNlXCI7XHJcbmltcG9ydCB7IERhdGFGcmVzaG5lc3NCYW5uZXIgfSBmcm9tIFwiQC9jb21wb25lbnRzL2RhdGEtZnJlc2huZXNzLWJhbm5lclwiO1xyXG5pbXBvcnQge1xyXG4gIEdBUF9QQVJBTVMsXHJcbiAgQkFDS1RFU1RfRElTQ0xBSU1FUl9BUixcclxuICBCQUNLVEVTVF9XRUVLTFlfRUdQLFxyXG4gIEJBQ0tURVNUX1dFRUtMWV9FR1BfTE9XLFxyXG4gIEJBQ0tURVNUX1dFRUtMWV9FR1BfSElHSCxcclxuICBCQUNLVEVTVF9XT1JTVF9XRUVLX1BDVCxcclxuICBCQUNLVEVTVF9NQVhERF9QQ1QsXHJcbiAgQ1VSUkVOVF9SRUdJTUVfV0VFS0xZX0xPV19FR1AsXHJcbiAgQ1VSUkVOVF9SRUdJTUVfV0VFS0xZX0hJR0hfRUdQLFxyXG4gIHNjYW5EYWlseUNhbmRpZGF0ZXMsXHJcbiAgdHJhZGluZ0RheXNFbGFwc2VkLFxyXG4gIGxpdmVTeW1ib2xTdGF0ZSxcclxuICB0eXBlIENhbmRpZGF0ZSxcclxufSBmcm9tIFwiQC9saWIvc2NhbHAtZGlwL21vbWVudHVtLXdlZWtseS5zZXJ2ZXJcIjtcclxuaW1wb3J0IHsgZ2V0SGFsYWxTZXQgfSBmcm9tIFwiQC9saWIvc2NhbHAtZGlwL2hhbGFsLWxpc3Quc2VydmVyXCI7XHJcbmltcG9ydCB7XHJcbiAgbWFya1dlZWtseUJvdWdodCxcclxuICBtYXJrV2Vla2x5U29sZCxcclxuICBnZXRSZWNlbnRBdWRpdExvZ3MsXHJcbiAgdHlwZSBTaWduYWxSb3csXHJcbiAgdHlwZSBEZWNpc2lvbkF1ZGl0Um93LFxyXG59IGZyb20gXCJAL2xpYi9zY2FscC1kaXAvc2NhbHAtZGlwLXNpZ25hbHMuc2VydmVyXCI7XHJcbmltcG9ydCB7XHJcbiAgcGxheVNpZ25hbENoaW1lLFxyXG4gIHBsYXlFbWVyZ2VuY3lTaXJlbixcclxuICBwbGF5U2NoZWR1bGVkRXhpdFRvbmUsXHJcbn0gZnJvbSBcIkAvbGliL3NjYWxwLWRpcC9vcGVyYXRpb25hbC1hdWRpb1wiO1xyXG5cclxuLyoqXHJcbiAqIC9zY2FscC1kaXAgLSBcIti62LHZgdipINin2YTYudmF2YTZitin2Kog4oCUINin2YTZhdmI2YXZhtiq2YUg2KfZhNij2LPYqNmI2LnZiiDYp9mE2K3ZhNin2YQgKDUg2KzZhNiz2KfYqtiMINiv2K7ZiNmEINin2YTYo9it2K8pXCJcclxuICogVW5pZmllZCBPcGVyYXRpb25hbCBEYXNoYm9hcmQ6XHJcbiAqIDEpIDEwOjAwIEFNIHF1YWxpZmllZCBjYW5kaWRhdGVzIHdpdGggMTUtbWludXRlIGNvdW50ZG93biBleGVjdXRpb24gd2luZG93LlxyXG4gKiAyKSBSZWFsLXRpbWUgdHJhY2tpbmcgb2YgYm91Z2h0IHBvc2l0aW9ucyB3aXRoIDQtZGF5IGhvbGRpbmcgcHJvZ3Jlc3Npb24uXHJcbiAqIDMpIFZpc3VhbGx5IGFuZCBhY291c3RpY2FsbHkgZGlzdGluY3QgZW1lcmdlbmN5IGFsZXJ0cyAoYW5vbWFseSkgKyB3ZWVrbHkgZXhpdCBzY2hlZHVsZS5cclxuICogNCkgRXhwbGljaXQgRUdYIGNhbGVuZGFyIGhhbmRsaW5nIChza2lwcGluZyBGcmkvU2F0KS5cclxuICogNSkgUGVybWFuZW50IERlY2lzaW9uIEF1ZGl0IExvZy5cclxuICogNikgRnVsbCBEcnkgUnVuIHNpbXVsYXRpb24gbW9kZSBmb3IgdGVzdGluZy5cclxuICovXHJcblxyXG5jb25zdCBTVFJBVEVHWSA9IFwic2NhbHAtZGlwXCI7XHJcblxyXG5jb25zdCBBUkFCSUNfREFZX05BTUVTID0gW1wi2KfZhNij2K3Yr1wiLCBcItin2YTYp9ir2YbZitmGXCIsIFwi2KfZhNir2YTYp9ir2KfYoVwiLCBcItin2YTYo9ix2KjYudin2KFcIiwgXCLYp9mE2K7ZhdmK2LNcIiwgXCLYp9mE2KzZhdi52KlcIiwgXCLYp9mE2LPYqNiqXCJdO1xyXG5cclxuLyoqIG1vbWVudHVtX3dlZWtseV9zaWduYWxzIHJvdyDihpIgU2lnbmFsUm93LWNvbXBhdGlibGUgc2hhcGUgZm9yIHRoZSBVSVxyXG4gKiAoZW50cnkgcmVmZXJlbmNlID0gYWN0dWFsIGJ1eSBwcmljZSBvbmNlIGZpbGxlZCwgZWxzZSB0aGUgc2lnbmFsIGNsb3NlKS4gKi9cclxuZnVuY3Rpb24gd2Vla2x5Um93VG9TaWduYWwocjogYW55KTogU2lnbmFsUm93IHtcclxuICBjb25zdCBidXkgPSByLmFjdHVhbF9idXlfcHJpY2UgIT0gbnVsbCA/IE51bWJlcihyLmFjdHVhbF9idXlfcHJpY2UpIDogbnVsbDtcclxuICBjb25zdCBsYXN0Q2xvc2UgPSBOdW1iZXIoci5sYXN0X2Nsb3NlKTtcclxuICByZXR1cm4ge1xyXG4gICAgaWQ6IE51bWJlcihyLmlkKSxcclxuICAgIHNjYW5fZGF0ZTogU3RyaW5nKHIuc2Nhbl9kYXRlKSxcclxuICAgIHN5bWJvbDogU3RyaW5nKHIuc3ltYm9sKS50b1VwcGVyQ2FzZSgpLFxyXG4gICAgZW50cnlfcHJpY2U6IGJ1eSA/PyBsYXN0Q2xvc2UsXHJcbiAgICBnYXBfcGN0OiBidXkgIT0gbnVsbCAmJiBsYXN0Q2xvc2UgPiAwID8gYnV5IC8gbGFzdENsb3NlIC0gMSA6IDAsXHJcbiAgICBiaWRfZGVwdGhfYXRfZW50cnk6IDAsXHJcbiAgICBwb3NpdGlvbl92YWx1ZTogTnVtYmVyKHIucG9zaXRpb25fdmFsdWUpIHx8IDAsXHJcbiAgICBib3VnaHQ6ICEhci5ib3VnaHQsXHJcbiAgICBhY3R1YWxfYnV5X3ByaWNlOiBidXksXHJcbiAgICBidXlfdGltZXN0YW1wOiByLmJ1eV90aW1lc3RhbXAgPz8gbnVsbCxcclxuICAgIGRheTFfc3RhdHVzOiBudWxsLFxyXG4gICAgZGF5MV9wcmljZTogbnVsbCxcclxuICAgIGRheTJfc3RhdHVzOiBudWxsLFxyXG4gICAgZGF5Ml9wcmljZTogbnVsbCxcclxuICAgIGRheTNfc3RhdHVzOiBudWxsLFxyXG4gICAgZGF5M19wcmljZTogbnVsbCxcclxuICAgIGV4aXRfcmVhc29uOiByLmV4aXRfcmVhc29uID8/IG51bGwsXHJcbiAgICBiaWRfY29uZmlybWVkX2F0X2V4aXQ6IG51bGwsXHJcbiAgICBleHRyYV9ob2xkX3VzZWQ6IGZhbHNlLFxyXG4gICAgc2hhZG93X2V4aXRfcHJpY2U6IG51bGwsXHJcbiAgICBzaGFkb3dfcG5sOiBudWxsLFxyXG4gICAgc2hhZG93X3BubF9wY3Q6IG51bGwsXHJcbiAgICBzb2xkOiAhIXIuc29sZCxcclxuICAgIGFjdHVhbF9zZWxsX3ByaWNlOiByLmFjdHVhbF9zZWxsX3ByaWNlICE9IG51bGwgPyBOdW1iZXIoci5hY3R1YWxfc2VsbF9wcmljZSkgOiBudWxsLFxyXG4gICAgc2VsbF90aW1lc3RhbXA6IHIuc2VsbF90aW1lc3RhbXAgPz8gbnVsbCxcclxuICAgIHJlYWxpemVkX3BubDogci5yZWFsaXplZF9wbmwgIT0gbnVsbCA/IE51bWJlcihyLnJlYWxpemVkX3BubCkgOiBudWxsLFxyXG4gICAgcmVhbGl6ZWRfcG5sX3BjdDogci5yZWFsaXplZF9wbmxfcGN0ICE9IG51bGwgPyBOdW1iZXIoci5yZWFsaXplZF9wbmxfcGN0KSA6IG51bGwsXHJcbiAgICBzZWxsX3NpZ25hbDogZmFsc2UsXHJcbiAgICBzZWxsX3NpZ25hbF9yZWFzb246IG51bGwsXHJcbiAgICBjcmVhdGVkX2F0OiByLmNyZWF0ZWRfYXQgPz8gbnVsbCxcclxuICAgIHVwZGF0ZWRfYXQ6IHIudXBkYXRlZF9hdCA/PyBudWxsLFxyXG4gIH07XHJcbn1cclxuXHJcbnR5cGUgVHJhZGUgPSB7XHJcbiAgaWQ6IHN0cmluZztcclxuICBzeW1ib2w6IHN0cmluZztcclxuICBlbnRyeV9wcmljZTogbnVtYmVyO1xyXG4gIGVudHJ5X3RzOiBzdHJpbmc7XHJcbiAgZXhpdF9wcmljZTogbnVtYmVyIHwgbnVsbDtcclxuICBleGl0X3RzOiBzdHJpbmcgfCBudWxsO1xyXG4gIGV4aXRfcmVhc29uOiBzdHJpbmcgfCBudWxsO1xyXG4gIHBubDogbnVtYmVyIHwgbnVsbDtcclxuICBwbmxfcGN0OiBudW1iZXIgfCBudWxsO1xyXG4gIHN0YXR1czogc3RyaW5nO1xyXG4gIHRyYWRlX2RhdGU6IHN0cmluZztcclxuICBjYXBpdGFsOiBudW1iZXI7XHJcbn07XHJcblxyXG5leHBvcnQgdHlwZSBFbnJpY2hlZFBvc2l0aW9uID0gU2lnbmFsUm93ICYge1xyXG4gIGN1cnJlbnRQcmljZTogbnVtYmVyO1xyXG4gIHBubEVncDogbnVtYmVyO1xyXG4gIHBubFBjdDogbnVtYmVyO1xyXG4gIGRheXNIZWxkOiBudW1iZXI7XHJcbiAgZGF5c1JlbWFpbmluZzogbnVtYmVyO1xyXG4gIGV4aXREYXRlOiBzdHJpbmc7XHJcbiAgZXhpdERheU5hbWU6IHN0cmluZztcclxuICBpc1NjaGVkdWxlZEV4aXQ6IGJvb2xlYW47XHJcbiAgaXNBbm9tYWx5OiBib29sZWFuO1xyXG4gIHNoYXJlczogbnVtYmVyO1xyXG59O1xyXG5cclxuLyoqIE9uZSBzY2FscF9kaXBfc2lnbmFscyByb3cgKHRoZSBsYXRlc3Qgd2Vla2x5IGJhdGNoKSB3aXRoIGl0cyBMSVZFIHByaWNlXHJcbiAqIGZyb20gbGl2ZVN5bWJvbFN0YXRlIOKAlCB0aGUgbGl2ZS10cmFja2luZyBzZWN0aW9uJ3MgZGF0YSBzaGFwZS4gbGl2ZVBjdCBpc1xyXG4gKiBsaXZlIHZzIHRoZSBub21pbmF0aW9uIHByaWNlIChlbnRyeV9wcmljZSk7IG51bGwgd2hlbiBubyBsaXZlIGZlZWQuICovXHJcbmV4cG9ydCB0eXBlIExpdmVUcmFja2VkU2lnbmFsID0gU2lnbmFsUm93ICYge1xyXG4gIF9oYWxhbDogYm9vbGVhbjtcclxuICBsaXZlUHJpY2U6IG51bWJlciB8IG51bGw7XHJcbiAgbGl2ZVRzOiBzdHJpbmcgfCBudWxsO1xyXG4gIGxpdmVQY3Q6IG51bWJlciB8IG51bGw7XHJcbiAgYmF0Y2hTY2FuRGF0ZTogc3RyaW5nO1xyXG4gIF9iYW5kTG86IG51bWJlciB8IG51bGw7XHJcbiAgX2JhbmRIaTogbnVtYmVyIHwgbnVsbDtcclxufTtcclxuXHJcbi8vIERhc2hib2FyZCBkYXRhICsgYWN0aW9ucyBub3cgY29tZSBmcm9tIHRoZSBwbGFpbiBBUEkgcm91dGVcclxuLy8gL2FwaS9wdWJsaWMvaG9va3Mvc2NhbHAtZGlwLWRhc2hib2FyZCAoMjAyNi0wOS0yNykgLSB0aGUgY3JlYXRlU2VydmVyRm5cclxuLy8gbGF5ZXIgZm9yIHRoaXMgcGFnZSB3YXMgcmVtb3ZlZCBhZnRlciB0aGUgdml0ZSBkZXYgc2VydmVyLWZuIHJlZ2lzdHJ5XHJcbi8vIGJyb2tlIHJlcGVhdGVkbHkgKFwiSW52YWxpZCBzZXJ2ZXIgZnVuY3Rpb24gSURcIikuIFNhbWUgcGF5bG9hZHMgYXMgYmVmb3JlLlxyXG5hc3luYyBmdW5jdGlvbiBmZXRjaERhc2hib2FyZCgpOiBQcm9taXNlPHtcclxuICBwbGFuOiBhbnk7XHJcbiAgaGFsYWxMaXN0OiBzdHJpbmdbXTtcclxuICB0cmFkZXM6IFRyYWRlW107XHJcbiAgdG9kYXlTaWduYWxzOiBMaXZlVHJhY2tlZFNpZ25hbFtdO1xyXG4gIGJhdGNoU2NhbkRhdGU6IHN0cmluZztcclxuICBvcGVuUG9zaXRpb25zOiBFbnJpY2hlZFBvc2l0aW9uW107XHJcbiAgcmVjZW50U2lnbmFsczogU2lnbmFsUm93W107XHJcbiAgc2VsbEFsZXJ0czogU2lnbmFsUm93W107XHJcbiAgYXVkaXRMb2dzOiBEZWNpc2lvbkF1ZGl0Um93W107XHJcbn0+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9hcGkvcHVibGljL2hvb2tzL3NjYWxwLWRpcC1kYXNoYm9hcmRcIik7XHJcbiAgcmV0dXJuIHJlcy5qc29uKCk7XHJcbn1cclxuY29uc3QgbWFya0JvdWdodEZuVWkgPSBhc3luYyAoYXJnczogeyBkYXRhOiB7IHNpZ25hbF9pZDogbnVtYmVyOyBwcmljZT86IG51bWJlciB9IH0pOiBQcm9taXNlPGFueT4gPT4ge1xyXG4gIGNvbnN0IHJlcyA9IGF3YWl0IGZldGNoKFwiL2FwaS9wdWJsaWMvaG9va3Mvc2NhbHAtZGlwLWRhc2hib2FyZFwiLCB7XHJcbiAgICBtZXRob2Q6IFwiUE9TVFwiLFxyXG4gICAgaGVhZGVyczogeyBcIkNvbnRlbnQtVHlwZVwiOiBcImFwcGxpY2F0aW9uL2pzb25cIiB9LFxyXG4gICAgYm9keTogSlNPTi5zdHJpbmdpZnkoeyBhY3Rpb246IFwiYm91Z2h0XCIsIHNpZ25hbF9pZDogYXJncy5kYXRhLnNpZ25hbF9pZCwgcHJpY2U6IGFyZ3MuZGF0YS5wcmljZSB9KSxcclxuICB9KTtcclxuICByZXR1cm4gcmVzLmpzb24oKTtcclxufTtcclxuY29uc3QgbWFya1NvbGRGblVpID0gYXN5bmMgKGFyZ3M6IHsgZGF0YTogeyBzaWduYWxfaWQ6IG51bWJlcjsgcHJpY2U/OiBudW1iZXIgfSB9KTogUHJvbWlzZTxhbnk+ID0+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9hcGkvcHVibGljL2hvb2tzL3NjYWxwLWRpcC1kYXNoYm9hcmRcIiwge1xyXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiBcInNvbGRcIiwgc2lnbmFsX2lkOiBhcmdzLmRhdGEuc2lnbmFsX2lkLCBwcmljZTogYXJncy5kYXRhLnByaWNlIH0pLFxyXG4gIH0pO1xyXG4gIHJldHVybiByZXMuanNvbigpO1xyXG59O1xyXG5jb25zdCBzYXZlQ2FwaXRhbEZuID0gYXN5bmMgKGFyZ3M6IHsgZGF0YTogeyBjYXBpdGFsOiBudW1iZXIgfSB9KTogUHJvbWlzZTxhbnk+ID0+IHtcclxuICBjb25zdCByZXMgPSBhd2FpdCBmZXRjaChcIi9hcGkvcHVibGljL2hvb2tzL3NjYWxwLWRpcC1kYXNoYm9hcmRcIiwge1xyXG4gICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgIGhlYWRlcnM6IHsgXCJDb250ZW50LVR5cGVcIjogXCJhcHBsaWNhdGlvbi9qc29uXCIgfSxcclxuICAgIGJvZHk6IEpTT04uc3RyaW5naWZ5KHsgYWN0aW9uOiBcImNhcGl0YWxcIiwgY2FwaXRhbDogYXJncy5kYXRhLmNhcGl0YWwgfSksXHJcbiAgfSk7XHJcbiAgcmV0dXJuIHJlcy5qc29uKCk7XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgUm91dGUgPSBjcmVhdGVGaWxlUm91dGUoXCIvc2NhbHAtZGlwXCIpKHtcclxuICBjb21wb25lbnQ6IFNjYWxwRGlwT3BlcmF0aW9uYWxQYWdlLFxyXG4gIGVycm9yQ29tcG9uZW50OiAoeyBlcnJvciB9KSA9PiA8ZGl2IGNsYXNzTmFtZT1cInAtNiB0ZXh0LWRlc3RydWN0aXZlXCI+2K7Yt9ijOiB7ZXJyb3IubWVzc2FnZX08L2Rpdj4sXHJcbiAgbm90Rm91bmRDb21wb25lbnQ6ICgpID0+IDxkaXYgY2xhc3NOYW1lPVwicC02XCI+2LrZitixINmF2YjYrNmI2K88L2Rpdj4sXHJcbiAgaGVhZDogKCkgPT4gKHtcclxuICAgIG1ldGE6IFtcclxuICAgICAgeyB0aXRsZTogXCLYutix2YHYqSDYp9mE2LnZhdmE2YrYp9iqIOKAlCDYp9mE2YXZiNmF2YbYqtmFINin2YTYo9iz2KjZiNi52YogKNmC2YXYqSDYs9mG2YjZitipINi32KfYstipKVwiIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBuYW1lOiBcImRlc2NyaXB0aW9uXCIsXHJcbiAgICAgICAgY29udGVudDpcclxuICAgICAgICAgIFwi2YTZiNit2Kkg2KfZhNiq2K3Zg9mFINin2YTYo9iz2KjZiNi52YrYqTog2KrYsdi02YrYrdin2Kog2KfZhNij2K3YryDZhdi5INi52K/Yp9ivINin2YTYqtmG2YHZitiwIDE1INiv2YLZitmC2KnYjCDYqtiq2KjYuSDYrdmKINmE2YTYtdmB2YLYp9iqINi32YjYp9mEINin2YTYo9iz2KjZiNi52Iwg2KXYtNi52KfYsdin2Kog2LfZiNin2LHYpiDYtdmI2KrZitipINmI2KjYtdix2YrYqdiMINmI2KrZgtmI2YrZhSBFR1gg2KfZhNi12LHZititLlwiLFxyXG4gICAgICB9LFxyXG4gICAgXSxcclxuICB9KSxcclxufSk7XHJcblxyXG5mdW5jdGlvbiBmbXREYXRlKGlzbzogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIGlzbyA/IGlzby5zbGljZSgwLCAxMCkgOiBcIuKAlFwiO1xyXG59XHJcblxyXG5mdW5jdGlvbiB0cmFja1N0YXR1cyhzOiBMaXZlVHJhY2tlZFNpZ25hbCk6IHsgbGFiZWw6IHN0cmluZzsgY2xzOiBzdHJpbmcgfSB7XHJcbiAgaWYgKHMuc29sZCkgcmV0dXJuIHsgbGFiZWw6IFwi2YXZj9i62YTZgtipIOKAlCDYqNmK2Lkg2YXYs9is2YQg4pyTXCIsIGNsczogXCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIiB9O1xyXG4gIGlmIChzLnNlbGxfc2lnbmFsKSByZXR1cm4geyBsYWJlbDogXCLYpdi02KfYsdipINio2YrYuSDYp9mE2KLZhiDimqBcIiwgY2xzOiBcInRleHQtYW1iZXItNDAwXCIgfTtcclxuICBpZiAocy5ib3VnaHQpIHJldHVybiB7IGxhYmVsOiBcItmC2YrYryDYp9mE2YXYqtin2KjYudipXCIsIGNsczogXCJ0ZXh0LWJ1bGxcIiB9O1xyXG4gIHJldHVybiB7IGxhYmVsOiBcItio2KfZhtiq2LjYp9ixINin2YTYqtmG2YHZitiwXCIsIGNsczogXCJ0ZXh0LWZvcmVncm91bmRcIiB9O1xyXG59XHJcblxyXG5mdW5jdGlvbiBTdGF0Q2FyZCh7IGxhYmVsLCB2YWx1ZSwgc3ViLCB0b25lID0gXCJkZWZhdWx0XCIgfTogeyBsYWJlbDogc3RyaW5nOyB2YWx1ZTogc3RyaW5nOyBzdWI/OiBzdHJpbmc7IHRvbmU/OiBcImRlZmF1bHRcIiB8IFwiYnVsbFwiIHwgXCJiZWFyXCIgfCBcIm11dGVkXCIgfCBcIndhcm5cIiB9KSB7XHJcbiAgY29uc3QgY2xzID1cclxuICAgIHRvbmUgPT09IFwiYnVsbFwiXHJcbiAgICAgID8gXCJ0ZXh0LWJ1bGxcIlxyXG4gICAgICA6IHRvbmUgPT09IFwiYmVhclwiXHJcbiAgICAgICAgPyBcInRleHQtYmVhclwiXHJcbiAgICAgICAgOiB0b25lID09PSBcIndhcm5cIlxyXG4gICAgICAgICAgPyBcInRleHQtYW1iZXItNDAwXCJcclxuICAgICAgICAgIDogdG9uZSA9PT0gXCJtdXRlZFwiXHJcbiAgICAgICAgICAgID8gXCJ0ZXh0LW11dGVkLWZvcmVncm91bmRcIlxyXG4gICAgICAgICAgICA6IFwidGV4dC1mb3JlZ3JvdW5kXCI7XHJcbiAgcmV0dXJuIChcclxuICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctY2FyZCBib3JkZXIgcm91bmRlZC14bCBwLTMgc2hhZG93LXNtXCI+XHJcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdXBwZXJjYXNlIGZvbnQtbWVkaXVtIHRyYWNraW5nLXdpZGVyIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtYi0xXCI+e2xhYmVsfTwvZGl2PlxyXG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YHRleHQtbGcgZm9udC1leHRyYWJvbGQgZm9udC1tb25vICR7Y2xzfWB9Pnt2YWx1ZX08L2Rpdj5cclxuICAgICAge3N1YiAmJiA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0wLjVcIj57c3VifTwvZGl2Pn1cclxuICAgIDwvZGl2PlxyXG4gICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIFNjYWxwRGlwT3BlcmF0aW9uYWxQYWdlKCkge1xyXG5cclxuICBjb25zdCB7IGRhdGEsIHJlZmV0Y2ggfSA9IHVzZVF1ZXJ5KHtcclxuICAgIHF1ZXJ5S2V5OiBbXCJzY2FscC1kaXAtb3BlcmF0aW9uYWwtZGFzaGJvYXJkXCJdLFxyXG4gICAgcXVlcnlGbjogKCkgPT4gZmV0Y2hEYXNoYm9hcmQoKSxcclxuICAgIHJlZmV0Y2hJbnRlcnZhbDogMTVfMDAwLFxyXG4gIH0pO1xyXG5cclxuICAvLyBDYXBpdGFsIHNldHRpbmdzIHN0YXRlXHJcbiAgY29uc3Qgc2l6aW5nID0gZGF0YT8ucGxhbj8uc2l6aW5nO1xyXG4gIGNvbnN0IFtjYXBpdGFsSW5wdXQsIHNldENhcGl0YWxJbnB1dF0gPSB1c2VTdGF0ZTxzdHJpbmc+KHNpemluZyA/IFN0cmluZyhNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKSkgOiBcIlwiKTtcclxuICBjb25zdCBbc2F2aW5nQ2FwLCBzZXRTYXZpbmdDYXBdID0gdXNlU3RhdGUoZmFsc2UpO1xyXG4gIGNvbnN0IFtjYXBNc2csIHNldENhcE1zZ10gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGlmIChzaXppbmcgJiYgIWNhcGl0YWxJbnB1dCkgc2V0Q2FwaXRhbElucHV0KFN0cmluZyhNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKSkpO1xyXG4gIH0sIFtzaXppbmc/LnRvdGFsX2NhcGl0YWxdKTtcclxuXHJcbiAgLy8gQWN0aW9uIHN0YXRlc1xyXG4gIGNvbnN0IFtidXN5U2lnbmFsLCBzZXRCdXN5U2lnbmFsXSA9IHVzZVN0YXRlPG51bWJlciB8IG51bGw+KG51bGwpO1xyXG4gIGNvbnN0IFthY3Rpb25Nc2csIHNldEFjdGlvbk1zZ10gPSB1c2VTdGF0ZTxzdHJpbmcgfCBudWxsPihudWxsKTtcclxuICBjb25zdCBbcHJpY2VPdmVycmlkZXMsIHNldFByaWNlT3ZlcnJpZGVzXSA9IHVzZVN0YXRlPFJlY29yZDxudW1iZXIsIHN0cmluZz4+KHt9KTtcclxuXHJcbiAgLy8gQ291bnRkb3duIHRpbWVyIHN0YXRlICgxNS1taW4gd2luZG93IGZyb20gMTA6MDAgQU0pXHJcbiAgY29uc3QgW3NlY29uZHNSZW1haW5pbmcsIHNldFNlY29uZHNSZW1haW5pbmddID0gdXNlU3RhdGU8bnVtYmVyPigxNSAqIDYwKTtcclxuICBjb25zdCBbaXNXaW5kb3dFeHBpcmVkLCBzZXRJc1dpbmRvd0V4cGlyZWRdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG4gIGNvbnN0IFtpc0JlZm9yZU1hcmtldCwgc2V0SXNCZWZvcmVNYXJrZXRdID0gdXNlU3RhdGU8Ym9vbGVhbj4oZmFsc2UpO1xyXG5cclxuICAvLyBTaW11bGF0aW9uIChEcnkgUnVuKSBTdGF0ZVxyXG4gIGNvbnN0IFtkcnlSdW5BY3RpdmUsIHNldERyeVJ1bkFjdGl2ZV0gPSB1c2VTdGF0ZTxib29sZWFuPihmYWxzZSk7XHJcbiAgY29uc3QgW2RyeVJ1blNpbXVsYXRpb25UaW1lLCBzZXREcnlSdW5TaW11bGF0aW9uVGltZV0gPSB1c2VTdGF0ZTxudW1iZXI+KDEyICogNjAgKyAzNCk7IC8vIDEybSAzNHNcclxuXHJcbiAgY29uc3Qgc2lyZW5QbGF5ZWRSZWYgPSB1c2VSZWY8Ym9vbGVhbj4oZmFsc2UpO1xyXG5cclxuICAvLyBBdWRpbyBBbGVydHMgb24gRW1lcmdlbmN5IGNvbmRpdGlvbnNcclxuICB1c2VFZmZlY3QoKCkgPT4ge1xyXG4gICAgY29uc3QgaGFzRW1lcmdlbmN5ID0gKGRhdGE/Lm9wZW5Qb3NpdGlvbnMgPz8gW10pLnNvbWUoKHApID0+IHAuaXNBbm9tYWx5KTtcclxuICAgIGlmIChoYXNFbWVyZ2VuY3kgJiYgIXNpcmVuUGxheWVkUmVmLmN1cnJlbnQpIHtcclxuICAgICAgcGxheUVtZXJnZW5jeVNpcmVuKCk7XHJcbiAgICAgIHNpcmVuUGxheWVkUmVmLmN1cnJlbnQgPSB0cnVlO1xyXG4gICAgfSBlbHNlIGlmICghaGFzRW1lcmdlbmN5KSB7XHJcbiAgICAgIHNpcmVuUGxheWVkUmVmLmN1cnJlbnQgPSBmYWxzZTtcclxuICAgIH1cclxuICB9LCBbZGF0YT8ub3BlblBvc2l0aW9uc10pO1xyXG5cclxuICAvLyBSZWFsLXRpbWUgQ2Fpcm8gY291bnRkb3duIGNhbGN1bGF0aW9uXHJcbiAgdXNlRWZmZWN0KCgpID0+IHtcclxuICAgIGZ1bmN0aW9uIHVwZGF0ZUNvdW50ZG93bigpIHtcclxuICAgICAgaWYgKGRyeVJ1bkFjdGl2ZSkge1xyXG4gICAgICAgIHNldERyeVJ1blNpbXVsYXRpb25UaW1lKChwcmV2KSA9PiAocHJldiA+IDAgPyBwcmV2IC0gMSA6IDApKTtcclxuICAgICAgICByZXR1cm47XHJcbiAgICAgIH1cclxuICAgICAgdHJ5IHtcclxuICAgICAgICBjb25zdCBub3cgPSBuZXcgRGF0ZSgpO1xyXG4gICAgICAgIGNvbnN0IGNhaXJvU3RyID0gbm93LnRvTG9jYWxlU3RyaW5nKFwiZW4tVVNcIiwgeyB0aW1lWm9uZTogXCJBZnJpY2EvQ2Fpcm9cIiB9KTtcclxuICAgICAgICBjb25zdCBjYWlybyA9IG5ldyBEYXRlKGNhaXJvU3RyKTtcclxuICAgICAgICBjb25zdCBoID0gY2Fpcm8uZ2V0SG91cnMoKTtcclxuICAgICAgICBjb25zdCBtID0gY2Fpcm8uZ2V0TWludXRlcygpO1xyXG4gICAgICAgIGNvbnN0IHMgPSBjYWlyby5nZXRTZWNvbmRzKCk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY29uZHNTaW5jZU1pZG5pZ2h0ID0gKGggKiA2MCArIG0pICogNjAgKyBzO1xyXG4gICAgICAgIGNvbnN0IHdpbmRvd1N0YXJ0ID0gMTAgKiAzNjAwOyAvLyAxMDowMCBBTVxyXG4gICAgICAgIGNvbnN0IHdpbmRvd0R1cmF0aW9uID0gMTUgKiA2MDsgLy8gMTUgbWlucyAoOTAwcylcclxuXHJcbiAgICAgICAgaWYgKHNlY29uZHNTaW5jZU1pZG5pZ2h0IDwgd2luZG93U3RhcnQpIHtcclxuICAgICAgICAgIHNldElzQmVmb3JlTWFya2V0KHRydWUpO1xyXG4gICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZyh3aW5kb3dEdXJhdGlvbik7XHJcbiAgICAgICAgICBzZXRJc1dpbmRvd0V4cGlyZWQoZmFsc2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzZXRJc0JlZm9yZU1hcmtldChmYWxzZSk7XHJcbiAgICAgICAgICBjb25zdCBlbGFwc2VkID0gc2Vjb25kc1NpbmNlTWlkbmlnaHQgLSB3aW5kb3dTdGFydDtcclxuICAgICAgICAgIGlmIChlbGFwc2VkIDwgd2luZG93RHVyYXRpb24pIHtcclxuICAgICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZyh3aW5kb3dEdXJhdGlvbiAtIGVsYXBzZWQpO1xyXG4gICAgICAgICAgICBzZXRJc1dpbmRvd0V4cGlyZWQoZmFsc2UpO1xyXG4gICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgc2V0U2Vjb25kc1JlbWFpbmluZygwKTtcclxuICAgICAgICAgICAgc2V0SXNXaW5kb3dFeHBpcmVkKHRydWUpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgfSBjYXRjaCB7fVxyXG4gICAgfVxyXG5cclxuICAgIHVwZGF0ZUNvdW50ZG93bigpO1xyXG4gICAgY29uc3QgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCh1cGRhdGVDb3VudGRvd24sIDEwMDApO1xyXG4gICAgcmV0dXJuICgpID0+IGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gIH0sIFtkcnlSdW5BY3RpdmVdKTtcclxuXHJcbiAgY29uc3QgZGlzcGxheVNlY29uZHMgPSBkcnlSdW5BY3RpdmUgPyBkcnlSdW5TaW11bGF0aW9uVGltZSA6IHNlY29uZHNSZW1haW5pbmc7XHJcbiAgY29uc3QgbW0gPSBTdHJpbmcoTWF0aC5mbG9vcihkaXNwbGF5U2Vjb25kcyAvIDYwKSkucGFkU3RhcnQoMiwgXCIwXCIpO1xyXG4gIGNvbnN0IHNzID0gU3RyaW5nKGRpc3BsYXlTZWNvbmRzICUgNjApLnBhZFN0YXJ0KDIsIFwiMFwiKTtcclxuXHJcbiAgY29uc3Qgb25TYXZlQ2FwaXRhbCA9IGFzeW5jICgpID0+IHtcclxuICAgIGNvbnN0IHYgPSBOdW1iZXIoY2FwaXRhbElucHV0KTtcclxuICAgIGlmICghTnVtYmVyLmlzRmluaXRlKHYpIHx8IHYgPD0gMCkge1xyXG4gICAgICBzZXRDYXBNc2coXCLimqDvuI8g2KPYr9iu2YQg2YXYqNmE2LrZi9inINi12K3Zitit2YvYpyDYo9mD2KjYsSDZhdmGINi12YHYsVwiKTtcclxuICAgICAgcmV0dXJuO1xyXG4gICAgfVxyXG4gICAgc2V0U2F2aW5nQ2FwKHRydWUpO1xyXG4gICAgc2V0Q2FwTXNnKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3QgciA9IGF3YWl0IHNhdmVDYXBpdGFsRm4oeyBkYXRhOiB7IGNhcGl0YWw6IHYgfSB9KTtcclxuICAgICAgaWYgKHIub2spIHtcclxuICAgICAgICBzZXRDYXBNc2coYOKchSDYqtmFINin2YTYrdmB2Lg6ICR7ci5zaXppbmcudG9wX259INmF2LHZg9iyIMOXICR7TWF0aC5yb3VuZChyLnNpemluZy5zbG90X2NhcGl0YWwpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFYCk7XHJcbiAgICAgICAgYXdhaXQgcmVmZXRjaCgpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHNldENhcE1zZyhg4p2MICR7ci5lcnJvcn1gKTtcclxuICAgICAgfVxyXG4gICAgfSBjYXRjaCAoZTogYW55KSB7XHJcbiAgICAgIHNldENhcE1zZyhg4p2MINiu2LfYozogJHtlPy5tZXNzYWdlID8/IFwi2LrZitixINmF2LnYsdmI2YFcIn1gKTtcclxuICAgIH0gZmluYWxseSB7XHJcbiAgICAgIHNldFNhdmluZ0NhcChmYWxzZSk7XHJcbiAgICB9XHJcbiAgfTtcclxuXHJcbiAgY29uc3Qgb25Cb3VnaHQgPSBhc3luYyAoc2lnOiBTaWduYWxSb3cpID0+IHtcclxuICAgIHNldEJ1c3lTaWduYWwoc2lnLmlkKTtcclxuICAgIHNldEFjdGlvbk1zZyhudWxsKTtcclxuICAgIHRyeSB7XHJcbiAgICAgIGNvbnN0IG92ZXJyaWRlUmF3ID0gcHJpY2VPdmVycmlkZXNbc2lnLmlkXTtcclxuICAgICAgY29uc3QgcHJpY2UgPSBvdmVycmlkZVJhdyA/IE51bWJlcihvdmVycmlkZVJhdykgOiB1bmRlZmluZWQ7XHJcbiAgICAgIGNvbnN0IHIgPSBhd2FpdCBtYXJrQm91Z2h0Rm5VaSh7IGRhdGE6IHsgc2lnbmFsX2lkOiBzaWcuaWQsIHByaWNlIH0gfSk7XHJcbiAgICAgIGlmIChyLm9rKSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinIUgJHtzaWcuc3ltYm9sfTog2KrZhSDYqtiz2KzZitmEINin2YTYtNix2KfYoSBAICR7Zm10UHJpY2Uoci5zaWduYWw/LmFjdHVhbF9idXlfcHJpY2UgPz8gc2lnLmVudHJ5X3ByaWNlKX0g2Kwu2YVgKTtcclxuICAgICAgICBhd2FpdCByZWZldGNoKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtyLmVycm9yfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtlPy5tZXNzYWdlID8/IFwi2K7Yt9ijXCJ9YCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRCdXN5U2lnbmFsKG51bGwpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IG9uU29sZCA9IGFzeW5jIChzaWc6IFNpZ25hbFJvdykgPT4ge1xyXG4gICAgc2V0QnVzeVNpZ25hbChzaWcuaWQpO1xyXG4gICAgc2V0QWN0aW9uTXNnKG51bGwpO1xyXG4gICAgdHJ5IHtcclxuICAgICAgY29uc3Qgb3ZlcnJpZGVSYXcgPSBwcmljZU92ZXJyaWRlc1tzaWcuaWRdO1xyXG4gICAgICBjb25zdCBwcmljZSA9IG92ZXJyaWRlUmF3ID8gTnVtYmVyKG92ZXJyaWRlUmF3KSA6IHVuZGVmaW5lZDtcclxuICAgICAgY29uc3QgciA9IGF3YWl0IG1hcmtTb2xkRm5VaSh7IGRhdGE6IHsgc2lnbmFsX2lkOiBzaWcuaWQsIHByaWNlIH0gfSk7XHJcbiAgICAgIGlmIChyLm9rKSB7XHJcbiAgICAgICAgY29uc3QgcG5sID0gci5zaWduYWw/LnJlYWxpemVkX3BubDtcclxuICAgICAgICBzZXRBY3Rpb25Nc2coXHJcbiAgICAgICAgICBwbmwgIT0gbnVsbFxyXG4gICAgICAgICAgICA/IGDinIUgJHtzaWcuc3ltYm9sfTog2KrZhSDYqtiz2KzZitmEINin2YTYqNmK2Lkg4oCUINi12KfZgdmKICR7TWF0aC5yb3VuZChOdW1iZXIocG5sKSkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YUgKCR7KE51bWJlcihyLnNpZ25hbD8ucmVhbGl6ZWRfcG5sX3BjdCkgKiAxMDApLnRvRml4ZWQoMil9JSlgXHJcbiAgICAgICAgICAgIDogYOKchSAke3NpZy5zeW1ib2x9OiDYqtmFINiq2LPYrNmK2YQg2KfZhNio2YrYuWAsXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhd2FpdCByZWZldGNoKCk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtyLmVycm9yfWApO1xyXG4gICAgICB9XHJcbiAgICB9IGNhdGNoIChlOiBhbnkpIHtcclxuICAgICAgc2V0QWN0aW9uTXNnKGDinYwgJHtzaWcuc3ltYm9sfTogJHtlPy5tZXNzYWdlID8/IFwi2K7Yt9ijXCJ9YCk7XHJcbiAgICB9IGZpbmFsbHkge1xyXG4gICAgICBzZXRCdXN5U2lnbmFsKG51bGwpO1xyXG4gICAgfVxyXG4gIH07XHJcblxyXG4gIGNvbnN0IHBsYW4gPSBkYXRhPy5wbGFuO1xyXG4gIGNvbnN0IHRvZGF5U2lnbmFscyA9IGRhdGE/LnRvZGF5U2lnbmFscyA/PyBbXTtcclxuICBjb25zdCBiYXRjaFNjYW5EYXRlID0gZGF0YT8uYmF0Y2hTY2FuRGF0ZSA/PyBcIlwiO1xyXG4gIGNvbnN0IG9wZW5Qb3NpdGlvbnMgPSBkYXRhPy5vcGVuUG9zaXRpb25zID8/IFtdO1xyXG4gIGNvbnN0IGF1ZGl0TG9ncyA9IGRhdGE/LmF1ZGl0TG9ncyA/PyBbXTtcclxuICBjb25zdCBzZWxsQWxlcnRzID0gZGF0YT8uc2VsbEFsZXJ0cyA/PyBbXTtcclxuXHJcbiAgLy8gUCZMIE1ldHJpY3NcclxuICBjb25zdCB0b3RhbE9wZW5QbmxFZ3AgPSBvcGVuUG9zaXRpb25zLnJlZHVjZSgoc3VtLCBwKSA9PiBzdW0gKyBwLnBubEVncCwgMCk7XHJcblxyXG4gIC8vIFNpbXVsYXRlZCBjYW5kaWRhdGVzIGFuZCBwb3NpdGlvbnMgZm9yIERyeSBSdW4gTW9kZVxyXG4gIGNvbnN0IHNpbXVsYXRlZENhbmRpZGF0ZXMgPSBbXHJcbiAgICB7XHJcbiAgICAgIGlkOiA5OTkxLFxyXG4gICAgICBzY2FuX2RhdGU6IFwiMjAyNi0wOS0xN1wiLFxyXG4gICAgICBzeW1ib2w6IFwiVE1HSFwiLFxyXG4gICAgICBlbnRyeV9wcmljZTogNTQuMjAsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDE4NSxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogZmFsc2UsXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBpZDogOTk5MixcclxuICAgICAgc2Nhbl9kYXRlOiBcIjIwMjYtMDktMTdcIixcclxuICAgICAgc3ltYm9sOiBcIkZXUllcIixcclxuICAgICAgZW50cnlfcHJpY2U6IDguNjUsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDIxMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogZmFsc2UsXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IHNpbXVsYXRlZFBvc2l0aW9uczogRW5yaWNoZWRQb3NpdGlvbltdID0gW1xyXG4gICAge1xyXG4gICAgICBpZDogOTk5MyxcclxuICAgICAgc2Nhbl9kYXRlOiBcIjIwMjYtMDktMTdcIixcclxuICAgICAgc3ltYm9sOiBcIkNPTUlcIixcclxuICAgICAgZW50cnlfcHJpY2U6IDEzMi41MCxcclxuICAgICAgYWN0dWFsX2J1eV9wcmljZTogMTMyLjUwLFxyXG4gICAgICBidXlfdGltZXN0YW1wOiBcIjIwMjYtMDktMTdUMDg6MDU6MDBaXCIsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDE0LFxyXG4gICAgICBiaWRfZGVwdGhfYXRfZW50cnk6IDQ1MDAwMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogdHJ1ZSxcclxuICAgICAgc29sZDogZmFsc2UsXHJcbiAgICAgIGRheTFfc3RhdHVzOiBcIkhFTERcIixcclxuICAgICAgZGF5MV9wcmljZTogMTMyLjUwLFxyXG4gICAgICBkYXkyX3N0YXR1czogbnVsbCxcclxuICAgICAgZGF5Ml9wcmljZTogbnVsbCxcclxuICAgICAgZGF5M19zdGF0dXM6IG51bGwsXHJcbiAgICAgIGRheTNfcHJpY2U6IG51bGwsXHJcbiAgICAgIGV4aXRfcmVhc29uOiBudWxsLFxyXG4gICAgICBiaWRfY29uZmlybWVkX2F0X2V4aXQ6IG51bGwsXHJcbiAgICAgIGV4dHJhX2hvbGRfdXNlZDogZmFsc2UsXHJcbiAgICAgIHNoYWRvd19leGl0X3ByaWNlOiBudWxsLFxyXG4gICAgICBzaGFkb3dfcG5sOiBudWxsLFxyXG4gICAgICBzaGFkb3dfcG5sX3BjdDogbnVsbCxcclxuICAgICAgYWN0dWFsX3NlbGxfcHJpY2U6IG51bGwsXHJcbiAgICAgIHNlbGxfdGltZXN0YW1wOiBudWxsLFxyXG4gICAgICByZWFsaXplZF9wbmw6IG51bGwsXHJcbiAgICAgIHJlYWxpemVkX3BubF9wY3Q6IG51bGwsXHJcbiAgICAgIHNlbGxfc2lnbmFsOiBmYWxzZSxcclxuICAgICAgc2VsbF9zaWduYWxfcmVhc29uOiBudWxsLFxyXG4gICAgICBjcmVhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIHVwZGF0ZWRfYXQ6IFwiMjAyNi0wOS0xN1QwODowMDowMFpcIixcclxuICAgICAgY3VycmVudFByaWNlOiAxMzUuMjAsXHJcbiAgICAgIHBubEVncDogMTAyLFxyXG4gICAgICBwbmxQY3Q6IDAuMDIwNCxcclxuICAgICAgZGF5c0hlbGQ6IDIsXHJcbiAgICAgIGRheXNSZW1haW5pbmc6IDMsXHJcbiAgICAgIGV4aXREYXRlOiBcIjIwMjYtMDktMjJcIixcclxuICAgICAgZXhpdERheU5hbWU6IFwi2KfZhNir2YTYp9ir2KfYoVwiLFxyXG4gICAgICBpc1NjaGVkdWxlZEV4aXQ6IGZhbHNlLFxyXG4gICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICBzaGFyZXM6IDM3LFxyXG4gICAgfSxcclxuICAgIHtcclxuICAgICAgaWQ6IDk5OTQsXHJcbiAgICAgIHNjYW5fZGF0ZTogXCIyMDI2LTA5LTE3XCIsXHJcbiAgICAgIHN5bWJvbDogXCJFS0hPXCIsXHJcbiAgICAgIGVudHJ5X3ByaWNlOiAxLjMwLFxyXG4gICAgICBhY3R1YWxfYnV5X3ByaWNlOiAxLjMwLFxyXG4gICAgICBidXlfdGltZXN0YW1wOiBcIjIwMjYtMDktMTdUMDg6MDU6MDBaXCIsXHJcbiAgICAgIGdhcF9wY3Q6IDAuMDIyLFxyXG4gICAgICBiaWRfZGVwdGhfYXRfZW50cnk6IDEyMDAwMCxcclxuICAgICAgcG9zaXRpb25fdmFsdWU6IDUwMDAsXHJcbiAgICAgIGJvdWdodDogdHJ1ZSxcclxuICAgICAgc29sZDogZmFsc2UsXHJcbiAgICAgIGRheTFfc3RhdHVzOiBcIkhFTERcIixcclxuICAgICAgZGF5MV9wcmljZTogMS4zMCxcclxuICAgICAgZGF5Ml9zdGF0dXM6IG51bGwsXHJcbiAgICAgIGRheTJfcHJpY2U6IG51bGwsXHJcbiAgICAgIGRheTNfc3RhdHVzOiBudWxsLFxyXG4gICAgICBkYXkzX3ByaWNlOiBudWxsLFxyXG4gICAgICBleGl0X3JlYXNvbjogXCJTVE9QX0xPU1NcIixcclxuICAgICAgYmlkX2NvbmZpcm1lZF9hdF9leGl0OiB0cnVlLFxyXG4gICAgICBleHRyYV9ob2xkX3VzZWQ6IGZhbHNlLFxyXG4gICAgICBzaGFkb3dfZXhpdF9wcmljZTogbnVsbCxcclxuICAgICAgc2hhZG93X3BubDogbnVsbCxcclxuICAgICAgc2hhZG93X3BubF9wY3Q6IG51bGwsXHJcbiAgICAgIGFjdHVhbF9zZWxsX3ByaWNlOiBudWxsLFxyXG4gICAgICBzZWxsX3RpbWVzdGFtcDogbnVsbCxcclxuICAgICAgcmVhbGl6ZWRfcG5sOiBudWxsLFxyXG4gICAgICByZWFsaXplZF9wbmxfcGN0OiBudWxsLFxyXG4gICAgICBzZWxsX3NpZ25hbDogdHJ1ZSxcclxuICAgICAgc2VsbF9zaWduYWxfcmVhc29uOiBcIlNUT1BfTE9TU1wiLFxyXG4gICAgICBjcmVhdGVkX2F0OiBcIjIwMjYtMDktMTdUMDg6MDA6MDBaXCIsXHJcbiAgICAgIHVwZGF0ZWRfYXQ6IFwiMjAyNi0wOS0xN1QwODowMDowMFpcIixcclxuICAgICAgY3VycmVudFByaWNlOiAxLjE1LFxyXG4gICAgICBwbmxFZ3A6IC01NzYsXHJcbiAgICAgIHBubFBjdDogLTAuMTE1NCxcclxuICAgICAgZGF5c0hlbGQ6IDIsXHJcbiAgICAgIGRheXNSZW1haW5pbmc6IDMsXHJcbiAgICAgIGV4aXREYXRlOiBcIjIwMjYtMDktMjJcIixcclxuICAgICAgZXhpdERheU5hbWU6IFwi2KfZhNir2YTYp9ir2KfYoVwiLFxyXG4gICAgICBpc1NjaGVkdWxlZEV4aXQ6IGZhbHNlLFxyXG4gICAgICBpc0Fub21hbHk6IGZhbHNlLFxyXG4gICAgICBzaGFyZXM6IDM4NDYsXHJcbiAgICB9LFxyXG4gIF07XHJcblxyXG4gIGNvbnN0IGFjdGl2ZUNhbmRpZGF0ZXNMaXN0ID0gZHJ5UnVuQWN0aXZlID8gc2ltdWxhdGVkQ2FuZGlkYXRlcyA6IHRvZGF5U2lnbmFscztcclxuICBjb25zdCBhY3RpdmVPcGVuUG9zaXRpb25zTGlzdCA9IGRyeVJ1bkFjdGl2ZSA/IHNpbXVsYXRlZFBvc2l0aW9ucyA6IG9wZW5Qb3NpdGlvbnM7XHJcblxyXG4gIGNvbnN0IGVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMgPSBhY3RpdmVPcGVuUG9zaXRpb25zTGlzdC5maWx0ZXIoKHApID0+IHAuaXNBbm9tYWx5KTtcclxuICBjb25zdCBzY2hlZHVsZWRFeGl0UG9zaXRpb25zID0gYWN0aXZlT3BlblBvc2l0aW9uc0xpc3QuZmlsdGVyKChwKSA9PiBwLmlzU2NoZWR1bGVkRXhpdCk7XHJcblxyXG4gIHJldHVybiAoXHJcbiAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBtZDpwLTYgbWF4LXctNnhsIG14LWF1dG8gc3BhY2UteS01XCIgZGlyPVwicnRsXCI+XHJcbiAgICAgIDxEYXRhRnJlc2huZXNzQmFubmVyIC8+XHJcblxyXG4gICAgICB7LyogQ29udHJvbCBIZWFkZXIgJiBEcnkgUnVuIFN3aXRjaCAqL31cclxuICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJmbGV4IGZsZXgtd3JhcCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGdhcC0zIGJnLWNhcmQgYm9yZGVyIHJvdW5kZWQtMnhsIHAtNCBzaGFkb3ctc21cIj5cclxuICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPuKaoTwvc3Bhbj5cclxuICAgICAgICAgICAgPGgxIGNsYXNzTmFtZT1cInRleHQtMnhsIGZvbnQtYmxhY2sgdHJhY2tpbmctdGlnaHRcIj7Yutix2YHYqSDYp9mE2LnZhdmE2YrYp9iqIOKAlCDYp9mE2YXZiNmF2YbYqtmFINin2YTYo9iz2KjZiNi52YogKNmC2YXYqSDYs9mG2YjZitipINi32KfYstipKTwvaDE+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cclxuICAgICAgICAgICAg2KPYqtmF2KrYqSDZg9in2YXZhNipINmE2YTZhdiz2K0g2YjYp9mE2YXYqtin2KjYudipIOKAoiDZhti42KfZhSDYo9iz2KjZiNi52Yo6INiv2K7ZiNmEINin2YTYo9it2K/YjCDYrtix2YjYrCDYp9mB2KrYqtin2K0g2KfZhNij2LPYqNmI2Lkg2KfZhNmC2KfYr9mFIOKAoiDYr9mI2LHZgyDYp9mE2YjYrdmK2K86INi22LrYtyDYstixINin2YTYtNix2KfYoSDYo9mIINin2YTYqNmK2Lkg2YHZiiDYq9in2YbYr9ixINio2LnYryDYp9mE2KrZhtio2YrZhy5cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgY2xhc3NOYW1lPVwibXQtMiB0ZXh0LXhzIHB4LTMgcHktMS41IHJvdW5kZWQtbGcgYm9yZGVyIGJnLW11dGVkIGhvdmVyOmJnLWFjY2VudCB0cmFuc2l0aW9uXCJcclxuICAgICAgICAgICAgb25DbGljaz17YXN5bmMgKCkgPT4ge1xyXG4gICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCByID0gYXdhaXQgZmV0Y2goXCIvYXBpL3B1YmxpYy9ob29rcy9hcmNoaXZlLWZvbGRlcj9hY3Rpb249b3BlblwiKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGogPSBhd2FpdCByLmpzb24oKTtcclxuICAgICAgICAgICAgICAgIGlmIChqLm9rKSBjb25zb2xlLmxvZyhcImFyY2hpdmU6XCIsIGouY2F0Y2h1cCk7XHJcbiAgICAgICAgICAgICAgfSBjYXRjaCB7fVxyXG4gICAgICAgICAgICB9fVxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICDwn5OBINmB2KrYrSDZhdis2YTYryDYo9ix2LTZitmBINin2YTYqNmK2KfZhtin2Kog2KfZhNmK2YjZhdmK2KlcclxuICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcclxuICAgICAgICAgICAgICBzZXREcnlSdW5BY3RpdmUoIWRyeVJ1bkFjdGl2ZSk7XHJcbiAgICAgICAgICAgICAgaWYgKCFkcnlSdW5BY3RpdmUpIHtcclxuICAgICAgICAgICAgICAgIHBsYXlTaWduYWxDaGltZSgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfX1cclxuICAgICAgICAgICAgY2xhc3NOYW1lPXtgcm91bmRlZC14bCBweC0zLjUgcHktMiB0ZXh0LXhzIGZvbnQtYm9sZCB0cmFuc2l0aW9uLWFsbCBib3JkZXIgJHtcclxuICAgICAgICAgICAgICBkcnlSdW5BY3RpdmVcclxuICAgICAgICAgICAgICAgID8gXCJiZy1hbWJlci01MDAvMjAgdGV4dC1hbWJlci0zMDAgYm9yZGVyLWFtYmVyLTUwMC80MCBzaGFkb3ctc20gc2hhZG93LWFtYmVyLTUwMC8xMFwiXHJcbiAgICAgICAgICAgICAgICA6IFwiYmctbXV0ZWQgaG92ZXI6YmctbXV0ZWQvNzAgdGV4dC1mb3JlZ3JvdW5kIGJvcmRlci1ib3JkZXJcIlxyXG4gICAgICAgICAgICB9YH1cclxuICAgICAgICAgID5cclxuICAgICAgICAgICAge2RyeVJ1bkFjdGl2ZSA/IFwi8J+nqiDZiNi22Lkg2KfZhNmF2K3Yp9mD2KfYqSDZhdmB2LnZkdmEIOKckyAo2KXZitmC2KfZgSlcIiA6IFwi8J+nqiDYqtis2LHYqNipINin2YTZhdit2KfZg9in2KkgKERyeSBSdW4pXCJ9XHJcbiAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcmVmZXRjaCgpfVxyXG4gICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTMuNSBweS0yIHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy1tdXRlZCBob3ZlcjpiZy1tdXRlZC83MCB0ZXh0LWZvcmVncm91bmQgYm9yZGVyIGJvcmRlci1ib3JkZXJcIlxyXG4gICAgICAgICAgPlxyXG4gICAgICAgICAgICDYqtit2K/ZitirINin2YTYqNmK2KfZhtin2Kog8J+UhFxyXG4gICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgIDwvaGVhZGVyPlxyXG5cclxuICAgICAgey8qIERyeSBSdW4gQ29udHJvbHMgJiBBdWRpbyBUZXN0IEJ1dHRvbnMgKi99XHJcbiAgICAgIHtkcnlSdW5BY3RpdmUgJiYgKFxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYmctYW1iZXItOTUwLzMwIGJvcmRlciBib3JkZXItYW1iZXItNTAwLzMwIHJvdW5kZWQteGwgcC0zIGZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTIgdGV4dC14c1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWxnXCI+8J+SoTwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1zZW1pYm9sZCB0ZXh0LWFtYmVyLTIwMFwiPlxyXG4gICAgICAgICAgICAgINij2YbYqiDYp9mE2KLZhiDZgdmKINmI2LbYuSDYp9mE2YXYrdin2YPYp9ipINin2YTYqtis2LHZitio2YrYqTog2KfYrtiq2KjYsSDZhdi42YfYsSDYp9mE2LnYr9in2K8g2KfZhNiq2YbYp9iy2YTZiiDZiNiq2YbYqNmK2YfYp9iqINin2YTYt9mI2KfYsdimINmI2KrYrNix2KjYqSDYp9mE2KPYtdmI2KfYqiDZgtio2YQg2KjYr9ihINin2YTYrNmE2LPYqSDYp9mE2K3ZgtmK2YLZitipLlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTJcIj5cclxuICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHBsYXlTaWduYWxDaGltZSgpfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cImJnLWJ1bGwvMjAgaG92ZXI6YmctYnVsbC8zMCB0ZXh0LWJ1bGwgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGRcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAg8J+UlCDZhti62YXYqSDYp9mE2KXYtNin2LHYqSAoMTA6MDApXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gcGxheUVtZXJnZW5jeVNpcmVuKCl9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwiYmctYmVhci8yMCBob3ZlcjpiZy1iZWFyLzMwIHRleHQtYmVhciBweC0yLjUgcHktMSByb3VuZGVkIHRleHQtWzExcHhdIGZvbnQtYm9sZFwiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICDwn5qoINi12YHYp9ix2Kkg2KfZhNi32YjYp9ix2KZcclxuICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBwbGF5U2NoZWR1bGVkRXhpdFRvbmUoKX1cclxuICAgICAgICAgICAgICBjbGFzc05hbWU9XCJiZy1wcmltYXJ5LzIwIGhvdmVyOmJnLXByaW1hcnkvMzAgdGV4dC1wcmltYXJ5LWZvcmVncm91bmQgcHgtMi41IHB5LTEgcm91bmRlZCB0ZXh0LVsxMXB4XSBmb250LWJvbGRcIlxyXG4gICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAg8J+ThSDZhti62YXYqSDYp9mE2KjZiti5INin2YTZhdis2K/ZiNmEXHJcbiAgICAgICAgICAgIDwvYnV0dG9uPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFBSSU9SSVRZIDE6IEVNRVJHRU5DWSBBTEVSVFMgKEFOT01BTElFUyAmIFNDSEVEVUxFRCBFWElUUykg4pSA4pSAICovfVxyXG4gICAgICB7KGVtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMubGVuZ3RoID4gMCB8fCBzZWxsQWxlcnRzLmxlbmd0aCA+IDApICYmIChcclxuICAgICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJzcGFjZS15LTNcIj5cclxuICAgICAgICAgIHsvKiBBbm9tYWx5IC8gTmVnYXRpdmUgTmV3cyBFbWVyZ2VuY3kgQmFubmVyICovfVxyXG4gICAgICAgICAge2VtZXJnZW5jeUFub21hbHlQb3NpdGlvbnMubWFwKChwKSA9PiAoXHJcbiAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICBrZXk9e2Bhbm9tLSR7cC5pZH1gfVxyXG4gICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlci0yIGJvcmRlci1hbWJlci01MDAgYmctYW1iZXItNTAwLzIwIHAtNCBzaGFkb3ctbWQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJsYWNrIHRleHQtYW1iZXItMzAwXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2KrZhtio2YrZhyDYt9mI2KfYsdimOiB7cC5zeW1ib2x9IOKAlCDYqtit2YLZgiDZgdmI2LHYp9mLINmF2YYg2KfZhNiz2YfZhSFcclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWFtYmVyLTIwMC85MCBtdC0wLjVcIj5cclxuICAgICAgICAgICAgICAgICAgICDYp9mE2LPYqNioOiDYsdi12K8g2K7YqNixINiz2YTYqNmKINit2KfYryDYo9mIINiq2YLZhNioINin2LPYqtir2YbYp9im2Yog2LrZitixINmF2KrZiNmC2Lkg2YrZh9iv2K8g2KfZhNi12YHZgtipINmC2KjZhCDYp9mD2KrZhdin2YQg2YXYr9ipINin2YTZhdiz2YMuXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Tb2xkKHApfVxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ9e2J1c3lTaWduYWwgPT09IHAuaWR9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTQgcHktMiB0ZXh0LXhzIGZvbnQtYm9sZCBiZy1hbWJlci02MDAgaG92ZXI6YmctYW1iZXItNTAwIHRleHQtd2hpdGVcIlxyXG4gICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgINiq2K7Yp9ix2Kwg2KfYtti32LHYp9ix2YpcclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApKX1cclxuXHJcbiAgICAgICAgICB7LyogU2NoZWR1bGVkIFNlbGwgQWxlcnRzIGZyb20gYmFja2VuZCAqL31cclxuICAgICAgICAgIHtzZWxsQWxlcnRzLm1hcCgocykgPT4gKFxyXG4gICAgICAgICAgICA8ZGl2XHJcbiAgICAgICAgICAgICAga2V5PXtgc2EtJHtzLmlkfWB9XHJcbiAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyLTIgYm9yZGVyLXByaW1hcnkvNTAgYmctcHJpbWFyeS8xNSBwLTQgZmxleCBmbGV4LXdyYXAgaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBnYXAtM1wiXHJcbiAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0zXCI+XHJcbiAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LTJ4bFwiPvCfk4U8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ibGFjayB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgINit2KfZhiDZiNmC2Kog2KfZhNio2YrYuSDYp9mE2YXYrNiv2YjZhDoge3Muc3ltYm9sfSAo2KfZg9iq2YXZhNiqIDUg2KzZhNiz2KfYqiDigJQg2K7YsdmI2Kwg2KfZgdiq2KrYp9itINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhSlcclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMC41XCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2YbZh9in2YrYqSDZgdiq2LHYqSDYp9mE2YXYs9mDINin2YTYo9iz2KjZiNi52YrYqS4g2KfZhNiu2LHZiNisINio2LPYudixINin2YTYs9mI2YIg2YHZiiDYqti32KjZitmCINir2KfZhtiv2LEg2LnZhtivINin2YTYp9mB2KrYqtin2K0g4oCUINmG2YHYsyDZgtin2LnYr9ipINin2YTZgtmK2KfYsyDYp9mE2KrYp9ix2YrYrtmKLlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxidXR0b25cclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IG9uU29sZChzKX1cclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtidXN5U2lnbmFsID09PSBzLmlkfVxyXG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTIgdGV4dC14cyBmb250LWJvbGQgYmctcHJpbWFyeSB0ZXh0LXByaW1hcnktZm9yZWdyb3VuZCBob3ZlcjpiZy1wcmltYXJ5LzkwXCJcclxuICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcy5pZCA/IFwiLi4uXCIgOiBcItiq2YUg2KfZhNio2YrYuSDinJNcIn1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApKX1cclxuICAgICAgICA8L3NlY3Rpb24+XHJcbiAgICAgICl9XHJcblxyXG4gICAgICB7YWN0aW9uTXNnICYmIChcclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLWNhcmQgcC0zIHRleHQteHMgZm9udC1ib2xkIHRleHQtYnVsbCBmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgPHNwYW4+8J+UlDwvc3Bhbj5cclxuICAgICAgICAgIDxzcGFuPnthY3Rpb25Nc2d9PC9zcGFuPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICApfVxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDE6IDEwOjAwIEFNIFFVQUxJRklFRCBDQU5ESURBVEVTICYgQ09VTlRET1dOIFRJTUVSIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn46vPC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj7Ypdi02KfYsdin2Kog2KfZhNmK2YjZhSAo2KfZhNiz2KfYudipIDEwOjAwINi12KjYp9it2KfZiyk8L2gyPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteHMgcHgtMi41IHB5LTAuNSByb3VuZGVkLWZ1bGwgYmctcHJpbWFyeS8yMCB0ZXh0LXByaW1hcnkgZm9udC1ib2xkXCI+XHJcbiAgICAgICAgICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubGVuZ3RofSDZhdix2LTYrVxyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDxwIGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIG10LTFcIj5cclxuICAgICAgICAgICAgICDYp9mE2KPYs9mH2YUg2KfZhNmF2KTZh9mE2Kkg2KjYudivINmD2YQg2YHZhNin2KrYsSDYp9mE2YbYuNin2YUg2KfZhNi12KfYr9mCOiDYtNix2YrYudipINmB2YLYtyArINiz2YrZiNmE2Kkg4omlIDIwMCDYo9mE2YEg2Kwu2YUv2YrZiNmFICjYo9i52YTZiSAxMDApICsg2LLYrtmFIDUg2KzZhNiz2KfYqiDYqNmK2YYgOCUtNDUlICsg2YHZhNiq2LEg2KfZhNmG2LjYp9mFICjYqtix2KfZg9mFIDEwINij2LPYp9io2YrYuSkgKyDZgtin2LnYr9ipINin2YTZgdis2YjYqSDYudmG2K8g2KfZhNin2YHYqtiq2KfYrSAoLTMlINil2YTZiSArMiUpLlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7LyogMTUtTWludXRlIENvdW50ZG93biBXaW5kb3cgKi99XHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgIHshaXNXaW5kb3dFeHBpcmVkID8gKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC14bCBiZy1idWxsLzE1IGJvcmRlciBib3JkZXItYnVsbC8zMCBweC0zLjUgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1iYXNlIGFuaW1hdGUtcHVsc2VcIj7ij7HvuI88L3NwYW4+XHJcbiAgICAgICAgICAgICAgICA8ZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzEwcHhdIHRleHQtYnVsbCBmb250LWJvbGRcIj7Zhtin2YHYsNipINin2YTYqtmG2YHZitiwINin2YTZhdmI2LXZiSDYqNmH2Kc8L2Rpdj5cclxuICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ibGFjayBmb250LW1vbm8gdGV4dC1idWxsIHRyYWNraW5nLXdpZGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2YXYqtio2YLZiiB7bW19Ontzc30g2K/ZgtmK2YLYqVxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgZ2FwLTIgcm91bmRlZC14bCBiZy1hbWJlci01MDAvMTUgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvNDAgcHgtMy41IHB5LTJcIj5cclxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZVwiPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gdGV4dC1hbWJlci00MDAgZm9udC1ib2xkXCI+2KfZhtiq2YfYqiDZhtin2YHYsNipINin2YTZgCAxNSDYr9mC2YrZgtipPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWFtYmVyLTMwMCBmb250LXNlbWlib2xkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAg2KfZhNmB2LHYtdipINin2YTYo9i12YTZitipINio2LnZitiv2Kkg4oCUINiq2K3ZgtmCINmF2YYg2KfZhNiz2LnYsSDZgtio2YQg2KfZhNi02LHYp9ihXHJcbiAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICl9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgey8qIFdhcm5pbmcgQmFubmVyIGlmIExhdGUgKi99XHJcbiAgICAgICAge2lzV2luZG93RXhwaXJlZCAmJiAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1hbWJlci01MDAvMzAgYmctYW1iZXItNTAwLzEwIHAtMyB0ZXh0LXhzIHRleHQtYW1iZXItMzAwIGZsZXggaXRlbXMtY2VudGVyIGdhcC0yXCI+XHJcbiAgICAgICAgICAgIDxzcGFuPuKaoO+4jzwvc3Bhbj5cclxuICAgICAgICAgICAgPHNwYW4+XHJcbiAgICAgICAgICAgICAgPGI+2KrZhtio2YrZhyDYqtij2K7YsTo8L2I+INiq2KzYp9mI2LLYqiDZhdiv2Kkg2KfZhNmAIDE1INiv2YLZitmC2Kkg2KfZhNij2YjZhNmJINmF2YYg2KfZhNis2YTYs9ipLiDYp9mE2KXYtNin2LHYp9iqINmE2Kcg2KrZj9it2LDZgSDYqtmE2YLYp9im2YrYp9mLINit2LHYtdin2Ysg2LnZhNmJINi52K/ZhSDYqtmB2YjZitiqINin2YTZgdix2LXYjCDZiNmE2YPZhiDYqtij2YPYryDZhdmGINiz2LnYsSDYp9mE2LPZh9mFINin2YTYrdin2YTZiiDZgdmKINiq2LfYqNmK2YIg2KvYp9mG2K/YsSDZgtio2YQg2KfZhNi22LrYtyDYudmE2Ykg2KfZhNi02LHYp9ihLlxyXG4gICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG5cclxuICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLWJcIj5cclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9mH2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2LPYudixINil2LTYp9ix2Kkg2KfZhNiv2K7ZiNmEPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtiy2K7ZhSA1INis2YTYs9in2KogJTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTMgdGV4dC1yaWdodCBmb250LWJvbGRcIj7ZgtmK2YXYqSDYp9mE2YXYsdmD2LIg2KfZhNmF2K7Yt9i3PC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9i52LEg2KfZhNmF2YbZgdiwICjYpdmGINin2K7YqtmE2YEpPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LWNlbnRlciBmb250LWJvbGRcIj7Yp9mE2KXYrNix2KfYoSDZgdmKINir2KfZhtiv2LE8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtYm9yZGVyXCI+XHJcbiAgICAgICAgICAgICAgICB7YWN0aXZlQ2FuZGlkYXRlc0xpc3QubWFwKChzKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e3MuaWR9IGNsYXNzTmFtZT1cImhvdmVyOmJnLW11dGVkLzE1IHRyYW5zaXRpb24tY29sb3JzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMyBmb250LWJvbGQgZm9udC1tb25vIHRleHQtc21cIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtzLnN5bWJvbH1cclxuICAgICAgICAgICAgICAgICAgICAgIHsocyBhcyBhbnkpLl9oYWxhbCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIm1sLTEgdGV4dC1bMTBweF0gcHgtMS41IHB5LTAuNSByb3VuZGVkIGJnLWVtZXJhbGQtNTAwLzE1IHRleHQtZW1lcmFsZC01MDAgZm9udC1zYW5zXCI+2LTYsdmK2LnYqTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtbW9ubyBmb250LWJvbGQgdGV4dC1mb3JlZ3JvdW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7Zm10UHJpY2UoTnVtYmVyKHMuZW50cnlfcHJpY2UpKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtYm9sZCB0ZXh0LWJlYXJcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICt7KE51bWJlcihzLmdhcF9wY3QpICogMTAwKS50b0ZpeGVkKDIpfSVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtc2VtaWJvbGRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtNYXRoLnJvdW5kKE51bWJlcihzLnBvc2l0aW9uX3ZhbHVlKSkudG9Mb2NhbGVTdHJpbmcoKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlPVwibnVtYmVyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RlcD1cIjAuMDFcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBwbGFjZWhvbGRlcj17Zm10UHJpY2UoTnVtYmVyKHMuZW50cnlfcHJpY2UpKX1cclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWU9e3ByaWNlT3ZlcnJpZGVzW3MuaWRdID8/IFwiXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0UHJpY2VPdmVycmlkZXMoKHApID0+ICh7IC4uLnAsIFtzLmlkXTogZS50YXJnZXQudmFsdWUgfSkpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTI0IHJvdW5kZWQtbGcgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMiBweS0xIHRleHQteHMgZm9udC1tb25vXCJcclxuICAgICAgICAgICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIHRleHQtY2VudGVyXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7IXMuYm91Z2h0ID8gKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8YnV0dG9uXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Cb3VnaHQocyBhcyBTaWduYWxSb3cpfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGRpc2FibGVkPXtidXN5U2lnbmFsID09PSBzLmlkfVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInJvdW5kZWQteGwgcHgtNCBweS0xLjUgdGV4dC14cyBmb250LWJsYWNrIGJnLWJ1bGwgdGV4dC1idWxsLWZvcmVncm91bmQgaG92ZXI6YmctYnVsbC85MCB0cmFuc2l0aW9uLWFsbCBzaGFkb3ctc20gZGlzYWJsZWQ6b3BhY2l0eS01MFwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgID5cclxuICAgICAgICAgICAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcy5pZCA/IFwi2KzYp9ix2Yog2KfZhNit2YHYuC4uLlwiIDogXCLYqtmFINin2YTYtNix2KfYoSDinJNcIn1cclxuICAgICAgICAgICAgICAgICAgICAgICAgPC9idXR0b24+XHJcbiAgICAgICAgICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LXhzIGZvbnQtYm9sZCB0ZXh0LWJ1bGwgYmctYnVsbC8yMCBweC0zIHB5LTEgcm91bmRlZC1mdWxsXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAg2KrZhSDYp9mE2LTYsdin2KEg2YLZitivINin2YTZhdiq2KfYqNi52Kkg4pyTXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICl9XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICkpfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS02IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICAgIHtpc0JlZm9yZU1hcmtldFxyXG4gICAgICAgICAgICAgID8gXCLwn5WSINmG2YbYqti42LEg2KjYr9ihINis2YTYs9ipINin2YTYqtiv2KfZiNmEINmB2Yog2KrZhdin2YUg2KfZhNiz2KfYudipIDEwOjAwINi12KjYp9it2KfZiyDZhNil2LfZhNin2YIg2KXYtNin2LHYp9iqINin2YTZitmI2YUuXCJcclxuICAgICAgICAgICAgICA6IFwi2YTYpyDZhdix2LTYrdmK2YYg2K/Yp9iu2YQg2YbYt9in2YIg2KfZhNiy2K7ZhSAoOCUtNDUlKSDZh9iw2Kcg2KfZhNij2LPYqNmI2Lkg4oCUINij2Ygg2YHZhNiq2LEg2KfZhNmG2LjYp9mFINij2YjZgtmBINin2YTYqtiv2KfZiNmELiDYp9mE2YbYuNin2YUg2KPYs9io2YjYudmKOiDYp9mE2K/YrtmI2YQg2KfZhNij2K3YryDZgdmC2LcuXCJ9XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApfVxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gMS41OiBMSVZFIFRSQUNLSU5HIOKAlCBFVkVSWSBTSUdOQUwgUk9XOiBOT01JTkFUSU9OIOKGkCBMSVZFIOKGkCAlIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn5SOPC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj7Yp9mE2KrYqtio2Lkg2KfZhNit2Yog4oCUINmD2YQg2KXYtNin2LHYqSDZgdmKINin2YTYr9mB2LnYqSDYp9mE2K3Yp9mE2YrYqTwvaDI+XHJcbiAgICAgICAgICAgICAge2JhdGNoU2NhbkRhdGUgJiYgKFxyXG4gICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTBweF0gcHgtMiBweS0wLjUgcm91bmRlZC1mdWxsIGJnLW11dGVkIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBmb250LWJvbGQgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAgICAgINiv2YHYudipINmF2LPYrSB7YmF0Y2hTY2FuRGF0ZX1cclxuICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMVwiPlxyXG4gICAgICAgICAgICAgINix2Y/YtNmQ2ZHYrSDYqNmD2KfZhSAo2LPYudixINin2YTYqtix2LTZititKSDihpAg2KfZhNiz2LnYsSDYp9mE2K3ZiiDYp9mE2KLZhiDihpAg2KfZhNmB2LHZgiDYp9mE2YTYrdi42YogJS4g2KrYrdiv2YrYqyDYqtmE2YLYp9im2Yog2YPZhCAxNSDYq9in2YbZitipLlxyXG4gICAgICAgICAgICAgIMKr4oCUwrsg2YrYudmG2Yog2YTYpyDZitmI2KzYryDYs9i52LEg2YTYrdi42Yog2YTZh9iw2Kcg2KfZhNiz2YfZhSDYp9mE2KLZhiAo2KfZhNiz2LnYsSDYp9mE2YXYsdis2LnZiiDZiti42YQg2LPYudixINin2YTYqtix2LTZititKS5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHt0b2RheVNpZ25hbHMubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLWJcIj5cclxuICAgICAgICAgICAgICAgIDx0cj5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9mH2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2LHZj9i02ZDZkditIEA8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2K3Yr9mI2K8g2KfZhNi02LHYp9ihPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMyB0ZXh0LXJpZ2h0IGZvbnQtYm9sZFwiPtin2YTYs9i52LEg2KfZhNit2Yo8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+JSDYrdmKINmF2YYg2KfZhNiq2LHYtNmK2K08L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0zIHRleHQtcmlnaHQgZm9udC1ib2xkXCI+2KfZhNit2KfZhNipPC90aD5cclxuICAgICAgICAgICAgICAgIDwvdHI+XHJcbiAgICAgICAgICAgICAgPC90aGVhZD5cclxuICAgICAgICAgICAgICA8dGJvZHkgY2xhc3NOYW1lPVwiZGl2aWRlLXkgZGl2aWRlLWJvcmRlclwiPlxyXG4gICAgICAgICAgICAgICAge3RvZGF5U2lnbmFscy5tYXAoKHMpID0+IHtcclxuICAgICAgICAgICAgICAgICAgY29uc3Qgc3QgPSB0cmFja1N0YXR1cyhzKTtcclxuICAgICAgICAgICAgICAgICAgcmV0dXJuIChcclxuICAgICAgICAgICAgICAgICAgICA8dHIga2V5PXtgbHQtJHtzLmlkfWB9IGNsYXNzTmFtZT1cImhvdmVyOmJnLW11dGVkLzE1IHRyYW5zaXRpb24tY29sb3JzXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0zIGZvbnQtYm9sZCBmb250LW1vbm8gdGV4dC1zbVwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5zeW1ib2x9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtzLl9oYWxhbCAmJiAoXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMSB0ZXh0LVsxMHB4XSBweC0xLjUgcHktMC41IHJvdW5kZWQgYmctZW1lcmFsZC01MDAvMTUgdGV4dC1lbWVyYWxkLTUwMCBmb250LXNhbnNcIj7YtNix2YrYudipPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICApfVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIHRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5fYmFuZExvICE9IG51bGwgJiYgcy5fYmFuZEhpICE9IG51bGwgPyBgJHtmbXRQcmljZShzLl9iYW5kTG8pfSDigJMgJHtmbXRQcmljZShzLl9iYW5kSGkpfWAgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTMgZm9udC1tb25vIGZvbnQtYm9sZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5saXZlUHJpY2UgIT0gbnVsbCA/IChcclxuICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtmbXRQcmljZShzLmxpdmVQcmljZSl9INisLtmFYFxyXG4gICAgICAgICAgICAgICAgICAgICAgICApIDogKFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPuKAlDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgKX1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPXtgcC0zIGZvbnQtbW9ubyBmb250LWJvbGQgJHtzLmxpdmVQY3QgPT0gbnVsbCA/IFwidGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCIgOiBzLmxpdmVQY3QgPj0gMCA/IFwidGV4dC1idWxsXCIgOiBcInRleHQtYmVhclwifWB9PlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7cy5saXZlUGN0ICE9IG51bGwgPyBgJHtzLmxpdmVQY3QgPj0gMCA/IFwiK1wiIDogXCJcIn0keyhzLmxpdmVQY3QgKiAxMDApLnRvRml4ZWQoMil9JWAgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTNcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPXtgdGV4dC1bMTFweF0gZm9udC1ib2xkIHB4LTIgcHktMC41IHJvdW5kZWQgYmctbXV0ZWQvNjAgJHtzdC5jbHN9YH0+e3N0LmxhYmVsfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgICAgIH0pfVxyXG4gICAgICAgICAgICAgIDwvdGJvZHk+XHJcbiAgICAgICAgICAgIDwvdGFibGU+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICApIDogKFxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWNlbnRlciBweS02IHRleHQtbXV0ZWQtZm9yZWdyb3VuZCB0ZXh0LXhzXCI+XHJcbiAgICAgICAgICAgINmE2Kcg2KrZiNis2K8g2KXYtNin2LHYp9iqINmB2Yog2KfZhNiv2YHYudipINin2YTYrdin2YTZitipIOKAlCDYs9iq2LjZh9ixINmH2YbYpyDZgdmI2LEg2KPZiNmEINmF2LPYrSDYo9iz2KjZiNi52YogKNin2YTYo9it2K8pLlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDI6IEFDVElWRSBPUEVOIFBPU0lUSU9OUyAoVFJBQ0tJTkcgJiA0LURBWSBFR1ggUFJPR1JFU1NJT04pIOKUgOKUgCAqL31cclxuICAgICAgPHNlY3Rpb24gY2xhc3NOYW1lPVwicm91bmRlZC0yeGwgYm9yZGVyIGJnLWNhcmQgcC01IHNoYWRvdy1zbSBzcGFjZS15LTRcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWJldHdlZW4gZ2FwLTMgYm9yZGVyLWIgcGItM1wiPlxyXG4gICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGl0ZW1zLWNlbnRlciBnYXAtMlwiPlxyXG4gICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQteGxcIj7wn5K8PC9zcGFuPlxyXG4gICAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWxnIGZvbnQtYmxhY2tcIj5cclxuICAgICAgICAgICAgICAgINin2YTYtdmB2YLYp9iqINin2YTZhdmB2KrZiNit2Kkg2YLZitivINin2YTZhdiq2KfYqNi52KkgKHthY3RpdmVPcGVuUG9zaXRpb25zTGlzdC5sZW5ndGh9KVxyXG4gICAgICAgICAgICAgIDwvaDI+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtdC0xXCI+XHJcbiAgICAgICAgICAgICAg2YXYqtin2KjYudipINit2YrYqSDZhdiz2KrZhdix2Kkg2YTZg9mEINi12YHZgtipINiq2YUg2KrYo9mD2YrYryDYtNix2KfYptmH2Kcg2LfZiNin2YQg2KfZhNij2LPYqNmI2LkgKDUg2KzZhNiz2KfYqikg4oCUINin2YTYrtix2YjYrCDYp9mE2YjYrdmK2K86INin2YHYqtiq2KfYrSDYo9mI2YQg2KzZhNiz2Kkg2KfZhNij2LPYqNmI2Lkg2KfZhNmC2KfYr9mFLiDYqNmE2Kcg2YjZgtmBINiu2LPYp9ix2KkgKNmF2Y/Zgtin2LM6INmK2LLZitivINin2YTYrtiz2KfYsdipKSDigJQg2KfZhNit2YXYp9mK2Kkg2LnYqNixINiq2LXYutmK2LEg2KfZhNit2KzZhSDYqtmE2YLYp9im2YrYp9mLLlxyXG4gICAgICAgICAgICA8L3A+XHJcbiAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubGVuZ3RoID4gMCAmJiAoXHJcbiAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyBmb250LWJvbGQgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAg2KXYrNmF2KfZhNmKINin2YTYo9ix2KjYp9itINin2YTZhNit2LjZitipOntcIiBcIn1cclxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9e3RvdGFsT3BlblBubEVncCA+PSAwID8gXCJ0ZXh0LWJ1bGxcIiA6IFwidGV4dC1iZWFyXCJ9PlxyXG4gICAgICAgICAgICAgICAge3RvdGFsT3BlblBubEVncCA+PSAwID8gXCIrXCIgOiBcIlwifVxyXG4gICAgICAgICAgICAgICAge01hdGgucm91bmQodG90YWxPcGVuUG5sRWdwKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhVxyXG4gICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICApfVxyXG4gICAgICAgIDwvZGl2PlxyXG5cclxuICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZ3JpZCBtZDpncmlkLWNvbHMtMiBnYXAtNFwiPlxyXG4gICAgICAgICAgICB7YWN0aXZlT3BlblBvc2l0aW9uc0xpc3QubWFwKChwb3MpID0+IHtcclxuICAgICAgICAgICAgICBjb25zdCBwcm9ncmVzc1BjdCA9IE1hdGgubWluKDEwMCwgTWF0aC5yb3VuZCgocG9zLmRheXNIZWxkIC8gNSkgKiAxMDApKTtcclxuICAgICAgICAgICAgICByZXR1cm4gKFxyXG4gICAgICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgICAgICBrZXk9e3Bvcy5pZH1cclxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgcm91bmRlZC0yeGwgYm9yZGVyIHAtNCBzcGFjZS15LTMgdHJhbnNpdGlvbi1hbGwgJHtcclxuICAgICAgICAgICAgICAgICAgICBwb3MuaXNBbm9tYWx5XHJcbiAgICAgICAgICAgICAgICAgICAgICA/IFwiYm9yZGVyLWFtYmVyLTUwMCBiZy1hbWJlci01MDAvMTBcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgOiBcImJnLWNhcmQgYm9yZGVyLWJvcmRlciBob3Zlcjpib3JkZXItYm9yZGVyLzgwXCJcclxuICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtYmFzZSBmb250LWJsYWNrIGZvbnQtbW9ub1wiPntwb3Muc3ltYm9sfTwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtWzExcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBtci0yXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgINiv2K7ZiNmEOiB7Zm10RGF0ZShwb3Muc2Nhbl9kYXRlKX0gQCB7Zm10UHJpY2UoTnVtYmVyKHBvcy5hY3R1YWxfYnV5X3ByaWNlID8/IHBvcy5lbnRyeV9wcmljZSkpfSDYrC7ZhVxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1yaWdodFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYmxhY2sgZm9udC1tb25vXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtmbXRQcmljZShwb3MuY3VycmVudFByaWNlKX0g2Kwu2YVcclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgICAgPGRpdlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2B0ZXh0LVsxMXB4XSBmb250LWJvbGQgZm9udC1tb25vICR7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgcG9zLnBubFBjdCA+PSAwID8gXCJ0ZXh0LWJ1bGxcIiA6IFwidGV4dC1iZWFyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWB9XHJcbiAgICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtwb3MucG5sUGN0ID49IDAgPyBcIitcIiA6IFwiXCJ9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHsocG9zLnBubFBjdCAqIDEwMCkudG9GaXhlZCgyKX0lICh7cG9zLnBubEVncCA+PSAwID8gXCIrXCIgOiBcIlwifVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7TWF0aC5yb3VuZChwb3MucG5sRWdwKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhSlcclxuICAgICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBXZWVrbHkgaG9sZGluZyBwcm9ncmVzc2lvbiAoNSBzZXNzaW9ucywgU3VuLi5UaHUpICovfVxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMS41IGJnLW11dGVkLzQwIHAtMi41IHJvdW5kZWQteGwgYm9yZGVyIGJvcmRlci1ib3JkZXIvNTAgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzExcHhdXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDZhdiz2KfYsSDYp9mE2KPYs9io2YjYuSAo2KrZgtmI2YrZhSBFR1gpOlxyXG4gICAgICAgICAgICAgICAgICAgICAgPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwiZm9udC1ib2xkIHRleHQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgICDYrNmE2LPYqSB7TWF0aC5taW4ocG9zLmRheXNIZWxkLCA1KX0g2YXZhiA1ICjZhdiq2KjZgtmKIHtwb3MuZGF5c1JlbWFpbmluZ30g2KzZhNiz2KkpXHJcbiAgICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ3LWZ1bGwgYmctbXV0ZWQgcm91bmRlZC1mdWxsIGgtMiBvdmVyZmxvdy1oaWRkZW5cIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxkaXZcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgaC1mdWxsIHJvdW5kZWQtZnVsbCB0cmFuc2l0aW9uLWFsbCAke1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHBvcy5kYXlzSGVsZCA+PSA1ID8gXCJiZy1wcmltYXJ5XCIgOiBcImJnLWJ1bGxcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9YH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgc3R5bGU9e3sgd2lkdGg6IGAke3Byb2dyZXNzUGN0fSVgIH19XHJcbiAgICAgICAgICAgICAgICAgICAgICAvPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIHRleHQtWzEwcHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZCBwdC0wLjVcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIDxzcGFuPtio2YTYpyDZiNmC2YEg2K7Ys9in2LHYqSAo2YXZj9mC2KfYszog2YrYstmK2K8g2KfZhNiu2LPYp9ix2KkpIOKAlCDYp9mE2K3Zhdin2YrYqTog2KrYtdi62YrYsSDYp9mE2K3YrNmFINin2YTYqtmE2YLYp9im2Yo8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgICA8c3Bhbj7Yp9mE2K7YsdmI2Kw6IHtwb3MuZXhpdERheU5hbWV9IHtwb3MuZXhpdERhdGV9INi52YbYryDYp9mE2KfZgdiq2KrYp9itPC9zcGFuPlxyXG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cclxuXHJcbiAgICAgICAgICAgICAgICAgIHsvKiBBY3Rpb24gYnV0dG9uICovfVxyXG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGp1c3RpZnktYmV0d2VlbiBwdC0xXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1bMTFweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7cG9zLnNoYXJlcy50b0xvY2FsZVN0cmluZygpfSDYs9mH2YVcclxuICAgICAgICAgICAgICAgICAgICA8L3NwYW4+XHJcbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gb25Tb2xkKHBvcyl9XHJcbiAgICAgICAgICAgICAgICAgICAgICBkaXNhYmxlZD17YnVzeVNpZ25hbCA9PT0gcG9zLmlkfVxyXG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicm91bmRlZC14bCBweC00IHB5LTEuNSB0ZXh0LXhzIGZvbnQtYmxhY2sgYmctYmVhci8yMCB0ZXh0LWJlYXIgaG92ZXI6YmctYmVhci8zMCBkaXNhYmxlZDpvcGFjaXR5LTUwXCJcclxuICAgICAgICAgICAgICAgICAgICA+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7YnVzeVNpZ25hbCA9PT0gcG9zLmlkID8gXCIuLi5cIiA6IFwi2KrZhSDYp9mE2KjZiti5INmB2Yog2KvYp9mG2K/YsSDinJNcIn1cclxuICAgICAgICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICApO1xyXG4gICAgICAgICAgICB9KX1cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiAoXHJcbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTYgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIHRleHQteHNcIj5cclxuICAgICAgICAgICAg2YTYpyDYqtmI2KzYryDYtdmB2YLYp9iqINmF2YHYqtmI2K3YqSDYrdin2YTZitin2YsuINi52YbYryDYuNmH2YjYsSDYpdi02KfYsdipINmI2LbYuti32YMg2LnZhNmJIMKr2KrZhSDYp9mE2LTYsdin2KHCu9iMINiz2KrYuNmH2LEg2KfZhNi12YHZgtipINmH2YbYpyDZiNiq2K7Ytti5INmE2YTZhdix2KfZgtio2Kkg2KfZhNit2YrYqSDYqNin2YTYq9mI2KfZhtmKLlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgKX1cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDM6IEVHWCBUUkFESU5HIENBTEVOREFSICYgV0VFS0VORCBQUk9UT0NPTCDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1tdXRlZC8yMCBwLTQgc3BhY2UteS0zIHRleHQteHNcIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIGdhcC0yIHRleHQtZm9yZWdyb3VuZCBmb250LWJvbGRcIj5cclxuICAgICAgICAgIDxzcGFuPvCfk4U8L3NwYW4+XHJcbiAgICAgICAgICA8c3Bhbj7Yp9mE2KrZgtmI2YrZhSDYp9mE2KrYtNi62YrZhNmKINin2YTYtdix2YrYrSDZhNmAIEVHWCDZiNiq2YjYstmK2Lkg2KfZhNij2YrYp9mFOjwvc3Bhbj5cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgbWQ6Z3JpZC1jb2xzLTIgZ2FwLTMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGxlYWRpbmctcmVsYXhlZFwiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1jYXJkIHAtMyByb3VuZGVkLXhsIGJvcmRlclwiPlxyXG4gICAgICAgICAgICA8YiBjbGFzc05hbWU9XCJ0ZXh0LWZvcmVncm91bmQgYmxvY2sgbWItMVwiPtiv2YjYsdipINin2YTYo9iz2KjZiNi5ICg1INis2YTYs9in2KrYjCDZitiq2K7Yt9mJINi52LfZhNipINmG2YfYp9mK2Kkg2KfZhNij2LPYqNmI2LkpOjwvYj5cclxuICAgICAgICAgICAg2KfZhNiv2K7ZiNmEOiDYp9mB2KrYqtin2K0g2KPZiNmEINis2YTYs9ipINin2YTYo9iz2KjZiNi5ICjYp9mE2KPYrdivKSDigJQg2KfZhNiu2LHZiNisOiDYp9mB2KrYqtin2K0g2KPZiNmEINis2YTYs9ipINin2YTYo9iz2KjZiNi5INin2YTZgtin2K/ZhS5cclxuICAgICAgICAgICAgPGJyIC8+XHJcbiAgICAgICAgICAgIDxiPtmF2KvYp9mEINit2Yo6PC9iPiDYr9iu2YjZhCA8Yj7Yp9mE2KPYrdivPC9iPiDinpQg2KfZhNij2LPYqNmI2Lkg2YrZhdi02YogKNin2YTYo9it2K8t2KfZhNiu2YXZitizKSDinpQg2KfZhNis2YXYudipINmI2KfZhNiz2KjYqiDYrtin2LHYrCDYp9mE2K3Ys9in2Kgg4p6UINiu2LHZiNisIDxiPtin2YTYo9it2K8g2KfZhNmC2KfYr9mFPC9iPiDYudmG2K8g2KfZhNin2YHYqtiq2KfYrS4g2KjZhNinINmI2YLZgSDYrtiz2KfYsdipINmI2YTYpyDYrNmG2Yog2KPYsdio2KfYrSDigJQg2KfZhNin2KrZhtmK2YYg2YXZj9mC2KfYs9mK2YY6INmK2LLZitiv2YjYpyDYp9mE2K7Ys9in2LHYqS5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy1jYXJkIHAtMyByb3VuZGVkLXhsIGJvcmRlclwiPlxyXG4gICAgICAgICAgICA8YiBjbGFzc05hbWU9XCJ0ZXh0LWZvcmVncm91bmQgYmxvY2sgbWItMVwiPtmF2YfYp9mFINi52LfZhNipINin2YTYrNmF2LnYqSDZiNin2YTYs9io2KogKNin2YTYqtit2YTZitmEINin2YTZhdiz2KrZgtmEKTo8L2I+XHJcbiAgICAgICAgICAgINiq2Y/Ys9iq2LrZhCDYudi32YTYqSDYp9mE2KzZhdi52Kkg2YjYp9mE2LPYqNiqINmB2Yog2KrYtNi62YrZhCDYp9mE2LnZhdmE2YrYp9iqINin2YTYqtit2YTZitmE2YrYqSDYutmK2LEg2KfZhNit2YrYqSDYr9mI2YYg2KrYudin2LHYtiDZhdi5INin2YTYqtiv2KfZiNmEOlxyXG4gICAgICAgICAgICA8dWwgY2xhc3NOYW1lPVwibGlzdC1kaXNjIHByLTQgbXQtMSBzcGFjZS15LTAuNVwiPlxyXG4gICAgICAgICAgICAgIDxsaT7Ypdi12K/Yp9ixINin2YTYqtmC2LHZitixINin2YTYo9iz2KjZiNi52Yog2KfZhNi02KfZhdmEINmE2YTZhdit2YHYuNipLjwvbGk+XHJcbiAgICAgICAgICAgICAgPGxpPtmB2K3YtSDZhdik2LTYsSDYp9mE2KPZhNmB2KcgKEFscGhhKSDZiNmF2YLYp9ix2YbYqSDYp9mE2KPYr9in2KEg2KjZgCBFR1gzMC48L2xpPlxyXG4gICAgICAgICAgICAgIDxsaT7Zhdix2KfYrNi52Kkg2YjYqtit2K/ZitirINmC2KfYptmF2Kkg2KPYs9mH2YUg2KfZhNi02LHZiti52KkgKNmD2YQgNiDYtNmH2YjYsSkuPC9saT5cclxuICAgICAgICAgICAgPC91bD5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gNDogQ0FQSVRBTCBTRVRUSU5HUyDilIDilIAgKi99XHJcbiAgICAgIDxzZWN0aW9uIGNsYXNzTmFtZT1cInJvdW5kZWQtMnhsIGJvcmRlciBiZy1jYXJkIHAtNCBzaGFkb3ctc21cIj5cclxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggZmxleC13cmFwIGl0ZW1zLWVuZCBnYXAtM1wiPlxyXG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4LTEgbWluLXctNTZcIj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LXNtIGZvbnQtYm9sZCBtYi0xXCI+8J+SsCDYsdij2LMg2KfZhNmF2KfZhCDYp9mE2YXYqtin2K0g2YTZhNiq2K/Yp9mI2YQ8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbWItMlwiPlxyXG4gICAgICAgICAgICAgINmK2Y/Yrdiz2Kgg2LnYr9ivINin2YTZhdix2KfZg9iyINiq2YTZgtin2KbZitmL2Kc6IFRPUF9OID0g2LHYo9izINin2YTZhdin2YQgw7cgMjAsMDAwICjZhdmGIDEg2KXZhNmJIDUg2YXYsdin2YPYsiDigJQg2KfZhNil2LnYr9in2K8g2KfZhNmF2K/YsdmI2LMgTjU6INij2YHYttmEINiq2YjYp9iy2YYg2LnYp9im2K8v2KfYqtiz2KfZgiDZhdmC2KfYsykuINmB2YjZgiAxMDAg2KPZhNmBINmK2LLZitivINit2KzZhSDYp9mE2YXYsdmD2LIg2KfZhNmI2KfYrdivLlxyXG4gICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmbGV4IGdhcC0yIGl0ZW1zLWNlbnRlclwiPlxyXG4gICAgICAgICAgICAgIDxpbnB1dFxyXG4gICAgICAgICAgICAgICAgdHlwZT1cIm51bWJlclwiXHJcbiAgICAgICAgICAgICAgICBtaW49ezF9XHJcbiAgICAgICAgICAgICAgICBzdGVwPXsxMDAwfVxyXG4gICAgICAgICAgICAgICAgdmFsdWU9e2NhcGl0YWxJbnB1dH1cclxuICAgICAgICAgICAgICAgIG9uQ2hhbmdlPXsoZSkgPT4gc2V0Q2FwaXRhbElucHV0KGUudGFyZ2V0LnZhbHVlKX1cclxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi2YXYq9in2YQ6IDEwMDAwMFwiXHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJ3LTQwIHJvdW5kZWQteGwgYm9yZGVyIGJnLWJhY2tncm91bmQgcHgtMyBweS0xLjUgdGV4dC1zbSBmb250LW1vbm9cIlxyXG4gICAgICAgICAgICAgIC8+XHJcbiAgICAgICAgICAgICAgPGJ1dHRvblxyXG4gICAgICAgICAgICAgICAgb25DbGljaz17b25TYXZlQ2FwaXRhbH1cclxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtzYXZpbmdDYXB9XHJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJyb3VuZGVkLXhsIHB4LTQgcHktMS41IHRleHQteHMgZm9udC1zZW1pYm9sZCBiZy1wcmltYXJ5IHRleHQtcHJpbWFyeS1mb3JlZ3JvdW5kIGhvdmVyOmJnLXByaW1hcnkvOTAgZGlzYWJsZWQ6b3BhY2l0eS01MFwiXHJcbiAgICAgICAgICAgICAgPlxyXG4gICAgICAgICAgICAgICAge3NhdmluZ0NhcCA/IFwi2KzYp9ix2Yog2KfZhNit2YHYuOKAplwiIDogXCLYrdmB2LhcIn1cclxuICAgICAgICAgICAgICA8L2J1dHRvbj5cclxuICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIHtjYXBNc2cgJiYgPGRpdiBjbGFzc05hbWU9XCJtdC0xIHRleHQtWzExcHhdXCI+e2NhcE1zZ308L2Rpdj59XHJcbiAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgIHtzaXppbmcgJiYgKFxyXG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImdyaWQgZ3JpZC1jb2xzLTMgZ2FwLTIgdGV4dC1jZW50ZXJcIj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLW11dGVkLzQwIHB4LTMgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPtix2KPYsyDYp9mE2YXYp9mEINin2YTZgdi52ZHYp9mEPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIGZvbnQtbW9ub1wiPntNYXRoLnJvdW5kKHNpemluZy50b3RhbF9jYXBpdGFsKS50b0xvY2FsZVN0cmluZygpfSDYrC7ZhTwvZGl2PlxyXG4gICAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC14bCBib3JkZXIgYmctbXV0ZWQvNDAgcHgtMyBweS0yXCI+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtWzlweF0gdGV4dC1tdXRlZC1mb3JlZ3JvdW5kXCI+2LnYr9ivINin2YTZhdix2KfZg9iyIChUT1BfTik8L2Rpdj5cclxuICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbSBmb250LWJvbGQgZm9udC1tb25vXCI+e3NpemluZy50b3Bfbn08L2Rpdj5cclxuICAgICAgICAgICAgICA8L2Rpdj5cclxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJvdW5kZWQteGwgYm9yZGVyIGJnLW11dGVkLzQwIHB4LTMgcHktMlwiPlxyXG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LVs5cHhdIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPtit2KzZhSDYp9mE2YXYsdmD2LIgKFNMT1QpPC9kaXY+XHJcbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1ib2xkIGZvbnQtbW9ub1wiPntNYXRoLnJvdW5kKHNpemluZy5zbG90X2NhcGl0YWwpLnRvTG9jYWxlU3RyaW5nKCl9INisLtmFPC9kaXY+XHJcbiAgICAgICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICAgKX1cclxuICAgICAgICA8L2Rpdj5cclxuICAgICAgPC9zZWN0aW9uPlxyXG5cclxuICAgICAgey8qIOKUgOKUgCBTRUNUSU9OIDU6IERFQ0lTSU9OIEFVRElUIExPRyAoUEVSTUFORU5UIFJFQ09SRCkg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYmctY2FyZCBwLTUgc2hhZG93LXNtIHNwYWNlLXktM1wiPlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIganVzdGlmeS1iZXR3ZWVuIGJvcmRlci1iIHBiLTNcIj5cclxuICAgICAgICAgIDxkaXY+XHJcbiAgICAgICAgICAgIDxoMiBjbGFzc05hbWU9XCJ0ZXh0LWJhc2UgZm9udC1ib2xkXCI+8J+TnCDYs9is2YQg2KfZhNmC2LHYp9ix2KfYqiDZiNin2YTYqtmG2KjZitmH2KfYqiDYp9mE2YXZiNir2YIgKERlY2lzaW9uIEF1ZGl0IExvZyk8L2gyPlxyXG4gICAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmQgbXQtMC41XCI+XHJcbiAgICAgICAgICAgICAg2LPYrNmEINiv2KfYptmFINmI2YXYpNix2K4g2KjYp9mE2KvYp9mG2YrYqSDZhNmD2YQg2KXYtNin2LHYqSDYtdiv2LHYqtiMINmD2YQg2KXZhtiw2KfYsSDYt9mI2KfYsdim2Iwg2YjYsdivINmB2LnZhCDYp9mE2YXYs9iq2K7Yr9mFINmE2KrZiNir2YrZgiDYp9mE2KPYr9in2KEg2KrYp9ix2YrYrtmK2KfZiy5cclxuICAgICAgICAgICAgPC9wPlxyXG4gICAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPC9kaXY+XHJcblxyXG4gICAgICAgIHthdWRpdExvZ3MubGVuZ3RoID4gMCA/IChcclxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwib3ZlcmZsb3cteC1hdXRvIG1heC1oLTYwXCI+XHJcbiAgICAgICAgICAgIDx0YWJsZSBjbGFzc05hbWU9XCJ3LWZ1bGwgdGV4dC14c1wiPlxyXG4gICAgICAgICAgICAgIDx0aGVhZCBjbGFzc05hbWU9XCJiZy1tdXRlZC80MCB0ZXh0LW11dGVkLWZvcmVncm91bmQgc3RpY2t5IHRvcC0wXCI+XHJcbiAgICAgICAgICAgICAgICA8dHI+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtin2YTYqtmI2YLZitiqPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0XCI+2YbZiNi5INin2YTYrdiv2Ks8L3RoPlxyXG4gICAgICAgICAgICAgICAgICA8dGggY2xhc3NOYW1lPVwicC0yIHRleHQtcmlnaHRcIj7Yp9mE2LPZh9mFPC90aD5cclxuICAgICAgICAgICAgICAgICAgPHRoIGNsYXNzTmFtZT1cInAtMiB0ZXh0LXJpZ2h0XCI+2KfZhNiz2LnYsTwvdGg+XHJcbiAgICAgICAgICAgICAgICAgIDx0aCBjbGFzc05hbWU9XCJwLTIgdGV4dC1yaWdodFwiPtiq2LXYsdmBINin2YTZhdiz2KrYrtiv2YU8L3RoPlxyXG4gICAgICAgICAgICAgICAgPC90cj5cclxuICAgICAgICAgICAgICA8L3RoZWFkPlxyXG4gICAgICAgICAgICAgIDx0Ym9keSBjbGFzc05hbWU9XCJkaXZpZGUteSBkaXZpZGUtYm9yZGVyXCI+XHJcbiAgICAgICAgICAgICAgICB7YXVkaXRMb2dzLm1hcCgobG9nKSA9PiAoXHJcbiAgICAgICAgICAgICAgICAgIDx0ciBrZXk9e2xvZy5pZH0gY2xhc3NOYW1lPVwiaG92ZXI6YmctbXV0ZWQvMTVcIj5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yIGZvbnQtbW9ubyB0ZXh0LVsxMHB4XSB0ZXh0LW11dGVkLWZvcmVncm91bmRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuY3JlYXRlZF9hdCA/IGxvZy5jcmVhdGVkX2F0LnNsaWNlKDAsIDE5KS5yZXBsYWNlKFwiVFwiLCBcIiBcIikgOiBcIuKAlFwifVxyXG4gICAgICAgICAgICAgICAgICAgIDwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMiBmb250LXNlbWlib2xkXCI+XHJcbiAgICAgICAgICAgICAgICAgICAgICB7bG9nLmV2ZW50X3R5cGUgPT09IFwiVVNFUl9CT1VHSFRcIiAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJ1bGxcIj7wn5uSINiq2KPZg9mK2K8g2LTYsdin2KE8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIlVTRVJfU09MRFwiICYmIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtcHJpbWFyeVwiPvCfkrAg2KrYo9mD2YrYryDYqNmK2Lk8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIkVNRVJHRU5DWV9TVE9QX0xPU1NcIiAmJiA8c3BhbiBjbGFzc05hbWU9XCJ0ZXh0LWJlYXIgZm9udC1ib2xkXCI+8J+aqCDYpdmG2LDYp9ixINmI2YLZgSDYrtiz2KfYsdipPC9zcGFuPn1cclxuICAgICAgICAgICAgICAgICAgICAgIHtsb2cuZXZlbnRfdHlwZSA9PT0gXCJTSUdOQUxfMTBBTVwiICYmIDxzcGFuPvCfjq8g2KXYtNin2LHYqSAxMDowMCDYtdio2KfYrdin2Ys8L3NwYW4+fVxyXG4gICAgICAgICAgICAgICAgICAgICAge2xvZy5ldmVudF90eXBlID09PSBcIlNDSEVEVUxFRF9FWElUXCIgJiYgPHNwYW4+8J+ThSDYrtix2YjYrCDYo9iz2KjZiNi52Yog2YXYrNiv2YjZhDwvc3Bhbj59XHJcbiAgICAgICAgICAgICAgICAgICAgPC90ZD5cclxuICAgICAgICAgICAgICAgICAgICA8dGQgY2xhc3NOYW1lPVwicC0yIGZvbnQtbW9ubyBmb250LWJvbGRcIj57bG9nLnN5bWJvbH08L3RkPlxyXG4gICAgICAgICAgICAgICAgICAgIDx0ZCBjbGFzc05hbWU9XCJwLTIgZm9udC1tb25vXCI+e2xvZy50cmlnZ2VyX3ByaWNlID8gZm10UHJpY2UoTnVtYmVyKGxvZy50cmlnZ2VyX3ByaWNlKSkgOiBcIuKAlFwifSDYrC7ZhTwvdGQ+XHJcbiAgICAgICAgICAgICAgICAgICAgPHRkIGNsYXNzTmFtZT1cInAtMlwiPlxyXG4gICAgICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwicHgtMiBweS0wLjUgcm91bmRlZCB0ZXh0LVsxMHB4XSBmb250LWJvbGQgYmctbXV0ZWRcIj5cclxuICAgICAgICAgICAgICAgICAgICAgICAge2xvZy51c2VyX2FjdGlvbn1cclxuICAgICAgICAgICAgICAgICAgICAgIDwvc3Bhbj5cclxuICAgICAgICAgICAgICAgICAgICA8L3RkPlxyXG4gICAgICAgICAgICAgICAgICA8L3RyPlxyXG4gICAgICAgICAgICAgICAgKSl9XHJcbiAgICAgICAgICAgICAgPC90Ym9keT5cclxuICAgICAgICAgICAgPC90YWJsZT5cclxuICAgICAgICAgIDwvZGl2PlxyXG4gICAgICAgICkgOiAoXHJcbiAgICAgICAgICA8cCBjbGFzc05hbWU9XCJ0ZXh0LXhzIHRleHQtbXV0ZWQtZm9yZWdyb3VuZFwiPlxyXG4gICAgICAgICAgICDZhNinINiq2YjYrNivINiz2KzZhNin2Kog2YLYsdin2LHYp9iqINiz2KfYqNmC2Kkg2KjYudivLiDZg9mEINmG2YLYsdipINi02LHYp9ihINij2Ygg2KjZiti5INij2Ygg2KrZhtio2YrZhyDYt9mI2KfYsdimINiz2KrZj9mI2KvZgiDZh9mG2Kcg2KrZhNmC2KfYptmK2KfZiy5cclxuICAgICAgICAgIDwvcD5cclxuICAgICAgICApfVxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7Lyog4pSA4pSAIFNFQ1RJT04gNjogTUVBU1VSRUQgUEVSRk9STUFOQ0UgKGhvbmVzdCwgaGFsYWwtb25seSkg4pSA4pSAICovfVxyXG4gICAgICA8c2VjdGlvbiBjbGFzc05hbWU9XCJyb3VuZGVkLTJ4bCBib3JkZXIgYm9yZGVyLXdhcm4vNDAgYmctd2Fybi8xMCBwLTQgc3BhY2UteS0yXCI+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJmb250LWJvbGQgdGV4dC1zbVwiPvCfk4sg2KfZhNij2K/Yp9ihINin2YTZhdmP2YLYp9izICjYtNix2YrYudipINmB2YLYtyDigJQg2KjYp9mDLdiq2LPYqiDYtdin2K/ZgiA1MTIg2KPYs9io2YjYuSAyMDE2LTIwMjbYjCDYqtmD2YTZgdipINir2KfZhtiv2LEgMC4wNSUpPC9kaXY+XHJcbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJncmlkIGdyaWQtY29scy0yIG1kOmdyaWQtY29scy00IGdhcC0yIHRleHQteHNcIj5cclxuICAgICAgICAgIDxTdGF0Q2FyZCBsYWJlbD1cItin2YTZhti42KfZhSDYp9mE2K3Yp9mE2YogKNii2K7YsSA5MCDZitmI2YUpXCIgdmFsdWU9e2B+JHtDVVJSRU5UX1JFR0lNRV9XRUVLTFlfTE9XX0VHUC50b0xvY2FsZVN0cmluZygpfS0ke0NVUlJFTlRfUkVHSU1FX1dFRUtMWV9ISUdIX0VHUC50b0xvY2FsZVN0cmluZygpfSDYrC7ZhWB9IHRvbmU9XCJidWxsXCIgc3ViPVwi2KPZgdi22YQg2YHYqtix2Kkg2YHZiiDYp9mE2LnZgtivIOKAlCDZhNmK2LMg2K3Zgtin2Ysg2YXZg9iq2LPYqNin2YtcIiAvPlxyXG4gICAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwi2KfZhNmF2KrZiNiz2Lcg2KfZhNi32YjZitmEINin2YTZhdmI2KvZiNmCICgxMCDYs9mG2YrZhilcIiB2YWx1ZT17YCR7QkFDS1RFU1RfV0VFS0xZX0VHUC50b0xvY2FsZVN0cmluZygpfSDYrC7ZhWB9IHRvbmU9XCJkZWZhdWx0XCIgc3ViPXtg2YHYp9i12YQg2KvZgtipIDk1JTogJHtCQUNLVEVTVF9XRUVLTFlfRUdQX0xPVy50b0xvY2FsZVN0cmluZygpfS0ke0JBQ0tURVNUX1dFRUtMWV9FR1BfSElHSC50b0xvY2FsZVN0cmluZygpfWB9IC8+XHJcbiAgICAgICAgICA8U3RhdENhcmQgbGFiZWw9XCLYo9iz2YjYoyDYo9iz2KjZiNi5ICgxMCDYs9mG2YrZhilcIiB2YWx1ZT17YCR7QkFDS1RFU1RfV09SU1RfV0VFS19QQ1QudG9Mb2NhbGVTdHJpbmcoKX0lYH0gdG9uZT1cImJlYXJcIiAvPlxyXG4gICAgICAgICAgPFN0YXRDYXJkIGxhYmVsPVwi2KPZgti12Ykg2KrYsdin2KzYuSAoMTAg2LPZhtmK2YYpXCIgdmFsdWU9e2Ake0JBQ0tURVNUX01BWEREX1BDVC50b0xvY2FsZVN0cmluZygpfSVgfSB0b25lPVwiYmVhclwiIHN1Yj1cItmF2Lkg2KfZhNit2YXYp9mK2KfYqiDYp9mE2KrZhNmC2KfYptmK2Kk6IH4yNy0zMCVcIiAvPlxyXG4gICAgICAgIDwvZGl2PlxyXG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWJvcmRlci81MCBiZy1jYXJkLzYwIHAtMi41IHRleHQteHMgdGV4dC1tdXRlZC1mb3JlZ3JvdW5kIGxlYWRpbmctcmVsYXhlZFwiPlxyXG4gICAgICAgICAgPGIgY2xhc3NOYW1lPVwidGV4dC1mb3JlZ3JvdW5kXCI+2LTZg9mEINin2YTYo9iz2KfYqNmK2Lkg2KfZhNit2YLZitmC2YogKNmF2YLYp9izKTo8L2I+IH4yNS0zMCUg2YHZgti3INmF2YYg2KfZhNij2LPYp9io2YrYuSDYqtiq2KzYp9mI2LIgMiw1MDAg2Kwu2YUg2YjZiNiz2YrYtyDYp9mE2KPYs9io2YjYuSDiiYggMCDigJRcclxuICAgICAgICAgINij2LrZhNioINin2YTYo9iz2KfYqNmK2Lkg2LXYutmK2LHYqSDYo9mIINiz2KfZhNio2Kkg2YjYp9mE2YXYqtmI2LPYtyDYqNmK2KrYrdmC2YIg2YXZhiDZgtmB2LLYp9iqINmG2KfYr9ix2KkgKNiy2YogKzIxLDUwMCDZiCszNCw5MDAg2YHZiiDZitmI2YbZitmIL9mK2YjZhNmK2YggMjAyNikg2YTYpyDZitmF2YPZhiDYqtmI2YLZitiq2YfYpy5cclxuICAgICAgICAgIDxiIGNsYXNzTmFtZT1cInRleHQtZm9yZWdyb3VuZFwiPiDZiNmE2Kcg2YrZiNis2K8g2YjYudivINio2LHYqNitINir2KfYqNiqIOKAlCDZhdix2YHZiNi2INmF2YYg2YPZhCDYp9mE2KPYt9ix2KfZgS48L2I+XHJcbiAgICAgICAgPC9kaXY+XHJcbiAgICAgICAgPHAgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgbGVhZGluZy1yZWxheGVkXCI+e0JBQ0tURVNUX0RJU0NMQUlNRVJfQVJ9PC9wPlxyXG4gICAgICA8L3NlY3Rpb24+XHJcblxyXG4gICAgICB7LyogUnVsZXMgRm9vdGVyICovfVxyXG4gICAgICA8Zm9vdGVyIGNsYXNzTmFtZT1cInRleHQtY2VudGVyIHB5LTQgdGV4dC14cyB0ZXh0LW11dGVkLWZvcmVncm91bmQgYm9yZGVyLXRcIj5cclxuICAgICAgICDZgtmI2KfYudivINmB2YTYp9iq2LEg2KfZhNin2LPYqtix2KfYqtmK2KzZitipINmI2YXYudin2K/ZhNin2KrZh9inINmF2KzZhdiv2Kkg2YTZhdiv2KkgNC02INij2LPYp9io2YrYuSDZhNmE2KfYrtiq2KjYp9ixINmI2KfZhNmF2LHYp9mC2KjYqSDYp9mE2LXYp9ix2YXYqS5cclxuICAgICAgPC9mb290ZXI+XHJcbiAgICA8L2Rpdj5cclxuICApO1xyXG59XHJcbiJdLCJmaWxlIjoiRDovbWVreS1zdG9jay1tYWluL21la3ktc3RvY2stbWFpbi9zcmMvcm91dGVzL3NjYWxwLWRpcC50c3gifQ==