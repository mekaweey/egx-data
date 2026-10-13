import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getInvestmentOpportunities,
  type InvestmentPick,
} from "@/lib/scan/investment.functions";

export const Route = createFileRoute("/investment")({
  component: InvestmentPage,
  head: () => ({
    meta: [
      { title: "فرص الاستثمار الشهرية — EGX سكانر" },
      {
        name: "description",
        content:
          "أفضل فرص الاستثمار في البورصة المصرية للشهر القادم بناءً على الأخبار والأساسيات والاتجاه الفني.",
      },
    ],
  }),
});

function fmt(n: number | null | undefined, d = 2) {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ScoreBar({ value, label }: { value: number | null; label: string }) {
  const v = value ?? 0;
  const color = v >= 70 ? "bg-bull" : v >= 50 ? "bg-warn" : "bg-bear";
  return (
    <div className="text-[11px]">
      <div className="flex justify-between text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">{Math.round(v)}</span>
      </div>
      <div className="mt-0.5 h-1 w-full rounded-full bg-muted">
        <div className={`h-1 rounded-full ${color}`} style={{ width: `${Math.min(100, v)}%` }} />
      </div>
    </div>
  );
}

function PickCard({ p, rank }: { p: InvestmentPick; rank: number }) {
  const sentimentColor =
    p.positive_news_count > p.negative_news_count
      ? "text-bull"
      : p.negative_news_count > 0
        ? "text-bear"
        : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-lg font-extrabold text-primary">
            #{rank}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Link to="/stock/$symbol" params={{ symbol: p.symbol }} className="text-xl font-bold hover:text-primary">
                {p.name_ar}
              </Link>
              <span className="text-xs text-muted-foreground">{p.symbol}</span>
            </div>
            {p.sector_ar && <p className="mt-0.5 text-xs text-muted-foreground">{p.sector_ar}</p>}
          </div>
        </div>
        <div className="text-end">
          <div className="text-3xl font-extrabold tabular-nums text-primary">{Math.round(p.investment_score)}</div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground">نقاط الاستثمار</div>
        </div>
      </div>

      <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">{p.thesis_ar}</p>

      {/* Investment plan */}
      <div className="mt-4 rounded-xl border border-primary/30 bg-primary/5 p-4">
        <div className="mb-2 text-xs font-semibold text-primary">📅 خطة الاستثمار (شهر كامل)</div>
        <div className="grid grid-cols-3 gap-3 text-center text-xs">
          <div>
            <div className="text-muted-foreground">اشتري من</div>
            <div className="mt-1 font-bold tabular-nums">{fmtDate(p.buy_from)}</div>
            <div className="text-[10px] text-muted-foreground">إلى {fmtDate(p.buy_to)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">احتفظ حتى</div>
            <div className="mt-1 font-bold tabular-nums text-bull">{fmtDate(p.hold_until)}</div>
            <div className="text-[10px] text-muted-foreground">~30 يوم</div>
          </div>
          <div>
            <div className="text-muted-foreground">الربح المتوقع</div>
            <div className="mt-1 font-bold tabular-nums text-bull">+{fmt(p.expected_gain_pct, 1)}%</div>
            <div className="text-[10px] text-muted-foreground">على رأس المال</div>
          </div>
        </div>
      </div>

      {/* Price levels */}
      <div className="mt-3 grid grid-cols-4 gap-2 rounded-lg bg-muted/40 p-3 text-center text-xs">
        <div>
          <div className="text-muted-foreground">السعر الحالي</div>
          <div className="mt-1 font-bold tabular-nums">{fmt(p.close)}</div>
        </div>
        <div title="نطاق الشراء المقترح">
          <div className="text-muted-foreground">دخول</div>
          <div className="mt-1 font-bold tabular-nums">
            {fmt(p.entry_min)}–{fmt(p.entry_max)}
          </div>
        </div>
        <div>
          <div className="text-muted-foreground">الهدف</div>
          <div className="mt-1 font-bold tabular-nums text-bull">{fmt(p.target)}</div>
        </div>
        <div>
          <div className="text-muted-foreground">وقف الخسارة</div>
          <div className="mt-1 font-bold tabular-nums text-bear">{fmt(p.stop_loss)}</div>
        </div>
      </div>

      {/* Fundamentals */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-lg border border-dashed border-border p-3 text-xs">
        <span title="مكرر الربحية">P/E: <span className="font-bold">{fmt(p.pe_ratio, 1)}</span></span>
        <span title="العائد على حقوق المساهمين">ROE: <span className="font-bold">{p.roe != null ? `${fmt(p.roe, 1)}%` : "—"}</span></span>
        <span title="نمو الإيرادات السنوي">نمو الإيرادات: <span className="font-bold">{p.revenue_growth_yoy != null ? `${fmt(p.revenue_growth_yoy, 1)}%` : "—"}</span></span>
        <span title="عائد التوزيعات">توزيعات: <span className="font-bold">{p.dividend_yield != null ? `${fmt(p.dividend_yield, 1)}%` : "—"}</span></span>
        {p.next_earnings_date && (
          <span className="text-warn">📢 نتائج مالية: {fmtDate(p.next_earnings_date)}</span>
        )}
      </div>

      {/* Scores grid */}
      <div className="mt-4 grid grid-cols-5 gap-3">
        <ScoreBar value={p.technical_score} label="فني" />
        <ScoreBar value={p.fundamental_score} label="أساسي" />
        <ScoreBar value={p.sentiment_score} label="مشاعر" />
        <ScoreBar value={p.macro_score} label="اقتصاد" />
        <ScoreBar value={p.sector_score} label="قطاع" />
      </div>

      {/* News */}
      {p.recent_news.length > 0 && (
        <div className="mt-4">
          <div className={`mb-2 text-xs font-semibold ${sentimentColor}`}>
            📰 آخر الأخبار ({p.positive_news_count} إيجابي · {p.negative_news_count} سلبي · {p.high_impact_news_count} مؤثّر)
          </div>
          <ul className="space-y-1.5 text-xs">
            {p.recent_news.map((n, i) => (
              <li key={i} className="flex items-start gap-2 rounded border border-border/50 bg-background/50 p-2">
                <span
                  className={`mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full ${
                    n.sentiment === "positive" ? "bg-bull" : n.sentiment === "negative" ? "bg-bear" : "bg-muted-foreground"
                  }`}
                />
                <div className="flex-1">
                  {n.source_url ? (
                    <a href={n.source_url} target="_blank" rel="noreferrer" className="font-medium hover:text-primary">
                      {n.headline}
                    </a>
                  ) : (
                    <span className="font-medium">{n.headline}</span>
                  )}
                  {n.summary_ar && <p className="mt-0.5 text-muted-foreground">{n.summary_ar}</p>}
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {n.source_name ?? "مصدر"} {n.impact_level === "high" && "• تأثير عالٍ"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function InvestmentPage() {
  const fetchFn = useServerFn(getInvestmentOpportunities);
  const { data, isLoading } = useQuery({
    queryKey: ["investment-opportunities"],
    queryFn: () => fetchFn(),
    refetchInterval: 5 * 60_000,
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/50 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold">
              💼 فرص <span className="text-primary">الاستثمار الشهرية</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              أفضل الأسهم المتوقع صعودها خلال الـ 30 يوم القادمة — مبنية على الاتجاه الفني والأساسيات والأخبار اليومية
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              ← الرئيسية
            </Link>
            <Link to="/track-record" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
              📈 سجل الأداء
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
          <div className="font-semibold text-primary">📌 كيف تستخدم هذه الصفحة؟</div>
          <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
            <li>كل سهم له خطة كاملة: تاريخ شراء، تاريخ بيع متوقع، هدف، ووقف خسارة.</li>
            <li>اشتري في نطاق الدخول، وحدد وقف الخسارة فور الشراء.</li>
            <li>وزّع رأس مالك على 3–5 أسهم لتقليل المخاطر.</li>
            <li>الصفحة تتحدث تلقائيًا مع كل فحص يومي (بيانات الأخبار والأساسيات والمؤشرات).</li>
          </ul>
        </div>

        <div className="mb-4 rounded-lg border border-warn/30 bg-warn/10 px-4 py-2 text-xs">
          ⚠️ هذا التحليل لأغراض تعليمية فقط وليس نصيحة استثمارية. الاستثمار في الأسهم ينطوي على مخاطر.
        </div>

        {isLoading && (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            جاري تحليل الفرص…
          </div>
        )}

        {!isLoading && data && data.picks.length === 0 && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-lg font-semibold">لا توجد فرص استثمارية تستوفي المعايير حاليًا</p>
            <p className="mt-2 text-sm text-muted-foreground">
              السوق قد لا يكون في حالة صاعدة. تحقق مجددًا بعد التحديث اليومي القادم.
            </p>
          </div>
        )}

        {data && data.picks.length > 0 && (
          <>
            <h2 className="mb-3 text-lg font-bold">🏆 أفضل {data.picks.length} فرص للشهر القادم</h2>
            <div className="space-y-4">
              {data.picks.map((p, i) => (
                <PickCard key={p.symbol} p={p} rank={i + 1} />
              ))}
            </div>

            {data.watchlist.length > 0 && (
              <>
                <h2 className="mb-3 mt-8 text-lg font-bold">👀 قائمة المراقبة</h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {data.watchlist.map((p) => (
                    <Link
                      key={p.symbol}
                      to="/stock/$symbol"
                      params={{ symbol: p.symbol }}
                      className="rounded-lg border border-border bg-card p-3 text-sm transition hover:border-primary/50"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold">{p.name_ar}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {p.symbol} · {p.sector_ar ?? "—"}
                          </div>
                        </div>
                        <div className="text-end">
                          <div className="font-bold text-primary">{Math.round(p.investment_score)}</div>
                          <div className="text-[10px] text-bull">+{fmt(p.expected_gain_pct, 1)}%</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}