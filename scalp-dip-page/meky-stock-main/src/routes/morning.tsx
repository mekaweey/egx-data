import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMorningBrief, type MorningBriefPick } from "@/lib/scan/tomorrow.functions";

export const Route = createFileRoute("/morning")({
  head: () => ({
    meta: [
      { title: "بريفينج الصباح — صفقات اليوم بثقة عالية" },
      {
        name: "description",
        content:
          "صفقات قبل افتتاح البورصة (10 صباحاً) عدت بوابة Conviction صارمة: ثقة ≥75% واتفاق ≥4 موديلات وverifier موافق.",
      },
    ],
  }),
  component: MorningPage,
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function Card({ p, rank }: { p: MorningBriefPick; rank: number }) {
  const top = rank === 0;
  return (
    <Link
      to="/stock/$symbol"
      params={{ symbol: p.symbol }}
      className={`block rounded-2xl border p-6 transition hover:scale-[1.01] ${
        top
          ? "border-bull/60 bg-gradient-to-br from-bull/10 to-card shadow-xl shadow-bull/10"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {top && <span className="text-2xl">⭐</span>}
            <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
            <h3 className="text-xl font-bold">{p.name_ar}</h3>
            <span className="text-xs text-muted-foreground">{p.symbol}</span>
          </div>
          {p.sector_ar && <p className="mt-1 text-xs text-muted-foreground">{p.sector_ar}</p>}
        </div>
        <div className="text-end">
          <div className="rounded-full bg-bull/20 px-3 py-1 text-xs font-bold text-bull">
            {p.signal === "strong_buy" ? "شراء قوي" : "شراء"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">ثقة {p.confidence}%</div>
          <div className="mt-1 text-[10px] text-muted-foreground">اتفاق {p.ensemble_agreement}/5</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-[11px] text-muted-foreground">الدخول</div>
          <div className="font-bold">{fmt(p.entry_min)} – {fmt(p.entry_max)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">الهدف</div>
          <div className="font-bold text-bull">{fmt(p.target)}</div>
        </div>
        <div>
          <div className="text-[11px] text-muted-foreground">وقف الخسارة</div>
          <div className="font-bold text-bear">{fmt(p.stop_loss)}</div>
        </div>
      </div>

      {p.symbol_history_n > 0 && (
        <div className="mt-3 text-[11px] text-muted-foreground">
          أداء السهم تاريخياً مع النظام: {fmt((p.symbol_win_rate ?? 0) * 100, 0)}% نجاح من {p.symbol_history_n} توصية
        </div>
      )}

      {p.reasons_ar.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {p.reasons_ar.slice(0, 3).map((r, i) => (
            <li key={i}>• {r}</li>
          ))}
        </ul>
      )}
    </Link>
  );
}

function MorningPage() {
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["morning-brief"],
    queryFn: () => getMorningBrief(),
    refetchInterval: 5 * 60 * 1000,
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">بريفينج الصباح</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            صفقات اليوم اللي عدّت بوابة Conviction قبل افتتاح السوق
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary"
        >
          {isFetching ? "..." : "تحديث"}
        </button>
      </div>

      {isLoading && <div className="text-center text-muted-foreground">جاري التحميل...</div>}

      {data?.noTrade && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-5xl">🛑</div>
          <h2 className="mt-4 text-xl font-bold">لا صفقات اليوم</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.reason}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            عدم الدخول قرار ذكي — لا تجبر صفقة ضعيفة.
          </p>
          <Link to="/tomorrow" className="mt-4 inline-block text-sm text-primary hover:underline">
            شوف كل توصيات الـ tier الذهبي →
          </Link>
        </div>
      )}

      {data?.picks && data.picks.length > 0 && (
        <div className="space-y-4">
          {data.picks.map((p, i) => (
            <Card key={p.symbol} p={p} rank={i} />
          ))}
          <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4 text-xs text-muted-foreground">
            <strong>معايير البوابة:</strong> ثقة ≥ {data.minConfidenceUsed}% • اتفاق ≥ 4/5 موديلات •
            verifier موافق • سجل السهم ليس سيئاً • لم يُرفض بقواعد الفشل
          </div>
        </div>
      )}
    </div>
  );
}
