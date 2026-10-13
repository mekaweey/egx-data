import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

export type StockNewsItem = {
  id: string;
  headline: string;
  summary_ar: string | null;
  source_url: string | null;
  source_name: string | null;
  published_at: string | null;
  sentiment: "positive" | "negative" | "neutral";
  sentiment_score: number;
  impact_level: "high" | "medium" | "low";
};

export type StockNewsPayload = {
  items: StockNewsItem[];
  avgScore: number | null;
  posCount: number;
  negCount: number;
  neuCount: number;
};

export const getStockNews = createServerFn({ method: "POST" })
  .inputValidator((data: { symbol: string }) =>
    z.object({ symbol: z.string().min(1).max(20).regex(/^[A-Za-z0-9._-]+$/) }).parse(data),
  )
  .handler(async ({ data }): Promise<StockNewsPayload> => {
    const { data: rows, error } = await supabaseAdmin
      .from("news_sentiment")
      .select("id, headline, summary_ar, source_url, source_name, published_at, sentiment, sentiment_score, impact_level")
      .eq("symbol", data.symbol.toUpperCase())
      .order("published_at", { ascending: false, nullsFirst: false })
      .limit(10);
    if (error || !rows) return { items: [], avgScore: null, posCount: 0, negCount: 0, neuCount: 0 };
    const items: StockNewsItem[] = rows.map((r) => ({
      id: r.id as string,
      headline: r.headline as string,
      summary_ar: (r.summary_ar as string | null) ?? null,
      source_url: (r.source_url as string | null) ?? null,
      source_name: (r.source_name as string | null) ?? null,
      published_at: (r.published_at as string | null) ?? null,
      sentiment: r.sentiment as "positive" | "negative" | "neutral",
      sentiment_score: Number(r.sentiment_score ?? 0),
      impact_level: r.impact_level as "high" | "medium" | "low",
    }));
    const avgScore = items.length ? items.reduce((a, b) => a + b.sentiment_score, 0) / items.length : null;
    return {
      items,
      avgScore,
      posCount: items.filter((i) => i.sentiment === "positive").length,
      negCount: items.filter((i) => i.sentiment === "negative").length,
      neuCount: items.filter((i) => i.sentiment === "neutral").length,
    };
  });