import { createServerFn } from "@tanstack/react-start";

/**
 * Server feed for <NotificationCenter /> — pulls new decision_audit_log rows
 * (id > afterId) so server-side events (MW_WEEKLY_SCAN / MW_WEEKLY_EXIT /
 * MW_REGIME_CASH / USER_BOUGHT / USER_SOLD / runner signals) reach the
 * on-screen notification center, not just Telegram. decision_audit_log is not
 * in the generated Database types — `as any` escape hatch (project pattern).
 */

export type AuditFeedRow = {
  id: number;
  created_at: string;
  event_type: string;
  symbol: string;
  trigger_price: number | null;
  reference_price: number | null;
  pnl_pct: number | null;
  details: string | null;
  user_action: string;
};

export const listAuditFeed = createServerFn({ method: "GET" })
  .validator((d: { afterId?: number; probe?: boolean }) => ({
    afterId: Number(d?.afterId ?? 0),
    probe: Boolean(d?.probe),
  }))
  .handler(async ({ data }): Promise<{ rows: AuditFeedRow[]; maxId: number }> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const db = supabaseAdmin as any;

      // Probe: just learn the current max id (first visit ingests nothing —
      // we only notify about events that happen while the user is watching).
      if (data.probe) {
        const { data: row } = await db
          .from("decision_audit_log")
          .select("id")
          .order("id", { ascending: false })
          .limit(1)
          .maybeSingle();
        return { rows: [], maxId: Number(row?.id ?? 0) };
      }

      let q = db
        .from("decision_audit_log")
        .select("id, created_at, event_type, symbol, trigger_price, reference_price, pnl_pct, details, user_action");
      if (data.afterId > 0) q = q.gt("id", data.afterId);
      const { data: rows } = await q.order("id", { ascending: true }).limit(50);

      const list: AuditFeedRow[] = ((rows ?? []) as any[]).map((r) => ({
        id: Number(r.id),
        created_at: String(r.created_at ?? ""),
        event_type: String(r.event_type ?? ""),
        symbol: String(r.symbol ?? "-"),
        trigger_price: r.trigger_price != null ? Number(r.trigger_price) : null,
        reference_price: r.reference_price != null ? Number(r.reference_price) : null,
        pnl_pct: r.pnl_pct != null ? Number(r.pnl_pct) : null,
        details:
          r.details != null
            ? typeof r.details === "object"
              ? JSON.stringify(r.details)
              : String(r.details)
            : null,
        user_action: String(r.user_action ?? ""),
      }));
      const maxId = list.length ? Math.max(...list.map((r) => r.id)) : data.afterId;
      return { rows: list, maxId };
    } catch {
      return { rows: [], maxId: data.afterId };
    }
  });
