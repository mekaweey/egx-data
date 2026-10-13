import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fmtPrice } from "@/lib/format/price";
import { DataFreshnessBanner } from "@/components/data-freshness-banner";
import { LivePriceBadge } from "@/components/live-price-badge";
import { MarketStateGauge } from "@/components/market-state-gauge";
import {
  GAP_PARAMS,
  BACKTEST_DISCLAIMER_AR,
  AUDITED_WEEKLY_WIN_RATE,
  AUDITED_WIN_CI_LOW,
  AUDITED_WIN_CI_HIGH,
  AUDITED_WEEKLY_MEAN,
  AUDITED_WEEKLY_MEAN_EX_TOP2,
  BACKTEST_WORST_WEEK_PCT,
  BACKTEST_MAXDD_PCT,
  scanDailyCandidates,
  tradingDaysElapsed,
  liveSymbolState,
  type Candidate,
} from "@/lib/scalp-dip/momentum-weekly.server";
import { getHalalSet } from "@/lib/scalp-dip/halal-list.server";
import {
  markWeeklyBought,
  markWeeklySold,
  getRecentAuditLogs,
  type SignalRow,
  type DecisionAuditRow,
} from "@/lib/scalp-dip/scalp-dip-signals.server";
import {
  playSignalChime,
  playEmergencySiren,
  playScheduledExitTone,
} from "@/lib/scalp-dip/operational-audio";

/**
 * /scalp-dip - "غرفة العمليات — المومنتم الأسبوعي الحلال (5 جلسات، دخول الأحد)"
 * Unified Operational Dashboard:
 * 1) 10:00 AM qualified candidates with 15-minute countdown execution window.
 * 2) Real-time tracking of bought positions with 4-day holding progression.
 * 3) Visually and acoustically distinct emergency alerts (anomaly) + weekly exit schedule.
 * 4) Explicit EGX calendar handling (skipping Fri/Sat).
 * 5) Permanent Decision Audit Log.
 * 6) Full Dry Run simulation mode for testing.
 */

const STRATEGY = "scalp-dip";

const ARABIC_DAY_NAMES = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/** momentum_weekly_signals row → SignalRow-compatible shape for the UI
 * (entry reference = actual buy price once filled, else the signal close). */
function weeklyRowToSignal(r: any): SignalRow {
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
    updated_at: r.updated_at ?? null,
  };
}

type Trade = {
  id: string;
  symbol: string;
  entry_price: number;
  entry_ts: string;
  exit_price: number | null;
  exit_ts: string | null;
  exit_reason: string | null;
  pnl: number | null;
  pnl_pct: number | null;
  status: string;
  trade_date: string;
  capital: number;
};

export type EnrichedPosition = SignalRow & {
  currentPrice: number;
  pnlEgp: number;
  pnlPct: number;
  daysHeld: number;
  daysRemaining: number;
  exitDate: string;
  exitDayName: string;
  isScheduledExit: boolean;
  isAnomaly: boolean;
  shares: number;
};

/** One scalp_dip_signals row (the latest weekly batch) with its LIVE price
 * from liveSymbolState — the live-tracking section's data shape. livePct is
 * live vs the nomination price (entry_price); null when no live feed. */
export type LiveTrackedSignal = SignalRow & {
  _halal: boolean;
  livePrice: number | null;
  liveTs: string | null;
  livePct: number | null;
  batchScanDate: string;
  _bandLo: number | null;
  _bandHi: number | null;
};

// Dashboard data + actions now come from the plain API route
// /api/public/hooks/scalp-dip-dashboard (2026-09-27) - the createServerFn
// layer for this page was removed after the vite dev server-fn registry
// broke repeatedly ("Invalid server function ID"). Same payloads as before.
async function fetchDashboard(): Promise<{
  plan: any;
  halalList: string[];
  trades: Trade[];
  todaySignals: LiveTrackedSignal[];
  batchScanDate: string;
  openPositions: EnrichedPosition[];
  recentSignals: SignalRow[];
  sellAlerts: SignalRow[];
  auditLogs: DecisionAuditRow[];
  ok?: boolean;
}> {
  if (typeof window === "undefined") {
    // SSR: build in-process (a relative fetch cannot run server-side)
    const { buildDashboard } = await import("@/lib/scalp-dip/dashboard-builder");
    return (await buildDashboard()) as any;
  }
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard");
  return res.json();
}
const markBoughtFnUi = async (args: { data: { signal_id: number; price?: number } }): Promise<any> => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "bought", signal_id: args.data.signal_id, price: args.data.price }),
  });
  return res.json();
};
const markSoldFnUi = async (args: { data: { signal_id: number; price?: number } }): Promise<any> => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sold", signal_id: args.data.signal_id, price: args.data.price }),
  });
  return res.json();
};
const saveCapitalFn = async (args: { data: { capital: number } }): Promise<any> => {
  const res = await fetch("/api/public/hooks/scalp-dip-dashboard", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "capital", capital: args.data.capital }),
  });
  return res.json();
};

