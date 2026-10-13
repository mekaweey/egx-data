import { createServerFn } from "@tanstack/react-start";

// Public read (aggregated) of the latest telemetry snapshot per (client, symbol).
// Uses the browser publishable Supabase client via admin (simpler; read-only shape).
export const getLatestTabTelemetry = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const sinceIso = new Date(Date.now() - 10 * 60_000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("extension_tab_telemetry")
    .select("ts, client_id, symbol, uuid, opened_at_ms, uptime_sec, last_ensure_age_sec, last_l2_fresh, last_l2_age_sec, panel_state, has_trigger, snapshots_sent, last_snapshot_age_sec, extras")
    .gte("ts", sinceIso)
    .order("ts", { ascending: false })
    .limit(2000);
  if (error) return { ok: false as const, tabs: [], error: error.message };
  // De-dup per (client_id, symbol) keeping newest row.
  const seen = new Map<string, typeof data[number]>();
  for (const row of data || []) {
    const key = `${row.client_id}::${row.symbol}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return { ok: true as const, tabs: Array.from(seen.values()) };
});