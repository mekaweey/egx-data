import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type UpcomingCatalyst = {
  id: string;
  symbol: string;
  headline: string;
  expected_direction: string;
  expected_magnitude_pct: number | null;
  confidence: number;
  impact_start_date: string;
  impact_end_date: string;
  baladi_summary: string | null;
};

export const getUpcomingCatalysts = createServerFn({ method: "GET" }).handler(async (): Promise<UpcomingCatalyst[]> => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("news_impact_forecasts")
    .select("id, symbol, headline, expected_direction, expected_magnitude_pct, confidence, impact_start_date, impact_end_date, baladi_summary")
    .gte("impact_end_date", today)
    .in("expected_direction", ["up", "down"])
    .order("confidence", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  // dedupe by symbol+headline, keep top per symbol up to 6 unique symbols
  const seen = new Set<string>();
  const out: UpcomingCatalyst[] = [];
  for (const r of data) {
    const key = r.symbol;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      id: r.id as string,
      symbol: r.symbol as string,
      headline: r.headline as string,
      expected_direction: r.expected_direction as string,
      expected_magnitude_pct: r.expected_magnitude_pct != null ? Number(r.expected_magnitude_pct) : null,
      confidence: Number(r.confidence ?? 0),
      impact_start_date: r.impact_start_date as string,
      impact_end_date: r.impact_end_date as string,
      baladi_summary: (r.baladi_summary as string | null) ?? null,
    });
    if (out.length >= 6) break;
  }
  return out;
});