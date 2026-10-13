import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Auto-disable failed patterns.
 *
 * Any pattern with win_rate < 30% AND total_count >= 5 over the recent
 * window gets is_active = false. Re-enables patterns whose win rate
 * recovered above 45% (to give them another chance).
 *
 * Runs as part of each scan — fully automatic, no user input.
 */

export async function autoDisablePatterns(): Promise<{ disabled: number; reenabled: number }> {
  const { data } = await supabaseAdmin
    .from("signal_failures")
    .select("id, pattern_name, win_rate, total_count, is_active");

  let disabled = 0;
  let reenabled = 0;

  for (const p of data ?? []) {
    const wr = p.win_rate == null ? null : Number(p.win_rate);
    const total = Number(p.total_count ?? 0);
    if (total < 5 || wr == null) continue;

    if (p.is_active && wr < 0.3) {
      await supabaseAdmin
        .from("signal_failures")
        .update({ is_active: false, last_updated: new Date().toISOString() })
        .eq("id", p.id);
      disabled++;
    } else if (!p.is_active && wr > 0.45) {
      await supabaseAdmin
        .from("signal_failures")
        .update({ is_active: true, last_updated: new Date().toISOString() })
        .eq("id", p.id);
      reenabled++;
    }
  }

  return { disabled, reenabled };
}