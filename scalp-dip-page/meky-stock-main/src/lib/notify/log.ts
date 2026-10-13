/** Persistent notifications log + mute state (localStorage-backed).
 * The permanent log records EVERY alert ever fired, independent of whether
 * the user saw it, heard it, or had sound muted at the time. */

const LOG_KEY = "egx_notify_log";
const MUTE_KEY = "egx_notify_muted";
const MAX_ENTRIES = 300;

export type NotifyEntry = {
  ts: string; // ISO
  kind: "BUY" | "SELL" | "WARNING" | "INFO";
  title: string;
  body: string;
};

export function readLog(): NotifyEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as NotifyEntry[]) : [];
  } catch { return []; }
}

export function appendLog(e: Omit<NotifyEntry, "ts">): void {
  try {
    const all = readLog();
    all.unshift({ ...e, ts: new Date().toISOString() });
    localStorage.setItem(LOG_KEY, JSON.stringify(all.slice(0, MAX_ENTRIES)));
    window.dispatchEvent(new CustomEvent("egx-notify-log"));
  } catch {}
}

export function clearLog(): void {
  try { localStorage.removeItem(LOG_KEY); window.dispatchEvent(new CustomEvent("egx-notify-log")); } catch {}
}

export function isMuted(): boolean {
  try { return localStorage.getItem(MUTE_KEY) === "1"; } catch { return false; }
}

export function setMuted(m: boolean): void {
  try { localStorage.setItem(MUTE_KEY, m ? "1" : "0"); window.dispatchEvent(new CustomEvent("egx-notify-muted")); } catch {}
}
