import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  readLog, appendLog, clearLog, isMuted, setMuted, type NotifyEntry,
} from "@/lib/notify/log";
import { ensureAudioUnlock, beep, alertBeep } from "@/lib/notify/beep";
import { listAuditFeed, type AuditFeedRow } from "@/lib/notify/audit-feed.functions";

/** NotificationCenter — permission banner + mute toggle + permanent log.
 * Permission MUST be requested from a real user click (browsers silently
 * deny programmatic requests — the root cause of "no notifications").
 *
 * Feed sources (merged into the same permanent log):
 *  1. Local client watchers (legacy — paper trades etc).
 *  2. decision_audit_log (server) — polled every 60s for rows newer than the
 *     last id seen: MW_WEEKLY_SCAN / MW_WEEKLY_EXIT / MW_REGIME_CASH /
 *     USER_BOUGHT / USER_SOLD / runner events. First visit only bookmarks the
 *     current max id — history is not replayed as notifications. */

const AUDIT_LAST_ID_KEY = "egx_notify_audit_last_id";

function parseDetails(raw: string | null): Record<string, any> {
  if (!raw) return {};
  try { const v = JSON.parse(raw); return v && typeof v === "object" ? v : {}; } catch { return {}; }
}

/** Map one audit row to a notification entry (Arabic, operation-room tone).
 * `ts` is stamped by appendLog at ingestion time. */
function auditRowToEntry(r: AuditFeedRow): Omit<NotifyEntry, "ts"> {
  const d = parseDetails(r.details);
  const px = (v: number | null) => (v != null && Number.isFinite(v) ? `${v.toFixed(2)} ج.م` : "");
  const pct = (v: number | null) => (v != null && Number.isFinite(v) ? `${(v * 100).toFixed(2)}%` : "");
  switch (r.event_type) {
    case "MW_WEEKLY_SCAN": {
      const sel = Array.isArray(d.selected) ? (d.selected as string[]) : [];
      if (d.regime_cash) {
        return { kind: "WARNING", title: "فلتر النظام: كاش هذا الأسبوع", body: "تراكم 10 أسابيع سالب — لا مرشحين هذا الأسبوع." };
      }
      if (d.no_candidates) {
        return { kind: "INFO", title: "لا مرشحين داخل نطاق الزخم", body: "لا أسهم بين 8%-45% زخم هذا الأسبوع — كاش." };
      }
      if (sel.length) {
        return {
          kind: "BUY",
          title: `إشعار شراء أسبوعي: ${sel.join("، ")}`,
          body: `الدخول: افتتاح ${d.entry_date ?? "أول جلسة"} (فجوة -3% إلى +2%) · الخروج: افتتاح الأسبوع القادم.`,
        };
      }
      return { kind: "INFO", title: "مسح أسبوعي تم", body: d.entry_date ? `أُرسل التليجرام — أسبوع الدخول ${d.entry_date}.` : "سجل المسح الأسبوعي." };
    }
    case "MW_WEEKLY_EXIT":
      return {
        kind: "SELL",
        title: `خروج أسبوعي: ${r.symbol}`,
        body: `خروج عند ${px(r.trigger_price)} · العائد ${pct(r.pnl_pct)} · ${d.exit_reason ?? "WEEKLY_TIME_EXIT"}.`,
      };
    case "MW_REGIME_CASH":
      return { kind: "WARNING", title: "فلتر النظام: كاش", body: "تراكم 10 أسابيع لمؤشر متساوي الأوزان سالب — النظام في كاش." };
    case "USER_BOUGHT":
      return { kind: "BUY", title: `تأكيد شراء: ${r.symbol}`, body: `تنفيذ عند ${px(r.trigger_price)} (سعر الترشيح ${px(r.reference_price)}).` };
    case "USER_SOLD":
      return { kind: "SELL", title: `تأكيد بيع: ${r.symbol}`, body: `تنفيذ عند ${px(r.trigger_price)} · العائد ${pct(r.pnl_pct)}.` };
    case "PAPER_CLOSED":
      return { kind: "SELL", title: `إغلاق ورقي: ${r.symbol}`, body: `العائد ${pct(r.pnl_pct)}.` };
    default:
      return { kind: "INFO", title: `${r.event_type}${r.symbol && r.symbol !== "-" ? ` — ${r.symbol}` : ""}`, body: r.trigger_price != null ? px(r.trigger_price) : "" };
  }
}

