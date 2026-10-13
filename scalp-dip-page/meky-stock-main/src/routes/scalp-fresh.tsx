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
};

const STRATEGY = "scalp-mr15-fresh";

const getScalpFreshToday = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_ts, exit_reason, pnl, status, trade_date")
    .eq("trade_date", today)
    .eq("strategy", STRATEGY)
    .order("entry_ts", { ascending: false });
  if (error) throw error;
  const trades = (data || []) as Trade[];
  const openSyms = Array.from(new Set(trades.filter(t => t.status === "open").map(t => t.symbol)));
  if (openSyms.length) {
    const dayStart = `${today}T07:00:00Z`;
    const { data: ticks } = await supabaseAdmin
      .from("live_ticks")
      .select("symbol, price, ts")
      .in("symbol", openSyms)
      .gte("ts", dayStart)
      .order("ts", { ascending: false });
    const latest = new Map<string, { price: number; ts: string }>();
    for (const t of ticks || []) {
      if (!latest.has(t.symbol)) latest.set(t.symbol, { price: Number(t.price), ts: t.ts as string });
    }
    for (const t of trades) {
      const l = latest.get(t.symbol);
      if (l) { t.current_price = l.price; t.current_price_ts = l.ts; }
    }
  }
  return { trades, date: today };
});

export const Route = createFileRoute("/scalp-fresh")({
  component: ScalpFreshPage,
  errorComponent: ({ error }) => <div className="p-6 text-destructive">خطأ: {error.message}</div>,
  notFoundComponent: () => <div className="p-6">غير موجود</div>,
  head: () => ({
    meta: [
      { title: "Scalp Fresh — تجربة سعر لحظي" },
      { name: "description", content: "نسخة تجريبية من Scalp تستخدم سعر لحظي للدخول." },
    ],
  }),
});

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { timeZone: "Africa/Cairo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function ScalpFreshPage() {
  const fetchTrades = useServerFn(getScalpFreshToday);
  const { data, refetch } = useQuery({
    queryKey: ["scalp-fresh-today"],
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
      .channel("scalp-fresh-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "paper_trades", filter: `strategy=eq.${STRATEGY}` },
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
          toast.success(`🔥 [FRESH] إشارة Scalp: ${t.symbol}`, { description: body, duration: 30_000 });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try { new Notification(`🔥 [FRESH] ${t.symbol}`, { body, tag: t.id, requireInteraction: true }); } catch {}
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
          beep(t.pnl && t.pnl > 0 ? 1320 : 520);
          const pnl = Number(t.pnl ?? 0);
          toast(`${pnl >= 0 ? "🎯" : "🛑"} خروج [FRESH]: ${t.symbol}`, {
            description: `${t.exit_reason ?? ""} • ${pnl >= 0 ? "+" : ""}${pnl.toFixed(0)} EGP`,
            duration: 20_000,
          });
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
  const MAX_DRIFT_PCT = 0.003;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-5">
      <ThunderConnectionBanner />
      <header className="flex items-center justify-between">
        <div>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-2">
            ← الرجوع للرئيسية
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            🧪 Scalp Fresh (تجريبي)
            <span className={`inline-block h-2.5 w-2.5 rounded-full bg-warn ${pulse % 2 ? "animate-ping" : ""}`} />
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            نسخة موازية تستخدم سعر لحظي للدخول. الأصلية شغّالة كما هي على /scalp.
          </p>
        </div>
        <button
          onClick={() => { ensureAudioUnlock(); beep(880); toast("الصوت مفعّل ✅"); }}
          className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          فعّل الصوت
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="إشارات اليوم" value={String(trades.length)} />
        <Stat label="مفتوحة / مقفولة" value={`${open.length} / ${closed.length}`} />
        <Stat label="PnL محقق" value={`${realized >= 0 ? "+" : ""}${realized.toFixed(0)} EGP`} tone={realized >= 0 ? "bull" : "bear"} />
        <Stat label="نسبة النجاح" value={`${winRate.toFixed(0)}%`} />
      </div>

      {trades.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 text-center text-muted-foreground">
          لسه مفيش إشارات. هتظهر هنا أول ما الـ cron يتفعّل على الـ hook الجديد.
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
                    </div>
                  )}
                </div>
                <div className="mr-auto text-left">
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