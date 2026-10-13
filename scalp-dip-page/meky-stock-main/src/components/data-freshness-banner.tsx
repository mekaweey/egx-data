import { useEffect, useState } from "react";

/**
 * DataFreshnessBanner — the weekly operations page's "is my data alive" strip.
 * Checks the freshness of `daily_candles` (max(date) via
 * /api/public/hooks/data-freshness) — the table the weekly engine actually
 * trades on. Replaces the old extension-recency warning on this page: the
 * marketwatch/live-tick tables are extension-fed and empty by design here, so
 * that check was a permanent false alarm.
 *
 * Health rule (measured convention): last session <= 4 calendar days old =
 * healthy (Fri/Sat weekend is normal). Older than that → the EOD sync did not
 * run: run the 14:45 archive task or hit momentum-weekly-run?phase=candles.
 */

type Fresh = {
  ok: boolean;
  maxDate: string | null;
  ageDays: number | null;
  healthy: boolean;
  symbolsOnMaxDate: number | null;
  error?: string;
};

export function DataFreshnessBanner() {
  const [fresh, setFresh] = useState<Fresh | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/data-freshness", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Fresh;
        if (!cancelled) {
          setFresh(data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (err) {
    return (
      <div className="rounded-xl border border-warn/40 bg-warn/10 text-warn px-3 py-2 text-xs flex items-center gap-2">
        <span>⚠️</span>
        <span>تعذر فحص نضارة بيانات الشموع ({err}) — البيانات المعروضة قد تكون قديمة.</span>
      </div>
    );
  }
  if (!fresh) return null;

  if (fresh.healthy) {
    return (
      <div className="rounded-xl border border-bull/40 bg-bull/10 text-bull px-3 py-2 text-xs flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-bull animate-pulse" />
        <span>
          بيانات الشموع اليومية سليمة · آخر جلسة مسجلة{" "}
          <b className="font-mono">{fresh.maxDate}</b> (منذ {fresh.ageDays} يوم)
          {fresh.symbolsOnMaxDate != null && <> · {fresh.symbolsOnMaxDate} سهم</>}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-warn/50 bg-warn/15 text-warn px-3 py-2 text-xs flex items-center gap-2">
      <span className="text-base">🛑</span>
      <span>
        <b>بيانات الشموع قديمة</b> — آخر جلسة في daily_candles:{" "}
        <b className="font-mono">{fresh.maxDate ?? "لا يوجد"}</b>
        {fresh.ageDays != null && <> (منذ {fresh.ageDays} يوم)</>}. مسح الترشيح لن يكون صادقاً حتى
        التحديث — شغّل مهمة الـ14:45 أو /api/public/hooks/momentum-weekly-run?phase=candles
      </span>
    </div>
  );
}
