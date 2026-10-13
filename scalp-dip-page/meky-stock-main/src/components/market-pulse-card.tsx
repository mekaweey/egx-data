import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketPulse } from "@/lib/market-pulse/pulse.functions";

const COLOR: Record<string, string> = {
  bull: "border-bull bg-bull/10 text-bull",
  bear: "border-bear bg-bear/10 text-bear",
  warn: "border-warn bg-warn/10 text-warn",
  muted: "border-muted bg-muted/20 text-foreground",
  neutral: "border-border bg-card text-muted-foreground",
};

export function MarketPulseCard({ compact = false }: { compact?: boolean }) {
  const fetchPulse = useServerFn(getMarketPulse);
  const { data } = useQuery({
    queryKey: ["market-pulse"],
    queryFn: () => fetchPulse(),
    refetchInterval: 60_000,
  });

  if (!data) return null;
  const cls = COLOR[data.labelColor] ?? COLOR.neutral;
  const sign = (n: number) => (n >= 0 ? "+" : "");

  return (
    <div className={`rounded-lg border-2 p-4 mb-4 ${cls}`}>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="font-bold text-sm">
          📊 نبض السوق — أول 30 دقيقة ({data.date})
        </div>
        <div className="text-xs opacity-75">
          {data.ready ? `${data.active} رمز نشط` : "لسه بدري — التصنيف بعد 10:30 ص"}
        </div>
      </div>

      <div className="flex items-baseline gap-3 flex-wrap">
        <div className="text-2xl font-extrabold">
          {data.label}
        </div>
        {data.ready && data.active > 0 && (
          <div className="text-sm tabular-nums opacity-90">
            متوسط الحركة: <b>{sign(data.avgMovePct)}{data.avgMovePct}%</b>
            <span className="mx-2">•</span>
            صاعدة: <b>{data.pctUp}%</b>
            <span className="mx-2">•</span>
            هبطت ≥1.5%: <b>{data.pctDip}%</b>
          </div>
        )}
      </div>

      {data.ready && data.active > 0 && (
        <div className="mt-3 rounded-md bg-background/60 border p-3 text-sm text-foreground">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">المتوقع للاستراتيجية اليوم:</span>
            <span className={`text-lg font-bold tabular-nums ${data.expectedPnl >= 0 ? "text-bull" : "text-bear"}`}>
              {sign(data.expectedPnl)}{data.expectedPnl.toLocaleString()} ج
            </span>
            <span className="text-xs text-muted-foreground">(مدى: {data.expectedRange})</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">توقع إشارات Scalp Live اليوم:</span>
            <span className="text-base font-bold tabular-nums text-foreground">⚡ {data.expectedSignals}</span>
          </div>
          {!compact && (
            <div className="mt-1.5 text-xs text-muted-foreground leading-5">
              {data.note}
              <br/>
              <span className="opacity-70">⚠️ التقدير مبني على 5 أيام بس (07–11/06). الدقة هتتحسّن لما نجمع 20+ يوم.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}