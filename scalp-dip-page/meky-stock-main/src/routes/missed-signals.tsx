import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getMissedSignalsReport } from "@/lib/trade-ledger.functions";

export const Route = createFileRoute("/missed-signals")({
  head: () => ({
    meta: [
      { title: "Missed Signals — الإشارات الضايعة" },
      { name: "description", content: "الإشارات اللي الاستراتيجية شافتها لكن ماخدتش فيها صفقة، ونتيجتها لو كنا دخلنا." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

function fmtPct(n: number | null | undefined) {
  if (n == null) return "—";
  const s = n > 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}
function fmtPx(n: number | null | undefined) {
  if (n == null) return "—";
  return Number(n).toFixed(3);
}
function reasonLabel(r: string) {
  switch (r) {
    case "busy_open_trade": return "🔒 صفقة مفتوحة";
    case "not_top_pick": return "🥈 مش أفضل مرشح";
    case "prebuy_filter": return "🔇 فلتر السيولة";
    default: return r;
  }
}
function outcomeBadge(o: string) {
  const map: Record<string, { txt: string; cls: string }> = {
    would_win:  { txt: "🎯 كان هيربح", cls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
    would_lose: { txt: "🛑 كان هيخسر", cls: "bg-red-100 text-red-800 border-red-300" },
    flat:       { txt: "➖ ثابت", cls: "bg-gray-100 text-gray-700 border-gray-300" },
    unknown:    { txt: "❔ غير مؤكد", cls: "bg-yellow-50 text-yellow-800 border-yellow-300" },
  };
  const m = map[o] ?? map.unknown;
  return <span className={`px-2 py-0.5 rounded border text-xs ${m.cls}`}>{m.txt}</span>;
}

function Page() {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const fetchReport = useServerFn(getMissedSignalsReport);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["missed-signals", date],
    queryFn: () => fetchReport({ data: { date } }),
    refetchInterval: 30_000,
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="text-2xl font-bold">🎯 الإشارات الضايعة</h1>
          <p className="text-sm text-gray-600">
            كل مرشح مطابق لشروط DIP اترفض/ما اتنفذش؛ الجدول بيحسب لو دخلنا كان هيوصل TP ولا هيهبط لـ SL خلال ساعة.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm" />
          <button onClick={() => refetch()} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700">
            {isFetching ? "…" : "تحديث"}
          </button>
          <Link to="/marketwatch-health" className="text-sm text-blue-600 hover:underline">← العودة</Link>
        </div>
      </div>

      {isLoading && <div className="text-gray-500">جاري التحميل…</div>}
      {error && <div className="text-red-600">خطأ: {String((error as Error).message)}</div>}

      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card title="إجمالي" value={String(data.summary.total)} />
            <Card title="كان هيربح" value={String(data.summary.would_win)} tone="win" />
            <Card title="كان هيخسر" value={String(data.summary.would_lose)} tone="lose" />
            <Card title="غير مؤكد / ثابت" value={String(data.summary.unknown + data.summary.flat)} />
            <Card title="ربح ضاع (تقديري)" value={`${data.summary.missed_profit_egp} EGP`} tone="win" />
            <Card title="خسارة اتفاديت" value={`${data.summary.avoided_loss_egp} EGP`} tone="lose" />
            <Card title="صافي حكم النظام" value={`${(data.summary.avoided_loss_egp - data.summary.missed_profit_egp).toFixed(0)} EGP`} />
          </div>

          <div className="bg-white rounded border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-2 text-right">الوقت</th>
                  <th className="p-2 text-right">السهم</th>
                  <th className="p-2 text-right">السبب</th>
                  <th className="p-2 text-right">Rank</th>
                  <th className="p-2 text-right">السعر</th>
                  <th className="p-2 text-right">Drop %</th>
                  <th className="p-2 text-right">TP</th>
                  <th className="p-2 text-right">أعلى/أدنى</th>
                  <th className="p-2 text-right">Max Gain / Loss</th>
                  <th className="p-2 text-right">النتيجة</th>
                  <th className="p-2 text-right">P&amp;L تقديري</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="p-2 whitespace-nowrap">{new Date(r.ts).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo" })}</td>
                    <td className="p-2 font-semibold">{r.symbol}</td>
                    <td className="p-2">{reasonLabel(r.reason)}</td>
                    <td className="p-2">{r.rank ?? "—"}</td>
                    <td className="p-2">{fmtPx(r.candidate_price)}</td>
                    <td className="p-2 text-red-700">{fmtPct(r.drop_pct != null ? Number(r.drop_pct) * 100 : null)}</td>
                    <td className="p-2">{fmtPx(r.tp_price)}</td>
                    <td className="p-2 text-gray-600">{fmtPx(r.max_price)} / {fmtPx(r.min_price)}</td>
                    <td className="p-2">
                      <span className="text-emerald-700">{fmtPct(r.max_gain_pct)}</span>
                      {" / "}
                      <span className="text-red-700">{fmtPct(r.max_loss_pct)}</span>
                    </td>
                    <td className="p-2">{outcomeBadge(r.outcome)}</td>
                    <td className={`p-2 font-semibold ${r.est_pnl == null ? "text-gray-400" : r.est_pnl >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                      {r.est_pnl == null ? "—" : `${r.est_pnl > 0 ? "+" : ""}${r.est_pnl}`}
                    </td>
                  </tr>
                ))}
                {!data.rows.length && (
                  <tr><td colSpan={11} className="p-6 text-center text-gray-500">مافيش إشارات ضايعة في اليوم ده.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone?: "win" | "lose" }) {
  const cls = tone === "win" ? "text-emerald-700" : tone === "lose" ? "text-red-700" : "text-gray-900";
  return (
    <div className="bg-white rounded border p-3 shadow-sm">
      <div className="text-xs text-gray-500">{title}</div>
      <div className={`text-xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}
