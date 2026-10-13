import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Earnings Surprise History.
 *
 * Computes a "surprise streak score" per symbol from past fundamentals
 * snapshots. Companies that consistently beat estimates tend to continue.
 *
 * Proxy (since we don't store analyst estimates): use sequential EPS
 * growth. 3 consecutive quarters of accelerating growth = positive bias.
 */

export type EarningsSurprise = {
  symbol: string;
  streak: number; // -3..+3
  label_ar: string;
  confidenceDelta: number;
};

export async function loadEarningsSurprise(symbols: string[]): Promise<Map<string, EarningsSurprise>> {
  const out = new Map<string, EarningsSurprise>();
  if (symbols.length === 0) return out;

  const { data } = await supabaseAdmin
    .from("fundamentals")
    .select("symbol, as_of, earnings_per_share")
    .in("symbol", symbols)
    .not("earnings_per_share", "is", null)
    .order("as_of", { ascending: false })
    .limit(symbols.length * 6);

  const bySymbol = new Map<string, number[]>();
  for (const r of data ?? []) {
    const arr = bySymbol.get(r.symbol) ?? [];
    if (arr.length < 4) arr.push(Number(r.earnings_per_share));
    bySymbol.set(r.symbol, arr);
  }

  for (const sym of symbols) {
    const eps = bySymbol.get(sym);
    if (!eps || eps.length < 2) {
      out.set(sym, { symbol: sym, streak: 0, label_ar: "", confidenceDelta: 0 });
      continue;
    }
    let streak = 0;
    for (let i = 0; i < eps.length - 1; i++) {
      const cur = eps[i];
      const prev = eps[i + 1];
      if (prev === 0) break;
      const growth = (cur - prev) / Math.abs(prev);
      if (growth > 0.05) streak += 1;
      else if (growth < -0.05) streak -= 1;
      else break;
    }
    streak = Math.max(-3, Math.min(3, streak));
    const label =
      streak >= 2 ? `نمو أرباح متسارع ${streak} فترات متتالية` :
      streak <= -2 ? `تراجع أرباح متتالي ${Math.abs(streak)} فترات` : "";
    out.set(sym, {
      symbol: sym,
      streak,
      label_ar: label,
      confidenceDelta: streak * 3,
    });
  }

  return out;
}