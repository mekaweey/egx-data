import { createFileRoute } from "@tanstack/react-router";
import { runSelfCalibration } from "@/lib/learning/self-calibration.server";

export const Route = createFileRoute("/api/public/hooks/self-calibrate")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const calib = await runSelfCalibration();
          return new Response(JSON.stringify({ ok: true, calib }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (e) {
          return new Response(
            JSON.stringify({ ok: false, error: (e as Error).message }),
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});