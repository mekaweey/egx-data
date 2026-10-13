import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Cron hook - runs daily before market open to:
 * 1. Update outcomes for open picks (check if target/stop was hit)
 * 2. The /today page will compute fresh picks on demand
 */
export const Route = createFileRoute("/api/public/hooks/daily-pick")({
  server: {
    handlers: {
      POST: async () => {
        const { data: openPicks } = await supabaseAdmin
          .from("daily_picks")
          .select("*")
          .eq("status", "open");

        let updated = 0;
        for (const p of openPicks ?? []) {
          const endDate = new Date(p.pick_date);
          endDate.setDate(endDate.getDate() + p.max_hold_days + 1);

          const { data: candles } = await supabaseAdmin
            .from("daily_candles")
            .select("date,open,high,low,close")
            .eq("symbol", p.symbol)
            .gt("date", p.pick_date)
            .lte("date", endDate.toISOString().slice(0, 10))
            .order("date");

          if (!candles?.length) continue;

          const entry = Number(p.entry_price);
          const tgt = Number(p.target_price);
          const stp = Number(p.stop_price);
          let status: string | null = null;
          let exitPrice = 0;
          let exitDate = "";

          for (const c of candles) {
            if (+c.high >= tgt) { status = "win"; exitPrice = tgt; exitDate = c.date; break; }
            if (+c.low <= stp) { status = "loss"; exitPrice = stp; exitDate = c.date; break; }
          }
          if (!status && candles.length >= p.max_hold_days) {
            const last = candles[Math.min(candles.length - 1, p.max_hold_days - 1)];
            exitPrice = +last.close;
            exitDate = last.date;
            status = exitPrice > entry ? "win" : exitPrice < entry ? "loss" : "expired";
          }

          if (status) {
            const pnlPct = (exitPrice / entry - 1) * 100;
            await supabaseAdmin
              .from("daily_picks")
              .update({
                status,
                exit_price: exitPrice,
                exit_date: exitDate,
                pnl_pct: pnlPct,
              })
              .eq("id", p.id);
            updated++;
          }
        }

        return new Response(JSON.stringify({ ok: true, updated }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});