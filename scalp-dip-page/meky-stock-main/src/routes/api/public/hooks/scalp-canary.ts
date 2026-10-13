import { createFileRoute } from "@tanstack/react-router";
import { scanDailyCandidates } from "@/lib/scalp-dip/gap-fade-3d.server";

/** CANARY — re-run the canonical scan on an ARCHIVED day (dry, read-only).
 * GET /api/public/hooks/scalp-canary?date=YYYY-MM-DD
 * Verifies the pipeline end-to-end on historical marketwatch/tick data. */
export const Route = createFileRoute("/api/public/hooks/scalp-canary")({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get("date") ?? "";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
          return Response.json({ ok: false, error: "date=YYYY-MM-DD required" }, { status: 200 });
        try {
          const s = await scanDailyCandidates(date, true);
          return Response.json({
            ok: true,
            date,
            status: s.status,
            statusLabelAr: s.statusLabelAr,
            universe: s.universeCount,
            sizing: s.sizing,
            selected: s.selected.map((c) => ({
              symbol: c.symbol, gap_pct: +(c.gap_pct * 100).toFixed(2),
              entry: c.entry_price, position: Math.round(c.position_value),
              depth: Math.round(c.bid_depth_value), news_30h: c.news_30h ?? false,
            })),
            illiquid_count: s.filteredOutIlliquid.length,
          });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});
