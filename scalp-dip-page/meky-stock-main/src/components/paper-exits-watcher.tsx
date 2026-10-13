import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { listFreshPaperExits } from "@/lib/paper/paper.functions";
import { beep, ensureAudioUnlock } from "@/lib/notify/beep";

const SEEN_KEY = "egx-paper-exits-seen-v1";
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

const REASON_AR: Record<string, string> = {
  TP: "🎯 وصل الهدف",
  SL: "🛑 وقف الخسارة",
  TIME: "⏰ انتهى الوقت",
  EOD: "🔔 إقفال آخر اليوم",
};

export function PaperExitsWatcher() {
  const list = useServerFn(listFreshPaperExits);
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
        const exits = res?.exits ?? [];
        const fresh = exits.filter((e) => !seenRef.current.has(e.id));
        if (fresh.length > 0) {
          for (const e of fresh) {
            seenRef.current.add(e.id);
            const reason = REASON_AR[e.exit_reason ?? ""] ?? e.exit_reason ?? "بيع";
            const pnl = Number(e.pnl ?? 0);
            const pnlPct = Number(e.pnl_pct ?? 0) * 100;
            const desc = `${reason} • خروج ${Number(e.exit_price).toFixed(2)} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} ج (${pnlPct.toFixed(2)}%)`;
            const fn = pnl >= 0 ? toast.success : toast.error;
            fn(`🔴 إشارة بيع: ${e.symbol}`, {
              description: desc,
              duration: 15_000,
              action: { label: "افتح", onClick: () => { window.location.href = "/paper"; } },
            });
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try { new Notification(`🔴 إشارة بيع: ${e.symbol}`, { body: desc, tag: e.id }); } catch {}
            }
          }
          beep(720);
          saveSeen(seenRef.current);
        }
      } catch (err) {
        console.error("[paper-exits-watcher] tick error", err);
      } finally {
        if (!cancelled) timer = setTimeout(tick, POLL_MS);
      }
    };

    timer = setTimeout(tick, 6_000);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [list]);

  return null;
}