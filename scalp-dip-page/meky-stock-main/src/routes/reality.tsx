import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getRealityCheck } from "@/lib/reality/reality-check.functions";

const realityQuery = queryOptions({
  queryKey: ["reality-check"],
  queryFn: () => getRealityCheck(),
});

export const Route = createFileRoute("/reality")({
  loader: ({ context }) => context.queryClient.ensureQueryData(realityQuery),
  component: RealityPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-bear">خطأ في تحميل التقرير: {error.message}</div>
  ),
});

function pctCls(n: number) {
  return n > 0 ? "text-bull" : n < 0 ? "text-bear" : "text-muted-foreground";
}
function wrCls(n: number) {
  return n >= 55 ? "text-bull" : n >= 45 ? "text-warn" : "text-bear";
}

function RealityPage() {
  const { data } = useSuspenseQuery(realityQuery);
  const verdictCls =
    data.verdict.severity === "good"
      ? "border-bull bg-bull/10 text-bull"
      : data.verdict.severity === "warn"
      ? "border-warn bg-warn/10 text-warn"
      : "border-bear bg-bear/10 text-bear";

  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🔍 Reality Check</h1>
          <p className="text-sm text-muted-foreground">
            أداء التوصيات الحقيقي — مفيش تجميل، بس الأرقام
          </p>
        </div>
        <Link to="/" className="text-sm text-primary hover:underline">→ الرئيسية</Link>
      </div>

      {/* Verdict */}
      <div className={`rounded-xl border-2 p-5 text-lg font-bold ${verdictCls}`}>
        {data.verdict.ar}
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">إجمالي التوصيات</div>
          <div className="mt-1 text-2xl font-bold">{data.total}</div>
          <div className="text-xs text-muted-foreground">
            {data.evaluated} مُقيّمة · {data.pending} معلقة
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Win Rate الإجمالي</div>
          <div className={`mt-1 text-2xl font-bold ${wrCls(data.overallWinRate)}`}>
            {data.overallWinRate}%
          </div>
          <div className="text-xs text-muted-foreground">المطلوب ≥ 55%</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">متوسط العائد/توصية</div>
          <div className={`mt-1 text-2xl font-bold ${pctCls(data.overallAvgPct)}`}>
            {data.overallAvgPct > 0 ? "+" : ""}{data.overallAvgPct}%
          </div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">إجمالي العائد التراكمي</div>
          <div className={`mt-1 text-2xl font-bold ${pctCls(data.totalReturnPct)}`}>
            {data.totalReturnPct > 0 ? "+" : ""}{data.totalReturnPct}%
          </div>
        </div>
      </div>

      {/* By Signal */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">حسب نوع الإشارة</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b border-border">
                <th className="p-2 text-start">الإشارة</th>
                <th className="p-2">عدد</th>
                <th className="p-2">ربح</th>
                <th className="p-2">خسارة</th>
                <th className="p-2">منتهية</th>
                <th className="p-2">Win Rate</th>
                <th className="p-2">متوسط %</th>
                <th className="p-2">Expectancy</th>
              </tr>
            </thead>
            <tbody>
              {data.bySignal.map((r) => (
                <tr key={r.signal} className="border-b border-border/50">
                  <td className="p-2 font-semibold">{r.signal}</td>
                  <td className="p-2 text-center">{r.total}</td>
                  <td className="p-2 text-center text-bull">{r.wins}</td>
                  <td className="p-2 text-center text-bear">{r.losses}</td>
                  <td className="p-2 text-center text-muted-foreground">{r.expired}</td>
                  <td className={`p-2 text-center font-bold ${wrCls(r.win_rate)}`}>{r.win_rate}%</td>
                  <td className={`p-2 text-center ${pctCls(r.avg_pct)}`}>{r.avg_pct}%</td>
                  <td className={`p-2 text-center font-semibold ${pctCls(r.expectancy)}`}>
                    {r.expectancy > 0 ? "+" : ""}{r.expectancy}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Expectancy = القيمة المتوقعة لكل توصية. لو سالبة → بتخسر فلوس طويل المدى.
        </p>
      </section>

      {/* By Confidence */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-lg font-bold">حسب درجة الثقة</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          المفروض الثقة الأعلى = Win Rate أعلى. لو مش كده، نموذج الثقة معطوب.
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {data.byConfidence.map((b) => (
            <div key={b.bucket} className="rounded-lg border border-border p-3 text-center">
              <div className="text-xs text-muted-foreground">{b.bucket}</div>
              <div className={`mt-1 text-xl font-bold ${wrCls(b.win_rate)}`}>{b.win_rate}%</div>
              <div className="text-xs text-muted-foreground">{b.total} توصية</div>
              <div className={`text-xs ${pctCls(b.avg_pct)}`}>
                {b.avg_pct > 0 ? "+" : ""}{b.avg_pct}%
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Winners & Losers */}
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold text-bull">🏆 أفضل 5 أسهم</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.topWinners.map((s) => (
                <tr key={s.symbol} className="border-b border-border/50">
                  <td className="p-2 font-bold">{s.symbol}</td>
                  <td className="p-2 text-center text-xs text-muted-foreground">{s.total}</td>
                  <td className={`p-2 text-end font-bold ${pctCls(s.avg_pct)}`}>+{s.avg_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-lg font-bold text-bear">⚠️ أسوأ 5 أسهم</h2>
          <table className="w-full text-sm">
            <tbody>
              {data.topLosers.map((s) => (
                <tr key={s.symbol} className="border-b border-border/50">
                  <td className="p-2 font-bold">{s.symbol}</td>
                  <td className="p-2 text-center text-xs text-muted-foreground">{s.total}</td>
                  <td className={`p-2 text-end font-bold ${pctCls(s.avg_pct)}`}>{s.avg_pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        آخر تحديث: {new Date(data.generatedAt).toLocaleString("ar-EG")}
      </p>
    </div>
  );
}