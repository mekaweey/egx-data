import { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { beep, alertBeep, ensureAudioUnlock } from "@/lib/notify/beep";
import { toast } from "sonner";
import { fmtPrice } from "@/lib/format/price";

type Trade = {
  id: string;
  symbol: string;
  strategy: string;
  entry_price: number;
  tp_price: number;
  sl_price: number;
  pnl: number | null;
  status: string;
  exit_reason: string | null;
};

/**
 * Global watcher: fires sound + toast + browser notification for any new
 * scalp / scalp-fresh trade or exit, from any page in the app.
 *
 * To avoid double-alerts, this watcher pauses itself when the user is
 * already on /scalp or /scalp-fresh (those pages have their own watcher).
 */
export function GlobalScalpWatcher() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const paused = pathname === "/scalp" || pathname === "/scalp-fresh" || pathname === "/scalp-dip";
  const seenIds = useRef<Set<string>>(new Set());
  const seenExits = useRef<Set<string>>(new Set());

  // ask for notification permission once
  useEffect(() => {
    // Arm audio unlock at app start — any click/tap/keypress anywhere in
    // the app will then unlock the AudioContext automatically. The user
    // never needs to press a dedicated "enable sound" button.
    ensureAudioUnlock();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (paused) return;
    const channel = supabase
      .channel("global-scalp-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_trades" },
        (payload) => {
          const t = payload.new as Trade;
          if (t.strategy !== "scalp-mr15" && t.strategy !== "scalp-mr15-fresh" && t.strategy !== "scalp-dip") return;
          if (seenIds.current.has(t.id)) return;
          seenIds.current.add(t.id);
          ensureAudioUnlock();
          alertBeep();
          const tag = t.strategy === "scalp-mr15-fresh" ? "🔥 [FRESH]"
            : t.strategy === "scalp-dip" ? "📉 [DIP]"
            : "🔥";
          const entry = fmtPrice(t.entry_price);
          const tp = fmtPrice(t.tp_price);
          const sl = fmtPrice(t.sl_price);
          const body = `دخول ${entry} • TP ${tp} • SL ${sl}`;
          toast.success(`${tag} إشارة Scalp: ${t.symbol}`, { description: body, duration: 30_000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`${tag} ${t.symbol}`, { body, tag: t.id, requireInteraction: true }); } catch {}
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "paper_trades" },
        (payload) => {
          const t = payload.new as Trade;
          const old = payload.old as Partial<Trade>;
          if (t.strategy !== "scalp-mr15" && t.strategy !== "scalp-mr15-fresh" && t.strategy !== "scalp-dip") return;
          if (t.status !== "closed" || old.status === "closed") return;
          if (seenExits.current.has(t.id)) return;
          seenExits.current.add(t.id);
          const pnl = Number(t.pnl ?? 0);
          beep(pnl > 0 ? 1320 : 520);
          const tag = t.strategy === "scalp-mr15-fresh" ? "[FRESH]"
            : t.strategy === "scalp-dip" ? "[DIP]"
            : "";
          toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج ${tag}: ${t.symbol}`, {
            description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
            duration: 20_000,
          });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`${pnl >= 0 ? "🎯" : "🛑"} ${tag} ${t.symbol}`, { body: `${t.exit_reason ?? ""} • ${pnl.toFixed(0)} EGP`, tag: `${t.id}-exit` }); } catch {}
          }
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [paused]);

  return null;
}