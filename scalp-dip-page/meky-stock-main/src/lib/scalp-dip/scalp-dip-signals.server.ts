/**
 * scalp-dip-signals.server.ts — PARTS 3/4/5 of the scalp-dip feature.
 *
 * PART 3  — user Buy/Sell tracking ("تم الشراء" / "تم البيع" buttons) with
 *           realized PnL (same 0.025%/side stamp duty cost model).
 * PART 4  — universal shadow simulation: EVERY liquidity-qualified candidate
 *           gets a scalp_dip_signals row; day1/2/3 + shadow_pnl updated EOD.
 * PART 5  — the scalp_dip_signals table IS the permanent per-signal history.
 *
 * Additive to the runner; PAPER / manual-tracking only — no real orders.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  tradingDaysElapsed,
  liveSymbolState,
  decideExit,
  MW_PARAMS,
  type Candidate,
} from "@/lib/scalp-dip/momentum-weekly.server";

export type SignalRow = {
  id: number;
  scan_date: string;
  symbol: string;
  entry_price: number;
  gap_pct: number;
  bid_depth_at_entry: number;
  position_value: number;
  bought: boolean;
  actual_buy_price: number | null;
  buy_timestamp: string | null;
  day1_status: string | null;
  day1_price: number | null;
  day2_status: string | null;
  day2_price: number | null;
  day3_status: string | null;
  day3_price: number | null;
  exit_reason: string | null;
  bid_confirmed_at_exit: boolean | null;
  extra_hold_used: boolean;
  shadow_exit_price: number | null;
  shadow_pnl: number | null;
  shadow_pnl_pct: number | null;
  sold: boolean;
  actual_sell_price: number | null;
  sell_timestamp: string | null;
  realized_pnl: number | null;
  realized_pnl_pct: number | null;
  sell_signal: boolean;
  sell_signal_reason: string | null;
  news_30h?: boolean | null;
  created_at: string;
  updated_at: string;
};

export type DecisionAuditRow = {
  id: number;
  created_at: string;
  event_type: string;
  symbol: string;
  trigger_price: number | null;
  reference_price: number | null;
  pnl_pct: number | null;
  details: string | null;
  user_action: string;
  action_ts: string | null;
};

const ARABIC_DAYS = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

/**
 * Calculates the exact 4th trading day exit date on the EGX calendar (skips Fri/Sat).
 * Example: if entered Thursday (day 1), day 2 is Sun, day 3 is Mon, day 4 is Tue!
 */
export function computeExpectedExitDate(entryDateISO: string, holdDays: number = 4): {
  exitDate: string;
  exitDayName: string;
  tradingDaysTotal: number;
} {
  const start = new Date(`${entryDateISO}T00:00:00Z`);
  const cur = new Date(start);
  let sessionDaysCount = 1; // entry day is Day 1

  while (sessionDaysCount < holdDays) {
    cur.setUTCDate(cur.getUTCDate() + 1);
    const dow = cur.getUTCDay();
    // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu
    if (dow >= 0 && dow <= 4) {
      sessionDaysCount++;
    }
  }

  const yyyy = cur.getUTCFullYear();
  const mm = String(cur.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(cur.getUTCDate()).padStart(2, "0");
  const exitDate = `${yyyy}-${mm}-${dd}`;
  const exitDayName = ARABIC_DAYS[cur.getUTCDay()];

  return { exitDate, exitDayName, tradingDaysTotal: holdDays };
}

export async function logDecisionEvent(params: {
  event_type: string;
  symbol: string;
  trigger_price?: number | null;
  reference_price?: number | null;
  pnl_pct?: number | null;
  details?: Record<string, unknown>;
  user_action?: string;
  action_ts?: string;
}): Promise<void> {
  try {
    await (supabaseAdmin as any).from("decision_audit_log").insert({
      event_type: params.event_type,
      symbol: params.symbol,
      trigger_price: params.trigger_price ?? null,
      reference_price: params.reference_price ?? null,
      pnl_pct: params.pnl_pct ?? null,
      details: params.details ?? {},
      user_action: params.user_action ?? "PENDING",
      action_ts: params.action_ts ?? (params.user_action ? new Date().toISOString() : null),
    });
  } catch (e: any) {
    console.error("[decision_audit_log] failed to write:", e?.message);
  }
}

export async function getRecentAuditLogs(limit: number = 50): Promise<DecisionAuditRow[]> {
  try {
    const { data } = await (supabaseAdmin as any)
      .from("decision_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as any[]).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      event_type: r.event_type,
      symbol: r.symbol,
      trigger_price: r.trigger_price != null ? Number(r.trigger_price) : null,
      reference_price: r.reference_price != null ? Number(r.reference_price) : null,
      pnl_pct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
      details: typeof r.details === "object" && r.details ? JSON.stringify(r.details) : String(r.details ?? ""),
      user_action: r.user_action ?? "PENDING",
      action_ts: r.action_ts ?? null,
    }));
  } catch {
    return [];
  }
}

