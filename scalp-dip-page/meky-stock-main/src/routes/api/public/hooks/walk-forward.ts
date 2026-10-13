import { createFileRoute } from "@tanstack/react-router";
import { runWalkForward } from "@/lib/backtest/walk-forward.functions";

export const Route = createFileRoute("/api/public/hooks/walk-forward")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { days?: number; minConfidence?: number; picksPerDay?: number } = {};
        try { body = await request.json(); } catch { /* empty body ok */ }
        const result = await runWalkForward({ data: body });
        return new Response(JSON.stringify({ success: true, ...result }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      },
      GET: async () => {
        const result = await runWalkForward({ data: {} });
        return new Response(JSON.stringify({ success: true, ...result }, null, 2), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});