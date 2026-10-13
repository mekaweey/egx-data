import { createFileRoute } from "@tanstack/react-router";
import { ingestClosedTrades } from "@/lib/integration/outcome-loop.server";

export const Route = createFileRoute("/api/public/hooks/outcome-loop")({
  server: {
    handlers: {
      POST: async () => {
        const result = await ingestClosedTrades(500);
        return new Response(JSON.stringify({ success: true, ...result }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});