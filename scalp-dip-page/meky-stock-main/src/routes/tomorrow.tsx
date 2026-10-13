import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTomorrowPicks, type TomorrowPick } from "@/lib/scan/tomorrow.functions";
import { getUpcomingCatalysts } from "@/lib/catalysts/catalysts.functions";

export const Route = createFileRoute("/tomorrow")({
  head: () => ({
    meta: [
      { title: "توقعات الغد — الأسهم المتوقع صعودها" },
      {
        name: "description",
        content:
          "أفضل الأسهم المتوقع ارتفاعها في جلسة الغد بناءً على تحليل النموذج وثقة عالية.",
      },
      { property: "og:title", content: "توقعات الغد — EGX سكانر" },
      {
        property: "og:description",
        content: "اختيارات النخبة فقط: شراء بثقة ≥70% وتوقع صعود إيجابي للجلسة التالية.",
      },
    ],
  }),
  component: TomorrowPage,
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function PickCard({ p, rank }: { p: TomorrowPick; rank: number }) {
  const isElite = rank === 0;
  return (
    <Link
      to="/stock/$symbol"
      params={{ symbol: p.symbol }}
      className={`block rounded-2xl border p-6 transition hover:scale-[1.01] ${
        isElite
          ? "border-bull/60 bg-gradient-to-br from-bull/10 to-card shadow-lg shadow-bull/10"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            {isElite && <span className="text-2xl">👑</span>}
            <span className="text-xs font-bold text-muted-foreground">#{rank + 1}</span>
            <h3 className="text-xl font-bold">{p.name_ar}</h3>
            <span className="text-xs text-muted-foreground">{p.symbol}</span>
          </div>
          {p.sector_ar && (
            <p className="mt-1 text-xs text-muted-foreground">{p.sector_ar}</p>
          )}
        </div>
        <div className="text-end">
          <div className="rounded-full bg-bull/20 px-3 py-1 text-xs font-bold text-bull">
            {p.signal === "strong_buy" ? "شراء قوي" : "شراء"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            ثقة {p.confidence}%
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Metric label="السعر الآن" value={fmt(p.close)} />
        <Metric
          label="متوقع غداً"
          value={`+${fmt(p.expected_next_day_pct, 2)}%`}
          tone="bull"
          big
        />
        <Metric label="هدف قصير" value={fmt(p.target)} />
        <Metric label="وقف خسارة" value={fmt(p.stop_loss)} />
      </div>

      {p.entry_timing_ar && (
        <div className="mt-3 inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
          ⏱ {p.entry_timing_ar}
        </div>
      )}

      {p.reasons_ar.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
          {p.reasons_ar.slice(0, 3).map((r, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-bull">✓</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
        {p.ensemble_agreement != null && (
          <span>اتفاق النماذج: {p.ensemble_agreement}/5</span>
        )}
        {p.technical_score != null && <span>فني: {fmt(p.technical_score, 0)}</span>}
        {p.expected_gain_pct != null && (
          <span className="text-bull">هدف كامل: +{fmt(p.expected_gain_pct, 1)}%</span>
        )}
      </div>
    </Link>
  );
}

function Metric({
  label,
  value,
  tone,
  big,
}: {
  label: string;
  value: string;
  tone?: "bull" | "bear";
  big?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div
        className={`tabular-nums font-bold ${big ? "text-2xl" : "text-base"} ${
          tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-foreground"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function TomorrowPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tomorrow-picks"],
    queryFn: () => getTomorrowPicks(),
    refetchInterval: 60_000,
  });

  const fetchCatalysts = useServerFn(getUpcomingCatalysts);
  const { data: catalysts } = useQuery({
    queryKey: ["upcoming-catalysts"],
    queryFn: () => fetchCatalysts(),
    refetchInterval: 10 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  const picks = data?.picks ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-2xl font-black">🎯 توقعات الغد</h1>
            <p className="text-xs text-muted-foreground">
              أسهم النخبة فقط: ثقة ≥{data?.minConfidence ?? 70}% وتوقع صعود إيجابي للجلسة التالية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              ← الرئيسية
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="rounded-xl border border-warn/40 bg-warn/5 p-4 text-sm">
          <strong>تنويه:</strong> هذه توقعات احتمالية مبنية على نماذج إحصائية. الدقة التاريخية للنموذج
          ~65-72% — يعني من كل ١٠ أسهم تظهر هنا، تاريخياً ٢-٣ منهم قد لا يحققون الصعود المتوقع.
          أدر مخاطرك واستخدم وقف الخسارة دائماً.
        </div>

        {isLoading && (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            جاري التحميل…
          </div>
        )}

        {catalysts && catalysts.length > 0 && (
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-bold">📰 محفزات أخبارية قادمة</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              توقعات تأثير أخبار حديثة على الأسهم خلال الأيام القادمة (بناءً على تحليل الذكاء الاصطناعي).
            </p>
            <ul className="space-y-2">
              {catalysts.map((c) => {
                const up = c.expected_direction === "up";
                return (
                  <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/50 p-3">
                    <Link
                      to="/stock/$symbol"
                      params={{ symbol: c.symbol }}
                      className="rounded bg-muted px-2 py-1 text-xs font-bold hover:bg-primary/20"
                    >
                      {c.symbol}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium line-clamp-2">{c.headline}</div>
                      {c.baladi_summary && (
                        <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{c.baladi_summary}</div>
                      )}
                      <div className="mt-1 text-[11px] text-muted-foreground">
                        نافذة التأثير: {c.impact_start_date} → {c.impact_end_date} • ثقة {c.confidence}%
                      </div>
                    </div>
                    <div className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${up ? "bg-bull/20 text-bull" : "bg-bear/20 text-bear"}`}>
                      {up ? "↑" : "↓"} {c.expected_magnitude_pct != null ? `${Number(c.expected_magnitude_pct).toFixed(1)}%` : "—"}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {error && (
          <div className="rounded-xl border border-bear/40 bg-bear/10 p-4 text-bear">
            تعذر تحميل البيانات: {(error as Error).message}
          </div>
        )}

        {!isLoading && picks.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <div className="text-5xl">🤷</div>
            <h2 className="mt-4 text-xl font-bold">لا توجد أسهم بثقة كافية اليوم</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              النموذج لم يجد أي سهم يتجاوز عتبة الثقة المطلوبة (≥{data?.minConfidence ?? 70}%) مع توقع صعود إيجابي.
              <br />
              ده طبيعي في الأيام اللي السوق فيها مش واضح — أفضل من إعطاء إشارات ضعيفة.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              عرض كل الأسهم
            </Link>
          </div>
        )}

        {picks.length > 0 && (
          <div className="grid gap-4">
            {picks.map((p, i) => (
              <PickCard key={p.symbol} p={p} rank={i} />
            ))}
          </div>
        )}

        {data?.finishedAt && (
          <p className="text-center text-xs text-muted-foreground">
            آخر مسح: {new Date(data.finishedAt).toLocaleString("ar-EG")}
          </p>
        )}
      </main>
    </div>
  );
}