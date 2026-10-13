import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type InvestmentNews = {
  headline: string;
  sentiment: string;
  sentiment_score: number;
  impact_level: string;
  summary_ar: string | null;
  source_name: string | null;
  source_url: string | null;
  published_at: string | null;
};

export type InvestmentPick = {
  symbol: string;
  name_ar: string;
  sector_ar: string | null;
  close: number;
  change_pct: number | null;
  // Monthly horizon plan
  buy_from: string; // ISO date
  buy_to: string; // ISO date (recommended entry window end)
  hold_until: string; // ISO date (target exit)
  entry_min: number;
  entry_max: number;
  target: number;
  stop_loss: number;
  expected_gain_pct: number;
  // Scoring breakdown (0-100)
  investment_score: number;
  technical_score: number | null;
  fundamental_score: number | null;
  sentiment_score: number | null;
  macro_score: number | null;
  sector_score: number | null;
  // Fundamentals snapshot
  pe_ratio: number | null;
  roe: number | null;
  dividend_yield: number | null;
  revenue_growth_yoy: number | null;
  next_earnings_date: string | null;
  // Catalysts
  positive_news_count: number;
  negative_news_count: number;
  high_impact_news_count: number;
  recent_news: InvestmentNews[];
  thesis_ar: string;
};

export type InvestmentPayload = {
  generatedAt: string;
  scanFinishedAt: string | null;
  horizonDays: number;
  picks: InvestmentPick[];
  watchlist: InvestmentPick[];
};

function addDays(d: Date, days: number): string {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x.toISOString().slice(0, 10);
}

