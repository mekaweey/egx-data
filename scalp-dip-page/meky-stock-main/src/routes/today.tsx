import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { getTodayPick, type TodayPick } from "@/lib/today/today.functions";
import { getLiveQuote, getLiveQuotes, type LiveQuoteLite } from "@/lib/today/live-quote.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { BuyNowButton } from "@/components/buy-now-button";
import { supabase } from "@/integrations/supabase/client";
import { ThunderConnectionBanner } from "@/components/thunder-connection-banner";

export const Route = createFileRoute("/today")({
  head: () => ({
    meta: [
      { title: "صفقة النهارده — النظام الذكي" },
      { name: "description", content: "سهم واحد كل يوم بثقة عالية + Kelly sizing + حماية تلقائية" },
    ],
  }),
  component: TodayPage,
});

function fmt(n: number, d = 2) {
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}
function fmtEGP(n: number) {
  return Math.round(n).toLocaleString("en-EG") + " ج.م";
}

function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 85 ? "bg-bull" : value >= 75 ? "bg-primary" : "bg-warn";
  return (
    <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
    </div>
  );
}

function PickHistoryRow({ p, livePrice }: { p: TodayPick; livePrice?: number }) {
  const badge =
    p.status === "win" ? "bg-bull/20 text-bull" :
    p.status === "loss" ? "bg-bear/20 text-bear" :
    p.status === "expired" ? "bg-muted text-muted-foreground" :
    "bg-primary/20 text-primary";
  const livePct =
    p.status === "open" && livePrice && livePrice > 0 && p.entry > 0
      ? ((livePrice - p.entry) / p.entry) * 100
      : null;
  return (
    <tr className="border-b border-border">
      <td className="py-2 px-2 text-xs text-muted-foreground">{p.date}</td>
      <td className="py-2 px-2 font-semibold">{p.name_ar ?? p.symbol}</td>
      <td className="py-2 px-2 text-xs tabular-nums">{fmt(p.confidence, 0)}%</td>
      <td className="py-2 px-2">
        <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${badge}`}>
          {p.status === "win" ? "ربح" : p.status === "loss" ? "خسارة" : p.status === "expired" ? "منتهي" : "مفتوح"}
        </span>
      </td>
      <td className="py-2 px-2 text-xs tabular-nums font-bold">
        {livePct != null ? (
          <span className={`inline-flex items-center gap-1 ${livePct > 0 ? "text-bull" : livePct < 0 ? "text-bear" : ""}`}>
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-bull">
              <span className="absolute inset-0 animate-ping rounded-full bg-bull/60" />
            </span>
            {livePct > 0 ? "+" : ""}{fmt(livePct, 2)}%
          </span>
        ) : p.pnlPct != null ? (
          <span className={(p.pnlPct ?? 0) > 0 ? "text-bull" : (p.pnlPct ?? 0) < 0 ? "text-bear" : ""}>
            {p.pnlPct > 0 ? "+" : ""}{fmt(p.pnlPct, 2)}%
          </span>
        ) : (
          "—"
        )}
      </td>
    </tr>
  );
}

function TodayPage() {
  const queryClient = useQueryClient();
  const fetchToday = useServerFn(getTodayPick);
  const fetchLive = useServerFn(getLiveQuote);
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const [capital, setCapital] = useState(150_000);
  const [marketOpen, setMarketOpen] = useState(() => getMarketStatus().isOpen);

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const s = typeof window !== "undefined" ? localStorage.getItem("plan.capital") : null;
    if (s) setCapital(Number(s) || 150_000);
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("today-pick-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_picks" }, () => {
        queryClient.invalidateQueries({ queryKey: ["today"] });
        queryClient.invalidateQueries({ queryKey: ["live-quote"] });
        queryClient.invalidateQueries({ queryKey: ["live-quotes"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!marketOpen) return;
    let cancelled = false;
    const runLiveMonitor = async () => {
      try {
        await fetch("/api/public/hooks/live-tick-poll", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        await fetch("/api/public/hooks/live-pick-monitor", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
        if (!cancelled) {
          queryClient.invalidateQueries({ queryKey: ["today"] });
          queryClient.invalidateQueries({ queryKey: ["live-quote"] });
          queryClient.invalidateQueries({ queryKey: ["live-quotes"] });
        }
      } catch {
        // background refresh only; the normal quote polling keeps the UI alive
      }
    };
    runLiveMonitor();
    const id = window.setInterval(runLiveMonitor, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [marketOpen, queryClient]);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["today"],
    queryFn: () => fetchToday(),
    refetchInterval: marketOpen ? 60_000 : 5 * 60_000,
  });

  const pick = data?.pick;

  // Live quote — polls every 30s while the market is open
  const live = useQuery({
    queryKey: ["live-quote", pick?.symbol],
    queryFn: () => fetchLive({ data: { symbol: pick!.symbol } }),
    enabled: !!pick?.symbol,
    refetchInterval: marketOpen ? 10_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });

  // Batch live quotes for every pick shown in the history table
  const historySymbols = Array.from(
    new Set((data?.recentPicks ?? []).map((p) => p.symbol)),
  );
  const liveBatch = useQuery({
    queryKey: ["live-quotes", historySymbols.join(",")],
    queryFn: () => fetchLiveBatch({ data: { symbols: historySymbols } }),
    enabled: historySymbols.length > 0,
    refetchInterval: marketOpen ? 10_000 : false,
    refetchIntervalInBackground: false,
    staleTime: 5_000,
  });
  const livePriceBySymbol = new Map<string, number>(
    (liveBatch.data ?? []).map((q: LiveQuoteLite) => [q.symbol, q.price]),
  );

  const canExecute = marketOpen;
  const investAmount = pick ? capital * pick.kellyPct : 0;
  const shares = pick ? Math.floor(investAmount / pick.entry) : 0;
  const realCost = pick ? shares * pick.entry : 0;
  const winEGP = pick ? shares * (pick.target - pick.entry) : 0;
  const lossEGP = pick ? shares * (pick.entry - pick.stop) : 0;
  const livePnlEGP = pick && live.data?.pnlPct != null
    ? shares * (live.data.price - pick.entry)
    : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold">
              🎯 صفقة <span className="text-primary">النهارده</span>
            </h1>
            <p className="text-xs text-muted-foreground">سهم واحد · ثقة عالية · حماية تلقائية</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
            >
              🔄 تحديث
            </button>
            <Link to="/plan" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">الخطة</Link>
            <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">← الرئيسية</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6 space-y-6">
        <ThunderConnectionBanner />
        {/* Stats from feedback loop */}
        {data && (
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">دقة آخر 30 صفقة</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">
                {fmt(data.recentStats.accuracy, 0)}%
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">متوسط ربح/صفقة</div>
              <div className={`mt-1 text-2xl font-bold tabular-nums ${data.recentStats.avgPnl > 0 ? "text-bull" : data.recentStats.avgPnl < 0 ? "text-bear" : ""}`}>
                {data.recentStats.avgPnl > 0 ? "+" : ""}{fmt(data.recentStats.avgPnl, 2)}%
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="text-xs text-muted-foreground">عدد الصفقات</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{data.recentStats.trades}</div>
            </div>
            <div className={`rounded-xl border p-4 ${data.circuitOpen ? "border-bear/40 bg-bear/10" : "border-bull/40 bg-bull/10"}`}>
              <div className="text-xs text-muted-foreground">حالة النظام</div>
              <div className={`mt-1 text-lg font-bold ${data.circuitOpen ? "text-bear" : "text-bull"}`}>
                {data.circuitOpen ? "🛡️ متوقف للحماية" : "✅ شغّال"}
              </div>
            </div>
          </section>
        )}

        {/* Capital */}
        <section className="rounded-xl border border-border bg-card p-4">
          <label className="text-sm font-semibold text-muted-foreground">رأس مالك (جنيه)</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="number"
              value={capital}
              onChange={(e) => {
                const v = Math.max(1000, Number(e.target.value) || 0);
                setCapital(v);
                if (typeof window !== "undefined") localStorage.setItem("plan.capital", String(v));
              }}
              className="w-48 rounded-lg border border-border bg-background px-3 py-2 text-lg font-bold tabular-nums"
            />
          </div>
        </section>

        {/* Today's pick */}
        {isLoading && <div className="rounded-xl border border-border bg-card p-8 text-center">⏳ بنحلل السوق…</div>}

        {!isLoading && !pick && (
          <div className="rounded-xl border border-warn/40 bg-warn/10 p-6 text-center">
            <div className="text-lg font-bold">{data?.message ?? "مفيش فرصة النهارده"}</div>
            <p className="mt-2 text-sm text-muted-foreground">
              النظام مش هيدخلك في صفقة لو الثقة أقل من 70%. ده اللي بيحميك على المدى الطويل.
            </p>
          </div>
        )}

        {pick && (
          <section className={`rounded-2xl border-2 p-6 ${data?.circuitOpen ? "border-bear/40 bg-bear/5" : "border-primary/50 bg-primary/5"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs text-muted-foreground">السهم المختار اليوم</div>
                <h2 className="text-3xl font-extrabold mt-1">{pick.name_ar ?? pick.symbol}</h2>
                <p className="text-sm text-muted-foreground">{pick.symbol}</p>
                {pick.isNewsElite && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600">
                    <span>🔥</span>
                    <span>Elite News Catalyst</span>
                    {pick.newsEliteScore != null && <span className="opacity-70">· {Math.round(pick.newsEliteScore)}/100</span>}
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-xs text-muted-foreground">درجة الثقة</div>
                <div className="text-3xl font-extrabold text-primary tabular-nums">{fmt(pick.confidence, 0)}%</div>
                <div className="mt-2 w-32"><ConfidenceBar value={pick.confidence} /></div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-card p-3 text-center">
                <div className="text-xs text-muted-foreground">سعر الدخول</div>
                <div className="mt-1 text-xl font-bold tabular-nums">{fmt(pick.entry)}</div>
              </div>
              <div className="rounded-xl bg-bull/10 border border-bull/30 p-3 text-center">
                <div className="text-xs text-muted-foreground">الهدف (+{fmt(pick.targetPct, 1)}%)</div>
                <div className="mt-1 text-xl font-bold text-bull tabular-nums">{fmt(pick.target)}</div>
              </div>
              <div className="rounded-xl bg-bear/10 border border-bear/30 p-3 text-center">
                <div className="text-xs text-muted-foreground">وقف الخسارة (-{fmt(pick.stopPct, 1)}%)</div>
                <div className="mt-1 text-xl font-bold text-bear tabular-nums">{fmt(pick.stop)}</div>
              </div>
            </div>

            {/* LIVE quote banner */}
            {live.data && live.data.price > 0 && (
              <div
                className={`mt-4 rounded-xl border-2 p-4 ${
                  live.data.recommendation === "sell_target"
                    ? "border-bull bg-bull/10"
                    : live.data.recommendation === "sell_stop"
                    ? "border-bear bg-bear/10"
                    : live.data.recommendation === "trail"
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {marketOpen && (
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-bull">
                        <span className="absolute inset-0 animate-ping rounded-full bg-bull/60" />
                      </span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">
                      {marketOpen ? "السعر اللحظي" : "آخر سعر"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {new Date(live.data.fetchedAt).toLocaleTimeString("ar-EG")}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[11px] text-muted-foreground">السعر الآن</div>
                    <div className="text-2xl font-extrabold tabular-nums">{fmt(live.data.price)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">من سعر الدخول</div>
                    <div className={`text-2xl font-extrabold tabular-nums ${(live.data.pnlPct ?? 0) > 0 ? "text-bull" : (live.data.pnlPct ?? 0) < 0 ? "text-bear" : ""}`}>
                      {live.data.pnlPct != null ? `${live.data.pnlPct > 0 ? "+" : ""}${fmt(live.data.pnlPct, 2)}%` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-muted-foreground">ربح/خسارة فعلية</div>
                    <div className={`text-2xl font-extrabold tabular-nums ${livePnlEGP > 0 ? "text-bull" : livePnlEGP < 0 ? "text-bear" : ""}`}>
                      {livePnlEGP > 0 ? "+" : ""}{fmtEGP(livePnlEGP)}
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm font-bold">{live.data.message}</div>
                {live.data.liveConfidence != null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>الثقة المتكيّفة</span>
                      <span className="tabular-nums">{fmt(live.data.liveConfidence, 0)}%</span>
                    </div>
                    <ConfidenceBar value={live.data.liveConfidence} />
                  </div>
                )}
              </div>
            )}

            {/* Buy-now eligibility — answers "هل لسه ينفع أشتري دلوقتي؟" */}
            {live.data && live.data.price > 0 && (() => {
              const price = live.data.price;
              const pct = ((price - pick.entry) / pick.entry) * 100;
              const hitStop = price <= pick.stop;
              const hitTarget = price >= pick.target;
              const tooHigh = pct > 1.5; // moved too far above entry
              const ok = marketOpen && !hitStop && !hitTarget && !tooHigh;
              const liveShares = Math.floor(investAmount / price);
              const liveCost = liveShares * price;
              const tone = ok
                ? "border-bull bg-bull/10 text-bull"
                : hitTarget
                ? "border-primary bg-primary/10 text-primary"
                : "border-warn bg-warn/10 text-warn";
              const title = !marketOpen
                ? "⏰ السوق مقفول — استنى الفتحة الجاية"
                : hitStop
                ? "❌ ضرب الستوب — متشتريش النهارده"
                : hitTarget
                ? "🎯 وصل الهدف — فات وقت الشراء"
                : tooHigh
                ? `⚠️ السعر طلع +${fmt(pct, 2)}% فوق الدخول — استنى رجوع للسعر ${fmt(pick.entry)} أو سيبها`
                : `✅ لسه ينفع تشتري دلوقتي بسعر ${fmt(price)} (${pct >= 0 ? "+" : ""}${fmt(pct, 2)}% من الدخول)`;
              return (
                <div className={`mt-4 rounded-xl border-2 p-4 ${tone}`}>
                  <div className="text-sm font-extrabold">{title}</div>
                  {ok && (
                    <div className="mt-2 text-xs text-foreground/80">
                      الكمية المعدّلة بالسعر الحالي: <b className="tabular-nums">{liveShares.toLocaleString("en-EG")}</b> سهم
                      · التكلفة: <b className="tabular-nums">{fmtEGP(liveCost)}</b>
                      · الستوب ثابت عند <b className="tabular-nums">{fmt(pick.stop)}</b>
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="mt-5 rounded-xl border border-border bg-card p-4">
              <div className="text-sm font-bold mb-2">💼 الكمية الموصى بها (Kelly Sizing)</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">نسبة من رأس المال</div><div className="font-bold tabular-nums">{fmt(pick.kellyPct * 100, 0)}%</div></div>
                <div><div className="text-xs text-muted-foreground">عدد الأسهم</div><div className="font-bold tabular-nums">{shares.toLocaleString("en-EG")}</div></div>
                <div><div className="text-xs text-muted-foreground">المبلغ المستثمر</div><div className="font-bold tabular-nums">{fmtEGP(realCost)}</div></div>
                <div><div className="text-xs text-muted-foreground">مدة الاحتفاظ</div><div className="font-bold tabular-nums">حتى {pick.maxHoldDays} أيام</div></div>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm">
                <span className="text-bull">🟢 لو وصل الهدف: <b>+{fmtEGP(winEGP)}</b></span>
                <span className="text-bear">🔴 لو ضرب الستوب: <b>-{fmtEGP(lossEGP)}</b></span>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <BuyNowButton
                  symbol={pick.symbol}
                  name={pick.name_ar}
                  entry={pick.entry}
                  target={pick.target}
                  stop={pick.stop}
                  maxHoldDays={pick.maxHoldDays}
                  defaultShares={shares}
                  disabled={!canExecute}
                  disabledReason="السوق مغلق — التنفيذ متاح أثناء جلسة التداول فقط"
                />
                <span className="text-xs text-muted-foreground">
                  لما تشتري السهم اضغط هنا — السيستم هيتابعه ويبعتلك إشعار وقت البيع
                </span>
              </div>
            </div>

            {pick.reasons.length > 0 && (
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <div className="text-sm font-bold mb-2">📊 ليه اختار السهم ده؟</div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                  {pick.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-bull">✓</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-4 rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              ⚙️ النظام بيشتغل أوتوماتيك: بيختار سهم واحد كل يوم، بيتابع النتيجة، وبيتوقف لوحده لو خسر 3 صفقات
              متتالية. الـ Kelly Sizing بيكبّر الكمية لما الثقة عالية، وبيصغّرها لما تقل.
            </div>
          </section>
        )}

        {/* History */}
        {data && data.recentPicks.length > 0 && (
          <section className="rounded-xl border border-border bg-card p-5">
            <h2 className="text-lg font-bold">📜 آخر 10 صفقات (سجل الشفافية)</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="py-2 px-2 text-right">التاريخ</th>
                    <th className="py-2 px-2 text-right">السهم</th>
                    <th className="py-2 px-2 text-right">الثقة</th>
                    <th className="py-2 px-2 text-right">الحالة</th>
                    <th className="py-2 px-2 text-right">النتيجة</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPicks.map((p) => (
                    <PickHistoryRow
                      key={p.date + p.symbol}
                      p={p}
                      livePrice={livePriceBySymbol.get(p.symbol.replace(/\.CA$/i, "").toUpperCase())}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}