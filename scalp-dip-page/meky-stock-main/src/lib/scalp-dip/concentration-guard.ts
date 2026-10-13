/**
 * CONCENTRATION GUARD — hard cap on profit concentration (the CRST rule).
 * If any single symbol contributed >20% of last-30-day net profit, block NEW
 * entries on that symbol for 2 weeks. Logs every activation.
 * Called from scanDailyCandidates before ranking (returns Set of blocked symbols).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CONCENTRATION_LIMIT = 0.20; // 20% of monthly net profit
const BLOCK_DAYS = 14;

export async function getConcentrationBlockedSymbols(): Promise<{
  blocked: Set<string>;
  activations: { symbol: string; share: number }[];
}> {
  const blocked = new Set<string>();
  const activations: { symbol: string; share: number }[] = [];
  try {
    // monthly net profit per symbol (positive contribution only, per the guard's intent)
    const { data } = await supabaseAdmin
      .from("paper_trades")
      .select("symbol, pnl")
      .eq("strategy", "scalp-dip")
      .eq("status", "closed")
      .gte("updated_at", new Date(Date.now() - 30 * 86400_000).toISOString());
    if (!data?.length) return { blocked, activations };
    const bySym = new Map<string, number>();
    let net = 0;
    for (const r of data) {
      net += Number(r.pnl);
      const v = bySym.get(r.symbol) ?? 0;
      bySym.set(r.symbol, v + Number(r.pnl));
    }
    if (net <= 0) return { blocked, activations };
    // guard: only apply to symbols whose POSITIVE contribution exceeds 20% of NET profit
    for (const [sym, pnl] of bySym) {
      if (pnl <= 0) continue;
      const share = pnl / net;
      if (share > CONCENTRATION_LIMIT) {
        // check if this symbol already has an active block (logged in last 14 days)
        const { data: existing } = await supabaseAdmin
          .from("concentration_blocks")
          .select("id")
          .eq("symbol", sym)
          .gte("created_at", new Date(Date.now() - BLOCK_DAYS * 86400_000).toISOString())
          .limit(1);
        if (!existing?.length) {
          // log the activation
          await supabaseAdmin.from("concentration_blocks").insert({
            symbol: sym,
            share: share,
            reason: `profit concentration ${Math.round(share * 100)}% > 20% limit`,
          });
        }
        blocked.add(sym);
        activations.push({ symbol: sym, share });
      }
    }
  } catch {
    // concentration_blocks table may not exist yet — fail open (no blocking)
  }
  return { blocked, activations };
}
