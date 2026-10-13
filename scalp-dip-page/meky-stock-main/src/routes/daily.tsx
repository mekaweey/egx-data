import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { getDailyOnePercent, type DailyOnePercentPick } from "@/lib/scan/tomorrow.functions";
import { getLiveQuotes, type LiveQuoteLite } from "@/lib/today/live-quote.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { LivePriceCard, MarketBadge } from "@/components/live-price-card";
import { BuyNowButton } from "@/components/buy-now-button";

export const Route = createFileRoute("/daily")({
  head: () => ({
    meta: [
      { title: "صفقة اليوم — هدف +1٪ وخروج فوري" },
      { name: "description", content: "سهم واحد كل يوم باحتمال عالٍ لتحقيق +1٪ خلال الجلسة. بيع فوراً عند الهدف." },
    ],
  }),
  component: DailyPage,
});

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || Number.isNaN(n) ? "—" : n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });

const bare = (symbol: string) => symbol.replace(/\.CA$/i, "").toUpperCase();

function LiveTape({ quotes, marketOpen, loading }: { quotes: LiveQuoteLite[]; marketOpen: boolean; loading: boolean }) {
  return (
    <div className="mb-4 rounded-xl border border-primary/30 bg-primary/10 p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 font-bold text-primary">
          <MarketBadge open={marketOpen} />
          <span>متابعة لحظية للأسهم المرشحة</span>
        </div>
        <span className="text-muted-foreground">{marketOpen ? "تحديث كل 5 ثواني" : "آخر أسعار متاحة — تحديث كل 30 ثانية"}</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
        {quotes.filter((q) => q.price > 0).map((q) => (
          <div key={q.symbol} className="min-w-32 rounded-lg border border-border bg-card px-3 py-2">
            <div className="font-bold">{q.symbol}</div>
            <div className="tabular-nums">{fmt(q.price)}</div>
            <div className={`tabular-nums ${q.change_pct >= 0 ? "text-bull" : "text-bear"}`}>{q.change_pct >= 0 ? "+" : ""}{fmt(q.change_pct, 2)}%</div>
          </div>
        ))}
        {loading && <span className="py-3 text-muted-foreground">جاري جلب اللايف…</span>}
      </div>
    </div>
  );
}

function Alt({ p, live, marketOpen }: { p: DailyOnePercentPick; live?: LiveQuoteLite; marketOpen: boolean }) {
  return (
    <Link to="/stock/$symbol" params={{ symbol: p.symbol }}
      className="block rounded-xl border border-border bg-card p-3 hover:border-primary/50">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-bold">{p.name_ar} <span className="text-xs text-muted-foreground">{p.symbol}</span></div>
          <div className="text-[11px] text-muted-foreground">
            حركة ~{fmt(p.expected_swing_pct, 1)}٪ • ثقة {p.confidence}٪ • وزن <strong className="text-foreground">{p.position_size_pct}٪</strong>
          </div>
        </div>
        <div className="text-end text-xs">
          <div>دخول <strong>{fmt(p.entry)}</strong></div>
          <div className="text-bull">هدف {fmt(p.target)} (+{fmt(p.target_pct, 1)}٪)</div>
        </div>
      </div>
      <div className="mt-2">
        <LivePriceCard symbol={bare(p.symbol)} quote={live} entry={p.entry} marketOpen={marketOpen} size="sm" />
      </div>
    </Link>
  );
}

