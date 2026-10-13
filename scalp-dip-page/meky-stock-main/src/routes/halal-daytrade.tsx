import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";
import { runHalalBacktest } from "@/lib/halal/halal-bt.functions";
import { getLiveQuotes, type LiveQuoteLite } from "@/lib/today/live-quote.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { LivePriceCard, MarketBadge } from "@/components/live-price-card";

const bare = (s: string) => s.replace(/\.CA$/i, "").toUpperCase();

export const Route = createFileRoute("/halal-daytrade")({
  component: HalalDayTradePage,
  head: () => ({
    meta: [
      { title: "استراتيجية التداول اليومي للأسهم الحلال — EGX" },
      { name: "description", content: "Backtest كامل على 6 شهور لاستراتيجية تداول يومية على الأسهم الحلال في البورصة المصرية." },
    ],
  }),
});

function fmtMoney(n: number) {
  return Math.round(n).toLocaleString("en-EG") + " ج";
}
function fmt(n: number, d = 2) {
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}
function pctClass(n: number) {
  return n >= 0 ? "text-bull" : "text-bear";
}

function Countdown() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(now);
  target.setHours(10, 15, 0, 0);
  let diff = target.getTime() - now.getTime();
  const passed = diff <= 0;
  if (passed) diff = -diff;
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return (
    <div className={`rounded-xl border p-4 ${passed ? "border-warn/50 bg-warn/10" : "border-primary/50 bg-primary/10"}`}>
      <div className="text-xs text-muted-foreground">العداد التنازلي لـ 10:15 ص (وقت الدخول)</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">
        {String(h).padStart(2, "0")}:{String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        {passed ? "⏱️ مر على وقت الدخول — انتظر جلسة الغد" : "متبقي على وقت الدخول"}
      </div>
    </div>
  );
}

function HalalDayTradePage() {
  const fn = useServerFn(runHalalBacktest);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["halal-bt"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });

  const [tab, setTab] = useState<"dashboard" | "today">("dashboard");

  const equityData = useMemo(() => {
    if (!data) return [];
    return data.result.equity.map((e) => ({
      date: e.date,
      الاستراتيجية: Math.round(e.cap),
      "Buy & Hold": Math.round(e.bh),
    }));
  }, [data]);

  if (isLoading) {
    return (
      <main dir="rtl" className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md text-center">
          <div className="mt-20 animate-pulse rounded-xl border border-border bg-card p-8">
            <div className="text-xl font-bold">جاري تشغيل المحاكاة…</div>
            <ProgressBar />
          </div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main dir="rtl" className="min-h-screen bg-background p-6">
        <div className="mx-auto max-w-md rounded-xl border border-bear/50 bg-bear/10 p-6 text-center">
          <div className="text-lg font-bold text-bear">فشل تحميل النتائج</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {(error as Error)?.message ?? "خطأ غير معروف"}
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            إعادة المحاولة
          </button>
        </div>
      </main>
    );
  }

  const r = data.result;
  const t = data.today;

  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">🕌 استراتيجية التداول اليومي — أسهم حلال</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              BackTest على فترة {r.startDate} → {r.endDate} · {r.symbolsUsed.length} سهم
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              ← الرئيسية
            </Link>
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {isFetching ? "جاري…" : "تشغيل Backtest"}
            </button>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 px-4 pb-3">
          <TabBtn active={tab === "dashboard"} onClick={() => setTab("dashboard")}>
            📊 داشبورد Backtest
          </TabBtn>
          <TabBtn active={tab === "today"} onClick={() => setTab("today")}>
            ⚡ صفقات النهارده
          </TabBtn>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
        {tab === "dashboard" ? <DashboardTab r={r} equity={equityData} /> : <TodayTab t={t} />}

        <SettingsCard />
        <DisclaimerCard />
      </div>
    </main>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-card hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressBar() {
  const steps = [
    "جاري جلب بيانات الأسهم…",
    "جاري حساب المؤشرات…",
    "جاري تشغيل محاكاة التداول…",
    "جاري إعداد النتائج…",
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % steps.length), 1200);
    return () => clearInterval(id);
  }, []);
  return (
    <>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full w-1/2 animate-pulse bg-primary" />
      </div>
      <div className="mt-3 text-sm text-muted-foreground">{steps[i]}</div>
    </>
  );
}

