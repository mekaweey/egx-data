import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { logEvent } from "@/lib/trade-ledger.server";

/**
 * Thunder positions endpoint — lets the extension watch open positions locally
 * (much faster than the 1-minute sell-watcher cron) and request a sell order.
 *
 * GET  → list open positions with TP/SL so the extension can detect a hit on
 *        the live tick stream it already intercepts.
 * POST → request a sell pending_order for a given position_id. Server validates
 *        the position is still open and computes qty/price.
 *
 * Auth: shared x-thunder-token (same as ingest/orders).
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function authOK(request: Request): boolean {
  const expected = process.env.THUNDER_INGEST_TOKEN ?? "";
  const provided = request.headers.get("x-thunder-token") ?? "";
  return expected.length > 0 && provided.length === expected.length && provided === expected;
}

const SellRequestSchema = z.object({
  action: z.literal("sell").optional(),
  position_id: z.string().uuid(),
  reason: z.enum(["target_hit", "stop_hit", "drift_exit", "manual", "eod_force"]),
  ref_price: z.number().positive().optional(),
});

const RegisterManualSchema = z.object({
  action: z.literal("register_manual"),
  symbol: z.string().min(1).max(16),
  qty: z.number().positive().max(1_000_000),
  entry_price: z.number().positive(),
  side: z.literal("buy").optional(),
});

/**
 * register_buy_fill — emitted by the extension AFTER Thunder confirms a real
 * buy fill. We use the actual fill price + qty from Thunder, but pull TP/SL
 * from the matching paper_trades row (same symbol, today, scalp strategy).
 * No paper_trade match → reject, do nothing. Pre-existing open position for
 * the symbol today → idempotent no-op (returns already_open=true).
 */
const RegisterBuyFillSchema = z.object({
  action: z.literal("register_buy_fill"),
  symbol: z.string().min(1).max(16),
  qty: z.number().positive().max(1_000_000),
  entry_price: z.number().positive(),
  source: z.string().max(64).optional(),
});

const PostBodySchema = z.union([RegisterBuyFillSchema, RegisterManualSchema, SellRequestSchema]);

