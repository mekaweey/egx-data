import { createFileRoute } from "@tanstack/react-router";
import { computeScalpFeasibility } from "@/lib/scalp-feasibility/compute.functions";

// Called by pg_cron every day after market close (Africa/Cairo 15:10).
// No auth: /api/public/* bypass; work is idempotent (upsert on signal_id).
export const Route = createFileRoute(
  "/api/public/hooks/compute-scalp-feasibility",
)({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let tradeDate: string | undefined;
        try {
          const body = (await request.json()) as { tradeDate?: string };
          tradeDate = body.tradeDate;
        } catch {
          // empty body ok
        }
        const result = await computeScalpFeasibility({ data: { tradeDate } });
        return Response.json({ ok: true, ...result });
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tradeDate = url.searchParams.get("tradeDate") || undefined;
        const result = await computeScalpFeasibility({ data: { tradeDate } });
        return Response.json({ ok: true, ...result });
      },
    },
  },
});