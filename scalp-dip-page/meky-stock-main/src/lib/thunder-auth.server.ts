import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Shared Thunder ingest authorization.
 * Accepts the configured env token OR any operator-approved token stored in the
 * `ingest_tokens` table. This lets the ingest token be aligned without redeploying,
 * and prevents valid extension traffic (ticks/quotes/watchlist/orders/...) from
 * being rejected after any token rotation.
 */
export async function isThunderAuthorized(
  provided: string,
  expected?: string | null,
): Promise<boolean> {
  if (expected && provided.length === expected.length && provided === expected) return true;
  if (!provided || provided.length < 16 || provided.length > 200) return false;
  try {
    const { data } = await supabaseAdmin
      .from("ingest_tokens")
      .select("token")
      .eq("token", provided)
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}
