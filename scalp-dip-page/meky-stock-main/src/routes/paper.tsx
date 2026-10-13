import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { MarketPulseCard } from "@/components/market-pulse-card";

const getPaperResults = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("*")
    .order("trade_date", { ascending: false })
    .order("entry_ts", { ascending: true })
    .limit(500);
  if (error) throw error;
  return { trades: data || [] };
});

export const Route = createFileRoute("/paper")({
  component: PaperPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">خطأ: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
});

function PaperPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["paper-results"],
    queryFn: () => getPaperResults(),
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="p-6">جارٍ التحميل…</div>;
  const trades = data?.trades || [];

  const todayStr = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const todayTrades = trades.filter(t => t.trade_date === todayStr);
  const todayOpen = todayTrades.filter(t => t.status === "open");
  const todayClosed = todayTrades.filter(t => t.status === "closed");
  const todayRealizedPnl = todayClosed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const todayWins = todayClosed.filter(t => Number(t.pnl) > 0).length;
  const todayWinRate = todayClosed.length ? (todayWins / todayClosed.length) * 100 : 0;
  const nowMs = Date.now();
  const FRESH_MS = 5 * 60 * 1000; // إشارة طازة لو خلال آخر 5 دقايق

  // Group by date
  const byDate = new Map<string, typeof trades>();
  for (const t of trades) {
    if (!byDate.has(t.trade_date)) byDate.set(t.trade_date, []);
    byDate.get(t.trade_date)!.push(t);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header>
        <h1 className="text-3xl font-bold">Paper Trading</h1>
        <p className="text-muted-foreground mt-1">
          محاكاة بدون فلوس حقيقية. استراتيجية واحدة فعّالة:
          <br/>• <strong>scalp-mr15</strong>: شراء عند نزول مفاجئ 1.5% خلال 3 دقايق (mean-reversion). TP +1.2% / SL −0.5% / Time-stop 20 دقيقة. رأس مال 10,000.
        </p>
      </header>

      <section className="rounded-lg border-2 border-primary bg-primary/5 p-5">
        <h2 className="text-2xl font-bold mb-2">📡 صفقات النهارده الحية ({todayStr})</h2>
        <MarketPulseCard />
        <p className="text-sm text-muted-foreground mb-4">
          الصفحة بتحدّث نفسها كل 30 ثانية. <strong className="text-foreground">كل إشارة بتترصد وتتسجل تلقائياً</strong> في قاعدة البيانات (دخول + TP/SL + خروج + PnL)، فآخر اليوم تقدر تتأكد لو كنت مشيت ورا الاستراتيجية كنت هتكسب فعلاً ولا لأ.
          <strong className="text-foreground"> انسخها على ورقة بنفس السعر، متشتريش بفلوس حقيقية في أول أسبوع.</strong>
        </p>
        {todayTrades.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded border bg-card p-3">
              <div className="text-xs text-muted-foreground">إشارات اليوم</div>
              <div className="text-xl font-bold">{todayTrades.length}</div>
            </div>
            <div className="rounded border bg-card p-3">
              <div className="text-xs text-muted-foreground">مفتوحة / مقفولة</div>
              <div className="text-xl font-bold">{todayOpen.length} / {todayClosed.length}</div>
            </div>
            <div className="rounded border bg-card p-3">
              <div className="text-xs text-muted-foreground">PnL محقق (لو تابعت كله)</div>
              <div className={`text-xl font-bold ${todayRealizedPnl >= 0 ? "text-bull" : "text-bear"}`}>
                {todayRealizedPnl >= 0 ? "+" : ""}{todayRealizedPnl.toFixed(0)} EGP
              </div>
            </div>
            <div className="rounded border bg-card p-3">
              <div className="text-xs text-muted-foreground">نسبة النجاح</div>
              <div className="text-xl font-bold">{todayWinRate.toFixed(0)}%</div>
            </div>
          </div>
        )}
        {todayTrades.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            مفيش إشارات لسه النهارده. الـ scan بيشتغل من 10:30 صباحاً.
          </div>
        ) : (
          <>
            <div className="rounded-md bg-muted/40 border p-3 text-xs text-muted-foreground mb-3 leading-6">
              <strong className="text-foreground">إزاي تقرأ الكروت؟</strong> كل كارت = إشارة شراء وقت معيّن.
              لو مكتوب <span className="text-warn font-semibold">🔥 إشارة طازة</span> (آخر 5 دقايق) → السعر لسه قريب من سعر الدخول وممكن تدخل بنفس السعر تقريباً.
              لو مكتوب <span className="text-muted-foreground">⏳ مفتوحة</span> من زمان → النافذة فاتت، اعتبرها صفقة محاكاة بس ومتدخلش فيها بفلوس حقيقية.
            </div>
            <div className="space-y-2">
              {todayTrades.map(t => {
                const ageMs = nowMs - new Date(t.entry_ts).getTime();
                const isFresh = t.status === "open" && ageMs <= FRESH_MS;
                return (
                  <div key={t.id} className={`rounded border p-3 flex items-center gap-4 ${
                    isFresh ? "bg-warn/15 border-warn" :
                    t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"
                  }`}>
                    <div className="w-24">
                      <div className="font-bold text-lg">{t.symbol}</div>
                      <div className="text-[10px] text-muted-foreground">{t.strategy}</div>
                    </div>
                    <div className="text-sm">
                      <div>دخول: <strong>{Number(t.entry_price).toFixed(2)}</strong></div>
                      <div className="text-xs text-muted-foreground">
                        TP {Number(t.tp_price).toFixed(2)} / SL {Number(t.sl_price).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      الإشارة: {new Date(t.entry_ts).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit" })}
                      <br/>
                      <span className={isFresh ? "text-warn" : ""}>
                        {Math.floor(ageMs / 60000)} دقيقة فاتت
                      </span>
                    </div>
                    <div className="mr-auto text-left">
                      {isFresh ? (
                        <span className="text-warn font-bold">🔥 إشارة طازة — ادخل دلوقتي</span>
                      ) : t.status === "open" ? (
                        <span className="text-muted-foreground font-semibold">⏳ النافذة فاتت</span>
                      ) : (
                        <span className={Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold"}>
                          {t.exit_reason} • {Number(t.pnl) >= 0 ? "+" : ""}{Number(t.pnl).toFixed(0)} EGP
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="text-xs text-muted-foreground pt-2">
                مفتوحة: {todayOpen.length} • مقفولة: {todayTrades.length - todayOpen.length}
              </div>
            </div>
          </>
        )}
      </section>

      {byDate.size === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          مفيش صفقات لسه. الـ cron هيشتغل تلقائياً في ساعات السوق (10:00–14:30 توقيت القاهرة، الأحد–الخميس).
        </div>
      )}

      {Array.from(byDate.entries()).map(([date, list]) => {
        const closed = list.filter(t => t.status === "closed");
        const totalPnl = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
        const wins = closed.filter(t => Number(t.pnl) > 0).length;
        const winRate = closed.length ? (wins / closed.length) * 100 : 0;
        return (
          <section key={date} className="rounded-lg border bg-card p-4">
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-xl font-semibold">{date}</h2>
              <div className="flex gap-4 text-sm">
                <span className={totalPnl >= 0 ? "text-bull" : "text-bear"}>
                  PnL: <strong>{totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(0)} EGP</strong>
                </span>
                <span>Win rate: <strong>{winRate.toFixed(0)}%</strong></span>
                <span>صفقات: {list.length} ({closed.length} مقفولة)</span>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-muted-foreground">
                <tr>
                  <th className="py-1">السهم</th>
                  <th>Entry</th>
                  <th>TP/SL</th>
                  <th>Exit</th>
                  <th>السبب</th>
                  <th className="text-right">PnL</th>
                </tr>
              </thead>
              <tbody>
                {list.map(t => (
                  <tr key={t.id} className="border-t">
                    <td className="py-1.5 font-medium">{t.symbol}</td>
                    <td>{Number(t.entry_price).toFixed(2)}</td>
                    <td className="text-xs text-muted-foreground">
                      {Number(t.tp_price).toFixed(2)} / {Number(t.sl_price).toFixed(2)}
                    </td>
                    <td>{t.exit_price ? Number(t.exit_price).toFixed(2) : "—"}</td>
                    <td>
                      {t.exit_reason ? (
                        <span className={
                          t.exit_reason === "TP" ? "text-bull" :
                          t.exit_reason === "SL" ? "text-bear" : "text-muted-foreground"
                        }>{t.exit_reason}</span>
                      ) : <span className="text-primary">open</span>}
                    </td>
                    <td className={`text-right ${Number(t.pnl) >= 0 ? "text-bull" : "text-bear"}`}>
                      {t.pnl != null ? `${Number(t.pnl) >= 0 ? "+" : ""}${Number(t.pnl).toFixed(0)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}
    </div>
  );
}