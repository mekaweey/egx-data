import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type EconomicEvent = { name: string; date: string; impact: 'low' | 'medium' | 'high'; affectedSymbols?: string[] };

export async function getRecentMacroContext() {
  const { data } = await supabaseAdmin
    .from('macro_indicators')
    .select('*')
    .order('as_of', { ascending: false })
    .limit(2);
  if (!data || data.length === 0) return null;
  const latest = data[0];
  const prev = data[1];
  const usdEgpChange = prev?.usd_egp && latest.usd_egp ? ((Number(latest.usd_egp) - Number(prev.usd_egp)) / Number(prev.usd_egp)) * 100 : 0;
  const oilChange = prev?.brent_oil_usd && latest.brent_oil_usd ? ((Number(latest.brent_oil_usd) - Number(prev.brent_oil_usd)) / Number(prev.brent_oil_usd)) * 100 : 0;
  const goldChange = prev?.gold_usd && latest.gold_usd ? ((Number(latest.gold_usd) - Number(prev.gold_usd)) / Number(prev.gold_usd)) * 100 : 0;
  return {
    usdEgp: latest.usd_egp,
    usdEgpChangePct: +usdEgpChange.toFixed(2),
    oilUsd: latest.brent_oil_usd,
    oilChangePct: +oilChange.toFixed(2),
    goldUsd: latest.gold_usd,
    goldChangePct: +goldChange.toFixed(2),
    cbeRate: latest.cbe_interest_rate,
    inflation: latest.inflation_yoy
  };
}

export function geopoliticalRiskScore(macroContext: ReturnType<typeof getRecentMacroContext> extends Promise<infer T> ? T : null): number {
  if (!macroContext) return 50;
  let risk = 50;
  if (Math.abs(macroContext.usdEgpChangePct) > 2) risk += 15;
  if (Math.abs(macroContext.oilChangePct) > 5) risk += 10;
  if (Math.abs(macroContext.goldChangePct) > 3) risk += 10;
  if (macroContext.inflation && macroContext.inflation > 25) risk += 10;
  return Math.min(100, risk);
}