export const getInvestmentOpportunities = createServerFn({ method: "GET" }).handler(
  async (): Promise<InvestmentPayload> => {
    const horizonDays = 30;
    const today = new Date();

    // Latest completed scan
    const { data: scan } = await supabaseAdmin
      .from("scans")
      .select("id, finished_at")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!scan) {
      return {
        generatedAt: today.toISOString(),
        scanFinishedAt: null,
        horizonDays,
        picks: [],
        watchlist: [],
      };
    }

    const [{ data: snaps }, { data: recos }, { data: stocks }] = await Promise.all([
      supabaseAdmin
        .from("stock_snapshots")
        .select(
          "symbol, close, change_pct, rsi14, ema21, sma50, vol_ratio, atr14, composite_score",
        )
        .eq("scan_id", scan.id),
      supabaseAdmin
        .from("recommendations")
        .select(
          "symbol, signal, confidence, technical_score, fundamental_score, sentiment_score, macro_score, sector_score, target, stop_loss, entry_min, entry_max, expected_gain_pct",
        )
        .eq("scan_id", scan.id),
      supabaseAdmin.from("stocks").select("symbol, name_ar, sector_ar").eq("is_active", true),
    ]);

    const stockMap = new Map((stocks ?? []).map((s) => [s.symbol, s]));
    const recoMap = new Map((recos ?? []).map((r) => [r.symbol, r]));

    const symbols = (snaps ?? []).map((s) => s.symbol);
    if (symbols.length === 0) {
      return {
        generatedAt: today.toISOString(),
        scanFinishedAt: scan.finished_at,
        horizonDays,
        picks: [],
        watchlist: [],
      };
    }

    // Latest fundamentals per symbol
    const { data: fundsRaw } = await supabaseAdmin
      .from("fundamentals")
      .select(
        "symbol, as_of, pe_ratio, roe, dividend_yield, revenue_growth_yoy, debt_to_equity, next_earnings_date",
      )
      .in("symbol", symbols)
      .order("as_of", { ascending: false });
    const fundMap = new Map<string, NonNullable<typeof fundsRaw>[number]>();
    for (const f of fundsRaw ?? []) if (!fundMap.has(f.symbol)) fundMap.set(f.symbol, f);

    // News from last 14 days
    const newsSince = new Date();
    newsSince.setDate(newsSince.getDate() - 14);
    const { data: newsRaw } = await supabaseAdmin
      .from("news_sentiment")
      .select(
        "symbol, headline, sentiment, sentiment_score, impact_level, summary_ar, source_name, source_url, published_at, created_at",
      )
      .in("symbol", symbols)
      .gte("created_at", newsSince.toISOString())
      .order("created_at", { ascending: false });

    const newsBySymbol = new Map<string, InvestmentNews[]>();
    for (const n of newsRaw ?? []) {
      const arr = newsBySymbol.get(n.symbol) ?? [];
      arr.push({
        headline: n.headline,
        sentiment: n.sentiment,
        sentiment_score: Number(n.sentiment_score ?? 0),
        impact_level: n.impact_level,
        summary_ar: n.summary_ar,
        source_name: n.source_name,
        source_url: n.source_url,
        published_at: n.published_at,
      });
      newsBySymbol.set(n.symbol, arr);
    }

    type Scored = InvestmentPick & { _rank: number };
    const scored: Scored[] = [];

    for (const s of snaps ?? []) {
      const meta = stockMap.get(s.symbol);
      if (!meta) continue;
      const r = recoMap.get(s.symbol);
      const f = fundMap.get(s.symbol);
      const news = newsBySymbol.get(s.symbol) ?? [];

      const close = Number(s.close);
      const ema21 = s.ema21 != null ? Number(s.ema21) : null;
      const sma50 = s.sma50 != null ? Number(s.sma50) : null;
      const rsi = s.rsi14 != null ? Number(s.rsi14) : null;
      const atr = s.atr14 != null ? Number(s.atr14) : close * 0.03;

      // ---- Monthly-horizon technical filter (trend > momentum) ----
      // Must be in an uptrend: close above EMA21 AND EMA21 above SMA50.
      const uptrend = ema21 != null && sma50 != null && close > ema21 && ema21 > sma50;
      // RSI healthy: not overbought (>72) and not deeply oversold (<35)
      const healthyRsi = rsi == null || (rsi >= 40 && rsi <= 70);
      if (!uptrend || !healthyRsi) continue;

      // ---- Scoring (0-100) ----
      const tech = r?.technical_score != null ? Number(r.technical_score) : 60;
      const fund = r?.fundamental_score != null ? Number(r.fundamental_score) : 50;
      const sent = r?.sentiment_score != null ? Number(r.sentiment_score) : 50;
      const macro = r?.macro_score != null ? Number(r.macro_score) : 50;
      const sector = r?.sector_score != null ? Number(r.sector_score) : 50;

      // News tally
      const positive = news.filter((n) => n.sentiment === "positive").length;
      const negative = news.filter((n) => n.sentiment === "negative").length;
      const highImpact = news.filter((n) => n.impact_level === "high").length;
      const newsBoost =
        Math.min(15, positive * 4 + highImpact * 3) - Math.min(20, negative * 6);

      // Earnings within horizon = catalyst boost
      let earningsBoost = 0;
      if (f?.next_earnings_date) {
        const days = Math.round(
          (new Date(f.next_earnings_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (days > 2 && days <= horizonDays) earningsBoost = 6;
      }

      // Weighted for MONTHLY horizon: fundamentals & sentiment matter more than for day trades
      const baseScore =
        tech * 0.25 + fund * 0.3 + sent * 0.2 + macro * 0.1 + sector * 0.15;
      const investmentScore = Math.max(0, Math.min(100, baseScore + newsBoost + earningsBoost));

      // Reject if too many bad news
      if (negative >= 2) continue;
      // Require minimum quality
      if (investmentScore < 55) continue;

      // ---- Entry / target / stop for ~30-day swing ----
      // Entry zone: today's close down to close - 0.5*ATR (buy on small dip)
      const entryMin = Number((close - 0.5 * atr).toFixed(2));
      const entryMax = Number((close + 0.2 * atr).toFixed(2));
      // Target: 2.5x ATR upside (≈ 6-12% on typical EGX names) or recommendation target if higher
      const atrTarget = Number((close + 2.5 * atr).toFixed(2));
      const target = r?.target != null ? Math.max(atrTarget, Number(r.target)) : atrTarget;
      // Stop: 1.5x ATR below close (≈ 4-7%)
      const atrStop = Number((close - 1.5 * atr).toFixed(2));
      const stopLoss = r?.stop_loss != null ? Math.min(atrStop, Number(r.stop_loss)) : atrStop;
      const expectedGain = Number((((target - close) / close) * 100).toFixed(2));

      // Build thesis text
      const reasons: string[] = [];
      if (uptrend) reasons.push("اتجاه صاعد قوي (السعر فوق EMA21 وSMA50)");
      if (positive >= 1) reasons.push(`${positive} خبر إيجابي حديث`);
      if (earningsBoost > 0) reasons.push("نتائج مالية قريبة خلال الشهر");
      if (fund >= 65) reasons.push("أساسيات الشركة قوية");
      if (sector >= 65) reasons.push("قطاع نشِط");
      if (f?.dividend_yield != null && Number(f.dividend_yield) > 5)
        reasons.push(`توزيع أرباح ${Number(f.dividend_yield).toFixed(1)}%`);
      const thesis = reasons.length
        ? reasons.join(" • ")
        : "تجمع عوامل فنية وأساسية إيجابية للمدى المتوسط";

      scored.push({
        _rank: investmentScore,
        symbol: s.symbol,
        name_ar: meta.name_ar,
        sector_ar: meta.sector_ar ?? null,
        close,
        change_pct: s.change_pct != null ? Number(s.change_pct) : null,
        buy_from: addDays(today, 0),
        buy_to: addDays(today, 5),
        hold_until: addDays(today, horizonDays),
        entry_min: entryMin,
        entry_max: entryMax,
        target,
        stop_loss: stopLoss,
        expected_gain_pct: expectedGain,
        investment_score: Number(investmentScore.toFixed(1)),
        technical_score: tech,
        fundamental_score: fund,
        sentiment_score: sent,
        macro_score: macro,
        sector_score: sector,
        pe_ratio: f?.pe_ratio != null ? Number(f.pe_ratio) : null,
        roe: f?.roe != null ? Number(f.roe) : null,
        dividend_yield: f?.dividend_yield != null ? Number(f.dividend_yield) : null,
        revenue_growth_yoy:
          f?.revenue_growth_yoy != null ? Number(f.revenue_growth_yoy) : null,
        next_earnings_date: f?.next_earnings_date ?? null,
        positive_news_count: positive,
        negative_news_count: negative,
        high_impact_news_count: highImpact,
        recent_news: news.slice(0, 5),
        thesis_ar: thesis,
      });
    }

    scored.sort((a, b) => b._rank - a._rank);
    const picks = scored.slice(0, 5).map(({ _rank, ...p }) => p);
    const watchlist = scored.slice(5, 15).map(({ _rank, ...p }) => p);

    return {
      generatedAt: today.toISOString(),
      scanFinishedAt: scan.finished_at,
      horizonDays,
      picks,
      watchlist,
    };
  },
);