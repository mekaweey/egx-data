import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Ingest endpoint for real-time top-of-book quotes captured passively
 * from Thunder's Firebase feed (highest_bid / lowest_ask). Zero polling,
 * push-based updates. Writes into public.live_quotes.
 */

const NumberLike = z.preprocess((value) => {
  if (typeof value === "string") {
    const normalized = value.replace(/,/g, "").trim();
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : value;
  }
  return value;
}, z.number().finite());

const QuoteSchema = z.object({
  symbol: z.string().trim().min(1).max(32).regex(/^[A-Z0-9.\-_]+$/i).optional().nullable(),
  uuid: z.string().trim().min(1).max(64).optional().nullable(),
  bid: NumberLike.refine((v) => v >= 0 && v < 100000, "bid_out_of_range").nullable().optional(),
  ask: NumberLike.refine((v) => v >= 0 && v < 100000, "ask_out_of_range").nullable().optional(),
  ts: z.union([z.string(), z.number()]).optional(),
  // Optional provenance tag: 'firebase' (legacy wire format), 'rest' (new REST
  // endpoint capture), or any future tag. Short string to keep payload small.
  // Validated loosely so unknown tags from older extension builds still pass.
  source: z.string().trim().min(1).max(32).optional().nullable(),
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

function normalizeTimestamp(value: string | number | undefined, fallback: string) {
  if (value == null || value === "") return fallback;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : fallback;
}

function extractQuotes(raw: unknown): unknown[] | null {
  if (Array.isArray(raw)) return raw;
  if (!raw || typeof raw !== "object") return null;
  const body = raw as Record<string, unknown>;
  if (Array.isArray(body.quotes)) return body.quotes;
  if (body.quote) return [body.quote];
  return null;
}

export const Route = createFileRoute("/api/public/hooks/thunder-quotes")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json({ ok: false, error: "ingest_token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS_HEADERS });
        }

        let raw: unknown;
        try { raw = await request.json(); }
        catch { return json({ ok: false, error: "invalid_json" }, 400); }

        const quotes = extractQuotes(raw);
        if (!quotes || quotes.length < 1 || quotes.length > 1000) {
          return json({ ok: false, error: "invalid_body", reason: "expected quotes array with 1-1000 items" }, 400);
        }

        const now = new Date().toISOString();
        const rows: Array<{
          symbol: string; uuid: string | null;
          bid: number | null; ask: number | null; spread: number | null;
          ts: string;
          source: string | null;
        }> = [];
        let invalid = 0;

        for (const q of quotes) {
          const v = QuoteSchema.safeParse(q);
          if (!v.success) { invalid++; continue; }
          const d = v.data;
          const symbol = (d.symbol || "").toUpperCase().trim();
          if (!symbol) { invalid++; continue; }
          const bid = d.bid ?? null;
          const ask = d.ask ?? null;
          if (bid == null && ask == null) { invalid++; continue; }
          const spread = bid != null && ask != null && ask > 0 && bid > 0
            ? Number((ask - bid).toFixed(4))
            : null;
          // Clamp source to short ASCII so a runaway client can't dump 32KB.
          const src = typeof d.source === "string" ? d.source.replace(/[^\x20-\x7e]/g, "").slice(0, 32) || null : null;
          rows.push({
            symbol,
            uuid: d.uuid ?? null,
            bid, ask, spread,
            ts: normalizeTimestamp(d.ts, now),
            source: src,
          });
        }

        if (rows.length === 0) {
          return json({ ok: true, inserted: 0, invalid });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("live_quotes").insert(rows);
        if (error) {
          return json({ ok: false, error: "db_insert_failed", detail: error.message.slice(0, 200) }, 500);
        }
        return json({ ok: true, inserted: rows.length, invalid });
      },
    },
  },
});