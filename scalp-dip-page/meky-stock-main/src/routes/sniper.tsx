import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getSniperSnapshot } from "@/lib/sniper/sniper.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { ThunderConnectionBanner } from "@/components/thunder-connection-banner";

export const Route = createFileRoute("/sniper")({
  head: () => ({
    meta: [
      { title: "Sniper — صفقة اليوم" },
      { name: "description", content: "سهم واحد كل يوم بدقة عالية — تأكيد ORB من 3 مصادر real-time" },
    ],
  }),
  component: SniperPage,
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function SniperPage() {
  const fetchSnapshot = useServerFn(getSniperSnapshot);
  const { data, isLoading } = useQuery({
    queryKey: ["sniper-snapshot"],
    queryFn: () => fetchSnapshot(),
    refetchInterval: 15_000,
  });
  const status = getMarketStatus();

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">جاري التحميل…</div>;
  if (!data?.pick) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center">
        <h1 className="text-3xl font-bold mb-4">🎯 Sniper</h1>
        <p className="text-muted-foreground">مفيش سهم مختار النهارده. الاختيار بيتم 9:00 صباحاً.</p>
        <p className="mt-2 text-xs text-muted-foreground">{status.label}</p>
      </div>
    );
  }

  const p = data.pick;
  const livePrice = data.latest?.price ?? null;
  const movePct = livePrice && p.prev_close ? ((livePrice - p.prev_close) / p.prev_close) * 100 : null;
  const moveColor = movePct == null ? "text-muted-foreground" : movePct >= 0 ? "text-bull" : "text-bear";

  const decisionBadge =
    p.orb_decision === "BUY" ? { c: "bg-bull text-bull-foreground", t: "🟢 شراء بالكامل" } :
    p.orb_decision === "BUY_LIGHT" ? { c: "bg-warn text-warn-foreground", t: "🟡 شراء مخفّض" } :
    p.orb_decision === "SKIP" ? { c: "bg-bear text-bear-foreground", t: "🔴 تجاهل" } :
    { c: "bg-muted text-muted-foreground", t: "⏳ بانتظار قرار ORB (10:30)" };

  const conf = p.confidence ?? 0;
  const highConf = conf >= 80;
  const confBadge = highConf
    ? { c: "bg-bull text-bull-foreground", t: `⭐ ترشيح قوي · ثقة ${conf}%` }
    : { c: "bg-warn/20 text-warn border border-warn/40", t: `⚠️ ترشيح ضعيف · ثقة ${conf}% فقط` };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <ThunderConnectionBanner />
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎯 Sniper — صفقة اليوم</h1>
        <span className="text-xs text-muted-foreground">{status.label} · {status.hhmmss}</span>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold ${confBadge.c}`}>{confBadge.t}</span>
          {!highConf && (
            <span className="text-xs text-muted-foreground self-center">
              النظام ما لقاش سهم بثقة 80%+ النهارده، ده أفضل اختيار متاح
            </span>
          )}
        </div>

        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-muted-foreground">السهم المختار</div>
            <h2 className="text-4xl font-bold">{p.name_ar ?? p.symbol}</h2>
            <div className="text-sm text-muted-foreground mt-1">{p.symbol} · score {fmt(p.v3_score, 1)}</div>
          </div>
          <span className={`px-4 py-2 rounded-full font-semibold ${decisionBadge.c}`}>{decisionBadge.t}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <Stat label="السعر الحالي" value={fmt(livePrice)} suffix="ج.م" extra={
            movePct != null && <span className={`text-xs ${moveColor}`}>{movePct >= 0 ? "+" : ""}{movePct.toFixed(2)}%</span>
          } />
          <Stat label="إقفال أمس" value={fmt(p.prev_close)} suffix="ج.م" />
          <Stat label="الهدف (+4%)" value={fmt(p.target_price)} suffix="ج.م" valueClass="text-bull" />
          <Stat label="الستوب (-2%)" value={fmt(p.stop_price)} suffix="ج.م" valueClass="text-bear" />
        </div>

        {p.orb_high != null && (
          <div className="mt-6 p-4 rounded-xl bg-muted/40">
            <div className="text-sm font-semibold mb-2">نافذة Opening Range (10:00 → 10:30)</div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>أعلى: <span className="font-mono">{fmt(p.orb_high)}</span></div>
              <div>أدنى: <span className="font-mono">{fmt(p.orb_low)}</span></div>
              <div>نسبة الدخول: <span className="font-mono">{p.position_pct ?? 0}%</span></div>
            </div>
          </div>
        )}

        {p.reasons && p.reasons.length > 0 && (
          <div className="mt-6">
            <div className="text-sm font-semibold mb-2 text-bull">
              ✅ {highConf ? "أسباب الثقة في الترشيح" : "نقاط القوة المتاحة"}
            </div>
            <ul className="space-y-1.5">
              {p.reasons.map((r, i) => (
                <li key={i} className="text-sm px-3 py-1.5 rounded-lg bg-bull/10 text-foreground border border-bull/20">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.negative_reasons && p.negative_reasons.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-semibold mb-2 text-warn">
              ⚠️ {highConf ? "ملاحظات للحذر" : "أسباب ضعف الثقة في الترشيح ده"}
            </div>
            <ul className="space-y-1.5">
              {p.negative_reasons.map((r, i) => (
                <li key={i} className="text-sm px-3 py-1.5 rounded-lg bg-warn/10 text-foreground border border-warn/20">
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">آخر الـ ticks (real-time)</h3>
          <span className="text-xs text-muted-foreground">{data.ticks.length} قراءة · يتجدد كل 15s</span>
        </div>
        {data.ticks.length === 0 ? (
          <p className="text-sm text-muted-foreground">لسه ما اتجمعتش ticks. الـ polling بيشتغل من 10:00.</p>
        ) : (
          <div className="max-h-72 overflow-auto">
            <table className="w-full text-xs">
              <thead className="text-muted-foreground">
                <tr><th className="text-right py-1">الوقت</th><th className="text-right py-1">السعر</th><th className="text-right py-1">المصدر</th></tr>
              </thead>
              <tbody>
                {[...data.ticks].reverse().slice(0, 30).map((t, i) => (
                  <tr key={i} className="border-t border-border">
                    <td className="py-1 text-muted-foreground">{new Date(t.ts).toLocaleTimeString("en-EG", { hour12: false })}</td>
                    <td className="py-1 font-mono">{fmt(t.price)}</td>
                    <td className="py-1"><span className="px-2 py-0.5 rounded bg-muted text-xs">{t.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, suffix, valueClass, extra }: { label: string; value: string; suffix?: string; valueClass?: string; extra?: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${valueClass ?? ""}`}>{value}{suffix && <span className="text-xs text-muted-foreground ml-1">{suffix}</span>}</div>
      {extra}
    </div>
  );
}