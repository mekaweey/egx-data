import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PreBuyGateInput = {
  symbol: string;
  entry_price: number;
  qty: number;
  tp_pct?: number;
  fee_pct?: number;
  max_snapshot_age_ms?: number;
  max_spread_pct?: number;
  min_depth_multiplier?: number;
  min_history_samples?: number;
  min_history_sellable_rate?: number;
  source?: string;
};

export type PreBuyGateResult = {
  ok: boolean;
  reason: string;
  target_price: number;
  snapshot_ts: string | null;
  snapshot_age_ms: number | null;
  best_bid: number | null;
  best_ask: number | null;
  spread: number | null;
  bid_sum_at_target: number | null;
  history_samples?: number;
  history_sellable_rate?: number | null;
  history_p10_depth?: number | null;
};

export type TargetSellGateInput = {
  symbol: string;
  target_price: number;
  qty: number;
  max_snapshot_age_ms?: number;
  max_spread_pct?: number;
  min_depth_multiplier?: number;
};

function calcFee(value: number): number {
  return 3 + 0.0003 * value;
}

function calcSafeSellPrice(entryPrice: number, qty: number, netProfitPct: number): number {
  const q = Math.max(1, Math.floor(Number(qty) || 0));
  const buyValue = entryPrice * q;
  const buyFee = calcFee(buyValue);
  const desiredNetProfit = buyValue * netProfitPct;
  return +((buyValue + buyFee + 3 + desiredNetProfit) / (q * (1 - 0.0003))).toFixed(4);
}

function bidDepthAtOrAboveTarget(bidsDepth: unknown, targetPrice: number): number {
  const bids = Array.isArray(bidsDepth)
    ? (bidsDepth as Array<{
        price?: number;
        order_price?: number;
        qty?: number;
        quantity?: number;
        volume_traded?: number;
      }>)
    : [];

  let total = 0;
  for (const b of bids) {
    const price = Number(b?.price ?? b?.order_price ?? 0);
    const q = Number(b?.qty ?? b?.quantity ?? b?.volume_traded ?? 0);
    if (price >= targetPrice) total += q;
  }
  return total;
}

function percentile(values: number[], p: number): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[idx];
}

/**
 * Core pre-buy L2 gate — pure server-only logic, safe to import from
 * other server modules (including other *.functions.ts handlers).
 *
 * Rejects the buy unless the current L2 book already proves an instant
 * profitable exit at the exact post-fee target:
 *   1) snapshot age <= max_snapshot_age_ms
 *   2) current top-5 bid depth >= qty × min_depth_multiplier
 *   3) spread as % of entry <= max_spread_pct
 * Historical ticks are deliberately not used as proof because they cannot
 * guarantee there is a buyer for our exact size when we need to sell.
 *
 * Logs every decision to pre_buy_gate_log (best-effort, never throws).
 */
