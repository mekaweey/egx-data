import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getLatestTabTelemetry } from "@/lib/telemetry/tab-telemetry.functions";

export const Route = createFileRoute("/thunder-tabs")({
  component: ThunderTabsPage,
  head: () => ({ meta: [{ title: "Thunder Tabs — تشخيص L2 حي" }] }),
});

function fmtAge(sec: number | null | undefined) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s}s`;
  const h = Math.floor(m / 60), mr = m % 60;
  return `${h}h${mr}m`;
}

function ThunderTabsPage() {
  const q = useQuery({
    queryKey: ["thunder-tabs-telemetry"],
    queryFn: () => getLatestTabTelemetry(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const tabs = q.data?.tabs || [];
  const now = Date.now();

  return (
    <div dir="rtl" className="max-w-5xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">📊 تشخيص تابات L2 (حي — كل 10 ثواني)</h1>
      <p className="text-sm text-muted-foreground">
        كل صف = تاب L2 مفتوحة في الاكستنشn. البيانات بتتبعت من الاكستنشن كل 60 ثانية. آخر 10 دقايق فقط.
      </p>
      {q.isLoading && <div>جاري التحميل…</div>}
      {q.error && <div className="text-red-500">فشل: {String((q.error as Error).message)}</div>}
      {!q.isLoading && tabs.length === 0 && (
        <div className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 p-4 rounded">
          مفيش تليمتري لسه. تأكد الاكستنشن v4.1.89+ شغّالة ومفعّل L2 Cycle.
        </div>
      )}
      {tabs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-muted">
              <tr>
                <th className="p-2 text-right">السهم</th>
                <th className="p-2 text-right">Uptime</th>
                <th className="p-2 text-right">Snapshots</th>
                <th className="p-2 text-right">آخر snapshot</th>
                <th className="p-2 text-right">L2 fresh</th>
                <th className="p-2 text-right">L2 age</th>
                <th className="p-2 text-right">Panel</th>
                <th className="p-2 text-right">آخر ensure</th>
                <th className="p-2 text-right">آخر report</th>
              </tr>
            </thead>
            <tbody>
              {tabs
                .slice()
                .sort((a, b) => String(a.symbol).localeCompare(String(b.symbol)))
                .map((t) => {
                  const snapAge = t.last_snapshot_age_sec;
                  const reportAge = Math.round((now - new Date(t.ts as string).getTime()) / 1000);
                  const color =
                    snapAge == null ? "bg-red-950/40" :
                    snapAge < 60 ? "bg-green-950/40" :
                    snapAge < 300 ? "bg-amber-950/40" : "bg-red-950/40";
                  return (
                    <tr key={`${t.client_id}::${t.symbol}`} className={`border-b ${color}`}>
                      <td className="p-2 font-mono font-bold">{t.symbol}</td>
                      <td className="p-2">{fmtAge(t.uptime_sec)}</td>
                      <td className="p-2">{t.snapshots_sent ?? 0}</td>
                      <td className="p-2">{fmtAge(t.last_snapshot_age_sec)}</td>
                      <td className="p-2">{t.last_l2_fresh === true ? "✓" : t.last_l2_fresh === false ? "✗" : "?"}</td>
                      <td className="p-2">{fmtAge(t.last_l2_age_sec)}</td>
                      <td className="p-2 text-xs">{t.panel_state ?? "?"}</td>
                      <td className="p-2">{fmtAge(t.last_ensure_age_sec)}</td>
                      <td className="p-2 text-xs text-muted-foreground">منذ {fmtAge(reportAge)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}