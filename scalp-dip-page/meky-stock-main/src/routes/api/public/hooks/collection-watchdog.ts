import { createFileRoute } from "@tanstack/react-router";
import { getMarketStatus } from "@/lib/market-hours";

/**
 * Live health probe for the Thunder collection pipeline.
 * Read-only. No PII. No writes. No calls to Thunder.
 *
 * Consumed by <CollectionWatchdogPanel /> on /scalp (polls every 10s).
 *
 * Status is only "red/yellow" when the Cairo market is open — outside
 * hours everything is "idle" (grey) so we never alert on expected silence.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

type Level = "green" | "yellow" | "red" | "idle";
type Check = {
  key: string;
  label: string;
  status: Level;
  lastAgoSec: number | null;
  countRecent: number;
  message: string;
  expected: string;
};

function classify(
  ageSec: number | null,
  marketOpen: boolean,
  redAfter: number,
  yellowAfter: number,
): Level {
  if (!marketOpen) return "idle";
  if (ageSec == null) return "red";
  if (ageSec >= redAfter) return "red";
  if (ageSec >= yellowAfter) return "yellow";
  return "green";
}

export const Route = createFileRoute("/api/public/hooks/collection-watchdog")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const market = getMarketStatus(now);
        const marketOpen = market.isOpen;
        const since5m = new Date(now.getTime() - 5 * 60_000).toISOString();
        const since30m = new Date(now.getTime() - 30 * 60_000).toISOString();

        const [tickLatest, tick5m, obLatest, ob30m, wlLatest, wl5m, tlLatest] = await Promise.all([
          supabaseAdmin.from("live_ticks").select("ts, symbol")
            .eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("live_ticks").select("symbol", { count: "exact", head: true })
            .eq("source", "thunder_ext").gte("ts", since5m),
          supabaseAdmin.from("orderbook_snapshots").select("ts, symbol")
            .order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("orderbook_snapshots").select("symbol", { count: "exact", head: true })
            .gte("ts", since30m),
          supabaseAdmin.from("thunder_watchlist_snapshots").select("ts, symbol")
            .order("ts", { ascending: false }).limit(1).maybeSingle(),
          supabaseAdmin.from("thunder_watchlist_snapshots").select("symbol", { count: "exact", head: true })
            .gte("ts", since5m),
          supabaseAdmin.from("scalp_timeline_events").select("at_ms, event")
            .order("at_ms", { ascending: false }).limit(1).maybeSingle(),
        ]);

        const ageSec = (iso: string | null | undefined) =>
          iso ? Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000)) : null;
        const ageMs = (ms: number | null | undefined) =>
          ms != null ? Math.max(0, Math.round((now.getTime() - Number(ms)) / 1000)) : null;

        const tickAge = ageSec(tickLatest.data?.ts);
        const obAge = ageSec(obLatest.data?.ts);
        const wlAge = ageSec(wlLatest.data?.ts);
        const tlAge = ageMs(tlLatest.data?.at_ms as number | undefined);

        const checks: Check[] = [
          {
            key: "ticks",
            label: "💹 الأسعار اللحظية",
            status: classify(tickAge, marketOpen, 180, 90),
            lastAgoSec: tickAge,
            countRecent: tick5m.count ?? 0,
            expected: "tick كل ثانيتين تقريباً",
            message: marketOpen
              ? (tickAge == null ? "لا توجد أي بيانات — الإكستنشن مش بيبعت أسعار"
                : tickAge >= 180 ? `آخر سعر من ${tickAge}s — الإكستنشن واقف`
                : tickAge >= 90 ? `آخر سعر من ${tickAge}s — بطيء`
                : `${tick5m.count ?? 0} tick / آخر 5د`)
              : "السوق مغلق — لا نتوقع أسعار",
          },
          {
            key: "l2",
            label: "📚 قائمة L2 (Level 2)",
            status: classify(obAge, marketOpen, 1800, 900),
            lastAgoSec: obAge,
            countRecent: ob30m.count ?? 0,
            expected: "snapshot كل ~2 دقيقة",
            message: marketOpen
              ? (obAge == null ? "لا يوجد أي L2 اليوم — دورة L2 متوقفة"
                : obAge >= 1800 ? `آخر L2 من ${Math.round(obAge/60)}د — الدورة متوقفة`
                : obAge >= 900 ? `آخر L2 من ${Math.round(obAge/60)}د — بطيء`
                : `${ob30m.count ?? 0} snapshot / آخر 30د`)
              : "السوق مغلق — لا نتوقع L2",
          },
          {
            key: "watchlist",
            label: "👁️ Watchlist",
            // الاكستنشن بتعمل throttle لكل UUID مرة/ساعة (background.js:1352).
            // فلازم threshold الـ watchdog يطابقها، وإلا هنشوف "متوقف" كل ساعة
            // مع إن كل حاجة تمام. red = ساعتين بدون أي snapshot، yellow = ساعة.
            status: classify(wlAge, marketOpen, 7200, 3600),
            lastAgoSec: wlAge,
            countRecent: wl5m.count ?? 0,
            expected: "snapshot لكل رمز مرة/ساعة (throttle مقصود)",
            message: marketOpen
              ? (wlAge == null ? "لا يوجد watchlist اليوم"
                : wlAge >= 7200 ? `آخر watchlist من ${Math.round(wlAge/60)}د — الدورة متوقفة`
                : wlAge >= 3600 ? `آخر watchlist من ${Math.round(wlAge/60)}د — بطيء`
                : `${wl5m.count ?? 0} صف / آخر 5د`)
              : "السوق مغلق",
          },
          {
            key: "timeline",
            label: "📍 Timeline إشارات",
            status: !marketOpen ? "idle" : (tlAge != null ? "green" : "idle"),
            lastAgoSec: tlAge,
            countRecent: 0,
            expected: "يظهر عند كل إشارة",
            message: tlAge == null
              ? "لا توجد إشارات بعد اليوم"
              : `آخر حدث من ${tlAge < 60 ? tlAge + "s" : Math.round(tlAge/60) + "د"}`,
          },
        ];

        const worst: Level = checks.some(c => c.status === "red") ? "red"
          : checks.some(c => c.status === "yellow") ? "yellow"
          : !marketOpen ? "idle"
          : "green";

        return new Response(JSON.stringify({
          ok: true,
          now: now.toISOString(),
          marketOpen,
          marketLabel: market.label,
          overall: worst,
          checks,
        }), { status: 200, headers: { "Content-Type": "application/json", ...CORS } });
      },
    },
  },
});