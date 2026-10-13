import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listFreshPickNotifications } from "@/lib/notify/pick-notifications.functions";
import { alertBeep, ensureAudioUnlock } from "@/lib/notify/beep";

const SEEN_KEY = "egx-pick-notifs-seen-v1";
const POLL_MS = 30_000;

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}
function saveSeen(s: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s].slice(-200)));
  } catch {}
}

export function PickNotificationsWatcher() {
  const list = useServerFn(listFreshPickNotifications);
  const seenRef = useRef<Set<string>>(new Set());
  const firstRunRef = useRef(true);

  useEffect(() => {
    ensureAudioUnlock();
    seenRef.current = loadSeen();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        const res = await list().catch(() => null);
        const items = res?.items ?? [];
        const fresh = items.filter((it) => !seenRef.current.has(it.id));

        // On the very first run after mount, just mark everything seen so
        // we don't replay all of today's notifications.
        if (firstRunRef.current) {
          firstRunRef.current = false;
          for (const it of items) seenRef.current.add(it.id);
          saveSeen(seenRef.current);
        } else if (fresh.length > 0) {
          for (const it of fresh) {
            seenRef.current.add(it.id);
            const parts: string[] = [];
            if (it.entry_price != null) parts.push(`دخول ${it.entry_price.toFixed(2)}`);
            if (it.tp_price != null) parts.push(`هدف ${it.tp_price.toFixed(2)}`);
            if (it.sl_price != null) parts.push(`وقف ${it.sl_price.toFixed(2)}`);
            if (it.confidence != null) parts.push(`ثقة ${Math.round(it.confidence)}%`);
            const desc = parts.join(" • ") || it.kind;
            toast.success(`🎯 ترشيح جديد: ${it.symbol}`, {
              description: desc,
              duration: 20_000,
              action: { label: "افتح", onClick: () => { window.location.href = `/stock/${it.symbol}`; } },
            });
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try { new Notification(`🎯 ترشيح جديد: ${it.symbol}`, { body: desc, tag: it.id }); } catch {}
            }
          }
          alertBeep();
          saveSeen(seenRef.current);
        }
      } catch (e) {
        console.error("[pick-notifications-watcher] tick error", e);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    timer = setTimeout(tick, 2_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [list]);

  return null;
}