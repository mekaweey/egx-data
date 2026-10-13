// Trade Event Ledger — append-only lifecycle log.
//
// Every meaningful transition in a trade's life (signal → order → fill →
// hold → sell → close) writes one row here. Nothing else in the app
// depends on this write succeeding — logEvent SWALLOWS all errors on
// purpose. The ledger is the observability substrate; it must never
// break the trading path.
//
// Read side: /trade-lifecycle page + getTradeLifecycle server fn.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type TradeEventType =
  | "SIGNAL"                    // strategy detected a candidate & inserted paper_trade
  | "ORDER_QUEUED"              // pending_orders row created (buy or sell)
  | "ORDER_OPENED"              // extension opened Thunder tab for this order
  | "ORDER_PREPARED"            // extension filled the buy/sell form
  | "ORDER_CONFIRMED"           // extension observed Thunder confirmation
  | "REVIEW_CLICKED"            // user clicked review button (metric only)
  | "BUY_FILLED"                // register_buy_fill received → position opened
  | "SELL_REQUESTED"            // extension called thunder-positions sell
  | "SELL_QUEUED"               // sell-watcher created a sell pending_order
  | "SELL_FILLED"               // fill received via order-update
  | "SMART_EXIT_HARD_FLOOR"
  | "SMART_EXIT_VOLUME_DEATH"
  | "SMART_EXIT_ILLIQUIDITY"
  | "SMART_EXIT_PREBUY_SKIP"
  | "PAPER_CLOSED"              // paper_trades row moved to closed
  | "ERROR"
  | "CANCELLED";

export type TradeState =
  | "SIGNALED" | "BUYING" | "HOLDING" | "SELLING"
  | "CLOSED_TP" | "CLOSED_SL" | "CLOSED_TRAIL" | "CLOSED_TIME" | "CLOSED_EOD"
  | "CLOSED_HARD_FLOOR" | "CLOSED_VOLUME_DEATH"
  | "CLOSED_ILLIQUIDITY"
  | "CANCELLED" | "ERROR";

export type TradeEventInput = {
  trade_date?: string;                 // YYYY-MM-DD Cairo; auto-filled if omitted
  symbol: string;
  strategy?: string | null;
  paper_trade_id?: string | null;
  position_id?: string | null;
  pending_order_id?: string | null;
  event_type: TradeEventType;
  state?: TradeState | null;
  price?: number | null;
  qty?: number | null;
  reason?: string | null;
  source?: string | null;
  metadata?: Record<string, unknown>;
};

function cairoDate(): string {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

/**
 * Log a single lifecycle event. Never throws — logs to console on failure.
 * Safe to await or fire-and-forget. Idempotency is NOT enforced (append-only
 * ledger); callers who need dedup should key on event_type + paper_trade_id.
 */
export async function logEvent(ev: TradeEventInput): Promise<void> {
  try {
    await supabaseAdmin.from("trade_events").insert({
      trade_date: ev.trade_date ?? cairoDate(),
      symbol: String(ev.symbol || "").toUpperCase(),
      strategy: ev.strategy ?? null,
      paper_trade_id: ev.paper_trade_id ?? null,
      position_id: ev.position_id ?? null,
      pending_order_id: ev.pending_order_id ?? null,
      event_type: ev.event_type,
      state: ev.state ?? null,
      price: ev.price ?? null,
      qty: ev.qty ?? null,
      reason: ev.reason ?? null,
      source: ev.source ?? null,
      metadata: (ev.metadata ?? {}) as never,
    });
  } catch (e) {
    // Ledger failures must never break the trading path.
    console.error("[trade-ledger] logEvent failed:", (e as Error).message, ev.event_type, ev.symbol);
  }
}

/**
 * Map a paper_trades exit_reason to a terminal TradeState.
 */
export function stateFromExitReason(reason: string | null | undefined): TradeState {
  switch ((reason || "").toUpperCase()) {
    case "TP": return "CLOSED_TP";
    case "SL": return "CLOSED_SL";
    case "TRAIL": return "CLOSED_TRAIL";
    case "TIME": return "CLOSED_TIME";
    case "EOD": return "CLOSED_EOD";
    case "HARD_FLOOR": return "CLOSED_HARD_FLOOR";
    case "VOLUME_DEATH": return "CLOSED_VOLUME_DEATH";
    case "ILLIQUIDITY_EXIT": return "CLOSED_ILLIQUIDITY";
    default: return "CLOSED_TP"; // safe default; unknown = treat as closed
  }
}