export const Route = createFileRoute("/scalp-dip")({
  component: ScalpDipOperationalPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">خطأ: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  head: () => ({
    meta: [
      { title: "غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)" },
      {
        name: "description",
        content:
          "لوحة التحكم الأسبوعية: ترشيحات الأحد مع عداد التنفيذ 15 دقيقة، تتبع حي للصفقات طوال الأسبوع، إشعارات طوارئ صوتية وبصرية، وتقويم EGX الصريح.",
      },
    ],
  }),
});

function fmtDate(iso: string) {
  return iso ? iso.slice(0, 10) : "—";
}

function trackStatus(s: LiveTrackedSignal): { label: string; cls: string } {
  if (s.sold) return { label: "مُغلقة — بيع مسجل ✓", cls: "text-muted-foreground" };
  if (s.sell_signal) return { label: "إشارة بيع الآن ⚠", cls: "text-amber-400" };
  if (s.bought) return { label: "قيد المتابعة", cls: "text-bull" };
  return { label: "بانتظار التنفيذ", cls: "text-foreground" };
}

function StatCard({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "bull" | "bear" | "muted" | "warn" }) {
  const cls =
    tone === "bull"
      ? "text-bull"
      : tone === "bear"
        ? "text-bear"
        : tone === "warn"
          ? "text-amber-400"
          : tone === "muted"
            ? "text-muted-foreground"
            : "text-foreground";
  return (
    <div className="bg-card border rounded-xl p-3 shadow-sm">
      <div className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`text-lg font-extrabold font-mono ${cls}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

function ScalpDipOperationalPage() {

  const { data, refetch, error: dashError, isFetching: dashFetching } = useQuery({
    queryKey: ["scalp-dip-operational-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 15_000,
    retry: 2,
  });
  // Surface any client-side data failure ON the page (2026-09-27) so a broken
  // state is never silently empty - the exact message is visible to the user.
  const dashErrorMsg = dashError
    ? String((dashError as any)?.message || dashError).slice(0, 300)
    : data && data.ok === false
      ? String((data as any).error || "unknown dashboard error").slice(0, 300)
      : null;

  // Capital settings state
  const sizing = data?.plan?.sizing;
  const [capitalInput, setCapitalInput] = useState<string>(sizing ? String(Math.round(sizing.total_capital)) : "");
  const [savingCap, setSavingCap] = useState(false);
  const [capMsg, setCapMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sizing && !capitalInput) setCapitalInput(String(Math.round(sizing.total_capital)));
  }, [sizing?.total_capital]);

  // Action states
  const [busySignal, setBusySignal] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const [priceOverrides, setPriceOverrides] = useState<Record<number, string>>({});

  // Countdown timer state (15-min window from 10:00 AM)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15 * 60);
  const [isWindowExpired, setIsWindowExpired] = useState<boolean>(false);
  const [isBeforeMarket, setIsBeforeMarket] = useState<boolean>(false);

  // Simulation (Dry Run) State
  const [dryRunActive, setDryRunActive] = useState<boolean>(false);
  const [dryRunSimulationTime, setDryRunSimulationTime] = useState<number>(12 * 60 + 34); // 12m 34s

  const sirenPlayedRef = useRef<boolean>(false);

  // Audio Alerts on Emergency conditions
  useEffect(() => {
    const hasEmergency = (data?.openPositions ?? []).some((p) => p.isAnomaly);
    if (hasEmergency && !sirenPlayedRef.current) {
      playEmergencySiren();
      sirenPlayedRef.current = true;
    } else if (!hasEmergency) {
      sirenPlayedRef.current = false;
    }
  }, [data?.openPositions]);

  // Real-time Cairo countdown calculation
  useEffect(() => {
    function updateCountdown() {
      if (dryRunActive) {
        setDryRunSimulationTime((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }
      try {
        const now = new Date();
        const cairoStr = now.toLocaleString("en-US", { timeZone: "Africa/Cairo" });
        const cairo = new Date(cairoStr);
        const h = cairo.getHours();
        const m = cairo.getMinutes();
        const s = cairo.getSeconds();

        const secondsSinceMidnight = (h * 60 + m) * 60 + s;
        const windowStart = 10 * 3600; // 10:00 AM
        const windowDuration = 15 * 60; // 15 mins (900s)

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
      } catch {}
    }

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
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
      const r = await saveCapitalFn({ data: { capital: v } });
      if (r.ok) {
        setCapMsg(`✅ تم الحفظ: ${r.sizing.top_n} مركز × ${Math.round(r.sizing.slot_capital).toLocaleString()} ج.م`);
        await refetch();
      } else {
        setCapMsg(`❌ ${r.error}`);
      }
    } catch (e: any) {
      setCapMsg(`❌ خطأ: ${e?.message ?? "غير معروف"}`);
    } finally {
      setSavingCap(false);
    }
  };

  const onBought = async (sig: SignalRow) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : undefined;
      const r = await markBoughtFnUi({ data: { signal_id: sig.id, price } });
      if (r.ok) {
        setActionMsg(`✅ ${sig.symbol}: تم تسجيل الشراء @ ${fmtPrice(r.signal?.actual_buy_price ?? sig.entry_price)} ج.م`);
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e: any) {
      setActionMsg(`❌ ${sig.symbol}: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusySignal(null);
    }
  };

  const onSold = async (sig: SignalRow) => {
    setBusySignal(sig.id);
    setActionMsg(null);
    try {
      const overrideRaw = priceOverrides[sig.id];
      const price = overrideRaw ? Number(overrideRaw) : undefined;
      const r = await markSoldFnUi({ data: { signal_id: sig.id, price } });
      if (r.ok) {
        const pnl = r.signal?.realized_pnl;
        setActionMsg(
          pnl != null
            ? `✅ ${sig.symbol}: تم تسجيل البيع — صافي ${Math.round(Number(pnl)).toLocaleString()} ج.م (${(Number(r.signal?.realized_pnl_pct) * 100).toFixed(2)}%)`
            : `✅ ${sig.symbol}: تم تسجيل البيع`,
        );
        await refetch();
      } else {
        setActionMsg(`❌ ${sig.symbol}: ${r.error}`);
      }
    } catch (e: any) {
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

  // P&L Metrics
  const totalOpenPnlEgp = openPositions.reduce((sum, p) => sum + p.pnlEgp, 0);

  // Simulated candidates and positions for Dry Run Mode
  const simulatedCandidates = [
    {
      id: 9991,
      scan_date: "2026-09-17",
      symbol: "TMGH",
      entry_price: 54.20,
      gap_pct: 0.0185,
      position_value: 5000,
      bought: false,
    },
    {
      id: 9992,
      scan_date: "2026-09-17",
      symbol: "FWRY",
      entry_price: 8.65,
      gap_pct: 0.0210,
      position_value: 5000,
      bought: false,
    },
  ];

  const simulatedPositions: EnrichedPosition[] = [
    {
      id: 9993,
      scan_date: "2026-09-17",
      symbol: "COMI",
      entry_price: 132.50,
      actual_buy_price: 132.50,
      buy_timestamp: "2026-09-17T08:05:00Z",
      gap_pct: 0.014,
      bid_depth_at_entry: 450000,
      position_value: 5000,
      bought: true,
      sold: false,
      day1_status: "HELD",
      day1_price: 132.50,
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
      currentPrice: 135.20,
      pnlEgp: 102,
      pnlPct: 0.0204,
      daysHeld: 2,
      daysRemaining: 3,
      exitDate: "2026-09-22",
      exitDayName: "الثلاثاء",
      isScheduledExit: false,
      isAnomaly: false,
      shares: 37,
    },
    {
      id: 9994,
      scan_date: "2026-09-17",
      symbol: "EKHO",
      entry_price: 1.30,
      actual_buy_price: 1.30,
      buy_timestamp: "2026-09-17T08:05:00Z",
      gap_pct: 0.022,
      bid_depth_at_entry: 120000,
      position_value: 5000,
      bought: true,
      sold: false,
      day1_status: "HELD",
      day1_price: 1.30,
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
      shares: 3846,
    },
  ];

  const activeCandidatesList = dryRunActive ? simulatedCandidates : todaySignals;
  const activeOpenPositionsList = dryRunActive ? simulatedPositions : openPositions;

  const emergencyAnomalyPositions = activeOpenPositionsList.filter((p) => p.isAnomaly);
  const scheduledExitPositions = activeOpenPositionsList.filter((p) => p.isScheduledExit);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-5" dir="rtl">
      <DataFreshnessBanner />
      <div className="mt-2 space-y-2">
        <LivePriceBadge />
      </div>
      <div className="mt-3">
        <MarketStateGauge />
      </div>
      <div className="mt-2 space-y-2">
        {dashErrorMsg && (
          <div className="rounded-xl border border-bear/40 bg-bear/10 text-bear px-3 py-2 text-xs font-bold">
            ❌ فشل جلب بيانات الداشبورد: {dashErrorMsg} — الصفحة هتعيد المحاولة تلقائياً كل 15 ثانية.
          </div>
        )}
        {dashFetching && !dashErrorMsg && (
          <div className="text-[11px] text-muted-foreground">⏳ جاري تحميل بيانات الداشبورد...</div>
        )}
      </div>

      {/* Control Header & Dry Run Switch */}
      <header className="flex flex-wrap items-center justify-between gap-3 bg-card border rounded-2xl p-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <h1 className="text-2xl font-black tracking-tight">غرفة العمليات — المومنتم الأسبوعي (قمة سنوية طازة)</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            أتمتة كاملة للمسح والمتابعة • نظام أسبوعي: دخول الأحد، خروج افتتاح الأسبوع القادم • دورك الوحيد: ضغط زر الشراء أو البيع في ثاندر بعد التنبيه.
          </p>
          <button
            className="mt-2 text-xs px-3 py-1.5 rounded-lg border bg-muted hover:bg-accent transition"
            onClick={async () => {
              try {
                const r = await fetch("/api/public/hooks/archive-folder?action=open");
                const j = await r.json();
                if (j.ok) console.log("archive:", j.catchup);
              } catch {}
            }}
          >
            📁 فتح مجلد أرشيف البيانات اليومية
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setDryRunActive(!dryRunActive);
              if (!dryRunActive) {
                playSignalChime();
              }
            }}
            className={`rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
              dryRunActive
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "bg-muted hover:bg-muted/70 text-foreground border-border"
            }`}
          >
            {dryRunActive ? "🧪 وضع المحاكاة مفعّل ✓ (إيقاف)" : "🧪 تجربة المحاكاة (Dry Run)"}
          </button>
          <button
            onClick={() => refetch()}
            className="rounded-xl px-3.5 py-2 text-xs font-semibold bg-muted hover:bg-muted/70 text-foreground border border-border"
          >
            تحديث البيانات 🔄
          </button>
        </div>
      </header>

      {/* Dry Run Controls & Audio Test Buttons */}
      {dryRunActive && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <span className="font-semibold text-amber-200">
              أنت الآن في وضع المحاكاة التجريبية: اختبر مظهر العداد التنازلي وتنبيهات الطوارئ وتجربة الأصوات قبل بدء الجلسة الحقيقية.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => playSignalChime()}
              className="bg-bull/20 hover:bg-bull/30 text-bull px-2.5 py-1 rounded text-[11px] font-bold"
            >
              🔔 نغمة الإشارة (10:00)
            </button>
            <button
              onClick={() => playEmergencySiren()}
              className="bg-bear/20 hover:bg-bear/30 text-bear px-2.5 py-1 rounded text-[11px] font-bold"
            >
              🚨 صفارة الطوارئ
            </button>
            <button
              onClick={() => playScheduledExitTone()}
              className="bg-primary/20 hover:bg-primary/30 text-primary-foreground px-2.5 py-1 rounded text-[11px] font-bold"
            >
              📅 نغمة البيع المجدول
            </button>
          </div>
        </div>
      )}

      {/* ── PRIORITY 1: EMERGENCY ALERTS (ANOMALIES & SCHEDULED EXITS) ── */}
      {(emergencyAnomalyPositions.length > 0 || sellAlerts.length > 0) && (
        <section className="space-y-3">
          {/* Anomaly / Negative News Emergency Banner */}
          {emergencyAnomalyPositions.map((p) => (
            <div
              key={`anom-${p.id}`}
              className="rounded-2xl border-2 border-amber-500 bg-amber-500/20 p-4 shadow-md flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <div className="text-sm font-black text-amber-300">
                    تنبيه طوارئ: {p.symbol} — تحقق فوراً من السهم!
                  </div>
                  <div className="text-xs text-amber-200/90 mt-0.5">
                    السبب: رصد خبر سلبي حاد أو تقلب استثنائي غير متوقع يهدد الصفقة قبل اكتمال مدة المسك.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSold(p)}
                disabled={busySignal === p.id}
                className="rounded-xl px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white"
              >
                تخارج اضطراري
              </button>
            </div>
          ))}

          {/* Scheduled Sell Alerts from backend */}
          {sellAlerts.map((s) => (
            <div
              key={`sa-${s.id}`}
              className="rounded-2xl border-2 border-primary/50 bg-primary/15 p-4 flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📅</span>
                <div>
                  <div className="text-sm font-black text-primary-foreground">
                    حان وقت البيع المجدول: {s.symbol} (اكتملت 5 جلسات — خروج افتتاح الأسبوع القادم)
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    نهاية فترة المسك الأسبوعية. الخروج بسعر السوق في تطبيق ثاندر عند الافتتاح — نفس قاعدة القياس التاريخي.
                  </div>
                </div>
              </div>
              <button
                onClick={() => onSold(s)}
                disabled={busySignal === s.id}
                className="rounded-xl px-4 py-2 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {busySignal === s.id ? "..." : "تم البيع ✓"}
              </button>
            </div>
          ))}
        </section>
      )}

      {actionMsg && (
        <div className="rounded-xl border bg-card p-3 text-xs font-bold text-bull flex items-center gap-2">
          <span>🔔</span>
          <span>{actionMsg}</span>
        </div>
      )}

      {/* ── SECTION 1: 10:00 AM QUALIFIED CANDIDATES & COUNTDOWN TIMER ── */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🎯</span>
              <h2 className="text-lg font-black">إشارات اليوم (الساعة 10:00 صباحاً)</h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
                {activeCandidatesList.length} مرشح
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              الأسهم المؤهلة بعد كل فلاتر النظام الصادق: شريعة فقط + سيولة ≥ 200 ألف ج.م/يوم (أعلى 100) + زخم 5 جلسات بين 8%-45% + فلتر النظام (تراكم 10 أسابيع) + قاعدة الفجوة عند الافتتاح (-3% إلى +2%).
            </p>
          </div>

          {/* 15-Minute Countdown Window */}
          <div className="flex items-center gap-2">
            {!isWindowExpired ? (
              <div className="flex items-center gap-2 rounded-xl bg-bull/15 border border-bull/30 px-3.5 py-2">
                <span className="text-base animate-pulse">⏱️</span>
                <div>
                  <div className="text-[10px] text-bull font-bold">نافذة التنفيذ الموصى بها</div>
                  <div className="text-base font-black font-mono text-bull tracking-wider">
                    متبقي {mm}:{ss} دقيقة
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3.5 py-2">
                <span className="text-base">⚠️</span>
                <div>
                  <div className="text-[10px] text-amber-400 font-bold">انتهت نافذة الـ 15 دقيقة</div>
                  <div className="text-xs text-amber-300 font-semibold">
                    الفرصة الأصلية بعيدة — تحقق من السعر قبل الشراء
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Warning Banner if Late */}
        {isWindowExpired && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
            <span>⚠️</span>
            <span>
              <b>تنبيه تأخر:</b> تجاوزت مدة الـ 15 دقيقة الأولى من الجلسة. الإشارات لا تُحذف تلقائياً حرصاً على عدم تفويت الفرص، ولكن تأكد من سعر السهم الحالي في تطبيق ثاندر قبل الضغط على الشراء.
            </span>
          </div>
        )}

        {activeCandidatesList.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b">
                <tr>
                  <th className="p-3 text-right font-bold">السهم</th>
                  <th className="p-3 text-right font-bold">سعر إشارة الدخول</th>
                  <th className="p-3 text-right font-bold">زخم 5 جلسات %</th>
                  <th className="p-3 text-right font-bold">قيمة المركز المخطط</th>
                  <th className="p-3 text-right font-bold">السعر المنفذ (إن اختلف)</th>
                  <th className="p-3 text-center font-bold">الإجراء في ثاندر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeCandidatesList.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/15 transition-colors">
                    <td className="p-3 font-bold font-mono text-sm">
                      {s.symbol}
                      {(s as any)._halal && (
                        <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans">شريعة</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">
                      {fmtPrice(Number(s.entry_price))} ج.م
                    </td>
                    <td className="p-3 font-mono font-bold text-bear">
                      +{(Number(s.gap_pct) * 100).toFixed(2)}%
                    </td>
                    <td className="p-3 font-mono font-semibold">
                      {Math.round(Number(s.position_value)).toLocaleString()} ج.م
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        step="0.01"
                        placeholder={fmtPrice(Number(s.entry_price))}
                        value={priceOverrides[s.id] ?? ""}
                        onChange={(e) => setPriceOverrides((p) => ({ ...p, [s.id]: e.target.value }))}
                        className="w-24 rounded-lg border bg-background px-2 py-1 text-xs font-mono"
                      />
                    </td>
                    <td className="p-3 text-center">
                      {!s.bought ? (
                        <button
                          onClick={() => onBought(s as SignalRow)}
                          disabled={busySignal === s.id}
                          className="rounded-xl px-4 py-1.5 text-xs font-black bg-bull text-bull-foreground hover:bg-bull/90 transition-all shadow-sm disabled:opacity-50"
                        >
                          {busySignal === s.id ? "جاري الحفظ..." : "تم الشراء ✓"}
                        </button>
                      ) : (
                        <span className="text-xs font-bold text-bull bg-bull/20 px-3 py-1 rounded-full">
                          تم الشراء قيد المتابعة ✓
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs">
            {isBeforeMarket
              ? "🕒 ننتظر بدء جلسة التداول في تمام الساعة 10:00 صباحاً لإطلاق إشارات اليوم."
              : "لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — أو فلتر النظام أوقف التداول. النظام أسبوعي: الدخول الأحد فقط."}
          </div>
        )}
      </section>

      {/* ── SECTION 1.5: LIVE TRACKING — EVERY SIGNAL ROW: NOMINATION ← LIVE ← % ── */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🔎</span>
              <h2 className="text-lg font-black">التتبع الحي — كل إشارة في الدفعة الحالية</h2>
              {batchScanDate && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold font-mono">
                  دفعة مسح {batchScanDate}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              رُشِّح بكام (سعر الترشيح) ← السعر الحي الآن ← الفرق اللحظي %. تحديث تلقائي كل 15 ثانية.
              «—» يعني لا يوجد سعر لحظي لهذا السهم الآن (السعر المرجعي يظل سعر الترشيح).
            </p>
          </div>
        </div>

        {todaySignals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground border-b">
                <tr>
                  <th className="p-3 text-right font-bold">السهم</th>
                  <th className="p-3 text-right font-bold">رُشِّح @</th>
                  <th className="p-3 text-right font-bold">حدود الشراء</th>
                  <th className="p-3 text-right font-bold">السعر الحي</th>
                  <th className="p-3 text-right font-bold">% حي من الترشيح</th>
                  <th className="p-3 text-right font-bold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {todaySignals.map((s) => {
                  const st = trackStatus(s);
                  return (
                    <tr key={`lt-${s.id}`} className="hover:bg-muted/15 transition-colors">
                      <td className="p-3 font-bold font-mono text-sm">
                        {s.symbol}
                        {s._halal && (
                          <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-500 font-sans">شريعة</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-muted-foreground">
                        {s._bandLo != null && s._bandHi != null ? `${fmtPrice(s._bandLo)} – ${fmtPrice(s._bandHi)}` : "—"}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {s.livePrice != null ? (
                          `${fmtPrice(s.livePrice)} ج.م`
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className={`p-3 font-mono font-bold ${s.livePct == null ? "text-muted-foreground" : s.livePct >= 0 ? "text-bull" : "text-bear"}`}>
                        {s.livePct != null ? `${s.livePct >= 0 ? "+" : ""}${(s.livePct * 100).toFixed(2)}%` : "—"}
                      </td>
                      <td className="p-3">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded bg-muted/60 ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs">
            لا توجد إشارات في الدفعة الحالية — ستظهر هنا فور أول مسح أسبوعي (الأحد).
          </div>
        )}
      </section>

      {/* ── SECTION 2: ACTIVE OPEN POSITIONS (TRACKING & 4-DAY EGX PROGRESSION) ── */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💼</span>
              <h2 className="text-lg font-black">
                الصفقات المفتوحة قيد المتابعة ({activeOpenPositionsList.length})
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              متابعة حية مستمرة لكل صفقة تم تأكيد شرائها طوال الأسبوع (5 جلسات) — الخروج الوحيد: افتتاح أول جلسة الأسبوع القادم. بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية عبر تصغير الحجم تلقائياً.
            </p>
          </div>

          {activeOpenPositionsList.length > 0 && (
            <div className="text-xs font-bold font-mono">
              إجمالي الأرباح اللحظية:{" "}
              <span className={totalOpenPnlEgp >= 0 ? "text-bull" : "text-bear"}>
                {totalOpenPnlEgp >= 0 ? "+" : ""}
                {Math.round(totalOpenPnlEgp).toLocaleString()} ج.م
              </span>
            </div>
          )}
        </div>

        {activeOpenPositionsList.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {activeOpenPositionsList.map((pos) => {
              const progressPct = Math.min(100, Math.round((pos.daysHeld / 5) * 100));
              return (
                <div
                  key={pos.id}
                  className={`rounded-2xl border p-4 space-y-3 transition-all ${
                    pos.isAnomaly
                      ? "border-amber-500 bg-amber-500/10"
                      : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-base font-black font-mono">{pos.symbol}</span>
                      <span className="text-[11px] text-muted-foreground mr-2">
                        دخول: {fmtDate(pos.scan_date)} @ {fmtPrice(Number(pos.actual_buy_price ?? pos.entry_price))} ج.م
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-black font-mono">
                        {fmtPrice(pos.currentPrice)} ج.م
                      </div>
                      <div
                        className={`text-[11px] font-bold font-mono ${
                          pos.pnlPct >= 0 ? "text-bull" : "text-bear"
                        }`}
                      >
                        {pos.pnlPct >= 0 ? "+" : ""}
                        {(pos.pnlPct * 100).toFixed(2)}% ({pos.pnlEgp >= 0 ? "+" : ""}
                        {Math.round(pos.pnlEgp).toLocaleString()} ج.م)
                      </div>
                    </div>
                  </div>

                  {/* Weekly holding progression (5 sessions, Sun..Thu) */}
                  <div className="space-y-1.5 bg-muted/40 p-2.5 rounded-xl border border-border/50 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-muted-foreground">
                        مسار الأسبوع (تقويم EGX):
                      </span>
                      <span className="font-bold text-foreground">
                        جلسة {Math.min(pos.daysHeld, 5)} من 5 (متبقي {pos.daysRemaining} جلسة)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pos.daysHeld >= 5 ? "bg-primary" : "bg-bull"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-0.5">
                      <span>بلا وقف خسارة (مُقاس: يزيد الخسارة) — الحماية: تصغير الحجم التلقائي</span>
                      <span>الخروج: {pos.exitDayName} {pos.exitDate} عند الافتتاح</span>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      {pos.shares.toLocaleString()} سهم
                    </span>
                    <button
                      onClick={() => onSold(pos)}
                      disabled={busySignal === pos.id}
                      className="rounded-xl px-4 py-1.5 text-xs font-black bg-bear/20 text-bear hover:bg-bear/30 disabled:opacity-50"
                    >
                      {busySignal === pos.id ? "..." : "تم البيع في ثاندر ✓"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-xs">
            لا توجد صفقات مفتوحة حالياً. عند ظهور إشارة وضغطك على «تم الشراء»، ستظهر الصفقة هنا وتخضع للمراقبة الحية بالثواني.
          </div>
        )}
      </section>

      {/* ── SECTION 3: EGX TRADING CALENDAR & WEEKEND PROTOCOL ── */}
      <section className="rounded-2xl border bg-muted/20 p-4 space-y-3 text-xs">
        <div className="flex items-center gap-2 text-foreground font-bold">
          <span>📅</span>
          <span>التقويم التشغيلي الصريح لـ EGX وتوزيع الأيام:</span>
        </div>
        <div className="grid md:grid-cols-2 gap-3 text-muted-foreground leading-relaxed">
          <div className="bg-card p-3 rounded-xl border">
            <b className="text-foreground block mb-1">دورة الأسبوع (5 جلسات، يتخطى عطلة نهاية الأسبوع):</b>
            الدخول: افتتاح أول جلسة الأسبوع (الأحد) — الخروج: افتتاح أول جلسة الأسبوع القادم.
            <br />
            <b>مثال حي:</b> دخول <b>الأحد</b> ➔ الأسبوع يمشي (الأحد-الخميس) ➔ الجمعة والسبت خارج الحساب ➔ خروج <b>الأحد القادم</b> عند الافتتاح. بلا وقف خسارة ولا جني أرباح — الاتنين مُقاسين: يزيدوا الخسارة.
          </div>
          <div className="bg-card p-3 rounded-xl border">
            <b className="text-foreground block mb-1">مهام عطلة الجمعة والسبت (التحليل المستقل):</b>
            تُستغل عطلة الجمعة والسبت في تشغيل العمليات التحليلية غير الحية دون تعارض مع التداول:
            <ul className="list-disc pr-4 mt-1 space-y-0.5">
              <li>إصدار التقرير الأسبوعي الشامل للمحفظة.</li>
              <li>فحص مؤشر الألفا (Alpha) ومقارنة الأداء بـ EGX30.</li>
              <li>مراجعة وتحديث قائمة أسهم الشريعة (كل 6 شهور).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: CAPITAL SETTINGS ── */}
      <section className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-56">
            <div className="text-sm font-bold mb-1">💰 رأس المال المتاح للتداول</div>
            <div className="text-[10px] text-muted-foreground mb-2">
              يُحسب عدد المراكز تلقائيًا: TOP_N = رأس المال ÷ 20,000 (من 1 إلى 5 مراكز — الإعداد المدروس N5: أفضل توازن عائد/اتساق مقاس). فوق 100 ألف يزيد حجم المركز الواحد.
            </div>
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={1}
                step={1000}
                value={capitalInput}
                onChange={(e) => setCapitalInput(e.target.value)}
                placeholder="مثال: 100000"
                className="w-40 rounded-xl border bg-background px-3 py-1.5 text-sm font-mono"
              />
              <button
                onClick={onSaveCapital}
                disabled={savingCap}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {savingCap ? "جاري الحفظ…" : "حفظ"}
              </button>
            </div>
            {capMsg && <div className="mt-1 text-[11px]">{capMsg}</div>}
          </div>
          {sizing && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="text-[9px] text-muted-foreground">رأس المال الفعّال</div>
                <div className="text-sm font-bold font-mono">{Math.round(sizing.total_capital).toLocaleString()} ج.م</div>
              </div>
              <div className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="text-[9px] text-muted-foreground">عدد المراكز (TOP_N)</div>
                <div className="text-sm font-bold font-mono">{sizing.top_n}</div>
              </div>
              <div className="rounded-xl border bg-muted/40 px-3 py-2">
                <div className="text-[9px] text-muted-foreground">حجم المركز (SLOT)</div>
                <div className="text-sm font-bold font-mono">{Math.round(sizing.slot_capital).toLocaleString()} ج.م</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── SECTION 5: DECISION AUDIT LOG (PERMANENT RECORD) ── */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h2 className="text-base font-bold">📜 سجل القرارات والتنبيهات الموثق (Decision Audit Log)</h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              سجل دائم ومؤرخ بالثانية لكل إشارة صدرت، كل إنذار طوارئ، ورد فعل المستخدم لتوثيق الأداء تاريخياً.
            </p>
          </div>
        </div>

        {auditLogs.length > 0 ? (
          <div className="overflow-x-auto max-h-60">
            <table className="w-full text-xs">
              <thead className="bg-muted/40 text-muted-foreground sticky top-0">
                <tr>
                  <th className="p-2 text-right">التوقيت</th>
                  <th className="p-2 text-right">نوع الحدث</th>
                  <th className="p-2 text-right">السهم</th>
                  <th className="p-2 text-right">السعر</th>
                  <th className="p-2 text-right">تصرف المستخدم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/15">
                    <td className="p-2 font-mono text-[10px] text-muted-foreground">
                      {log.created_at ? log.created_at.slice(0, 19).replace("T", " ") : "—"}
                    </td>
                    <td className="p-2 font-semibold">
                      {log.event_type === "USER_BOUGHT" && <span className="text-bull">🛒 تأكيد شراء</span>}
                      {log.event_type === "USER_SOLD" && <span className="text-primary">💰 تأكيد بيع</span>}
                      {log.event_type === "EMERGENCY_STOP_LOSS" && <span className="text-bear font-bold">🚨 إنذار وقف خسارة</span>}
                      {log.event_type === "SIGNAL_10AM" && <span>🎯 إشارة 10:00 صباحاً</span>}
                      {log.event_type === "SCHEDULED_EXIT" && <span>📅 خروج أسبوعي مجدول</span>}
                      {log.event_type === "MW_WEEKLY_SCAN" && <span className="text-bull">🔔 مسح أسبوعي — إشعار شراء</span>}
                      {log.event_type === "MW_WEEKLY_BUY" && <span className="text-bull">🛒 شراء أسبوعي (ورقي)</span>}
                      {log.event_type === "MW_WEEKLY_EXIT" && <span className="text-primary">📤 خروج أسبوعي — إغلاق الدفعة</span>}
                      {log.event_type === "MW_REGIME_CASH" && <span className="text-warn">⚠️ فلتر النظام — أسبوع كاش</span>}
                      {log.event_type === "MW_WEEKLY_GAP_SKIP" && <span className="text-warn">↩️ مرشح مستبعد — الفجوة خارج النطاق</span>}
                      {!["USER_BOUGHT", "USER_SOLD", "EMERGENCY_STOP_LOSS", "SIGNAL_10AM", "SCHEDULED_EXIT", "MW_WEEKLY_SCAN", "MW_WEEKLY_BUY", "MW_WEEKLY_EXIT", "MW_REGIME_CASH", "MW_WEEKLY_GAP_SKIP"].includes(log.event_type) && (
                        <span className="font-mono text-[10px] text-muted-foreground">{log.event_type}</span>
                      )}
                    </td>
                    <td className="p-2 font-mono font-bold">{log.symbol}</td>
                    <td className="p-2 font-mono">{log.trigger_price ? fmtPrice(Number(log.trigger_price)) : "—"} ج.م</td>
                    <td className="p-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted">
                        {log.user_action}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            لا توجد سجلات قرارات سابقة بعد. كل نقرة شراء أو بيع أو تنبيه طوارئ ستُوثق هنا تلقائياً.
          </p>
        )}
      </section>

      {/* ── SECTION 6: MEASURED PERFORMANCE (honest, halal-only) ── */}
      <section className="rounded-2xl border border-warn/40 bg-warn/10 p-4 space-y-2">
        <div className="font-bold text-sm">📋 الأداء المُقاس (شريعة فقط — باك-تست صادق 512 أسبوع 2016-2026، تكلفة ثاندر 0.05%)</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <StatCard label="AUDITED weekly win rate (agreed rule, 19 wks)" value={`${Math.round(AUDITED_WEEKLY_WIN_RATE * 100)}%`} tone="bull" sub={`95% CI ${Math.round(AUDITED_WIN_CI_LOW * 100)}-${Math.round(AUDITED_WIN_CI_HIGH * 100)} — 80pct NOT validated`} />
          <StatCard label="AUDITED weekly mean (capital-weighted)" value={`+${(AUDITED_WEEKLY_MEAN * 100).toFixed(1)}%`} tone="default" sub={`+${(AUDITED_WEEKLY_MEAN_EX_TOP2 * 100).toFixed(1)}% without 2 best weeks`} />
          <StatCard label="أسوأ أسبوع (10 سنين)" value={`${BACKTEST_WORST_WEEK_PCT.toLocaleString()}%`} tone="bear" />
          <StatCard label="أقصى تراجع (10 سنين)" value={`${BACKTEST_MAXDD_PCT.toLocaleString()}%`} tone="bear" sub="مع الحمايات التلقائية: ~27-30%" />
        </div>
        <div className="rounded-xl border border-border/50 bg-card/60 p-2.5 text-xs text-muted-foreground leading-relaxed">
          <b className="text-foreground">شكل الأسابيع الحقيقي (مقاس):</b> ~25-30% فقط من الأسابيع تتجاوز 2,500 ج.م ووسيط الأسبوع ≈ 0 —
          أغلب الأسابيع صغيرة أو سالبة والمتوسط بيتحقق من قفزات نادرة (زي +21,500 و+34,900 في يونيو/يوليو 2026) لا يمكن توقيتها.
          <b className="text-foreground"> ولا يوجد وعد بربح ثابت — مرفوض من كل الأطراف.</b>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{BACKTEST_DISCLAIMER_AR}</p>
      </section>

      {/* Rules Footer */}
      <footer className="text-center py-4 text-xs text-muted-foreground border-t">
        قواعد فلاتر الاستراتيجية ومعادلاتها مجمدة لمدة 4-6 أسابيع للاختبار والمراقبة الصارمة.
      </footer>
    </div>
  );
}
