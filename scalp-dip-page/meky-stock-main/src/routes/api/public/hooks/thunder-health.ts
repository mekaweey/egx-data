import { createFileRoute } from "@tanstack/react-router";

/**
 * Public read-only health probe for the Thunder live-tick pipeline.
 * Used by <ThunderConnectionBanner /> on strategy pages to warn the
 * user immediately if the extension stops sending data (tab closed,
 * extension detached, network down, etc).
 *
 * Returns plain JSON — no PII, no auth required.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

function cairoMinutes(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const wd = parts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const dayMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: dayMap[wd] ?? 0, minutes: h * 60 + m };
}

export const Route = createFileRoute("/api/public/hooks/thunder-health")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date();
        const since5m = new Date(now.getTime() - 5 * 60_000).toISOString();

        const [latestThunder, latestAny, recent] = await Promise.all([
          supabaseAdmin
            .from("live_ticks")
            .select("ts, symbol")
            .eq("source", "thunder_ext")
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("live_ticks")
            .select("ts, source")
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabaseAdmin
            .from("live_ticks")
            .select("symbol, source")
            .gte("ts", since5m),
        ]);

        const thunderTs = latestThunder.data?.ts ?? null;
        const anyTs = latestAny.data?.ts ?? null;
        const thunderAgo = thunderTs ? Math.round((now.getTime() - new Date(thunderTs).getTime()) / 1000) : null;
        const anyAgo = anyTs ? Math.round((now.getTime() - new Date(anyTs).getTime()) / 1000) : null;

        const rows = (recent.data ?? []) as Array<{ symbol: string; source: string }>;
        const thunderRows = rows.filter((r) => r.source === "thunder_ext");
        const thunderSymbols5m = new Set(thunderRows.map((r) => r.symbol)).size;
        const thunderTicks5m = thunderRows.length;

        const cairo = cairoMinutes(now);
        const isWeekday = cairo.day >= 0 && cairo.day <= 4;
        const marketOpen = isWeekday && cairo.minutes >= 600 && cairo.minutes < 870;

        // Verdict
        // - market open & thunder fresh (<180s) → ok
        // - market open & thunder stale (>180s) → warn
        // - market open & no thunder for >10m → critical
        // - market closed → info (expected silence)
        //
        // ملاحظة: الحدود موسّعة عن قصد عشان تستوعب Chrome background
        // throttling للتاب الخلفية بتاعت الـ watchlist. الاكستنشن عندها
        // silent-audio + heartbeat لكن Chrome أحيانًا بيمنع الـ autoplay
        // فبيبطّي الـ long-poll لحد ~دقيقة بين التحديثات. الحدود القديمة
        // (60s/300s) كانت بتطلع false alarms كل ما المستخدم يفتح تاب تانية.
        let status: "ok" | "warn" | "critical" | "closed" = "ok";
        let message = "متصل بثاندر — البيانات لحظية";
        if (!marketOpen) {
          status = "closed";
          message = "السوق مغلق — لا توجد بيانات لحظية متوقعة";
        } else if (thunderAgo == null || thunderAgo > 600) {
          status = "critical";
          message = "انقطع الاتصال بثاندر — افتح صفحة web.thndr.app وتأكد إن الاكستنشن متصل";
        } else if (thunderAgo > 180) {
          status = "warn";
          message = `آخر تحديث من ثاندر منذ ${thunderAgo} ثانية — تحقق من الاكستنشن`;
        }

        return new Response(
          JSON.stringify({
            ok: true,
            status,
            message,
            marketOpen,
            thunder: { lastTickTs: thunderTs, lastTickAgoSec: thunderAgo, ticks5m: thunderTicks5m, symbols5m: thunderSymbols5m },
            any: { lastTickTs: anyTs, lastTickAgoSec: anyAgo, source: latestAny.data?.source ?? null },
            now: now.toISOString(),
          }),
          { status: 200, headers: { "Content-Type": "application/json", ...CORS } },
        );
      },
    },
  },
});