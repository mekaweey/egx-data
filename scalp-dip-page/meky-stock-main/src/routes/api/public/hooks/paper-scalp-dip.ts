import { createFileRoute } from '@tanstack/react-router'
        // ── Phase A: entry scan (open window, once per day) ───────────────────
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { logEvent } from "@/lib/trade-ledger.server";
import {
  STRATEGY_ID,
  GAP_PARAMS,
  BACKTEST_DISCLAIMER_AR,
  scanDailyCandidates,
  getEffectiveSizing,
  cairoNow,
  cairoDateISO,
  cairoMinutesNow,
  isSessionDay,
  tradingDaysElapsed,
  liveSymbolState,
  decideExit,
} from "@/lib/scalp-dip/momentum-weekly.server";
import { persistScanSignals, updateShadowProgression, markSignalBought, markSignalSold, currentPriceFor } from "@/lib/scalp-dip/scalp-dip-signals.server";

/**
 * PART 3 — signal actions: "تم الشراء" / "تم البيع" buttons on the UI.
 * POST /api/public/hooks/paper-scalp-dip with body:
 *   { action: "bought"|"sold", signal_id: number, price?: number }
 *   { action: "price", symbol: string }  → live price prefill for the sell dialog
 * Idempotent; validates transitions (can't sell before buying).
 */
async function handleSignalAction(body: {
  action?: string;
  signal_id?: number;
  price?: number;
  symbol?: string;
}): Promise<Response> {
  try {
    if (body.action === "bought") {
      if (!body.signal_id) return Response.json({ ok: false, error: "signal_id required" }, { status: 400 });
      const row = await markSignalBought(body.signal_id, body.price);
      return Response.json({ ok: true, signal: row });
    }
    if (body.action === "sold") {
      if (!body.signal_id) return Response.json({ ok: false, error: "signal_id required" }, { status: 400 });
      const row = await markSignalSold(body.signal_id, body.price);
      return Response.json({ ok: true, signal: row });
    }
    if (body.action === "price") {
      if (!body.symbol) return Response.json({ ok: false, error: "symbol required" }, { status: 400 });
      const price = await currentPriceFor(body.symbol);
      return Response.json({ ok: true, price });
    }
    return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "action failed" }, { status: 400 });
  }
}


/**
 * PAPER runner — "Gap-Down Fade, 3-Day Hold" (strategy id: scalp-dip).
 * REPLACES the old same-day-1%-TP logic entirely (old code deleted).
 *
 * Phases (one invocation, ordered):
 *   B) EOD MONITOR (≥14:25 Cairo, idempotent): Steps 4–5 for every open
 *      position of this strategy — daily stop-loss (≤ −8%), day-3 time exit,
 *      and the mandatory live-bid liquidity confirmation (Case A/B).
 *   A) ENTRY (10:00–14:25 window, once per day): Steps 1–3 scan → insert
 *      up to TOP_N paper_trades rows.
 *   C) RECYCLE (Step 6): freed slots → next unused candidates, same day.
 */
