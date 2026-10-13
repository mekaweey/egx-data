import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getThunderLive, type ThunderLivePayload } from "@/lib/live/thunder-live.functions";
import { fmtPrice } from "@/lib/format/price";

export const Route = createFileRoute("/thunder-live")({
  component: ThunderLivePage,
  head: () => ({
    meta: [
      { title: "Thunder Live — مراقبة البيانات اللحظية" },
      { name: "description", content: "تأكد من أن بيانات Thunder Extension لحظية وحقيقية." },
    ],
  }),
});

function fmtAge(s: number | null) {
  if (s == null) return "—";
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د ${s % 60}ث`;
  return `${Math.floor(s / 3600)}س ${Math.floor((s % 3600) / 60)}د`;
}

function ageColor(s: number | null) {
  if (s == null) return "text-muted-foreground";
  if (s < 10) return "text-bull";
  if (s < 60) return "text-emerald-500";
  if (s < 300) return "text-yellow-500";
  return "text-bear";
}

function ThunderLivePage() {
  const fetchLive = useServerFn(getThunderLive);
  const [filter, setFilter] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const q = useQuery({
    queryKey: ["thunder-live"],
    queryFn: () => fetchLive(),
    refetchInterval: autoRefresh ? 3000 : false,
    refetchOnWindowFocus: true,
  });

  const data = q.data;

  return (
    <div dir="rtl" className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Thunder Live · مراقبة البيانات اللحظية</h1>
          <p className="text-sm text-muted-foreground">
            هل البيانات الواصلة من Thunder Extension حقيقية ولحظية؟ كل المؤشرات هنا.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/thunder" className="rounded-md border px-3 py-1.5 text-sm hover:bg-muted">
            ← Thunder
          </Link>
          <label className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
            <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
            تحديث كل 3 ثواني
          </label>
          <button
            onClick={() => q.refetch()}
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            تحديث الآن
          </button>
        </div>
      </header>

      {q.isLoading && <div className="rounded-lg border p-6 text-center text-sm">جاري التحميل…</div>}
      {q.error && (
        <div className="rounded-lg border border-bear/40 bg-bear/10 p-4 text-sm text-bear">
          خطأ: {(q.error as Error).message}
        </div>
      )}

      {data && (
        <>
          <VerdictCard data={data} />
          <SummaryGrid data={data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <FlushChart buckets={data.flushBuckets} />
            <GapHistogram gaps={data.gapHistogram} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PerSymbolTable
                symbols={data.perSymbol}
                filter={filter}
                onFilter={setFilter}
              />
            </div>
            <div className="space-y-4">
              <TopMovers movers={data.topMovers} />
              <SourcesCard sources={data.sourceBreakdown} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function VerdictCard({ data }: { data: ThunderLivePayload }) {
  const v = data.verdict;
  const tone = v.isLive
    ? "border-bull/50 bg-bull/10 text-bull"
    : v.confidence === "high"
    ? "border-bear/50 bg-bear/10 text-bear"
    : "border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400";
  return (
    <div className={`rounded-2xl border-2 p-5 ${tone}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className={`relative flex h-4 w-4 ${v.isLive ? "" : "opacity-60"}`}>
            <span className={`absolute inline-flex h-full w-full rounded-full ${v.isLive ? "animate-ping bg-bull/70" : "bg-current/40"}`} />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-current" />
          </span>
          <div>
            <div className="text-xl font-bold">{v.label}</div>
            <div className="mt-1 text-sm opacity-90">{v.reason}</div>
          </div>
        </div>
        <div className="text-end text-xs opacity-80">
          <div>{data.marketLabel}</div>
          <div className="mt-1 tabular-nums">القاهرة {data.cairoHHMM}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-bold tabular-nums ${tone ?? ""}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function SummaryGrid({ data }: { data: ThunderLivePayload }) {
  const s = data.summary;
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
      <Stat
        label="آخر flush"
        value={fmtAge(s.lastFlushAgoSec)}
        sub={s.lastFlushTs ? new Date(s.lastFlushTs).toLocaleTimeString("ar-EG") : "—"}
        tone={ageColor(s.lastFlushAgoSec)}
      />
      <Stat label="آخر دقيقة" value={String(s.ticks1m)} sub="tick" tone={s.ticks1m > 0 ? "text-bull" : "text-muted-foreground"} />
      <Stat label="آخر 5د" value={String(s.ticks5m)} sub="tick" />
      <Stat label="آخر 15د" value={String(s.ticks15m)} sub="tick" />
      <Stat label="آخر ساعة" value={String(s.ticks1h)} sub={`${s.uniqueSymbols1h} سهم`} />
      <Stat
        label="متوسط الفاصل"
        value={s.avgFlushIntervalSec != null ? `${s.avgFlushIntervalSec}ث` : "—"}
        sub={`${s.distinctFlushes1h} flush/س`}
        tone={s.avgFlushIntervalSec != null && s.avgFlushIntervalSec < 10 ? "text-bull" : ""}
      />
    </div>
  );
}

