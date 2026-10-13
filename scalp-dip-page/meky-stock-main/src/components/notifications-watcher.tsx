import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { evaluatePositions, listPositions } from "@/lib/positions/positions.functions";
import { beep, ensureAudioUnlock } from "@/lib/notify/beep";

const SEEN_KEY = "egx-alerts-seen-v1";
const POLL_OPEN_MS = 30_000;
const POLL_CLOSED_MS = 120_000;

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

function isMarketOpen(): boolean {
  // Egypt: Sun–Thu 10:00–14:30 Cairo time (UTC+2/+3 — approximate via UTC+2 fixed for poll cadence)
  const now = new Date();
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  if (day === 5 || day === 6) return false; // Fri/Sat closed
  const mins = utcH * 60 + utcM;
  // 10:00 Cairo (UTC+2) = 08:00 UTC ; 14:30 Cairo = 12:30 UTC
  return mins >= 8 * 60 && mins <= 12 * 60 + 30;
}

export function NotificationsWatcher() {
  const evaluate = useServerFn(evaluatePositions);
  const list = useServerFn(listPositions);
  const seenRef = useRef<Set<string>>(new Set());
  const requestedPermRef = useRef(false);

  useEffect(() => {
    ensureAudioUnlock();
    seenRef.current = loadSeen();

    // Ask for browser notification permission once
    if (typeof Notification !== "undefined" && Notification.permission === "default" && !requestedPermRef.current) {
      requestedPermRef.current = true;
      Notification.requestPermission().catch(() => {});
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const tick = async () => {
      if (cancelled) return;
      try {
        // Only run the (expensive) evaluation during market hours; outside, just poll unack alerts.
        if (isMarketOpen()) {
          await evaluate({ data: undefined as never }).catch(() => null);
        }
        const res = await list().catch(() => null);
        const alerts = res?.alerts ?? [];
        const fresh = alerts.filter((a) => !seenRef.current.has(a.id));
        if (fresh.length > 0) {
          for (const a of fresh) {
            seenRef.current.add(a.id);
            const title = a.name_ar ?? a.symbol;
            toast.warning(`🔔 ${title}`, {
              description: a.message_ar,
              duration: 10_000,
              action: { label: "افتح", onClick: () => { window.location.href = "/positions"; } },
            });
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try {
                new Notification(`🔔 ${title}`, { body: a.message_ar, tag: a.id });
              } catch {}
            }
          }
          beep();
          saveSeen(seenRef.current);
        }
      } catch (e) {
        console.error("[notifications-watcher] tick error", e);
      } finally {
        if (!cancelled) {
          const delay = isMarketOpen() ? POLL_OPEN_MS : POLL_CLOSED_MS;
          timer = setTimeout(tick, delay);
        }
      }
    };

    // Kick off after a short delay so we don't block initial paint
    timer = setTimeout(tick, 3_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [evaluate, list]);

  return null;
}