export async function runPreBuyL2Gate(input: PreBuyGateInput): Promise<PreBuyGateResult> {
  const tp_pct = input.tp_pct ?? 0.005;
  const fee_pct = input.fee_pct ?? 0.0012;
  const max_snapshot_age_ms = input.max_snapshot_age_ms ?? 10_000;
  const max_spread_pct = input.max_spread_pct ?? 0.005;
  const min_depth_multiplier = input.min_depth_multiplier ?? 1;
  const min_history_samples = input.min_history_samples ?? 20;
  const min_history_sellable_rate = input.min_history_sellable_rate ?? 0.80;
  const source = input.source ?? "manual";

  const target_price = calcSafeSellPrice(input.entry_price, input.qty, tp_pct);

  const base = {
    target_price,
    snapshot_ts: null as string | null,
    snapshot_age_ms: null as number | null,
    best_bid: null as number | null,
    best_ask: null as number | null,
    spread: null as number | null,
    bid_sum_at_target: null as number | null,
  };
  void base;

  const finish = async (r: PreBuyGateResult): Promise<PreBuyGateResult> => {
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
          history_p10_depth: r.history_p10_depth ?? null,
        },
      });
    } catch (e) {
      console.warn("pre_buy_gate_log insert failed:", (e as Error).message);
    }
    return r;
  };

  // ─── STRICT GATE: current L2 buyer demand only ────────────────────────
  // Historical ticks prove that a price traded before; they do NOT prove that
  // buyers will exist for our exact size when we need to sell. For a confirmed
  // pre-buy decision, accept only when the latest fresh order book already has
  // enough bid volume at or above the exact post-fee/profit sell price.
  const { data: rows, error } = await supabaseAdmin
    .from("orderbook_snapshots")
    .select("ts, best_bid, best_ask, spread, bids_depth")
    .eq("symbol", input.symbol)
    .order("ts", { ascending: false })
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return finish({
      ok: false,
      reason: "no_fresh_l2_snapshot",
      ...base,
    });
  }

  const snap = rows[0];
  const snapMs = new Date(snap.ts as string).getTime();
  const age = Date.now() - snapMs;
  const best_bid = snap.best_bid != null ? Number(snap.best_bid) : null;
  const best_ask = snap.best_ask != null ? Number(snap.best_ask) : null;
  const spread =
    snap.spread != null
      ? Number(snap.spread)
      : best_bid != null && best_ask != null
        ? +(best_ask - best_bid).toFixed(4)
        : null;

  if (age > max_snapshot_age_ms) {
    return finish({
      ok: false,
      reason: `stale_l2:${age}ms>${max_snapshot_age_ms}ms`,
      ...base,
      snapshot_ts: snap.ts as string,
      snapshot_age_ms: age,
      best_bid,
      best_ask,
      spread,
    });
  }

  const filled = {
    ...base,
    snapshot_ts: snap.ts as string,
    snapshot_age_ms: age,
    best_bid,
    best_ask,
    spread,
    bid_sum_at_target: bidDepthAtOrAboveTarget(snap.bids_depth, target_price),
  };

  if (!(best_bid && best_ask)) {
    return finish({
      ok: false,
      reason: "invalid_l2_best_bid_ask",
      ...filled,
    });
  }

  const spreadPct = spread != null ? spread / input.entry_price : null;
  if (spreadPct != null && spreadPct > max_spread_pct) {
    return finish({
      ok: false,
      reason: `wide_spread:${(spreadPct * 100).toFixed(3)}%`,
      ...filled,
    });
  }

  const requiredDepth = Math.ceil(input.qty * min_depth_multiplier);
  if ((filled.bid_sum_at_target ?? 0) < requiredDepth) {
    return finish({
      ok: false,
      reason: `insufficient_bid_depth_at_target:${filled.bid_sum_at_target}<${requiredDepth}`,
      ...filled,
    });
  }

  // Suppress unused-var warnings for legacy history params kept for API shape.
  void min_history_samples; void min_history_sellable_rate;

  return finish({ ok: true, reason: "ok_strict_l2_bid_depth_at_target", ...filled });
}

export async function runTargetSellL2Gate(input: TargetSellGateInput): Promise<PreBuyGateResult> {
  const max_snapshot_age_ms = input.max_snapshot_age_ms ?? 15_000;
  const max_spread_pct = input.max_spread_pct ?? 0.005;
  const min_depth_multiplier = input.min_depth_multiplier ?? 1;
  const target_price = +Number(input.target_price).toFixed(4);
  const base = {
    target_price,
    snapshot_ts: null as string | null,
    snapshot_age_ms: null as number | null,
    best_bid: null as number | null,
    best_ask: null as number | null,
    spread: null as number | null,
    bid_sum_at_target: null as number | null,
  };

  const { data: rows, error } = await supabaseAdmin
    .from("orderbook_snapshots")
    .select("ts, best_bid, best_ask, spread, bids_depth")
    .eq("symbol", input.symbol)
    .order("ts", { ascending: false })
    .limit(1);

  if (error || !rows || rows.length === 0) {
    return { ok: false, reason: "no_fresh_l2_snapshot", ...base };
  }

  const snap = rows[0];
  const snapMs = new Date(snap.ts as string).getTime();
  const age = Date.now() - snapMs;
  const best_bid = snap.best_bid != null ? Number(snap.best_bid) : null;
  const best_ask = snap.best_ask != null ? Number(snap.best_ask) : null;
  const spread =
    snap.spread != null
      ? Number(snap.spread)
      : best_bid != null && best_ask != null
        ? +(best_ask - best_bid).toFixed(4)
        : null;
  const filled = {
    ...base,
    snapshot_ts: snap.ts as string,
    snapshot_age_ms: age,
    best_bid,
    best_ask,
    spread,
    bid_sum_at_target: bidDepthAtOrAboveTarget(snap.bids_depth, target_price),
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
      ...filled,
    };
  }

  return { ok: true, reason: "ok_strict_l2_bid_depth_at_target", ...filled };
}