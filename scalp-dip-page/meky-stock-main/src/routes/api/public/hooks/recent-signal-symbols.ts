import { createFileRoute } from "@tanstack/react-router";

// Aggressive coverage list (v4.1.83):
//   1) All `would_open` symbols since Cairo market open today
//   2) All currently-open paper_trades
//   3) Top-15 most-active day_tradable symbols today (from live_ticks)
// Deduplicated. Guarantees 15+ tabs/day for L2 collection.
// Read-only, no PII, passive interception only.
export const Route = createFileRoute(
  "/api/public/hooks/recent-signal-symbols",
)({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import(
            "@/integrations/supabase/client.server"
          );
          // Since Cairo market open today (08:00 UTC ≈ 10:00 Cairo).
          const now = new Date();
          const cairoDayStart = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth(),
              now.getUTCDate(),
              6, // 06:00 UTC = 08:00 Cairo, covers premarket + market
              0,
              0,
            ),
          ).toISOString();
          const [{ data: sigs }, { data: trades }, { data: active }] = await Promise.all([
            supabaseAdmin
              .from("scalp_signal_log")
              .select("symbol")
              .eq("decision", "would_open")
              .gte("ts", cairoDayStart)
              .limit(500),
            supabaseAdmin
              .from("paper_trades")
              .select("symbol")
              .eq("status", "open")
              .limit(200),
            // Top-15 day_tradable symbols by tick count today
            supabaseAdmin.rpc("top_active_day_tradable_today", { p_limit: 15 }),
          ]);
          const set = new Set<string>();
          for (const r of sigs || []) if (r?.symbol) set.add(String(r.symbol));
          for (const r of trades || [])
            if (r?.symbol) set.add(String(r.symbol));
          for (const r of (active as { symbol: string }[] | null) || [])
            if (r?.symbol) set.add(String(r.symbol));
          return Response.json({ ok: true, symbols: Array.from(set) });
        } catch (e) {
          return Response.json(
            { ok: false, symbols: [], error: String((e as Error).message) },
            { status: 200 },
          );
        }
      },
    },
  },
});