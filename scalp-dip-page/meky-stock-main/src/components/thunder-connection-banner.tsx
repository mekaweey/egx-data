import { useEffect, useState } from "react";

/**
 * Floating warning banner shown on strategy pages.
 * Polls /api/public/hooks/thunder-health every 15s and alerts the
 * user the moment the Thunder live-tick feed goes silent (extension
 * closed, tab closed, network drop, etc).
 */

type Health = {
  ok: boolean;
  status: "ok" | "warn" | "critical" | "closed";
  message: string;
  marketOpen: boolean;
  thunder: { lastTickAgoSec: number | null; ticks5m: number; symbols5m: number; lastTickTs: string | null };
};

export function ThunderConnectionBanner() {
  const [health, setHealth] = useState<Health | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissedClosed, setDismissedClosed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/thunder-health", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as Health;
        if (!cancelled) {
          setHealth(data);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Network error reaching our own backend = also a problem worth flagging.
  if (error) {
    return (
      <div className="rounded-xl border border-bear/40 bg-bear/10 text-bear px-4 py-3 text-sm font-medium flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <span>تعذر الاتصال بالسيرفر للتحقق من حالة ثاندر ({error})</span>
      </div>
    );
  }

  if (!health) return null;

  if (health.status === "ok") {
    const ago = health.thunder.lastTickAgoSec;
    return (
      <div className="rounded-xl border border-bull/40 bg-bull/10 text-bull px-3 py-2 text-xs flex items-center gap-2">
        <span className="inline-block w-2 h-2 rounded-full bg-bull animate-pulse" />
        <span>متصل بثاندر · {health.thunder.symbols5m} سهم · آخر سعر منذ {ago ?? "?"} ثانية</span>
      </div>
    );
  }

  if (health.status === "closed") {
    if (dismissedClosed) return null;
    return (
      <div className="rounded-xl border border-muted bg-muted/30 text-muted-foreground px-3 py-2 text-xs flex items-center justify-between gap-2">
        <span>🌙 {health.message}</span>
        <button onClick={() => setDismissedClosed(true)} className="text-[10px] underline">إخفاء</button>
      </div>
    );
  }

  const styles =
    health.status === "critical"
      ? "border-bear/50 bg-bear/15 text-bear"
      : "border-warn/50 bg-warn/15 text-warn";

  return (
    <div className={`rounded-xl border ${styles} px-4 py-3 text-sm font-semibold flex items-start gap-3`}>
      <span className="text-xl">{health.status === "critical" ? "🛑" : "⚠️"}</span>
      <div className="flex-1">
        <div>{health.message}</div>
        <div className="text-xs font-normal opacity-80 mt-1">
          آخر tick من ثاندر:{" "}
          {health.thunder.lastTickAgoSec != null ? `${health.thunder.lastTickAgoSec}s` : "—"} ·{" "}
          {health.thunder.ticks5m} tick في آخر 5د · {health.thunder.symbols5m} سهم
        </div>
      </div>
    </div>
  );
}