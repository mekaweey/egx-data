import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getExtensionOverview } from "@/lib/telemetry/extension-overview.functions";

export const Route = createFileRoute("/extension-telemetry")({
  component: ExtensionTelemetryPage,
  head: () => ({ meta: [{ title: "Extension Telemetry — كل بيانات الاكستنشن حي" }] }),
});

function fmtAge(sec: number | null | undefined) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60), s = sec % 60;
  if (m < 60) return `${m}m${s}s`;
  const h = Math.floor(m / 60), mr = m % 60;
  return `${h}h${mr}m`;
}

function agoSec(iso: string | null | undefined) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((Date.now() - t) / 1000));
}

function ageColor(sec: number | null) {
  if (sec == null) return "text-muted-foreground";
  if (sec < 15) return "text-green-500";
  if (sec < 90) return "text-emerald-500";
  if (sec < 300) return "text-yellow-500";
  return "text-red-500";
}

type CardProps = {
  title: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "default" | "good" | "warn" | "bad";
};
function Card({ title, value, sub, tone = "default" }: CardProps) {
  const bg = tone === "good" ? "bg-green-950/30 border-green-800/50"
    : tone === "warn" ? "bg-amber-950/30 border-amber-800/50"
    : tone === "bad" ? "bg-red-950/30 border-red-800/50"
    : "bg-card border-border";
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
    </div>
  );
}

