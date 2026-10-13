import { createServerFn } from "@tanstack/react-start";

/**
 * Compute scalp feasibility report for all `would_open` signals on a trade_date.
 *
 * Every field is derived from real `live_ticks` (actual prints between buyer & seller)
 * and `orderbook_snapshots` if available. No simulation, no assumptions.
 *
 * Formulas:
 *   target_price   = entry_price * 1.005    (0.5% net move)
 *   breakeven      = entry_price * 1.0012   (~commission round-trip)
 *
 * Verdicts:
 *   'profit'    → prints_at_target_count >= 3 within 60s (real exit liquidity)
 *   'thin'      → 1-2 prints at target within 60s (wick / thin book)
 *   'slow'      → target reached only AFTER 60s (would require long hold)
 *   'breakeven' → at least 1 print at breakeven within 60s
 *   'loss'      → max_price_60s < breakeven_price
 *   'stuck'     → fewer than 2 ticks in window (no data to judge)
 *
 * NOTE: live_ticks.volume is NULL in this project's feed — Thunder's
 * long-poll doesn't expose per-trade size. Every tick still equals one
 * matched trade (real print), so count of prints IS the liquidity proof.
 */
export const computeScalpFeasibility = createServerFn({ method: "POST" })
  .inputValidator((input: { tradeDate?: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tradeDate = data.tradeDate || new Date().toISOString().slice(0, 10);

    // 1) Pull all "would_open" signals for the day
    const { data: signals, error: sigErr } = await supabaseAdmin
      .from("scalp_signal_log")
      .select("id, ts, trade_date, symbol, last_price")
      .eq("trade_date", tradeDate)
      .eq("decision", "would_open")
      .order("ts", { ascending: true });

    if (sigErr) throw new Error(`fetch signals failed: ${sigErr.message}`);
    if (!signals || signals.length === 0) {
      return { tradeDate, processed: 0, message: "no would_open signals" };
    }

    let processed = 0;
    const results: Array<{ signal_id: number; verdict: string }> = [];

    for (const sig of signals) {
      const signalTs = new Date(sig.ts as string);
      const entryPrice = Number(sig.last_price);
      if (!(entryPrice > 0)) continue;

      const targetPrice = entryPrice * 1.005;
      const breakevenPrice = entryPrice * 1.0012;
      const windowEnd = new Date(signalTs.getTime() + 5 * 60 * 1000);

      // 2) Fetch every tick in the 5-minute exit window (ordered by time)
      const { data: ticks, error: tickErr } = await supabaseAdmin
        .from("live_ticks")
        .select("ts, price, volume")
        .eq("symbol", sig.symbol)
        .gte("ts", signalTs.toISOString())
        .lte("ts", windowEnd.toISOString())
        .order("ts", { ascending: true });

      if (tickErr) {
        console.warn(`ticks fetch failed for signal ${sig.id}:`, tickErr.message);
        continue;
      }

      const tickList = ticks || [];
      const ticksInWindow = tickList.length;

      // 3) Entry feasibility: any tick within ±0.1% of entry_price in first 10s
      const entryWindow = tickList.filter(
        (t) =>
          new Date(t.ts as string).getTime() - signalTs.getTime() <= 10_000,
      );
      let entryFeasible = false;
      let entryActualPrice: number | null = null;
      let entryDelaySec: number | null = null;
      for (const t of entryWindow) {
        const p = Number(t.price);
        if (Math.abs(p - entryPrice) / entryPrice <= 0.001) {
          entryFeasible = true;
          entryActualPrice = p;
          entryDelaySec = Math.floor(
            (new Date(t.ts as string).getTime() - signalTs.getTime()) / 1000,
          );
          break;
        }
      }

      // 4) Prints at/above target and breakeven (within 60s of signal)
      const oneMinCutoff = signalTs.getTime() + 60_000;
      let printsAtTargetCount = 0;
      let printsAtTargetVolume = 0;
      let printsAtBreakevenCount = 0;
      let timeToTargetSec: number | null = null;
      let timeToBreakevenSec: number | null = null;

      for (const t of tickList) {
        const tMs = new Date(t.ts as string).getTime();
        const p = Number(t.price);
        const v = Number(t.volume) || 0;

        if (p >= breakevenPrice) {
          if (timeToBreakevenSec === null) {
            timeToBreakevenSec = Math.floor((tMs - signalTs.getTime()) / 1000);
          }
          if (tMs <= oneMinCutoff) printsAtBreakevenCount += 1;
        }
        if (p >= targetPrice) {
          if (timeToTargetSec === null) {
            timeToTargetSec = Math.floor((tMs - signalTs.getTime()) / 1000);
          }
          if (tMs <= oneMinCutoff) {
            printsAtTargetCount += 1;
            printsAtTargetVolume += v;
          }
        }
      }

      // 5) Price extremes at 60s / 180s
      const threeMinCutoff = signalTs.getTime() + 180_000;
      let maxPrice60s: number | null = null;
      let maxPrice180s: number | null = null;
      let minPrice180s: number | null = null;
      for (const t of tickList) {
        const tMs = new Date(t.ts as string).getTime();
        const p = Number(t.price);
        if (tMs <= oneMinCutoff) {
          if (maxPrice60s === null || p > maxPrice60s) maxPrice60s = p;
        }
        if (tMs <= threeMinCutoff) {
          if (maxPrice180s === null || p > maxPrice180s) maxPrice180s = p;
          if (minPrice180s === null || p < minPrice180s) minPrice180s = p;
        }
      }

      const worstCaseLossPct =
        minPrice180s !== null ? minPrice180s / entryPrice - 1 : null;
      const bestCaseGainPct =
        maxPrice180s !== null ? maxPrice180s / entryPrice - 1 : null;

      // 6) Verdict
      let verdict: string;
      if (ticksInWindow < 2) {
        verdict = "stuck";
      } else if (printsAtTargetCount >= 3) {
        verdict = "profit";
      } else if (printsAtTargetCount >= 1) {
        verdict = "thin";
      } else if (printsAtBreakevenCount >= 1) {
        verdict = "breakeven";
      } else if (maxPrice180s !== null && maxPrice180s >= targetPrice) {
        // Target reached but only AFTER the 60s exit window
        verdict = "slow";
      } else {
        verdict = "loss";
      }

      // 7) L2 snapshot (best-effort, within ±120s of signal — v4.1.79 widened)
      const l2Start = new Date(signalTs.getTime() - 120_000).toISOString();
      const l2End = new Date(signalTs.getTime() + 120_000).toISOString();
      const { data: l2rows } = await supabaseAdmin
        .from("orderbook_snapshots")
        .select("ts, best_bid, best_ask, bids_depth")
        .eq("symbol", sig.symbol)
        .gte("ts", l2Start)
        .lte("ts", l2End)
        .order("ts", { ascending: false })
        .limit(1);

      let l2AtSignalTs: string | null = null;
      let l2BestBid: number | null = null;
      let l2BestAsk: number | null = null;
      let l2BidDepthTop5: number | null = null;
      if (l2rows && l2rows.length > 0) {
        const l2 = l2rows[0];
        l2AtSignalTs = l2.ts as string;
        l2BestBid = l2.best_bid !== null ? Number(l2.best_bid) : null;
        l2BestAsk = l2.best_ask !== null ? Number(l2.best_ask) : null;
        const bids = Array.isArray(l2.bids_depth)
          ? (l2.bids_depth as Array<{ qty?: number; volume_traded?: number }>)
          : [];
        l2BidDepthTop5 = bids
          .slice(0, 5)
          .reduce(
            (s, b) => s + (Number(b?.qty) || Number(b?.volume_traded) || 0),
            0,
          );
      }

      // 7b) L2 snapshot AT TARGET TIME (proves post-hoc sellability).
      // Only meaningful when the price actually reached the target. If it did
      // not, or if no snapshot exists within ±10s of the target-touch time,
      // leave all four new columns NULL — NULL means "unknown", not "false".
      let l2AtTargetTs: string | null = null;
      let l2BidAtTarget: number | null = null;
      let l2BidDepthAtTarget: number | null = null;
      let sellableAtTarget: boolean | null = null;
      if (timeToTargetSec !== null) {
        const targetMs = signalTs.getTime() + timeToTargetSec * 1000;
        // v4.1.79: widened ±10s → ±30s to catch closest snapshot
        const tgtStart = new Date(targetMs - 30_000).toISOString();
        const tgtEnd = new Date(targetMs + 30_000).toISOString();
        const { data: l2Tgt } = await supabaseAdmin
          .from("orderbook_snapshots")
          .select("ts, best_bid, bids_depth")
          .eq("symbol", sig.symbol)
          .gte("ts", tgtStart)
          .lte("ts", tgtEnd)
          .order("ts", { ascending: true });
        if (l2Tgt && l2Tgt.length > 0) {
          // Pick the snapshot closest in time to targetMs
          let closest = l2Tgt[0];
          let bestDelta = Math.abs(
            new Date(closest.ts as string).getTime() - targetMs,
          );
          for (const row of l2Tgt) {
            const d = Math.abs(
              new Date(row.ts as string).getTime() - targetMs,
            );
            if (d < bestDelta) {
              bestDelta = d;
              closest = row;
            }
          }
          l2AtTargetTs = closest.ts as string;
          l2BidAtTarget =
            closest.best_bid !== null ? Number(closest.best_bid) : null;
          const tgtBids = Array.isArray(closest.bids_depth)
            ? (closest.bids_depth as Array<{
                price?: number;
                qty?: number;
                volume_traded?: number;
              }>)
            : [];
          // Sum qty from top-5 bid levels whose price >= target_price
          l2BidDepthAtTarget = tgtBids
            .slice(0, 5)
            .filter((b) => Number(b?.price) >= targetPrice)
            .reduce(
              (s, b) =>
                s + (Number(b?.qty) || Number(b?.volume_traded) || 0),
              0,
            );
          // Sellable iff there is at least one real buyer at/above target price
          sellableAtTarget =
            l2BidAtTarget !== null &&
            l2BidAtTarget >= targetPrice &&
            (l2BidDepthAtTarget ?? 0) > 0;
        }
      }

      // 8) Upsert
      const { error: upErr } = await supabaseAdmin
        .from("scalp_feasibility_report")
        .upsert(
          {
            signal_id: sig.id,
            trade_date: sig.trade_date,
            symbol: sig.symbol,
            signal_ts: sig.ts,
            entry_price: entryPrice,
            target_price: targetPrice,
            breakeven_price: breakevenPrice,
            entry_feasible: entryFeasible,
            entry_actual_price: entryActualPrice,
            entry_delay_sec: entryDelaySec,
            time_to_target_sec: timeToTargetSec,
            time_to_breakeven_sec: timeToBreakevenSec,
            prints_at_target_count: printsAtTargetCount,
            prints_at_target_volume: printsAtTargetVolume,
            prints_at_breakeven_count: printsAtBreakevenCount,
            max_price_60s: maxPrice60s,
            max_price_180s: maxPrice180s,
            min_price_180s: minPrice180s,
            ticks_in_window: ticksInWindow,
            worst_case_loss_pct: worstCaseLossPct,
            best_case_gain_pct: bestCaseGainPct,
            exit_verdict: verdict,
            l2_at_signal_ts: l2AtSignalTs,
            l2_best_bid: l2BestBid,
            l2_best_ask: l2BestAsk,
            l2_bid_depth_top5: l2BidDepthTop5,
            l2_at_target_ts: l2AtTargetTs,
            l2_bid_at_target: l2BidAtTarget,
            l2_bid_depth_at_target: l2BidDepthAtTarget,
            sellable_at_target: sellableAtTarget,
            computed_at: new Date().toISOString(),
          },
          { onConflict: "signal_id" },
        );

      if (upErr) {
        console.warn(`upsert failed for signal ${sig.id}:`, upErr.message);
        continue;
      }
      processed += 1;
      results.push({ signal_id: Number(sig.id), verdict });
    }

    // 9) Summary
    const summary = results.reduce<Record<string, number>>((acc, r) => {
      acc[r.verdict] = (acc[r.verdict] || 0) + 1;
      return acc;
    }, {});

    return {
      tradeDate,
      total_signals: signals.length,
      processed,
      summary,
    };
  });