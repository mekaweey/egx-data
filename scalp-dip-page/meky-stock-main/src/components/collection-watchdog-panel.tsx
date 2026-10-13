import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { alertBeep } from "@/lib/notify/beep";

type Level = "green" | "yellow" | "red" | "idle";
type Check = {
  key: string;
  label: string;
  status: Level;
  lastAgoSec: number | null;
  countRecent: number;
  message: string;
  expected: string;
};
type Data = {
  ok: boolean;
  now: string;
  marketOpen: boolean;
  marketLabel: string;
  overall: Level;
  checks: Check[];
};

const COLOR: Record<Level, { bar: string; dot: string; text: string; chip: string }> = {
  green: { bar: "border-bull/50 bg-bull/10", dot: "bg-bull", text: "text-bull", chip: "bg-bull/20 text-bull" },
  yellow: { bar: "border-warn/50 bg-warn/10", dot: "bg-warn", text: "text-warn", chip: "bg-warn/20 text-warn" },
  red: { bar: "border-bear/60 bg-bear/15", dot: "bg-bear", text: "text-bear", chip: "bg-bear/20 text-bear" },
  idle: { bar: "border-muted bg-muted/30", dot: "bg-muted-foreground", text: "text-muted-foreground", chip: "bg-muted text-muted-foreground" },
};

const LABEL: Record<Level, string> = {
  green: "كل شيء يعمل ✓",
  yellow: "بطء في مصدر واحد",
  red: "⚠️ تنبيه فوري — مصدر متوقف",
  idle: "السوق مغلق",
};

function fmtAgo(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}د`;
  return `${Math.floor(sec / 3600)}س`;
}

export function CollectionWatchdogPanel() {
  const [data, setData] = useState<Data | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastAlertRef = useRef<{ level: Level; ts: number }>({ level: "green", ts: 0 });

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/public/hooks/collection-watchdog", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = (await r.json()) as Data;
        if (cancelled) return;
        setData(d); setErr(null);

        // Alert on transitions into red, and re-alert every 2min if still red
        const nowMs = Date.now();
        if (d.overall === "red") {
          const wasRed = lastAlertRef.current.level === "red";
          const enoughGap = nowMs - lastAlertRef.current.ts > 120_000;
          if (!wasRed || enoughGap) {
            const failing = d.checks.filter(c => c.status === "red").map(c => c.label).join("، ");
            alertBeep();
            toast.error("⚠️ تنبيه: مصدر بيانات متوقف", {
              description: failing,
              duration: 30_000,
            });
            lastAlertRef.current = { level: "red", ts: nowMs };
          }
        } else if (d.overall === "yellow" && lastAlertRef.current.level !== "yellow" && lastAlertRef.current.level !== "red") {
          lastAlertRef.current = { level: "yellow", ts: nowMs };
        } else if (d.overall === "green") {
          if (lastAlertRef.current.level === "red" || lastAlertRef.current.level === "yellow") {
            toast.success("✅ رجع كل شيء طبيعي");
          }
          lastAlertRef.current = { level: "green", ts: nowMs };
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    };
    tick();
    const id = setInterval(tick, 10_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (err && !data) {
    return (
      <div className="sticky top-2 z-30 rounded-xl border border-bear/50 bg-bear/10 text-bear px-3 py-2 text-xs">
        تعذر قراءة الحالة ({err})
      </div>
    );
  }
  if (!data) {
    return (
      <div className="sticky top-2 z-30 rounded-xl border border-muted bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        جارٍ فحص حالة التجميع…
      </div>
    );
  }

  const c = COLOR[data.overall];
  const pulse = data.overall === "red" ? "animate-pulse" : data.overall === "green" ? "animate-pulse" : "";

  return (
    <div className={`sticky top-2 z-30 rounded-xl border ${c.bar} px-3 py-2 shadow-sm`}>
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2 text-right"
      >
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${c.dot} ${pulse}`} />
        <span className={`font-bold text-sm ${c.text}`}>{LABEL[data.overall]}</span>
        <span className="text-xs text-muted-foreground mr-auto">
          {data.marketOpen ? "🟢 السوق مفتوح" : "⚪ السوق مغلق"} · تحديث كل 10ث
        </span>
        <a href="/health-check" onClick={e => e.stopPropagation()}
           className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary hover:bg-primary/30">
          فحص شامل
        </a>
        <span className="text-xs text-muted-foreground">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {data.checks.map(check => {
            const cc = COLOR[check.status];
            return (
              <div key={check.key} className={`rounded-lg border ${cc.bar} p-2 text-xs`}>
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <span className={`inline-block w-2 h-2 rounded-full ${cc.dot}`} />
                  <span>{check.label}</span>
                  <span className={`mr-auto text-[10px] px-1.5 py-0.5 rounded ${cc.chip}`}>
                    {check.status === "green" ? "OK"
                      : check.status === "yellow" ? "بطء"
                      : check.status === "red" ? "متوقف"
                      : "خامد"}
                  </span>
                </div>
                <div className="text-muted-foreground">{check.message}</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  آخر: {fmtAgo(check.lastAgoSec)} · متوقع: {check.expected}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}