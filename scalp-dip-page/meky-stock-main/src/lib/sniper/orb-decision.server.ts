import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getTicksBetween } from "@/lib/live/live-quote.server";
import { getCairoNow } from "@/lib/market-hours";

export type ORBDecision = {
  decision: "BUY" | "SKIP" | "BUY_LIGHT";
  positionPct: number;
  confidence: number; // 0..100
  orbHigh: number | null;
  orbLow: number | null;
  currentPrice: number | null;
  rangePct: number | null;
  reason: string;
};

/** Build ISO timestamp from a Cairo wall-clock today + HH:MM. */
function cairoTodayAt(h: number, m: number): string {
  const c = getCairoNow();
  c.setUTCHours(h, m, 0, 0); // c uses UTC getters as Cairo wall-clock
  // Convert back to real UTC by subtracting Cairo offset (Egypt observes DST: +2 or +3).
  const realNow = new Date();
  const fakeNow = getCairoNow(realNow);
  const offsetMs = fakeNow.getTime() - realNow.getTime();
  return new Date(c.getTime() - offsetMs).toISOString();
}

/**
 * ORB = Opening Range Breakout. Window: 10:00 → 10:30 Cairo. Decision at 10:30.
 *   currentPrice > orbHigh + 1%  → BUY (70%)
 *   currentPrice < orbLow  - 1%  → SKIP
 *   otherwise                    → BUY_LIGHT (30%)
 */
export async function decideORB(symbol: string): Promise<ORBDecision> {
  const from = cairoTodayAt(10, 0);
  const to = cairoTodayAt(10, 30);
  const ticks = await getTicksBetween(symbol, from, to);

  if (ticks.length < 2) {
    return {
      decision: "SKIP", positionPct: 0, confidence: 0,
      orbHigh: null, orbLow: null, currentPrice: null, rangePct: null,
      reason: "بيانات غير كافية في نافذة ORB",
    };
  }

  const prices = ticks.map((t) => t.price);
  const orbHigh = Math.max(...prices);
  const orbLow = Math.min(...prices);
  const current = prices[prices.length - 1];
  const rangePct = ((orbHigh - orbLow) / orbLow) * 100;

  // Get last close (prev day) for breakout threshold
  const { data: pick } = await supabaseAdmin
    .from("sniper_picks").select("prev_close").eq("symbol", symbol)
    .order("pick_date", { ascending: false }).limit(1);
  const prevClose = pick?.[0]?.prev_close ? +pick[0].prev_close : orbLow;

  const movePct = ((current - prevClose) / prevClose) * 100;

  if (movePct >= 1 && current >= orbHigh * 0.999) {
    return {
      decision: "BUY", positionPct: 70,
      confidence: Math.min(95, 70 + movePct * 3),
      orbHigh, orbLow, currentPrice: current, rangePct,
      reason: `breakout +${movePct.toFixed(2)}% فوق opening range`,
    };
  }
  if (movePct <= -1) {
    return {
      decision: "SKIP", positionPct: 0,
      confidence: Math.min(95, 70 + Math.abs(movePct) * 3),
      orbHigh, orbLow, currentPrice: current, rangePct,
      reason: `هبوط ${movePct.toFixed(2)}% → الإشارة ضعيفة`,
    };
  }
  return {
    decision: "BUY_LIGHT", positionPct: 30, confidence: 55,
    orbHigh, orbLow, currentPrice: current, rangePct,
    reason: `حركة هادئة (${movePct.toFixed(2)}%) — دخول مخفّض`,
  };
}