import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
function calcFee(value) {
  return 3 + 3e-4 * value;
}
function calcSafeSellPrice(entryPrice, qty, netProfitPct) {
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  const buyValue = entryPrice * q;
  const buyFee = calcFee(buyValue);
  const desiredNetProfit = buyValue * netProfitPct;
  return +((buyValue + buyFee + 3 + desiredNetProfit) / (q * (1 - 3e-4))).toFixed(4);
}
function bidDepthAtOrAboveTarget(bidsDepth, targetPrice) {
  const bids = Array.isArray(bidsDepth) ? bidsDepth : [];
  let total = 0;
  for (const b of bids) {
    const price = Number(b?.price ?? b?.order_price ?? 0);
    const q = Number(b?.qty ?? b?.quantity ?? b?.volume_traded ?? 0);
    if (price >= targetPrice) total += q;
  }
  return total;
}
async function runPreBuyL2Gate(input) {
  const tp_pct = input.tp_pct ?? 5e-3;
  const fee_pct = input.fee_pct ?? 12e-4;
  const max_snapshot_age_ms = input.max_snapshot_age_ms ?? 1e4;
  const max_spread_pct = input.max_spread_pct ?? 5e-3;
  const min_depth_multiplier = input.min_depth_multiplier ?? 1;
  const min_history_samples = input.min_history_samples ?? 20;
  const min_history_sellable_rate = input.min_history_sellable_rate ?? 0.8;
  const source = input.source ?? "manual";
  const target_price = calcSafeSellPrice(input.entry_price, input.qty, tp_pct);
  const base = {
    target_price,
    snapshot_ts: null,
    snapshot_age_ms: null,
    best_bid: null,
    best_ask: null,
    spread: null,
    bid_sum_at_target: null
  };
  const finish = async (r) => {
    try {
      await supabaseAdmin.from("pre_buy_gate_log").insert({
        symbol: input.symbol,
        entry_price: input.entry_price,
        target_price: r.target_price,
        qty: input.qty,
        tp_pct,
        fee_pct,
        decision: r.ok ? "accept" : "reject",
        reason: r.reason,
        snapshot_ts: r.snapshot_ts,
        snapshot_age_ms: r.snapshot_age_ms,
        best_bid: r.best_bid,
        best_ask: r.best_ask,
        spread: r.spread,
        bid_sum_at_target: r.bid_sum_at_target,
        source,
        meta: {
          min_depth_multiplier,
          min_required_depth: Math.ceil(input.qty * min_depth_multiplier),
          min_history_samples,
          min_history_sellable_rate,
          history_samples: r.history_samples ?? null,
          history_sellable_rate: r.history_sellable_rate ?? null,
          history_p10_depth: r.history_p10_depth ?? null
        }
      });
    } catch (e) {
      console.warn("pre_buy_gate_log insert failed:", e.message);
    }
    return r;
  };
  const { data: rows, error } = await supabaseAdmin.from("orderbook_snapshots").select("ts, best_bid, best_ask, spread, bids_depth").eq("symbol", input.symbol).order("ts", { ascending: false }).limit(1);
  if (error || !rows || rows.length === 0) {
    return finish({
      ok: false,
      reason: "no_fresh_l2_snapshot",
      ...base
    });
  }
  const snap = rows[0];
  const snapMs = new Date(snap.ts).getTime();
  const age = Date.now() - snapMs;
  const best_bid = snap.best_bid != null ? Number(snap.best_bid) : null;
  const best_ask = snap.best_ask != null ? Number(snap.best_ask) : null;
  const spread = snap.spread != null ? Number(snap.spread) : best_bid != null && best_ask != null ? +(best_ask - best_bid).toFixed(4) : null;
  if (age > max_snapshot_age_ms) {
    return finish({
      ok: false,
      reason: `stale_l2:${age}ms>${max_snapshot_age_ms}ms`,
      ...base,
      snapshot_ts: snap.ts,
      snapshot_age_ms: age,
      best_bid,
      best_ask,
      spread
    });
  }
  const filled = {
    ...base,
    snapshot_ts: snap.ts,
    snapshot_age_ms: age,
    best_bid,
    best_ask,
    spread,
    bid_sum_at_target: bidDepthAtOrAboveTarget(snap.bids_depth, target_price)
  };
  if (!(best_bid && best_ask)) {
    return finish({
      ok: false,
      reason: "invalid_l2_best_bid_ask",
      ...filled
    });
  }
  const spreadPct = spread != null ? spread / input.entry_price : null;
  if (spreadPct != null && spreadPct > max_spread_pct) {
    return finish({
      ok: false,
      reason: `wide_spread:${(spreadPct * 100).toFixed(3)}%`,
      ...filled
    });
  }
  const requiredDepth = Math.ceil(input.qty * min_depth_multiplier);
  if ((filled.bid_sum_at_target ?? 0) < requiredDepth) {
    return finish({
      ok: false,
      reason: `insufficient_bid_depth_at_target:${filled.bid_sum_at_target}<${requiredDepth}`,
      ...filled
    });
  }
  return finish({ ok: true, reason: "ok_strict_l2_bid_depth_at_target", ...filled });
}
async function runTargetSellL2Gate(input) {
  const max_snapshot_age_ms = input.max_snapshot_age_ms ?? 15e3;
  const max_spread_pct = input.max_spread_pct ?? 5e-3;
  const min_depth_multiplier = input.min_depth_multiplier ?? 1;
  const target_price = +Number(input.target_price).toFixed(4);
  const base = {
    target_price,
    snapshot_ts: null,
    snapshot_age_ms: null,
    best_bid: null,
    best_ask: null,
    spread: null,
    bid_sum_at_target: null
  };
  const { data: rows, error } = await supabaseAdmin.from("orderbook_snapshots").select("ts, best_bid, best_ask, spread, bids_depth").eq("symbol", input.symbol).order("ts", { ascending: false }).limit(1);
  if (error || !rows || rows.length === 0) {
    return { ok: false, reason: "no_fresh_l2_snapshot", ...base };
  }
  const snap = rows[0];
  const snapMs = new Date(snap.ts).getTime();
  const age = Date.now() - snapMs;
  const best_bid = snap.best_bid != null ? Number(snap.best_bid) : null;
  const best_ask = snap.best_ask != null ? Number(snap.best_ask) : null;
  const spread = snap.spread != null ? Number(snap.spread) : best_bid != null && best_ask != null ? +(best_ask - best_bid).toFixed(4) : null;
  const filled = {
    ...base,
    snapshot_ts: snap.ts,
    snapshot_age_ms: age,
    best_bid,
    best_ask,
    spread,
    bid_sum_at_target: bidDepthAtOrAboveTarget(snap.bids_depth, target_price)
  };
  if (age > max_snapshot_age_ms) {
    return { ok: false, reason: `stale_l2:${age}ms>${max_snapshot_age_ms}ms`, ...filled };
  }
  if (!(best_bid && best_ask)) {
    return { ok: false, reason: "invalid_l2_best_bid_ask", ...filled };
  }
  const spreadPct = spread != null ? spread / target_price : null;
  if (spreadPct != null && spreadPct > max_spread_pct) {
    return { ok: false, reason: `wide_spread:${(spreadPct * 100).toFixed(3)}%`, ...filled };
  }
  const requiredDepth = Math.ceil(input.qty * min_depth_multiplier);
  if ((filled.bid_sum_at_target ?? 0) < requiredDepth) {
    return {
      ok: false,
      reason: `insufficient_bid_depth_at_target:${filled.bid_sum_at_target}<${requiredDepth}`,
      ...filled
    };
  }
  return { ok: true, reason: "ok_strict_l2_bid_depth_at_target", ...filled };
}
export {
  runPreBuyL2Gate,
  runTargetSellL2Gate
};
