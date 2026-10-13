import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type EarningsStatus = {
  hasUpcomingEarnings: boolean;
  daysUntilEarnings: number | null;
  shouldAvoid: boolean;
  reason: string;
};

export async function checkEarningsProximity(symbol: string): Promise<EarningsStatus> {
  const { data } = await supabaseAdmin
    .from('fundamentals')
    .select('next_earnings_date')
    .eq('symbol', symbol)
    .order('as_of', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.next_earnings_date) {
    return { hasUpcomingEarnings: false, daysUntilEarnings: null, shouldAvoid: false, reason: 'no data' };
  }
  const earningsDate = new Date(data.next_earnings_date);
  const today = new Date();
  const days = Math.ceil((earningsDate.getTime() - today.getTime()) / 86400000);
  if (days < 0 || days > 60) return { hasUpcomingEarnings: false, daysUntilEarnings: days, shouldAvoid: false, reason: 'no near earnings' };
  const shouldAvoid = days <= 5 && days >= 0;
  return {
    hasUpcomingEarnings: true,
    daysUntilEarnings: days,
    shouldAvoid,
    reason: shouldAvoid ? `earnings in ${days} days` : `earnings in ${days} days (safe)`
  };
}
