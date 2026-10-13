import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchLiveTick } from "@/lib/live/live-quote.server";

/**
 * Runs every 30s during ORB window (10:00 → 10:35 Cairo).
 * Round-robins across the 3 scrapers using minute-of-hour parity.
 */
export const Route = createFileRoute("/api/public/hooks/sniper-poll")({
  server: {
    handlers: {
      POST: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { data: pick } = await supabaseAdmin
          .from("sniper_picks").select("symbol").eq("pick_date", today).maybeSingle();
        if (!pick) return Response.json({ ok: false, reason: "no pick for today" });

        const { data: stock } = await supabaseAdmin
          .from("stocks").select("symbol,yahoo_symbol,investing_slug")
          .eq("symbol", pick.symbol).maybeSingle();
        if (!stock) return Response.json({ ok: false, reason: "stock not found" });

        const idx = Math.floor(Date.now() / 1000 / 10) % 3;
        const tick = await fetchLiveTick(stock.symbol, stock.yahoo_symbol, stock.investing_slug, idx);
        return Response.json({ ok: !!tick, tick });
      },
    },
  },
});