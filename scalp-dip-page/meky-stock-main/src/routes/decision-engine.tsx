import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  runDecisionEngine,
  listDecisionSuggestions,
  applyDecisionSuggestion,
  rejectDecisionSuggestion,
} from "@/lib/decision-engine.functions";

export const Route = createFileRoute("/decision-engine")({
  head: () => ({
    meta: [
      { title: "Decision Engine — محرك القرارات الذكي" },
      { name: "description", content: "تحليل بيانات الاستراتيجية وتقديم اقتراحات تعديل مبنية على أدلة حقيقية." },
    ],
  }),
  errorComponent: ({ error }) => <div className="p-6 text-red-600">خطأ: {String(error?.message || error)}</div>,
  notFoundComponent: () => <div className="p-6">مش موجود</div>,
  component: Page,
});

type Suggestion = {
  id: string;
  created_at: string;
  category: string;
  target_key: string | null;
  current_value: string | null;
  suggested_value: string | null;
  action_type: string;
  rationale: string;
  evidence: Record<string, unknown>;
  evidence_days: number;
  confidence: number | null;
  status: string;
  applied_at: string | null;
  rejected_at: string | null;
};

const categoryLabel: Record<string, string> = {
  prebuy_filter: "🔇 فلتر السيولة قبل الشراء",
  shadow_promotion: "👁 ترقية Smart-Exit من shadow إلى live",
  tp_target: "🎯 معايرة هدف الربح (TP)",
  sl_stop: "🛑 معايرة حد الخسارة (SL)",
};