export const Route = createFileRoute("/api/public/hooks/thunder-positions")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),

      GET: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("positions")
          .select("id, symbol, quantity, entry_price, stop_loss, target_price, trailing_stop")
          .eq("status", "open");
        if (error) return json({ ok: false, error: error.message }, 500);

        const rawPositions = data ?? [];
        const rawSymbols = Array.from(new Set(rawPositions.map((p) => String(p.symbol || "").toUpperCase()).filter(Boolean)));
        const { data: knownStocks } = rawSymbols.length
          ? await supabaseAdmin.from("stocks").select("symbol").in("symbol", rawSymbols)
          : { data: [] };
        const knownSet = new Set((knownStocks ?? []).map((s) => String(s.symbol).toUpperCase()));
        const positions = rawPositions.filter((p) => knownSet.has(String(p.symbol || "").toUpperCase()));
        const symbols = Array.from(new Set(positions.map((p) => String(p.symbol || "").toUpperCase()).filter(Boolean)));
        const priceBySymbol = new Map<string, number>();
        if (symbols.length) {
          const { data: ticks } = await supabaseAdmin
            .from("live_ticks")
            .select("symbol, price, ts")
            .in("symbol", symbols)
            .eq("source", "thunder_ext")
            .gte("ts", new Date(Date.now() - 10 * 60_000).toISOString())
            .order("ts", { ascending: false })
            .limit(Math.max(50, symbols.length * 8));
          for (const tick of ticks ?? []) {
            const sym = String(tick.symbol || "").toUpperCase();
            if (!priceBySymbol.has(sym)) priceBySymbol.set(sym, Number(tick.price) || 0);
          }
        }

        return json({
          ok: true,
          positions: positions.map((p) => ({ ...p, current_price: priceBySymbol.get(String(p.symbol || "").toUpperCase()) || null })),
        });
      },

      POST: async ({ request }) => {
        if (!authOK(request)) return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
        const parsed = PostBodySchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: "validation_failed", issues: parsed.error.flatten() }, 400);

        const body = parsed.data;

        // Auto-registering positions from Thunder JSON is disabled: the old
        // detector was too broad and created fake open positions from list data.
        if (body.action === "register_manual") {
          return json({ ok: false, error: "auto_position_registration_disabled" }, 410);
        }

        // -------- register_buy_fill: the only auto-registration path --------
        if (body.action === "register_buy_fill") {
          const symbol = body.symbol.trim().toUpperCase();
          const qty = Math.max(1, Math.floor(Number(body.qty)));
          const entryPrice = Number(body.entry_price);
          const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
            .toISOString().slice(0, 10);

          // Whitelist: only stocks we actively trade (defensive — the strategy
          // already filters, but a stray fill should never create a position).
          const { data: stockRow } = await supabaseAdmin
            .from("stocks").select("symbol").eq("symbol", symbol).maybeSingle();
          if (!stockRow) return json({ ok: false, reason: "symbol_not_whitelisted", symbol }, 200);

          // Idempotency #1: already an open position for this symbol today?
          const { data: existing } = await supabaseAdmin
            .from("positions")
            .select("id, entry_price, quantity")
            .eq("symbol", symbol).eq("status", "open").eq("entry_date", today)
            .maybeSingle();
          if (existing) {
            return json({ ok: true, already_open: true, position_id: existing.id, symbol });
          }

          // Must match a today's scalp paper_trade — that's where TP/SL come from.
          // Match today's open paper_trade for either supported scalp strategy.
          // scalp-mr15 = classic Scalp Live. scalp-dip = new DIP-Deep strategy.
          const { data: pt, error: ptErr } = await supabaseAdmin
            .from("paper_trades")
            .select("id, entry_price, tp_price, sl_price, strategy, status")
            .eq("symbol", symbol).eq("trade_date", today).eq("status", "open")
            .in("strategy", ["scalp-mr15", "scalp-dip"])
            .order("entry_ts", { ascending: false })
            .limit(1).maybeSingle();
          if (ptErr) return json({ ok: false, error: ptErr.message }, 500);
          if (!pt) {
            return json({ ok: false, reason: "no_matching_paper_trade", symbol }, 200);
          }

          // Sanity-check: fill price within ±15% of the strategy's signal
          // price. A bigger gap means the signal isn't really for this fill
          // (different signal, stale order, wrong stock) — reject safely.
          const ptEntry = Number(pt.entry_price) || 0;
          if (ptEntry > 0) {
            const drift = Math.abs(entryPrice - ptEntry) / ptEntry;
            if (drift > 0.15) {
              return json({ ok: false, reason: "fill_price_out_of_band", drift_pct: Number((drift * 100).toFixed(2)), entry_price: entryPrice, paper_trade_entry: ptEntry }, 200);
            }
          }

          // TP/SL rescaled around the actual fill price (preserves the
          // strategy's % distances). Without rescaling, a slightly worse fill
          // would shift effective R:R against us.
          const tpPct = ptEntry > 0 ? (Number(pt.tp_price) / ptEntry - 1) : null;
          const slPct = ptEntry > 0 ? (Number(pt.sl_price) / ptEntry - 1) : null;
          const target = tpPct != null ? Number((entryPrice * (1 + tpPct)).toFixed(4)) : Number(pt.tp_price);
          const stop   = slPct != null ? Number((entryPrice * (1 + slPct)).toFixed(4)) : Number(pt.sl_price);

          const { data: inserted, error: insErr } = await supabaseAdmin
            .from("positions")
            .insert({
              symbol,
              quantity: qty,
              entry_price: entryPrice,
              entry_date: today,
              target_price: target,
              stop_loss: stop,
              max_hold_days: 1, // scalp = same-session exit
              status: "open",
              notes: `auto:thunder_fill paper_trade=${pt.id} src=${body.source || "ext"}`,
            })
            .select("id")
            .maybeSingle();

          if (insErr) {
            // Unique-index collision = a parallel request beat us to it. Safe.
            if (String(insErr.message).includes("uniq_positions_open_symbol_entry_date") ||
                String(insErr.message).includes("duplicate key")) {
              return json({ ok: true, already_open: true, symbol });
            }
            return json({ ok: false, error: insErr.message }, 500);
          }

          // Ledger: real buy fill recorded, position now open.
          await logEvent({
            trade_date: today,
            symbol,
            strategy: (pt.strategy as string) ?? null,
            paper_trade_id: pt.id,
            position_id: inserted?.id ?? null,
            event_type: "BUY_FILLED",
            state: "HOLDING",
            price: entryPrice,
            qty,
            source: body.source || "extension",
            metadata: { target_price: target, stop_loss: stop },
          });

          return json({
            ok: true, created: true,
            position_id: inserted?.id, symbol, qty,
            entry_price: entryPrice, target_price: target, stop_loss: stop,
            paper_trade_id: pt.id,
          });
        }

        // -------- Existing sell-request flow --------
        const { position_id, reason, ref_price } = body;
        const { data: pos, error: posErr } = await supabaseAdmin
          .from("positions")
          .select("id, symbol, quantity, entry_price, target_price, stop_loss, status, entry_date")
          .eq("id", position_id)
          .maybeSingle();
        if (posErr) return json({ ok: false, error: posErr.message }, 500);
        if (!pos || pos.status !== "open") return json({ ok: false, error: "position_not_open" }, 404);

        const qty = Math.max(1, Math.floor(Number(pos.quantity) || 1));
        const targetPrice = Number(pos.target_price) || 0;
        const stopPrice = Number(pos.stop_loss) || 0;
        // eod_force: use ref_price from extension (best available price), skip L2 gate entirely.
        // Priority: get out before market close even if small loss.
        const sellLimitPrice = reason === "target_hit" && targetPrice > 0
          ? targetPrice
          : reason === "eod_force"
            ? (ref_price ?? null)
            : ref_price ?? (stopPrice > 0 ? stopPrice : null);
        if (reason === "target_hit" && sellLimitPrice != null) {
          // scalp-dip: skip L2 gate (proven 67%+ instant-sell via live_ticks).
          // scalp-mr15 and unknown: enforce gate as before.
          const { data: ptRow } = await supabaseAdmin
            .from("paper_trades")
            .select("strategy")
            .eq("symbol", pos.symbol)
            .eq("trade_date", pos.entry_date)
            .in("strategy", ["scalp-mr15", "scalp-dip"])
            .order("entry_ts", { ascending: false })
            .limit(1)
            .maybeSingle();
          const isDip = ptRow?.strategy === "scalp-dip";
          if (!isDip) {
          const { runTargetSellL2Gate } = await import("@/lib/scalp-feasibility/pre-buy-gate.server");
          const gate = await runTargetSellL2Gate({
            symbol: pos.symbol,
            target_price: sellLimitPrice,
            qty,
            max_snapshot_age_ms: 15_000,
            min_depth_multiplier: 1,
          });
          if (!gate.ok) {
            return json({
              ok: false,
              reason: "sell_l2_gate_rejected",
              detail: gate.reason,
              symbol: pos.symbol,
              qty,
              target_price: sellLimitPrice,
              bid_sum_at_target: gate.bid_sum_at_target,
              snapshot_age_ms: gate.snapshot_age_ms,
            }, 200);
          }
          }
        }

        const { error: insErr } = await supabaseAdmin.from("pending_orders").insert({
          symbol: pos.symbol,
          side: "sell",
          qty,
          ref_price: ref_price ?? sellLimitPrice,
          order_type: "limit",
          limit_price: sellLimitPrice,
          status: "pending",
          signal_source: `ext_sell_${reason}`,
          expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
          metadata: { position_id: pos.id, reason, entry_price: Number(pos.entry_price), target_price: targetPrice || null, stop_loss: stopPrice || null, source: "extension_local_watcher" },
        });
        if (insErr && !String(insErr.message).includes("duplicate key")) {
          return json({ ok: false, error: insErr.message }, 500);
        }
        await logEvent({
          trade_date: pos.entry_date as string,
          symbol: pos.symbol,
          position_id: pos.id,
          event_type: "SELL_REQUESTED",
          state: "SELLING",
          price: Number(sellLimitPrice) || null,
          qty,
          reason,
          source: "thunder-positions",
          metadata: { entry_price: Number(pos.entry_price), target_price: targetPrice || null, stop_loss: stopPrice || null },
        });
        return json({ ok: true, queued: true, symbol: pos.symbol, qty, reason });
      },
    },
  },
});