import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PreBuyGateResult } from "./pre-buy-gate.server";
export type { PreBuyGateResult } from "./pre-buy-gate.server";

/**
 * Pre-buy L2 gate.
 *
 * Before any buy (manual or automatic), call this to prove — from the latest
 * real orderbook_snapshots row — that instant profitable exit is possible:
 *   target_price = entry × (1 + tp_pct + fee_pct)
 * Accept only if:
 *   1) snapshot is fresh (age <= max_snapshot_age_ms)
 *   2) sum of bids at price >= target_price is >= qty
 *   3) spread as % of entry <= max_spread_pct
 *
 * Returns { ok, reason, ... }. Also inserts one row into pre_buy_gate_log
 * (never throws on log failure — the decision matters, the log is best-effort).
 */
const InputSchema = z.object({
  symbol: z.string().min(1).max(20),
  entry_price: z.number().positive(),
  qty: z.number().positive(),
  tp_pct: z.number().positive().default(0.005), // 0.5% net move
  fee_pct: z.number().nonnegative().default(0.0012), // ~round-trip commission
  max_snapshot_age_ms: z.number().int().positive().default(10_000),
  max_spread_pct: z.number().positive().default(0.005), // 0.5%
  source: z.string().max(40).default("manual"),
});

export const preBuyL2Gate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }): Promise<PreBuyGateResult> => {
    const { runPreBuyL2Gate } = await import("./pre-buy-gate.server");
    return runPreBuyL2Gate(data);
  });