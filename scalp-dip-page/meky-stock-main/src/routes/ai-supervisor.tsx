/**
 * /ai-supervisor — AI Supervisor monitoring page (Arabic RTL)
 * Shows: live system status (from supervisor endpoint), supervisor decisions log,
 * config changes ledger, and supervisor run history. Auto-refresh every 30s.
 * Reads state from scripts/supervisor.cjs output (supervisor_state.json served
 * through a read-only API route to avoid fs in client).
 */
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import fs from "node:fs";
import path from "node:path";

export const Route = createFileRoute("/ai-supervisor")({
  head: () => ({
    meta: [
      { title: "المشرف الذكي — مراقبة النظام لحظيًا" },
      { name: "description", content: "لوحة مراقبة المشرف الذكي: حالة النظام، قرارات المشرف، وسجل التغييرات" },
    ],
  }),
  component: SupervisorPage,
});

type SupervisorVerdict = {
  level: "OK" | "WARN" | "CRITICAL";
  time: string;
  window: string;
  critical: string[];
  warns: string[];
  oks: string[];
};

type ChangeLogRow = {
  id: number | string;
  ts: string;
  actor: string;
  action: string;
  detail: string;
};

const getSupervisorState = createServerFn({ method: "GET" }).handler(async () => {
  const statePath = path.join(process.cwd(), "supervisor_state.json");
  let verdict: SupervisorVerdict | null = null;
  try {
    const raw = fs.readFileSync(statePath, "utf8");
    verdict = JSON.parse(raw);
  } catch {
    verdict = null;
  }
  // change log: from strategy_settings audit or a dedicated table? We use _cleanup_log? No —
  // we keep it simple: recent git-like ledger via trade_ledger? For v1, we derive
  // "changes" from supervisor state history file if present.
  let history: SupervisorVerdict[] = [];
  const histPath = path.join(process.cwd(), "supervisor_history.jsonl");
  try {
    const raw = fs.readFileSync(histPath, "utf8").trim().split("\n").filter(Boolean);
    history = raw.slice(-40).reverse().map((l) => JSON.parse(l));
  } catch {
    history = [];
  }
  return { verdict, history };
});

const getSystemFacts = createServerFn({ method: "GET" }).handler(async () => {
  const p = supabaseAdmin;
  const [pos, sig, news, jobs] = await Promise.all([
    p.from("paper_trades").select("symbol, trade_date, entry_price, sl_price, status").eq("strategy", "scalp-dip").eq("status", "open"),
    p.from("scalp_dip_signals").select("scan_date, symbol").eq("scan_date", new Date().toISOString().slice(0, 10)),
    p.from("mubasher_news").select("id").limit(1).then((r) => ({ count: r.data?.length ?? 0 })),
    p.from("paper_trades").select("symbol").eq("strategy", "scalp-dip").eq("status", "closed"),
  ]);
  return {
    openPositions: pos.data?.length ?? 0,
    todaySignals: sig.data?.length ?? 0,
    closedTrades: jobs.data?.length ?? 0,
  };
});

