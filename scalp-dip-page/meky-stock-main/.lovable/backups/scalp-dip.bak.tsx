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

const STRATEGY = "scalp-dip";

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
  dip_trigger_price?: number | null;
  current_price?: number | null;
  current_price_ts?: string | null;
  peak_price?: number | null;
  tick_count?: number | null;
  seconds_to_tp?: number | null;
  seconds_to_peak?: number | null;
};

const getDipToday = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_ts, exit_reason, pnl, status, trade_date, dip_trigger_price")
    .eq("trade_date", today)
    .eq("strategy", STRATEGY)
    .order("entry_ts", { ascending: false });
  if (error) throw error;
  const trades = (data || []) as Trade[];

  const syms = Array.from(new Set(trades.map(t => t.symbol)));
  if (syms.length) {
    const dayStart = `${today}T07:00:00Z`;
    const byPx = new Map<string, Array<{ ts: number; price: number }>>();
    let from = 0;
    while (true) {
      const { data: ticks } = await supabaseAdmin
        .from("live_ticks")
        .select("symbol, price, ts")
        .in("symbol", syms)
        .gte("ts", dayStart)
        .eq("source", "thunder_ext")
        .order("ts", { ascending: true })
        .range(from, from + 999);
      if (!ticks?.length) break;
      for (const r of ticks) {
        const arr = byPx.get(r.symbol) ?? [];
        arr.push({ ts: new Date(r.ts as string).getTime(), price: Number(r.price) });
        byPx.set(r.symbol, arr);
      }
      if (ticks.length < 1000) break;
      from += 1000;
    }
    for (const t of trades) {
      const arr = byPx.get(t.symbol) ?? [];
      if (t.status === "open" && arr.length) {
        const last = arr[arr.length - 1];
        t.current_price = last.price;
        t.current_price_ts = new Date(last.ts).toISOString();
      }
      const start = new Date(t.entry_ts).getTime();
      const end = t.exit_ts ? new Date(t.exit_ts).getTime() : Date.now();
      let peak = 0, count = 0, peakTs = 0, tpTs = 0;
      for (const tk of arr) {
        if (tk.ts < start || tk.ts > end) continue;
        count++;
        if (tk.price > peak) { peak = tk.price; peakTs = tk.ts; }
        if (!tpTs && tk.price >= t.tp_price) tpTs = tk.ts;
      }
      t.peak_price = peak > 0 ? peak : null;
      t.tick_count = count;
      t.seconds_to_tp = tpTs ? Math.round((tpTs - start) / 1000) : null;
      t.seconds_to_peak = peakTs ? Math.round((peakTs - start) / 1000) : null;
    }
  }
  return { trades, date: today };
});

export const Route = createFileRoute("/scalp-dip")({
  component: ScalpDipPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">خطأ: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  head: () => ({
    meta: [
      { title: "Scalp DIP — استراتيجية التردد العالي" },
      { name: "description", content: "صفحة استراتيجية Scalp DIP الحية — دخول عند هبوط 1-6%، هدف +1.5% لحظي، وقف −1.5%، خروج ذكي بعد 15 دقيقة لضمان دوران السيولة." },
    ],
  }),

});

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function fmtDuration(sec: number) {
  if (sec < 60) return `${sec} ثانية`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return s ? `${m}د ${s}ث` : `${m} دقيقة`;
  const h = Math.floor(m / 60);
  return `${h}س ${m % 60}د`;
}

