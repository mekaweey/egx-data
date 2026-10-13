import "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { fetchHistoryBulk } from "@/lib/market-data/history.server";
import { nudgeCalibration } from "@/lib/scan/online-learning.server";

/**
 * Daily cron endpoint. For every pending recommendation older than 1 trading day,
 * compares price_at_reco with the most recent close and marks outcome.
 * Called by pg_cron after market close (≈ 5pm Cairo time).
 */
export const Route = createFileRoute("/api/public/hooks/update-outcomes")({
  server: {
    handlers: {
      POST: handler,
      GET: handler,
    },
  },
});

async function handler() {
  const todayUpdated = await closeTodayBullishRecommendationsFromTicks();

  const { data: pending } = await supabaseAdmin
    .from("recommendations")
    .select("id, symbol, price_at_reco, target, stop_loss, max_hold_days, created_at, confidence, signal")
    .eq("outcome", "pending")
    .lt("created_at", new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString())
    .limit(500);

  if (!pending || pending.length === 0) {
    return Response.json({ ok: true, updated: todayUpdated, todayUpdated, message: "no pending recos" });
  }

  // Group by symbol → fetch one history per symbol
  const symbols = Array.from(new Set(pending.map((p) => p.symbol)));
  const { data: stocks } = await supabaseAdmin
    .from("stocks")
    .select("symbol, yahoo_symbol")
    .in("symbol", symbols);

  const history = await fetchHistoryBulk(stocks ?? [], 15, 8);

  let updated = 0;
  for (const reco of pending) {
    const candles = history.get(reco.symbol.toUpperCase());
    if (!candles || candles.length === 0) continue;

    const recoDate = new Date(reco.created_at).toISOString().slice(0, 10);
    // candles after the reco date
    const after = candles.filter((c) => c.date.slice(0, 10) > recoDate);
    if (after.length === 0) continue;

    const entry = Number(reco.price_at_reco);
    const target = Number(reco.target ?? 0);
    const stop = Number(reco.stop_loss ?? 0);
    const maxDays = reco.max_hold_days ?? 5;
    const window = after.slice(0, maxDays);

    let outcome: "target_hit" | "stop_hit" | "expired" = "expired";
    let outcomePrice = window[window.length - 1].close;
    let outcomeAt = window[window.length - 1].date;

    for (const c of window) {
      if (stop > 0 && c.low <= stop) {
        outcome = "stop_hit";
        outcomePrice = stop;
        outcomeAt = c.date;
        break;
      }
      if (target > 0 && c.high >= target) {
        outcome = "target_hit";
        outcomePrice = target;
        outcomeAt = c.date;
        break;
      }
    }

    const realizedPct = entry > 0 ? +(((outcomePrice - entry) / entry) * 100).toFixed(2) : 0;

    await supabaseAdmin
      .from("recommendations")
      .update({
        outcome,
        outcome_price: outcomePrice,
        outcome_at: new Date(outcomeAt).toISOString(),
        realized_pct: realizedPct,
      })
      .eq("id", reco.id);
    updated++;

    // Online learning: nudge the calibration map after every closed bullish pick.
    if (reco.signal === "buy" || reco.signal === "strong_buy") {
      const won = outcome === "target_hit" || (outcome === "expired" && realizedPct > 0);
      try { await nudgeCalibration(reco.confidence ?? 50, won); } catch {}
    }
  }

  return Response.json({ ok: true, pending: pending.length, updated: updated + todayUpdated, todayUpdated });
}

function cairoDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

async function closeTodayBullishRecommendationsFromTicks() {
  const today = cairoDateString();
  const { data: pending } = await supabaseAdmin
    .from("recommendations")
    .select("id, symbol, price_at_reco, target, stop_loss, created_at, confidence, signal")
    .eq("outcome", "pending")
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", `${today}T00:00:00.000Z`)
    .lt("created_at", `${today}T23:59:59.999Z`)
    .limit(500);

  let updated = 0;
  for (const reco of pending ?? []) {
    const entry = Number(reco.price_at_reco);
    const target = Number(reco.target ?? 0);
    const stop = Number(reco.stop_loss ?? 0);
    if (!(entry > 0)) continue;

    const { data: ticks } = await supabaseAdmin
      .from("live_ticks")
      .select("price, ts")
      .eq("symbol", reco.symbol)
      .gte("ts", reco.created_at)
      .gte("ts", `${today}T07:00:00.000Z`)
      .lte("ts", `${today}T12:30:59.999Z`)
      .order("ts", { ascending: true });
    if (!ticks?.length) continue;

    let outcome: "target_hit" | "stop_hit" | "expired" = "expired";
    let outcomePrice = Number(ticks[ticks.length - 1].price);
    let outcomeAt = String(ticks[ticks.length - 1].ts);
    for (const tick of ticks) {
      const price = Number(tick.price);
      if (stop > 0 && price <= stop) {
        outcome = "stop_hit";
        outcomePrice = stop;
        outcomeAt = String(tick.ts);
        break;
      }
      if (target > 0 && price >= target) {
        outcome = "target_hit";
        outcomePrice = target;
        outcomeAt = String(tick.ts);
        break;
      }
    }

    const realizedPct = +(((outcomePrice - entry) / entry) * 100).toFixed(2);
    await supabaseAdmin
      .from("recommendations")
      .update({ outcome, outcome_price: outcomePrice, outcome_at: outcomeAt, realized_pct: realizedPct })
      .eq("id", reco.id);
    updated++;

    try {
      const won = outcome === "target_hit" || (outcome === "expired" && realizedPct > 0);
      await nudgeCalibration(reco.confidence ?? 50, won);
    } catch {}
  }
  return updated;
}
