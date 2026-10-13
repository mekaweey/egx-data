import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Extension per-tab telemetry ingest (v4.1.89+).
// The extension POSTs a snapshot of every persistent L2 tab every ~60s.
// No PII, no tokens — just symbol, uuid, timestamps, counters.
// Protected by the same THUNDER_INGEST_TOKEN as the ticks endpoint.

const TabSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  uuid: z.string().nullish(),
  opened_at_ms: z.number().finite().nullish(),
  uptime_sec: z.number().int().nullish(),
  last_ensure_age_sec: z.number().int().nullish(),
  last_l2_fresh: z.boolean().nullish(),
  last_l2_age_sec: z.number().int().nullish(),
  panel_state: z.string().max(32).nullish(),
  has_trigger: z.boolean().nullish(),
  snapshots_sent: z.number().int().nullish(),
  last_snapshot_age_sec: z.number().int().nullish(),
  panel_reason: z.string().max(64).nullish(),
  ac_state: z.string().max(32).nullish(),
  ac_resume_attempts: z.number().int().nullish(),
  ac_resume_ok: z.number().int().nullish(),
  depth_total: z.number().int().nullish(),
  l2_soft_resets: z.number().int().nullish(),
});

const BodySchema = z.object({
  clientId: z.string().min(1).max(64),
  ts: z.number().finite().optional(),
  marketOpen: z.boolean().optional(),
  persistTabsCount: z.number().int().optional(),
  persistMaxTabs: z.number().int().optional(),
  signalsCount: z.number().int().optional(),
  tabs: z.array(TabSchema).max(50),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export const Route = createFileRoute("/api/public/hooks/extension-telemetry")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json({ ok: false, error: "no_token" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }
        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }
        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) return json({ ok: false, error: "invalid_body", issues: parsed.error.issues.slice(0, 5) }, 400);
        const b = parsed.data;
        const nowIso = new Date().toISOString();
        const rows = b.tabs.map((t) => ({
          ts: nowIso,
          client_id: b.clientId,
          symbol: String(t.symbol).toUpperCase(),
          uuid: t.uuid ?? null,
          opened_at_ms: t.opened_at_ms ?? null,
          uptime_sec: t.uptime_sec ?? null,
          last_ensure_age_sec: t.last_ensure_age_sec ?? null,
          last_l2_fresh: t.last_l2_fresh ?? null,
          last_l2_age_sec: t.last_l2_age_sec ?? null,
          panel_state: t.panel_state ?? null,
          has_trigger: t.has_trigger ?? null,
          snapshots_sent: t.snapshots_sent ?? null,
          last_snapshot_age_sec: t.last_snapshot_age_sec ?? null,
          panel_reason: t.panel_reason ?? null,
          ac_state: t.ac_state ?? null,
          ac_resume_attempts: t.ac_resume_attempts ?? null,
          ac_resume_ok: t.ac_resume_ok ?? null,
          depth_total: t.depth_total ?? null,
          l2_soft_resets: t.l2_soft_resets ?? null,
          extras: {
            persistTabsCount: b.persistTabsCount ?? null,
            persistMaxTabs: b.persistMaxTabs ?? null,
            signalsCount: b.signalsCount ?? null,
            marketOpen: b.marketOpen ?? null,
          },
        }));
        if (rows.length === 0) return json({ ok: true, inserted: 0 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("extension_tab_telemetry").insert(rows);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, inserted: rows.length });
      },
    },
  },
});