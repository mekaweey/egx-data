import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import {
  getAutoDeepAnalysis,
  type AutoDeepRow,
} from "@/lib/hybrid/deep-analysis.functions";

const deepQueryOptions = queryOptions({
  queryKey: ["auto-deep-analysis"],
  queryFn: () => getAutoDeepAnalysis(),
  staleTime: 60 * 1000,
});

export const Route = createFileRoute("/deep")({
  head: () => ({
    meta: [
      { title: "تحليل هجين تلقائي — Meky Stock" },
      {
        name: "description",
        content:
          "تحليل تلقائي لأعلى الأسهم: قواعد ثابتة فورية + ذكاء اصطناعي يفهم الأخبار، بدون أي إدخال يدوي.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(deepQueryOptions),
  component: DeepAnalysisPage,
  errorComponent: ({ error, reset }) => (
    <ErrorView message={error.message} reset={reset} />
  ),
  notFoundComponent: () => <ErrorView message="غير موجود" />,
});

function ErrorView({ message, reset }: { message: string; reset?: () => void }) {
  return (
    <div className="min-h-screen bg-background p-6 text-center" dir="rtl">
      <p className="text-bear">{message}</p>
      {reset && (
        <button onClick={reset} className="mt-3 rounded-lg border px-3 py-2">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

function aiBadgeCls(s: AutoDeepRow["ai_sentiment"]) {
  if (s === "positive") return "bg-bull text-bull-foreground";
  if (s === "negative") return "bg-bear text-bear-foreground";
  if (s === "mixed") return "bg-warn text-warn-foreground";
  return "bg-muted text-muted-foreground";
}
function aiLabel(s: AutoDeepRow["ai_sentiment"]) {
  return s === "positive"
    ? "إيجابي"
    : s === "negative"
      ? "سلبي"
      : s === "mixed"
        ? "مختلط"
        : "محايد";
}

function Row({ r }: { r: AutoDeepRow }) {
  const chgPos = (r.change_pct ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold">{r.name_ar}</h3>
            <span className="text-xs text-muted-foreground">{r.symbol}</span>
          </div>
          {r.sector_ar && (
            <p className="mt-1 text-xs text-muted-foreground">{r.sector_ar}</p>
          )}
        </div>
        <div className="text-left">
          <div className="text-lg font-bold">{r.close.toFixed(2)}</div>
          <div className={chgPos ? "text-bull text-sm" : "text-bear text-sm"}>
            {chgPos ? "+" : ""}
            {(r.change_pct ?? 0).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-muted/30 px-3 py-1 text-xs">
          قواعد ثابتة: <b>{r.rule_label}</b> ({(r.rule_score * 100).toFixed(0)}%)
        </span>
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${aiBadgeCls(r.ai_sentiment)}`}>
          AI: {aiLabel(r.ai_sentiment)} ({(r.ai_score * 100).toFixed(0)}%)
        </span>
      </div>

      {r.headlines.length > 0 ? (
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          {r.headlines.slice(0, 4).map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">لا توجد أخبار حديثة</p>
      )}

      {r.ai_reason && (
        <p className="mt-3 rounded-lg bg-primary/10 p-3 text-sm text-primary">
          💡 {r.ai_reason}
        </p>
      )}
    </div>
  );
}

function DeepAnalysisPage() {
  const { data } = useSuspenseQuery(deepQueryOptions);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🧠 التحليل الهجين التلقائي</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              قواعد ثابتة (مجاناً) + AI يفهم الأخبار — أعلى ٦ أسهم حركةً، بدون أي
              إدخال يدوي.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              آخر تحديث: {new Date(data.generatedAt).toLocaleString("ar-EG")}
            </p>
          </div>
          <Link to="/" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
            ← الرئيسية
          </Link>
        </div>

        {data.rows.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            لا توجد بيانات scan حديثة — شغّل scan من الرئيسية أولاً.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.rows.map((r) => (
              <Row key={r.symbol} r={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}