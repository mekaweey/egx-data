import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_KEYS = new Set([
  "scalp-dip-smart-exit",
  "scalp-dip-smart-exit-shadow",
  "scalp-dip-prebuy-volume-filter",
]);

export const Route = createFileRoute("/api/public/hooks/smart-exit-toggle")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const body = (await request.json().catch(() => ({}))) as {
          key?: string;
          enabled?: boolean;
        };
        if (!body.key || !ALLOWED_KEYS.has(body.key)) {
          return new Response(JSON.stringify({ ok: false, error: "invalid_key" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        if (typeof body.enabled !== "boolean") {
          return new Response(JSON.stringify({ ok: false, error: "invalid_enabled" }), {
            status: 400, headers: { "Content-Type": "application/json" },
          });
        }
        const { error } = await supabaseAdmin
          .from("strategy_settings")
          .upsert({ key: body.key, enabled: body.enabled, updated_at: new Date().toISOString() });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" },
          });
        }
        return Response.json({ ok: true, key: body.key, enabled: body.enabled });
      },
    },
  },
});