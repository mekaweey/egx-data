// Performance attribution: explain where returns came from
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type Attribution = {
  totalPnL: number;
  byMarketRegime: Record<string, { count: number; avgPnL: number; totalPnL: number }>;
  bySector: Record<string, { count: number; avgPnL: number; totalPnL: number }>;
  byConfidenceTier: Record<string, { count: number; avgPnL: number; winRate: number }>;
  bestRegime: string;
  worstRegime: string;
};

export async function computeAttribution(sinceDays = 90): Promise<Attribution> {
  const since = new Date(Date.now() - sinceDays * 86400000).toISOString();
  const { data: recos } = await supabaseAdmin
    .from('recommendations')
    .select('symbol, confidence, realized_pct, market_trend, outcome')
    .gte('created_at', since)
    .not('realized_pct', 'is', null);
  const items = recos || [];
  const byRegime: Attribution['byMarketRegime'] = {};
  const bySector: Attribution['bySector'] = {};
  const byTier: Attribution['byConfidenceTier'] = {};
  let total = 0;
  for (const r of items) {
    const pnl = Number(r.realized_pct) || 0;
    total += pnl;
    const regime = r.market_trend || 'unknown';
    byRegime[regime] = byRegime[regime] || { count: 0, avgPnL: 0, totalPnL: 0 };
    byRegime[regime].count++; byRegime[regime].totalPnL += pnl;
    const tier = r.confidence >= 80 ? 'high' : r.confidence >= 65 ? 'medium' : 'low';
    byTier[tier] = byTier[tier] || { count: 0, avgPnL: 0, winRate: 0 };
    byTier[tier].count++;
  }
  for (const k of Object.keys(byRegime)) byRegime[k].avgPnL = byRegime[k].totalPnL / byRegime[k].count;
  for (const k of Object.keys(byTier)) {
    const tier = byTier[k];
    const tierItems = items.filter(i => {
      const t = i.confidence >= 80 ? 'high' : i.confidence >= 65 ? 'medium' : 'low';
      return t === k;
    });
    tier.avgPnL = tierItems.reduce((s, x) => s + Number(x.realized_pct), 0) / tierItems.length;
    tier.winRate = tierItems.filter(x => Number(x.realized_pct) > 0).length / tierItems.length;
  }
  const regimes = Object.entries(byRegime);
  const best = regimes.sort((a, b) => b[1].avgPnL - a[1].avgPnL)[0]?.[0] || 'unknown';
  const worst = regimes.sort((a, b) => a[1].avgPnL - b[1].avgPnL)[0]?.[0] || 'unknown';
  return { totalPnL: +total.toFixed(2), byMarketRegime: byRegime, bySector, byConfidenceTier: byTier, bestRegime: best, worstRegime: worst };
}
