import { createFileRoute } from "@tanstack/react-router";
import { ingestClosedTrades } from "@/lib/integration/outcome-loop.server";

/**
 * Backfill all 203 intelligence tiers from existing closed recommendations.
 * Loops `ingestClosedTrades` in large batches until no new rows are processed
 * (the internal `processed` set dedupes already-seen IDs).
 *
 * Use after deploying new tiers so they start affecting confidence immediately
 * instead of waiting for fresh outcomes to accumulate.
 */
export const Route = createFileRoute("/api/public/hooks/backfill-tiers")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const maxBatches = Math.min(50, Number(url.searchParams.get("batches") ?? 10));
        const batchSize = Math.min(5000, Number(url.searchParams.get("size") ?? 2000));

        let totalProcessed = 0;
        const batches: number[] = [];
        for (let i = 0; i < maxBatches; i++) {
          const { processed } = await ingestClosedTrades(batchSize);
          batches.push(processed);
          totalProcessed += processed;
          if (processed === 0) break; // nothing new to do
        }

        return new Response(
          JSON.stringify({
            success: true,
            totalProcessed,
            batchesRun: batches.length,
            perBatch: batches,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
      GET: async () =>
        new Response(
          JSON.stringify({
            usage: "POST /api/public/hooks/backfill-tiers?batches=10&size=2000",
          }),
          { headers: { "Content-Type": "application/json" } },
        ),
    },
  },
});