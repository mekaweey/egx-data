import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listBacktests, runBacktest, getBacktest } from "@/lib/backtest/backtest.functions";
import { backfillHistory, getCandlesStats } from "@/lib/backtest/backfill.functions";

export const Route = createFileRoute("/backtest")({
  component: BacktestPage,
  head: () => ({
    meta: [
      { title: "Backtesting — اختبار الاستراتيجية على بيانات تاريخية" },
      { name: "description", content: "محاكاة استراتيجية التوصيات على آخر 90 يوم لقياس نسبة النجاح والربحية." },
    ],
  }),
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function MetricCard({ label, value, suffix, tone }: { label: string; value: string; suffix?: string; tone?: "good" | "bad" | "neutral" }) {
  const cls = tone === "good" ? "text-bull" : tone === "bad" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${cls}`}>
        {value}{suffix && <span className="ms-1 text-sm font-normal text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

type TradeRow = {
  exit_reason: string | null;
  market_regime: string | null;
  confidence: number | null;
  signal: string | null;
  days_held: number | null;
  pnl_pct: number | string | null;
};

type Bucket = {
  label: string;
  count: number;
  wins: number;
  losses: number;
  sumWin: number;
  sumLoss: number; // positive number
  sumAll: number;
};

function emptyBucket(label: string): Bucket {
  return { label, count: 0, wins: 0, losses: 0, sumWin: 0, sumLoss: 0, sumAll: 0 };
}

function addToBucket(b: Bucket, pnl: number) {
  b.count += 1;
  b.sumAll += pnl;
  if (Math.abs(pnl) < 0.1) return; // scratch — excluded from win/loss
  if (pnl > 0) { b.wins += 1; b.sumWin += pnl; }
  else if (pnl < 0) { b.losses += 1; b.sumLoss += -pnl; }
}

function groupBy<T>(trades: TradeRow[], keyFn: (t: TradeRow) => string | null, order?: string[]): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const t of trades) {
    const k = keyFn(t);
    if (k == null) continue;
    const pnl = Number(t.pnl_pct);
    if (!Number.isFinite(pnl)) continue;
    if (!map.has(k)) map.set(k, emptyBucket(k));
    addToBucket(map.get(k)!, pnl);
  }
  const arr = Array.from(map.values());
  if (order) {
    arr.sort((a, b) => {
      const ia = order.indexOf(a.label);
      const ib = order.indexOf(b.label);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
  } else {
    arr.sort((a, b) => b.count - a.count);
  }
  return arr;
}

function BreakdownTable({ title, hint, buckets }: { title: string; hint?: string; buckets: Bucket[] }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <div className="text-sm font-bold">{title}</div>
        {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs">
            <tr>
              <th className="px-3 py-2 text-end">الشريحة</th>
              <th className="px-3 py-2 text-end">عدد</th>
              <th className="px-3 py-2 text-end">% من الكل</th>
              <th className="px-3 py-2 text-end">WR</th>
              <th className="px-3 py-2 text-end">PF</th>
              <th className="px-3 py-2 text-end">Avg PnL</th>
              <th className="px-3 py-2 text-end">إجمالي PnL</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              const grandTotal = buckets.reduce((s, b) => s + b.count, 0) || 1;
              return buckets.map((b) => {
                const decisive = b.wins + b.losses;
                const wr = decisive ? (b.wins / decisive) * 100 : 0;
                const pf = b.sumLoss > 0 ? b.sumWin / b.sumLoss : b.sumWin > 0 ? 999 : 0;
                const avg = b.count ? b.sumAll / b.count : 0;
                const wrTone = decisive === 0 ? "" : wr >= 50 ? "text-bull" : wr >= 40 ? "" : "text-bear";
                const pfTone = pf === 0 ? "" : pf >= 1.3 ? "text-bull" : pf >= 1 ? "" : "text-bear";
                const avgTone = avg > 0 ? "text-bull" : avg < 0 ? "text-bear" : "";
                return (
                  <tr key={b.label} className="border-t border-border">
                    <td className="px-3 py-2 text-xs">{b.label}</td>
                    <td className="px-3 py-2 tabular-nums">{b.count}</td>
                    <td className="px-3 py-2 tabular-nums text-xs text-muted-foreground">
                      {((b.count / grandTotal) * 100).toFixed(0)}%
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${wrTone}`}>
                      {decisive ? `${wr.toFixed(1)}%` : "—"}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${pfTone}`}>
                      {pf === 0 ? "—" : pf >= 999 ? "∞" : pf.toFixed(2)}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${avgTone}`}>
                      {avg > 0 ? "+" : ""}{avg.toFixed(2)}%
                    </td>
                    <td className={`px-3 py-2 tabular-nums text-xs ${avgTone}`}>
                      {b.sumAll > 0 ? "+" : ""}{b.sumAll.toFixed(1)}%
                    </td>
                  </tr>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BacktestPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBacktests);
  const runFn = useServerFn(runBacktest);
  const getFn = useServerFn(getBacktest);
  const backfillFn = useServerFn(backfillHistory);
  const statsFn = useServerFn(getCandlesStats);

  const [minConf, setMinConf] = useState(75);
  const [maxHold, setMaxHold] = useState(6);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const list = useQuery({ queryKey: ["backtests"], queryFn: () => listFn() });
  const stats = useQuery({ queryKey: ["candles-stats"], queryFn: () => statsFn() });
  const detail = useQuery({
    queryKey: ["backtest", selectedId],
    queryFn: () => getFn({ data: { id: selectedId! } }),
    enabled: !!selectedId,
  });

  const run = useMutation({
    mutationFn: () => runFn({ data: { minConfidence: minConf, maxHold } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["backtests"] });
      setSelectedId(res.backtestId);
    },
  });

  const [backfillProgress, setBackfillProgress] = useState<{
    processed: number;
    total: number;
    candles: number;
    failed: string[];
    providers: Record<string, number>;
  } | null>(null);

  const backfill = useMutation({
    mutationFn: async (days: number) => {
      let offset = 0;
      let total = 0;
      let processed = 0;
      let candles = 0;
      const failed: string[] = [];
      const providers: Record<string, number> = {};
      setBackfillProgress({ processed: 0, total: 0, candles: 0, failed: [], providers: {} });
      while (true) {
        const r = await backfillFn({ data: { days, offset, limit: 8 } });
        total = r.symbolsTotal;
        processed += r.symbolsProcessed;
        candles += r.candlesInserted;
        failed.push(...r.failed);
        for (const [p, n] of Object.entries(r.providerBreakdown ?? {})) {
          providers[p] = (providers[p] ?? 0) + (n as number);
        }
        setBackfillProgress({ processed, total, candles, failed: [...failed], providers: { ...providers } });
        if (r.done) {
          return {
            symbolsTotal: total,
            symbolsProcessed: processed,
            candlesInserted: candles,
            failed,
            daysRequested: days,
            providerBreakdown: providers,
          };
        }
        offset = r.nextOffset;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["candles-stats"] });
    },
  });

  const hasData = (stats.data?.totalCandles ?? 0) > 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="text-xl font-bold">Backtesting — اختبار الاستراتيجية</h1>
            <p className="text-xs text-muted-foreground">محاكاة قرارات الشراء على البيانات التاريخية لقياس الأداء الحقيقي</p>
          </div>
          <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">← الرئيسية</Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6">
        <section className="mb-6 rounded-xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-bold">📥 البيانات التاريخية</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                الـ Backtest محتاج بيانات OHLC يومية للأسهم. كل ما البيانات أكتر، كل ما النتيجة أدق.
              </p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm tabular-nums">
                <span>إجمالي الشموع: <b>{fmt(stats.data?.totalCandles ?? 0, 0)}</b></span>
                <span>عدد الأسهم المغطاة: <b>{fmt(stats.data?.distinctSymbols ?? 0, 0)}</b></span>
                <span className="text-muted-foreground">
                  الفترة: {stats.data?.minDate ?? "—"} → {stats.data?.maxDate ?? "—"}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => backfill.mutate(500)}
                disabled={backfill.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {backfill.isPending
                  ? `جاري الجلب... ${backfillProgress?.processed ?? 0}/${backfillProgress?.total ?? "?"}`
                  : "📥 جلب آخر سنتين"}
              </button>
              <button
                onClick={() => backfill.mutate(1000)}
                disabled={backfill.isPending}
                className="rounded-lg border border-border px-4 py-2 text-xs hover:bg-muted disabled:opacity-50"
              >
                أو جلب 4 سنوات (أبطأ)
              </button>
            </div>
          </div>
          {!hasData && !backfill.isPending && (
            <div className="mt-4 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear">
              ⚠️ مفيش بيانات تاريخية لسة. اضغط <b>"جلب آخر سنتين"</b> قبل ما تشغّل أي Backtest.
            </div>
          )}
          {backfill.data && (
            <div className="mt-4 rounded-lg bg-bull/10 px-3 py-2 text-sm text-bull">
              ✅ تم بنجاح: {backfill.data.symbolsProcessed}/{backfill.data.symbolsTotal} سهم،
              {" "}{fmt(backfill.data.candlesInserted, 0)} شمعة.
              {backfill.data.failed.length > 0 && (
                <div className="mt-1 text-xs text-muted-foreground">
                  فشل في: {backfill.data.failed.join(", ")}
                </div>
              )}
              {backfill.data.providerBreakdown && (
                <div className="mt-1 text-xs text-muted-foreground">
                  المصادر: {Object.entries(backfill.data.providerBreakdown)
                    .map(([p, n]) => `${p}: ${n}`)
                    .join(" · ")}
                </div>
              )}
              {backfill.data.providerBreakdown?.synthetic > 0 && (
                <div className="mt-2 rounded bg-amber-500/10 px-2 py-1 text-xs text-amber-500">
                  ⚠️ تنبيه: ياهو محظور حالياً (429 Rate Limit) وتم استخدام بيانات تركيبية كملاذ أخير لبعض الأسهم.
                  نتائج الـ Backtest على هذه الأسهم تقديرية وليست دقيقة 100%.
                </div>
              )}
            </div>
          )}
          {backfill.isError && (
            <div className="mt-4 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear">
              فشل الجلب: {(backfill.error as Error).message}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-base font-bold">تشغيل محاكاة جديدة</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            تستخدم آخر بيانات تاريخية محفوظة (يومية). لكل يوم تحسب المؤشرات بدون نظرة مستقبلية، تفلتر بالاستراتيجية، تفتح صفقة عند فتح اليوم التالي، وتتابع حتى يضرب الهدف أو وقف الخسارة أو تنتهي مدة الاحتفاظ.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">الحد الأدنى للثقة</span>
              <input
                type="number" min={70} max={90}
                value={minConf}
                onChange={(e) => setMinConf(Math.max(70, Math.min(90, Number(e.target.value) || 75)))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 tabular-nums"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">أقصى مدة احتفاظ (أيام)</span>
              <input
                type="number" min={2} max={10}
                value={maxHold}
                onChange={(e) => setMaxHold(Math.max(2, Math.min(10, Number(e.target.value) || 5)))}
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 tabular-nums"
              />
            </label>
            <div className="flex items-end">
              <button
                onClick={() => run.mutate()}
                disabled={run.isPending}
                className="w-full rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {run.isPending ? "جاري المحاكاة..." : "شغّل المحاكاة"}
              </button>
            </div>
          </div>
          {run.isError && (
            <p className="mt-3 rounded-lg bg-bear/10 px-3 py-2 text-sm text-bear">
              فشل: {(run.error as Error).message}
            </p>
          )}
        </section>

        {detail.data && (
          <section className="mt-6">
            <h2 className="mb-3 text-base font-bold">نتيجة المحاكاة</h2>
            {detail.data.dataSource && (detail.data.dataSource.syntheticPct > 0 || detail.data.dataSource.unknownTrades > 0) && (
              <div className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                ⚠️ <b>تحذير مصدر البيانات:</b>{" "}
                {detail.data.dataSource.syntheticPct}% من الصفقات على بيانات <b>اصطناعية مولّدة</b>{" "}
                ({detail.data.dataSource.syntheticTrades} صفقة) — مش تداول حقيقي من البورصة المصرية.
                {detail.data.dataSource.realPct > 0 && (
                  <> {detail.data.dataSource.realPct}% بيانات حقيقية من Yahoo/Firecrawl ({detail.data.dataSource.realTrades} صفقة).</>
                )}
                {detail.data.dataSource.unknownTrades > 0 && (
                  <> {detail.data.dataSource.unknownTrades} صفقة مصدرها غير معروف.</>
                )}
              </div>
            )}
            <p className="mb-3 text-xs text-muted-foreground">
              💰 جميع النتائج محسوبة على أساس <b>عمولة تداول 0%</b>؛ لا يتم خصم أي عمولة ثابتة من الصفقات.
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              نسبة النجاح تُحسب من الصفقات الحاسمة فقط (ربح أو خسارة فعلية). صفقات التعادل ⚖️ لا تُحسب ضمن الخسائر.
            </p>
            <p className="mb-3 text-xs text-muted-foreground">
              العائد التراكمي و Max Drawdown محسوبين على أساس <b>10% من المحفظة لكل صفقة</b> (واقعي).
              متوسط الربح/الخسارة لكل صفقة فردياً.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              <MetricCard label="عدد الصفقات" value={fmt(detail.data.backtest.total_trades, 0)} />
              <MetricCard
                label="نسبة النجاح"
                value={fmt(detail.data.backtest.win_rate, 1)}
                suffix="%"
                tone={(detail.data.backtest.win_rate ?? 0) >= 55 ? "good" : (detail.data.backtest.win_rate ?? 0) >= 45 ? "neutral" : "bad"}
              />
              <MetricCard
                label="صفقات تعادل"
                value={fmt(detail.data.trades.filter((t) => t.exit_reason === "breakeven").length, 0)}
                tone="neutral"
              />
              <MetricCard
                label="العائد التراكمي"
                value={fmt(detail.data.backtest.total_return_pct, 1)}
                suffix="%"
                tone={(detail.data.backtest.total_return_pct ?? 0) > 0 ? "good" : "bad"}
              />
              <MetricCard
                label="Profit Factor"
                value={fmt(detail.data.backtest.profit_factor, 2)}
                tone={(detail.data.backtest.profit_factor ?? 0) >= 1.5 ? "good" : (detail.data.backtest.profit_factor ?? 0) >= 1 ? "neutral" : "bad"}
              />
              <MetricCard
                label="Expectancy / صفقة"
                value={fmt(detail.data.backtest.expectancy_pct, 2)}
                suffix="%"
                tone={(detail.data.backtest.expectancy_pct ?? 0) > 0 ? "good" : "bad"}
              />
              <MetricCard
                label="Max Drawdown"
                value={fmt(detail.data.backtest.max_drawdown_pct, 1)}
                suffix="%"
                tone={(detail.data.backtest.max_drawdown_pct ?? 0) > 0 ? "bad" : "neutral"}
              />
              <MetricCard label="متوسط الربح" value={fmt(detail.data.backtest.avg_win_pct, 2)} suffix="%" tone="good" />
              <MetricCard label="متوسط الخسارة" value={fmt(detail.data.backtest.avg_loss_pct, 2)} suffix="%" tone="bad" />
              <MetricCard label="Sharpe (per trade)" value={fmt(detail.data.backtest.sharpe, 2)} />
              <MetricCard label="أفضل صفقة" value={fmt(detail.data.backtest.best_trade_pct, 2)} suffix="%" tone="good" />
              <MetricCard label="أسوأ صفقة" value={fmt(detail.data.backtest.worst_trade_pct, 2)} suffix="%" tone="bad" />
              <MetricCard label="متوسط أيام الاحتفاظ" value={fmt(detail.data.backtest.avg_days_held, 1)} />
            </div>

            {(() => {
              const trades = detail.data.trades as unknown as TradeRow[];
              const reasonLabels: Record<string, string> = {
                target_hit: "🎯 هدف",
                stop_hit: "🛑 وقف",
                breakeven: "⚖️ تعادل",
                max_hold: "⏱ مدة",
                early_exit: "🚪 خروج مبكر",
                open: "مفتوحة",
              };
              const byReason = groupBy(
                trades,
                (t) => reasonLabels[t.exit_reason ?? "open"] ?? t.exit_reason ?? "—",
                ["🎯 هدف", "🛑 وقف", "🚪 خروج مبكر", "⏱ مدة", "⚖️ تعادل", "مفتوحة"],
              );
              const byRegime = groupBy(trades, (t) => t.market_regime ?? "—");
              const bySignal = groupBy(trades, (t) => t.signal ?? "—");
              const byConf = groupBy(trades, (t) => {
                const c = Number(t.confidence);
                if (!Number.isFinite(c)) return null;
                if (c < 65) return "60-65";
                if (c < 70) return "65-70";
                if (c < 75) return "70-75";
                if (c < 80) return "75-80";
                if (c < 85) return "80-85";
                return "85+";
              }, ["60-65", "65-70", "70-75", "75-80", "80-85", "85+"]);
              const byDays = groupBy(trades, (t) => {
                const d = Number(t.days_held);
                if (!Number.isFinite(d)) return null;
                if (d <= 1) return "0-1 يوم";
                if (d <= 2) return "2 أيام";
                if (d <= 3) return "3 أيام";
                if (d <= 4) return "4 أيام";
                if (d <= 5) return "5 أيام";
                return "6+ أيام";
              }, ["0-1 يوم", "2 أيام", "3 أيام", "4 أيام", "5 أيام", "6+ أيام"]);
              return (
                <div className="mt-6">
                  <h3 className="mb-2 text-base font-bold">🔬 تحليل الخسائر — فين بالظبط النزيف</h3>
                  <p className="mb-3 text-xs text-muted-foreground">
                    تقسيم الصفقات حسب أبعاد مختلفة عشان نعرف أنهي شريحة فعلاً بتكسب وأنهي بتخسر — قبل أي تعديل جديد.
                    PF أقل من 1 = شريحة خاسرة. الصفقات داخل ±0.1% تُعتبر تعادل ولا تدخل WR.
                  </p>
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <BreakdownTable title="حسب سبب الخروج" hint="أهم شريحة. لو max_hold خسران → نحتاج early exit." buckets={byReason} />
                    <BreakdownTable title="حسب حالة السوق" hint="هل ranging أو trending_up أفضل؟" buckets={byRegime} />
                    <BreakdownTable title="حسب نوع الإشارة" hint="strong_buy لازم يتفوق على buy." buckets={bySignal} />
                    <BreakdownTable title="حسب مستوى الثقة" hint="الثقة الأعلى لازم تجيب PF أعلى." buckets={byConf} />
                    <BreakdownTable title="حسب أيام الاحتفاظ" hint="هل الصفقات الطويلة بتسحب من الميزة؟" buckets={byDays} />
                  </div>
                </div>
              );
            })()}

            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
              <div className="border-b border-border px-4 py-3 text-sm font-bold">آخر 50 صفقة</div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs">
                    <tr>
                      <th className="px-3 py-2 text-end">السهم</th>
                      <th className="px-3 py-2 text-end">دخول</th>
                      <th className="px-3 py-2 text-end">سعر</th>
                      <th className="px-3 py-2 text-end">وقف</th>
                      <th className="px-3 py-2 text-end">هدف</th>
                      <th className="px-3 py-2 text-end">خروج</th>
                      <th className="px-3 py-2 text-end">سبب</th>
                      <th className="px-3 py-2 text-end">ربح/خسارة</th>
                      <th className="px-3 py-2 text-end">R</th>
                      <th className="px-3 py-2 text-end">أيام</th>
                      <th className="px-3 py-2 text-end">السوق</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.data.trades.slice(-50).reverse().map((t) => {
                      const pnl = Number(t.pnl_pct);
                      const isBE = t.exit_reason === "breakeven";
                      const tone = isBE ? "text-muted-foreground" : pnl > 0 ? "text-bull" : pnl < 0 ? "text-bear" : "";
                      const reasonLabel: Record<string, string> = {
                        target_hit: "🎯 هدف",
                        stop_hit: "🛑 وقف",
                        breakeven: "⚖️ تعادل",
                        max_hold: "⏱ مدة",
                        early_exit: "🚪 خروج مبكر",
                        open: "مفتوحة",
                      };
                      return (
                        <tr key={t.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-3 py-2 font-bold">{t.symbol}</td>
                          <td className="px-3 py-2 tabular-nums">{t.entry_date}</td>
                          <td className="px-3 py-2 tabular-nums">{fmt(t.entry_price)}</td>
                          <td className="px-3 py-2 tabular-nums text-bear">{fmt(t.stop_loss)}</td>
                          <td className="px-3 py-2 tabular-nums text-bull">{fmt(t.target)}</td>
                          <td className="px-3 py-2 tabular-nums">{t.exit_price != null ? fmt(t.exit_price) : "—"}</td>
                          <td className="px-3 py-2 text-xs">{reasonLabel[t.exit_reason ?? "open"] ?? t.exit_reason}</td>
                          <td className={`px-3 py-2 font-bold tabular-nums ${tone}`}>{t.pnl_pct != null ? `${pnl > 0 ? "+" : ""}${fmt(t.pnl_pct)}%` : "—"}</td>
                          <td className={`px-3 py-2 tabular-nums ${tone}`}>{t.r_multiple != null ? `${Number(t.r_multiple) > 0 ? "+" : ""}${fmt(t.r_multiple)}` : "—"}</td>
                          <td className="px-3 py-2 tabular-nums">{t.days_held}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{t.market_regime ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 text-base font-bold">المحاكاة السابقة</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs">
                <tr>
                  <th className="px-3 py-2 text-end">التاريخ</th>
                  <th className="px-3 py-2 text-end">الفترة</th>
                  <th className="px-3 py-2 text-end">حد الثقة</th>
                  <th className="px-3 py-2 text-end">عدد الصفقات</th>
                  <th className="px-3 py-2 text-end">نسبة النجاح</th>
                  <th className="px-3 py-2 text-end">العائد</th>
                  <th className="px-3 py-2 text-end">PF</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {(list.data ?? []).map((bt) => (
                  <tr key={bt.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 tabular-nums">{new Date(bt.started_at).toLocaleString("ar-EG")}</td>
                    <td className="px-3 py-2 tabular-nums text-xs">{bt.from_date} → {bt.to_date}</td>
                    <td className="px-3 py-2 tabular-nums">{bt.min_confidence}</td>
                    <td className="px-3 py-2 tabular-nums">{bt.total_trades}</td>
                    <td className={`px-3 py-2 tabular-nums ${Number(bt.win_rate) >= 50 ? "text-bull" : "text-bear"}`}>
                      {bt.win_rate != null ? `${fmt(bt.win_rate, 1)}%` : "—"}
                    </td>
                    <td className={`px-3 py-2 tabular-nums ${Number(bt.total_return_pct) >= 0 ? "text-bull" : "text-bear"}`}>
                      {bt.total_return_pct != null ? `${Number(bt.total_return_pct) > 0 ? "+" : ""}${fmt(bt.total_return_pct, 1)}%` : "—"}
                    </td>
                    <td className="px-3 py-2 tabular-nums">{fmt(bt.profit_factor, 2)}</td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setSelectedId(bt.id)}
                        className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
                {(list.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground">
                      لا توجد محاكاة سابقة. شغّل أول محاكاة لرؤية النتائج.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}