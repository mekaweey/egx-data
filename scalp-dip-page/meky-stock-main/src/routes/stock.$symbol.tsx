import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { getStockDetail, type StockDetailPayload } from "@/lib/scan/dashboard.functions";
import { getStockNews } from "@/lib/news/stock-news.functions";
import { getLiveQuote } from "@/lib/today/live-quote.functions";
import { getMarketStatus } from "@/lib/market-hours";
import { LivePriceCard } from "@/components/live-price-card";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/stock/$symbol")({
  component: StockDetailPage,
  errorComponent: StockErrorComponent,
  head: ({ params }) => ({
    meta: [
      { title: `${params.symbol} — تحليل فني | EGX سكانر` },
      {
        name: "description",
        content: `التحليل الفني الكامل والتوصية الذكية لسهم ${params.symbol} في البورصة المصرية.`,
      },
    ],
  }),
});

function StockErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const { symbol } = Route.useParams();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-xl font-bold">حصل خطأ مؤقت في تحميل سهم {symbol}</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        ممكن يكون مزود الأسعار اللحظية مش راد دلوقتي. جرب تاني بعد ثانية أو ارجع للوحة.
      </p>
      {error?.message && (
        <pre dir="ltr" className="max-w-lg overflow-auto rounded bg-muted/30 p-2 text-[11px] text-muted-foreground">
          {error.message.slice(0, 240)}
        </pre>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="rounded bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          حاول تاني
        </button>
        <Link to="/" className="rounded border border-border bg-card px-4 py-2 text-sm">
          العودة للوحة
        </Link>
      </div>
    </div>
  );
}

const SIGNAL_LABELS: Record<string, { ar: string; cls: string }> = {
  strong_buy: { ar: "شراء قوي", cls: "bg-bull text-bull-foreground" },
  buy: { ar: "شراء", cls: "bg-bull/70 text-bull-foreground" },
  neutral: { ar: "محايد", cls: "bg-warn text-warn-foreground" },
  sell: { ar: "بيع", cls: "bg-bear/70 text-bear-foreground" },
  strong_sell: { ar: "بيع قوي", cls: "bg-bear text-bear-foreground" },
};

