import { createFileRoute, Link } from "@tanstack/react-router";
import { createServerFn, useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { supabase } from "@/integrations/supabase/client";
import { beep, alertBeep, ensureAudioUnlock } from "@/lib/notify/beep";
import { toast } from "sonner";
import { fmtPrice } from "@/lib/format/price";
import { ThunderConnectionBanner } from "@/components/thunder-connection-banner";
import { CollectionWatchdogPanel } from "@/components/collection-watchdog-panel";

type Trade = {
  id: string;
  symbol: string;
  strategy: string;
  entry_price: number;
  entry_ts: string;
  tp_price: number;
  sl_price: number;
  exit_price: number | null;
  exit_ts: string | null;
  exit_reason: string | null;
  pnl: number | null;
  status: string;
  trade_date: string;
  current_price?: number | null;
  current_price_ts?: string | null;
  current_price_source?: string | null;
  max_gap_sec?: number | null;
  tick_count?: number | null;
  peak_price?: number | null;
  peak_price_ts?: string | null;
};

const getScalpToday = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_ts, exit_reason, pnl, status, trade_date")
    .eq("trade_date", today)
    .eq("strategy", "scalp-mr15")
    .order("entry_ts", { ascending: false });
  if (error) throw error;
  const trades = (data || []) as Trade[];
  // Pull all ticks for involved symbols once, then compute per-trade gap + latest price
  const allSyms = Array.from(new Set(trades.map(t => t.symbol)));
  if (allSyms.length) {
    const dayStart = `${today}T07:00:00Z`;
    const byPrice = new Map<string, Array<{ ts: number; price: number; source: string }>>();
    let from = 0;
    const PAGE = 1000;
    while (true) {
      const { data: ticks } = await supabaseAdmin
        .from("live_ticks")
        .select("symbol, price, ts, source")
        .in("symbol", allSyms)
        .gte("ts", dayStart)
        .order("ts", { ascending: true })
        .range(from, from + PAGE - 1);
      if (!ticks || ticks.length === 0) break;
      for (const r of ticks) {
        const arr = byPrice.get(r.symbol) ?? [];
        arr.push({ ts: new Date(r.ts as string).getTime(), price: Number(r.price), source: (r.source as string) || "?" });
        byPrice.set(r.symbol, arr);
      }
      if (ticks.length < PAGE) break;
      from += PAGE;
    }
    for (const t of trades) {
      const arr = byPrice.get(t.symbol) ?? [];
      // Latest price for open trades
      if (t.status === "open" && arr.length) {
        const last = arr[arr.length - 1];
        t.current_price = last.price;
        t.current_price_ts = new Date(last.ts).toISOString();
        t.current_price_source = last.source;
      }
      // Max gap within [entry_ts, exit_ts || now]
      const start = new Date(t.entry_ts).getTime();
      const end = t.exit_ts ? new Date(t.exit_ts).getTime() : Date.now();
      let prev = start;
      let maxGap = 0;
      let count = 0;
      let peak = 0;
      let peakTs = 0;
      for (const tk of arr) {
        if (tk.ts < start || tk.ts > end) continue;
        const gap = (tk.ts - prev) / 1000;
        if (gap > maxGap) maxGap = gap;
        prev = tk.ts;
        count++;
        if (tk.price > peak) { peak = tk.price; peakTs = tk.ts; }
      }
      const tailGap = (end - prev) / 1000;
      if (tailGap > maxGap) maxGap = tailGap;
      t.max_gap_sec = Math.round(maxGap);
      t.tick_count = count;
      t.peak_price = peak > 0 ? peak : null;
      t.peak_price_ts = peakTs > 0 ? new Date(peakTs).toISOString() : null;
    }
  }
  return { trades, date: today };
});

const getScalpMr15Enabled = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("strategy_settings")
    .select("enabled")
    .eq("key", "scalp-mr15")
    .maybeSingle();
  return { enabled: data?.enabled ?? true };
});

