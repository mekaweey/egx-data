import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/ext-diag")({
  component: ExtDiagPage,
  head: () => ({ meta: [{ title: "Extension Diagnostic — Throttling Probe" }] }),
});

type DiagRow = {
  id: string;
  ts: string;
  client_id: string | null;
  symbol: string | null;
  visibility_state: string | null;
  audio_paused: boolean | null;
  audio_muted: boolean | null;
  audio_ready_state: number | null;
  audio_current_time: number | null;
  depth_count_30s: number | null;
  last_depth_age_ms: number | null;
  extra: Record<string, unknown> | null;
};

function ExtDiagPage() {
  const q = useQuery({
    queryKey: ["ext-diag"],
    queryFn: async (): Promise<DiagRow[]> => {
      const { data, error } = await supabase
        .from("extension_diag")
        .select("*")
        .order("ts", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data ?? []) as DiagRow[];
    },
    refetchInterval: 5_000,
  });

  const rows = q.data ?? [];
  const latest = rows[0];
  const bgRows = rows.filter((r) => r.visibility_state === "hidden");
  const fgRows = rows.filter((r) => r.visibility_state === "visible");
  const avg = (arr: DiagRow[], key: keyof DiagRow) => {
    const nums = arr.map((r) => Number(r[key])).filter((n) => Number.isFinite(n));
    if (!nums.length) return null;
    return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
  };

  return (
    <div dir="rtl" className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">🔬 Extension Throttling Diagnostic</h1>
        <div className="text-xs text-muted-foreground">
          يحدّث كل 5 ثوان — الاكستنشن ترسل كل 30 ثانية
        </div>
      </div>

      <div className="rounded-lg border p-3 bg-card text-sm space-y-1">
        <div className="font-semibold">📋 كيف تختبر:</div>
        <ol className="list-decimal pr-6 space-y-0.5 text-xs">
          <li>ثبّت الاكستنشن v4.1.97 (فيها الـ diagnostic).</li>
          <li>افتح تاب واحد على أي سهم ثاندر (`/ar/assets/…`).</li>
          <li>سيبه في الخلفية 5-10 دقايق (روح لتاب تاني أو YouTube).</li>
          <li>ارجع لهنا وشوف الأرقام.</li>
        </ol>
      </div>

      {q.isLoading && <div>جاري التحميل…</div>}
      {q.error && <div className="text-red-500">{String((q.error as Error).message)}</div>}

      {latest && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard title="آخر تسجيل" value={new Date(latest.ts).toLocaleTimeString("ar-EG")} sub={latest.symbol || "—"} />
          <StatCard title="Visibility" value={latest.visibility_state ?? "—"} tone={latest.visibility_state === "visible" ? "good" : "warn"} />
          <StatCard
            title="Web Audio (v4.1.98)"
            value={(() => {
              const s = (latest.extra as Record<string, unknown> | null)?.ac_state as string | undefined;
              if (s === "running") return "✅ running";
              if (s === "suspended") return "⏸ suspended";
              if (s === "closed") return "❌ closed";
              return String(s ?? "—");
            })()}
            tone={((latest.extra as Record<string, unknown> | null)?.ac_state) === "running" ? "good" : "bad"}
            sub={`ac.currentTime=${Number((latest.extra as Record<string, unknown> | null)?.ac_current_time ?? 0).toFixed(2)}s | resume ${(latest.extra as Record<string, unknown> | null)?.ac_resume_ok ?? 0}/${(latest.extra as Record<string, unknown> | null)?.ac_resume_attempts ?? 0}`}
          />
          <StatCard
            title="Depth آخر 30ث"
            value={String(latest.depth_count_30s ?? 0)}
            tone={(latest.depth_count_30s ?? 0) >= 3 ? "good" : "warn"}
            sub={`آخر depth: ${latest.last_depth_age_ms != null ? Math.round(latest.last_depth_age_ms / 1000) + "s ago" : "—"}`}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SummaryCard label="🟢 Foreground (visible)" rows={fgRows} avg={avg} />
        <SummaryCard label="🔴 Background (hidden)" rows={bgRows} avg={avg} />
      </div>

      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="p-2 text-right">وقت</th>
              <th className="p-2 text-right">سهم</th>
              <th className="p-2 text-right">Visibility</th>
              <th className="p-2 text-right">AC state</th>
              <th className="p-2 text-right">AC time</th>
              <th className="p-2 text-right">Depth/30s</th>
              <th className="p-2 text-right">Last depth</th>
              <th className="p-2 text-right">hasFocus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const e = (r.extra ?? {}) as Record<string, unknown>;
              const acState = String(e.ac_state ?? "—");
              const acTime = Number(e.ac_current_time ?? 0);
              return (
                <tr key={r.id} className="border-t">
                  <td className="p-2 font-mono">{new Date(r.ts).toLocaleTimeString("ar-EG")}</td>
                  <td className="p-2 font-mono">{r.symbol ?? "—"}</td>
                  <td className={`p-2 ${r.visibility_state === "hidden" ? "text-amber-500" : "text-green-500"}`}>{r.visibility_state}</td>
                  <td className={`p-2 ${acState === "running" ? "text-green-500" : "text-red-500"}`}>{acState}</td>
                  <td className="p-2 font-mono">{acTime.toFixed(1)}s</td>
                  <td className={`p-2 font-bold ${(r.depth_count_30s ?? 0) === 0 ? "text-red-500" : "text-foreground"}`}>{r.depth_count_30s ?? 0}</td>
                  <td className="p-2">{r.last_depth_age_ms != null ? Math.round(r.last_depth_age_ms / 1000) + "s" : "—"}</td>
                  <td className="p-2">{String(e.has_focus ?? "—")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ title, value, sub, tone = "default" }: { title: string; value: string; sub?: string; tone?: "default" | "good" | "warn" | "bad" }) {
  const bg = tone === "good" ? "bg-green-950/30 border-green-800/50"
    : tone === "warn" ? "bg-amber-950/30 border-amber-800/50"
    : tone === "bad" ? "bg-red-950/30 border-red-800/50"
    : "bg-card border-border";
  return (
    <div className={`rounded-lg border p-3 ${bg}`}>
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className="text-lg font-bold mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground mt-1 break-all">{sub}</div>}
    </div>
  );
}

function SummaryCard({ label, rows, avg }: { label: string; rows: DiagRow[]; avg: (arr: DiagRow[], key: keyof DiagRow) => number | null }) {
  const audioOnCount = rows.filter((r) => r.audio_paused === false).length;
  const audioOnPct = rows.length ? Math.round((audioOnCount / rows.length) * 100) : 0;
  return (
    <div className="rounded-lg border p-3 bg-card space-y-1">
      <div className="font-semibold">{label} ({rows.length} تسجيل)</div>
      <div className="text-sm">متوسط depth/30s: <b>{avg(rows, "depth_count_30s") ?? "—"}</b></div>
      <div className="text-sm">Audio شغّال في: <b>{audioOnPct}%</b> من التسجيلات</div>
      <div className="text-sm">متوسط last_depth_age: <b>{avg(rows, "last_depth_age_ms") != null ? Math.round((avg(rows, "last_depth_age_ms") as number) / 1000) + "s" : "—"}</b></div>
    </div>
  );
}