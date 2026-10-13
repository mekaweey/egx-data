import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTrackRecord, type TrackRecordSummary } from "@/lib/scan/track-record.functions";

export const Route = createFileRoute("/track-record")({
  component: TrackRecord,
});

const OUTCOME_LABELS: Record<string, { ar: string; cls: string }> = {
  target_hit: { ar: "✓ هدف", cls: "bg-bull/20 text-bull" },
  stop_hit: { ar: "✗ وقف", cls: "bg-bear/20 text-bear" },
  expired: { ar: "⏱ منتهي", cls: "bg-muted text-muted-foreground" },
};

function fmt(n: number, digits = 2, sign = false) {
  const v = n.toLocaleString("en-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
  return sign && n >= 0 ? `+${v}` : v;
}

function SummaryCard({ title, s }: { title: string; s: TrackRecordSummary }) {
  const profitable = s.expectancy_pct > 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-muted-foreground text-xs">عدد التوصيات</div>
          <div className="text-2xl font-bold tabular-nums">{s.total}</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">معدل النجاح</div>
          <div className={`text-2xl font-bold tabular-nums ${s.win_rate >= 50 ? "text-bull" : "text-bear"}`}>
            {fmt(s.win_rate, 1)}%
          </div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">متوسط الربح</div>
          <div className="text-lg font-semibold tabular-nums text-bull">{fmt(s.avg_win_pct, 2, true)}%</div>
        </div>
        <div>
          <div className="text-muted-foreground text-xs">متوسط الخسارة</div>
          <div className="text-lg font-semibold tabular-nums text-bear">{fmt(s.avg_loss_pct, 2, true)}%</div>
        </div>
        <div className="col-span-2 mt-1 border-t border-border pt-3">
          <div className="text-muted-foreground text-xs">التوقع الإحصائي لكل صفقة</div>
          <div className={`text-2xl font-extrabold tabular-nums ${profitable ? "text-bull" : "text-bear"}`}>
            {fmt(s.expectancy_pct, 2, true)}%
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {profitable
              ? "موجب = الاستراتيجية رابحة على المدى الطويل."
              : "سالب = الاستراتيجية خاسرة في هذه الفترة. لا تتداول بها."}
          </p>
        </div>
      </div>
    </div>
  );
}

function EquityChart({ data }: { data: Array<{ date: string; cumulative_pct: number }> }) {
  if (data.length < 2) return null;
  const W = 800, H = 200, P = 30;
  const xs = data.map((_, i) => i);
  const ys = data.map((d) => d.cumulative_pct);
  const minY = Math.min(...ys, 0), maxY = Math.max(...ys, 0);
  const rangeY = maxY - minY || 1;
  const sx = (i: number) => P + (i / (xs.length - 1)) * (W - 2 * P);
  const sy = (y: number) => H - P - ((y - minY) / rangeY) * (H - 2 * P);
  const zeroY = sy(0);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${sx(i).toFixed(1)},${sy(d.cumulative_pct).toFixed(1)}`).join(" ");
  const finalPct = ys[ys.length - 1];
  const positive = finalPct >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">
          منحنى الأرباح التراكمي (لو دخلت كل توصية بنفس الحجم)
        </h3>
        <div className={`text-xl font-bold tabular-nums ${positive ? "text-bull" : "text-bear"}`}>
          {fmt(finalPct, 1, true)}%
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" preserveAspectRatio="none">
        <line x1={P} y1={zeroY} x2={W - P} y2={zeroY} stroke="currentColor" strokeWidth="0.5" className="text-border" strokeDasharray="3 3" />
        <path d={path} fill="none" stroke="currentColor" strokeWidth="2" className={positive ? "text-bull" : "text-bear"} />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{data[0].date}</span>
        <span>{data[data.length - 1].date}</span>
      </div>
    </div>
  );
}

function TrackRecord() {
  const fn = useServerFn(getTrackRecord);
  const { data, isLoading } = useQuery({
    queryKey: ["track-record"],
    queryFn: () => fn(),
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold">📈 سجل الأداء الحقيقي</h1>
            <p className="text-xs text-muted-foreground">
              نتائج توصيات الشراء السابقة — هل البرنامج يستحق الثقة؟
            </p>
          </div>
          <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            ← العودة للتوصيات
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {isLoading && <div className="py-20 text-center text-muted-foreground">جاري التحميل…</div>}

        {data && data.buy_all.total === 0 && (
          <div className="rounded-xl border border-dashed border-border p-16 text-center">
            <p className="text-lg font-semibold">لا توجد توصيات مغلقة بعد</p>
            <p className="mt-2 text-sm text-muted-foreground">
              التوصيات بتتقيّم بعد 24 ساعة على الأقل من إنشائها.
            </p>
          </div>
        )}

        {data && data.buy_all.total > 0 && (
          <>
            <div className="mb-6 grid gap-4 md:grid-cols-3">
              <SummaryCard title="آخر 30 يوم" s={data.buy_30d} />
              <SummaryCard title="آخر 90 يوم" s={data.buy_90d} />
              <SummaryCard title="جميع التوصيات" s={data.buy_all} />
            </div>

            <div className="mb-6">
              <EquityChart data={data.equity_curve} />
            </div>

            {data.buy_all.expectancy_pct <= 0 && (
              <div className="mb-6 rounded-xl border border-bear/40 bg-bear/10 p-5">
                <h3 className="font-bold text-bear">⚠️ تحذير صريح</h3>
                <p className="mt-2 text-sm">
                  التوقع الإحصائي للاستراتيجية حالياً <strong>سالب</strong>.
                  يعني لو دخلت كل توصية على المدى الطويل هتخسر فلوس.
                  <br /><br />
                  ده ممكن يبقى بسبب: السوق في اتجاه هابط، أو الـ AI محتاج تعديل،
                  أو توقيت الدخول/الخروج محتاج تحسين.
                </p>
                <p className="mt-2 text-sm font-semibold">
                  نصيحتنا: انتظر لحد ما الرقم ده يبقى موجب على آخر 30 يوم قبل ما تتداول بفلوس حقيقية.
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="border-b border-border px-5 py-3">
                <h3 className="font-semibold">آخر 30 توصية</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-start">السهم</th>
                      <th className="px-4 py-2 text-start">التاريخ</th>
                      <th className="px-4 py-2 text-start">الثقة</th>
                      <th className="px-4 py-2 text-start">سعر الدخول</th>
                      <th className="px-4 py-2 text-start">النتيجة</th>
                      <th className="px-4 py-2 text-start">العائد</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((t) => {
                      const o = OUTCOME_LABELS[t.outcome] ?? { ar: t.outcome, cls: "bg-muted" };
                      const pct = t.realized_pct ?? 0;
                      return (
                        <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-2 font-semibold">{t.symbol}</td>
                          <td className="px-4 py-2 text-xs text-muted-foreground tabular-nums">
                            {t.created_at.slice(0, 10)}
                          </td>
                          <td className="px-4 py-2 tabular-nums">{t.confidence}%</td>
                          <td className="px-4 py-2 tabular-nums">{fmt(t.price_at_reco)}</td>
                          <td className="px-4 py-2">
                            <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${o.cls}`}>
                              {o.ar}
                            </span>
                          </td>
                          <td className={`px-4 py-2 font-semibold tabular-nums ${pct >= 0 ? "text-bull" : "text-bear"}`}>
                            {fmt(pct, 2, true)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}