import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Sentiment Velocity — rate of change of sentiment over the last 3 days.
 * Transitions matter more than absolute levels (improving → strong buy bias).
 *
 * Returns:
 *  - velocity in [-1, +1] (positive = improving, negative = deteriorating)
 *  - confidenceDelta in [-8, +8] applied to picks
 */

export type SentimentVelocity = {
  symbol: string;
  velocity: number;
  trend: "improving" | "deteriorating" | "stable";
  label_ar: string;
  confidenceDelta: number;
  sampleSize: number;
};

const NEUTRAL: Omit<SentimentVelocity, "symbol"> = {
  velocity: 0,
  trend: "stable",
  label_ar: "المشاعر مستقرة",
  confidenceDelta: 0,
  sampleSize: 0,
};

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export async function loadSentimentVelocity(symbols: string[]): Promise<Map<string, SentimentVelocity>> {
  const out = new Map<string, SentimentVelocity>();
  if (symbols.length === 0) return out;

  const { data } = await supabaseAdmin
    .from("news_sentiment")
    .select("symbol, sentiment_score, published_at, created_at")
    .in("symbol", symbols)
    .gte("created_at", isoDaysAgo(5))
    .order("created_at", { ascending: true });

  const bySymbol = new Map<string, Array<{ t: number; s: number }>>();
  for (const r of data ?? []) {
    const t = new Date((r.published_at ?? r.created_at) as string).getTime();
    const s = Number(r.sentiment_score);
    if (!isFinite(t) || !isFinite(s)) continue;
    const arr = bySymbol.get(r.symbol) ?? [];
    arr.push({ t, s });
    bySymbol.set(r.symbol, arr);
  }

  for (const sym of symbols) {
    const pts = bySymbol.get(sym);
    if (!pts || pts.length < 2) {
      out.set(sym, { symbol: sym, ...NEUTRAL });
      continue;
    }
    // Linear regression slope of sentiment over time (normalised)
    const n = pts.length;
    const tMin = pts[0].t;
    const xs = pts.map((p) => (p.t - tMin) / (1000 * 60 * 60 * 24)); // days
    const ys = pts.map((p) => p.s);
    const mx = xs.reduce((a, b) => a + b, 0) / n;
    const my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((acc, x, i) => acc + (x - mx) * (ys[i] - my), 0);
    const den = xs.reduce((acc, x) => acc + (x - mx) ** 2, 0);
    const slope = den === 0 ? 0 : num / den; // sentiment per day
    const velocity = Math.max(-1, Math.min(1, slope * 2));
    const trend: SentimentVelocity["trend"] =
      velocity > 0.15 ? "improving" : velocity < -0.15 ? "deteriorating" : "stable";
    const label_ar =
      trend === "improving" ? "مشاعر متحسنة بسرعة" : trend === "deteriorating" ? "مشاعر متدهورة" : "مشاعر مستقرة";
    out.set(sym, {
      symbol: sym,
      velocity: +velocity.toFixed(3),
      trend,
      label_ar,
      confidenceDelta: Math.round(velocity * 8),
      sampleSize: n,
    });
  }

  return out;
}