import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getDashboard, type DashboardRow } from "@/lib/scan/dashboard.functions";
import { triggerScan, cancelScan } from "@/lib/scan/scan.functions";
import { getTrackRecord } from "@/lib/scan/track-record.functions";
import { getLiveQuotes, type LiveQuoteLite } from "@/lib/today/live-quote.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { ScanCountdown } from "@/components/scan-countdown";
import { getTodayScalp } from "@/lib/scan/paper-scalp.functions";
import { MacroBar } from "@/components/macro-bar";
import { StockSearch } from "@/components/stock-search";
import { MarketPulseCard } from "@/components/market-pulse-card";

export const Route = createFileRoute("/")({
  component: Index,
});

const SIGNAL_LABELS: Record<string, { ar: string; cls: string }> = {
  strong_buy: { ar: "شراء قوي", cls: "bg-bull text-bull-foreground" },
  buy: { ar: "شراء", cls: "bg-bull/70 text-bull-foreground" },
  neutral: { ar: "محايد", cls: "bg-warn text-warn-foreground" },
  sell: { ar: "بيع", cls: "bg-bear/70 text-bear-foreground" },
  strong_sell: { ar: "بيع قوي", cls: "bg-bear text-bear-foreground" },
};

const SIGNAL_FILTERS = [
  { key: "all", label: "الكل" },
  { key: "strong_buy", label: "شراء قوي" },
  { key: "buy", label: "شراء" },
  { key: "neutral", label: "محايد" },
  { key: "sell", label: "بيع" },
];

