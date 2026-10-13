import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getTradeLifecycleToday } from "@/lib/trade-ledger.functions";

export const Route = createFileRoute("/trade-lifecycle")({
  head: () => ({
    meta: [
      { title: "Trade Lifecycle — سجل الصفقات" },
      { name: "description", content: "تايم-لاين لحظي لكل حدث في كل صفقة: من الإشارة لحد الإقفال." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

const STATE_STYLE: Record<string, string> = {
  SIGNALED: "bg-blue-100 text-blue-800",
  BUYING: "bg-amber-100 text-amber-800",
  HOLDING: "bg-emerald-100 text-emerald-800",
  SELLING: "bg-purple-100 text-purple-800",
  CLOSED_TP: "bg-green-200 text-green-900 font-semibold",
  CLOSED_SL: "bg-red-200 text-red-900",
  CLOSED_TRAIL: "bg-yellow-200 text-yellow-900",
  CLOSED_TIME: "bg-gray-200 text-gray-800",
  CLOSED_EOD: "bg-gray-200 text-gray-800",
  CLOSED_HARD_FLOOR: "bg-red-300 text-red-950 font-semibold",
  CLOSED_VOLUME_DEATH: "bg-orange-200 text-orange-900",
  CANCELLED: "bg-gray-100 text-gray-600",
  ERROR: "bg-red-100 text-red-800",
};

const EVENT_ICON: Record<string, string> = {
  SIGNAL: "📡",
  ORDER_QUEUED: "📥",
  ORDER_OPENED: "🌐",
  ORDER_PREPARED: "📝",
  ORDER_CONFIRMED: "✅",
  REVIEW_CLICKED: "🖱️",
  BUY_FILLED: "🟢",
  SELL_REQUESTED: "📤",
  SELL_QUEUED: "🔔",
  SELL_FILLED: "🔴",
  SMART_EXIT_HARD_FLOOR: "🛑",
  SMART_EXIT_VOLUME_DEATH: "💀",
  SMART_EXIT_PREBUY_SKIP: "⏭️",
  PAPER_CLOSED: "📊",
  CANCELLED: "❌",
  ERROR: "⚠️",
};

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { timeZone: "Africa/Cairo", hour12: false });
}

function Page() {
  const fn = useServerFn(getTradeLifecycleToday);
  const router = useRouter();
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["trade-lifecycle-today"],
    queryFn: () => fn(),
    refetchInterval: 15_000,
  });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4" dir="rtl">
      <header className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">🔎 سجل الصفقات — Trade Lifecycle</h1>
          <p className="text-sm text-gray-600">
            كل حدث في كل صفقة، من الإشارة لحد الإقفال — بيتحدّث كل 15 ثانية.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/slippage-report"
            className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50"
          >📐 Slippage</Link>
          <button
            onClick={() => { refetch(); router.invalidate(); }}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700"
          >{isFetching ? "…" : "تحديث"}</button>
        </div>
      </header>

      {isLoading && <div className="text-gray-500">جاري التحميل…</div>}
      {error && <div className="text-red-600">خطأ: {String((error as Error).message)}</div>}

      {data && data.trades.length === 0 && (
        <div className="p-8 bg-gray-50 border border-gray-200 rounded text-center text-gray-500">
          مفيش أي أحداث النهارده لسه — أول إشارة من الاستراتيجية هتظهر هنا فوراً.
        </div>
      )}

      <div className="space-y-4">
        {(data?.trades ?? []).map((t) => (
          <article key={t.key} className="border border-gray-200 rounded-lg bg-white overflow-hidden">
            <header className="flex items-center justify-between gap-2 px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-lg font-bold">{t.symbol}</span>
                {t.strategy && <span className="text-xs text-gray-500">{t.strategy}</span>}
                {t.state && (
                  <span className={`text-xs px-2 py-1 rounded ${STATE_STYLE[t.state] || "bg-gray-100"}`}>
                    {t.state}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{t.events.length} حدث</div>
            </header>

            <ol className="relative border-r-2 border-gray-200 mr-4 my-3 space-y-2">
              {t.events.map((e) => (
                <li key={e.id} className="pr-4 pl-2 relative">
                  <span className="absolute -right-[7px] top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500"></span>
                  <div className="flex items-center gap-2 flex-wrap text-sm">
                    <span>{EVENT_ICON[e.event_type] || "•"}</span>
                    <span className="font-medium">{e.event_type}</span>
                    {e.state && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${STATE_STYLE[e.state] || "bg-gray-100"}`}>
                        {e.state}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{fmtTime(e.created_at)}</span>
                    {e.price != null && <span className="text-xs text-gray-700">@ {Number(e.price).toFixed(2)}</span>}
                    {e.qty != null && <span className="text-xs text-gray-500">× {Number(e.qty)}</span>}
                    {e.reason && <span className="text-xs text-gray-600 italic">{e.reason}</span>}
                    {e.source && <span className="text-[10px] text-gray-400">[{e.source}]</span>}
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </div>
  );
}