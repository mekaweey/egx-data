import { createFileRoute } from "@tanstack/react-router";
import { runAdaptiveLearning } from "@/lib/scan/adaptive-learning.server";

/** Weekly self-learning job — every Friday at 10 PM. */
export const Route = createFileRoute("/api/public/hooks/weekly-learning")({
  server: {
    handlers: {
      POST: async () => {
        const result = await runAdaptiveLearning();
        return Response.json({ ok: true, ...result });
      },
    },
  },
});