import { useEffect, useState } from "react";

/**
 * MarketStateGauge — the smart 0-100 market state gauge (2026-09-28).
 * Every component is MEASURED on history before it renders here:
 *   breadth  → % of halal symbols above their 20d MA
 *              (10y: breadth >= 50% => next-day rest +0.28% vs +0.02%)
 *   trend20  → universe 20-session return (the regime the weekly system trades)
 *   prevday  → yesterday's universe return (10y corr +0.206 with rest-of-day)
 *   trend5   → short momentum (5 sessions)
 *   volreg   → volatility state (calm = higher score; the protections arm on it)
 *   opening  → LIVE opening strength, measured over the first 10-15 minutes
 *              (the tested most-informative intraday window: 61% vs 47%)
 *              - appears only while the market is open AND the extension feeds
 * Polls /api/public/hooks/market-state every 60s.
 */

type MarketState = {
  ok: boolean;
  score: number;
  bucket: string;
  components: Record<string, number | null>;
  detail: {
    breadthPct: number;
    trend20Pct: number;
    trend5Pct: number;
    prevdayPct: number;
    vol20Pct: number;
    openingPct: number | null;
    liveSyms: number;
    inSession: boolean;
    asOf: string;
  };
  error?: string;
};

const COMP_LABELS: Record<string, string> = {
  breadth: "اتساع السوق فوق المتوسط",
  trend20: "الاتجاه (20 جلسة)",
  prevday: "عائد أمس",
  trend5: "الزخم (5 جلسات)",
  volreg: "هدوء التقلب",
  opening: "قوة الافتتاح (أول 15 دقيقة)",
};

function bucketColor(bucket: string): string {
  if (bucket === "ممتاز") return "#22c55e";
  if (bucket === "جيد") return "#4ade80";
  if (bucket === "متوسط") return "#eab308";
  return "#ef4444";
}

export function MarketStateGauge() {
  const [st, setSt] = useState<MarketState | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await fetch("/api/public/hooks/market-state", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as MarketState;
        if (!cancelled) {
          setSt(data);
          setErr(null);
        }
      } catch (e) {
        if (!cancelled) setErr((e as Error).message || "network error");
      }
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (err) {
    return (
      <div className="rounded-2xl border border-bear/40 bg-bear/10 text-bear px-4 py-3 text-xs font-bold">
        ⚠️ تعذر حساب حالة السوق ({err})
      </div>
    );
  }
  if (!st || !st.ok) return null;

  const score = st.score;
  const color = bucketColor(st.bucket);
  const arcLen = Math.PI * 80; // semicircle r=80
  const filled = (score / 100) * arcLen;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🧠</span>
            <h3 className="text-base font-black">محلل حالة السوق الذكي</h3>
            <span
              className="rounded-full px-2.5 py-0.5 text-[11px] font-black"
              style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}
            >
              {st.bucket}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            تركيب مقاس من عشر سنين: الاتساع والاتجاه وعائد أمس والزخم وهدوء التقلب وقوة الافتتاح — كل مكوّن
            اختُبر على التاريخ قبل ما يدخل المؤشر.
          </p>
        </div>
        <div className="text-[11px] text-muted-foreground text-left">
          <div>آخر جلسة: {st.detail.asOf}</div>
          {st.detail.inSession ? (
            <div>السوق مفتوح — القياس اللحظي نشط</div>
          ) : (
            <div>السوق مقفول — التحليل من إغلاق آخر جلسة</div>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-6">
        {/* radial gauge */}
        <svg viewBox="0 0 200 125" className="w-52">
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke="rgba(128,128,128,0.25)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <path
            d="M 20 105 A 80 80 0 0 1 180 105"
            fill="none"
            stroke={color}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={`${filled} 999`}
            style={{ transition: "stroke-dasharray 0.8s ease" }}
          />
          <text x="100" y="88" textAnchor="middle" fontSize="38" fontWeight="900" fill={color}>
            {score}
          </text>
          <text x="100" y="112" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}>
            {st.bucket} — من 100
          </text>
        </svg>

        {/* components */}
        <div className="min-w-[260px] flex-1 space-y-2">
          {Object.entries(COMP_LABELS).map(([k, label]) => {
            const v = st.components[k];
            if (v == null) {
              return (
                <div key={k} className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span>{label}</span>
                  <span>غير متاح الآن (الإكستنشن)</span>
                </div>
              );
            }
            return (
              <div key={k} className="space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold">{label}</span>
                  <span className="font-mono font-bold">{v}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${v}%`,
                      background: v >= 60 ? "#4ade80" : v >= 40 ? "#eab308" : "#ef4444",
                      transition: "width 0.6s ease",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] md:grid-cols-3">
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          اتساع فوق المتوسط: <b className="font-mono">{st.detail.breadthPct}%</b>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          الاتجاه 20 جلسة: <b className="font-mono">{st.detail.trend20Pct}%</b>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          الزخم 5 جلسات: <b className="font-mono">{st.detail.trend5Pct}%</b>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          عائد أمس: <b className="font-mono">{st.detail.prevdayPct}%</b>
        </div>
        <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
          التقلب اليومي: <b className="font-mono">{st.detail.vol20Pct}%</b>
        </div>
        {st.detail.openingPct != null && (
          <div className="rounded-lg bg-muted/40 px-2.5 py-1.5">
            قوة الافتتاح: <b className="font-mono">{st.detail.openingPct}%</b>
          </div>
        )}
      </div>
    </div>
  );
}
