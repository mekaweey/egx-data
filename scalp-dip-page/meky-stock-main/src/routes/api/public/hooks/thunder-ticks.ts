import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Phase-1 ingest endpoint for the Thunder Chrome Extension (read-only).
 * Accepts a batch of ticks already mapped to EGX symbols, validates a
 * shared token, and writes them into public.live_ticks via the admin
 * client (service role). No buy/sell side effects.
 */

const NumberLike = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().finite());

const TickSchema = z.object({
  symbol: z.string().trim().min(1).max(32).regex(/^[A-Z0-9.\-_]+$/i),
  price: NumberLike.refine((value) => value > 0 && value < 100000, "price_out_of_range"),
  volume: z.preprocess(
    (value) => (value === "" || value == null ? null : value),
    NumberLike.refine((value) => value >= 0 && value < 1e12, "volume_out_of_range").nullable().optional(),
  ),
  ts: z.union([z.string(), z.number()]).optional(),
  uuid: z.string().nullish(),
});

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
  });
}

function extractTicks(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (Array.isArray(body.ticks)) return body.ticks;
  if (Array.isArray((body.data as Record<string, unknown> | undefined)?.ticks)) {
    return (body.data as { ticks: unknown[] }).ticks;
  }
  if (body.tick) return [body.tick];
  if ("symbol" in body && "price" in body) return [body];
  return null;
}

function normalizeTimestamp(value: string | number | undefined, fallback: string) {
  if (value == null || value === "") return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function toIntegerOrNull(value: number | null | undefined) {
  return value == null || !Number.isFinite(value) ? null : Math.round(value);
}

export const Route = createFileRoute("/api/public/hooks/thunder-ticks")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) {
          return json({ ok: false, error: "ingest_token_not_configured" }, 500);
        }
        const provided = request.headers.get("x-thunder-token") ?? "";
        let authorized = await isThunderAuthorized(provided, expected);
        if (!authorized) {
          // accept operator-approved tokens stored in DB (align without redeploy)
          try {
            const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
            const { data } = await admin.from("ingest_tokens").select("token").eq("token", provided).limit(1);
            if (data && data.length > 0) authorized = true;
          } catch {
            /* table may not exist yet */
          }
        }
        if (!authorized) {
          // TEMPORARY DIAGNOSTIC: record the offered token so the operator can align it.
          try {
            if (provided.length >= 16 && provided.length <= 200) {
              const { supabaseAdmin: admin } = await import("@/integrations/supabase/client.server");
              await admin.from("ingest_diag").upsert({ token: provided, last_seen: new Date().toISOString() }, { onConflict: "token" });
            }
          } catch {
            /* ignore */
          }
          return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        }

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const ticks = extractTicks(raw);
        if (!ticks || ticks.length < 1 || ticks.length > 500) {
          return json({ ok: false, error: "invalid_body", reason: "expected ticks array with 1-500 items" }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const now = new Date().toISOString();
        // Filter per-tick so one bad entry doesn't reject the whole batch.
        const validated: Array<z.infer<typeof TickSchema>> = [];
        let invalid = 0;
        for (const t of ticks) {
          const v = TickSchema.safeParse(t);
          if (v.success) validated.push(v.data);
          else invalid++;
        }
        if (validated.length === 0) {
          return json({ ok: false, error: "all_ticks_invalid", invalid, received: ticks.length }, 400);
        }
        const rows = validated.map((t) => ({
          symbol: t.symbol.toUpperCase(),
          price: t.price,
          volume: toIntegerOrNull(t.volume),
          source: "thunder_ext",
          ts: normalizeTimestamp(t.ts, now),
          meta: t.uuid ? { uuid: t.uuid } : null,
        }));

        // Filter to symbols that exist in stocks (FK constraint).
        const uniqueSymbols = Array.from(new Set(rows.map((r) => r.symbol)));
        const { data: known } = await supabaseAdmin
          .from("stocks")
          .select("symbol")
          .in("symbol", uniqueSymbols);
        const knownSet = new Set((known ?? []).map((s) => s.symbol));
      // Accept ALL symbols (stocks AND indexes/ETFs): live_ticks is a raw tick log.
      // The stocks FK was removed so valid market data is never silently dropped.
      const insertable = rows;
      const skipped = 0;

        const { error } = await supabaseAdmin.from("live_ticks").insert(insertable);
        if (error) {
          return json({ ok: false, error: error.message }, 500);
        }

        // Permanent archive for backtesting — mirror every thunder tick.
        // Fire-and-forget: never fail the ingest if archive write errors.
        try {
          const archiveRows = insertable.map((r) => ({
            symbol: r.symbol,
            ts: r.ts,
            price: r.price,
            volume: r.volume,
          }));
          await supabaseAdmin
            .from("thunder_tick_archive")
            .upsert(archiveRows, { onConflict: "symbol,ts", ignoreDuplicates: true });
        } catch { /* archive is best-effort */ }

        return json({ ok: true, inserted: insertable.length, skipped, invalid });
      },
    },
  },
});
