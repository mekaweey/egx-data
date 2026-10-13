import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { getModelLearningHealth, type LearnerHealth } from "@/lib/scan/model-health.functions";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "مستوى تعلّم الموديلات" },
      { name: "description", content: "تشخيص لحظي لمستوى التعلم لكل موديل ونقاط الضعف والحلول." },
    ],
  }),
  component: LearningPage,
});

const STATUS: Record<LearnerHealth["status"], { label: string; cls: string }> = {
  cold: { label: "بارد", cls: "bg-bear/20 text-bear" },
  learning: { label: "بيتعلم", cls: "bg-yellow-500/20 text-yellow-500" },
  trained: { label: "متدرّب", cls: "bg-primary/20 text-primary" },
  mature: { label: "ناضج", cls: "bg-bull/20 text-bull" },
};

function ago(iso: string | null) {
  if (!iso) return "—";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  if (s < 86400) return `${Math.floor(s / 3600)}س`;
  return `${Math.floor(s / 86400)}ي`;
}

function LearnerCard({ h }: { h: LearnerHealth }) {
  const s = STATUS[h.status];
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-bold">{h.name_ar}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {h.samples.toLocaleString("en")} عينة • آخر تحديث {ago(h.last_update)}
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full ${
            h.level_pct >= 80 ? "bg-bull" : h.level_pct >= 50 ? "bg-primary" : h.level_pct >= 20 ? "bg-yellow-500" : "bg-bear"
          }`}
          style={{ width: `${h.bar_pct}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>الدورة {h.cycle.toLocaleString("en")}</span>
        <span>{h.level_pct.toLocaleString("en")}٪ • القادم عند {h.next_milestone.toLocaleString("en")} عينة</span>
      </div>

      <div className="mt-3 space-y-1.5 text-xs">
        <div><span className="text-bear">⚠️ الضعف:</span> <span className="text-muted-foreground">{h.weakness_ar}</span></div>
        <div><span className="text-primary">🎯 محتاج:</span> <span className="text-muted-foreground">{h.need_ar}</span></div>
        <div><span className="text-bull">💡 الحل:</span> <span className="text-muted-foreground">{h.fix_ar}</span></div>
      </div>
    </div>
  );
}

async function requestInstantTraining() {
  const r = await fetch("/api/public/hooks/instant-train", { method: "POST" });
  const text = await r.text();
  let j: any = {};
  try {
    j = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`رد غير متوقع من السيرفر (${r.status})`);
  }
  if (!r.ok || j?.ok === false) {
    throw new Error(j?.error || j?.hint || `HTTP ${r.status}`);
  }
  return j;
}

