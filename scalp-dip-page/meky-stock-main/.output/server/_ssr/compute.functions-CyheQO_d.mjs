import { c as createServerRpc } from "./createServerRpc-BEwYw6bn.mjs";
import { c as createServerFn } from "./server-BpMZvK1r.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:http";
import "node:stream";
import "node:stream/promises";
import "node:https";
import "node:http2";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
const computeScalpFeasibility_createServerFn_handler = createServerRpc({
  id: "0a99f69b017d353c507a6e6f607ac5a16ace74014d33be6cc1d024d4dba5840b",
  name: "computeScalpFeasibility",
  filename: "src/lib/scalp-feasibility/compute.functions.ts"
}, (opts) => computeScalpFeasibility.__executeServer(opts));
const computeScalpFeasibility = createServerFn({
  method: "POST"
}).inputValidator((input) => input).handler(computeScalpFeasibility_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-D5ro3rAQ.mjs");
  const tradeDate = data.tradeDate || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const {
    data: signals,
    error: sigErr
  } = await supabaseAdmin.from("scalp_signal_log").select("id, ts, trade_date, symbol, last_price").eq("trade_date", tradeDate).eq("decision", "would_open").order("ts", {
    ascending: true
  });
  if (sigErr) throw new Error(`fetch signals failed: ${sigErr.message}`);
  if (!signals || signals.length === 0) {
    return {
      tradeDate,
      processed: 0,
      message: "no would_open signals"
    };
  }
  let processed = 0;
  const results = [];
  for (const sig of signals) {
    const signalTs = new Date(sig.ts);
    const entryPrice = Number(sig.last_price);
    if (!(entryPrice > 0)) continue;
    const targetPrice = entryPrice * 1.005;
    const breakevenPrice = entryPrice * 1.0012;
    const windowEnd = new Date(signalTs.getTime() + 5 * 60 * 1e3);
    const {
      data: ticks,
      error: tickErr
    } = await supabaseAdmin.from("live_ticks").select("ts, price, volume").eq("symbol", sig.symbol).gte("ts", signalTs.toISOString()).lte("ts", windowEnd.toISOString()).order("ts", {
      ascending: true
    });
    if (tickErr) {
      console.warn(`ticks fetch failed for signal ${sig.id}:`, tickErr.message);
      continue;
    }
    const tickList = ticks || [];
    const ticksInWindow = tickList.length;
    const entryWindow = tickList.filter((t) => new Date(t.ts).getTime() - signalTs.getTime() <= 1e4);
    let entryFeasible = false;
    let entryActualPrice = null;
    let entryDelaySec = null;
    for (const t of entryWindow) {
      const p = Number(t.price);
      if (Math.abs(p - entryPrice) / entryPrice <= 1e-3) {
        entryFeasible = true;
        entryActualPrice = p;
        entryDelaySec = Math.floor((new Date(t.ts).getTime() - signalTs.getTime()) / 1e3);
        break;
      }
    }
    const oneMinCutoff = signalTs.getTime() + 6e4;
    let printsAtTargetCount = 0;
    let printsAtTargetVolume = 0;
    let printsAtBreakevenCount = 0;
    let timeToTargetSec = null;
    let timeToBreakevenSec = null;
    for (const t of tickList) {
      const tMs = new Date(t.ts).getTime();
      const p = Number(t.price);
      const v = Number(t.volume) || 0;
      if (p >= breakevenPrice) {
        if (timeToBreakevenSec === null) {
          timeToBreakevenSec = Math.floor((tMs - signalTs.getTime()) / 1e3);
        }
        if (tMs <= oneMinCutoff) printsAtBreakevenCount += 1;
      }
      if (p >= targetPrice) {
        if (timeToTargetSec === null) {
          timeToTargetSec = Math.floor((tMs - signalTs.getTime()) / 1e3);
        }
        if (tMs <= oneMinCutoff) {
          printsAtTargetCount += 1;
          printsAtTargetVolume += v;
        }
      }
    }
    const threeMinCutoff = signalTs.getTime() + 18e4;
    let maxPrice60s = null;
    let maxPrice180s = null;
    let minPrice180s = null;
    for (const t of tickList) {
      const tMs = new Date(t.ts).getTime();
      const p = Number(t.price);
      if (tMs <= oneMinCutoff) {
        if (maxPrice60s === null || p > maxPrice60s) maxPrice60s = p;
      }
      if (tMs <= threeMinCutoff) {
        if (maxPrice180s === null || p > maxPrice180s) maxPrice180s = p;
        if (minPrice180s === null || p < minPrice180s) minPrice180s = p;
      }
    }
    const worstCaseLossPct = minPrice180s !== null ? minPrice180s / entryPrice - 1 : null;
    const bestCaseGainPct = maxPrice180s !== null ? maxPrice180s / entryPrice - 1 : null;
    let verdict;
    if (ticksInWindow < 2) {
      verdict = "stuck";
    } else if (printsAtTargetCount >= 3) {
      verdict = "profit";
    } else if (printsAtTargetCount >= 1) {
      verdict = "thin";
    } else if (printsAtBreakevenCount >= 1) {
      verdict = "breakeven";
    } else if (maxPrice180s !== null && maxPrice180s >= targetPrice) {
      verdict = "slow";
    } else {
      verdict = "loss";
    }
    const l2Start = new Date(signalTs.getTime() - 12e4).toISOString();
    const l2End = new Date(signalTs.getTime() + 12e4).toISOString();
    const {
      data: l2rows
    } = await supabaseAdmin.from("orderbook_snapshots").select("ts, best_bid, best_ask, bids_depth").eq("symbol", sig.symbol).gte("ts", l2Start).lte("ts", l2End).order("ts", {
      ascending: false
    }).limit(1);
    let l2AtSignalTs = null;
    let l2BestBid = null;
    let l2BestAsk = null;
    let l2BidDepthTop5 = null;
    if (l2rows && l2rows.length > 0) {
      const l2 = l2rows[0];
      l2AtSignalTs = l2.ts;
      l2BestBid = l2.best_bid !== null ? Number(l2.best_bid) : null;
      l2BestAsk = l2.best_ask !== null ? Number(l2.best_ask) : null;
      const bids = Array.isArray(l2.bids_depth) ? l2.bids_depth : [];
      l2BidDepthTop5 = bids.slice(0, 5).reduce((s, b) => s + (Number(b?.qty) || Number(b?.volume_traded) || 0), 0);
    }
    let l2AtTargetTs = null;
    let l2BidAtTarget = null;
    let l2BidDepthAtTarget = null;
    let sellableAtTarget = null;
    if (timeToTargetSec !== null) {
      const targetMs = signalTs.getTime() + timeToTargetSec * 1e3;
      const tgtStart = new Date(targetMs - 3e4).toISOString();
      const tgtEnd = new Date(targetMs + 3e4).toISOString();
      const {
        data: l2Tgt
      } = await supabaseAdmin.from("orderbook_snapshots").select("ts, best_bid, bids_depth").eq("symbol", sig.symbol).gte("ts", tgtStart).lte("ts", tgtEnd).order("ts", {
        ascending: true
      });
      if (l2Tgt && l2Tgt.length > 0) {
        let closest = l2Tgt[0];
        let bestDelta = Math.abs(new Date(closest.ts).getTime() - targetMs);
        for (const row of l2Tgt) {
          const d = Math.abs(new Date(row.ts).getTime() - targetMs);
          if (d < bestDelta) {
            bestDelta = d;
            closest = row;
          }
        }
        l2AtTargetTs = closest.ts;
        l2BidAtTarget = closest.best_bid !== null ? Number(closest.best_bid) : null;
        const tgtBids = Array.isArray(closest.bids_depth) ? closest.bids_depth : [];
        l2BidDepthAtTarget = tgtBids.slice(0, 5).filter((b) => Number(b?.price) >= targetPrice).reduce((s, b) => s + (Number(b?.qty) || Number(b?.volume_traded) || 0), 0);
        sellableAtTarget = l2BidAtTarget !== null && l2BidAtTarget >= targetPrice && (l2BidDepthAtTarget ?? 0) > 0;
      }
    }
    const {
      error: upErr
    } = await supabaseAdmin.from("scalp_feasibility_report").upsert({
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
      computed_at: (/* @__PURE__ */ new Date()).toISOString()
    }, {
      onConflict: "signal_id"
    });
    if (upErr) {
      console.warn(`upsert failed for signal ${sig.id}:`, upErr.message);
      continue;
    }
    processed += 1;
    results.push({
      signal_id: Number(sig.id),
      verdict
    });
  }
  const summary = results.reduce((acc, r) => {
    acc[r.verdict] = (acc[r.verdict] || 0) + 1;
    return acc;
  }, {});
  return {
    tradeDate,
    total_signals: signals.length,
    processed,
    summary
  };
});
export {
  computeScalpFeasibility_createServerFn_handler
};