function ScalpDipPage() {
  const fetchTrades = useServerFn(getDipToday);
  const { data, refetch } = useQuery({
    queryKey: ["scalp-dip-today"],
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

  useEffect(() => {
    if (!data?.trades || initializedRef.current) return;
    for (const t of data.trades) seenIdsRef.current.add(t.id);
    initializedRef.current = true;
  }, [data]);

  useEffect(() => {
    const channel = supabase
      .channel("scalp-dip-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_trades", filter: `strategy=eq.${STRATEGY}` },
        (payload) => {
          const t = payload.new as Trade;
          if (seenIdsRef.current.has(t.id)) return;
          seenIdsRef.current.add(t.id);
          alertBeep();
          setPulse(p => p + 1);
          const body = `دخول ${fmtPrice(t.entry_price)} • TP ${fmtPrice(t.tp_price)} • SL ${fmtPrice(t.sl_price)}`;
          toast.success(`📉 إشارة DIP جديدة: ${t.symbol}`, { description: body, duration: 30_000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`📉 DIP ${t.symbol}`, { body, tag: t.id, requireInteraction: true }); } catch {}
          }
          refetch();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "paper_trades", filter: `strategy=eq.${STRATEGY}` },
        (payload) => {
          const t = payload.new as Trade;
          const old = payload.old as Partial<Trade>;
          if (t.status !== "closed" || old.status === "closed") return;
          const pnl = Number(t.pnl ?? 0);
          beep(pnl > 0 ? 1320 : 520);
          toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج DIP: ${t.symbol}`, {
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

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <ThunderConnectionBanner />
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            ← الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📉 Scalp DIP Live
            <span className={`inline-block h-2.5 w-2.5 rounded-full bg-bull ${pulse % 2 ? "animate-ping" : ""}`} />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            <b>Elite Sniper 5:</b> دخول عند هبوط 2.5% من فتح اليوم • هدف <b>+3.0%</b> (لحظي) • وقف <b>−1.0%</b> • بوابة سيولة 150k ج.م • رأس مال 20,000 ج/صفقة.
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
        <Stat label="PnL محقق (بعد العمولة)" value={`${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`} tone={realized >= 0 ? "bull" : "bear"} />
        <Stat label="نسبة النجاح" value={`${winRate.toFixed(0)}%`} />
      </div>

      {trades.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          لسه مفيش إشارات DIP النهارده. الاستراتيجية بتنتظر أي سهم ينزل 3% على الأقل من فتح اليوم.
        </div>
      ) : (
        <div className="space-y-2">
          {trades.map(t => {
            const cur = t.current_price ?? null;
            const pnlNow = cur != null ? ((cur - t.entry_price) / t.entry_price) * 100 : null;
            const peakPct = t.peak_price != null && t.peak_price > 0 ? ((t.peak_price - t.entry_price) / t.entry_price) * 100 : null;
            const hitTp = t.peak_price != null && t.peak_price >= t.tp_price;
            return (
              <div key={t.id} className={`rounded-lg border p-4 flex flex-wrap items-center gap-4 ${
                t.status === "open" ? "bg-accent/30 border-accent" : "bg-card"
              }`}>
                <div className="min-w-24">
                  <div className="font-bold text-2xl">{t.symbol}</div>
                  <div className="text-[10px] text-muted-foreground">{fmtTime(t.entry_ts)}</div>
                </div>
                <div className="text-sm">
                  <div>دخول: <strong>{fmtPrice(t.entry_price)}</strong></div>
                  {t.dip_trigger_price != null && (
                    <div className="text-[11px] text-muted-foreground">
                      فتح اليوم: {fmtPrice(t.dip_trigger_price)} • نازل {(((t.dip_trigger_price - t.entry_price) / t.dip_trigger_price) * 100).toFixed(2)}%
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    🎯 TP {fmtPrice(t.tp_price)} • 🛑 SL {fmtPrice(t.sl_price)}
                  </div>
                  {cur != null && pnlNow != null && (
                    <div className="text-xs mt-1">
                      السعر الآن: <strong className={pnlNow >= 0 ? "text-bull" : "text-bear"}>{fmtPrice(cur)}</strong>
                      <span className="text-muted-foreground"> ({pnlNow >= 0 ? "+" : ""}{pnlNow.toFixed(2)}%)</span>
                    </div>
                  )}
                  {peakPct != null && (
                    <div className="text-xs mt-1">
                      أعلى سعر: <strong className="text-bull">{fmtPrice(t.peak_price!)}</strong>
                      <span className="text-muted-foreground"> ({peakPct >= 0 ? "+" : ""}{peakPct.toFixed(2)}%)</span>
                      {hitTp && <span className="mr-2 text-[10px] font-bold text-bull">🎯 لمس TP</span>}
                    </div>
                  )}
                  {t.seconds_to_tp != null && (
                    <div className="text-xs mt-1 text-bull font-semibold">
                      ⏱️ الوصول للهدف: {fmtDuration(t.seconds_to_tp)} ({t.seconds_to_tp} ث)
                    </div>
                  )}
                  {t.seconds_to_tp == null && t.seconds_to_peak != null && (
                    <div className="text-[11px] mt-1 text-muted-foreground">
                      ⏱️ الوصول لأعلى سعر: {fmtDuration(t.seconds_to_peak)} ({t.seconds_to_peak} ث)
                    </div>
                  )}
                </div>
                <div className="mr-auto text-left">
                  {t.status === "open" ? (
                    <span className="text-muted-foreground font-semibold">⏳ مفتوحة</span>
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

      <div className="rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground space-y-1">
        <div className="font-semibold text-foreground">📚 الاستراتيجية بالتفصيل:</div>
        <div>• <b>الدخول:</b> عند هبوط 2.5% من فتح اليوم (بعد أول 5 دقائق).</div>
        <div>• <b>الخروج:</b> TP +3.0% (لحظي عند سعر المشتري وسيولة {">"}150k)، SL −1.0%، خروج ذكي، إقفال 14:25.</div>
        <div>• <b>حجم الصفقة:</b> 20,000 ج، بحد أقصى 5 صفقات ذهبية في اليوم.</div>

        <div>• <b>العمولة محسوبة:</b> 3 ج + 0.03% لكل جانب (ثاندر).</div>
        <div>• <b>الاختبار الحقيقي:</b> 26 يوم من live_ticks — +680 EGP/يوم (سيناريو أسوأ) إلى +1,674 EGP/يوم (بدون انزلاق).</div>
      </div>
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