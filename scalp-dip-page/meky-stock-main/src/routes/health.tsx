import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getModuleHealth, resetModuleHealth, runOutcomeLoop } from "@/lib/integration/health.functions";

export const Route = createFileRoute("/health")({
  component: HealthPage,
  head: () => ({
    meta: [
      { title: "صحة الموديولات" },
      { name: "description", content: "حالة كل موديول تحليلي في الوقت الفعلي" },
    ],
  }),
});

const STATUS_STYLES: Record<string, string> = {
  ok: "bg-bull/20 text-bull",
  error: "bg-bear/20 text-bear",
  skipped: "bg-muted text-muted-foreground",
  unknown: "bg-muted text-muted-foreground",
};

function ago(ts: number) {
  if (!ts) return "—";
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  if (s < 86400) return `${Math.floor(s / 3600)}س`;
  return `${Math.floor(s / 86400)}ي`;
}

function HealthPage() {
  const fetchHealth = useServerFn(getModuleHealth);
  const resetFn = useServerFn(resetModuleHealth);
  const ingestFn = useServerFn(runOutcomeLoop);

  const q = useQuery({
    queryKey: ["module-health"],
    queryFn: () => fetchHealth(),
    refetchInterval: 5000,
  });

  const reset = useMutation({
    mutationFn: (name?: string) => resetFn({ data: { name } }),
    onSuccess: () => q.refetch(),
  });
  const ingest = useMutation({
    mutationFn: () => ingestFn(),
    onSuccess: () => q.refetch(),
  });

  const data = q.data;

  return (
    <div className="min-h-screen bg-background text-foreground" dir="rtl">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">صحة الموديولات</h1>
            <p className="text-sm text-muted-foreground">
              تحديث تلقائي كل ٥ ثوانٍ — لو في موديول مش شغال هتلاقيه هنا بالخطأ بتاعه
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              to="/"
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
            >
              الرئيسية
            </Link>
            <button
              onClick={() => ingest.mutate()}
              disabled={ingest.isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
            >
              تشغيل حلقة التعلّم
            </button>
            <button
              onClick={() => reset.mutate(undefined)}
              disabled={reset.isPending}
              className="rounded-lg bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              إعادة تفعيل الكل
            </button>
          </div>
        </div>

        {!data && <p className="text-muted-foreground">جارٍ التحميل…</p>}

        {data && (
          <>
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Stat label="إجمالي" value={data.total} />
              <Stat label="شغّال" value={data.ok} cls="text-bull" />
              <Stat label="أخطاء" value={data.error} cls="text-bear" />
              <Stat label="تم تخطّيه" value={data.skipped} />
              <Stat label="معطّل تلقائياً" value={data.disabled} cls="text-bear" />
            </div>

            <div className="mb-6 rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">معايرة الثقة (Platt)</div>
              <div className="mt-1 text-sm">
                عيّنات: <span className="font-mono">{data.calibration.n}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                a: <span className="font-mono">{data.calibration.a.toFixed(4)}</span>
                <span className="mx-2 text-muted-foreground">|</span>
                b: <span className="font-mono">{data.calibration.b.toFixed(4)}</span>
              </div>
            </div>

            {data.modules.length === 0 ? (
              <div className="rounded-xl border border-border bg-card p-6 text-center text-muted-foreground">
                لسه مفيش سكان اتعمل — افتح <Link to="/" className="text-primary underline">الرئيسية</Link> وشغّل سكان عشان الموديولات تبدأ تتسجّل.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-right">الموديول</th>
                      <th className="px-3 py-2 text-right">الحالة</th>
                      <th className="px-3 py-2 text-right">نجاح / خطأ / تخطّي</th>
                      <th className="px-3 py-2 text-right">آخر تشغيل</th>
                      <th className="px-3 py-2 text-right">المدة</th>
                      <th className="px-3 py-2 text-right">آخر خطأ</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.modules.map((m) => (
                      <tr key={m.name} className="border-t border-border">
                        <td className="px-3 py-2 font-mono text-xs">{m.name}</td>
                        <td className="px-3 py-2">
                          <span className={`rounded px-2 py-0.5 text-xs ${STATUS_STYLES[m.status] ?? ""}`}>
                            {m.disabled ? "معطّل" : m.status}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs">
                          <span className="text-bull">{m.successCount}</span> /{" "}
                          <span className="text-bear">{m.errorCount}</span> /{" "}
                          <span className="text-muted-foreground">{m.skipCount}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{ago(m.lastRunAt)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{m.lastDurationMs}ms</td>
                        <td className="px-3 py-2 text-xs text-bear" title={m.lastError ?? ""}>
                          {m.lastError ? m.lastError.slice(0, 80) : "—"}
                        </td>
                        <td className="px-3 py-2 text-left">
                          {(m.disabled || m.errorCount > 0) && (
                            <button
                              onClick={() => reset.mutate(m.name)}
                              className="text-xs text-primary hover:underline"
                            >
                              إعادة
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, cls = "" }: { label: string; value: number; cls?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${cls}`}>{value}</div>
    </div>
  );
}