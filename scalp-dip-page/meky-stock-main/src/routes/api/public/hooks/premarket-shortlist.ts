import { createFileRoute } from "@tanstack/react-router";

/**
 * Pre-market Shortlist — runs 09:45 Cairo (07:45 UTC), weekdays 0-4.
 * Ranks top 15 symbols the user should open Thunder L2 tabs for.
 *
 * Score = 0.6 * normalized(scalp signals in last 20 trading days)
 *       + 0.4 * normalized(live_ticks count in last 5 days).
 * Filters: is_sharia + day_tradable.
 * Fallback: if no historical scalp signals, use top_active_day_tradable_today.
 *
 * Query params:
 *   ?dry=1  → return JSON only, no Telegram, no DB upsert
 *   ?limit=N → override top-N (default 15, max 30)
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
} as const;

function cairoDateISO(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const limit = Math.min(30, Math.max(5, Number(url.searchParams.get("limit") ?? "15")));

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Universe: sharia + day_tradable
  const { data: stocks } = await supabaseAdmin
    .from("stocks").select("symbol")
    .eq("is_sharia", true).eq("day_tradable", true);
  const universe = new Set((stocks ?? []).map(s => s.symbol));

  // Signal history (last 20 trading days)
  const since20 = new Date(Date.now() - 20 * 86400_000).toISOString().slice(0, 10);
  const { data: sigRows } = await supabaseAdmin
    .from("paper_trades")
    .select("symbol")
    .eq("strategy", "scalp-mr15")
    .gte("trade_date", since20);
  const sigCount = new Map<string, number>();
  for (const r of sigRows ?? []) {
    if (!universe.has(r.symbol)) continue;
    sigCount.set(r.symbol, (sigCount.get(r.symbol) ?? 0) + 1);
  }

  // Liquidity (last 5 days ticks) — page in batches
  const since5 = new Date(Date.now() - 5 * 86400_000).toISOString();
  const tickCount = new Map<string, number>();
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("live_ticks")
      .select("symbol")
      .gte("ts", since5)
      .eq("source", "thunder_ext")
      .range(from, from + 4999);
    if (!data?.length) break;
    for (const t of data) {
      if (!universe.has(t.symbol)) continue;
      tickCount.set(t.symbol, (tickCount.get(t.symbol) ?? 0) + 1);
    }
    if (data.length < 5000) break;
    from += 5000;
  }

  const maxSig = Math.max(1, ...sigCount.values());
  const maxTick = Math.max(1, ...tickCount.values());

  type Row = { symbol: string; score: number; signals: number; ticks: number };
  const scored: Row[] = [];
  for (const sym of universe) {
    const s = sigCount.get(sym) ?? 0;
    const t = tickCount.get(sym) ?? 0;
    if (s === 0 && t === 0) continue;
    const score = 0.6 * (s / maxSig) + 0.4 * (t / maxTick);
    scored.push({ symbol: sym, score, signals: s, ticks: t });
  }
  scored.sort((a, b) => b.score - a.score);

  let top = scored.slice(0, limit);

  // Fallback if empty (no data at all)
  if (top.length === 0) {
    const { data: fb } = await supabaseAdmin
      .rpc("top_active_day_tradable_today", { p_limit: limit });
    top = (fb ?? []).map((r: { symbol: string }) => ({
      symbol: r.symbol, score: 0, signals: 0, ticks: 0,
    }));
  }

  const today = cairoDateISO(new Date());
  const symbols = top.map(r => r.symbol);
  const reasons = Object.fromEntries(top.map(r => [r.symbol, {
    signals_20d: r.signals, ticks_5d: r.ticks, score: Number(r.score.toFixed(4)),
  }]));

  if (!dry) {
    await supabaseAdmin.from("premarket_shortlist").upsert({
      pick_date: today, symbols, reasons, sent_at: new Date().toISOString(),
      notes: `top-${limit} scalp-mr15 (0.6*signals_20d + 0.4*ticks_5d)`,
    }, { onConflict: "pick_date" });

    try {
      const { sendTelegram } = await import("@/lib/notifications/telegram.server");
      const list = top.map((r, i) => `${i + 1}. <b>${r.symbol}</b>  <i>(sig:${r.signals} tk:${r.ticks})</i>`).join("\n");
      await sendTelegram(
        `<b>📋 قائمة اليوم — ${today}</b>\n\n` +
        `افتح Thunder L2 على الـ ${limit} أسهم دول قبل ما البورصة تفتح:\n\n${list}\n\n` +
        `<i>ده الترتيب المتوقع حسب أعلى احتمال إشارة scalp + سيولة.</i>`,
      );
    } catch { /* fire-and-forget */ }
  }

  return Response.json({
    ok: true, dry, today, count: top.length,
    symbols, reasons,
  }, { headers: CORS });
}

export const Route = createFileRoute("/api/public/hooks/premarket-shortlist")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
