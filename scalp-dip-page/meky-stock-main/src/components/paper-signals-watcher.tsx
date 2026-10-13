import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listFreshPaperSignals } from "@/lib/paper/paper.functions";
import { beep, ensureAudioUnlock } from "@/lib/notify/beep";

const SEEN_KEY = "egx-paper-signals-seen-v1";
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

export function PaperSignalsWatcher() {
  const list = useServerFn(listFreshPaperSignals);
  const seenRef = useRef<Set<string>>(new Set());

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
        const signals = res?.signals ?? [];
        const fresh = signals.filter((s) => !seenRef.current.has(s.id));
        if (fresh.length > 0) {
          for (const s of fresh) {
            seenRef.current.add(s.id);
            const entry = Number(s.entry_price).toFixed(2);
            const tp = Number(s.tp_price).toFixed(2);
            const sl = Number(s.sl_price).toFixed(2);
            const desc = `دخول ${entry} • TP ${tp} • SL ${sl} • ${s.strategy}`;
            toast.success(`🔥 ترشيح شراء: ${s.symbol}`, {
              description: desc,
              duration: 15_000,
              action: { label: "افتح", onClick: () => { window.location.href = "/paper"; } },
            });
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try { new Notification(`🔥 ترشيح شراء: ${s.symbol}`, { body: desc, tag: s.id }); } catch {}
            }
          }
          beep(1040);
          saveSeen(seenRef.current);
        }
      } catch (e) {
        console.error("[paper-signals-watcher] tick error", e);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    timer = setTimeout(tick, 4_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [list]);

  return null;
}