function SupervisorPage() {
  const stateQ = useQuery({
    queryKey: ["supervisor-state"],
    queryFn: () => getSupervisorState(),
    refetchInterval: 30_000,
  });
  const factsQ = useQuery({
    queryKey: ["supervisor-facts"],
    queryFn: () => getSystemFacts(),
    refetchInterval: 60_000,
  });

  const v = stateQ.data?.verdict ?? null;
  const history = stateQ.data?.history ?? [];
  const facts = factsQ.data;

  const levelColor =
    v?.level === "CRITICAL" ? "text-red-400" : v?.level === "WARN" ? "text-amber-400" : "text-emerald-400";
  const levelBg =
    v?.level === "CRITICAL" ? "bg-red-950/40 border-red-700" : v?.level === "WARN" ? "bg-amber-950/30 border-amber-700" : "bg-emerald-950/30 border-emerald-700";

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-4" dir="rtl">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-black">🛡️ المشرف الذكي — مراقبة النظام</h1>
          <p className="text-xs text-muted-foreground mt-1">
            مراقبة لحظية للنظام: الموقع، البيانات، الصفقات، الإشارات، الأخبار، الـ cron jobs — تتحدث كل 30 ثانية
          </p>
        </div>
        <button
          onClick={() => stateQ.refetch()}
          className="rounded px-3 py-1.5 text-xs font-semibold bg-muted hover:bg-muted/70"
        >
          تحديث الآن
        </button>
      </header>

      {/* STATUS BANNER */}
      <section className={`rounded-lg border p-4 ${levelBg}`}>
        {stateQ.isLoading ? (
          <div className="text-sm">جاري تحميل حالة المشرف…</div>
        ) : !v ? (
          <div className="text-sm text-muted-foreground">
            مفيش تقرير مشرف لسه. شغّل <code className="font-mono text-xs">node scripts/supervisor.cjs</code> من مجلد المشروع، أو استنى تشغيل الـ cron القادم.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className={`text-lg font-black ${levelColor}`}>
                {v.level === "CRITICAL" ? "🔴 حرج" : v.level === "WARN" ? "🟡 تحذير" : "🟢 سليم"}
              </span>
              <span className="text-xs text-muted-foreground">
                آخر فحص: {new Date(v.time).toLocaleString("ar-EG")} • النافذة:{" "}
                {v.window === "pre-open" ? "قبل الافتتاح" : v.window === "entry" ? "نافذة الدخول" : v.window === "eod" ? "نافذة الخروج" : v.window === "session" ? "الجلسة" : "خارج الجلسة"}
              </span>
            </div>
            {v.critical?.length > 0 && (
              <ul className="text-sm space-y-1">
                {v.critical.map((c, i) => (
                  <li key={i} className="text-red-300">⛔ {c}</li>
                ))}
              </ul>
            )}
            {v.warns?.length > 0 && (
              <ul className="text-sm space-y-1">
                {v.warns.map((w, i) => (
                  <li key={i} className="text-amber-300">⚠️ {w}</li>
                ))}
              </ul>
            )}
            {v.oks?.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">الفحوصات السليمة ({v.oks.length})</summary>
                <ul className="mt-1 space-y-0.5">
                  {v.oks.map((o, i) => (
                    <li key={i}>✅ {o}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>

      {/* QUICK FACTS */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Stat label="مراكز مفتوحة" value={String(facts?.openPositions ?? "—")} />
        <Stat label="إشارات اليوم" value={String(facts?.todaySignals ?? "—")} />
        <Stat label="صفقات مقفولة" value={String(facts?.closedTrades ?? "—")} />
        <Stat label="تحديث كل" value="30 ثانية" />
      </section>

      {/* DECISIONS HISTORY */}
      <section className="rounded-lg border bg-card p-4">
        <h2 className="text-base font-bold mb-3">📜 سجل قرارات المشرف (آخر 40 فحص)</h2>
        {history.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            السجل هيتعبى تلقائيًا مع كل تشغيل للمشرف (كل 30 دقيقة خلال ساعات التداول).
          </p>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i} className="flex items-center gap-2 text-xs border-b border-border/40 pb-1">
                <span
                  className={
                    h.level === "CRITICAL" ? "text-red-400 font-bold" : h.level === "WARN" ? "text-amber-400" : "text-emerald-400"
                  }
                >
                  {h.level}
                </span>
                <span className="text-muted-foreground">{new Date(h.time).toLocaleString("ar-EG")}</span>
                <span className="flex-1 truncate">
                  {h.critical?.length ? h.critical.join(" • ") : h.warns?.length ? h.warns.join(" • ") : "كله سليم"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* WHAT THE SUPERVISOR WATCHES */}
      <section className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">ماذا يراقب المشرف؟ (حسب وقت الجلسة)</div>
        <div>🕘 <b>قبل الافتتاح (8:30-9:55):</b> جاهزية الموقع والبيانات والأرشيف</div>
        <div>🔥 <b>نافذة الدخول (9:55-10:30):</b> ظهور الإشارات — إن لم تظهر بعد 10:30 = إنذار حرج</div>
        <div>📊 <b>الجلسة (10:00-14:30):</b> تدفق البيانات اللحظية — توقفها 10 دقايق = إنذار حرج</div>
        <div>🏁 <b>نافذة الخروج (14:15-14:50):</b> تنفيذ الخروجات — صفقة عالقة 4+ أيام = إنذار حرج</div>
        <div>🛡️ <b>دايمًا:</b> سلامة المراكز (SL صحيح) • التكرارات • الـ cron jobs • حجم الداتابيز • الأرشيف</div>
      </section>

      <section className="rounded-lg border border-warn/50 bg-warn/10 p-3 text-xs">
        ⚠️ وضع PAPER TRADING فقط. المشرف بيراقب ويُبلغ — مفيش أي تنفيذ تداول حقيقي أوتوماتيكي.
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-lg font-bold font-mono mt-1">{value}</div>
    </div>
  );
}
