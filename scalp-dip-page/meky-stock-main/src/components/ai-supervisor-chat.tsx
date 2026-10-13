/**
 * AISupervisorChat — the always-visible AI supervisor chat widget (fixed corner).
 *
 * Design (creative brief):
 *  - Floating "المشرف" bubble, always visible, bottom-left (RTL-safe bottom-right for LTR)
 *  - Pulse dot: green = seeing everything / amber = degraded / red = blind (stale state)
 *  - Expandable chat panel: shows the supervisor's thoughts timeline
 *    (what it sees, what it analyzed, what it did, what it plans) + user can type
 *    messages to it (stored + answered by next heartbeat via instructions file)
 *  - Data source: /api/public/hooks/supervisor-feed (reads supervisor_state.json +
 *    supervisor_log.md + user_messages.jsonl via server fn)
 *  - The AI heartbeat reads user_messages.jsonl each wake — so the user "talks" to
 *    the supervisor asynchronously and it answers in its next thought entry.
 */
import { useEffect, useRef, useState } from "react";
import { createServerFn } from "@tanstack/react-start";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

export type FeedEntry = {
  time: string;
  kind: "thought" | "action" | "alert" | "plan" | "user" | "answer";
  text: string;
};

const getFeed = createServerFn({ method: "GET" }).handler(async () => {
  const feedPath = path.join(ROOT, "supervisor_feed.jsonl");
  const statePath = path.join(ROOT, "supervisor_state.json");
  let entries: FeedEntry[] = [];
  let state: { level: string; time: string; window?: string } | null = null;
  try {
    const raw = fs.readFileSync(feedPath, "utf8").trim().split("\n").filter(Boolean);
    entries = raw.slice(-50).reverse().map((l) => JSON.parse(l));
  } catch {}
  try {
    state = JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {}
  // heartbeat freshness: is the supervisor actually alive? (state written < 35 min ago)
  let alive: "yes" | "stale" | "unknown" = "unknown";
  if (state?.time) {
    const ageMin = (Date.now() - new Date(state.time).getTime()) / 60000;
    alive = ageMin < 35 ? "yes" : "stale";
  }
  return { entries, state, alive };
});

const sendToSupervisor = createServerFn({ method: "POST" })
  .validator((d: unknown) => d as { text: string })
  .handler(async ({ data }) => {
    const text = (data?.text || "").slice(0, 500);
    if (!text.trim()) return { ok: false };
    const feedPath = path.join(ROOT, "supervisor_feed.jsonl");
    const entry: FeedEntry = {
      time: new Date().toISOString(),
      kind: "user",
      text: text.trim(),
    };
    fs.appendFileSync(feedPath, JSON.stringify(entry) + "\n");
    return { ok: true };
  });

export function AISupervisorChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const feedQ = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [feed, setFeed] = useState<{ entries: FeedEntry[]; alive: string; level?: string; time?: string }>({
    entries: [],
    alive: "unknown",
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/ai-supervisor-feed");
        if (res.ok) {
          const j = await res.json();
          if (!cancelled) setFeed({ entries: j.entries ?? [], alive: j.alive ?? "unknown", level: j.level });
        }
      } catch {}
      if (!cancelled) feedQ.current = setTimeout(tick, 20000);
    };
    tick();
    return () => {
      cancelled = true;
      if (feedQ.current) clearTimeout(feedQ.current);
    };
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [feed.entries.length, open]);

  const aliveColor =
    feed.alive === "yes" ? "bg-emerald-400" : feed.alive === "stale" ? "bg-amber-400" : "bg-zinc-500";
  const aliveText =
    feed.alive === "yes" ? "صاحي وشايف كل حاجة" : feed.alive === "stale" ? "مش شايف — البيانات قديمة!" : "لسه بيبدأ";

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await fetch("/api/public/hooks/ai-supervisor-feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setInput("");
      // optimistic: it will appear on next poll (20s) — show immediately
      setFeed((f) => ({
        ...f,
        entries: [{ time: new Date().toISOString(), kind: "user", text } as FeedEntry, ...f.entries],
      }));
    } finally {
      setSending(false);
    }
  };

  const kindIcon: Record<string, string> = {
    thought: "💭",
    action: "🔧",
    alert: "🚨",
    plan: "🎯",
    user: "👤",
    answer: "🛡️",
  };
  const kindColor: Record<string, string> = {
    thought: "text-sky-300",
    action: "text-emerald-300",
    alert: "text-red-300",
    plan: "text-violet-300",
    user: "text-foreground",
    answer: "text-emerald-200",
  };

  return (
    <>
      {/* Floating bubble — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="المشرف الذكي"
        title="المشرف الذكي — اضغط للمراقبة الحية"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 shadow-lg hover:scale-105 transition"
      >
        <span className="relative flex h-3 w-3">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${aliveColor} opacity-60`}></span>
          <span className={`relative inline-flex h-3 w-3 rounded-full ${aliveColor}`}></span>
        </span>
        <span className="text-sm font-bold">🛡️ المشرف</span>
        <span className="text-[10px] text-muted-foreground hidden sm:inline">{open ? "إغلاق" : aliveText}</span>
      </button>

      {/* Chat panel */}
      {open && (
        <div
          dir="rtl"
          className="fixed bottom-16 right-4 z-50 flex h-[70vh] w-[92vw] max-w-md flex-col rounded-xl border bg-background shadow-2xl"
        >
          {/* header */}
          <div className="flex items-center justify-between border-b p-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${aliveColor} opacity-60`}></span>
                <span className={`relative inline-flex h-3 w-3 rounded-full ${aliveColor}`}></span>
              </span>
              <div>
                <div className="text-sm font-black">🛡️ المشرف الذكي</div>
                <div className="text-[10px] text-muted-foreground">{aliveText} — تحديث كل 20 ثانية</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground" aria-label="إغلاق">
              ✕
            </button>
          </div>

          {/* feed */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto p-3">
            {feed.entries.length === 0 && (
              <div className="text-xs text-muted-foreground space-y-2 p-2">
                <p>المشرف لسه بيبدأ — أول تقرير هيظهر بعد أول دورة مراقبة.</p>
                <p>اكتب رسالة ليه تحت وهو هيرد في دورته الجاية (كل 20 دقيقة أثناء السوق، أو فورًا أول ما يصحى).</p>
              </div>
            )}
            {feed.entries.map((e, i) => (
              <div key={i} className={`text-xs leading-relaxed ${e.kind === "user" ? "text-left" : ""}`}>
                <div className={`font-semibold ${kindColor[e.kind] ?? ""}`}>
                  {kindIcon[e.kind] ?? "•"} {e.kind === "user" ? "أنت" : e.kind === "answer" ? "المشرف" : "المشرف"}{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {new Date(e.time).toLocaleString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="whitespace-pre-wrap rounded-md border border-border/40 bg-muted/30 px-2 py-1.5 mt-0.5">{e.text}</div>
              </div>
            ))}
          </div>

          {/* input */}
          <div className="border-t p-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="اكتب للمشرف… (طلب، سؤال، أو تعليمات)"
              className="flex-1 rounded-md border bg-muted/40 px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="rounded-md bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              {sending ? "…" : "إرسال"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
