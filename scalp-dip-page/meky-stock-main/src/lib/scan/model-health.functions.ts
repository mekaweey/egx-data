import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { loadIsotonicCalibration } from "./isotonic-calibration.server";
import { loadSymbolMemory } from "./pattern-memory.server";

export type LearnerHealth = {
  key: string;
  name_ar: string;
  samples: number;
  level_pct: number;          // غير محدود: 100٪ = دورة تدريب كاملة، 200٪ = دورتين
  bar_pct: number;            // 0..100 لعرض الشريط فقط
  cycle: number;              // رقم دورة التدريب الحالية
  next_milestone: number;     // العينة المطلوبة للدورة التالية
  status: "cold" | "learning" | "trained" | "mature";
  last_update: string | null; // ISO
  weakness_ar: string;        // أين الضعف
  need_ar: string;            // ما الذي يحتاجه
  fix_ar: string;             // الحل المقترح
};

function levelFromSamples(n: number, target: number): Pick<LearnerHealth, "level_pct" | "bar_pct" | "cycle" | "next_milestone" | "status"> {
  const safeTarget = Math.max(1, target);
  const pct = Math.max(0, Math.round((n / safeTarget) * 100));
  const completedCycles = Math.floor(n / safeTarget);
  const cycle = completedCycles + 1;
  const withinCycle = n % safeTarget;
  const barPct = n === 0 ? 0 : completedCycles > 0 && withinCycle === 0 ? 100 : Math.round((withinCycle / safeTarget) * 100);
  const status: LearnerHealth["status"] =
    n === 0 ? "cold" : n < safeTarget * 0.3 ? "learning" : n < safeTarget ? "trained" : "mature";
  return { level_pct: pct, bar_pct: barPct, cycle, next_milestone: cycle * safeTarget, status };
}