function Page() {
  const qc = useQueryClient();
  const [days, setDays] = useState(14);
  const listFn = useServerFn(listDecisionSuggestions);
  const runFn = useServerFn(runDecisionEngine);
  const applyFn = useServerFn(applyDecisionSuggestion);
  const rejectFn = useServerFn(rejectDecisionSuggestion);

  const { data, isLoading, error } = useQuery({
    queryKey: ["decision-suggestions"],
    queryFn: () => listFn({ data: {} }),
    refetchInterval: 15_000,
  });

  const runMut = useMutation({
    mutationFn: () => runFn({ data: { days } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decision-suggestions"] }),
  });
  const applyMut = useMutation({
    mutationFn: (id: string) => applyFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decision-suggestions"] }),
  });
  const rejectMut = useMutation({
    mutationFn: (id: string) => rejectFn({ data: { id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["decision-suggestions"] }),
  });

  const rows = ((data?.rows ?? []) as Suggestion[]);
  const pending = rows.filter(r => r.status === "pending");
  const handled = rows.filter(r => r.status !== "pending");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🧠 Decision Engine</h1>
          <p className="text-sm text-gray-600">
            بيحلل صفقاتك الحقيقية والإشارات الضايعة وقرارات Smart-Exit ويقترح تعديلات مبنية على الأدلة.
            الاقتراحات لا تُطبّق تلقائيًا — أنت تختار.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm">آخر
            <input
              type="number" min={3} max={60} value={days}
              onChange={e => setDays(Math.max(3, Math.min(60, Number(e.target.value) || 14)))}
              className="mx-1 w-16 rounded border px-2 py-1 text-sm text-center"
            />
            يوم
          </label>
          <button
            onClick={() => runMut.mutate()}
            disabled={runMut.isPending}
            className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60"
          >
            {runMut.isPending ? "…جاري التحليل" : "شغّل التحليل"}
          </button>
          <Link to="/marketwatch-health" className="text-sm text-blue-600 hover:underline">← العودة</Link>
        </div>
      </div>

      {runMut.data && (
        <div className="rounded border bg-emerald-50 p-3 text-sm text-emerald-900">
          ✅ التحليل تم — اقتراحات جديدة: {runMut.data.suggestions_created}
          · صفقات محسوبة: {runMut.data.stats.paper_trades_total}
          · win rate: {(runMut.data.stats.win_rate * 100).toFixed(0)}%
          · TP/SL/Trail: {runMut.data.stats.tp_hits}/{runMut.data.stats.sl_hits}/{runMut.data.stats.trail_hits}
        </div>
      )}
      {runMut.error && (
        <div className="rounded border bg-red-50 p-3 text-sm text-red-700">
          خطأ: {String((runMut.error as Error).message)}
        </div>
      )}

      {isLoading && <div className="text-gray-500">جاري التحميل…</div>}
      {error && <div className="text-red-600">خطأ: {String((error as Error).message)}</div>}

      <section>
        <h2 className="text-lg font-bold mb-2">🟡 اقتراحات في انتظار قرارك ({pending.length})</h2>
        {!pending.length && <div className="text-sm text-gray-500 border rounded p-4 bg-white">
          لا توجد اقتراحات معلّقة. اضغط "شغّل التحليل" لبدء الفحص.
        </div>}
        <div className="space-y-3">
          {pending.map(s => (
            <SuggestionCard
              key={s.id} s={s}
              onApply={() => applyMut.mutate(s.id)}
              onReject={() => rejectMut.mutate(s.id)}
              busy={applyMut.isPending || rejectMut.isPending}
            />
          ))}
        </div>
      </section>

      {handled.length > 0 && (
        <section>
          <h2 className="text-lg font-bold mb-2">📜 السجل ({handled.length})</h2>
          <div className="space-y-2">
            {handled.slice(0, 30).map(s => (
              <div key={s.id} className="border rounded p-3 bg-gray-50 text-sm flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{categoryLabel[s.category] ?? s.category}</div>
                  <div className="text-gray-600">{s.rationale}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(s.created_at).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  s.status === "applied" ? "bg-emerald-100 text-emerald-800" :
                  s.status === "rejected" ? "bg-gray-200 text-gray-700" : "bg-yellow-100 text-yellow-800"
                }`}>{s.status === "applied" ? "طُبِّق" : s.status === "rejected" ? "مرفوض" : s.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function SuggestionCard({ s, onApply, onReject, busy }: {
  s: Suggestion; onApply: () => void; onReject: () => void; busy: boolean;
}) {
  const isToggle = s.action_type === "toggle";
  const conf = s.confidence != null ? Math.round(s.confidence * 100) : null;
  return (
    <div className="border rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold">{categoryLabel[s.category] ?? s.category}</h3>
            {conf != null && (
              <span className={`text-xs px-2 py-0.5 rounded ${
                conf >= 70 ? "bg-emerald-100 text-emerald-800" :
                conf >= 40 ? "bg-yellow-100 text-yellow-800" : "bg-gray-100 text-gray-700"
              }`}>ثقة {conf}%</span>
            )}
            {!isToggle && <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">استشاري</span>}
          </div>
          <div className="text-sm text-gray-700 mt-1">{s.rationale}</div>
          <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
            {s.target_key && <span>الإعداد: <code className="bg-gray-100 px-1 rounded">{s.target_key}</code></span>}
            <span>الحالي: <b>{s.current_value ?? "—"}</b></span>
            <span>المقترح: <b className="text-blue-700">{s.suggested_value ?? "—"}</b></span>
            <span>مبني على {s.evidence_days} يوم</span>
          </div>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">الأدلة</summary>
            <pre className="bg-gray-50 border rounded p-2 mt-1 overflow-x-auto text-[11px]">
{JSON.stringify(s.evidence, null, 2)}
            </pre>
          </details>
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          {isToggle ? (
            <button
              onClick={onApply} disabled={busy}
              className="px-3 py-1.5 rounded bg-emerald-600 text-white text-sm hover:bg-emerald-700 disabled:opacity-60"
            >تطبيق</button>
          ) : (
            <button
              disabled title="يتطلب تعديل الكود يدوياً"
              className="px-3 py-1.5 rounded bg-gray-300 text-gray-600 text-sm cursor-not-allowed"
            >يدوي</button>
          )}
          <button
            onClick={onReject} disabled={busy}
            className="px-3 py-1.5 rounded border text-sm hover:bg-gray-50 disabled:opacity-60"
          >رفض</button>
        </div>
      </div>
    </div>
  );
}