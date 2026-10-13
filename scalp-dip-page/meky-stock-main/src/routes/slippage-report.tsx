import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getSlippageReport } from "@/lib/trade-ledger.functions";

export const Route = createFileRoute("/slippage-report")({
  head: () => ({
    meta: [
      { title: "Slippage Report — المتوقع مقابل الفعلي" },
      { name: "description", content: "فرق السعر والزمن بين إشارة الاستراتيجية والتنفيذ الفعلي في ثاندر." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(3)}%`;
}
function fmtSec(n: number | null | undefined) {
  if (n == null) return "—";
  return n < 60 ? `${n.toFixed(1)}s` : `${(n / 60).toFixed(1)}m`;
}
function fmtPx(n: number | null | undefined) {
  if (n == null) return "—";
  return n.toFixed(3);
}
function slipClass(n: number | null | undefined, side: "buy" | "sell") {
  if (n == null) return "text-gray-400";
  // Buy: negative = better (bought cheaper). Sell: positive = better (sold higher).
  const good = side === "buy" ? n < -0.05 : n > 0.05;
  const bad = side === "buy" ? n > 0.15 : n < -0.15;
  if (good) return "text-emerald-700 font-semibold";
  if (bad) return "text-red-700 font-semibold";
  return "text-gray-700";
}

function Page() {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const fetchReport = useServerFn(getSlippageReport);
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["slippage-report", date],
    queryFn: () => fetchReport({ data: { date } }),
    refetchInterval: 30_000,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">📐 Slippage Report</h1>
          <p className="text-sm text-gray-600">
            الفرق بين السعر المتوقع (لحظة الإشارة / لحظة طلب البيع) والسعر الفعلي اللي اتنفّذ في ثاندر.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <button onClick={() => refetch()} className="border rounded px-3 py-1 text-sm bg-white hover:bg-gray-50">
            🔄 تحديث
          </button>
          <Link to="/trade-lifecycle" className="text-sm text-blue-600 hover:underline">← Trade Lifecycle</Link>
          <Link to="/marketwatch-health" className="text-sm text-blue-600 hover:underline">Health →</Link>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">جاري التحميل...</div>}
      {error && <div className="text-red-600">خطأ: {String((error as Error).message)}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card title="عدد الصفقات" value={String(data.summary.trades)} sub={`${data.summary.paired_buys} شراء / ${data.summary.paired_sells} بيع`} />
            <Card
              title="متوسط انزلاق الشراء"
              value={fmtPct(data.summary.buy_slippage_avg_pct)}
              sub={`وسيط ${fmtPct(data.summary.buy_slippage_median_pct)} · أسوأ ${fmtPct(data.summary.buy_slippage_worst_abs_pct)}`}
              tone={data.summary.buy_slippage_avg_pct != null && data.summary.buy_slippage_avg_pct > 0.2 ? "bad" : "ok"}
            />
            <Card
              title="متوسط انزلاق البيع"
              value={fmtPct(data.summary.sell_slippage_avg_pct)}
              sub={`وسيط ${fmtPct(data.summary.sell_slippage_median_pct)} · أسوأ ${fmtPct(data.summary.sell_slippage_worst_abs_pct)}`}
              tone={data.summary.sell_slippage_avg_pct != null && data.summary.sell_slippage_avg_pct < -0.2 ? "bad" : "ok"}
            />
            <Card
              title="زمن التنفيذ"
              value={`شراء ${fmtSec(data.summary.buy_latency_median_sec)}`}
              sub={`بيع ${fmtSec(data.summary.sell_latency_median_sec)} (وسيط)`}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-900">
            <strong>ازاي تقرا:</strong> انزلاق الشراء الموجب = اشتريت أغلى من المتوقع (سيء). انزلاق البيع الموجب = بعت أعلى من المتوقع (كويس).
            القيمة المثالية = صفر أو قريبة منه. لو المتوسط تعدى 0.2% في الاتجاه السيء → في مشكلة سرعة/سيولة محتاجة فحص.
          </div>

          <div className="bg-white border rounded overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="text-right px-3 py-2">السهم</th>
                  <th className="text-right px-3 py-2">الاستراتيجية</th>
                  <th className="text-right px-3 py-2">متوقع شراء</th>
                  <th className="text-right px-3 py-2">فعلي شراء</th>
                  <th className="text-right px-3 py-2">انزلاق</th>
                  <th className="text-right px-3 py-2">زمن</th>
                  <th className="text-right px-3 py-2">متوقع بيع</th>
                  <th className="text-right px-3 py-2">فعلي بيع</th>
                  <th className="text-right px-3 py-2">انزلاق</th>
                  <th className="text-right px-3 py-2">زمن</th>
                  <th className="text-right px-3 py-2">النهاية</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 && (
                  <tr><td colSpan={11} className="px-3 py-6 text-center text-gray-500">لا توجد صفقات في هذا اليوم بعد.</td></tr>
                )}
                {data.rows.map((r) => (
                  <tr key={r.key} className="border-t hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold">{r.symbol}</td>
                    <td className="px-3 py-2 text-gray-600">{r.strategy || "—"}</td>
                    <td className="px-3 py-2">{fmtPx(r.expected_buy)}</td>
                    <td className="px-3 py-2">{fmtPx(r.actual_buy)}</td>
                    <td className={`px-3 py-2 ${slipClass(r.buy_slippage_pct, "buy")}`}>{fmtPct(r.buy_slippage_pct)}</td>
                    <td className="px-3 py-2 text-gray-600">{fmtSec(r.buy_latency_sec)}</td>
                    <td className="px-3 py-2">{fmtPx(r.expected_sell)}</td>
                    <td className="px-3 py-2">{fmtPx(r.actual_sell)}</td>
                    <td className={`px-3 py-2 ${slipClass(r.sell_slippage_pct, "sell")}`}>{fmtPct(r.sell_slippage_pct)}</td>
                    <td className="px-3 py-2 text-gray-600">{fmtSec(r.sell_latency_sec)}</td>
                    <td className="px-3 py-2 text-gray-600">{r.exit_reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value, sub, tone }: { title: string; value: string; sub?: string; tone?: "ok" | "bad" }) {
  const border = tone === "bad" ? "border-red-300 bg-red-50" : "border-gray-200 bg-white";
  return (
    <div className={`rounded border p-3 ${border}`}>
      <div className="text-xs text-gray-600">{title}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}