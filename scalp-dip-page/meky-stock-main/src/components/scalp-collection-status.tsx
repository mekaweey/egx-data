import { useEffect, useState } from "react";

/**
 * Small status banner shown on the Scalp page — verifies the Thunder
 * extension is actively writing:
 *   1) live_ticks     → أسعار لحظية
 *   2) scalp_timeline → توقيت مراحل كل إشارة
 *   3) orderbook (L2) → قائمة المستوى الثاني عند كل إشارة
 *
 * Polls /api/public/hooks/collection-status every 20s. Purely presentational;
 * does NOT interfere with ThunderConnectionBanner (different endpoint, different data).
 */

type Status = {
  ok: boolean;
  ticks: { lastAgoSec: number | null; count5m: number; lastSymbol: string | null };
  timeline: { lastAgoSec: number | null; countToday: number; lastEvent: string | null };
  l2: { lastAgoSec: number | null; countToday: number; lastSymbol: string | null };
};

function fmtAgo(sec: number | null) {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}د`;
  return `${Math.floor(sec / 3600)}س`;
}

export function ScalpCollectionStatus() {
  const [s, setS] = useState<Status | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/public/hooks/collection-status", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = (await r.json()) as Status;
        if (!cancelled) { setS(d); setErr(null); }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message);
      }
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (err) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn/10 text-warn px-3 py-2 text-xs">
        تعذر قراءة حالة التجميع ({err})
      </div>
    );
  }
  if (!s) return null;

  const ticksOk = (s.ticks.lastAgoSec ?? 9999) < 180;
  const anyIssue = !ticksOk;
  const border = anyIssue ? "border-warn/40 bg-warn/10" : "border-bull/40 bg-bull/10";
  const dot = anyIssue ? "bg-warn" : "bg-bull";

  return (
    <div className={`rounded-xl border ${border} px-3 py-2 text-xs`}>
      <div className="flex items-center gap-2 font-semibold mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${dot} ${!anyIssue ? "animate-pulse" : ""}`} />
        <span>حالة التجميع من الإكستنشن</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 opacity-90">
        <div>
          💹 أسعار: <b>{s.ticks.count5m}</b> tick / 5د
          <span className="mx-1">·</span>
          آخر: {fmtAgo(s.ticks.lastAgoSec)}
          {s.ticks.lastSymbol ? <> ({s.ticks.lastSymbol})</> : null}
        </div>
        <div>
          📍 Timeline اليوم: <b>{s.timeline.countToday}</b>
          <span className="mx-1">·</span>
          آخر: {fmtAgo(s.timeline.lastAgoSec)}
          {s.timeline.lastEvent ? <> ({s.timeline.lastEvent})</> : null}
        </div>
        <div>
          📚 L2 اليوم: <b>{s.l2.countToday}</b>
          <span className="mx-1">·</span>
          آخر: {fmtAgo(s.l2.lastAgoSec)}
          {s.l2.lastSymbol ? <> ({s.l2.lastSymbol})</> : null}
        </div>
      </div>
    </div>
  );
}
