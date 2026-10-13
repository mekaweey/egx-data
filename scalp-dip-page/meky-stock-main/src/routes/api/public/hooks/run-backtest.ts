import { createFileRoute } from "@tanstack/react-router";
import { runBacktestJob } from "@/lib/backtest/run-job.server";

/**
 * Public HTTP endpoint to run a backtest. Used for automated sweeps from
 * agent tooling. Returns metrics JSON.
 */
export const Route = createFileRoute("/api/public/hooks/run-backtest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({}));
        const result = await runBacktestJob({
          minConfidence: Number(body?.minConfidence),
          warmup: Number(body?.warmup),
          maxHold: Number(body?.maxHold),
          requireNews: body?.requireNews === true,
          newsLookbackDays: body?.newsLookbackDays ? Number(body.newsLookbackDays) : undefined,
          fromDateFilter: typeof body?.fromDateFilter === "string" ? body.fromDateFilter : undefined,
          init: body?.init === true,
          finalize: body?.finalize === true,
          backtestId: typeof body?.backtestId === "string" ? body.backtestId : undefined,
          symbols: Array.isArray(body?.symbols) ? body.symbols.filter((s: unknown) => typeof s === "string") : undefined,
        });
        return Response.json(result);
      },
    },
  },
});