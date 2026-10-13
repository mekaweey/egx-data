/**
 * DB-backed persistence for in-memory learning models.
 * Saves/loads via the `model_state` table. Fail-open: any DB error
 * keeps in-memory state intact.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export async function saveState(key: string, data: unknown): Promise<void> {
  try {
    await supabaseAdmin
      .from("model_state")
      .upsert({ key, data: data as never, updated_at: new Date().toISOString() });
  } catch {}
}

export async function loadState<T = unknown>(key: string): Promise<T | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from("model_state")
      .select("data")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return null;
    return data.data as T;
  } catch {
    return null;
  }
}