/** Stamp duty each side (same cost model as the paper runner). */
const STAMP_DUTY = 0.00025;

function netPnl(buy: number, sell: number, shares: number): number {
  const gross = (sell - buy) * shares;
  const duty = (buy + sell) * shares * STAMP_DUTY;
  return gross - duty;
}

// ── PART 4 (persist side): upsert every qualified candidate into the log ──
/**
 * Called from the runner's Phase A after a scan: one row per liquidity-
 * qualified gap-down candidate (NOT only TOP_N — every candidate). Idempotent
 * via UNIQUE(scan_date, symbol) + ignoreDuplicates (scan snapshot immutable).
 */
export async function persistScanSignals(
  today: string,
  candidates: Candidate[],
): Promise<number> {
  let written = 0;
  for (const c of candidates) {
    const { error } = await supabaseAdmin
      .from("scalp_dip_signals")
      .upsert(
        {
          scan_date: today,
          symbol: c.symbol,
          entry_price: c.entry_price,
          gap_pct: c.gap_pct,
          bid_depth_at_entry: c.bid_depth_value,
          position_value: c.position_value,
          ...(c.news_30h !== undefined ? { news_30h: c.news_30h } : {}),
        },
        { onConflict: "scan_date,symbol", ignoreDuplicates: true },
      );
    if (!error) written++;
  }
  return written;
}

// ── PART 4 (progress side): EOD update of day1/2/3 + shadow outcome ──
/**
 * Called from the runner Phase B (>=14:25 Cairo). For every still-open
 * signal: stamps the dayN progression and, when Step-4 fires (SL <= -8% or
 * day-3 time exit), runs the SAME Step-5 liquidity confirmation and records
 * the shadow outcome. Bought-but-unsold signals get a prominent
 * sell_signal=true flag with the SELL NOW reason.
 */