export const getModelLearningHealth = createServerFn({ method: "GET" }).handler(async () => {
  const out: LearnerHealth[] = [];

  // 1) Ensemble meta-weights
  const { data: ensState } = await supabaseAdmin
    .from("model_state")
    .select("data, updated_at")
    .eq("key", "ensemble_meta_weights_v1")
    .maybeSingle();
  const weights = ((ensState?.data as { weights?: Record<string, number> } | null)?.weights) ?? {};
  const wKeys = Object.keys(weights);
  const wSpread = wKeys.length ? Math.max(...Object.values(weights)) - Math.min(...Object.values(weights)) : 0;
  const ensLvl = levelFromSamples(wKeys.length, 3);
  out.push({
    key: "ensemble_meta",
    name_ar: "أوزان الـ Ensemble (تصويت الموديلات)",
    samples: wKeys.length,
    ...ensLvl,
    last_update: ensState?.updated_at ?? null,
    weakness_ar: wKeys.length === 0
      ? "لا توجد أوزان متعلمة بعد"
      : wSpread < 0.1 ? "كل الموديلات بنفس الوزن — لم يميّز بينهم بعد"
      : "جيد — يميّز بين الموديلات",
    need_ar: "≥ 5 موديلات بتصويتات مغلقة النتيجة",
    fix_ar: "شغّل ⚡ تعلّم فوري أو زوّد عدد الصفقات المغلقة",
  });

  // 2) Isotonic calibration
  const iso = await loadIsotonicCalibration();
  const isoLvl = levelFromSamples(iso.sampleSize, 150);
  const filledBins = iso.bins.filter((b) => b.n >= 5).length;
  out.push({
    key: "isotonic",
    name_ar: "معايرة الثقة (Isotonic)",
    samples: iso.sampleSize,
    ...isoLvl,
    status: iso.fitted ? isoLvl.status : "cold",
    last_update: new Date().toISOString(),
    weakness_ar: !iso.fitted
      ? "عينة صغيرة (<50) — الثقة المعروضة = الخام"
      : filledBins < 5 ? `${filledBins}/11 شرائح ثقة فقط بها داتا كافية`
      : "معايرة جيدة عبر شرائح الثقة",
    need_ar: "≥ 200 توصية مغلقة موزعة على شرائح الثقة 30%-95%",
    fix_ar: "شغّل backtest على فترة أطول، ثم ⚡ تعلّم فوري",
  });

  // 3) Symbol pattern memory
  const sm = await loadSymbolMemory();
  const smLvl = levelFromSamples(sm.size, 20);
  out.push({
    key: "symbol_memory",
    name_ar: "ذاكرة الأنماط لكل سهم",
    samples: sm.size,
    ...smLvl,
    last_update: new Date().toISOString(),
    weakness_ar: sm.size === 0
      ? "لا توجد سجلات تاريخية لأي سهم"
      : sm.size < 15 ? `${sm.size} سهم فقط لديهم تاريخ كافٍ (≥3 صفقات)`
      : "ذاكرة جيدة لمعظم الأسهم النشطة",
    need_ar: "≥ 3 توصيات مغلقة لكل سهم، ≥ 30 سهم",
    fix_ar: "شغّل scan يومي + backtest تاريخي ثم ⚡ تعلّم فوري",
  });

  // 4) Online calibration buckets
  const { data: online } = await supabaseAdmin
    .from("signal_failures")
    .select("rule_json, total_count, last_updated")
    .eq("pattern_name", "__online_calibration__")
    .maybeSingle();
  const onN = online?.total_count ?? 0;
  const onLvl = levelFromSamples(onN, 100);
  const buckets = ((online?.rule_json as { buckets?: { n: number }[] } | null)?.buckets) ?? [];
  const filledOn = buckets.filter((b) => b.n >= 5).length;
  out.push({
    key: "online_calibration",
    name_ar: "تعلّم تدريجي بعد كل صفقة (Online)",
    samples: onN,
    ...onLvl,
    last_update: online?.last_updated ?? null,
    weakness_ar: onN === 0
      ? "لم يبدأ التعلم — لا توجد نتائج مدخلة"
      : filledOn < 3 ? "معظم شرائح الثقة فاضية"
      : "يتعلم باستمرار",
    need_ar: "تحديث outcome للتوصيات يومياً (cron: update-outcomes)",
    fix_ar: "تأكد أن /api/public/hooks/update-outcomes يعمل يومياً",
  });

  // 5) Instant training cycles (recalibration runs)
  const { data: cycleState } = await supabaseAdmin
    .from("model_state")
    .select("data, updated_at")
    .eq("key", "learning_cycle_v1")
    .maybeSingle();
  const instantCycles = Number((cycleState?.data as { cycle?: number } | null)?.cycle ?? 0);
  const cycLvl = levelFromSamples(instantCycles, 1);
  out.push({
    key: "instant_cycles",
    name_ar: "دورات التدريب الفوري",
    samples: instantCycles,
    ...cycLvl,
    last_update: cycleState?.updated_at ?? null,
    weakness_ar: instantCycles === 0
      ? "لم يتم تشغيل التدريب الفوري بعد"
      : "كل دورة تعيد معايرة العتبات والأوزان والذاكرة",
    need_ar: "دورات متكررة بعد كل تحديث بيانات أو backtest جديد",
    fix_ar: "اضغط ⚡ تعلّم فوري أو 🚀 حل شامل لزيادة دورة التدريب",
  });

  // 6) Failure rules (Adversarial learner)
  const { data: rules } = await supabaseAdmin
    .from("signal_failures")
    .select("id, pattern_name, last_updated", { count: "exact" })
    .neq("pattern_name", "__online_calibration__")
    .eq("is_active", true);
  const rN = rules?.length ?? 0;
  const rLvl = levelFromSamples(rN, 8);
  const lastRule = rules?.reduce<string | null>((acc, r) =>
    !acc || (r.last_updated && r.last_updated > acc) ? r.last_updated : acc, null) ?? null;
  out.push({
    key: "failure_rules",
    name_ar: "قواعد الفشل (Adversarial)",
    samples: rN,
    ...rLvl,
    last_update: lastRule,
    weakness_ar: rN === 0
      ? "لم يكتشف أنماط فشل بعد"
      : rN < 5 ? "قواعد قليلة — قد لا يغطي كل سيناريوهات الفشل"
      : "غطاء جيد لأنماط الفشل المتكررة",
    need_ar: "≥ 30 توصية خاسرة (realized_pct ≤ -1.5%)",
    fix_ar: "اترك النظام يشتغل أسبوع + شغّل ⚡ تعلّم فوري",
  });

  // 7) Backtest corpus (الوقود الأساسي للكل)
  const { count: btCount } = await supabaseAdmin
    .from("backtest_trades")
    .select("id", { count: "exact", head: true });
  const btLvl = levelFromSamples(btCount ?? 0, 1500);
  out.push({
    key: "backtest_corpus",
    name_ar: "قاعدة بيانات الصفقات التاريخية",
    samples: btCount ?? 0,
    ...btLvl,
    last_update: null,
    weakness_ar: (btCount ?? 0) < 500
      ? "بيانات تاريخية قليلة — كل التعلم سيكون ضعيف"
      : "بيانات كافية للتعلم",
    need_ar: "≥ 2000 صفقة تاريخية (backtest 6+ شهور)",
    fix_ar: "شغّل /api/public/hooks/run-backtest على فترة أطول",
  });

  // 8) Closed real recommendations
  const { count: recoCount } = await supabaseAdmin
    .from("recommendations")
    .select("id", { count: "exact", head: true })
    .neq("outcome", "pending");
  const rcLvl = levelFromSamples(recoCount ?? 0, 200);
  out.push({
    key: "real_outcomes",
    name_ar: "نتائج التوصيات الحقيقية",
    samples: recoCount ?? 0,
    ...rcLvl,
    last_update: null,
    weakness_ar: (recoCount ?? 0) < 50
      ? "النظام يعتمد بالكامل على backtest — لم يثبت نفسه حقيقياً بعد"
      : (recoCount ?? 0) < 200 ? "بداية جيدة — يحتاج مزيد من الوقت الحقيقي"
      : "ثقة عالية في الأداء الحقيقي",
    need_ar: "≥ 300 توصية حقيقية تم إغلاقها بنتيجة",
    fix_ar: "اترك النظام يعمل يومياً وحدّث النتائج (cron تلقائي)",
  });

  // Overall score
  const overall = Math.round(out.reduce((s, h) => s + h.level_pct, 0) / out.length);
  const overallBar = Math.round(out.reduce((s, h) => s + h.bar_pct, 0) / out.length);
  const overallCycle = Math.max(1, Math.floor(overall / 100) + 1);
  const overallStatus: LearnerHealth["status"] =
    overall < 20 ? "cold" : overall < 50 ? "learning" : overall < 80 ? "trained" : "mature";

  return {
    learners: out,
    overall_pct: overall,
    overall_bar_pct: overallBar,
    overall_cycle: overallCycle,
    overall_status: overallStatus,
    summary_ar:
      overallStatus === "cold" ? "النظام لسه بيتعلم من الصفر — شغّل backtest + ⚡ تعلّم فوري"
      : overallStatus === "learning" ? "النظام في طور التعلم — النتائج تتحسن مع كل تشغيل"
      : overallStatus === "trained" ? "النظام مدرّب جيداً — يحتاج بيانات حقيقية أكثر للنضج"
      : "النظام ناضج — استمرار التعلم اللحظي يحافظ على الأداء",
  };
});