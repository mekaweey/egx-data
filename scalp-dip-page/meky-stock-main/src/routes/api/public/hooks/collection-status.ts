import { createFileRoute } from "@tanstack/react-router";

/**
 * Public read-only probe: is the Thunder extension actually collecting
 * everything we expect today?
 *   - live_ticks (thunder_ext)  → أسعار لحظية
 *   - scalp_timeline_events     → توقيت مراحل كل إشارة
 *   - orderbook_snapshots       → L2 (Level 2)
 *
 * Consumed by <ScalpCollectionStatus /> on the Scalp page.
 * No PII, no auth.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

function cairoDateISO(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

export const Route = createFileRoute("/api/public/hooks/collection-status")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const dayStartCairo = `${cairoDateISO(now)}T07:00:00Z`;
        const since5m = new Date(now.getTime() - 5 * 60_000).toISOString();

        const [tickLatest, tick5m, tlLatest, tlToday, obLatest, obToday] = await Promise.all([
          supabaseAdmin.from("live_ticks").select("ts, symbol")
            .eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("live_ticks").select("symbol", { count: "exact", head: true })
            .eq("source", "thunder_ext").gte("ts", since5m),
          supabaseAdmin.from("scalp_timeline_events").select("at_ms, event, symbol")
            .order("at_ms", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("scalp_timeline_events").select("event", { count: "exact", head: true })
            .gte("at_ms", new Date(dayStartCairo).getTime()),
          supabaseAdmin.from("orderbook_snapshots").select("ts, symbol")
            .order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("orderbook_snapshots").select("symbol", { count: "exact", head: true })
            .gte("ts", dayStartCairo),
        ]);

        const tickTs = tickLatest.data?.ts ?? null;
        const tickAgo = tickTs ? Math.round((now.getTime() - new Date(tickTs).getTime()) / 1000) : null;
        const tlTs = tlLatest.data?.at_ms ? new Date(Number(tlLatest.data.at_ms)).toISOString() : null;
        const tlAgo = tlLatest.data?.at_ms ? Math.round((now.getTime() - Number(tlLatest.data.at_ms)) / 1000) : null;
        const obTs = obLatest.data?.ts ?? null;
        const obAgo = obTs ? Math.round((now.getTime() - new Date(obTs).getTime()) / 1000) : null;

        return new Response(JSON.stringify({
          ok: true,
          now: now.toISOString(),
          ticks: { lastTs: tickTs, lastAgoSec: tickAgo, count5m: tick5m.count ?? 0, lastSymbol: tickLatest.data?.symbol ?? null },
          timeline: { lastTs: tlTs, lastAgoSec: tlAgo, countToday: tlToday.count ?? 0, lastEvent: tlLatest.data?.event ?? null, lastSymbol: tlLatest.data?.symbol ?? null },
          l2: { lastTs: obTs, lastAgoSec: obAgo, countToday: obToday.count ?? 0, lastSymbol: obLatest.data?.symbol ?? null },
        }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
      },
    },
  },
});
