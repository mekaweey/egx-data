import { createFileRoute } from "@tanstack/react-router";
import {
  runAdversarialLearner,
  updateEnsembleMetaWeights,
} from "@/lib/scan/adversarial-learner.server";
import { recomputeAutoThreshold } from "@/lib/scan/auto-threshold.server";

/**
 * Self-improvement loop — يعمل تلقائياً يومياً:
 *   1. recomputeAutoThreshold: يحدّث الـ threshold الأمثل
 *   2. updateEnsembleMetaWeights: يعيد توزين الموديلات حسب أدائها
 *   3. runAdversarialLearner: يستخرج قواعد فشل جديدة
 */
export const Route = createFileRoute("/api/public/hooks/self-improve")({
  server: {
    handlers: {
      POST: async () => {
        const [threshold, weights, adversarial] = await Promise.allSettled([
          recomputeAutoThreshold(),
          updateEnsembleMetaWeights(),
          runAdversarialLearner(),
        ]);
        return Response.json({
          ok: true,
          threshold: threshold.status === "fulfilled" ? threshold.value : null,
          weights: weights.status === "fulfilled" ? weights.value : null,
          adversarial: adversarial.status === "fulfilled" ? adversarial.value : null,
        });
      },
      GET: async () => {
        return Response.json({ ok: true, hint: "POST to trigger self-improvement" });
      },
    },
  },
});