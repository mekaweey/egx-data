import { useEffect, useState } from "react";

/**
 * LivePriceBadge — the "are live prices actually flowing?" pill (2026-09-27).
 *
 * The intraday prices come from ONE source: the browser extension writing
 * marketwatch_snapshots. This badge polls /api/public/hooks/live-price-status
 * every 30s and shows, honestly:
 *   🟢 live   → in session, fresh snapshots flowing (extension running)
 *   🔴 stale  → in session but NO fresh snapshots — the extension is off
 *   ⚪ closed → market closed — live absence is normal
 *
 * Designed to match the site's tokens (bull/warn/muted, rounded-2xl cards).
 */

type LiveStatus = {
  ok: boolean;
  status: "live" | "stale" | "closed";
  inSession: boolean;
  lastCaptureAt: string | null;
  ageMin: number | null;
  symbolsLast15m: number;
  checkedAt: string;
  error?: string;
};

function ageText(min: number | null): string {
  if (min == null) return "لا يوجد";
  if (min < 1) return "الآن";
  if (min < 60) return `منذ ${min} دقيقة`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `منذ ${h} ساعة و ${m} د` : `منذ ${h} ساعة`;
}

export function LivePriceBadge() {
  const [st, setSt] = useState<LiveStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/live-price-status", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as LiveStatus;
        if (!cancelled) setSt(data);
      } catch {
        if (!cancelled) setSt({ ok: false, status: "closed", inSession: false, lastCaptureAt: null, ageMin: null, symbolsLast15m: 0, checkedAt: "", error: "network" });
      }
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!st) return null;

  if (st.error) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-warn/40 bg-warn/10 text-warn px-3 py-1.5 text-xs font-bold">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-warn opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-warn"></span>
        </span>
        تعذر فحص التغذية اللحظية
      </div>
    );
  }

  if (st.status === "live") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-bull/40 bg-bull/10 text-bull px-3 py-1.5 text-xs font-bold">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-bull opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-bull"></span>
        </span>
        أسعار لحظية حية — {st.symbolsLast15m} سهم ({ageText(st.ageMin)})
      </div>
    );
  }

  if (st.status === "stale") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-bear/40 bg-bear/10 text-bear px-3 py-1.5 text-xs font-bold">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full rounded-full bg-bear opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-bear"></span>
        </span>
        لا أسعار لحظية — الإكستنشن غير شغال (آخر تغذية {ageText(st.ageMin)})
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 text-muted-foreground px-3 py-1.5 text-xs font-bold">
      <span className="relative flex h-2 w-2">
        <span className="relative inline-flex rounded-full h-2 w-2 bg-muted-foreground/60"></span>
      </span>
      السوق مقفول — آخر تغذية لحظية {ageText(st.ageMin)}
    </div>
  );
}
