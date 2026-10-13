import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type PickNotificationItem = {
  id: string;
  pick_date: string;
  symbol: string;
  kind: string;
  sent_at: string;
  entry_price: number | null;
  tp_price: number | null;
  sl_price: number | null;
  signal: string | null;
  confidence: number | null;
};

export const listFreshPickNotifications = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: PickNotificationItem[] }> => {
    // Only items from the last 15 minutes — the watcher dedupes seen ids in localStorage.
    const sinceIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const { data, error } = await supabaseAdmin
      .from("pick_notifications")
      .select("id, pick_date, symbol, kind, sent_at, payload")
      .gte("sent_at", sinceIso)
      .order("sent_at", { ascending: false })
      .limit(20);
    if (error || !data) return { items: [] };
    const items = data.map((r) => {
      const p = (r.payload as Record<string, unknown> | null) ?? {};
      const num = (v: unknown): number | null =>
        v == null ? null : Number.isFinite(Number(v)) ? Number(v) : null;
      const str = (v: unknown): string | null =>
        v == null ? null : String(v);
      return {
        id: r.id as string,
        pick_date: r.pick_date as string,
        symbol: r.symbol as string,
        kind: r.kind as string,
        sent_at: r.sent_at as string,
        entry_price: num(p.entry_price ?? p.entry ?? p.entry_min),
        tp_price: num(p.tp_price ?? p.target ?? p.tp),
        sl_price: num(p.sl_price ?? p.stop_loss ?? p.sl),
        signal: str(p.signal),
        confidence: num(p.confidence),
      } satisfies PickNotificationItem;
    });
    return { items };
  },
);