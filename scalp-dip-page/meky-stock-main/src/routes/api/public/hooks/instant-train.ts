import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recomputeAutoThreshold } from "@/lib/scan/auto-threshold.server";
import { updateEnsembleMetaWeights, runAdversarialLearner } from "@/lib/scan/adversarial-learner.server";
import { loadIsotonicCalibration } from "@/lib/scan/isotonic-calibration.server";
import { loadSymbolMemory } from "@/lib/scan/pattern-memory.server";
import { bootstrapOnlineCalibration } from "@/lib/scan/online-learning.server";
import { runBacktestJob } from "@/lib/backtest/run-job.server";
import { withSupabaseRetry } from "@/lib/supabase/retry.server";

/**
 * Instant Training Hook
 * ---------------------
 * بدل ما نستنى شهر داتا حقيقية، بنعمل تدريب فوري:
 *   1. لو مفيش backtest حديث (آخر 24 ساعة) → ندوّر backtest على آخر 6 شهور.
 *   2. نعيد حساب auto-threshold (الآن بيستخدم backtest_trades كـ bootstrap).
 *   3. نعيد حساب أوزان الـ ensemble.
 *   4. نشغّل adversarial learner لاستخراج قواعد الفشل.
 */
const TRAINING_SWEEPS = [
  { minConfidence: 55, warmup: 50, maxHold: 7 },
  { minConfidence: 60, warmup: 45, maxHold: 5 },
  { minConfidence: 65, warmup: 55, maxHold: 9 },
  { minConfidence: 70, warmup: 40, maxHold: 6 },
  { minConfidence: 75, warmup: 60, maxHold: 10 },
] as const;

export const Route = createFileRoute("/api/public/hooks/instant-train")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
        const url = new URL(request.url);
        const force = url.searchParams.get("force") === "1";
        const auto = url.searchParams.get("auto") === "1";

        const { data: cycleState } = await withSupabaseRetry("load learning cycle", () =>
          supabaseAdmin
            .from("model_state")
            .select("data")
            .eq("key", "learning_cycle_v1")
            .maybeSingle(),
        );
        const previousCycle = Number((cycleState?.data as { cycle?: number } | null)?.cycle ?? 0);
        const cycle = previousCycle + 1;
        const sweep = TRAINING_SWEEPS[previousCycle % TRAINING_SWEEPS.length];

        // 1) تحقق من وجود backtest سابق
        const { data: recent } = await withSupabaseRetry("load recent backtest", () =>
          supabaseAdmin
            .from("backtests")
            .select("id, finished_at, total_trades")
            .eq("status", "completed")
            .order("finished_at", { ascending: false })
            .limit(1),
        );

        const last = recent?.[0];
        // التعلم الفوري لازم يرجع بسرعة: لا نشغّل backtest كامل إلا بطلب صريح force=1.
        // تشغيله داخل نفس الطلب هو سبب 504، لذلك الزر العادي يعمل recalibration فقط.
        const fresh = !force && last && (last.total_trades ?? 0) > 50;

        let backtestResult: unknown = { skipped: true, reason: last ? "existing_backtest" : "no_backtest_yet", lastId: last?.id };
        if (force && !fresh) {
          // استدعاء مباشر بدل HTTP لتجنّب مشاكل الشبكة/SSL
          try {
            backtestResult = await runBacktestJob(sweep);
          } catch (err) {
            backtestResult = { ok: false, error: err instanceof Error ? err.message : String(err) };
          }
        }

        // 2-7) recalibrate كل الـ learners (تقرأ من backtest_trades كـ bootstrap)
        const [threshold, weights, adversarial, isotonic, memory, online] = await Promise.allSettled([
          recomputeAutoThreshold(),
          updateEnsembleMetaWeights(),
          runAdversarialLearner(),
          loadIsotonicCalibration(),    // يعيد بناء معايرة الثقة
          loadSymbolMemory(),            // يعيد بناء ذاكرة الأنماط لكل سهم
          bootstrapOnlineCalibration(),  // يملأ buckets الـ online من التاريخ
        ]);

        await withSupabaseRetry("save learning cycle", () =>
          supabaseAdmin.from("model_state").upsert({
            key: "learning_cycle_v1",
            data: {
              cycle,
              auto,
              sweep,
              last_run_at: new Date().toISOString(),
              last_backtest: backtestResult,
            } as any,
            updated_at: new Date().toISOString(),
          }),
        );

        return Response.json({
          ok: true,
          cycle,
          sweep,
          mode: auto ? "auto" : "manual",
          backtest: backtestResult,
          threshold: threshold.status === "fulfilled" ? threshold.value : { error: String(threshold.reason) },
          weights: weights.status === "fulfilled" ? weights.value : { error: String(weights.reason) },
          adversarial: adversarial.status === "fulfilled" ? adversarial.value : { error: String(adversarial.reason) },
          isotonic: isotonic.status === "fulfilled"
            ? { fitted: isotonic.value.fitted, samples: isotonic.value.sampleSize, bins: isotonic.value.bins.length }
            : { error: String(isotonic.reason) },
          symbol_memory: memory.status === "fulfilled"
            ? { symbols: memory.value.size }
            : { error: String(memory.reason) },
          online: online.status === "fulfilled" ? online.value : { error: String(online.reason) },
        });
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          console.error("[instant-train] handler failed:", err);
          return Response.json(
            { ok: false, error: message, hint: "تواصل الشبكة مع قاعدة البيانات فشل — جرّب تاني خلال ثواني" },
            { status: 200 },
          );
        }
      },
      GET: async () => Response.json({ ok: true, hint: "POST to trigger instant training" }),
    },
  },
});
