
import { useEffect, useState } from "react";
import { getMarketStatus } from "@/lib/market-hours";

/**
 * Live Cairo clock + EGX market status. Updates every second on the client.
 * Server-rendered fallback shows a static placeholder to avoid hydration churn.
 */
export function MarketClock() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState(() => getMarketStatus());

  useEffect(() => {
    setMounted(true);
    setStatus(getMarketStatus());
    const id = setInterval(() => setStatus(getMarketStatus()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full border-b border-border bg-card/60 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5 text-xs">
          <span className="text-muted-foreground">EGX</span>
        </div>
      </div>
    );
  }

  const dot = status.isOpen ? "bg-bull" : "bg-muted-foreground";
  return (
    <div
      dir="rtl"
      className={`w-full border-b ${status.isOpen ? "border-bull/30 bg-bull/5" : "border-border bg-card/60"} backdrop-blur`}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dot}`}>
            {status.isOpen && (
              <span className="absolute inset-0 animate-ping rounded-full bg-bull/60" />
            )}
          </span>
          <span className={status.isOpen ? "font-semibold text-bull" : "text-muted-foreground"}>
            {status.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-muted-foreground">

          <span>{status.dateLabel}</span>
          <span className="font-mono tabular-nums text-foreground">{status.hhmmss}</span>
          <span className="hidden sm:inline">القاهرة</span>
        </div>
      </div>
    </div>
  );
}
