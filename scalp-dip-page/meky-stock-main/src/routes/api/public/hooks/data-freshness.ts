import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { cairoNow } from "@/lib/scalp-dip/momentum-weekly.server";

/**
 * Public read-only data-freshness probe for the weekly operations page.
 * The page previously inferred "no recent data" from marketwatch_snapshots /
 * live_ticks recency — but those are extension-fed and empty BY DESIGN in the
 * scanner-based weekly system, so the warning was always a false alarm.
 *
 * The data the weekly engine ACTUALLY trades on is `daily_candles` (scanner
 * synced after every close). Health rule: max(date) within the last 4 calendar
 * days = healthy (a Fri/Sat weekend is 2-3 days old by Monday — normal).
 *
 * GET /api/public/hooks/data-freshness
 * → { ok, maxDate, ageDays, healthy, symbolsOnMaxDate, checkedAt }
 */

export const Route = createFileRoute("/api/public/hooks/data-freshness")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const now = cairoNow();
          const { data: latest } = await supabaseAdmin
            .from("daily_candles")
            .select("date")
            .order("date", { ascending: false })
            .limit(1)
            .maybeSingle();

          const maxDate: string | null = latest ? String((latest as { date: string }).date) : null;
          let symbolsOnMaxDate: number | null = null;
          if (maxDate) {
            const { count } = await supabaseAdmin
              .from("daily_candles")
              .select("symbol", { count: "exact", head: true })
              .eq("date", maxDate);
            symbolsOnMaxDate = count ?? null;
          }
          const ageDays =
            maxDate != null
              ? Math.floor((Date.now() - Date.parse(`${maxDate}T00:00:00Z`)) / 86_400_000)
              : null;
          // <= 4 calendar days = healthy (weekend-proof). Null date = no data.
          const healthy = ageDays != null && ageDays <= 4;

          return Response.json(
            {
              ok: true,
              maxDate,
              ageDays,
              healthy,
              symbolsOnMaxDate: symbolsOnMaxDate ?? null,
              checkedAt: now.toISOString(),
            },
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        } catch (e: any) {
          return Response.json(
            { ok: false, error: e?.message ?? "freshness probe failed", healthy: false },
            { status: 500, headers: { "Content-Type": "application/json" } },
          );
        }
      },
    },
  },
});
