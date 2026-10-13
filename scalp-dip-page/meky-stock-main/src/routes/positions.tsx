import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  acknowledgeAlert,
  closePosition,
  dailyPnl,
  evaluatePositions,
  listPositions,
  openPosition,
  type PositionRow,
} from "@/lib/positions/positions.functions";

const positionsQO = queryOptions({
  queryKey: ["positions"],
  queryFn: () => listPositions(),
});

const dailyPnlQO = queryOptions({
  queryKey: ["positions", "daily-pnl"],
  queryFn: () => dailyPnl(),
});

export const Route = createFileRoute("/positions")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(positionsQO),
      context.queryClient.ensureQueryData(dailyPnlQO),
    ]),
  component: PositionsPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-bear" role="alert">
      حدث خطأ: {error.message}
    </div>
  ),
  notFoundComponent: () => <div className="p-8 text-center">الصفحة غير موجودة</div>,
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function PositionsPage() {
  const { data } = useSuspenseQuery(positionsQO);
  const { data: pnlData } = useSuspenseQuery(dailyPnlQO);
  const qc = useQueryClient();
  const evaluate = useServerFn(evaluatePositions);
  const close = useServerFn(closePosition);
  const ack = useServerFn(acknowledgeAlert);

  const evalMut = useMutation({
    mutationFn: () => evaluate({ data: undefined as never }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });
  const ackMut = useMutation({
    mutationFn: (alert_id: string) => ack({ data: { alert_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["positions"] }),
  });

  const open = data.positions.filter((p) => p.status === "open");
  const closed = data.positions.filter((p) => p.status === "closed");
  const totalPnl = closed.reduce((s, p) => s + (p.pnl_pct ?? 0), 0);

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/50 px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold">💰 مراكزي</h1>
            <p className="text-xs text-muted-foreground">
              تتبّع الأسهم اللي اشتريتها — السيستم يقولّك امتى تبيع
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              ← الرئيسية
            </Link>
            <button
              onClick={() => evalMut.mutate()}
              disabled={evalMut.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {evalMut.isPending ? "جاري التقييم…" : "🔄 تقييم المراكز الآن"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-6">
        {evalMut.data && (
          <div className="rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm">
            تم تقييم {evalMut.data.evaluated} مركز — {evalMut.data.alerts_created} إشعار بيع جديد
          </div>
        )}

        {/* Sell Alerts */}
        {data.alerts.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">🔔 إشعارات البيع ({data.alerts.length})</h2>
            <div className="space-y-2">
              {data.alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-warn/40 bg-warn/10 p-4"
                >
                  <div>
                    <div className="font-bold">{a.message_ar}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      السعر المقترح: {fmt(a.suggested_exit_price)} | الربح/الخسارة: {fmt(a.pnl_pct)}%
                    </div>
                  </div>
                  <button
                    onClick={() => ackMut.mutate(a.id)}
                    className="rounded-md border border-border px-3 py-1 text-xs hover:bg-muted"
                  >
                    تجاهل
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Open positions */}
        <section>
          <h2 className="mb-3 text-lg font-bold">📂 مراكز مفتوحة ({open.length})</h2>
          {open.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
              مفيش مراكز مفتوحة. ابدأ بإضافة سهم اشتريته من النموذج تحت 👇
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {open.map((p) => (
                <OpenCard key={p.id} p={p} onClose={(exit_price) =>
                  close({ data: { position_id: p.id, exit_price, exit_reason: "manual" } }).then(() =>
                    qc.invalidateQueries({ queryKey: ["positions"] }),
                  )
                } />
              ))}
            </div>
          )}
        </section>

        <AddPositionForm onAdded={() => qc.invalidateQueries({ queryKey: ["positions"] })} />

        {/* Daily realized P&L */}
        {pnlData.days.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">📅 الربح اليومي المُحقَّق</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2 text-right">اليوم</th>
                    <th className="p-2 text-right">عدد الصفقات</th>
                    <th className="p-2 text-right">صافي الربح (ج.م)</th>
                    <th className="p-2 text-right">متوسط %</th>
                    <th className="p-2 text-right">الأسهم</th>
                  </tr>
                </thead>
                <tbody>
                  {pnlData.days.map((d) => {
                    const pos = d.realized_egp >= 0;
                    return (
                      <tr key={d.day} className="border-t border-border">
                        <td className="p-2 font-semibold">{d.day}</td>
                        <td className="p-2 tabular-nums">{d.trades}</td>
                        <td className={`p-2 font-bold tabular-nums ${pos ? "text-bull" : "text-bear"}`}>
                          {pos ? "+" : ""}
                          {fmt(d.realized_egp)}
                        </td>
                        <td className={`p-2 tabular-nums ${d.avg_pnl_pct >= 0 ? "text-bull" : "text-bear"}`}>
                          {d.avg_pnl_pct >= 0 ? "+" : ""}
                          {fmt(d.avg_pnl_pct)}%
                        </td>
                        <td className="p-2 text-xs text-muted-foreground">{d.symbols.join("، ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Closed positions */}
        {closed.length > 0 && (
          <section>
            <h2 className="mb-3 text-lg font-bold">
              📕 مراكز مغلقة ({closed.length}) —{" "}
              <span className={totalPnl >= 0 ? "text-bull" : "text-bear"}>
                إجمالي: {totalPnl >= 0 ? "+" : ""}
                {fmt(totalPnl)}%
              </span>
            </h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs">
                  <tr>
                    <th className="p-2 text-right">السهم</th>
                    <th className="p-2 text-right">دخول</th>
                    <th className="p-2 text-right">خروج</th>
                    <th className="p-2 text-right">الربح %</th>
                    <th className="p-2 text-right">السبب</th>
                    <th className="p-2 text-right">وقت البيع</th>
                  </tr>
                </thead>
                <tbody>
                  {closed.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-2 font-semibold">{p.name_ar || p.symbol}</td>
                      <td className="p-2 tabular-nums">{fmt(p.entry_price)}</td>
                      <td className="p-2 tabular-nums">{fmt(p.exit_price)}</td>
                      <td className={`p-2 font-bold tabular-nums ${(p.pnl_pct ?? 0) >= 0 ? "text-bull" : "text-bear"}`}>
                        {(p.pnl_pct ?? 0) >= 0 ? "+" : ""}
                        {fmt(p.pnl_pct)}%
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{p.exit_reason}</td>
                      <td className="p-2 text-xs">
                        {p.exit_at
                          ? new Date(p.exit_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })
                          : p.exit_date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function OpenCard({ p, onClose }: { p: PositionRow; onClose: (exit: number) => void }) {
  const [exit, setExit] = useState(p.current_price ?? p.entry_price);
  const pnlPos = (p.pnl_pct ?? 0) >= 0;
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-bold">{p.name_ar || p.symbol}</div>
          <div className="text-xs text-muted-foreground">{p.symbol}</div>
        </div>
        <div className={`text-lg font-extrabold tabular-nums ${pnlPos ? "text-bull" : "text-bear"}`}>
          {pnlPos ? "+" : ""}
          {fmt(p.pnl_pct)}%
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <div>الدخول: <span className="font-semibold tabular-nums">{fmt(p.entry_price)}</span></div>
        <div>الحالي: <span className="font-semibold tabular-nums">{fmt(p.current_price)}</span></div>
        <div>الهدف: <span className="font-semibold tabular-nums text-bull">{fmt(p.target_price)}</span></div>
        <div>وقف الخسارة: <span className="font-semibold tabular-nums text-bear">{fmt(p.stop_loss)}</span></div>
        {p.trailing_stop != null && (
          <div className="col-span-2 text-warn">🔒 Trailing: {fmt(p.trailing_stop)}</div>
        )}
        <div className="col-span-2 text-muted-foreground">
          الكمية: {fmt(p.quantity, 0)} | اشتريت: {new Date(p.entry_at).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          step="0.01"
          value={exit}
          onChange={(e) => setExit(parseFloat(e.target.value))}
          className="w-24 rounded border border-border bg-background px-2 py-1 text-sm tabular-nums"
        />
        <button
          onClick={() => onClose(exit)}
          className="rounded bg-bear px-3 py-1 text-sm font-semibold text-bear-foreground hover:opacity-90"
        >
          إغلاق المركز
        </button>
      </div>
    </div>
  );
}

function AddPositionForm({ onAdded }: { onAdded: () => void }) {
  const openFn = useServerFn(openPosition);
  const [symbol, setSymbol] = useState("");
  const [entry, setEntry] = useState("");
  const [qty, setQty] = useState("1");
  const [sl, setSl] = useState("");
  const [tp, setTp] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const mut = useMutation({
    mutationFn: async () => {
      const entryNum = parseFloat(entry);
      return openFn({
        data: {
          symbol: symbol.trim().toUpperCase(),
          entry_price: entryNum,
          quantity: parseFloat(qty) || 1,
          stop_loss: sl ? parseFloat(sl) : null,
          target_price: tp ? parseFloat(tp) : null,
        },
      });
    },
    onSuccess: () => {
      setOk(true);
      setErr(null);
      setSymbol(""); setEntry(""); setSl(""); setTp(""); setQty("1");
      onAdded();
      setTimeout(() => setOk(false), 2500);
    },
    onError: (e: Error) => setErr(e.message),
  });

  return (
    <section className="rounded-lg border border-border bg-card p-4">
      <h3 className="mb-3 font-bold">➕ إضافة مركز جديد</h3>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <input placeholder="الرمز (COMI)" value={symbol} onChange={(e) => setSymbol(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm" />
        <input placeholder="سعر الشراء" type="number" step="0.01" value={entry} onChange={(e) => setEntry(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" />
        <input placeholder="الكمية" type="number" value={qty} onChange={(e) => setQty(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" />
        <input placeholder="وقف الخسارة" type="number" step="0.01" value={sl} onChange={(e) => setSl(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" />
        <input placeholder="الهدف" type="number" step="0.01" value={tp} onChange={(e) => setTp(e.target.value)}
          className="rounded border border-border bg-background px-3 py-2 text-sm tabular-nums" />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={() => mut.mutate()}
          disabled={mut.isPending || !symbol || !entry}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {mut.isPending ? "جاري الحفظ…" : "حفظ"}
        </button>
        {ok && <span className="text-sm text-bull">✓ تم الحفظ</span>}
        {err && <span className="text-sm text-bear">{err}</span>}
      </div>
    </section>
  );
}