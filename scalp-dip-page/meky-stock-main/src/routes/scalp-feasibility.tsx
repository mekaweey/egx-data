import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { computeScalpFeasibility } from "@/lib/scalp-feasibility/compute.functions";

type Row = {
  id: number;
  signal_id: number;
  trade_date: string;
  symbol: string;
  signal_ts: string;
  entry_price: number;
  target_price: number;
  breakeven_price: number;
  entry_feasible: boolean | null;
  entry_actual_price: number | null;
  entry_delay_sec: number | null;
  time_to_target_sec: number | null;
  time_to_breakeven_sec: number | null;
  prints_at_target_count: number;
  prints_at_target_volume: number;
  prints_at_breakeven_count: number;
  max_price_60s: number | null;
  max_price_180s: number | null;
  min_price_180s: number | null;
  ticks_in_window: number;
  worst_case_loss_pct: number | null;
  best_case_gain_pct: number | null;
  exit_verdict: string;
  l2_at_signal_ts: string | null;
  l2_best_bid: number | null;
  l2_best_ask: number | null;
  l2_bid_depth_top5: number | null;
};

const listFeasibility = createServerFn({ method: "GET" })
  .inputValidator((input: { tradeDate?: string }) => input)
  .handler(async ({ data }): Promise<{ rows: Row[]; tradeDate: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tradeDate = data.tradeDate || new Date().toISOString().slice(0, 10);
    const { data: rows, error } = await supabaseAdmin
      .from("scalp_feasibility_report")
      .select("*")
      .eq("trade_date", tradeDate)
      .order("signal_ts", { ascending: false });
    if (error) throw new Error(error.message);
    return { rows: (rows || []) as Row[], tradeDate };
  });

export const Route = createFileRoute("/scalp-feasibility")({
  head: () => ({
    meta: [
      { title: "تقرير جدوى إشارات Scalp" },
      {
        name: "description",
        content: "إثبات مؤكد بأرقام حقيقية لكل إشارة scalp: هل كان ممكن الشراء والبيع بمكسب.",
      },
    ],
  }),
  component: FeasibilityPage,
});

