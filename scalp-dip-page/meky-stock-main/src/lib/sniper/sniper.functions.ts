import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type SniperSnapshot = {
  pick: {
    pick_date: string;
    symbol: string;
    name_ar: string | null;
    reasons: string[] | null;
    prev_close: number | null;
    entry_price: number | null;
    target_price: number | null;
    stop_price: number | null;
    orb_high: number | null;
    orb_low: number | null;
    orb_decision: string | null;
    orb_confidence: number | null;
    position_pct: number | null;
    status: string;
    v3_score: number | null;
    confidence: number | null;
    negative_reasons: string[] | null;
  } | null;
  ticks: { ts: string; price: number; source: string }[];
  latest: { ts: string; price: number; source: string } | null;
};

export const getSniperSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<SniperSnapshot> => {
    const today = new Date().toISOString().slice(0, 10);
    const { data: pickRow } = await supabaseAdmin
      .from("sniper_picks").select("*").eq("pick_date", today).maybeSingle();

    let ticks: SniperSnapshot["ticks"] = [];
    let latest: SniperSnapshot["latest"] = null;
    if (pickRow) {
      const { data: t } = await supabaseAdmin
        .from("live_ticks").select("ts,price,source")
        .eq("symbol", pickRow.symbol)
        .gte("ts", today + "T07:30:00Z") // approx 09:30 Cairo / 10:30 DST
        .order("ts", { ascending: true })
        .limit(500);
      ticks = (t ?? []).map((r) => ({ ts: r.ts, price: +r.price, source: r.source }));
      latest = ticks.length ? ticks[ticks.length - 1] : null;
    }
    const pick = pickRow ? {
      pick_date: pickRow.pick_date,
      symbol: pickRow.symbol,
      name_ar: pickRow.name_ar,
      reasons: pickRow.reasons,
      prev_close: pickRow.prev_close ? +pickRow.prev_close : null,
      entry_price: pickRow.entry_price ? +pickRow.entry_price : null,
      target_price: pickRow.target_price ? +pickRow.target_price : null,
      stop_price: pickRow.stop_price ? +pickRow.stop_price : null,
      orb_high: pickRow.orb_high ? +pickRow.orb_high : null,
      orb_low: pickRow.orb_low ? +pickRow.orb_low : null,
      orb_decision: pickRow.orb_decision,
      orb_confidence: pickRow.orb_confidence,
      position_pct: pickRow.position_pct ? +pickRow.position_pct : null,
      status: pickRow.status,
      v3_score: pickRow.v3_score ? +pickRow.v3_score : null,
      confidence: (pickRow as { confidence?: number | null }).confidence ?? null,
      negative_reasons: (pickRow as { negative_reasons?: string[] | null }).negative_reasons ?? null,
    } : null;
    return { pick, ticks, latest };
  },
);