function Metric({ label, value, tone = "neutral", sub }: { label: string; value: string; tone?: "good" | "bad" | "neutral"; sub?: string }) {
  const cls = tone === "good" ? "text-bull" : tone === "bad" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${cls}`}>{value}</div>
      {sub && <div className="mt-1 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function DashboardTab({ r, equity }: { r: any; equity: any[] }) {
  const beatBH = r.totalReturnPct > r.buyHoldReturnPct;
  const monthAr: Record<string, string> = {
    "01":"يناير","02":"فبراير","03":"مارس","04":"أبريل","05":"مايو","06":"يونيو",
    "07":"يوليو","08":"أغسطس","09":"سبتمبر","10":"أكتوبر","11":"نوفمبر","12":"ديسمبر",
  };
  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Metric label="رأس المال البدء" value={fmtMoney(r.startCap)} />
        <Metric label="رأس المال الحالي" value={fmtMoney(r.endCap)} tone={r.endCap >= r.startCap ? "good" : "bad"} />
        <Metric label="العائد الكلي" value={`${r.totalReturnPct >= 0 ? "+" : ""}${fmt(r.totalReturnPct, 2)}%`} tone={r.totalReturnPct >= 0 ? "good" : "bad"} />
        <Metric label="Win Rate" value={`${fmt(r.winRate, 1)}%`} sub={`${r.wins} رابح / ${r.losses} خاسر`} tone={r.winRate >= 55 ? "good" : "neutral"} />
        <Metric label="Max Drawdown" value={`${fmt(r.maxDrawdownPct, 2)}%`} tone={r.maxDrawdownPct < 5 ? "good" : "bad"} />
        <Metric label="Sharpe Ratio" value={fmt(r.sharpe, 2)} tone={r.sharpe > 2 ? "good" : "neutral"} />
        <Metric label="أيام لا تداول" value={String(r.noTradeDays)} sub={`من ${r.daysTotal} يوم`} />
        <Metric label="Buy & Hold" value={`${r.buyHoldReturnPct >= 0 ? "+" : ""}${fmt(r.buyHoldReturnPct, 2)}%`} tone={beatBH ? "neutral" : "good"} sub={beatBH ? "✓ الاستراتيجية أفضل" : "✗ B&H أفضل"} />
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-base font-bold">📈 نمو المحفظة vs Buy & Hold</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <LineChart data={equity}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => (v / 1000).toFixed(0) + "K"} />
              <Tooltip
                formatter={(v: number) => fmtMoney(v)}
                labelFormatter={(l) => `📅 ${l}`}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, direction: "rtl" }}
              />
              <Legend />
              <Line type="monotone" dataKey="الاستراتيجية" stroke="oklch(0.74 0.18 155)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Buy & Hold" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-base font-bold">📅 الأداء الشهري</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-right text-xs text-muted-foreground">
              <tr><th className="p-2">الشهر</th><th className="p-2">الربح/الخسارة</th><th className="p-2">النسبة</th></tr>
            </thead>
            <tbody>
              {r.monthly.map((m: any) => {
                const pct = (m.pnl / r.startCap) * 100;
                const mo = m.month.slice(5);
                const yr = m.month.slice(0, 4);
                return (
                  <tr key={m.month} className="border-t border-border">
                    <td className="p-2 font-semibold">{monthAr[mo]} {yr}</td>
                    <td className={`p-2 tabular-nums font-bold ${pctClass(m.pnl)}`}>
                      {m.pnl >= 0 ? "+" : ""}{fmtMoney(m.pnl)}
                    </td>
                    <td className={`p-2 tabular-nums ${pctClass(pct)}`}>
                      {pct >= 0 ? "+" : ""}{fmt(pct, 2)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="mb-3 text-base font-bold">📋 الصفقات اليومية ({r.daily.length} يوم)</h2>
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="sticky top-0 bg-card text-right text-xs text-muted-foreground">
              <tr>
                <th className="p-2">التاريخ</th>
                <th className="p-2">الأسهم</th>
                <th className="p-2">صافي اليوم</th>
                <th className="p-2">رصيد بعدها</th>
              </tr>
            </thead>
            <tbody>
              {[...r.daily].reverse().map((d: any) => (
                <tr key={d.date} className="border-t border-border">
                  <td className="p-2 tabular-nums">{d.date}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {d.picks.map((p: any) => (
                        <span
                          key={p.symbol}
                          className={`rounded px-1.5 py-0.5 text-[10px] sm:text-xs ${
                            p.pnlPct >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
                          }`}
                          title={`Score: ${p.score}`}
                        >
                          {p.symbol} {p.pnlPct >= 0 ? "+" : ""}{fmt(p.pnlPct, 2)}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className={`p-2 tabular-nums font-bold ${pctClass(d.pnl)}`}>
                    {d.pnl >= 0 ? "+" : ""}{fmtMoney(d.pnl)}
                  </td>
                  <td className="p-2 tabular-nums">{fmtMoney(d.cap)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function TodayTab({ t }: { t: any }) {
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const [marketOpen, setMarketOpen] = useState(() => getMarketStatus().isOpen);
  useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5000);
    return () => clearInterval(id);
  }, []);

  const liveSymbols = useMemo(
    () => Array.from(new Set((t.picks ?? []).map((p: any) => bare(p.symbol)))) as string[],
    [t.picks],
  );

  const liveBatch = useQuery({
    queryKey: ["halal-live-quotes", liveSymbols.join(",")],
    queryFn: () => fetchLiveBatch({ data: { symbols: liveSymbols } }),
    enabled: liveSymbols.length > 0,
    refetchInterval: marketOpen ? 5_000 : 30_000,
    refetchIntervalInBackground: true,
    staleTime: marketOpen ? 2_000 : 15_000,
  });

  const liveBySymbol = useMemo(() => {
    const map = new Map<string, LiveQuoteLite>();
    for (const q of liveBatch.data ?? []) map.set(q.symbol, q);
    return map;
  }, [liveBatch.data]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Countdown />
        <div className={`rounded-xl border p-4 ${t.marketWarning ? "border-bear/50 bg-bear/10" : "border-bull/50 bg-bull/10"}`}>
          <div className="text-xs text-muted-foreground">صحة السوق</div>
          <div className={`mt-1 text-3xl font-bold tabular-nums ${t.marketWarning ? "text-bear" : "text-bull"}`}>
            {fmt(t.marketDownPct, 1)}% نازل
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t.marketWarning ? "⚠️ تحذير: السوق ضعيف — يفضل عدم التداول" : "✓ السوق صحي — مسموح بالتداول"}
          </div>
        </div>
      </div>

      {liveSymbols.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/10 p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-bold text-primary">
              <MarketBadge open={marketOpen} />
              <span>متابعة لحظية للأسهم المرشحة</span>
            </div>
            <span className="text-muted-foreground">
              {marketOpen ? "تحديث كل 5 ثواني" : "آخر أسعار متاحة — تحديث كل 30 ثانية"}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
            {(liveBatch.data ?? []).filter((q) => q.price > 0).map((q) => (
              <div key={q.symbol} className="min-w-32 rounded-lg border border-border bg-card px-3 py-2">
                <div className="font-bold">{q.symbol}</div>
                <div className="tabular-nums">{fmt(q.price)}</div>
                <div className={`tabular-nums ${q.change_pct >= 0 ? "text-bull" : "text-bear"}`}>
                  {q.change_pct >= 0 ? "+" : ""}{fmt(q.change_pct, 2)}%
                </div>
              </div>
            ))}
            {liveBatch.isLoading && <span className="py-3 text-muted-foreground">جاري جلب اللايف…</span>}
          </div>
        </div>
      )}

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-bold">🎯 الأسهم الموصى بها</h2>
          {t.asOfDate && (
            <span className="text-xs text-muted-foreground">بناءً على بيانات {t.asOfDate}</span>
          )}
        </div>
        {t.picks.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            🚫 لا توجد توصيات النهارده — مفيش سهم وصل لـ Score ≥ 50
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {t.picks.map((p: any, i: number) => (
              <div key={p.symbol} className="rounded-xl border border-border bg-background p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-lg font-bold">{p.symbol}</div>
                    <div className="text-xs text-muted-foreground">المرتبة #{i + 1}</div>
                  </div>
                  <span className="rounded-full bg-primary/15 px-2 py-1 text-xs font-bold text-primary">
                    Score {p.score}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-sm">
                  <Row label="الوزن" value={`${fmt(p.weightPct, 0)}%`} />
                  <Row label="آخر إغلاق" value={fmt(p.lastClose, 2)} />
                  <Row label="الدخول التقريبي" value={fmt(p.entry, 2)} />
                   <Row label="🎯 Target (+3.0%)" value={fmt(p.target, 2)} tone="good" />
                  <Row label="🛑 Stop (-0.8%)" value={fmt(p.stop, 2)} tone="bad" />
                </div>
                <div className="mt-3">
                  <LivePriceCard
                    symbol={bare(p.symbol)}
                    quote={liveBySymbol.get(bare(p.symbol))}
                    entry={p.entry}
                    marketOpen={marketOpen}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  const cls = tone === "good" ? "text-bull" : tone === "bad" ? "text-bear" : "text-foreground";
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-bold tabular-nums ${cls}`}>{value}</span>
    </div>
  );
}

function SettingsCard() {
  const items = [
    ["Score Threshold", "50 نقطة"],
    ["Market Filter", "70% (لو نزل أكتر = لا تداول)"],
    ["Target", "+3.0%"],
    ["Stop Loss", "-0.8%"],
    ["توزيع رأس المال", "40% / 35% / 25%"],
    ["Time Stop", "2:00 PM"],
    ["وقت الدخول", "10:15 ص"],
  ];
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h2 className="mb-3 text-base font-bold">⚙️ الإعدادات المعتمدة</h2>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{k}</span>
            <span className="font-semibold">{v}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DisclaimerCard() {
  return (
    <section className="rounded-xl border border-warn/50 bg-warn/10 p-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl">⚠️</span>
        <div className="space-y-1 text-sm">
          <div className="font-bold text-warn">تنبيه مهم</div>
          <p>النتائج مبنية على بيانات تاريخية. الأداء الفعلي ممكن يختلف.</p>
          <p className="font-semibold">ابدأ بمبلغ صغير في أول شهر للاختبار الحقيقي قبل التوسع.</p>
        </div>
      </div>
    </section>
  );
}