function fmt(n: number | string | null | undefined, digits = 2) {
  if (n == null) return "—";
  const v = typeof n === "string" ? Number(n) : n;
  if (Number.isNaN(v)) return "—";
  return v.toLocaleString("en-EG", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function Stat({ label, value, accent, tooltip }: { label: string; value: React.ReactNode; accent?: string; tooltip?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card/60 p-3" title={tooltip}>
      <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
        {label}
        {tooltip && <span className="cursor-help text-[10px] text-primary">ⓘ</span>}
      </div>
      <div className={`mt-1 text-sm font-semibold tabular-nums ${accent ?? ""}`}>{value}</div>
    </div>
  );
}

function StockDetailPage() {
  const { symbol } = Route.useParams();
  const fetchDetail = useServerFn(getStockDetail);
  const { data, isLoading, error } = useQuery<StockDetailPayload | null>({
    queryKey: ["stock-detail", symbol],
    queryFn: () => fetchDetail({ data: { symbol } }),
  });

  const fetchNews = useServerFn(getStockNews);
  const { data: news } = useQuery({
    queryKey: ["stock-news", symbol],
    queryFn: () => fetchNews({ data: { symbol } }),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
  });

  const [marketOpen, setMarketOpen] = useState(() => getMarketStatus().isOpen);
  useEffect(() => {
    const id = setInterval(() => setMarketOpen(getMarketStatus().isOpen), 5_000);
    return () => clearInterval(id);
  }, []);
  const fetchLive = useServerFn(getLiveQuote);
  const { data: live } = useQuery({
    queryKey: ["stock-live", symbol],
    queryFn: () => fetchLive({ data: { symbol } }),
    refetchInterval: marketOpen ? 10_000 : 60_000,
    refetchIntervalInBackground: false,
    staleTime: marketOpen ? 5_000 : 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        جاري التحميل…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background text-foreground">
        <p>لم يتم العثور على السهم {symbol}</p>
        <Link to="/" className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
          العودة للوحة
        </Link>
      </div>
    );
  }

  const { snapshot: snap, recommendation: reco, history, name_ar, sector_ar } = data;
  const sig = reco?.signal ? SIGNAL_LABELS[reco.signal] : null;
  const close = snap ? Number(snap.close) : history.at(-1)?.close ?? 0;
  const chgPct = snap?.change_pct != null ? Number(snap.change_pct) : 0;
  const chgPos = chgPct >= 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← العودة للوحة
          </Link>
          <h1 className="text-lg font-extrabold">
            <span className="text-primary">EGX</span> سكانر
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-card p-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-extrabold">{name_ar}</h2>
              <span className="text-sm text-muted-foreground">{symbol}</span>
            </div>
            {sector_ar && <p className="mt-1 text-xs text-muted-foreground">{sector_ar}</p>}
            <div className="mt-3 flex items-baseline gap-3">
              <span className="text-3xl font-bold tabular-nums">{fmt(close)}</span>
              <span className={`text-sm tabular-nums ${chgPos ? "text-bull" : "text-bear"}`}>
                {chgPos ? "+" : ""}{fmt(chgPct)}%
              </span>
            </div>
          </div>
          {sig && (
            <div className="text-end">
              <span className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${sig.cls}`}>
                {sig.ar}
              </span>
              <div className="mt-2 text-xs text-muted-foreground">
                الثقة: <span className="font-semibold text-foreground">{reco?.confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Live price */}
        <section className="mt-6">
          <LivePriceCard
            symbol={symbol}
            quote={live ? {
              symbol: live.symbol,
              price: live.price,
              change_pct: live.change_pct,
              open: 0,
              high: 0,
              low: 0,
              volume: live.volume,
              fetchedAt: live.fetchedAt,
              source: live.source,
              ageSec: live.ageSec,
            } : undefined}
            entry={reco?.entry_min != null ? Number(reco.entry_min) : undefined}
            marketOpen={marketOpen}
          />
          {live?.message && (
            <div className={`mt-2 rounded-lg border p-3 text-xs ${
              live.recommendation === "sell_target" ? "border-bull/50 bg-bull/10 text-bull" :
              live.recommendation === "sell_stop" ? "border-bear/50 bg-bear/10 text-bear" :
              live.recommendation === "trail" ? "border-primary/50 bg-primary/10 text-primary" :
              "border-border bg-muted/30 text-muted-foreground"
            }`}>
              {live.message}
            </div>
          )}
        </section>

        {/* Chart */}
        <section className="mt-6 rounded-xl border border-border bg-card p-5">
          <h3 className="mb-3 text-sm font-bold">الرسم البياني (آخر 90 يوماً)</h3>
          {history.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">لا توجد بيانات للرسم</div>
          ) : (
            <div className="h-72 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="px" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  {reco?.target != null && (
                    <ReferenceLine y={Number(reco.target)} stroke="var(--bull)" strokeDasharray="4 4" label={{ value: "الهدف", fill: "var(--bull)", fontSize: 10 }} />
                  )}
                  {reco?.stop_loss != null && (
                    <ReferenceLine y={Number(reco.stop_loss)} stroke="var(--bear)" strokeDasharray="4 4" label={{ value: "وقف", fill: "var(--bear)", fontSize: 10 }} />
                  )}
                  <Area type="monotone" dataKey="close" stroke="var(--primary)" fill="url(#px)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Recommendation */}
        {reco && (
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold">التوصية الذكية</h3>
            {(reco.entry_timing_ar || reco.expected_gain_pct != null) && (
              <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-primary/10 p-3 text-sm">
                {reco.entry_timing_ar && (
                  <span className="font-bold text-primary">⏱ {reco.entry_timing_ar}</span>
                )}
                {reco.expected_gain_pct != null && (
                  <span className="text-bull font-semibold">
                    ربح متوقع: +{fmt(reco.expected_gain_pct, 1)}%
                  </span>
                )}
                {reco.partial_exit_pct != null && (
                  <span className="text-muted-foreground">
                    بِع نصف عند ربح <span className="font-bold text-bull">+{fmt(reco.partial_exit_pct, 1)}%</span>
                  </span>
                )}
                {reco.max_hold_days != null && (
                  <span className="text-muted-foreground">
                    اخرج خلال <span className="font-bold text-foreground">{reco.max_hold_days} أيام</span> كحد أقصى
                  </span>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="دخول من" value={fmt(reco.entry_min)} tooltip="أقل سعر مناسب للدخول في الصفقة" />
              <Stat label="دخول إلى" value={fmt(reco.entry_max)} tooltip="أعلى سعر مناسب للدخول في الصفقة" />
              <Stat label="الهدف" value={fmt(reco.target)} accent="text-bull" tooltip="السعر المتوقع للبيع عنده لتحقيق ربح" />
              <Stat label="وقف الخسارة" value={fmt(reco.stop_loss)} accent="text-bear" tooltip="إذا نزل السعر لهذا المستوى، نبيع لتقليل الخسارة" />
              <Stat label="نسبة المخاطرة/العائد" value={fmt(reco.rr_ratio)} tooltip="R:R = الربح المتوقع ÷ الخسارة المحتملة. كلما زاد، كانت الصفقة أفضل" />
              <Stat label="حجم المركز" value={`${fmt(reco.position_size_pct)}%`} tooltip="نسبة رأس المال المقترحة للاستثمار في هذا السهم" />
              <Stat label="مدة التوصية" value={`${reco.timeframe_days ?? "—"} يوم`} tooltip="الفترة المتوقعة لتحقيق الهدف" />
              <Stat label="السعر عند التوصية" value={fmt(reco.price_at_reco)} tooltip="سعر الإغلاق وقت إصدار التوصية" />
            </div>

            {Array.isArray(reco.reasons_ar) && reco.reasons_ar.length > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-xs font-bold text-muted-foreground">أسباب التوصية</h4>
                <ul className="space-y-1.5">
                  {(reco.reasons_ar as string[]).map((reason, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="text-primary">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {reco.risk_note_ar && (
              <div className="mt-4 rounded-lg border border-warn/30 bg-warn/10 p-3 text-xs">
                <span className="font-bold">تنبيه مخاطر: </span>
                {reco.risk_note_ar}
              </div>
            )}
          </section>
        )}

        {/* Technical indicators */}
        {snap && (
          <section className="mt-6 rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-bold">المؤشرات الفنية</h3>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Stat label="RSI (14)" value={fmt(snap.rsi14, 1)} tooltip="مؤشر القوة النسبية (0-100). فوق 70 = مبالغ في الشراء، تحت 30 = مبالغ في البيع" />
              <Stat label="MACD" value={fmt(snap.macd, 3)} tooltip="خط MACD — يظهر اتجاه الزخم. إيجابي = صاعد" />
              <Stat label="MACD Signal" value={fmt(snap.macd_signal, 3)} tooltip="خط إشارة MACD — عبوره خط MACD يعطي إشارة" />
              <Stat label="MACD Hist" value={fmt(snap.macd_hist, 3)} tooltip="الفرق بين MACD وخط الإشارة — يدل على قوة الزخم" />
              <Stat label="EMA 9" value={fmt(snap.ema9)} tooltip="المتوسط المتحرك الأسي 9 أيام — قصير المدى" />
              <Stat label="EMA 21" value={fmt(snap.ema21)} tooltip="المتوسط المتحرك الأسي 21 يوم — متوسط المدى" />
              <Stat label="SMA 50" value={fmt(snap.sma50)} tooltip="المتوسط المتحرك البسيط 50 يوم — طويل المدى" />
              <Stat label="ATR (14)" value={fmt(snap.atr14, 3)} tooltip="متوسط النطاق الحقيقي — يقيس تذبذب السهم (ال volatility)" />
              <Stat label="Bollinger أعلى" value={fmt(snap.bb_upper)} tooltip="الحد العلوي لقناة بولينجر — السعر فوقها = مبالغة" />
              <Stat label="Bollinger وسط" value={fmt(snap.bb_mid)} tooltip="خط الوسط لقناة بولينجر = متوسط متحرك 20 يوم" />
              <Stat label="Bollinger أدنى" value={fmt(snap.bb_lower)} tooltip="الحد السفلي لقناة بولينجر — السعر تحتها = فرصة" />
              <Stat label="حجم نسبي" value={`×${fmt(snap.vol_ratio)}`} tooltip="حجم التداول اليوم مقابل المتوسط — فوق 1.5 = اهتمام" />
              <Stat label="دعم" value={fmt(snap.support)} tooltip="مستوى دعم تقني — السعر يميل للارتداد منه لأعلى" />
              <Stat label="مقاومة" value={fmt(snap.resistance)} tooltip="مستوى مقاومة تقني — السعر يصعب اختراقه" />
              <Stat label="نتيجة مركبة" value={fmt(snap.composite_score, 1)} tooltip="درجة فنية مركبة (0-100) — كلما زادت، كان السهم أفضل فنياً" />
              <Stat label="مزود البيانات" value={snap.data_provider ?? "—"} tooltip="مصدر البيانات: Yahoo Finance أو Alpha Vantage أو بيانات تجريبية" />
            </div>

            {Array.isArray(snap.patterns) && snap.patterns.length > 0 && (
              <div className="mt-5">
                <h4 className="mb-2 text-xs font-bold text-muted-foreground">نماذج الشموع المكتشفة</h4>
                <div className="flex flex-wrap gap-2">
                  {(snap.patterns as Array<string | { name?: string; name_ar?: string; bullish?: boolean }>).map((p, i) => {
                    const label = typeof p === "string" ? p : p.name_ar ?? p.name ?? "—";
                    const bullish = typeof p === "object" ? p.bullish : undefined;
                    const cls =
                      bullish === true
                        ? "border-bull/40 bg-bull/10 text-bull"
                        : bullish === false
                        ? "border-bear/40 bg-bear/10 text-bear"
                        : "border-border bg-muted/40";
                    return (
                      <span key={i} className={`rounded-full border px-3 py-1 text-xs ${cls}`}>
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        )}

        {news && news.items.length > 0 && (
          <section className="mt-6 rounded-2xl border border-border bg-card/70 p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold">📰 آخر الأخبار وتحليل المشاعر</h3>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="rounded-full bg-bull/20 px-2 py-0.5 text-bull">إيجابي {news.posCount}</span>
                <span className="rounded-full bg-muted px-2 py-0.5">محايد {news.neuCount}</span>
                <span className="rounded-full bg-bear/20 px-2 py-0.5 text-bear">سلبي {news.negCount}</span>
                {news.avgScore != null && (
                  <span className={`rounded-full px-2 py-0.5 font-bold ${news.avgScore >= 0.1 ? "bg-bull/20 text-bull" : news.avgScore <= -0.1 ? "bg-bear/20 text-bear" : "bg-muted"}`}>
                    متوسط: {news.avgScore.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
            <ul className="space-y-2">
              {news.items.map((n) => {
                const cls =
                  n.sentiment === "positive" ? "border-bull/40" :
                  n.sentiment === "negative" ? "border-bear/40" : "border-border";
                const dot =
                  n.sentiment === "positive" ? "bg-bull" :
                  n.sentiment === "negative" ? "bg-bear" : "bg-muted-foreground";
                return (
                  <li key={n.id} className={`rounded-lg border ${cls} bg-background/50 p-3`}>
                    <div className="flex items-start gap-2">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
                      <div className="flex-1 min-w-0">
                        {n.source_url ? (
                          <a href={n.source_url} target="_blank" rel="noreferrer" className="text-sm font-medium hover:underline">
                            {n.headline}
                          </a>
                        ) : (
                          <div className="text-sm font-medium">{n.headline}</div>
                        )}
                        {n.summary_ar && (
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{n.summary_ar}</p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                          {n.source_name && <span>{n.source_name}</span>}
                          {n.published_at && <span>• {new Date(n.published_at).toLocaleString("ar-EG")}</span>}
                          {n.impact_level === "high" && <span className="rounded bg-warn/20 px-1.5 py-0.5 text-warn-foreground">تأثير عالي</span>}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <footer className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          ⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. تداول الأسهم ينطوي على مخاطر فقدان رأس المال.
        </footer>
      </main>
    </div>
  );
}