import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const listFreshPaperSignals = createServerFn({ method: "GET" }).handler(async () => {
  const sinceIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, tp_price, sl_price, entry_ts, status, created_at")
    .in("strategy", ["scalp-mr15", "scalp-dip", "scalp-mr15-fresh"])
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return { signals: data || [] };
});

export const listFreshPaperExits = createServerFn({ method: "GET" }).handler(async () => {
  const sinceIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, exit_price, exit_ts, exit_reason, pnl, pnl_pct, status")
    .in("strategy", ["scalp-mr15", "scalp-dip", "scalp-mr15-fresh"])
    .eq("status", "closed")
    .gte("exit_ts", sinceIso)
    .order("exit_ts", { ascending: false })
    .limit(30);
  if (error) throw error;
  return { exits: data || [] };
});