const setScalpMr15Enabled = createServerFn({ method: "POST" })
  .inputValidator((d: { enabled: boolean }) => d)
  .handler(async ({ data }) => {
    const { error } = await supabaseAdmin
      .from("strategy_settings")
      .upsert({ key: "scalp-mr15", enabled: data.enabled, updated_at: new Date().toISOString() }, { onConflict: "key" });
    if (error) throw error;
    return { ok: true, enabled: data.enabled };
  });

export const Route = createFileRoute("/scalp")({
  component: ScalpPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">خطأ: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  head: () => ({
    meta: [
      { title: "Scalp — إشارات لحظية" },
      { name: "description", content: "صفحة Scalp مخصصة بإشعارات لحظية فورية." },
    ],
  }),
});

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ExtensionToggle() {
  const getEnabled = useServerFn(getScalpMr15Enabled);
  const setEnabled = useServerFn(setScalpMr15Enabled);
  const { data, refetch, isLoading } = useQuery({
    queryKey: ["scalp-mr15-enabled"],
    queryFn: () => getEnabled(),
    refetchInterval: 30_000,
  });
  const [busy, setBusy] = useState(false);
  const enabled = data?.enabled ?? true;
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = !enabled;
      await setEnabled({ data: { enabled: next } });
      await refetch();
      toast(next ? "تم تفعيل فتح تابات ثاندر ✅" : "تم إيقاف فتح تابات ثاندر ⛔");
    } catch (e: any) {
      toast.error(`فشل التغيير: ${e?.message ?? "خطأ"}`);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className={`rounded-lg border p-4 flex items-center justify-between gap-3 ${enabled ? "bg-bull/10 border-bull/40" : "bg-muted/40 border-muted"}`}>
      <div className="text-sm">
        <div className="font-bold">
          {isLoading ? "…" : enabled ? "🟢 فتح تابات ثاندر: مُفعّل" : "⛔ فتح تابات ثاندر: مُعطّل"}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          الصفحة بتفضل شغّالة في الحالتين. لما يبقى مُعطّل، الإشارات بتظهر هنا لكن الاكستنشن مش هيفتح تابات ثاندر.
        </div>
      </div>
      <button
        onClick={toggle}
        disabled={busy || isLoading}
        className={`rounded-md px-4 py-2 text-sm font-bold ${enabled ? "bg-bear text-white" : "bg-bull text-white"} disabled:opacity-50`}
      >
        {busy ? "..." : enabled ? "إيقاف" : "تفعيل"}
      </button>
    </div>
  );
}

