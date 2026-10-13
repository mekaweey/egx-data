import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Builds a compact "system state" snapshot the AI bot can reason about.
 * Pulls only the most recent / most relevant rows to keep tokens low.
 */
export async function buildBotContext(opts?: { symbol?: string }) {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const today = new Date().toISOString().slice(0, 10);

  const [picksRes, recsRes, positionsRes, newsRes, alertsRes, marketRes, weekRecsRes, symbolSnapRes] = await Promise.all([
    supabaseAdmin
      .from("daily_picks")
      .select("symbol, name_ar, confidence, entry_price, target_price, stop_price, target_pct, status, pnl_pct, pick_date")
      .gte("pick_date", today)
      .order("confidence", { ascending: false })
      .limit(8),
    supabaseAdmin
      .from("recommendations")
      .select("symbol, signal, confidence, expected_next_day_pct, entry_min, entry_max, target, stop_loss, created_at")
      .gte("created_at", since24h)
      .in("signal", ["buy", "strong_buy"])
      .eq("rejected_by_rules", false)
      .order("confidence", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("positions")
      .select("symbol, entry_price, current_price, pnl_pct, target_price, stop_loss, entry_date, status")
      .eq("status", "open")
      .limit(20),
    supabaseAdmin
      .from("news_sentiment")
      .select("symbol, headline, sentiment, sentiment_score, published_at")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(10),
    supabaseAdmin
      .from("sell_alerts")
      .select("symbol, alert_type, message_ar, created_at")
      .gte("created_at", since24h)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("market_snapshots")
      .select("index_symbol, close, change_pct, change_5d_pct, trend, date")
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabaseAdmin
      .from("recommendations")
      .select("symbol, outcome, realized_pct")
      .gte("created_at", since7d)
      .eq("rejected_by_rules", false)
      .neq("outcome", "pending")
      .not("realized_pct", "is", null)
      .limit(200),
    opts?.symbol
      ? supabaseAdmin
          .from("stock_snapshots")
          .select("symbol, close, change_pct, rsi14, macd_hist, vol_ratio, support, resistance, ts")
          .eq("symbol", opts.symbol)
          .order("ts", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const weekRecs = (weekRecsRes.data ?? []) as Array<{ realized_pct: number | null }>;
  const weekTotal = weekRecs.length;
  const weekWins = weekRecs.filter((r) => (r.realized_pct ?? 0) > 0).length;
  const weekAvg = weekTotal
    ? weekRecs.reduce((s, r) => s + Number(r.realized_pct ?? 0), 0) / weekTotal
    : 0;

  return {
    today,
    market: marketRes.data,
    picks: picksRes.data ?? [],
    recommendations: recsRes.data ?? [],
    positions: positionsRes.data ?? [],
    news: newsRes.data ?? [],
    alerts: alertsRes.data ?? [],
    weekStats: { total: weekTotal, wins: weekWins, avgReturnPct: Number(weekAvg.toFixed(2)) },
    symbolSnapshot: symbolSnapRes.data,
  };
}

/** Extracts an Arabic / English symbol from a free-form message, if mentioned. */
export async function detectMentionedSymbol(text: string): Promise<string | null> {
  const upper = text.toUpperCase();
  const match = upper.match(/\b[A-Z]{2,6}\b/);
  if (match) {
    const { data } = await supabaseAdmin
      .from("stocks")
      .select("symbol")
      .eq("symbol", match[0])
      .maybeSingle();
    if (data) return data.symbol;
  }
  // Try Arabic name match
  const { data: stocks } = await supabaseAdmin
    .from("stocks")
    .select("symbol, name_ar")
    .limit(500);
  if (!stocks) return null;
  for (const s of stocks as Array<{ symbol: string; name_ar: string | null }>) {
    if (s.name_ar && text.includes(s.name_ar.split(" ")[0])) return s.symbol;
  }
  return null;
}