function DailyPage() {
  const fetchLiveBatch = useServerFn(getLiveQuotes);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["daily-one-percent"],
    queryFn: () => getDailyOnePercent(),
    refetchInterval: 3 * 60 * 1000,
  });

  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState<string | null>(null);
  const [marketOpen, setMarketOpen] = useState(() => getMarketStatus().isOpen);

  useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5000);
    return () => clearInterval(id);
  }, []);

  const liveSymbols = useMemo(() => {
    const symbols = [data?.pick, ...(data?.alternatives ?? [])]
      .map((x) => x?.symbol)
      .filter((x): x is string => Boolean(x));
    return Array.from(new Set(symbols.map(bare)));
  }, [data?.pick, data?.alternatives]);

  const liveBatch = useQuery({
    queryKey: ["daily-live-quotes", liveSymbols.join(",")],
    queryFn: () => fetchLiveBatch({ data: { symbols: liveSymbols } }),
    enabled: liveSymbols.length > 0,
    refetchInterval: marketOpen ? 5_000 : 30_000,
    refetchIntervalInBackground: true,
    staleTime: marketOpen ? 2_000 : 15_000,
  });

  const liveBySymbol = useMemo(() => {
    const map = new Map<string, LiveQuoteLite>();
    for (const q of liveBatch.data ?? []) map.set(q.symbol, q);
    return map;
  }, [liveBatch.data]);

  const liveFor = (symbol: string) => liveBySymbol.get(bare(symbol));

  // 🔄 إعادة ترتيب لحظية حسب "الصعود المتبقي للهدف".
  // السهم اللي لسه قدامه أكبر مسافة للهدف (مضروبة في الثقة) يبقى رقم 1.
  // السهم اللي صعد خلاص و قرب من الهدف ينزل تحت، و الي تعدى الهدف يتشال.
  // لو السوق مقفول أو مفيش لايف كافي → نرجع لترتيب النموذج الأصلي.
  const reranked = useMemo(() => {
    if (!data?.pick) return { pick: null as DailyOnePercentPick | null, alternatives: [] as DailyOnePercentPick[] };
    const all = [data.pick, ...(data.alternatives ?? [])];
    const withLive = all.filter((x) => {
      const q = liveBySymbol.get(bare(x.symbol));
      return q && q.price > 0 && Number.isFinite(q.change_pct);
    });
    if (!marketOpen || withLive.length < 2) {
      return { pick: data.pick, alternatives: data.alternatives ?? [] };
    }
    // remaining upside (%) = (target - currentPrice) / currentPrice * 100
    // score = remaining × (confidence / 100). أعلى نقاط = أكبر فرصة صعود متبقية.
    const scoreOf = (x: DailyOnePercentPick) => {
      const q = liveBySymbol.get(bare(x.symbol));
      const price = q && q.price > 0 ? q.price : x.entry;
      if (!(price > 0) || !(x.target > 0)) return -999;
      const remaining = ((x.target - price) / price) * 100;
      return remaining * ((x.confidence ?? 50) / 100);
    };
    const sorted = [...all]
      .map((x) => ({ x, s: scoreOf(x) }))
      // شيل اللي وصل/تعدى الهدف (الصعود المتبقي ≤ 0)
      .filter((it) => it.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((it) => it.x);
    if (sorted.length === 0) return { pick: data.pick, alternatives: data.alternatives ?? [] };
    return { pick: sorted[0], alternatives: sorted.slice(1) };
  }, [data?.pick, data?.alternatives, liveBySymbol, marketOpen]);

  const p = reranked.pick;
  const reorderedByLive = !!(p && data?.pick && p.symbol !== data.pick.symbol);

  async function runInstantTrain() {
    setTraining(true);
    setTrainMsg("جاري التدريب الفوري السريع...");
    try {
      const r = await fetch("/api/public/hooks/instant-train", { method: "POST" });
      if (!r.ok) {
        const txt = await r.text().catch(() => "");
        throw new Error(`HTTP ${r.status} — ${txt.slice(0, 120) || "النسخة المنشورة قديمة، انشر الموقع تاني"}`);
      }
      const j = await r.json();
      if (j?.ok === false) {
        throw new Error(j.error || j.hint || "السيرفر رجّع فشل");
      }
      const trades = (j?.backtest?.trades ?? j?.backtest?.total_trades) ?? "?";
      const rules = j?.adversarial?.rules_added ?? 0;
      const models = j?.weights?.models ?? 0;
      setTrainMsg(`✅ تم: ${trades} صفقة • ${models} موديل أُعيد توزينه • ${rules} قاعدة فشل جديدة`);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTrainMsg(`❌ فشل التدريب — ${msg}`);
    } finally {
      setTraining(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">صفقة اليوم</h1>
          <p className="mt-1 text-sm text-muted-foreground">هدف +1٪ • خروج فوري عند الوصول</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runInstantTrain} disabled={training}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {training ? "يتعلّم..." : "⚡ تعلّم فوري"}
          </button>
          <button onClick={() => refetch()} disabled={isFetching}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary">
            {isFetching ? "..." : "تحديث"}
          </button>
          <Link to="/learning" className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary">
            🧠 التعلّم
          </Link>
        </div>
      </div>

      {trainMsg && (
        <div className="mb-4 rounded-lg border border-border bg-card px-4 py-2 text-sm">{trainMsg}</div>
      )}

      {isLoading && <div className="text-center text-muted-foreground">جاري التحميل...</div>}

      {data && !isLoading && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-full px-3 py-1 ${
            data.market_regime === "bullish" ? "bg-bull/20 text-bull" :
            data.market_regime === "bearish" ? "bg-bear/20 text-bear" :
            "bg-muted text-muted-foreground"
          }`}>
            السوق: {data.market_regime === "bullish" ? "صاعد 🟢" : data.market_regime === "bearish" ? "هابط 🔴" : data.market_regime === "neutral" ? "جانبي 🟡" : "غير محدد"}
          </span>
          {!data.noTrade && (
            <span className="rounded-full bg-card border border-border px-3 py-1">
              تعرّض: <strong>{data.total_exposure_pct}٪</strong> • كاش: <strong>{data.cash_pct}٪</strong>
            </span>
          )}
          {data.news_warnings.length > 0 && (
            <span className="rounded-full bg-bear/15 text-bear px-3 py-1">
              ⚠️ {data.news_warnings.length} سهم مستبعد لأخبار سلبية
            </span>
          )}
        </div>
      )}

      {liveSymbols.length > 0 && (
        <LiveTape quotes={liveBatch.data ?? []} marketOpen={marketOpen} loading={liveBatch.isLoading || liveBatch.isFetching} />
      )}

      {data?.noTrade && (
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-5xl">🛑</div>
          <h2 className="mt-4 text-xl font-bold">مفيش صفقة النهارده</h2>
          <p className="mt-2 text-sm text-muted-foreground">{data.reason}</p>
          <p className="mt-3 text-xs text-muted-foreground">رأس مالك أهم من صفقة ضعيفة.</p>
        </div>
      )}

      {p && (
        <>
          <Link to="/stock/$symbol" params={{ symbol: p.symbol }}
            className="block rounded-2xl border-2 border-bull/60 bg-gradient-to-br from-bull/10 to-card p-6 shadow-xl shadow-bull/10 transition hover:scale-[1.01]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl">🎯</span>
                  <h2 className="text-2xl font-bold">{p.name_ar}</h2>
                  <span className="text-sm text-muted-foreground">{p.symbol}</span>
                </div>
                {p.sector_ar && <p className="mt-1 text-xs text-muted-foreground">{p.sector_ar}</p>}
                {reorderedByLive && (
                  <p className="mt-1 text-[11px] text-bull">⚡ تم تقديمه لأن قدامه أكبر مسافة صعود للهدف</p>
                )}
              </div>
              <div className="text-end">
                <div className="rounded-full bg-bull/20 px-3 py-1 text-xs font-bold text-bull">شراء</div>
                <div className="mt-1 text-xs text-muted-foreground">ثقة {p.confidence}٪ • وزن {p.position_size_pct}٪</div>
              </div>
            </div>

            <div className="mt-5">
              <LivePriceCard symbol={bare(p.symbol)} quote={liveFor(p.symbol)} entry={p.entry} marketOpen={marketOpen} size="lg" />
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-background/50 p-3">
                <div className="text-[11px] text-muted-foreground">سعر الدخول</div>
                <div className="mt-1 text-lg font-bold">{fmt(p.entry)}</div>
              </div>
              <div className="rounded-lg bg-bull/15 p-3">
                <div className="text-[11px] text-muted-foreground">الهدف (+{fmt(p.target_pct, 1)}٪) — بِيع فوراً</div>
                <div className="mt-1 text-lg font-bold text-bull">{fmt(p.target)}</div>
              </div>
              <div className="rounded-lg bg-bear/15 p-3">
                <div className="text-[11px] text-muted-foreground">وقف الخسارة (-{fmt(p.stop_pct, 1)}٪)</div>
                <div className="mt-1 text-lg font-bold text-bear">{fmt(p.stop)}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border p-2">
                <span className="text-muted-foreground">حركة السهم اليومية المتوقعة:</span>{" "}
                <strong>~{fmt(p.expected_swing_pct, 1)}٪</strong>
              </div>
              <div className="rounded-lg border border-border p-2">
                <span className="text-muted-foreground">اتفاق الموديلات:</span>{" "}
                <strong>{p.ensemble_agreement}/5</strong>
              </div>
            </div>

            {p.symbol_history_n > 0 && (
              <div className="mt-3 text-[11px] text-muted-foreground">
                أداء تاريخي: {fmt((p.symbol_win_rate ?? 0) * 100, 0)}٪ نجاح من {p.symbol_history_n} توصية
              </div>
            )}

            {p.reasons_ar.length > 0 && (
              <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                {p.reasons_ar.map((r, i) => <li key={i}>• {r}</li>)}
              </ul>
            )}
          </Link>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <BuyNowButton
              symbol={p.symbol}
              name={p.name_ar}
              entry={p.entry}
              target={p.target}
              stop={p.stop}
              maxHoldDays={1}
            />
            <span className="text-xs text-muted-foreground">
              لو اشتريت السهم ده فعلاً — اضغط هنا والسيستم هيتابعه ويبعتلك إشعار وقت البيع
            </span>
          </div>

          <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground">
            <strong className="text-foreground">خطة التنفيذ:</strong>
            <ol className="mt-2 list-decimal space-y-1 ps-5">
              <li>وزّع رأس مالك: <strong>{p.position_size_pct}٪</strong> في السهم الأساسي + الباقي على البدائل (إجمالي {data?.total_exposure_pct}٪).</li>
              <li>ادخل قريب من <strong>{fmt(p.entry)}</strong> عند الافتتاح.</li>
              <li>ضع أمر بيع تلقائي عند <strong>{fmt(p.target)}</strong> (+{fmt(p.target_pct, 1)}٪).</li>
              <li>ضع وقف خسارة عند <strong>{fmt(p.stop)}</strong> (-{fmt(p.stop_pct, 1)}٪).</li>
              <li>🔒 <strong>Trailing Stop:</strong> لو وصل السعر <strong>{fmt(p.trail_to_be_at)}</strong> (+0.6٪)، حرّك الستوب لـ <strong>{fmt(p.entry)}</strong> (break-even). خسارة 0٪ مضمونة.</li>
              <li>لو وصل الإقفال ومحققش الهدف → اخرج بدون انتظار. بكره صفقة جديدة.</li>
            </ol>
          </div>

          {reranked.alternatives.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-bold text-muted-foreground">باقي المحفظة (موزّعة معاه):</h3>
              <div className="space-y-2">
                {reranked.alternatives.map((a) => (
                  <Alt key={a.symbol} p={a} live={liveFor(a.symbol)} marketOpen={marketOpen} />
                ))}
              </div>
            </div>
          )}

          {data && data.news_warnings.length > 0 && (
            <div className="mt-6 rounded-xl border border-bear/30 bg-bear/5 p-3 text-xs">
              <strong className="text-bear">⚠️ أسهم استُبعدت بسبب أخبار سلبية:</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {data.news_warnings.slice(0, 5).map((w) => (
                  <li key={w.symbol}>• <strong>{w.symbol}</strong> — {w.reason}</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
