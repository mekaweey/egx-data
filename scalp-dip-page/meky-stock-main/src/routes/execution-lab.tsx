import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getExecutionStats } from "@/lib/execution-stats.functions";

const opts = queryOptions({
  queryKey: ["execution-stats"],
  queryFn: () => getExecutionStats(),
  refetchInterval: 10_000,
});

export const Route = createFileRoute("/execution-lab")({
  head: () => ({ meta: [{ title: "مختبر التنفيذ — Execution Lab" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(opts),
  component: ExecutionLab,
  errorComponent: ({ error }) => <div className="p-6 text-red-500">خطأ: {String(error)}</div>,
  notFoundComponent: () => <div className="p-6">Not found</div>,
});

function fmt(n: number | null | undefined, digits = 2) {
  if (n == null || !Number.isFinite(n)) return "—";
  return Number(n).toFixed(digits);
}
function fmtMs(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n < 1000) return `${Math.round(n)}ms`;
  return `${(n / 1000).toFixed(1)}s`;
}

function ExecutionLab() {
  const { data } = useSuspenseQuery(opts);
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">مختبر التنفيذ</h1>
        <p className="text-sm text-muted-foreground">
          تسجيل حقيقي لكل أمر شراء/بيع وعمق السوق لحظة القرار. البيانات دي هتحدد أفضل استراتيجية بيع بعد أسبوعين.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Snapshots اليوم" value={data.snapshots_today.toLocaleString()} />
        <Stat label="أوامر اليوم" value={data.orders_today.toLocaleString()} />
        <Stat label="متوسط زمن التنفيذ" value={fmtMs(data.avg_time_to_first_fill_ms)} />
        <Stat label="متوسط الانزلاق" value={fmt(data.avg_slippage_vs_touch, 3)} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Card title="بحسب الحالة">
          {Object.keys(data.orders_by_status).length === 0 ? (
            <div className="text-sm text-muted-foreground">لا يوجد أوامر اليوم</div>
          ) : (
            <ul className="text-sm space-y-1">
              {Object.entries(data.orders_by_status).map(([k, v]) => (
                <li key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v}</span></li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="بحسب النوع">
          {Object.keys(data.orders_by_type).length === 0 ? (
            <div className="text-sm text-muted-foreground">لا يوجد أوامر اليوم</div>
          ) : (
            <ul className="text-sm space-y-1">
              {Object.entries(data.orders_by_type).map(([k, v]) => (
                <li key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v}</span></li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="آخر 20 أمر">
        {data.recent_orders.length === 0 ? (
          <div className="text-sm text-muted-foreground">لسه مفيش أوامر مسجلة. الاكستنشن هيبدأ يبعت لما نفعّل الـtracker.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="text-right p-2">الوقت</th>
                  <th className="text-right p-2">السهم</th>
                  <th className="text-right p-2">الاتجاه</th>
                  <th className="text-right p-2">النوع</th>
                  <th className="text-right p-2">الحالة</th>
                  <th className="text-right p-2">سعر مطلوب</th>
                  <th className="text-right p-2">سعر تنفيذ</th>
                  <th className="text-right p-2">Bid/Ask</th>
                  <th className="text-right p-2">زمن</th>
                  <th className="text-right p-2">انزلاق</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2 font-mono">{new Date(o.placed_at).toLocaleTimeString("ar-EG")}</td>
                    <td className="p-2 font-mono">{o.symbol}</td>
                    <td className="p-2">{o.side === "buy" ? "شراء" : "بيع"}</td>
                    <td className="p-2">{o.order_type}</td>
                    <td className="p-2">{o.status}</td>
                    <td className="p-2 font-mono">{fmt(o.requested_price)}</td>
                    <td className="p-2 font-mono">{fmt(o.fill_price_avg)}</td>
                    <td className="p-2 font-mono">{fmt(o.best_bid_at_placement)}/{fmt(o.best_ask_at_placement)}</td>
                    <td className="p-2">{fmtMs(o.time_to_first_fill_ms)}</td>
                    <td className="p-2 font-mono">{fmt(o.slippage_vs_touch, 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-semibold mt-1">{value}</div>
    </div>
  );
}
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4">
      <div className="font-semibold mb-2">{title}</div>
      {children}
    </div>
  );
}