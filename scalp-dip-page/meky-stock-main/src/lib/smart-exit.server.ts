import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Smart-Exit rules for scalp-dip.
 *
 * Three deterministic rules that fire on real market conditions (no guessing):
 *   1. PREBUY_VOLUME_FILTER — skip candidates with zero trades in last 5min.
 *   2. HARD_FLOOR          — force exit if unrealized P&L <= -1.5%.
 *   3. VOLUME_DEATH        — force exit at breakeven if 10min passed and
 *                            zero trades observed on symbol for 5min.
 *
 * Every decision is logged to `smart_exit_log`. In shadow mode the decision
 * is logged but NOT enforced — used for the first-week validation window.
 */

export const SMART_EXIT_RULES = {
  HARD_FLOOR_PCT: -0.01,           // -1.0% (Elite Sniper 5)
  VOLUME_DEATH_AFTER_SEC: 10 * 60, 
  VOLUME_LOOKBACK_SEC: 5 * 60,     
  MIN_TRADES_5M: 3,                // Increased for quality
  MIN_VOLUME_5M: 10000,            // Increased for Elite liquidity
  // R2 — Early illiquidity exit: if 5m volume < qty * ILLIQ_MIN_RATIO
  // continuously for ILLIQ_HOLD_SEC seconds (after GRACE), exit at market.
  ILLIQ_MIN_RATIO: 5,              // Higher requirement for instant sell
  ILLIQ_HOLD_SEC: 120,
} as const;

type Flags = {
  enabled: boolean;
  shadow: boolean;
  prebuy: boolean;
};

let flagCache: { at: number; flags: Flags } | null = null;

export async function getSmartExitFlags(): Promise<Flags> {
  if (flagCache && Date.now() - flagCache.at < 5_000) return flagCache.flags;
  const { data } = await supabaseAdmin
    .from("strategy_settings")
    .select("key,enabled")
    .in("key", [
      "scalp-dip-smart-exit",
      "scalp-dip-smart-exit-shadow",
      "scalp-dip-prebuy-volume-filter",
    ]);
  const map = new Map((data ?? []).map((r) => [r.key, r.enabled]));
  const flags: Flags = {
    enabled: map.get("scalp-dip-smart-exit") ?? true,
    shadow: map.get("scalp-dip-smart-exit-shadow") ?? true,
    prebuy: map.get("scalp-dip-prebuy-volume-filter") ?? true,
  };
  flagCache = { at: Date.now(), flags };
  return flags;
}

export type MwLiveness = {
  trades5m: number;
  volume5m: number;
  lastSeen: string | null;
};

/** Read cumulative trades/volume delta over the last 5 minutes from marketwatch_snapshots. */
export async function getMarketwatchLiveness(symbol: string): Promise<MwLiveness> {
  const since = new Date(Date.now() - SMART_EXIT_RULES.VOLUME_LOOKBACK_SEC * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from("marketwatch_snapshots")
    .select("total_volume,total_trades,captured_at")
    .eq("symbol", symbol)
    .gte("captured_at", since)
    .order("captured_at", { ascending: true });
  if (!data || data.length === 0) return { trades5m: 0, volume5m: 0, lastSeen: null };
  const first = data[0];
  const last = data[data.length - 1];
  const trades5m = Math.max(0, Number(last.total_trades ?? 0) - Number(first.total_trades ?? 0));
  const volume5m = Math.max(0, Number(last.total_volume ?? 0) - Number(first.total_volume ?? 0));
  return { trades5m, volume5m, lastSeen: last.captured_at };
}

export async function logSmartExit(row: {
  trade_date: string;
  symbol: string;
  strategy?: string;
  rule: string;
  action: string;
  shadow: boolean;
  price?: number | null;
  entry_price?: number | null;
  pnl_pct?: number | null;
  seconds_since_entry?: number | null;
  mw_trades_5m?: number | null;
  mw_volume_5m?: number | null;
  position_id?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await supabaseAdmin.from("smart_exit_log").insert({
      trade_date: row.trade_date,
      symbol: row.symbol,
      strategy: row.strategy ?? "scalp-dip",
      rule: row.rule,
      action: row.action,
      shadow: row.shadow,
      price: row.price ?? null,
      entry_price: row.entry_price ?? null,
      pnl_pct: row.pnl_pct ?? null,
      seconds_since_entry: row.seconds_since_entry ?? null,
      mw_trades_5m: row.mw_trades_5m ?? null,
      mw_volume_5m: row.mw_volume_5m ?? null,
      position_id: row.position_id ?? null,
      metadata: (row.metadata ?? {}) as never,
    });
  } catch (e) {
    console.error("smart_exit_log insert failed", e);
  }
}