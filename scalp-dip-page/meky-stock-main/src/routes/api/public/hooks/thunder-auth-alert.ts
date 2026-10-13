import { createFileRoute } from "@tanstack/react-router";

// Public webhook: extension POSTs here the moment it detects a Thunder
// session/login modal (or a logged-out watchlist DOM). We store the event
// so /marketwatch-health can show a red banner and the user gets a Chrome
// notification with sound from the extension itself.

function isIgnoredAuthEvent(event: { kind?: unknown; url?: unknown; extras?: unknown }) {
  const kind = String(event.kind || "");
  const url = typeof event.url === "string" ? event.url : "";
  const extras = event.extras && typeof event.extras === "object" ? event.extras as Record<string, unknown> : {};
  try {
    const parsed = new URL(url);
    const isThunderX2fa = parsed.hostname === "x.thndr.app" && /^\/auth\/2fa(?:\/|$)/.test(parsed.pathname);
    return isThunderX2fa && kind === "login_page" && String(extras.reason || "") === "url";
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/hooks/thunder-auth-alert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.json().catch(() => ({}));
          const kind = String(body?.kind || "login_required").slice(0, 40);
          const url = body?.url ? String(body.url).slice(0, 500) : null;
          const message = body?.message ? String(body.message).slice(0, 500) : null;
          const client_id = body?.client_id ? String(body.client_id).slice(0, 120) : null;
          const extras = body?.extras ?? null;
          if (isIgnoredAuthEvent({ kind, url, extras })) {
            return Response.json({ ok: true, ignored: true });
          }
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { error } = await supabaseAdmin
            .from("thunder_auth_events")
            .insert({ kind, url, message, client_id, extras });
          if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
      GET: async () => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const since = new Date(Date.now() - 10 * 60_000).toISOString();
        const { data } = await supabaseAdmin
          .from("thunder_auth_events")
          .select("ts, kind, url, message, client_id, extras")
          .gte("ts", since)
          .order("ts", { ascending: false })
          .limit(20);
        const recent = (data ?? []).filter((event) => !isIgnoredAuthEvent(event));
        const latest = recent[0] ?? null;
        const ageSec = latest
          ? Math.round((Date.now() - new Date(latest.ts).getTime()) / 1000)
          : null;
        return Response.json({ ok: true, latest, age_seconds: ageSec, recent });
      },
    },
  },
});