/**
 * Event Awareness — gate or dampen picks when an earnings event is
 * imminent. Reads from `fundamentals.next_earnings_date` and applies a
 * confidence multiplier based on how close the event is.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const cache = new Map<string, { date: string | null; fetchedAt: number }>();
const TTL = 6 * 3600 * 1000;

export async function nextEarningsDate(symbol: string): Promise<string | null> {
  const hit = cache.get(symbol);
  if (hit && Date.now() - hit.fetchedAt < TTL) return hit.date;
  const { data } = await supabaseAdmin
    .from("fundamentals")
    .select("next_earnings_date")
    .eq("symbol", symbol)
    .order("as_of", { ascending: false })
    .limit(1);
  const date = data?.[0]?.next_earnings_date ?? null;
  cache.set(symbol, { date, fetchedAt: Date.now() });
  return date;
}

/** Returns multiplier ∈ [0.6,1]: closer to earnings → lower trust. */
export function earningsMultiplier(daysUntil: number | null): number {
  if (daysUntil == null) return 1;
  if (daysUntil <= 1) return 0.6;
  if (daysUntil <= 3) return 0.75;
  if (daysUntil <= 7) return 0.9;
  return 1;
}

export function daysBetween(from: Date, isoDate: string): number {
  const d = new Date(isoDate);
  return Math.round((d.getTime() - from.getTime()) / 86_400_000);
}
