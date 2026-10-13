import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchFundamentals, saveFundamentals } from "@/lib/market-data/fundamentals.server";

/** Daily fundamentals refresh — runs once at 8:00 AM Cairo time. */
export const Route = createFileRoute("/api/public/hooks/fetch-fundamentals")({
  server: {
    handlers: {
      POST: async () => {
        const { data: stocks } = await supabaseAdmin
          .from("stocks")
          .select("symbol")
          .eq("is_active", true);
        if (!stocks || stocks.length === 0) {
          return Response.json({ ok: false, error: "no active stocks" });
        }
        const map = await fetchFundamentals(stocks.map((s) => s.symbol));
        await saveFundamentals(map);
        return Response.json({ ok: true, fetched: map.size });
      },
    },
  },
});