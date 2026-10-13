import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getReconciliationReport } from "@/lib/advisory-reports.functions";

export const Route = createFileRoute("/reconciliation")({
  head: () => ({
    meta: [
      { title: "Daily Reconciliation — تسوية يومية" },
      { name: "description", content: "مقارنة إشارات الاستراتيجية بالتنفيذ الحقيقي من الإكستنشن." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

function fmt(n: number | null | undefined, dp = 2) {
  return n == null ? "—" : Number(n).toFixed(dp);
}
function pct(n: number | null | undefined) {
  return n == null ? "—" : `${n > 0 ? "+" : ""}${Number(n).toFixed(2)}%`;
}

function Page() {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const [date, setDate] = useState<string>(today);
  const fn = useServerFn(getReconciliationReport);
  const q = useQuery({
    queryKey: ["recon", date],
    queryFn: () => fn({ data: { date } }),
    refetchInterval: 30_000,
  });

  const s = q.data?.summary;
  const rows = q.data?.rows ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📒 تسوية يومية</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/marketwatch-health" className="rounded border px-2 py-1 text-xs hover:bg-muted">← فحص Volume</Link>
            <Link to="/signal-quality" className="rounded border px-2 py-1 text-xs hover:bg-muted">⭐ Signal Quality</Link>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded border px-2 py-1 text-xs"
            />
          </div>
        </header>

        {q.isLoading && <div>جاري التحميل...</div>}
        {q.error && <div className="text-red-600">خطأ: {(q.error as Error).message}</div>}

        {s && (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="إشارات ورقية" value={s.total_signals} />
            <Card label="تنفيذ حقيقي" value={s.total_real} />
            <Card label="مطابق" value={s.matched} highlight={s.matched > 0} />
            <Card label="إشارة بدون تنفيذ" value={s.signal_only} warn={s.signal_only > 0} />
            <Card label="تنفيذ بدون إشارة" value={s.real_only} warn={s.real_only > 0} />
            <Card label="ربح ورقي (EGP)" value={fmt(s.simulated_pnl, 1)} />
            <Card label="ربح حقيقي (EGP)" value={fmt(s.real_pnl, 1)} />
            <Card label="أسوأ انزلاق بيع %" value={fmt(s.sell_drift_worst_pct, 2)} />
          </section>
        )}

        <section className="rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="p-2 text-right">السهم</th>
                <th className="p-2 text-right">الحالة</th>
                <th className="p-2 text-right">دخول ورقي</th>
                <th className="p-2 text-right">دخول حقيقي</th>
                <th className="p-2 text-right">انزلاق شراء</th>
                <th className="p-2 text-right">خروج ورقي</th>
                <th className="p-2 text-right">خروج حقيقي</th>
                <th className="p-2 text-right">انزلاق بيع</th>
                <th className="p-2 text-right">ربح ورقي</th>
                <th className="p-2 text-right">ربح حقيقي</th>
                <th className="p-2 text-right">فرق</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  <td className="p-2 font-semibold">{r.symbol}</td>
                  <td className="p-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      r.status === "matched" ? "bg-green-100 text-green-700"
                        : r.status === "signal_only" ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>
                      {r.status === "matched" ? "مطابق" : r.status === "signal_only" ? "بدون تنفيذ" : "بدون إشارة"}
                    </span>
                  </td>
                  <td className="p-2">{fmt(r.paper_entry)}</td>
                  <td className="p-2">{fmt(r.real_buy)}</td>
                  <td className="p-2">{pct(r.buy_drift_pct)}</td>
                  <td className="p-2">{fmt(r.paper_exit)}</td>
                  <td className="p-2">{fmt(r.real_sell)}</td>
                  <td className="p-2">{pct(r.sell_drift_pct)}</td>
                  <td className="p-2">{fmt(r.paper_pnl, 1)}</td>
                  <td className="p-2">{fmt(r.real_pnl, 1)}</td>
                  <td className={`p-2 ${(r.pnl_delta ?? 0) < 0 ? "text-red-600" : "text-green-600"}`}>{fmt(r.pnl_delta, 1)}</td>
                </tr>
              ))}
              {!rows.length && !q.isLoading && (
                <tr><td colSpan={11} className="p-6 text-center text-muted-foreground">لا توجد بيانات لهذا اليوم</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <p className="text-xs text-muted-foreground">
          💡 المطابقة على أساس رمز السهم + أقرب توقيت خلال 30 دقيقة. "بدون تنفيذ" = إشارة الاستراتيجية لم تُنفَّذ فعلياً؛ "بدون إشارة" = صفقة يدوية أو من مصدر آخر.
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, warn, highlight }: { label: string; value: number | string; warn?: boolean; highlight?: boolean }) {
  return (
    <div className={`rounded border p-3 ${warn ? "border-amber-400 bg-amber-50" : highlight ? "border-green-400 bg-green-50" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}