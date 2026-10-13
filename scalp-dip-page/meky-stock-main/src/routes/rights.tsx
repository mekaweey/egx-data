import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getRightsOpportunities, type RightsPick } from "@/lib/rights/rights-scan.functions";

const rightsQuery = queryOptions({
  queryKey: ["rights-opportunities"],
  queryFn: () => getRightsOpportunities(),
  staleTime: 60_000,
});

export const Route = createFileRoute("/rights")({
  loader: ({ context }) => context.queryClient.ensureQueryData(rightsQuery),
  head: () => ({
    meta: [
      { title: "حقوق الاكتتاب الشرعية — EGX سكانر" },
      { name: "description", content: "ترشيحات حقوق الاكتتاب المتداولة في البورصة المصرية مع فلتر شرعي." },
    ],
  }),
  component: RightsPage,
  errorComponent: ({ error }) => (
    <div className="p-6 text-destructive">تعذّر تحميل حقوق الاكتتاب: {error.message}</div>
  ),
  notFoundComponent: () => <div className="p-6">لا توجد بيانات.</div>,
});

function badgeClass(rec: RightsPick["recommendation"]) {
  switch (rec) {
    case "شراء قوي":
      return "bg-bull/20 text-bull border-bull/40";
    case "شراء":
      return "bg-primary/15 text-primary border-primary/40";
    case "مراقبة":
      return "bg-muted text-muted-foreground border-border";
    case "تجنّب":
      return "bg-destructive/15 text-destructive border-destructive/40";
  }
}

function Table({ rows }: { rows: RightsPick[] }) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        لا توجد حقوق اكتتاب نشطة الآن.
      </div>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th className="p-3 text-right">الرمز</th>
            <th className="p-3 text-right">الشركة الأم</th>
            <th className="p-3 text-right">السعر</th>
            <th className="p-3 text-right">التغير %</th>
            <th className="p-3 text-right">الحجم</th>
            <th className="p-3 text-right">التوصية</th>
            <th className="p-3 text-right">السبب</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const change = r.change_pct ?? 0;
            return (
              <tr key={r.symbol} className="border-t border-border hover:bg-muted/20">
                <td className="p-3 font-mono font-semibold">{r.symbol}</td>
                <td className="p-3">
                  <div className="font-medium">{r.base_name_ar ?? r.description ?? r.base_symbol}</div>
                  {r.base_sector_ar && (
                    <div className="text-xs text-muted-foreground">{r.base_sector_ar}</div>
                  )}
                </td>
                <td className="p-3">{r.close.toFixed(2)}</td>
                <td className={`p-3 font-semibold ${change >= 0 ? "text-bull" : "text-destructive"}`}>
                  {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                </td>
                <td className="p-3 text-muted-foreground">{r.volume?.toLocaleString() ?? "—"}</td>
                <td className="p-3">
                  <span className={`inline-block rounded-md border px-2 py-1 text-xs font-semibold ${badgeClass(r.recommendation)}`}>
                    {r.recommendation}
                  </span>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{r.reason_ar}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RightsPage() {
  const { data } = useSuspenseQuery(rightsQuery);
  const updated = new Date(data.generatedAt).toLocaleString("ar-EG");

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">📜 حقوق الاكتتاب — البورصة المصرية</h1>
            <p className="text-sm text-muted-foreground">آخر تحديث: {updated}</p>
          </div>
          <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            ← الرئيسية
          </Link>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-bull">
            ✅ الحقوق الشرعية ({data.sharia.length})
          </h2>
          <Table rows={data.sharia} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-bold text-muted-foreground">
            باقي حقوق الاكتتاب ({data.others.length})
          </h2>
          <Table rows={data.others} />
        </section>
      </div>
    </div>
  );
}