export async function updateShadowProgression(today: string): Promise<{
  updated: number;
  exited: number;
  sellSignaled: number;
  notes: string[];
}> {
  const notes: string[] = [];
  const { data: openSignals } = (await supabaseAdmin
    .from("scalp_dip_signals")
    .select("*")
    .is("exit_reason", null)) as { data: SignalRow[] | null };
  if (!openSignals || openSignals.length === 0)
    return { updated: 0, exited: 0, sellSignaled: 0, notes };

  let updated = 0;
  let exited = 0;
  let sellSignaled = 0;
  const stateCache = new Map<string, Awaited<ReturnType<typeof liveSymbolState>>>();

  for (const sig of openSignals) {
    try {
      const daysHeld = tradingDaysElapsed(sig.scan_date, today);
      let st = stateCache.get(sig.symbol);
      if (!st) {
        st = await liveSymbolState(sig.symbol);
        stateCache.set(sig.symbol, st);
      }
      // bug fix 2026-09-22: prefer today's scanner-synced candle close over the
      // (usually empty) live tables — liveSymbolState is only a fallback now.
      const candleClose = await todayCandleClose(sig.symbol, today);
      const livePrice = candleClose ?? st?.price ?? null;
      if (daysHeld <= 0) {
        await supabaseAdmin
          .from("scalp_dip_signals")
          .update({
            day1_status: "HELD",
            day1_price: livePrice,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sig.id);
        updated++;
        continue;
      }
      if (livePrice == null) {
        notes.push(sig.symbol + ": no live price at EOD");
        continue;
      }

      const shares = Math.max(1, Math.floor(sig.position_value / sig.entry_price));
      const positionValueNow = shares * (livePrice as number);

      const decision = decideExit({
        daysHeld,
        extraHoldGranted: sig.extra_hold_used,
        price: livePrice as number,
        bid: st.bid ?? 0,
        bidValue: st.bidValue,
        positionValue: positionValueNow,
        entryPrice: sig.entry_price,
        exitDue: null,
      });

      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
      const dayField = daysHeld >= 3 ? "day3" : daysHeld === 2 ? "day2" : "day1";
      const dayStatus =
        decision.action === "HOLD"
          ? "HELD"
          : decision.action === "SELL"
            ? decision.reason
            : "EXTRA_HOLD_1";
      patch[dayField + "_status"] = dayStatus;
      patch[dayField + "_price"] = st.price;

      if (decision.action === "EXTEND_HOLD") patch.extra_hold_used = true;

      if (decision.action === "SELL") {
        const pnl = netPnl(sig.entry_price, decision.exit_price, shares);
        patch.exit_reason = decision.reason;
        patch.bid_confirmed_at_exit = decision.bid_confirmed;
        patch.shadow_exit_price = decision.exit_price;
        patch.shadow_pnl = pnl;
        patch.shadow_pnl_pct = pnl / sig.position_value;
        exited++;
        if (sig.bought && !sig.sold) {
          patch.sell_signal = true;
          patch.sell_signal_reason = decision.reason;
          sellSignaled++;
          notes.push("SELL NOW " + sig.symbol + ": " + decision.reason + " @ " + decision.exit_price);
        }
      }

      await supabaseAdmin.from("scalp_dip_signals").update(patch as any).eq("id", sig.id);
      updated++;
    } catch (e: any) {
      notes.push(sig.symbol + ": shadow update error " + (e?.message ?? ""));
    }
  }
  return { updated, exited, sellSignaled, notes };
}

// ── PART 3: user actions (bought / sold) ──

/** "تم الشراء" button. actualBuyPrice defaults to the shown entry price. */
export async function markSignalBought(
  signalId: number,
  actualBuyPrice?: number,
): Promise<SignalRow | null> {
  const { data: sig } = (await supabaseAdmin
    .from("scalp_dip_signals")
    .select("*")
    .eq("id", signalId)
    .maybeSingle()) as { data: SignalRow | null };
  if (!sig) throw new Error("signal not found");
  if (sig.bought) return sig; // idempotent
  const price = actualBuyPrice && actualBuyPrice > 0 ? actualBuyPrice : sig.entry_price;
  const { data: updated } = (await supabaseAdmin
    .from("scalp_dip_signals")
    .update({
      bought: true,
      actual_buy_price: price,
      buy_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", signalId)
    .select("*")
    .maybeSingle()) as { data: SignalRow | null };

  if (updated) {
    await logDecisionEvent({
      event_type: "USER_BOUGHT",
      symbol: sig.symbol,
      trigger_price: price,
      reference_price: sig.entry_price,
      details: { gap_pct: sig.gap_pct, position_value: sig.position_value },
      user_action: "BOUGHT",
      action_ts: new Date().toISOString(),
    });
  }

  return updated;
}

/** "تم البيع" button. Computes realized PnL incl. stamp duty. */
export async function markSignalSold(
  signalId: number,
  actualSellPrice?: number,
): Promise<SignalRow | null> {
  const { data: sig } = (await supabaseAdmin
    .from("scalp_dip_signals")
    .select("*")
    .eq("id", signalId)
    .maybeSingle()) as { data: SignalRow | null };
  if (!sig) throw new Error("signal not found");
  if (sig.sold) return sig; // idempotent
  if (!sig.bought) throw new Error("cannot sell before bought");
  const buyPrice = Number(sig.actual_buy_price ?? sig.entry_price);
  const sell = actualSellPrice && actualSellPrice > 0 ? actualSellPrice : buyPrice;
  const shares = Math.max(1, Math.floor(sig.position_value / buyPrice));
  const pnl = netPnl(buyPrice, sell, shares);
  const { data: updated } = (await supabaseAdmin
    .from("scalp_dip_signals")
    .update({
      sold: true,
      actual_sell_price: sell,
      sell_timestamp: new Date().toISOString(),
      realized_pnl: pnl,
      realized_pnl_pct: pnl / sig.position_value,
      sell_signal: false,
      updated_at: new Date().toISOString(),
    })
    .eq("id", signalId)
    .select("*")
    .maybeSingle()) as { data: SignalRow | null };

  if (updated) {
    await logDecisionEvent({
      event_type: "USER_SOLD",
      symbol: sig.symbol,
      trigger_price: sell,
      reference_price: buyPrice,
      pnl_pct: pnl / sig.position_value,
      details: { realized_pnl: pnl, exit_reason: sig.exit_reason || "MANUAL_EXIT" },
      user_action: "SOLD",
      action_ts: new Date().toISOString(),
    });
  }

  return updated;
}

/** Weekly-gate variants: the manual buttons act on momentum_weekly_signals
 * (the weekly batch lives there since 2026-09-24). Same PnL cost model as the
 * weekly runner exit (MW_PARAMS.COST_RT round trip). The table is not in the
 * generated Database types yet — same escape hatch as the runner (as any). */
export async function markWeeklyBought(
  signalId: number,
  actualBuyPrice?: number,
): Promise<any | null> {
  const wdb = supabaseAdmin as any;
  const { data: sig } = await wdb
    .from("momentum_weekly_signals")
    .select("*")
    .eq("id", signalId)
    .maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.bought) return sig; // idempotent
  const price = actualBuyPrice && actualBuyPrice > 0 ? actualBuyPrice : Number(sig.last_close);
  const { data: updated, error } = await wdb
    .from("momentum_weekly_signals")
    .update({
      bought: true,
      actual_buy_price: price,
      buy_timestamp: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", signalId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (updated) {
    await logDecisionEvent({
      event_type: "USER_BOUGHT",
      symbol: sig.symbol,
      trigger_price: price,
      reference_price: sig.last_close,
      details: { position_value: sig.position_value, entry_date: sig.entry_date },
      user_action: "BOUGHT",
      action_ts: new Date().toISOString(),
    });
  }
  return updated;
}

export async function markWeeklySold(
  signalId: number,
  actualSellPrice?: number,
): Promise<any | null> {
  const wdb = supabaseAdmin as any;
  const { data: sig } = await wdb
    .from("momentum_weekly_signals")
    .select("*")
    .eq("id", signalId)
    .maybeSingle();
  if (!sig) throw new Error("signal not found");
  if (sig.sold) return sig; // idempotent
  if (!sig.bought) throw new Error("cannot sell before bought");
  const buyPrice = Number(sig.actual_buy_price ?? sig.last_close);
  const sell = actualSellPrice && actualSellPrice > 0 ? actualSellPrice : buyPrice;
  const shares = Number(sig.shares) || Math.max(1, Math.floor(Number(sig.position_value) / buyPrice));
  const gross = (sell - buyPrice) * shares;
  const costs = (buyPrice + sell) * shares * (MW_PARAMS.COST_RT / 2);
  const pnl = gross - costs;
  const { data: updated, error } = await wdb
    .from("momentum_weekly_signals")
    .update({
      sold: true,
      actual_sell_price: sell,
      sell_timestamp: new Date().toISOString(),
      realized_pnl: pnl,
      realized_pnl_pct: pnl / (Number(sig.position_value) || 1),
      exit_reason: sig.exit_reason || "MANUAL_EXIT",
      updated_at: new Date().toISOString(),
    })
    .eq("id", signalId)
    .select("*")
    .maybeSingle();
  if (error) throw new Error(error.message);

  if (updated) {
    await logDecisionEvent({
      event_type: "USER_SOLD",
      symbol: sig.symbol,
      trigger_price: sell,
      reference_price: buyPrice,
      pnl_pct: pnl / (Number(sig.position_value) || 1),
      details: { realized_pnl: pnl, exit_reason: sig.exit_reason || "MANUAL_EXIT" },
      user_action: "SOLD",
      action_ts: new Date().toISOString(),
    });
  }
  return updated;
}

/** Live EOD price for pre-filling the sell dialog (best-effort). */
export async function currentPriceFor(symbol: string): Promise<number | null> {
  const st = await liveSymbolState(symbol);
  return st?.price ?? null;
}

/** Today's scanner-synced CLOSE from daily_candles (bug fix 2026-09-22).
 * The EOD progression used to read live_ticks/marketwatch only — both empty
 * by design in the scanner-based weekly system, so dayN prices were recorded
 * stale/null. daily_candles is synced after every close by the automation. */
export async function todayCandleClose(symbol: string, dateISO: string): Promise<number | null> {
  const { data } = await (supabaseAdmin as any)
    .from("daily_candles")
    .select("close")
    .eq("symbol", symbol)
    .eq("date", dateISO)
    .maybeSingle();
  const c = Number(data?.close);
  return c > 0 ? c : null;
}