function verdictBadge(v: string) {
  const map: Record<string, string> = {
    profit: "bg-green-500/15 text-green-500 border-green-500/30",
    breakeven: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
    thin: "bg-orange-500/15 text-orange-500 border-orange-500/30",
    slow: "bg-blue-500/15 text-blue-500 border-blue-500/30",
    loss: "bg-red-500/15 text-red-500 border-red-500/30",
    stuck: "bg-muted text-muted-foreground border-border",
  };
  const label: Record<string, string> = {
    profit: "✅ ربح مؤكد",
    breakeven: "⚖️ تعادل",
    thin: "⚠️ سيولة رقيقة",
    slow: "🐢 بطيء (>60s)",
    loss: "❌ خسارة",
    stuck: "— بيانات ناقصة",
  };
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${map[v] || "border-border"}`}
    >
      {label[v] || v}
    </span>
  );
}

function fmt(n: number | null | undefined, digits = 2) {
  if (n === null || n === undefined || Number.isNaN(Number(n))) return "—";
  return Number(n).toFixed(digits);
}
function fmtPct(n: number | null | undefined) {
  if (n === null || n === undefined) return "—";
  return `${(Number(n) * 100).toFixed(2)}%`;
}

function FeasibilityPage() {
  const today = new Date().toISOString().slice(0, 10);
  const [tradeDate, setTradeDate] = useState(today);
  const listFn = useServerFn(listFeasibility);
  const recomputeFn = useServerFn(computeScalpFeasibility);

  const q = useQuery({
    queryKey: ["scalp-feasibility", tradeDate],
    queryFn: () => listFn({ data: { tradeDate } }),
    refetchInterval: 60_000,
  });

  const rows = q.data?.rows || [];
  const total = rows.length;
  const byVerdict = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.exit_verdict] = (acc[r.exit_verdict] || 0) + 1;
    return acc;
  }, {});
  const profit = byVerdict.profit || 0;
  const breakeven = byVerdict.breakeven || 0;
  const thin = byVerdict.thin || 0;
  const slow = byVerdict.slow || 0;
  const loss = byVerdict.loss || 0;
  const stuck = byVerdict.stuck || 0;
  const denom = total - stuck;
  const winRate = denom > 0 ? ((profit / denom) * 100).toFixed(1) : "—";
  const safeRate =
    denom > 0 ? (((profit + breakeven) / denom) * 100).toFixed(1) : "—";

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">تقرير جدوى إشارات Scalp</h1>
            <p className="text-xs text-muted-foreground mt-1">
              كل رقم مأخوذ من prints فعلية في live_ticks — بدون تخمين
            </p>
          </div>
          <Link
            to="/scalp"
            className="text-sm text-primary hover:underline"
          >
            ← رجوع لصفحة Scalp
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm">تاريخ التداول:</label>
          <input
            type="date"
            value={tradeDate}
            onChange={(e) => setTradeDate(e.target.value)}
            className="rounded border border-border bg-background px-3 py-1.5 text-sm"
          />
          <button
            onClick={async () => {
              await recomputeFn({ data: { tradeDate } });
              q.refetch();
            }}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground"
          >
            إعادة الحساب الآن
          </button>
          <span className="text-xs text-muted-foreground">
            (بيتحسب تلقائياً كل يوم بعد قفل السوق)
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
          <SummaryCard label="إجمالي الإشارات" value={total} />
          <SummaryCard label="✅ ربح مؤكد" value={profit} tone="green" />
          <SummaryCard label="⚖️ تعادل" value={breakeven} tone="yellow" />
          <SummaryCard label="⚠️ سيولة رقيقة" value={thin} tone="orange" />
          <SummaryCard label="🐢 بطيء" value={slow} />
          <SummaryCard label="❌ خسارة" value={loss} tone="red" />
          <SummaryCard label="بيانات ناقصة" value={stuck} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground">
              نسبة الربح المؤكد (بعد استبعاد stuck)
            </div>
            <div className="text-3xl font-bold text-green-500 mt-1">
              {winRate}%
            </div>
          </div>
          <div className="rounded-lg border border-border p-4">
            <div className="text-xs text-muted-foreground">
              نسبة النجاة (ربح أو تعادل)
            </div>
            <div className="text-3xl font-bold text-primary mt-1">
              {safeRate}%
            </div>
          </div>
        </div>

        {q.isLoading && (
          <p className="text-sm text-muted-foreground">جاري التحميل...</p>
        )}
        {q.error && (
          <p className="text-sm text-red-500">
            خطأ: {(q.error as Error).message}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-2 text-right">الوقت</th>
                <th className="p-2 text-right">السهم</th>
                <th className="p-2 text-right">الدخول</th>
                <th className="p-2 text-right">التارجت</th>
                <th className="p-2 text-right">دخول متاح؟</th>
                <th className="p-2 text-right">t→target</th>
                <th className="p-2 text-right">Prints ≥ target</th>
                <th className="p-2 text-right">Vol @target</th>
                <th className="p-2 text-right">أعلى/60s</th>
                <th className="p-2 text-right">أسوأ خسارة</th>
                <th className="p-2 text-right">L2 depth</th>
                <th className="p-2 text-right">الحكم</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-2">
                    {new Date(r.signal_ts).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </td>
                  <td className="p-2 font-semibold">{r.symbol}</td>
                  <td className="p-2">{fmt(r.entry_price)}</td>
                  <td className="p-2 text-muted-foreground">
                    {fmt(r.target_price)}
                  </td>
                  <td className="p-2">
                    {r.entry_feasible === true
                      ? `✓ (${r.entry_delay_sec ?? 0}s)`
                      : r.entry_feasible === false
                        ? "✗"
                        : "—"}
                  </td>
                  <td className="p-2">
                    {r.time_to_target_sec !== null
                      ? `${r.time_to_target_sec}s`
                      : "—"}
                  </td>
                  <td className="p-2 font-mono">
                    {r.prints_at_target_count}
                  </td>
                  <td className="p-2 font-mono">
                    {r.prints_at_target_volume}
                  </td>
                  <td className="p-2">{fmt(r.max_price_60s)}</td>
                  <td className="p-2 text-red-500">
                    {fmtPct(r.worst_case_loss_pct)}
                  </td>
                  <td className="p-2">
                    {r.l2_bid_depth_top5 !== null
                      ? fmt(r.l2_bid_depth_top5, 0)
                      : "—"}
                  </td>
                  <td className="p-2">{verdictBadge(r.exit_verdict)}</td>
                </tr>
              ))}
              {!q.isLoading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={12}
                    className="p-6 text-center text-muted-foreground"
                  >
                    مفيش إشارات (would_open) في اليوم ده. اضغط "إعادة الحساب"
                    لو الإشارات لسه ما اتحسبتش.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-border p-4 text-xs text-muted-foreground space-y-1">
          <p>
            <strong>حكم "ربح مؤكد":</strong> 3+ prints عند سعر ≥ target خلال
            دقيقة. كل print = صفقة حقيقية اتنفذت فعلاً بين مشتري وبايع.
          </p>
          <p>
            <strong>حكم "سيولة رقيقة":</strong> 1-2 print بس عند التارجت
            خلال 60s — wick محتمل، مش سيولة كافية للخروج بحجم.
          </p>
          <p>
            <strong>حكم "بطيء":</strong> السعر وصل التارجت لكن بعد الـ 60s —
            محتاج انتظار طويل ومش scalp حقيقي.
          </p>
          <p>
            <strong>Target:</strong> entry × 1.005 |{" "}
            <strong>Breakeven:</strong> entry × 1.0012 (تقريباً كاسر العمولة)
          </p>
          <p className="text-orange-500">
            <strong>ملاحظة:</strong> live_ticks.volume دايماً NULL (ثاندر
            مش بيبعت حجم كل صفقة في الـ long-poll)، فالحكم مبني على عدد
            الـ prints فقط — وده كافي لأن كل print = صفقة مؤكدة.
          </p>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "green" | "yellow" | "orange" | "red";
}) {
  const toneClass =
    tone === "green"
      ? "text-green-500"
      : tone === "yellow"
        ? "text-yellow-500"
        : tone === "orange"
          ? "text-orange-500"
          : tone === "red"
            ? "text-red-500"
            : "text-foreground";
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</div>
    </div>
  );
}