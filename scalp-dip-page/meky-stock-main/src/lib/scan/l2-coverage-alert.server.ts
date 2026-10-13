/**
 * Real-time L2 coverage alert.
 * Called fire-and-forget from paper-scalp after a trade is inserted.
 * If the symbol has NO orderbook_snapshot in the last 60s, sends a Telegram
 * alert asking the user to open a Thunder L2 tab on that symbol.
 *
 * Never throws — safe to call without awaiting.
 */

import { supabaseAdmin } from "@/integrations/supabase/client.server";

// In-memory dedup so we don't spam the same symbol every minute.
const lastAlertAt = new Map<string, number>();
const DEDUP_MS = 5 * 60_000; // one alert per symbol per 5 min

export interface CoverageResult {
  symbol: string;
  snapshots_last_60s: number;
  alerted: boolean;
  reason: string;
  dedup_hit?: boolean;
}

export async function checkL2CoverageAndAlert(
  symbol: string,
  opts: { dry?: boolean; windowSec?: number } = {},
): Promise<CoverageResult> {
  const windowSec = opts.windowSec ?? 60;
  const dry = opts.dry === true;
  try {
    const since = new Date(Date.now() - windowSec * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("orderbook_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("symbol", symbol)
      .gte("ts", since);

    const n = count ?? 0;
    if (n > 0) {
      return { symbol, snapshots_last_60s: n, alerted: false, reason: "covered" };
    }

    const now = Date.now();
    const last = lastAlertAt.get(symbol) ?? 0;
    if (now - last < DEDUP_MS) {
      return { symbol, snapshots_last_60s: 0, alerted: false, reason: "dedup", dedup_hit: true };
    }

    if (!dry) {
      lastAlertAt.set(symbol, now);
      try {
        const { sendTelegram } = await import("@/lib/notifications/telegram.server");
        await sendTelegram(
          `<b>🚨 افتح L2 على <code>${symbol}</code> دلوقتي</b>\n\n` +
          `فيه إشارة scalp لسه فتحت على السهم ده، بس مفيش L2 snapshot في آخر ${windowSec} ثانية.\n` +
          `افتح تاب Thunder على <b>${symbol}</b> فورًا عشان الصفقات الجاية تتفتح بأمان.`,
        );
      } catch { /* swallow */ }
    }
    return { symbol, snapshots_last_60s: 0, alerted: !dry, reason: "no_recent_snapshot" };
  } catch (e) {
    return { symbol, snapshots_last_60s: 0, alerted: false, reason: `error:${(e as Error).message?.slice(0, 80)}` };
  }
}
