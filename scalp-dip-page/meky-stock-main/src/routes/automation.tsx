import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getAutomationSnapshot,
  type CronJob,
  type CronRun,
} from "@/lib/automation/automation.functions";

const snapshotQO = queryOptions({
  queryKey: ["automation-snapshot"],
  queryFn: () => getAutomationSnapshot(),
  refetchInterval: 30_000,
});

export const Route = createFileRoute("/automation")({
  loader: ({ context }) => context.queryClient.ensureQueryData(snapshotQO),
  component: AutomationPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-center text-bear" role="alert">
      حدث خطأ: {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-8 text-center">الصفحة غير موجودة</div>
  ),
});

const SCHEDULE_AR: Record<string, string> = {
  "* * * * *": "كل دقيقة",
  "*/5 * * * *": "كل 5 دقايق",
  "*/10 * * * *": "كل 10 دقايق",
  "*/30 * * * *": "كل نص ساعة",
  "0 * * * *": "كل ساعة",
};

function explainSchedule(s: string): string {
  if (SCHEDULE_AR[s]) return SCHEDULE_AR[s];
  return s;
}

function fmt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ar-EG", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusBadge(status: string) {
  const ok = status === "succeeded";
  return (
    <span
      className={
        "inline-block rounded px-2 py-0.5 text-xs font-medium " +
        (ok
          ? "bg-emerald-500/15 text-emerald-400"
          : "bg-red-500/15 text-red-400")
      }
    >
      {ok ? "نجح" : status}
    </span>
  );
}

function JobCard({ job, lastRun }: { job: CronJob; lastRun?: CronRun }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold text-foreground">{job.jobname}</div>
          <div className="mt-1 text-xs text-muted-foreground">
            ⏱ {explainSchedule(job.schedule)}
          </div>
        </div>
        <span
          className={
            "rounded px-2 py-0.5 text-xs " +
            (job.active
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-muted text-muted-foreground")
          }
        >
          {job.active ? "شغالة" : "متوقفة"}
        </span>
      </div>
      {lastRun ? (
        <div className="mt-3 flex items-center justify-between border-t border-border pt-2 text-xs">
          <span className="text-muted-foreground">آخر تشغيل: {fmt(lastRun.start_time)}</span>
          {statusBadge(lastRun.status)}
        </div>
      ) : (
        <div className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          لم يتم تشغيلها بعد
        </div>
      )}
    </div>
  );
}

function AutomationPage() {
  const { data } = useSuspenseQuery(snapshotQO);
  const lastByJob = new Map<number, CronRun>();
  for (const r of data.runs) {
    if (!lastByJob.has(r.jobid)) lastByJob.set(r.jobid, r);
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground" dir="rtl">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">🤖 الأتمتة — مراقبة المشروع</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              كل اللي بيشتغل تلقائي في الخلفية — جدولة، حالة، وآخر تشغيل.
            </p>
          </div>
          <Link to="/" className="text-sm text-primary hover:underline">
            ← الرئيسية
          </Link>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="إجمالي المهام" value={data.stats.total_jobs} />
          <Stat label="شغالة" value={data.stats.active_jobs} tone="ok" />
          <Stat label="تشغيلات آخر 24س" value={data.stats.runs_24h} />
          <Stat
            label="فشل آخر 24س"
            value={data.stats.failed_24h}
            tone={data.stats.failed_24h > 0 ? "bad" : "ok"}
          />
        </div>

        <h2 className="mb-3 text-lg font-semibold">المهام المجدولة</h2>
        <div className="mb-8 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {data.jobs.map((j) => (
            <JobCard key={j.jobid} job={j} lastRun={lastByJob.get(j.jobid)} />
          ))}
        </div>

        <h2 className="mb-3 text-lg font-semibold">آخر التشغيلات</h2>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-right">المهمة</th>
                <th className="px-3 py-2 text-right">الحالة</th>
                <th className="px-3 py-2 text-right">البداية</th>
                <th className="px-3 py-2 text-right">المدة</th>
              </tr>
            </thead>
            <tbody>
              {data.runs.slice(0, 50).map((r) => {
                const dur =
                  r.end_time
                    ? Math.max(
                        0,
                        new Date(r.end_time).getTime() -
                          new Date(r.start_time).getTime(),
                      )
                    : null;
                return (
                  <tr key={r.runid} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">{r.jobname ?? `#${r.jobid}`}</td>
                    <td className="px-3 py-2">{statusBadge(r.status)}</td>
                    <td className="px-3 py-2 text-muted-foreground">{fmt(r.start_time)}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {dur !== null ? `${dur} ms` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          الصفحة بتحدّث نفسها كل 30 ثانية تلقائي.
        </p>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "bad";
}) {
  const color =
    tone === "ok"
      ? "text-emerald-400"
      : tone === "bad"
        ? "text-red-400"
        : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={"mt-1 text-2xl font-bold " + color}>{value}</div>
    </div>
  );
}