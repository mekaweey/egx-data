import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { getSignalQualityReport } from "@/lib/advisory-reports.functions";

export const Route = createFileRoute("/signal-quality")({
  head: () => ({
    meta: [
      { title: "Signal Quality — جودة الإشارات" },
      { name: "description", content: "تقييم جودة كل إشارة scalp-dip بناءً على النشاط اللحظي وعمق الهبوط." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

function Page() {
  const [days, setDays] = useState(14);
  const fn = useServerFn(getSignalQualityReport);
  const q = useQuery({
    queryKey: ["signal-quality", days],
    queryFn: () => fn({ data: { days } }),
    refetchInterval: 60_000,
  });

  const o = q.data?.overall;
  const buckets = q.data?.bucketStats ?? [];
  const rows = q.data?.rows ?? [];

  return (
    <div dir="rtl" className="min-h-screen bg-background p-6 font-sans">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">⭐ جودة الإشارات</h1>
          <div className="flex items-center gap-2 text-sm">
            <Link to="/marketwatch-health" className="rounded border px-2 py-1 text-xs hover:bg-muted">← فحص Volume</Link>
            <Link to="/reconciliation" className="rounded border px-2 py-1 text-xs hover:bg-muted">📒 Reconciliation</Link>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded border px-2 py-1 text-xs"
            >
              {[7, 14, 30, 60].map((d) => <option key={d} value={d}>{d} يوم</option>)}
            </select>
          </div>
        </header>

        {q.isLoading && <div>جاري التحميل...</div>}

        {o && (
          <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
            <Card label="عدد الصفقات" value={o.trades} />
            <Card label="فائزة" value={o.wins} />
            <Card label="نسبة الفوز" value={`${o.win_rate}%`} highlight={o.win_rate >= 60} />
            <Card label="ربح صافي (EGP)" value={o.net_pnl.toFixed(1)} highlight={o.net_pnl > 0} />
            <Card label="متوسط النقطة" value={o.avg_score} />
          </section>
        )}

        <section>
          <h2 className="mb-2 text-lg font-semibold">توزيع حسب جودة الإشارة</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {buckets.map((b) => (
              <div key={b.bucket} className={`rounded border p-3 ${
                b.bucket === "A" ? "border-green-400 bg-green-50"
                  : b.bucket === "B" ? "border-lime-300 bg-lime-50"
                  : b.bucket === "C" ? "border-amber-300 bg-amber-50"
                  : "border-red-300 bg-red-50"
              }`}>
                <div className="text-xs text-muted-foreground">
                  فئة {b.bucket} {b.bucket === "A" ? "(≥75)" : b.bucket === "B" ? "(55-74)" : b.bucket === "C" ? "(35-54)" : "(<35)"}
                </div>
                <div className="text-2xl font-bold">{b.trades} صفقة</div>
                <div className="text-sm">نسبة فوز: <b>{b.win_rate}%</b></div>
                <div className="text-sm">صافي: <b>{b.net_pnl}</b> EGP</div>
                <div className="text-xs text-muted-foreground">متوسط/صفقة: {b.avg_pnl}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs">
              <tr>
                <th className="p-2 text-right">السهم</th>
                <th className="p-2 text-right">التوقيت</th>
                <th className="p-2 text-right">النقاط</th>
                <th className="p-2 text-right">فئة</th>
                <th className="p-2 text-right">هبوط %</th>
                <th className="p-2 text-right">صفقات/5د</th>
                <th className="p-2 text-right">قيمة/5د</th>
                <th className="p-2 text-right">النتيجة</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.trade_id} className="border-t">
                  <td className="p-2 font-semibold">{r.symbol}</td>
                  <td className="p-2 text-xs text-muted-foreground">
                    {new Date(r.entry_ts).toLocaleString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </td>
                  <td className="p-2 font-bold">{r.score}</td>
                  <td className="p-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${
                      r.bucket === "A" ? "bg-green-100 text-green-700"
                        : r.bucket === "B" ? "bg-lime-100 text-lime-700"
                        : r.bucket === "C" ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                    }`}>{r.bucket}</span>
                  </td>
                  <td className="p-2">{r.drop_pct != null ? `${r.drop_pct}%` : "—"}</td>
                  <td className="p-2">{r.trades_5m ?? "—"}</td>
                  <td className="p-2">{r.value_5m != null ? Math.round(r.value_5m).toLocaleString() : "—"}</td>
                  <td className={`p-2 font-semibold ${r.is_win ? "text-green-600" : "text-red-600"}`}>
                    {r.pnl > 0 ? "+" : ""}{r.pnl.toFixed(1)}
                  </td>
                </tr>
              ))}
              {!rows.length && !q.isLoading && (
                <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">لا توجد صفقات مغلقة في الفترة</td></tr>
              )}
            </tbody>
          </table>
        </section>

        <div className="rounded border bg-blue-50 p-4 text-xs">
          <b>معادلة النقاط (شفافة):</b>
          <ul className="mt-1 list-disc space-y-0.5 pr-4">
            <li>حتى +40 من نشاط الصفقات في 5 دقايق (40 صفقة = full)</li>
            <li>حتى +30 من قيمة التداول في 5 دقايق (200k EGP = full)</li>
            <li>+20 لو الهبوط بين -3% و -8% (النطاق المثالي)</li>
            <li>+10 لو الدخول بين 10ص و 12ظ توقيت القاهرة</li>
          </ul>
          <p className="mt-2">💡 الفئة <b>A</b> = إشارات عالية الجودة (يُتوقع أعلى نسبة فوز). لو فئة <b>A</b> بتكسب أضعاف فئة <b>D</b>، ممكن نستخدم النقاط كفلتر إضافي مستقبلاً.</p>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: number | string; highlight?: boolean }) {
  return (
    <div className={`rounded border p-3 ${highlight ? "border-green-400 bg-green-50" : ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}