function PaperScalpLive() {
  const fetchScalp = useServerFn(getTodayScalp);
  const { data } = useQuery({
    queryKey: ["paper-scalp-today"],
    queryFn: () => fetchScalp(),
    refetchInterval: 20_000,
  });
  const trades = data?.trades ?? [];
  const open = trades.filter((t) => t.status === "open");
  const closed = trades.filter((t) => t.status === "closed");
  const totalPnl = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const byStrat = (s: string) => closed.filter((t) => t.strategy === s);
  const scalpPnl = byStrat("scalp-mr15").reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const stratLabel = (s?: string | null) =>
    s === "scalp-mr15" ? "Scalp" : (s ?? "—");
  return (
    <div className="mb-4 rounded-lg border-2 border-primary/60 bg-primary/5 p-4">
      <MarketPulseCard compact />
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="font-bold text-sm">
          📡 صفقات اليوم المباشرة (Paper) — {data?.date ?? ""}
        </div>
        <Link to="/paper" className="text-xs text-primary hover:underline">عرض الكل ←</Link>
      </div>
      {trades.length === 0 ? (
        <div className="text-xs text-muted-foreground">
          مفيش إشارات لسه. الفحص بيشتغل من 10:30 ص. (تحديث كل 20ث)
        </div>
      ) : (
        <>
          <div className="space-y-1.5">
            {trades.map((t) => (
              <div key={t.id} className={`flex items-center gap-3 rounded border p-2 text-xs ${
                t.status === "open" ? "bg-blue-50 dark:bg-blue-950/30 border-blue-300" : "bg-card"
              }`}>
                <span className="font-bold w-16">{t.symbol}</span>
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                  t.strategy === "scalp-mr15"
                    ? "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                }`}>{stratLabel(t.strategy)}</span>
                <span>دخول: <b className="tabular-nums">{Number(t.entry_price).toFixed(2)}</b></span>
                <span className="text-muted-foreground">TP <span className="tabular-nums text-bull">{Number(t.tp_price).toFixed(2)}</span> / SL <span className="tabular-nums text-bear">{Number(t.sl_price).toFixed(2)}</span></span>
                <span className="text-muted-foreground">
                  {new Date(t.entry_ts).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="ms-auto">
                  {t.status === "open" ? (
                    <span className="text-blue-600 font-semibold">⏳ مفتوحة</span>
                  ) : (
                    <span className={Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold"}>
                      {t.exit_reason} • {Number(t.pnl) >= 0 ? "+" : ""}{Number(t.pnl).toFixed(0)}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-muted-foreground flex flex-wrap gap-3">
            <span>مفتوحة: {open.length}</span>
            <span>مقفولة: {closed.length}</span>
            <span className={scalpPnl >= 0 ? "text-bull" : "text-bear"}>
              Scalp: {scalpPnl >= 0 ? "+" : ""}{scalpPnl.toFixed(0)}
            </span>
            <span className={totalPnl >= 0 ? "text-bull" : "text-bear"}>
              <b>الإجمالي: {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(0)} EGP</b>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function fmtNum(n: number | null | undefined, digits = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function StockCard({
  r,
  livePrice,
  marketOpen,
}: {
  r: DashboardRow;
  livePrice?: number;
  marketOpen?: boolean;
}) {
  const sig = r.signal ? SIGNAL_LABELS[r.signal] : null;
  const hasLive = livePrice != null && livePrice > 0 && r.close != null && r.close > 0;
  const livePct = hasLive ? ((livePrice! - r.close!) / r.close!) * 100 : null;
  const liveTotalPct = livePct != null ? (r.change_pct ?? 0) + livePct : null;
  const displayPrice = hasLive ? livePrice! : r.close;
  const displayPct = liveTotalPct ?? r.change_pct ?? 0;
  const displayPos = displayPct >= 0;
  return (
    <Link
      to="/stock/$symbol"
      params={{ symbol: r.symbol }}
      className="block rounded-xl border border-border bg-card p-5 transition hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{r.name_ar}</h3>
            <span className="text-xs text-muted-foreground">{r.symbol}</span>
          </div>
          {r.sector_ar && (
            <p className="mt-1 text-xs text-muted-foreground">{r.sector_ar}</p>
          )}
        </div>
        {sig && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${sig.cls}`}>
            {sig.ar}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold tabular-nums">{fmtNum(displayPrice)}</div>
            {hasLive && (
              <span
                title={marketOpen ? "سعر لحظي مباشر" : "آخر سعر متاح"}
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${marketOpen ? "bg-bull" : "bg-muted-foreground"}`}
              >
                {marketOpen && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-bull/60" />
                )}
              </span>
            )}
          </div>
          <div className={`text-sm tabular-nums ${displayPos ? "text-bull" : "text-bear"}`}>
            {displayPos ? "+" : ""}{fmtNum(displayPct, 2)}%
          </div>
          {livePct != null && (
            <div
              className={`mt-0.5 text-[11px] tabular-nums ${livePct >= 0 ? "text-bull" : "text-bear"}`}
              title="الحركة منذ آخر إغلاق محفوظ"
            >
              ⚡ {livePct >= 0 ? "+" : ""}{fmtNum(livePct, 2)}% لحظي
            </div>
          )}
          {sig && r.entry_timing_ar && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
              ⏱ {r.entry_timing_ar}
              {r.expected_next_day_pct != null && (
                <span className={`ms-1 ${r.expected_next_day_pct >= 0 ? "text-bull" : "text-bear"}`}>
                  (اليوم {r.expected_next_day_pct >= 0 ? "+" : ""}{fmtNum(r.expected_next_day_pct, 1)}%)
                </span>
              )}
              {r.expected_next_day_pct == null && r.expected_gain_pct != null && (
                <span className="ms-1 text-bull">(+{fmtNum(r.expected_gain_pct, 1)}%)</span>
              )}
            </div>
          )}
        </div>
        <div className="text-end text-xs text-muted-foreground">
          <div title="مؤشر القوة النسبية (0-100). فوق 70 = مبالغ، تحت 30 = فرصة">RSI: <span className="tabular-nums text-foreground">{fmtNum(r.rsi14, 1)}</span></div>
          <div title="حجم التداول مقابل المتوسط — فوق 1.5 = اهتمام">الحجم: <span className="tabular-nums text-foreground">×{fmtNum(r.vol_ratio, 2)}</span></div>
          <div title="درجة فنية مركبة (0-100) — كلما زادت كان أفضل">النتيجة: <span className="tabular-nums text-foreground">{fmtNum(r.composite_score, 1)}</span></div>
        </div>
      </div>

      {sig && r.entry_min != null && (
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs">
          <div title="النطاق المقترح لشراء السهم">
            <div className="text-muted-foreground">دخول</div>
            <div className="mt-1 font-semibold tabular-nums">
              {fmtNum(r.entry_min)}–{fmtNum(r.entry_max)}
            </div>
          </div>
          <div title="السعر المتوقع للبيع عنده">
            <div className="text-muted-foreground">الهدف</div>
            <div className="mt-1 font-semibold tabular-nums text-bull">{fmtNum(r.target)}</div>
          </div>
          <div title="إذا نزل السعر لهنا، نبيع لتقليل الخسارة">
            <div className="text-muted-foreground">وقف الخسارة</div>
            <div className="mt-1 font-semibold tabular-nums text-bear">{fmtNum(r.stop_loss)}</div>
          </div>
        </div>
      )}

      {sig && (r.partial_exit_pct != null || r.max_hold_days != null) && (
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-lg border border-dashed border-border p-2 text-center text-[11px]">
          {r.partial_exit_pct != null && (
            <div>
              <span className="text-muted-foreground">بِع نصف عند ربح </span>
              <span className="font-bold text-bull">+{fmtNum(r.partial_exit_pct, 1)}%</span>
            </div>
          )}
          {r.max_hold_days != null && (
            <div>
              <span className="text-muted-foreground">اخرج خلال </span>
              <span className="font-bold text-foreground">{r.max_hold_days} أيام</span>
            </div>
          )}
        </div>
      )}

      {sig && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span title="نسبة ثقة الذكاء الاصطناعي في التوصية">الثقة: <span className="font-semibold text-foreground">{r.confidence}%</span></span>
          <span title="الربح المتوقع ÷ الخسارة المحتملة. كلما زاد، كانت الصفقة أفضل">R:R <span className="font-semibold text-foreground tabular-nums">{fmtNum(r.rr_ratio, 2)}</span></span>
          <span title="نسبة رأس المال المقترحة للاستثمار">حجم المركز: <span className="font-semibold text-foreground">{fmtNum(r.position_size_pct, 1)}%</span></span>
          <span title="الفترة المتوقعة لتحقيق الهدف">الإطار: <span className="font-semibold text-foreground">{r.timeframe_days} ي</span></span>
        </div>
      )}

      {sig && (r.technical_score != null || r.fundamental_score != null || r.macro_score != null) && (
        <div className="mt-3 grid grid-cols-5 gap-1 rounded-lg bg-muted/30 p-2 text-[10px]">
          {[
            { label: "فني", v: r.technical_score, tip: "قوة المؤشرات الفنية (RSI, MACD, الحجم)" },
            { label: "أساسي", v: r.fundamental_score, tip: "P/E و ROE و نمو الإيرادات" },
            { label: "مشاعر", v: r.sentiment_score, tip: "تحليل الأخبار العربية" },
            { label: "اقتصاد", v: r.macro_score, tip: "الدولار، الذهب، S&P 500" },
            { label: "قطاع", v: r.sector_score, tip: "أداء القطاع" },
          ].map((d) => (
            <div key={d.label} className="text-center" title={d.tip}>
              <div className="text-muted-foreground">{d.label}</div>
              <div className={`font-bold tabular-nums ${
                d.v == null ? "text-muted-foreground" :
                d.v >= 70 ? "text-bull" : d.v >= 50 ? "text-foreground" : "text-bear"
              }`}>
                {d.v == null ? "—" : Math.round(d.v)}
              </div>
            </div>
          ))}
        </div>
      )}
    </Link>
  );
}

function Index() {
  const fetchDashboard = useServerFn(getDashboard);
  const scanFn = useServerFn(triggerScan);
  const cancelFn = useServerFn(cancelScan);
  const fetchTrack = useServerFn(getTrackRecord);
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const qc = useQueryClient();
  const [signalFilter, setSignalFilter] = useState<string>("all");
  const [message, setMessage] = useState<string | null>(null);
  const [scanDetails, setScanDetails] = useState<string[]>([]);
  const [marketOpen, setMarketOpen] = useState(() => getMarketStatus().isOpen);

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5000);
    return () => clearInterval(id);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: (q) => {
      const status = (q.state.data as { status?: string } | undefined)?.status;
      return status === "running" ? 5_000 : 60_000;
    },
  });

  const { data: track } = useQuery({
    queryKey: ["track-record-summary"],
    queryFn: () => fetchTrack(),
    staleTime: 5 * 60_000,
  });

  const scan = useMutation({
    mutationFn: () => scanFn(),
    onSuccess: (res: { ok: boolean; message?: string }) => {
      setScanDetails([]);
      setMessage(res.message ?? (res.ok ? "بدأ المسح" : "فشل المسح"));
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => { setScanDetails([]); setMessage(`فشل المسح: ${(e as Error).message}`); },
  });

  const cancel = useMutation({
    mutationFn: () => cancelFn(),
    onSuccess: (res: { ok: boolean; message?: string }) => {
      setMessage(res.message ?? "تم الإلغاء");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => { setMessage(`فشل الإلغاء: ${(e as Error).message}`); },
  });

  const rows = useMemo(() => {
    const all = data?.rows ?? [];
    if (signalFilter === "all") return all;
    return all.filter((r) => r.signal === signalFilter);
  }, [data, signalFilter]);

  const lastUpdated = data?.finishedAt
    ? new Date(data.finishedAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const topPicks = data?.topPicks ?? [];

  const liveSymbols = useMemo(() => {
    const set = new Set<string>();
    for (const r of topPicks) set.add(r.symbol);
    for (const r of rows) set.add(r.symbol);
    return Array.from(set).slice(0, 100);
  }, [topPicks, rows]);

  const liveBatch = useQuery({
    queryKey: ["dashboard-live", liveSymbols.join(",")],
    queryFn: () => fetchLiveBatch({ data: { symbols: liveSymbols } }),
    enabled: liveSymbols.length > 0,
    // Poll fast when market is open, slowly when closed (so user still sees last snapshot)
    refetchInterval: marketOpen ? 10_000 : 60_000,
    refetchIntervalInBackground: false,
    staleTime: marketOpen ? 5_000 : 30_000,
  });
  const livePriceBySymbol = useMemo(() => {
    const m = new Map<string, number>();
    for (const q of (liveBatch.data ?? []) as LiveQuoteLite[]) {
      if (q.price > 0) m.set(q.symbol, q.price);
    }
    return m;
  }, [liveBatch.data]);
  const liveFor = (sym: string) =>
    livePriceBySymbol.get(sym.replace(/\.CA$/i, "").toUpperCase());

  const aiDone = data?.aiCount ?? 0;
  const totalStocks = data?.stocksCount ?? 0;

  // Derive 4 real stages from existing scan state — no DB change needed.
  // 1) إنشاء المسح (status=running, stocksCount=0)
  // 2) جلب بيانات السوق (stocksCount>0, aiCount=0)
  // 3) تحليل الذكاء الاصطناعي (aiCount>0, aiCount<stocksCount)
  // 4) اكتمل (status=completed)
  const isRunning = data?.status === "running" || scan.isPending;
  const isCompleted = data?.status === "completed";
  let stageIdx = 0; // 0..3
  if (isCompleted) stageIdx = 3;
  else if (aiDone > 0) stageIdx = 2;
  else if (totalStocks > 0) stageIdx = 1;
  else if (isRunning) stageIdx = 0;

  // Map each stage to a progress band. While external market data is loading,
  // advance by elapsed time so the UI does not look frozen at 5%.
  const elapsedMs = data?.startedAt ? Date.now() - new Date(data.startedAt).getTime() : 0;
  let progressPct = 0;
  if (stageIdx === 0) progressPct = Math.min(12, 5 + Math.floor(elapsedMs / 2000));
  else if (stageIdx === 1) progressPct = Math.min(30, 15 + Math.floor(elapsedMs / 2000));
  else if (stageIdx === 2) {
    const ratio = totalStocks > 0 ? Math.min(1, aiDone / totalStocks) : 0;
    progressPct = Math.round(30 + ratio * 65);
  } else if (stageIdx === 3) progressPct = 100;

  const STAGES: { label: string; hint: string }[] = [
    { label: "بدء المسح", hint: "تجهيز عملية المسح…" },
    { label: "جلب بيانات السوق", hint: "تحميل الأسعار والمؤشرات من المصادر…" },
    { label: "تحليل الذكاء الاصطناعي", hint: "حساب التوصيات لكل سهم…" },
    { label: "اكتمل", hint: "تم تجهيز التوصيات." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold">
              <span className="text-primary">EGX</span> سكانر
            </h1>
            <p className="text-xs text-muted-foreground">
              ماسح ذكي للبورصة المصرية — توصيات للمدى القصير (1–3 أيام)
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StockSearch />
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                آخر تحديث: {lastUpdated}
              </span>
            )}
            <Link to="/backtest" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              📊 Backtest
            </Link>
            <Link to="/halal-daytrade" className="rounded-lg border border-bull/60 bg-bull/15 px-3 py-2 text-sm font-bold text-bull hover:bg-bull/25">
              🕌 تداول يومي حلال
            </Link>
            <Link to="/plan" className="rounded-lg border border-primary/60 bg-primary/15 px-3 py-2 text-sm font-bold text-primary hover:bg-primary/25">
              🎯 {marketOpen ? "خطة النهارده" : "خطة الجلسة القادمة"}
            </Link>
            <Link to="/today" className="rounded-lg border border-bull/60 bg-bull/15 px-3 py-2 text-sm font-bold text-bull hover:bg-bull/25">
              ⚡ صفقة اليوم
            </Link>
            <Link to="/morning" className="rounded-lg border border-warn/60 bg-warn/15 px-3 py-2 text-sm font-bold text-warn hover:bg-warn/25">
              🌅 توصية الصباح
            </Link>
            <Link to="/investment" className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20">
              💼 استثمار شهري
            </Link>
            <Link to="/rights" className="rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20">
              📜 حقوق اكتتاب شرعية
            </Link>
            <Link to="/deep" className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20">
              🧠 تحليل هجين
            </Link>
            <Link to="/tomorrow" className="rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20">
              🎯 توقعات الغد
            </Link>
            <Link to="/track-record" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              📈 سجل الأداء
            </Link>
            <Link to="/tiers" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              🧠 طبقات الذكاء
            </Link>
            <Link to="/daily" className="rounded-lg border border-bull/50 bg-bull/10 px-3 py-2 text-sm font-semibold text-bull hover:bg-bull/20">
              🎯 صفقة اليوم
            </Link>
            <Link to="/positions" className="rounded-lg border border-warn/50 bg-warn/10 px-3 py-2 text-sm font-semibold text-warn hover:bg-warn/20">
              💰 مراكزي
            </Link>
            <Link to="/reality" className="rounded-lg border border-bear/50 bg-bear/10 px-3 py-2 text-sm font-semibold text-bear hover:bg-bear/20">
              🔍 Reality Check
            </Link>
            <Link to="/learning" className="rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20">
              ⚡ التعلّم
            </Link>
            <button
              onClick={() => { setMessage(null); setScanDetails([]); scan.mutate(); }}
              disabled={scan.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {scan.isPending ? "جاري المسح…" : "تحديث الآن"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Live ticker tape — confirms live polling is active */}
        {liveSymbols.length > 0 && (
          <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2 text-xs">
            <span className="flex items-center gap-1 font-bold whitespace-nowrap">
              <span className={`relative inline-flex h-2 w-2 rounded-full ${marketOpen ? "bg-bull" : "bg-muted-foreground"}`}>
                {marketOpen && <span className="absolute inset-0 animate-ping rounded-full bg-bull/60" />}
              </span>
              {marketOpen ? "LIVE" : "آخر إغلاق"}
            </span>
            <div className="flex-1 overflow-hidden">
              <div className="flex gap-5 overflow-x-auto whitespace-nowrap tabular-nums">
                {(liveBatch.data ?? []).filter((q) => q.price > 0).map((q) => {
                  const pos = q.change_pct >= 0;
                  return (
                    <span key={q.symbol} className="inline-flex items-center gap-1">
                      <b>{q.symbol}</b>
                      <span>{fmtNum(q.price)}</span>
                      <span className={pos ? "text-bull" : "text-bear"}>
                        {pos ? "+" : ""}{fmtNum(q.change_pct, 2)}%
                      </span>
                    </span>
                  );
                })}
                {liveBatch.isLoading && <span className="text-muted-foreground">جاري التحميل…</span>}
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
              تحديث كل {marketOpen ? "10ث" : "60ث"}
            </span>
          </div>
        )}

        <div className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-2 text-xs text-warn-foreground/90 text-warn">
          ⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. تداول الأسهم ينطوي على مخاطر فقدان رأس المال.
        </div>

        <PaperScalpLive />

        <MacroBar />

        <div className="mb-4">
          <ScanCountdown />
        </div>

        {message && (
          <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3 text-sm">
            <div>{message}</div>
            {scanDetails.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                {scanDetails.slice(0, 10).map((detail) => <li key={detail}>{detail}</li>)}
              </ul>
            )}
          </div>
        )}

        {(isRunning || (scan.isPending && !isCompleted)) && (
          <div className="mb-4 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
                {STAGES[stageIdx].label}
              </div>
              <span className="text-xs font-bold tabular-nums text-primary">{progressPct}%</span>
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {stageIdx === 2 && totalStocks > 0
                ? `تم تحليل ${aiDone} من ${totalStocks} سهم — يحدّث تلقائياً.`
                : STAGES[stageIdx].hint}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span>📥 الأسهم في نطاق المسح: <span className="font-semibold tabular-nums text-foreground">{totalStocks}</span></span>
              <span>🧮 مرحلة البيانات: <span className="font-semibold tabular-nums text-foreground">{stageIdx >= 2 ? "اكتملت" : stageIdx >= 1 ? "جارية" : "تبدأ"}</span></span>
              <span>🤖 اكتمل تحليل AI: <span className="font-semibold tabular-nums text-foreground">{aiDone}{totalStocks > 0 ? ` / ${totalStocks}` : ""}</span></span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-[10px]">
              {STAGES.map((s, i) => {
                const done = i < stageIdx;
                const active = i === stageIdx;
                return (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <div
                      className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold ${
                        done
                          ? "border-primary bg-primary text-primary-foreground"
                          : active
                          ? "border-primary bg-primary/20 text-primary animate-pulse"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? "✓" : i + 1}
                    </div>
                    <span
                      className={`leading-tight ${
                        active ? "font-semibold text-primary" : done ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {data?.status === "running" && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => cancel.mutate()}
                  disabled={cancel.isPending}
                  className="rounded-md border border-bear/40 bg-bear/10 px-3 py-1 text-xs font-semibold text-bear transition hover:bg-bear/20 disabled:opacity-50"
                >
                  {cancel.isPending ? "جاري الإلغاء…" : "✕ إلغاء المسح"}
                </button>
              </div>
            )}
          </div>
        )}

        {data?.status === "completed" && data?.finishedAt && !scan.isPending && (
          <div className="mb-4 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
            ✓ اكتمل المسح — {data.aiCount ?? 0} تحليل من {data.stocksCount ?? 0} سهم.
          </div>
        )}

        {data?.errorMessage && (
          <div className="mb-4 rounded-lg border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
            <div className="font-semibold">تفاصيل آخر مسح</div>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              {data.errorMessage.split(" | ").slice(0, 10).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </div>
        )}

        {topPicks.length > 0 && signalFilter === "all" && (
          <div className="mb-6 rounded-xl border border-bull/40 bg-gradient-to-br from-bull/10 to-bull/5 p-5">
            <div className="mb-3 flex items-center gap-2">
              <span className="text-lg">🚀</span>
              <h2 className="text-lg font-bold text-bull">
                أفضل {topPicks.length} فرص متوقعة للصعود {marketOpen ? "النهارده" : "للجلسة القادمة"}
              </h2>
              {!data?.isSynthetic && data?.dataProvider && (
                <span className="ms-auto rounded-full bg-bull/20 px-2 py-0.5 text-[10px] font-semibold text-bull">
                  ✓ بيانات حقيقية ({data.dataProvider})
                </span>
              )}
              {data?.isSynthetic && (
                <span className="ms-auto rounded-full bg-bear/20 px-2 py-0.5 text-[10px] font-semibold text-bear">
                  ⚠️ بيانات اصطناعية — لا تتداول
                </span>
              )}
            </div>
            <p className="mb-4 text-xs text-muted-foreground">
              {marketOpen
                ? "مرتّبة حسب (الحركة المتوقعة للجلسة الحالية × ثقة الذكاء الاصطناعي). اضغط على السهم لتفاصيل الدخول والخروج."
                : "السوق مغلق حاليًا — دي ترشيحات مبنية على آخر إغلاق وجاهزة لجلسة التداول القادمة. اضغط على السهم لتفاصيل الدخول والخروج."}
            </p>
            {track && track.buy_30d.total >= 5 && (
              <Link
                to="/track-record"
                className={`mb-4 flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition hover:opacity-80 ${
                  track.buy_30d.expectancy_pct > 0
                    ? "border-bull/40 bg-bull/10"
                    : "border-bear/40 bg-bear/10"
                }`}
              >
                <span>
                  📊 آخر 30 يوم: {track.buy_30d.wins} فوز / {track.buy_30d.losses} خسارة —
                  معدل نجاح <strong>{track.buy_30d.win_rate}%</strong> —
                  توقع لكل صفقة{" "}
                  <strong className={track.buy_30d.expectancy_pct > 0 ? "text-bull" : "text-bear"}>
                    {track.buy_30d.expectancy_pct >= 0 ? "+" : ""}{track.buy_30d.expectancy_pct}%
                  </strong>
                </span>
                <span className="text-muted-foreground">شاهد التفاصيل ←</span>
              </Link>
            )}
            <div className="grid gap-3 md:grid-cols-3">
              {topPicks.map((r, i) => (
                <div key={r.symbol} className="relative">
                  <div className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-bull text-xs font-extrabold text-bull-foreground shadow-lg">
                    #{i + 1}
                  </div>
                  <StockCard r={r} livePrice={liveFor(r.symbol)} marketOpen={marketOpen} />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-2">
          {SIGNAL_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setSignalFilter(f.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                signalFilter === f.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Metrics legend */}
        <details className="mb-4 rounded-lg border border-border bg-card/50 px-4 py-2 text-xs">
          <summary className="cursor-pointer font-semibold text-muted-foreground hover:text-foreground">
            📖 شرح الأرقام والمصطلحات
          </summary>
          <div className="mt-2 grid grid-cols-1 gap-1 text-muted-foreground md:grid-cols-2">
            <p><strong className="text-foreground">السعر الحالي:</strong> سعر الإغلاق الأخير للسهم (بالجنيه).</p>
            <p><strong className="text-foreground">% التغيير:</strong> نسبة صعود/هبوط السهم عن الأمس.</p>
            <p><strong className="text-foreground">RSI:</strong> مؤشر القوة النسبية (0-100). تحت 30 = فرصة شراء، فوق 70 = مبالغة.</p>
            <p><strong className="text-foreground">الحجم:</strong> حجم التداول اليوم مقابل المتوسط. فوق 1.5 = اهتمام مرتفع.</p>
            <p><strong className="text-foreground">النتيجة:</strong> درجة فنية مركبة (0-100). كلما زادت، كان السهم أفضل فنياً.</p>
            <p><strong className="text-foreground">دخول من–إلى:</strong> النطاق المقترح لشراء السهم.</p>
            <p><strong className="text-foreground">الهدف:</strong> السعر المتوقع للبيع عنده لتحقيق ربح.</p>
            <p><strong className="text-foreground">وقف الخسارة:</strong> سعر الإغلاق للصفقة إذا تحرك السهم ضدنا.</p>
            <p><strong className="text-foreground">R:R:</strong> الربح المتوقع ÷ الخسارة المحتملة. فوق 2 يعني صفقة جيدة.</p>
            <p><strong className="text-foreground">حجم المركز:</strong> نسبة رأس المال المقترحة للاستثمار في السهم.</p>
          </div>
        </details>

        {isLoading ? (
          <div className="text-center text-muted-foreground py-20">جاري التحميل…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <p className="text-lg font-semibold">
              {signalFilter === "all"
                ? "لا توجد بيانات بعد"
                : `لا توجد أسهم بإشارة "${SIGNAL_FILTERS.find((f) => f.key === signalFilter)?.label}" حالياً`}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {signalFilter === "all"
                ? 'اضغط "تحديث الآن" لبدء أول عملية مسح للأسهم.'
                : "جرب تصفية أخرى أو اضغط الكل لعرض جميع الأسهم."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {rows.map((r) => (
              <StockCard
                key={r.symbol}
                r={r}
                livePrice={liveFor(r.symbol)}
                marketOpen={marketOpen}
              />
            ))}
          </div>
        )}

        <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          البيانات من Yahoo Finance · التحليل بواسطة Lovable AI (Gemini)
          <br />
          هذا الموقع مستقل وليس مرتبطاً بالبورصة المصرية. لا يمثل المحتوى توصية استثمارية.
        </footer>
      </div>
    </div>
  );
}