function FlushChart({ buckets }: { buckets: ThunderLivePayload["flushBuckets"] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-bold">نشاط الـ flushes — آخر 60 دقيقة</h3>
        <span className="text-xs text-muted-foreground">أعمدة طويلة = تدفق مستمر</span>
      </div>
      <div className="flex h-32 items-end gap-[2px]" dir="ltr">
        {buckets.map((b, i) => (
          <div
            key={i}
            title={`${b.minute} — ${b.count} flush`}
            className={`flex-1 rounded-t ${b.count > 0 ? "bg-bull/70" : "bg-muted"}`}
            style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count > 0 ? 2 : 1 }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground tabular-nums" dir="ltr">
        <span>{buckets[0]?.minute}</span>
        <span>{buckets[Math.floor(buckets.length / 2)]?.minute}</span>
        <span>{buckets[buckets.length - 1]?.minute}</span>
      </div>
    </div>
  );
}

function GapHistogram({ gaps }: { gaps: ThunderLivePayload["gapHistogram"] }) {
  const total = gaps.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-bold">الفواصل بين الـ flushes</h3>
        <span className="text-xs text-muted-foreground">معظمها &lt;15ث = لحظي حقيقي</span>
      </div>
      <div className="space-y-2">
        {gaps.map((g) => {
          const pct = (g.count / total) * 100;
          const good = g.label === "<5s" || g.label === "5-15s";
          return (
            <div key={g.label} className="flex items-center gap-2">
              <div className="w-16 text-xs tabular-nums text-muted-foreground" dir="ltr">{g.label}</div>
              <div className="flex-1 rounded-full bg-muted">
                <div
                  className={`h-2 rounded-full ${good ? "bg-bull" : "bg-bear/60"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-12 text-end text-xs tabular-nums">{g.count}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerSymbolTable({
  symbols,
  filter,
  onFilter,
}: {
  symbols: ThunderLivePayload["perSymbol"];
  filter: string;
  onFilter: (v: string) => void;
}) {
  const filtered = filter
    ? symbols.filter((s) => s.symbol.toLowerCase().includes(filter.toLowerCase()))
    : symbols;
  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b p-3">
        <h3 className="font-bold">آخر سعر لكل سهم ({filtered.length})</h3>
        <input
          value={filter}
          onChange={(e) => onFilter(e.target.value)}
          placeholder="بحث رمز…"
          className="rounded-md border bg-background px-2 py-1 text-sm"
        />
      </div>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="p-2 text-start">الرمز</th>
              <th className="p-2 text-end">السعر</th>
              <th className="p-2 text-end">التغير</th>
              <th className="p-2 text-end">العمر</th>
              <th className="p-2 text-end">ticks/س</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.symbol} className="border-b last:border-0 hover:bg-muted/40">
                <td className="p-2 font-bold">{s.symbol}</td>
                <td className="p-2 text-end tabular-nums">{fmtPrice(s.price)}</td>
                <td className={`p-2 text-end tabular-nums ${s.changePct == null ? "text-muted-foreground" : s.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                  {s.changePct == null ? "—" : `${s.changePct >= 0 ? "+" : ""}${s.changePct.toFixed(2)}%`}
                </td>
                <td className={`p-2 text-end tabular-nums ${ageColor(s.ageSec)}`}>{fmtAge(s.ageSec)}</td>
                <td className="p-2 text-end tabular-nums">{s.ticks1h}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">لا توجد بيانات</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TopMovers({ movers }: { movers: ThunderLivePayload["topMovers"] }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-bold">أكبر تحركات (آخر ساعة)</h3>
      {movers.length === 0 ? (
        <div className="text-sm text-muted-foreground">لا يوجد تغير في الأسعار — السوق مغلق غالباً.</div>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {movers.map((m) => (
            <li key={m.symbol} className="flex items-center justify-between">
              <span className="font-bold">{m.symbol}</span>
              <span className="tabular-nums text-muted-foreground">{fmtPrice(m.price)}</span>
              <span className={`tabular-nums font-bold ${m.changePct >= 0 ? "text-bull" : "text-bear"}`}>
                {m.changePct >= 0 ? "+" : ""}{m.changePct.toFixed(2)}%
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SourcesCard({ sources }: { sources: ThunderLivePayload["sourceBreakdown"] }) {
  const total = sources.reduce((a, b) => a + b.count, 0) || 1;
  return (
    <div className="rounded-xl border bg-card p-4">
      <h3 className="mb-3 font-bold">مصادر البيانات (آخر ساعة)</h3>
      <ul className="space-y-2 text-sm">
        {sources.map((s) => {
          const pct = (s.count / total) * 100;
          const isThunder = s.source === "thunder_ext";
          return (
            <li key={s.source}>
              <div className="flex items-center justify-between">
                <span className={isThunder ? "font-bold text-bull" : ""}>{s.source}</span>
                <span className="tabular-nums">{s.count} ({pct.toFixed(0)}%)</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-muted">
                <div className={`h-1.5 rounded-full ${isThunder ? "bg-bull" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
              </div>
            </li>
          );
        })}
        {sources.length === 0 && <li className="text-muted-foreground">لا توجد بيانات</li>}
      </ul>
    </div>
  );
}