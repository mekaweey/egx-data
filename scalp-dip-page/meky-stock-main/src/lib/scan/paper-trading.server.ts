// Paper trading: simulate execution without real money
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type PaperTrade = {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  shares: number;
  stopLoss: number;
  target: number;
  recoId: string;
};

// Paper trades are tracked through learning_labels + recommendations.outcome
// This module exposes a convenience snapshot for the UI.
export async function getPaperPortfolioSnapshot(): Promise<{
  openPositions: number;
  closedPositions: number;
  totalPnLPct: number;
  winRate: number;
  bestTrade: number;
  worstTrade: number;
}> {
  const { data: open } = await supabaseAdmin
    .from('recommendations')
    .select('id')
    .eq('outcome', 'pending');
  const { data: closed } = await supabaseAdmin
    .from('recommendations')
    .select('realized_pct, outcome')
    .neq('outcome', 'pending')
    .not('realized_pct', 'is', null);
  const closedItems = closed || [];
  const total = closedItems.reduce((s, x) => s + Number(x.realized_pct || 0), 0);
  const wins = closedItems.filter(x => Number(x.realized_pct) > 0).length;
  const winRate = closedItems.length > 0 ? wins / closedItems.length : 0;
  const returns = closedItems.map(x => Number(x.realized_pct || 0));
  return {
    openPositions: open?.length || 0,
    closedPositions: closedItems.length,
    totalPnLPct: +total.toFixed(2),
    winRate: +winRate.toFixed(3),
    bestTrade: returns.length > 0 ? +Math.max(...returns).toFixed(2) : 0,
    worstTrade: returns.length > 0 ? +Math.min(...returns).toFixed(2) : 0
  };
}