export const Route = createFileRoute("/api/public/hooks/paper-scalp-dip")({
  server: {
    handlers: {
      // PART 5: browse/query signals by date (read-only, for the UI history view)
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const date = url.searchParams.get("date"); // optional YYYY-MM-DD
        let q = supabaseAdmin
          .from("scalp_dip_signals")
          .select("*")
          .order("scan_date", { ascending: false })
          .order("gap_pct", { ascending: true })
          .limit(500);
        if (date) q = q.eq("scan_date", date);
        const { data, error } = await q;
        if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
        return Response.json({ ok: true, signals: data ?? [] });
      },
      POST: async ({ request }) => {
        // PART 3: route UI button actions to their dedicated handler
        let body: any = {};
        try {
          const text = await request.text();
          if (text) body = JSON.parse(text);
        } catch { /* empty cron body is fine */ }
        if (body && typeof body === "object" && body.action) {
          return handleSignalAction(body);
        }

        const now = cairoNow();
        const today = cairoDateISO(now);
        const minutes = cairoMinutesNow();

        if (!isSessionDay(now)) {
          return Response.json({ ok: true, skipped: "out_of_session", cairo_time: now.toISOString() });
        }

        const result = { opened: 0, closed: 0, extended: 0, recycled: 0, notes: [] as string[] };

        // ── Phase B: EOD monitor FIRST (SL / time-exit / liquidity confirm) ──
        if (minutes >= GAP_PARAMS.EOD_CHECK_MIN) {
          // PART 4/3: universal shadow progression + SELL NOW signals
          const shadow = await updateShadowProgression(today);
          result.notes.push(...shadow.notes);
          result.extended += 0;

          const { data: openTrades } = await supabaseAdmin
            .from("paper_trades")
            .select("id, symbol, entry_price, entry_ts, trade_date, capital, tp_price, sl_price, exit_reason, status")
            .eq("strategy", STRATEGY_ID)
            .eq("status", "open");

          for (const tr of openTrades ?? []) {
            const st = await liveSymbolState(tr.symbol);
            if (st.price == null) { result.notes.push(`${tr.symbol}: no live price`); continue; }

            const shares = Math.max(1, Math.floor(Number(tr.capital) / Number(tr.entry_price)));
            const positionValueNow = shares * st.price;
            const extraGranted = String(tr.exit_reason ?? "").startsWith("EXTRA_HOLD");
            const decision = decideExit({
              daysHeld: tradingDaysElapsed(String(tr.trade_date), today),
              extraHoldGranted: extraGranted,
              price: st.price,
              bid: st.bid ?? 0,
              bidValue: st.bidValue,
              positionValue: positionValueNow,
              entryPrice: Number(tr.entry_price),
              exitDue: null,
            });

            if (decision.action === "HOLD") continue;

            if (decision.action === "EXTEND_HOLD") {
              await supabaseAdmin
                .from("paper_trades")
                .update({ exit_reason: "EXTRA_HOLD_1" })
                .eq("id", tr.id);
              result.extended++;
              result.notes.push(`${tr.symbol}: TIME_EXIT extended 1 day (thin liquidity)`);
              continue;
            }

            // SELL — 0.025% stamp duty each side (same cost model as before)
            const gross = (decision.exit_price - Number(tr.entry_price)) * shares;
            const net = gross - (Number(tr.entry_price) + decision.exit_price) * shares * 0.00025;
            await supabaseAdmin
              .from("paper_trades")
              .update({
                exit_price: decision.exit_price,
                exit_ts: st.ts ?? new Date().toISOString(),
                exit_reason: decision.reason,
                pnl: net,
                pnl_pct: net / Number(tr.capital),
                status: "closed",
              })
              .eq("id", tr.id);
            result.closed++;
            await logEvent({
              trade_date: today,
              symbol: tr.symbol,
              strategy: STRATEGY_ID,
              paper_trade_id: tr.id,
              event_type: "PAPER_CLOSED",
              state: decision.reason as any,
              price: decision.exit_price,
              qty: shares,
              reason: decision.reason,
              source: "gap-down-fade-3d",
              metadata: {
                net,
                bid_confirmed: decision.bid_confirmed,
                bid_value_at_exit: st.bidValue,
                position_value: positionValueNow,
                days_held: tradingDaysElapsed(String(tr.trade_date), today),
              },
            });
            result.notes.push(`${tr.symbol}: ${decision.reason} @ ${decision.exit_price} (confirmed=${decision.bid_confirmed})`);
          }
        }


        // ── Phase A: entry scan (open window, once per day) ──────────────────────
        if (minutes >= GAP_PARAMS.SESSION_OPEN_MIN && minutes < GAP_PARAMS.EOD_CHECK_MIN) {
          const { count: alreadyToday } = await supabaseAdmin
            .from("paper_trades")
            .select("id", { count: "exact", head: true })
            .eq("trade_date", today)
            .eq("strategy", STRATEGY_ID);
          if ((alreadyToday ?? 0) === 0) {
            const plan = await scanDailyCandidates();
            if (plan.status === "trading") {
              // PART 4: persist EVERY qualified candidate as a permanent signal row
              const signalsWritten = await persistScanSignals(today, plan.candidates);
              result.notes.push(`signals: ${signalsWritten} candidate rows persisted to log`);
              for (const cand of plan.selected) {
                const capital = cand.shares * cand.entry_price;
                const { data: ptRow, error } = await supabaseAdmin
                  .from("paper_trades")
                  .insert({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID,
                    entry_price: cand.entry_price,
                    entry_ts: cand.entry_ts || new Date().toISOString(),
                    tp_price: cand.entry_price,
                    sl_price: cand.entry_price * (1 + GAP_PARAMS.STOP_LOSS_PCT),
                    capital,
                    status: "open",
                    dip_trigger_price: cand.prev_close,
                  })
                  .select("id")
                  .maybeSingle();
                if (!error) {
                  result.opened++;
                  await logEvent({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID,
                    paper_trade_id: ptRow?.id ?? null,
                    event_type: "SIGNAL",
                    state: "SIGNALED",
                    price: cand.entry_price,
                    qty: cand.shares,
                    source: "gap-down-fade-3d",
                    metadata: {
                      gap_pct: cand.gap_pct,
                      prev_close: cand.prev_close,
                      bid_depth_value_at_entry: cand.bid_depth_value,
                      position_value: cand.position_value,
                    },
                  });
                }
              }
              result.notes.push(`scan: ${plan.selected.length} selected of ${plan.candidates.length} gap-downs (universe ${plan.universeCount})`);
            } else {
              result.notes.push(`scan: ${plan.status} — ${plan.statusLabelAr}`);
            }
          } else {
            result.notes.push("entry: already scanned today");
          }

          // ── Phase C: recycle freed slots into remaining candidates ──────
          if (result.closed > 0) {
            const { count: openNow } = await supabaseAdmin
              .from("paper_trades")
              .select("id", { count: "exact", head: true })
              .eq("trade_date", today)
              .eq("strategy", STRATEGY_ID)
              .eq("status", "open");
            const sizingNow = await getEffectiveSizing(); // PART 2: dynamic slots
            const freeSlots = sizingNow.top_n - (openNow ?? 0);
            if (freeSlots > 0) {
              const { data: enteredRows } = await supabaseAdmin
                .from("paper_trades")
                .select("symbol")
                .eq("trade_date", today)
                .eq("strategy", STRATEGY_ID);
              const enteredSyms = new Set((enteredRows ?? []).map((r: any) => String(r.symbol).toUpperCase()));
              const plan2 = await scanDailyCandidates();
              for (const cand of plan2.selected.slice(0, freeSlots)) {
                if (enteredSyms.has(cand.symbol)) continue; // UNIQUE(trade_date,symbol,strategy)
                const capital = cand.shares * cand.entry_price;
                const { data: ptRow, error } = await supabaseAdmin
                  .from("paper_trades")
                  .insert({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID,
                    entry_price: cand.entry_price,
                    entry_ts: cand.entry_ts || new Date().toISOString(),
                    tp_price: cand.entry_price,
                    sl_price: cand.entry_price * (1 + GAP_PARAMS.STOP_LOSS_PCT),
                    capital,
                    status: "open",
                    dip_trigger_price: cand.prev_close,
                  })
                  .select("id")
                  .maybeSingle();
                if (!error) {
                  result.recycled++;
                  await logEvent({
                    trade_date: today,
                    symbol: cand.symbol,
                    strategy: STRATEGY_ID,
                    paper_trade_id: ptRow?.id ?? null,
                    event_type: "SIGNAL",
                    state: "SIGNALED", // TradeState has no RECYCLED; metadata carries it
                    price: cand.entry_price,
                    qty: cand.shares,
                    source: "gap-down-fade-3d",
                    metadata: { recycled: true, gap_pct: cand.gap_pct },
                  });
                }
              }
            }
          }
        }

        return Response.json({
          ok: true,
          ...result,
          disclaimer: BACKTEST_DISCLAIMER_AR,
          cairo_time: now.toISOString(),
        });
      },
    },
  },
});
