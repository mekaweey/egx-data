import { createFileRoute } from "@tanstack/react-router";

/**
 * Orchestrator: runs a full backtest end-to-end (init → parallel chunks → finalize).
 * Designed to be invoked by pg_cron on a weekly schedule.
 *
 * Body (all optional):
 *   - days: number (default 90) → fromDateFilter = today - days*2 (covers warmup).
 *   - requireNews: boolean (default false)
 *   - chunkSize: number of symbols per chunk (default 5)
 *   - parallelism: how many chunk requests in flight (default 3)
 */
export const Route = createFileRoute("/api/public/hooks/auto-backtest")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = await request.json().catch(() => ({} as Record<string, unknown>));
        const days = Math.max(7, Math.min(1825, Number(body?.days) || 90));
        const requireNews = body?.requireNews === true;
        const chunkSize = Math.max(1, Math.min(20, Number(body?.chunkSize) || 5));
        const parallelism = Math.max(1, Math.min(6, Number(body?.parallelism) || 3));

        // 180 calendar days covers ~90 trading days + 30-day warmup. Scale with days.
        const fromDate = new Date(Date.now() - days * 2 * 86400_000).toISOString().slice(0, 10);

        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const endpoint = `${base}/api/public/hooks/run-backtest`;

        const post = (payload: unknown) =>
          fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }).then((r) => r.json() as Promise<Record<string, unknown>>);

        // 1) init
        const init = await post({ init: true, fromDateFilter: fromDate, requireNews });
        const backtestId = init?.backtestId as string | undefined;
        const symbols = (init?.symbols as string[] | undefined) ?? [];
        if (!backtestId || symbols.length === 0) {
          return Response.json({ ok: false, stage: "init", init }, { status: 500 });
        }

        // 2) chunks (run in parallel batches)
        const chunks: string[][] = [];
        for (let i = 0; i < symbols.length; i += chunkSize) chunks.push(symbols.slice(i, i + chunkSize));
        const chunkResults: unknown[] = [];
        for (let i = 0; i < chunks.length; i += parallelism) {
          const batch = chunks.slice(i, i + parallelism).map((syms) =>
            post({ backtestId, fromDateFilter: fromDate, requireNews, symbols: syms }).catch((e) => ({ error: String(e) })),
          );
          const out = await Promise.all(batch);
          chunkResults.push(...out);
        }

        // 3) finalize
        const finalize = await post({ backtestId, finalize: true });

        return Response.json({
          ok: true,
          backtestId,
          fromDate,
          requireNews,
          symbols: symbols.length,
          chunks: chunks.length,
          regimesCached: init?.regimesCached ?? 0,
          metrics: (finalize as { metrics?: unknown })?.metrics,
        });
      },
    },
  },
});