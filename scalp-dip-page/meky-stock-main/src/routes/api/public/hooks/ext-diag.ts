import { createFileRoute } from "@tanstack/react-router";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

export const Route = createFileRoute("/api/public/hooks/ext-diag")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        let body: Record<string, unknown> = {};
        try { body = await request.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const row = {
          client_id: String(body.client_id ?? "").slice(0, 128) || null,
          symbol: String(body.symbol ?? "").slice(0, 32) || null,
          visibility_state: String(body.visibility_state ?? "").slice(0, 16) || null,
          audio_paused: typeof body.audio_paused === "boolean" ? body.audio_paused : null,
          audio_muted: typeof body.audio_muted === "boolean" ? body.audio_muted : null,
          audio_ready_state: Number.isFinite(body.audio_ready_state) ? Number(body.audio_ready_state) : null,
          audio_current_time: Number.isFinite(body.audio_current_time) ? Number(body.audio_current_time) : null,
          depth_count_30s: Number.isFinite(body.depth_count_30s) ? Number(body.depth_count_30s) : null,
          last_depth_age_ms: Number.isFinite(body.last_depth_age_ms) ? Number(body.last_depth_age_ms) : null,
          extra: (body.extra && typeof body.extra === "object") ? body.extra : {},
        };
        const { error } = await supabaseAdmin.from("extension_diag").insert(row as never);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true });
      },
    },
  },
});