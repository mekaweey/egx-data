import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const getTodayScalp = createServerFn({ method: "GET" }).handler(async () => {
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
  const { data, error } = await supabaseAdmin
    .from("paper_trades")
    .select("id, symbol, strategy, entry_price, entry_ts, tp_price, sl_price, exit_price, exit_reason, pnl, status")
    .eq("trade_date", today)
    .eq("strategy", "scalp-mr15")
    .order("entry_ts", { ascending: true });
  if (error) throw error;
  return { trades: data || [], date: today };
});