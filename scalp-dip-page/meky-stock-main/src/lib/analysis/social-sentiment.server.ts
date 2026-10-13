// Social sentiment placeholder (extensible via real Twitter/X API)
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export type SocialSentiment = {
  symbol: string;
  buzzScore: number;        // 0-100 mentions volume
  sentimentScore: number;   // -1..1
  confidenceDelta: number;
};

// Heuristic: derive from existing news_sentiment buzz
export async function getSocialSentiment(symbol: string): Promise<SocialSentiment> {
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data } = await supabaseAdmin
    .from('news_sentiment')
    .select('sentiment, sentiment_score, published_at')
    .eq('symbol', symbol)
    .gte('published_at', since);
  if (!data || data.length === 0) {
    return { symbol, buzzScore: 0, sentimentScore: 0, confidenceDelta: 0 };
  }
  const buzz = Math.min(100, data.length * 10);
  const avg = data.reduce((s, x) => s + (x.sentiment_score || 0), 0) / data.length;
  const delta = avg * (buzz / 100) * 5;
  return { symbol, buzzScore: buzz, sentimentScore: +avg.toFixed(3), confidenceDelta: +delta.toFixed(2) };
}
