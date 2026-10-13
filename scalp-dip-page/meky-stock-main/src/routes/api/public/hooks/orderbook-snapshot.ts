import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Ingest Level-2 order book snapshots from the Thunder extension.
 * Accepts a single snapshot or a batch (up to 200).
 * Auth: shared THUNDER_INGEST_TOKEN in x-thunder-token header.
 */

const NumberLike = z.preprocess((v) => {
  if (typeof v === "string") {
    const n = Number(v.replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : v;
  }
  return v;
}, z.number().finite().nonnegative());

const DepthLevel = z.object({
  price: NumberLike,
  qty: NumberLike,
}).passthrough();

const SnapshotSchema = z.object({
  symbol: z.string().trim().min(1).max(32),
  ts: z.union([z.string(), z.number()]).optional(),
  best_bid: NumberLike.optional().nullable(),
  best_bid_qty: NumberLike.optional().nullable(),
  best_ask: NumberLike.optional().nullable(),
  best_ask_qty: NumberLike.optional().nullable(),
  last_price: NumberLike.optional().nullable(),
  bids: z.array(DepthLevel).max(20).optional().nullable(),
  asks: z.array(DepthLevel).max(20).optional().nullable(),
  session_id: z.string().uuid().optional().nullable(),
  source: z.string().max(32).optional(),
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-thunder-token",
  "Access-Control-Max-Age": "86400",
} as const;

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...CORS } });

function normalizeTs(v: string | number | undefined, fallback: string) {
  if (v == null || v === "") return fallback;
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d.toISOString() : fallback;
}

export const Route = createFileRoute("/api/public/hooks/orderbook-snapshot")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const expected = process.env.THUNDER_INGEST_TOKEN;
        if (!expected) return json({ ok: false, error: "token_not_configured" }, 500);
        const provided = request.headers.get("x-thunder-token") ?? "";
        if (!(await isThunderAuthorized(provided, expected))) {
          return new Response("Unauthorized", { status: 401, headers: CORS });
        }

        let raw: unknown;
        try { raw = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }

        const items: unknown[] = Array.isArray(raw)
          ? raw
          : (raw && typeof raw === "object" && Array.isArray((raw as { snapshots?: unknown[] }).snapshots))
            ? (raw as { snapshots: unknown[] }).snapshots
            : [raw];

        if (items.length < 1 || items.length > 200) {
          return json({ ok: false, error: "invalid_body", reason: "1..200 snapshots" }, 400);
        }

        const now = new Date().toISOString();
        const valid: Array<z.infer<typeof SnapshotSchema>> = [];
        let invalid = 0;
        for (const item of items) {
          const r = SnapshotSchema.safeParse(item);
          if (r.success) valid.push(r.data);
          else invalid++;
        }
        if (valid.length === 0) return json({ ok: false, error: "all_invalid", invalid }, 400);

        const rows = valid.map((s) => {
          const bid = s.best_bid ?? (s.bids?.[0]?.price ?? null);
          const bidQty = s.best_bid_qty ?? (s.bids?.[0]?.qty ?? null);
          const ask = s.best_ask ?? (s.asks?.[0]?.price ?? null);
          const askQty = s.best_ask_qty ?? (s.asks?.[0]?.qty ?? null);
          return {
            symbol: s.symbol.toUpperCase(),
            ts: normalizeTs(s.ts, now),
            best_bid: bid,
            best_bid_qty: bidQty,
            best_ask: ask,
            best_ask_qty: askQty,
            last_price: s.last_price ?? null,
            bids_depth: (s.bids ?? null) as unknown as Record<string, unknown> | null,
            asks_depth: (s.asks ?? null) as unknown as Record<string, unknown> | null,
            source: s.source ?? "thunder_l2",
            session_id: s.session_id ?? null,
          };
        });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { error } = await supabaseAdmin.from("orderbook_snapshots").insert(rows as never);
        if (error) return json({ ok: false, error: error.message }, 500);
        return json({ ok: true, inserted: rows.length, invalid });
      },
    },
  },
});