function LearningPage() {
  const fetchHealth = useServerFn(getModelLearningHealth);
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["model-learning-health"],
    queryFn: () => fetchHealth(),
  });

  const [training, setTraining] = useState(false);
  const [trainMsg, setTrainMsg] = useState<string | null>(null);
  const [megaRunning, setMegaRunning] = useState(false);
  const [megaStep, setMegaStep] = useState(0);
  const [megaTotal, setMegaTotal] = useState(0);
  const [megaEta, setMegaEta] = useState<number | null>(null);
  const [megaMsg, setMegaMsg] = useState<string | null>(null);
  const [autoTrain, setAutoTrain] = useState(false);
  const [autoCount, setAutoCount] = useState(0);
  const autoBusyRef = useRef(false);

  async function runInstantTrain() {
    setTraining(true);
    setTrainMsg("جاري التدريب الفوري السريع على كل الموديلات...");
    try {
      const j = await requestInstantTraining();
      const rules = j?.adversarial?.rules_added ?? 0;
      const models = j?.weights?.models ?? 0;
      const isoN = j?.isotonic?.samples ?? 0;
      const sym = j?.symbol_memory?.symbols ?? 0;
      const cycle = j?.cycle ? ` • دورة #${Number(j.cycle).toLocaleString("en")}` : "";
      setTrainMsg(`✅ ${models} موديل أُعيد توزينه • ${rules} قاعدة فشل جديدة • ${isoN} عينة معايرة • ${sym} سهم في الذاكرة${cycle}`);
      await refetch();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setTrainMsg(`❌ فشل التدريب — ${msg}`);
    } finally {
      setTraining(false);
    }
  }

  useEffect(() => {
    if (!autoTrain) return;
    let cancelled = false;
    (async () => {
      while (!cancelled) {
        try {
          const j = await requestInstantTraining();
          if (cancelled) break;
          const cycle = j?.cycle ? ` • دورة #${Number(j.cycle).toLocaleString("en")}` : "";
          setAutoCount((n) => n + 1);
          setTrainMsg(`🔁 تدريب دائم يعمل${cycle}`);
          await refetch();
        } catch (e) {
          if (cancelled) break;
          const msg = e instanceof Error ? e.message : String(e);
          setTrainMsg(`⚠️ تدريب دائم — ${msg} (إعادة المحاولة بعد 3ث)`);
          await new Promise((r) => setTimeout(r, 3000));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [autoTrain, refetch]);

  async function runMegaFix() {
    const TOTAL = 5;
    setMegaRunning(true);
    setMegaStep(0);
    setMegaTotal(TOTAL);
    setMegaEta(null);
    setMegaMsg("جاري تشغيل الحل الشامل...");
    const started = Date.now();
    let totalRules = 0, totalModels = 0, totalIso = 0, totalSym = 0, lastCycle = 0;
    try {
      for (let i = 1; i <= TOTAL; i++) {
        const j = await requestInstantTraining();
        totalRules += Number(j?.adversarial?.rules_added ?? 0);
        totalModels = Math.max(totalModels, Number(j?.weights?.models ?? 0));
        totalIso = Math.max(totalIso, Number(j?.isotonic?.samples ?? 0));
        totalSym = Math.max(totalSym, Number(j?.symbol_memory?.symbols ?? 0));
        lastCycle = Number(j?.cycle ?? lastCycle);
        setMegaStep(i);
        const elapsed = (Date.now() - started) / 1000;
        const perStep = elapsed / i;
        setMegaEta(Math.round(perStep * (TOTAL - i)));
        await refetch();
      }
      setMegaMsg(`✅ تم! ${TOTAL} دورات تدريب • ${totalModels} موديل • ${totalRules} قاعدة فشل جديدة • ${totalIso} عينة معايرة • ${totalSym} سهم • آخر دورة #${lastCycle.toLocaleString("en")}`);
      setMegaEta(0);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMegaMsg(`❌ فشل الحل الشامل — ${msg}`);
    } finally {
      setMegaRunning(false);
    }
  }

  const megaPct = megaTotal ? Math.round((megaStep / megaTotal) * 100) : 0;

  const overall = data?.overall_pct ?? 0;
  const overallBar = data?.overall_bar_pct ?? Math.min(100, overall);
  const overallCycle = data?.overall_cycle ?? 1;
  const overallS = data ? STATUS[data.overall_status] : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧠 مستوى تعلّم الموديلات</h1>
          <p className="mt-1 text-sm text-muted-foreground">تشخيص لحظي لكل learner — نقاط الضعف والحلول.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={runMegaFix} disabled={megaRunning || training}
            className="rounded-lg bg-gradient-to-r from-bull to-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {megaRunning ? `يحلّ... ${megaPct}٪` : "🚀 حل شامل"}
          </button>
          <button onClick={runInstantTrain} disabled={training}
            className="rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {training ? "يتعلّم..." : "⚡ تعلّم فوري"}
          </button>
          <button onClick={() => setAutoTrain((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-bold hover:opacity-90 ${autoTrain ? "bg-bull text-primary-foreground animate-pulse" : "border border-border bg-card"}`}>
            {autoTrain ? `🔁 تدريب دائم: شغّال (${autoCount.toLocaleString("en")})` : "♾️ تدريب دائم"}
          </button>
          <button onClick={() => refetch()} disabled={isFetching}
            className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary">
            {isFetching ? "..." : "تحديث"}
          </button>
          <Link to="/daily" className="rounded-lg border border-border bg-card px-4 py-2 text-sm hover:border-primary">صفقة اليوم</Link>
        </div>
      </div>

      {(megaRunning || megaMsg) && (
        <div className="mb-4 rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold">🚀 الحل الشامل</span>
            <span className="text-muted-foreground">
              {megaRunning
                ? `الخطوة ${megaStep.toLocaleString("en")} من ${megaTotal.toLocaleString("en")}${megaEta !== null ? ` • متبقي ~${megaEta.toLocaleString("en")} ث` : ""}`
                : megaEta === 0 ? "اكتمل" : ""}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-gradient-to-r from-bull to-primary transition-all duration-500"
              style={{ width: `${megaPct}%` }} />
          </div>
          {megaMsg && <div className="mt-2 text-sm">{megaMsg}</div>}
        </div>
      )}

      {trainMsg && (
        <div className="mb-4 rounded-lg border border-border bg-card px-4 py-2 text-sm">{trainMsg}</div>
      )}

      {isLoading && <div className="text-center text-muted-foreground">جاري التحميل...</div>}

      {data && overallS && (
        <div className="mb-6 rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-muted-foreground">المستوى الإجمالي للنظام</div>
              <div className="mt-1 text-3xl font-bold">{overall.toLocaleString("en")}٪</div>
              <div className="mt-1 text-xs text-muted-foreground">تدريب مستمر • الدورة {overallCycle.toLocaleString("en")}</div>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-bold ${overallS.cls}`}>{overallS.label}</span>
          </div>
          <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${overall >= 80 ? "bg-bull" : overall >= 50 ? "bg-primary" : overall >= 20 ? "bg-yellow-500" : "bg-bear"}`}
              style={{ width: `${overallBar}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">{data.summary_ar}</p>
        </div>
      )}

      {data && (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.learners.map((h) => <LearnerCard key={h.key} h={h} />)}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-border bg-muted/20 p-4 text-xs leading-6 text-muted-foreground">
        <strong className="text-foreground">📊 كيف تقرأ هذه الصفحة:</strong>
        <ul className="mt-2 list-disc space-y-1 ps-5">
          <li><strong>المستوى</strong> غير محدود: 100٪ تعني دورة تدريب كاملة، و200٪ تعني دورتين، وهكذا.</li>
          <li><strong>بارد</strong> (0-20٪): يعطي قرارات افتراضية فقط. <strong>بيتعلم</strong> (20-50٪): تحسّن ملحوظ كل تشغيل.</li>
          <li><strong>متدرّب</strong> (50-80٪): قرارات موثوقة. <strong>ناضج</strong> (≥80٪): استقرار طويل المدى.</li>
          <li>زرّ <strong>⚡ تعلّم فوري</strong> يضيف دورة تدريب جديدة ولا يقفل التعلم عند 100٪.</li>
          <li>التدريب التلقائي يعمل عدة مرات يومياً ويدوّر إعدادات backtest مختلفة عشان يزود الخبرة بدون سقف.</li>
        </ul>
      </div>
    </div>
  );
}