function ExtensionTelemetryPage() {
  const q = useQuery({
    queryKey: ["extension-overview"],
    queryFn: () => getExtensionOverview(),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const d = q.data;
  const lastTickAge = agoSec(d?.summary.lastTickTs);
  const lastSnapAge = agoSec(d?.summary.lastSnapTs);

  return (
    <div dir="rtl" className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">📡 Extension Telemetry — حي كل 10 ثواني</h1>
        <div className="text-sm text-muted-foreground">
          {d?.marketOpen ? "🟢 السوق مفتوح" : "🔴 السوق مغلق"} · تحديث: {q.dataUpdatedAt ? new Date(q.dataUpdatedAt).toLocaleTimeString("ar-EG") : "—"}
        </div>
      </div>

      {q.isLoading && <div className="text-muted-foreground">جاري التحميل…</div>}
      {q.error && <div className="text-red-500">فشل: {String((q.error as Error).message)}</div>}

      {d && (
        <>
          {/* Overview cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card
              title="تابات L2 مفتوحة"
              value={d.summary.tabsCount}
              sub="آخر 10 دقائق"
              tone={d.summary.tabsCount > 0 ? "good" : (d.marketOpen ? "bad" : "default")}
            />
            <Card
              title="أسهم إشارات (متوقع فتحها)"
              value={d.summary.signalsCount}
              sub={`${d.missingSignals.length} لسه لم تفتح`}
              tone={d.missingSignals.length === 0 ? "good" : d.marketOpen ? "warn" : "default"}
            />
            <Card
              title="Ticks آخر ساعة"
              value={d.summary.ticks1h.toLocaleString("en")}
              sub={`${d.summary.ticks5m} آخر 5 دقائق`}
              tone={d.summary.ticks5m > 0 ? "good" : (d.marketOpen ? "bad" : "default")}
            />
            <Card
              title="L2 Snapshots آخر ساعة"
              value={d.summary.snaps1h.toLocaleString("en")}
              sub={`${d.summary.snaps5m} آخر 5 دقائق`}
              tone={d.summary.snaps5m > 0 ? "good" : (d.marketOpen ? "warn" : "default")}
            />
          </div>

          {/* Last activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3 bg-card">
              <div className="text-xs text-muted-foreground">آخر tick سعر</div>
              <div className="mt-1">
                <span className="font-mono font-bold">{d.summary.lastTickSymbol ?? "—"}</span>
                <span className={`mr-2 ${ageColor(lastTickAge)}`}>منذ {fmtAge(lastTickAge)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{d.summary.lastTickTs ?? "—"}</div>
            </div>
            <div className="rounded-lg border p-3 bg-card">
              <div className="text-xs text-muted-foreground">آخر L2 snapshot</div>
              <div className="mt-1">
                <span className="font-mono font-bold">{d.summary.lastSnapSymbol ?? "—"}</span>
                <span className={`mr-2 ${ageColor(lastSnapAge)}`}>منذ {fmtAge(lastSnapAge)}</span>
              </div>
              <div className="text-xs text-muted-foreground">{d.summary.lastSnapTs ?? "—"}</div>
            </div>
          </div>

          {/* Signals row */}
          <div className="rounded-lg border p-3 bg-card">
            <div className="text-sm font-semibold mb-2">🎯 الأسهم المتوقع فتح L2 لها ({d.signals.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {d.signals.map((sym) => {
                const isOpen = d.tabs.some((t) => t.symbol === sym.toUpperCase());
                return (
                  <span
                    key={sym}
                    className={`px-2 py-0.5 rounded text-xs font-mono ${
                      isOpen ? "bg-green-900/50 text-green-200" : "bg-amber-900/50 text-amber-200"
                    }`}
                    title={isOpen ? "تاب مفتوح" : "لم يفتح بعد"}
                  >
                    {sym} {isOpen ? "✓" : "…"}
                  </span>
                );
              })}
              {d.signals.length === 0 && <span className="text-xs text-muted-foreground">مفيش إشارات دلوقتي</span>}
            </div>
          </div>

          {/* Tabs table */}
          <div>
            <div className="text-sm font-semibold mb-2">🗂️ تابات L2 (تفصيل)</div>
            {d.tabs.length === 0 ? (
              <div className="rounded border p-3 bg-amber-950/30 text-amber-200 text-sm">
                مفيش تابات مفتوحة دلوقتي. {d.marketOpen ? "لو السوق مفتوح والاكستنشن شغال، ده مؤشر مشكلة." : "طبيعي لأن السوق مغلق."}
              </div>
            ) : (
              <div className="overflow-x-auto rounded border">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs">
                    <tr>
                      <th className="p-2 text-right">السهم</th>
                      <th className="p-2 text-right">Uptime</th>
                      <th className="p-2 text-right">Snapshots</th>
                      <th className="p-2 text-right">آخر snapshot</th>
                      <th className="p-2 text-right">L2</th>
                      <th className="p-2 text-right">Panel</th>
                      <th className="p-2 text-right">Trigger</th>
                      <th className="p-2 text-right">آخر ensure</th>
                      <th className="p-2 text-right">آخر report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.tabs
                      .slice()
                      .sort((a, b) => String(a.symbol).localeCompare(String(b.symbol)))
                      .map((t) => {
                        const snapAge = t.last_snapshot_age_sec;
                        const reportAge = agoSec(t.ts);
                        const rowBg =
                          snapAge == null ? "bg-red-950/20" :
                          snapAge < 60 ? "" :
                          snapAge < 300 ? "bg-amber-950/20" : "bg-red-950/20";
                        return (
                          <tr key={`${t.client_id}::${t.symbol}`} className={`border-t ${rowBg}`}>
                            <td className="p-2 font-mono font-bold">{t.symbol}</td>
                            <td className="p-2">{fmtAge(t.uptime_sec)}</td>
                            <td className="p-2">{t.snapshots_sent}</td>
                            <td className={`p-2 ${ageColor(snapAge)}`}>{fmtAge(snapAge)}</td>
                            <td className="p-2">
                              {t.last_l2_fresh === true ? "✓" : t.last_l2_fresh === false ? "✗" : "?"}
                              <span className="text-xs text-muted-foreground mr-1">{fmtAge(t.last_l2_age_sec)}</span>
                            </td>
                            <td className="p-2 text-xs">{t.panel_state ?? "?"}</td>
                            <td className="p-2 text-xs">{t.has_trigger === true ? "✓" : t.has_trigger === false ? "✗" : "?"}</td>
                            <td className="p-2">{fmtAge(t.last_ensure_age_sec)}</td>
                            <td className="p-2 text-xs text-muted-foreground">{fmtAge(reportAge)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ticks per symbol */}
          <div>
            <div className="text-sm font-semibold mb-2">💹 Ticks آخر 5 دقائق ({d.ticksPerSymbol.length} سهم)</div>
            {d.ticksPerSymbol.length === 0 ? (
              <div className="text-xs text-muted-foreground">مفيش ticks</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {d.ticksPerSymbol.slice(0, 30).map((t) => (
                  <div key={t.symbol} className="rounded border bg-card p-2 text-xs">
                    <div className="font-mono font-bold">{t.symbol}</div>
                    <div className="text-muted-foreground">{t.count} tick · {t.lastPrice}</div>
                    <div className={`text-[10px] ${ageColor(agoSec(t.lastTs))}`}>منذ {fmtAge(agoSec(t.lastTs))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Snapshots per symbol */}
          <div>
            <div className="text-sm font-semibold mb-2">📖 L2 Snapshots آخر 5 دقائق ({d.snapsPerSymbol.length} سهم)</div>
            {d.snapsPerSymbol.length === 0 ? (
              <div className="text-xs text-muted-foreground">مفيش snapshots</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1.5">
                {d.snapsPerSymbol.slice(0, 30).map((s) => (
                  <div key={s.symbol} className="rounded border bg-card p-2 text-xs">
                    <div className="font-mono font-bold">{s.symbol}</div>
                    <div className="text-muted-foreground">{s.count} snap</div>
                    <div className="text-[10px]">bid {s.bid ?? "—"} · ask {s.ask ?? "—"}</div>
                    <div className={`text-[10px] ${ageColor(agoSec(s.lastTs))}`}>منذ {fmtAge(agoSec(s.lastTs))}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}