import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MacroSnapshot = {
  as_of: string;
  usd_egp: number | null;
  gold_usd: number | null;
  brent_oil_usd: number | null;
  cbe_interest_rate: number | null;
  inflation_yoy: number | null;
  sp500_close: number | null;
  sp500_change_pct: number | null;
  msci_em_close: number | null;
} | null;

export const getMacroSnapshot = createServerFn({ method: "GET" }).handler(async (): Promise<MacroSnapshot> => {
  const { data, error } = await supabaseAdmin
    .from("macro_indicators")
    .select("as_of, usd_egp, gold_usd, brent_oil_usd, cbe_interest_rate, inflation_yoy, sp500_close, sp500_change_pct, msci_em_close")
    .order("as_of", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return {
    as_of: data.as_of as string,
    usd_egp: data.usd_egp != null ? Number(data.usd_egp) : null,
    gold_usd: data.gold_usd != null ? Number(data.gold_usd) : null,
    brent_oil_usd: data.brent_oil_usd != null ? Number(data.brent_oil_usd) : null,
    cbe_interest_rate: data.cbe_interest_rate != null ? Number(data.cbe_interest_rate) : null,
    inflation_yoy: data.inflation_yoy != null ? Number(data.inflation_yoy) : null,
    sp500_close: data.sp500_close != null ? Number(data.sp500_close) : null,
    sp500_change_pct: data.sp500_change_pct != null ? Number(data.sp500_change_pct) : null,
    msci_em_close: data.msci_em_close != null ? Number(data.msci_em_close) : null,
  };
});