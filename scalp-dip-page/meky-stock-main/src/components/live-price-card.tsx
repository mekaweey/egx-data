import { useEffect, useRef, useState } from "react";
import type { LiveQuoteLite } from "@/lib/today/live-quote.functions";

const fmt = (n: number | null | undefined, d = 2) =>
  n == null || Number.isNaN(n)
    ? "—"
    : n.toLocaleString("en-EG", { maximumFractionDigits: d, minimumFractionDigits: d });

type Sample = { t: number; p: number };
const HISTORY = new Map<string, Sample[]>();
const MAX_POINTS = 90;

function pushSample(symbol: string, q?: LiveQuoteLite) {
  if (!q || q.price <= 0) return HISTORY.get(symbol) ?? [];
  const arr = HISTORY.get(symbol) ?? [];
  const t = new Date(q.fetchedAt).getTime();
  const last = arr[arr.length - 1];
  if (!last || last.t !== t) {
    arr.push({ t, p: q.price });
    if (arr.length > MAX_POINTS) arr.splice(0, arr.length - MAX_POINTS);
    HISTORY.set(symbol, arr);
  }
  return arr;
}

export function Sparkline({
  samples,
  height = 56,
  bullish,
}: {
  samples: Sample[];
  height?: number;
  bullish: boolean;
}) {
  if (samples.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-[10px] text-muted-foreground"
        style={{ height }}
      >
        جاري تجميع نقاط لايف…
      </div>
    );
  }
  const w = 240;
  const h = height;
  const xs = samples.map((s) => s.t);
  const ys = samples.map((s) => s.p);
  const xmin = Math.min(...xs);
  const xmax = Math.max(...xs);
  const ymin = Math.min(...ys);
  const ymax = Math.max(...ys);
  const xr = Math.max(xmax - xmin, 1);
  const yr = Math.max(ymax - ymin, 0.0001);
  const pts = samples
    .map((s) => {
      const x = ((s.t - xmin) / xr) * (w - 6) + 3;
      const y = h - 4 - ((s.p - ymin) / yr) * (h - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const color = bullish ? "hsl(var(--bull, 142 70% 45%))" : "hsl(var(--bear, 0 70% 55%))";
  const stroke = bullish ? "var(--bull, #16a34a)" : "var(--bear, #dc2626)";
  const last = samples[samples.length - 1];
  const lastX = ((last.t - xmin) / xr) * (w - 6) + 3;
  const lastY = h - 4 - ((last.p - ymin) / yr) * (h - 8);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height }} preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={pts}
      />
      <circle cx={lastX} cy={lastY} r={3} fill={stroke} />
      <circle cx={lastX} cy={lastY} r={6} fill={color} opacity={0.25}>
        <animate attributeName="r" values="3;9;3" dur="1.6s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.4;0;0.4" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

export function MarketBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        open ? "bg-bull/15 text-bull" : "bg-muted text-muted-foreground"
      }`}
    >
      <span className={`relative inline-flex h-2 w-2 rounded-full ${open ? "bg-bull" : "bg-muted-foreground"}`}>
        {open && <span className="absolute inset-0 animate-ping rounded-full bg-bull/70" />}
      </span>
      {open ? "السوق مفتوح" : "السوق مغلق"}
    </span>
  );
}

export function LivePriceCard({
  symbol,
  quote,
  entry,
  marketOpen,
  size = "lg",
}: {
  symbol: string;
  quote?: LiveQuoteLite;
  entry?: number;
  marketOpen: boolean;
  size?: "sm" | "lg";
}) {
  const [, force] = useState(0);
  const buf = useRef<Sample[]>(HISTORY.get(symbol) ?? []);

  useEffect(() => {
    buf.current = pushSample(symbol, quote);
    force((n) => n + 1);
  }, [symbol, quote?.fetchedAt, quote?.price]);

  const price = quote?.price ?? 0;
  const dayPct = quote?.change_pct ?? 0;
  const dayDelta = quote && quote.open > 0 ? quote.price - quote.open : 0;
  const pnlPct = entry && entry > 0 && price > 0 ? ((price - entry) / entry) * 100 : null;
  const bullish = (pnlPct ?? dayPct) >= 0;
  const big = size === "lg";

  return (
    <div
      className={`rounded-2xl border bg-card ${big ? "p-4" : "p-3"} ${
        bullish ? "border-bull/40" : "border-bear/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">سعر آخر تداول</div>
          <div className="mt-0.5 flex items-baseline gap-1">
            <strong className={`tabular-nums ${big ? "text-3xl" : "text-xl"}`}>{fmt(price)}</strong>
            <span className="text-xs text-muted-foreground">ج.م</span>
          </div>
          <div
            className={`mt-1 flex items-center gap-1 text-xs font-bold tabular-nums ${
              dayPct >= 0 ? "text-bull" : "text-bear"
            }`}
          >
            <span>{dayPct >= 0 ? "↗" : "↘"}</span>
            <span>
              ({dayPct >= 0 ? "+" : ""}
              {fmt(dayPct, 2)}%)
            </span>
            <span className="text-muted-foreground">{fmt(Math.abs(dayDelta), 2)} ج.م</span>
          </div>
        </div>
        <div className="text-end">
          <MarketBadge open={marketOpen} />
          {pnlPct != null && (
            <div
              className={`mt-2 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                pnlPct >= 0 ? "bg-bull/15 text-bull" : "bg-bear/15 text-bear"
              }`}
              title="ربح/خسارة من سعر الدخول"
            >
              vs دخول {pnlPct >= 0 ? "+" : ""}
              {fmt(pnlPct, 2)}%
            </div>
          )}
          {quote?.fetchedAt && (
            <div className="mt-1 text-[10px] tabular-nums text-muted-foreground">
              {new Date(quote.fetchedAt).toLocaleTimeString("ar-EG", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2">
        <Sparkline samples={buf.current} bullish={bullish} height={big ? 64 : 40} />
      </div>
      {quote && quote.high > 0 && (
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums">
          <span>أقل {fmt(quote.low)}</span>
          <span>فتح {fmt(quote.open)}</span>
          <span>أعلى {fmt(quote.high)}</span>
        </div>
      )}
    </div>
  );
}