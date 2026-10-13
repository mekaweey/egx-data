import { createFileRoute } from "@tanstack/react-router";
import {
  SMART_EXIT_RULES,
  getSmartExitFlags,
  getMarketwatchLiveness,
  logSmartExit,
} from "@/lib/smart-exit.server";
import { logEvent } from "@/lib/trade-ledger.server";

/**
 * Sell Watcher — scans open positions, fetches latest tick, and creates a
 * pending_orders row with side:"sell" when target or stop is hit. The Thunder
 * extension picks up the order via GET /api/public/hooks/thunder-orders and
 * executes the sell click on web.thndr.app.
 *
 * Safety: no auto-confirm — extension stops at the prepared form; user reviews.
 * Dedup: unique(symbol, trade_date, signal_source) prevents duplicate sells.
 */
export const Route = createFileRoute("/api/public/hooks/sell-watcher")({
  server: {
    handlers: {
      POST: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const created: Array<{ symbol: string; reason: string; price: number }> = [];
        const errors: string[] = [];

        const { data: positions, error: posErr } = await supabaseAdmin
          .from("positions")
          .select("id, symbol, entry_price, quantity, stop_loss, target_price, trailing_stop, entry_date")
          .eq("status", "open");
        if (posErr) return json({ ok: false, error: posErr.message }, 500);
        if (!positions || positions.length === 0) return json({ ok: true, scanned: 0, created });

        for (const p of positions) {
          try {
            // Get latest tick (last 2 minutes).
            const { data: tick } = await supabaseAdmin
              .from("live_ticks")
              .select("price, ts")
              .eq("symbol", p.symbol)
              .eq("source", "thunder_ext")
              .gte("ts", new Date(Date.now() - 2 * 60_000).toISOString())
              .order("ts", { ascending: false })
              .limit(1)
              .maybeSingle();
            const price = Number(tick?.price);
            if (!Number.isFinite(price) || price <= 0) continue;

            const tp = Number(p.target_price) || 0;
            const sl = Math.max(Number(p.stop_loss) || 0, Number(p.trailing_stop) || 0);

            let reason: "target_hit" | "stop_hit" | "hard_floor" | "volume_death" | null = null;
            if (tp > 0 && price >= tp) reason = "target_hit";
            else if (sl > 0 && price <= sl) reason = "stop_hit";

            // ---- Smart Exit checks (real positions) ----
            if (!reason) {
              const flags = await getSmartExitFlags();
              if (flags.enabled) {
                const entryPx = Number(p.entry_price);
                const entryMs = new Date(p.entry_date).getTime();
                const secSinceEntry = Math.max(0, (Date.now() - entryMs) / 1000);
                const pnlPct = entryPx > 0 ? (price - entryPx) / entryPx : 0;
                const today = new Date().toISOString().slice(0, 10);

                // Rule 1: HARD FLOOR
                if (pnlPct <= SMART_EXIT_RULES.HARD_FLOOR_PCT) {
                  await logSmartExit({
                    trade_date: today, symbol: p.symbol, rule: "HARD_FLOOR",
                    action: flags.shadow ? "would_exit" : "exit",
                    shadow: flags.shadow, price, entry_price: entryPx,
                    pnl_pct: pnlPct, seconds_since_entry: Math.round(secSinceEntry),
                    position_id: p.id,
                  });
                  if (!flags.shadow) reason = "hard_floor";
                }

                // Rule 2: VOLUME DEATH
                if (!reason && secSinceEntry >= SMART_EXIT_RULES.VOLUME_DEATH_AFTER_SEC) {
                  const live = await getMarketwatchLiveness(p.symbol);
                  if (live.trades5m < SMART_EXIT_RULES.MIN_TRADES_5M) {
                    await logSmartExit({
                      trade_date: today, symbol: p.symbol, rule: "VOLUME_DEATH",
                      action: flags.shadow ? "would_exit" : "exit",
                      shadow: flags.shadow, price, entry_price: entryPx,
                      pnl_pct: pnlPct, seconds_since_entry: Math.round(secSinceEntry),
                      mw_trades_5m: live.trades5m, mw_volume_5m: live.volume5m,
                      position_id: p.id,
                    });
                    if (!flags.shadow) reason = "volume_death";
                  }
                }
              }
            }
            if (!reason) continue;

            const qty = Math.max(1, Math.floor(Number(p.quantity) || 1));
            // Smart exits sell at market (use current price as limit floor).
            const limitPrice =
              reason === "target_hit" && tp > 0 ? tp :
              reason === "stop_hit" && sl > 0 ? sl :
              price;
            if (reason === "target_hit") {
              // scalp-dip strategy proved 67%+ instant-sell via live_ticks volume;
              // it does NOT require an L2 snapshot to sell at target. Skip the gate
              // for scalp-dip positions; keep it for scalp-mr15 and legacy positions.
              const { data: ptRow } = await supabaseAdmin
                .from("paper_trades")
                .select("strategy")
                .eq("symbol", p.symbol)
                .eq("trade_date", p.entry_date)
                .in("strategy", ["scalp-mr15", "scalp-dip"])
                .order("entry_ts", { ascending: false })
                .limit(1)
                .maybeSingle();
              const isDip = ptRow?.strategy === "scalp-dip";
              if (!isDip) {
              const { runTargetSellL2Gate } = await import("@/lib/scalp-feasibility/pre-buy-gate.server");
              const gate = await runTargetSellL2Gate({
                symbol: p.symbol,
                target_price: limitPrice,
                qty,
                max_snapshot_age_ms: 15_000,
                min_depth_multiplier: 1,
              });
              if (!gate.ok) {
                errors.push(`${p.symbol}: sell_l2_gate:${gate.reason}`);
                continue;
              }
              }
            }
            const { error: insErr } = await supabaseAdmin.from("pending_orders").insert({
              symbol: p.symbol,
              side: "sell",
              qty,
              ref_price: price,
              order_type: "limit",
              limit_price: limitPrice,
              status: "pending",
              signal_source: `sell_watcher_${reason}`,
              expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
              metadata: { position_id: p.id, reason, entry_price: Number(p.entry_price), target_price: tp || null, stop_loss: sl || null, source: "thunder_ext" },
            });
            // Dedup conflict is fine — already queued earlier.
            if (insErr && !String(insErr.message).includes("duplicate key")) {
              errors.push(`${p.symbol}: ${insErr.message}`);
              continue;
            }
            await logEvent({
              trade_date: p.entry_date as string,
              symbol: p.symbol,
              position_id: p.id,
              event_type: "SELL_QUEUED",
              state: "SELLING",
              price: limitPrice,
              qty,
              reason,
              source: "sell-watcher",
              metadata: { entry_price: Number(p.entry_price), target_price: tp || null, stop_loss: sl || null },
            });
            created.push({ symbol: p.symbol, reason, price });
          } catch (e) {
            errors.push(`${p.symbol}: ${(e as Error).message}`);
          }
        }

        return json({ ok: true, scanned: positions.length, created, errors });
      },
    },
  },
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}