export function NotificationCenter() {
  const [perm, setPerm] = useState<string>("default");
  const [muted, setMutedState] = useState(false);
  const [open, setOpen] = useState(false);
  const [log, setLog] = useState<NotifyEntry[]>([]);
  const fetchFeed = useServerFn(listAuditFeed);
  const lastIdRef = useRef<number>(-1);

  useEffect(() => {
    if (typeof Notification !== "undefined") setPerm(Notification.permission);
    setMutedState(isMuted());
    setLog(readLog());
    const onLog = () => setLog(readLog());
    const onMute = () => setMutedState(isMuted());
    window.addEventListener("egx-notify-log", onLog);
    window.addEventListener("egx-notify-muted", onMute);
    return () => { window.removeEventListener("egx-notify-log", onLog); window.removeEventListener("egx-notify-muted", onMute); };
  }, []);

  // Poll decision_audit_log (server events) every 60s and ingest new rows.
  useEffect(() => {
    let cancelled = false;
    const ingest = async () => {
      try {
        let lastId = lastIdRef.current;
        if (lastId < 0) {
          const stored = Number(localStorage.getItem(AUDIT_LAST_ID_KEY) ?? "0");
          if (stored > 0) { lastId = stored; lastIdRef.current = stored; }
        }
        const probe = lastId <= 0;
        const res = await fetchFeed({ data: { afterId: probe ? 0 : lastId, probe } });
        if (cancelled || !res) return;
        if (probe) {
          // First visit: bookmark current position — no history replay.
          lastIdRef.current = res.maxId;
          try { localStorage.setItem(AUDIT_LAST_ID_KEY, String(res.maxId)); } catch {}
          return;
        }
        if (res.maxId > lastId) {
          lastIdRef.current = res.maxId;
          try { localStorage.setItem(AUDIT_LAST_ID_KEY, String(res.maxId)); } catch {}
        }
        for (const r of res.rows) {
          const entry = auditRowToEntry(r);
          appendLog(entry);
          const loud = entry.kind === "BUY" || entry.kind === "SELL" || entry.kind === "WARNING";
          if (loud) {
            ensureAudioUnlock();
            if (!isMuted()) {
              if (entry.kind === "SELL" || entry.kind === "WARNING") alertBeep();
              else beep(1200);
            }
            if (typeof Notification !== "undefined" && Notification.permission === "granted") {
              try { new Notification(entry.title, { body: entry.body, tag: `audit-${r.id}` }); } catch {}
            }
          }
        }
      } catch {}
    };
    ingest();
    const id = setInterval(ingest, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, [fetchFeed]);

  const enable = async () => {
    ensureAudioUnlock();
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
    if (p === "granted") { beep(1320); appendLog({ kind: "INFO", title: "تم تفعيل الإشعارات", body: "صلاحية المتصفح ممنوحة — سيتم تنبيهك بكل إشارة وخروج." }); }
    else appendLog({ kind: "WARNING", title: "تعذّر تفعيل الإشعارات", body: "الصلاحية مرفوضة — فعّلها يدويًا من إعدادات الموقع في المتصفح." });
  };

  const needsEnable = typeof Notification !== "undefined" && Notification.permission !== "granted";

  return (
    <div className="fixed bottom-3 left-3 z-50 print:hidden">
      {needsEnable && (
        <button
          onClick={enable}
          className="mb-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-bold text-black shadow-lg hover:bg-amber-400"
        >
          🔔 فعّل الإشعارات (اضغط هنا — المطلوب نقرة منك لصلاحية المتصفح)
        </button>
      )}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setOpen((o) => !o)}
          className="rounded-lg bg-neutral-800 px-3 py-1.5 text-sm text-white shadow hover:bg-neutral-700"
        >
          📜 سجل الإشعارات ({log.length})
        </button>
        <button
          onClick={() => { const m = !muted; setMuted(m); setMutedState(m); if (!m) { ensureAudioUnlock(); beep(880); } }}
          className={`rounded-lg px-3 py-1.5 text-sm font-bold shadow ${muted ? "bg-red-700 text-white hover:bg-red-600" : "bg-emerald-700 text-white hover:bg-emerald-600"}`}
          title={muted ? "الصوت مقفول — اضغط للتشغيل" : "الصوت شغال — اضغط للكتم"}
        >
          {muted ? "🔇 مكتوم" : "🔊 الصوت شغال"}
        </button>
      </div>
      {open && (
        <div className="mt-2 max-h-72 w-96 overflow-auto rounded-lg border border-neutral-700 bg-neutral-900 p-2 shadow-xl">
          <div className="mb-1 flex justify-between items-center">
            <span className="text-xs text-neutral-400">سجل دائم — كل تنبيه صدر، حتى لو كان مقفول الصوت</span>
            <button onClick={clearLog} className="text-xs text-red-400 hover:underline">تفريغ</button>
          </div>
          {log.length === 0 && <div className="p-2 text-sm text-neutral-500">لا توجد إشعارات مسجلة بعد</div>}
          {log.map((e, i) => (
            <div key={i} className="border-b border-neutral-800 px-1 py-1.5 text-sm last:border-0">
              <div className="flex justify-between gap-2">
                <span className={e.kind === "SELL" ? "text-red-400 font-bold" : e.kind === "BUY" ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {e.kind === "SELL" ? "🛑" : e.kind === "BUY" ? "🎯" : "ℹ️"} {e.title}
                </span>
                <span className="shrink-0 text-[10px] text-neutral-500">{new Date(e.ts).toLocaleString("ar-EG")}</span>
              </div>
              <div className="text-xs text-neutral-400">{e.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
