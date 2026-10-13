import { useEffect, useState } from "react";

/**
 * Scheduled automatic scans (pg_cron, weekdays Sun–Thu = day 0..4).
 * Times are UTC because pg_cron runs in UTC. Display uses Africa/Cairo TZ.
 */
type Schedule = { utcHour: number; utcMinute: number; label: string };

const SCHEDULES: Schedule[] = [
  { utcHour: 7, utcMinute: 0, label: "ما قبل الافتتاح" },
  { utcHour: 7, utcMinute: 30, label: "افتتاح السوق" },
  { utcHour: 10, utcMinute: 0, label: "منتصف الجلسة" },
  { utcHour: 11, utcMinute: 0, label: "مسح يومي" },
  { utcHour: 12, utcMinute: 30, label: "نهاية الجلسة" },
  { utcHour: 14, utcMinute: 30, label: "مسح ختامي شامل" },
];

function nextRun(now: Date): { at: Date; label: string } {
  // Look ahead up to 7 days to find next weekday slot (Sun–Thu).
  for (let dayOffset = 0; dayOffset < 8; dayOffset++) {
    const probe = new Date(now);
    probe.setUTCDate(probe.getUTCDate() + dayOffset);
    const dow = probe.getUTCDay(); // 0=Sun ... 6=Sat
    if (dow === 5 || dow === 6) continue; // skip Fri/Sat
    for (const s of SCHEDULES) {
      const candidate = new Date(probe);
      candidate.setUTCHours(s.utcHour, s.utcMinute, 0, 0);
      if (candidate.getTime() > now.getTime()) {
        return { at: candidate, label: s.label };
      }
    }
  }
  // fallback (shouldn't hit)
  const f = new Date(now);
  f.setUTCDate(f.getUTCDate() + 1);
  f.setUTCHours(7, 0, 0, 0);
  return { at: f, label: SCHEDULES[0].label };
}

function pad(n: number) {
  return n.toString().padStart(2, "0");
}

export function ScanCountdown() {
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs">
        <span className="flex h-2 w-2 rounded-full bg-primary" />
        <span className="font-bold text-primary">التحديث التلقائي القادم…</span>
      </div>
    );
  }

  const { at, label } = nextRun(now);
  const diffMs = Math.max(0, at.getTime() - now.getTime());
  const totalSec = Math.floor(diffMs / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const cairoTime = at.toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-xs">
      <span className="flex h-2 w-2 animate-pulse rounded-full bg-primary" />
      <div className="flex flex-col leading-tight">
        <span className="font-bold text-primary">
          التحديث التلقائي القادم: {label}
        </span>
        <span className="text-muted-foreground">
          الموعد: {cairoTime} (توقيت القاهرة)
        </span>
      </div>
      <span className="ml-auto rounded-md bg-background/60 px-3 py-1 font-mono text-base font-bold tabular-nums text-primary">
        {pad(hours)}:{pad(minutes)}:{pad(seconds)}
      </span>
    </div>
  );
}