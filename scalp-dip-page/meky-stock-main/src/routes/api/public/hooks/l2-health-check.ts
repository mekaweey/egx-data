import { createFileRoute } from "@tanstack/react-router";

/**
 * L2 Health Check — runs shortly before market open.
 * Alerts on Telegram if Thunder extension hasn't sent orderbook snapshots
 * recently, so the user knows to open the extension before signals fire.
 *
 * GET/POST — no body required. Public /api/public/*.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
} as const;

async function handler() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTelegram } = await import("@/lib/notifications/telegram.server");

  const now = new Date();
  const since10m = new Date(now.getTime() - 10 * 60_000).toISOString();
  const since24h = new Date(now.getTime() - 24 * 3600_000).toISOString();

  const [{ data: latest }, { count: last10m }, { count: last24h, data: distinct24h }] = await Promise.all([
    supabaseAdmin.from("orderbook_snapshots").select("ts, symbol").order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("orderbook_snapshots").select("id", { count: "exact", head: true }).gte("ts", since10m),
    supabaseAdmin.from("orderbook_snapshots").select("symbol", { count: "exact" }).gte("ts", since24h),
  ]);

  const latestTs = latest?.ts ? new Date(latest.ts as string).toISOString() : null;
  const ageMin = latestTs ? Math.round((now.getTime() - new Date(latestTs).getTime()) / 60_000) : null;
  const distinctSymbols = new Set(((distinct24h ?? []) as { symbol: string }[]).map(r => r.symbol)).size;

  const healthy = (last10m ?? 0) >= 3;
  const emoji = healthy ? "✅" : "⚠️";
  const status = healthy ? "L2 شغّال" : "L2 مش شغّال / قليل جدًا";

  const text =
    `<b>${emoji} فحص L2 قبل السوق</b>\n` +
    `الحالة: <b>${status}</b>\n\n` +
    `آخر snapshot: ${latestTs ? `${ageMin} دقيقة` : "لا يوجد"}\n` +
    `آخر 10د: <b>${last10m ?? 0}</b> snapshots\n` +
    `آخر 24س: <b>${last24h ?? 0}</b> snapshots على <b>${distinctSymbols}</b> سهم\n\n` +
    (healthy
      ? "الإكستنشن Thunder شغّال والبوابة هتقدر تتحقق."
      : "🔴 <b>افتح Thunder Extension على المتصفح فورًا</b> عشان البوابة تشتغل صح.");

  await sendTelegram(text);

  return Response.json({
    ok: true,
    healthy,
    latest_ts: latestTs,
    latest_age_min: ageMin,
    snapshots_last_10m: last10m ?? 0,
    snapshots_last_24h: last24h ?? 0,
    distinct_symbols_24h: distinctSymbols,
  }, { headers: CORS });
}

export const Route = createFileRoute("/api/public/hooks/l2-health-check")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