function ScalpPage() {
  const fetchTrades = useServerFn(getScalpToday);
  const { data, refetch } = useQuery({
    queryKey: ["scalp-today"],
    queryFn: () => fetchTrades(),
    refetchInterval: 15_000,
  });
  const [pulse, setPulse] = useState(0);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  useEffect(() => {
    ensureAudioUnlock();
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Seed seen ids from first load so realtime only alerts on truly new rows
  useEffect(() => {
    if (!data?.trades || initializedRef.current) return;
    for (const t of data.trades) seenIdsRef.current.add(t.id);
    initializedRef.current = true;
  }, [data]);

  // Realtime: instant push for new scalp trades + exits
  useEffect(() => {
    const channel = supabase
      .channel("scalp-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_trades", filter: "strategy=eq.scalp-mr15" },
        (payload) => {
          const t = payload.new as Trade;
          if (seenIdsRef.current.has(t.id)) return;
          seenIdsRef.current.add(t.id);
          alertBeep();
          setPulse((p) => p + 1);
          const entry = fmtPrice(t.entry_price);
          const tp = fmtPrice(t.tp_price);
          const sl = fmtPrice(t.sl_price);
          const body = `دخول ${entry} • TP ${tp} • SL ${sl}`;
          toast.success(`🔥 إشارة Scalp جديدة: ${t.symbol}`, {
            description: body,
            duration: 30_000,
          });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`🔥 Scalp ${t.symbol}`, { body, tag: t.id, requireInteraction: true }); } catch {}
          }
          refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "paper_trades", filter: "strategy=eq.scalp-mr15" },
        (payload) => {
          const t = payload.new as Trade;
          const old = payload.old as Partial<Trade>;
          if (t.status !== "closed" || old.status === "closed") return;
          beep(t.pnl && t.pnl > 0 ? 1320 : 520);
          const pnl = Number(t.pnl ?? 0);
          toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج Scalp: ${t.symbol}`, {
            description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
            duration: 20_000,
          });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`${pnl >= 0 ? "🎯" : "🛑"} ${t.symbol}`, { body: `${t.exit_reason} • ${pnl.toFixed(0)} EGP`, tag: `${t.id}-exit` }); } catch {}
          }
          refetch();
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [refetch]);

  const trades = data?.trades ?? [];
  const open = trades.filter(t => t.status === "open");
  const closed = trades.filter(t => t.status === "closed");
  const realized = closed.reduce((a, t) => a + (Number(t.pnl) || 0), 0);
  const wins = closed.filter(t => Number(t.pnl) > 0).length;
  const winRate = closed.length ? (wins / closed.length) * 100 : 0;
  const nowMs = Date.now();
  const FRESH_MS = 90 * 1000;
  const MAX_DRIFT_PCT = 0.003; // 0.3% above entry → window closed

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <ThunderConnectionBanner />
      <CollectionWatchdogPanel />
      <header className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            ← الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            ⚡ Scalp Live
            <span className={`inline-block h-2.5 w-2.5 rounded-full bg-bull ${pulse % 2 ? "animate-ping" : ""}`} />
          </h1>
          <Link
            to="/scalp-feasibility"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            📊 تقرير جدوى الإشارات (proof بأرقام حقيقية) →
          </Link>
          <p className="text-muted-foreground text-sm mt-1">
            إشعارات لحظية فورية (Realtime). الصوت + إشعار المتصفح يشتغلوا في نفس الثانية اللي بتطلع فيها الإشارة.
          </p>
        </div>
        <button
          onClick={() => { ensureAudioUnlock(); beep(880); toast("الصوت مفعّل ✅"); if (typeof Notification !== "undefined") Notification.requestPermission().catch(() => {}); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          فعّل الصوت + الإشعارات
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="إشارات اليوم" value={String(trades.length)} />
        <Stat label="مفتوحة / مقفولة" value={`${open.length} / ${closed.length}`} />
        <Stat label="PnL محقق" value={`${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`} tone={realized >= 0 ? "bull" : "bear"} />
        <Stat label="نسبة النجاح" value={`${winRate.toFixed(0)}%`} />
      </div>

      <ExtensionToggle />

      <ManualOpenThunderTabWidget />

      {trades.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          لسه مفيش إشارات Scalp النهارده. الإشعار هيوصلك لحظياً أول ما تطلع.
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map(t => {
            const ageMs = nowMs - new Date(t.entry_ts).getTime();
            const cur = t.current_price ?? null;
            const drift = cur != null && t.entry_price > 0 ? (cur - t.entry_price) / t.entry_price : 0;
            const priceMovedUp = cur != null && drift > MAX_DRIFT_PCT;
            const isFresh = t.status === "open" && ageMs <= FRESH_MS && !priceMovedUp;
            return (
              <div key={t.id} className={`rounded-lg border p-4 flex flex-wrap items-center gap-4 ${
                isFresh ? "bg-warn/15 border-warn shadow-md" :
                t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"
              }`}>
                <div className="min-w-24">
                  <div className="font-bold text-2xl">{t.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtTime(t.entry_ts)}</div>
                  <OpenThunderTabButton symbol={t.symbol} />
                </div>
                <div className="text-sm">
                  <div>دخول: <strong>{fmtPrice(t.entry_price)}</strong></div>
                  <div className="text-xs text-muted-foreground">
                    TP {fmtPrice(t.tp_price)} / SL {fmtPrice(t.sl_price)}
                  </div>
                  {cur != null && (
                    <div className="text-xs mt-1">
                      السعر الآن: <strong className={drift > 0 ? "text-bear" : "text-bull"}>{fmtPrice(cur)}</strong>
                      <span className="text-muted-foreground"> ({drift >= 0 ? "+" : ""}{(drift * 100).toFixed(2)}%)</span>
                      {t.current_price_source && (
                        <span className={`mr-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          t.current_price_source === "thunder_ext" ? "bg-bull/20 text-bull" : "bg-muted text-muted-foreground"
                        }`} title={t.current_price_ts ?? undefined}>
                          {t.current_price_source === "thunder_ext" ? "⚡ Thunder" : t.current_price_source}
                          {t.current_price_ts && ` · ${Math.max(0, Math.round((Date.now() - new Date(t.current_price_ts).getTime())/1000))}s`}
                        </span>
                      )}
                    </div>
                  )}
                  {t.peak_price != null && t.peak_price > 0 && (() => {
                    const peakDrift = t.entry_price > 0 ? (t.peak_price! - t.entry_price) / t.entry_price : 0;
                    const hitTp = t.peak_price! >= t.tp_price;
                    return (
                      <div className="text-xs mt-1">
                        أعلى سعر: <strong className="text-bull">{fmtPrice(t.peak_price!)}</strong>
                        <span className="text-muted-foreground"> ({peakDrift >= 0 ? "+" : ""}{(peakDrift * 100).toFixed(2)}%)</span>
                        {hitTp && <span className="mr-2 text-[10px] font-bold text-bull">🎯 تخطّى TP</span>}
                        {t.peak_price_ts && (
                          <span className="text-muted-foreground"> · {fmtTime(t.peak_price_ts)}</span>
                        )}
                      </div>
                    );
                  })()}
                </div>
                <div className="mr-auto text-left">
                  {(t.max_gap_sec ?? 0) > 60 && (
                    <div className="mb-1 inline-block rounded bg-warn/20 border border-warn px-2 py-0.5 text-[11px] font-bold text-warn" title={`أكبر فجوة بين التيكات داخل نافذة الصفقة = ${t.max_gap_sec}s • عدد التيكات = ${t.tick_count ?? 0}`}>
                      ⚠️ فجوة تيكات {t.max_gap_sec}s
                    </div>
                  )}
                  {isFresh ? (
                    <span className="text-warn font-bold text-lg">🔥 ادخل دلوقتي</span>
                  ) : t.status === "open" ? (
                    <span className="text-muted-foreground font-semibold">
                      {priceMovedUp ? `⏳ النافذة فاتت — السعر فوق الدخول بـ ${(drift * 100).toFixed(2)}%` : "⏳ النافذة فاتت"}
                    </span>
                  ) : (
                    <span className={Number(t.pnl) >= 0 ? "text-bull font-bold" : "text-bear font-bold"}>
                      {t.exit_reason} • {Number(t.pnl) >= 0 ? "+" : ""}{Number(t.pnl).toFixed(0)} EGP
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "bull" | "bear" }) {
  const color = tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "";
  return (
    <div className="rounded border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

// Manual re-open of a persistent Thunder tab for this symbol.
// Uses the extension bridge (window.postMessage → content.js → background.js
// → persistOpenSymbol). If the extension isn't installed, the button falls
// back to a plain Thunder search link.
function OpenThunderTabButton({ symbol }: { symbol: string }) {
  const [state, setState] = useState<"idle" | "ok" | "err" | "noext">("idle");
  const [msg, setMsg] = useState<string>("");
  const onClick = () => requestOpenThunderTab(symbol, setState, setMsg);
  return (
    <button
      type="button"
      onClick={onClick}
      title={msg || "افتح تاب ثاندر لهذا السهم مع قائمة معلومات السوق (المستوى الثاني) تلقائياً"}
      className={`mt-1 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
        state === "ok"
          ? "border-bull bg-bull/15 text-bull"
          : state === "err" || state === "noext"
            ? "border-bear bg-bear/15 text-bear"
            : "border-muted-foreground/30 bg-muted/30 hover:bg-accent hover:border-accent-foreground/50"
      }`}
    >
      {state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ الاكستنشن مش شغّال" : state === "err" ? "❌ فشل" : "⚡ فتح تاب ثاندر"}
    </button>
  );
}

// Always-visible manual widget: type any symbol → opens the Thunder tab
// with the L2 panel already open. Works even when there are 0 signals.
function ManualOpenThunderTabWidget() {
  const [sym, setSym] = useState("");
  const [state, setState] = useState<"idle" | "ok" | "err" | "noext">("idle");
  const [msg, setMsg] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = sym.trim().toUpperCase();
    if (!s) return;
    requestOpenThunderTab(s, setState, setMsg);
  };
  return (
    <form
      onSubmit={submit}
      className="rounded-lg border bg-card p-3 flex flex-wrap items-center gap-2"
      title={msg || "افتح تاب ثاندر لأي سهم يدوياً — لو ثاندر عمل logout وقفل التاب"}
    >
      <div className="text-sm font-semibold">⚡ فتح تاب ثاندر يدوي</div>
      <input
        type="text"
        value={sym}
        onChange={(e) => setSym(e.target.value)}
        placeholder="رمز السهم (مثل AALR)"
        className="rounded border bg-background px-2 py-1 text-sm font-mono uppercase w-40"
        maxLength={12}
      />
      <button
        type="submit"
        className={`rounded border px-3 py-1 text-sm font-semibold transition-colors ${
          state === "ok"
            ? "border-bull bg-bull/20 text-bull"
            : state === "err" || state === "noext"
              ? "border-bear bg-bear/20 text-bear"
              : "border-muted-foreground/40 bg-muted/40 hover:bg-accent"
        }`}
      >
        {state === "ok" ? "✅ اتفتح" : state === "noext" ? "⚠️ ثبّت الاكستنشن v4.1.86" : state === "err" ? "❌ فشل" : "افتح التاب"}
      </button>
      <div className="text-[11px] text-muted-foreground mr-auto">
        {msg || "بيفتح صفحة السهم في ثاندر ويفتح قائمة معلومات السوق (L2) تلقائياً"}
      </div>
    </form>
  );
}

// Bridge to the Thunder v4 extension. Uses window.postMessage + a request id;
// content.js relays the SW response back so we can show a real error instead
// of a fake "success". Falls back to a clear "extension not detected" state
// when the DOM marker isn't present (extension not installed or outdated).
function requestOpenThunderTab(
  symbol: string,
  setState: (s: "idle" | "ok" | "err" | "noext") => void,
  setMsg: (s: string) => void,
) {
  const marker = typeof document !== "undefined"
    ? document.documentElement?.getAttribute("data-thunder-ext-v4")
    : null;
  if (!marker) {
    setState("noext");
    setMsg("الاكستنشن v4.1.86 مش متثبّت أو نسخة قديمة — نزّل الـZIP الجديد من صفحة Thunder وأعد تحميله من chrome://extensions.");
    setTimeout(() => setState("idle"), 4000);
    return;
  }
  const reqId = `open-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let done = false;
  const onMsg = (ev: MessageEvent) => {
    const d: any = ev.data;
    if (!d || d.__thunderResponse !== true || d.__reqId !== reqId) return;
    done = true;
    window.removeEventListener("message", onMsg);
    if (d.ok) {
      setState("ok");
      setMsg("");
    } else {
      setState("err");
      setMsg(d.err || d.resp?.error || "فشل غير معروف");
    }
    setTimeout(() => setState("idle"), 3000);
  };
  window.addEventListener("message", onMsg);
  try {
    window.postMessage(
      { __thunder: true, type: "openPersistTab", payload: { symbol }, __reqId: reqId },
      window.location.origin,
    );
  } catch (e: any) {
    window.removeEventListener("message", onMsg);
    setState("err");
    setMsg(String(e?.message || e));
    setTimeout(() => setState("idle"), 3000);
    return;
  }
  setTimeout(() => {
    if (done) return;
    window.removeEventListener("message", onMsg);
    setState("err");
    setMsg("مفيش رد من الاكستنشن — تأكد إن ثاندر مسجّل دخول ثم اضغط تاني.");
    setTimeout(() => setState("idle"), 4000);
  }, 2500);
}
