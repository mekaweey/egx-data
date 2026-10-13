import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPerformanceStats } from "@/lib/perf/performance-stats.functions";

const perfQO = queryOptions({
  queryKey: ["performance-stats"],
  queryFn: () => getPerformanceStats(),
  refetchInterval: 60_000,
});

export const Route = createFileRoute("/performance")({
  loader: ({ context }) => context.queryClient.ensureQueryData(perfQO),
  component: PerformancePage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-bear" role="alert">
      حدث خطأ: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">الصفحة غير موجودة</div>
  ),
  head: () => ({
    meta: [
      { title: "أداء النظام — Meky Stock" },
      { name: "description", content: "إحصائيات أداء توصيات النظام آخر 30 يوم" },
    ],
  }),
});

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}
function num(n: number, digits = 2): string {
  return n.toFixed(digits);
}

function StatCard({ label, value, sub, tone = "neutral" }: {
  label: string;
  value: string;
  sub?: string;
  tone?: "bull" | "bear" | "neutral";
}) {
  const toneClass =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className={`text-2xl font-bold ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function PerformancePage() {
  const { data: s } = useSuspenseQuery(perfQO);

  return (
    <div className="min-h-screen bg-background p-6 max-w-5xl mx-auto" dir="rtl">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-1">📊 أداء النظام</h1>
          <p className="text-sm text-muted-foreground">آخر 30 يوم — تحديث تلقائي كل دقيقة</p>
        </div>
        <Link
          to="/automation"
          className="text-sm text-primary hover:underline"
        >
          الأتمتة ←
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="إجمالي التوصيات" value={String(s.totalRecos)} />
        <StatCard label="مغلقة" value={String(s.closedRecos)} sub={`${s.wins} رابحة / ${s.losses} خاسرة`} />
        <StatCard
          label="نسبة النجاح"
          value={pct(s.winRate)}
          tone={s.winRate >= 0.6 ? "bull" : s.winRate >= 0.5 ? "neutral" : "bear"}
        />
        <StatCard
          label="التوقع لكل صفقة"
          value={`${num(s.expectancy)}%`}
          tone={s.expectancy > 0 ? "bull" : "bear"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard label="متوسط المكسب" value={`+${num(s.avgWinPct)}%`} tone="bull" />
        <StatCard label="متوسط الخسارة" value={`${num(s.avgLossPct)}%`} tone="bear" />
        {s.bestPick && (
          <StatCard
            label="أفضل صفقة"
            value={`${s.bestPick.symbol}`}
            sub={`+${num(s.bestPick.pct)}%`}
            tone="bull"
          />
        )}
        {s.worstPick && (
          <StatCard
            label="أسوأ صفقة"
            value={`${s.worstPick.symbol}`}
            sub={`${num(s.worstPick.pct)}%`}
            tone="bear"
          />
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-bold mb-3">🏆 توصيات المستوى الذهبي</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground">ذهبية</div>
            <div className="text-xl font-bold">{s.byTier.gold}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">فضية</div>
            <div className="text-xl font-bold">{s.byTier.silver}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">نجاح الذهبية</div>
            <div className={`text-xl font-bold ${s.byTier.goldWinRate >= 0.6 ? "text-bull" : "text-foreground"}`}>
              {pct(s.byTier.goldWinRate)}
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-6 text-xs text-muted-foreground text-center">
        محدث: {new Date(s.generatedAt).toLocaleString("ar-EG")}
      </footer>
    </div>
  );
}