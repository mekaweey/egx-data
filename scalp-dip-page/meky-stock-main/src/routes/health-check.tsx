import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/health-check")({
  component: HealthCheckPage,
  head: () => ({ meta: [{ title: "فحص التجميع الشامل" }, { name: "description", content: "فحص كل مصادر البيانات و cron jobs في وقت واحد" }] }),
});

type Level = "green" | "yellow" | "red" | "idle";
type Check = { key: string; label: string; category: string; status: Level; evidence: string; expected: string; detail: string };
type Data = { ok: boolean; now: string; marketOpen: boolean; marketLabel: string; overall: Level; checks: Check[] };

const COLOR: Record<Level, string> = {
  green: "border-bull/50 bg-bull/10 text-bull",
  yellow: "border-warn/50 bg-warn/10 text-warn",
  red: "border-bear/60 bg-bear/15 text-bear",
  idle: "border-muted bg-muted/30 text-muted-foreground",
};
const BADGE: Record<Level, string> = { green: "✓ يعمل", yellow: "⚠ بطء", red: "✗ متوقف", idle: "— خامد" };

function HealthCheckPage() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/public/hooks/self-test", { cache: "no-store" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setData(await r.json()); setErr(null);
    } catch (e) { setErr((e as Error).message); }
    finally { setLoading(false); }
  };

  useEffect(() => { run(); const id = setInterval(run, 30_000); return () => clearInterval(id); }, []);

  const grouped = data ? { data: data.checks.filter(c => c.category === "data"), cron: data.checks.filter(c => c.category === "cron"), output: data.checks.filter(c => c.category === "output") } : null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🔍 فحص التجميع الشامل</h1>
            <p className="text-sm text-muted-foreground">كل مصادر البيانات + كل cron jobs — تلقائياً كل 30ث</p>
          </div>
          <button onClick={run} disabled={loading} className="rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
            {loading ? "جارٍ الفحص…" : "🔄 فحص الآن"}
          </button>
        </div>

        {err && <div className="rounded-lg border border-bear/50 bg-bear/10 text-bear p-3 text-sm">{err}</div>}

        {data && (
          <>
            <div className={`rounded-xl border ${COLOR[data.overall]} p-4`}>
              <div className="flex items-center gap-3">
                <span className="text-3xl">
                  {data.overall === "green" ? "✅" : data.overall === "yellow" ? "⚠️" : data.overall === "red" ? "🚨" : "⚪"}
                </span>
                <div>
                  <div className="font-bold text-lg">
                    {data.overall === "green" ? "كل شيء يعمل بشكل صحيح" : data.overall === "yellow" ? "بطء في بعض المصادر" : data.overall === "red" ? "مصدر أو أكثر متوقف" : "السوق مغلق — لا نتوقع نشاط"}
                  </div>
                  <div className="text-xs opacity-80">
                    {data.marketOpen ? "🟢 السوق مفتوح" : "⚪ السوق مغلق"} · آخر فحص: {new Date(data.now).toLocaleTimeString("ar-EG")}
                  </div>
                </div>
              </div>
            </div>

            {grouped && (["data", "cron", "output"] as const).map(cat => (
              <section key={cat}>
                <h2 className="text-sm font-bold text-muted-foreground mb-2">
                  {cat === "data" ? "📥 مصادر البيانات (الإكستنشن)" : cat === "cron" ? "⚙️ المهام المجدولة (Cron)" : "📊 المخرجات و الجودة"}
                </h2>
                <div className="grid gap-2 sm:grid-cols-2">
                  {grouped[cat].map(c => (
                    <div key={c.key} className={`rounded-lg border ${COLOR[c.status]} p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">{c.label}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-background/50">{BADGE[c.status]}</span>
                      </div>
                      <div className="text-xs mb-1">{c.evidence}</div>
                      <div className="text-[10px] opacity-70">متوقع: {c.expected}</div>
                      <div className="text-[10px] opacity-50 mt-1">{c.detail}</div>
                    </div>
                  ))}
                </div>
              </section>
            ))}

            <div className="rounded-lg border border-muted bg-muted/20 p-3 text-xs text-muted-foreground">
              💡 هذا الفحص يشتغل تلقائياً 2 مرة يومياً (10:15 صباحاً و 2:45 عصراً القاهرة). لو أي مصدر أحمر يوصلك تنبيه تليجرام فوراً.
            </div>
          </>
        )}
      </div>
    </div>
  );
}