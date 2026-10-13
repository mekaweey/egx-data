import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTierDashboard, type TierStateSummary } from "@/lib/dashboard/tier-dashboard.functions";

export const Route = createFileRoute("/tiers")({
  head: () => ({
    meta: [
      { title: "طبقات الذكاء — لوحة التحكم" },
      { name: "description", content: "عرض مساهمة كل طبقة ذكاء (Tier) في قرارات التوصية." },
    ],
  }),
  component: TiersPage,
});

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

function TierCard({ t }: { t: TierStateSummary }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-bold text-primary">
              {t.id}
            </span>
            <h3 className="text-base font-bold">{t.title}</h3>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
            t.hasData
              ? "bg-bull/15 text-bull"
              : "bg-muted text-muted-foreground"
          }`}
        >
          {t.hasData ? "نشط" : "خامل"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted/40 p-2">
          <div className="text-xs text-muted-foreground">المفاتيح</div>
          <div className="font-bold">{t.payloadKeys.length}</div>
        </div>
        <div className="rounded-md bg-muted/40 p-2">
          <div className="text-xs text-muted-foreground">الحجم</div>
          <div className="font-bold">{fmtBytes(t.payloadSizeBytes)}</div>
        </div>
        <div className="rounded-md bg-muted/40 p-2">
          <div className="text-xs text-muted-foreground">الميزات</div>
          <div className="font-bold">{t.features.length}</div>
        </div>
      </div>

      <details className="mt-3">
        <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
          عرض الميزات ({t.features.length})
        </summary>
        <div className="mt-2 flex flex-wrap gap-1">
          {t.features.map((f) => (
            <span
              key={f}
              className="rounded bg-accent px-2 py-0.5 font-mono text-[10px] text-accent-foreground"
            >
              {f}
            </span>
          ))}
        </div>
      </details>

      {t.updatedAt && (
        <div className="mt-3 text-[11px] text-muted-foreground">
          آخر تحديث: {new Date(t.updatedAt).toLocaleString("ar-EG")}
        </div>
      )}
    </div>
  );
}

function TiersPage() {
  const fetchDashboard = useServerFn(getTierDashboard);
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["tier-dashboard"],
    queryFn: () => fetchDashboard(),
    refetchInterval: 30_000,
  });

  const activeCount = data?.tiers.filter((t) => t.hasData).length ?? 0;
  const totalCount = data?.tiers.length ?? 0;
  const maxContrib = Math.max(
    1e-9,
    ...(data?.topModules.map((m) => m.avgAbsContribution) ?? [1e-9]),
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <header className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">طبقات الذكاء</h1>
            <p className="text-sm text-muted-foreground">
              {activeCount} / {totalCount} طبقة نشطة · {data?.recentDecisions ?? 0} قرار في الذاكرة
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            >
              {isFetching ? "..." : "تحديث"}
            </button>
            <Link
              to="/"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              الرئيسية
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-8 px-4 py-6">
        {isLoading && (
          <p className="text-center text-muted-foreground">جاري التحميل…</p>
        )}
        {error && (
          <p className="text-center text-bear">
            خطأ في التحميل: {(error as Error).message}
          </p>
        )}

        {data && (
          <>
            <section>
              <h2 className="mb-3 text-lg font-bold">أكثر الموديولات مساهمة</h2>
              {data.topModules.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground">
                  لا توجد قرارات في الذاكرة بعد. شغّل سكان لتعبئة السجل.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-right font-medium">الموديول</th>
                        <th className="px-3 py-2 text-right font-medium">عدد المرات</th>
                        <th className="px-3 py-2 text-right font-medium">متوسط الوزن</th>
                        <th className="px-3 py-2 text-right font-medium">متوسط الإشارة</th>
                        <th className="px-3 py-2 text-right font-medium">المساهمة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.topModules.map((m) => (
                        <tr key={m.name} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs">{m.name}</td>
                          <td className="px-3 py-2">{m.count}</td>
                          <td className="px-3 py-2">{m.avgWeight.toFixed(3)}</td>
                          <td className="px-3 py-2">{m.avgSignal.toFixed(3)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-32 overflow-hidden rounded bg-muted">
                                <div
                                  className="h-full bg-primary"
                                  style={{
                                    width: `${(m.avgAbsContribution / maxContrib) * 100}%`,
                                  }}
                                />
                              </div>
                              <span className="text-xs tabular-nums">
                                {m.avgAbsContribution.toFixed(3)}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">كتالوج الطبقات</h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {data.tiers.map((t) => (
                  <TierCard key={t.stateKey} t={t} />
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-lg font-bold">آخر القرارات</h2>
              {data.recentDecisionSamples.length === 0 ? (
                <p className="rounded-md border border-dashed border-border bg-card/30 p-6 text-center text-sm text-muted-foreground">
                  لا توجد قرارات حديثة.
                </p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-right font-medium">الوقت</th>
                        <th className="px-3 py-2 text-right font-medium">السهم</th>
                        <th className="px-3 py-2 text-right font-medium">القرار</th>
                        <th className="px-3 py-2 text-right font-medium">الثقة</th>
                        <th className="px-3 py-2 text-right font-medium">المبررات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recentDecisionSamples.map((d, i) => (
                        <tr key={`${d.at}-${i}`} className="border-t border-border">
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {new Date(d.at).toLocaleTimeString("ar-EG")}
                          </td>
                          <td className="px-3 py-2 font-bold">{d.symbol}</td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-bold ${
                                d.action === "buy"
                                  ? "bg-bull/20 text-bull"
                                  : d.action === "sell"
                                  ? "bg-bear/20 text-bear"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {d.action === "buy" ? "شراء" : d.action === "sell" ? "بيع" : "محايد"}
                            </span>
                          </td>
                          <td className="px-3 py-2 tabular-nums">
                            {d.adjustedConfidence.toFixed(1)}
                            <span className="text-xs text-muted-foreground">
                              {" "}
                              ({d.baseConfidence.toFixed(0)})
                            </span>
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {d.rationale}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}