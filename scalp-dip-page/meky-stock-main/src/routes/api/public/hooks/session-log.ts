import { isThunderAuthorized } from "@/lib/thunder-auth.server";
import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "crypto";
import { z } from "zod";

// Auto session logger. The Lovable agent POSTs here on every turn to record:
//  - kind="message": user/assistant messages
//  - kind="edit":    file edits, migrations, versions
//  - kind="read":    files the agent read + key findings (avoid re-reading)
// Protected by THUNDER_INGEST_TOKEN (same token as other internal hooks).

const MessageSchema = z.object({
  kind: z.literal("message"),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(200000),
  turn_id: z.string().max(64).nullish(),
});

const EditSchema = z.object({
  kind: z.literal("edit"),
  turn_id: z.string().max(64).nullish(),
  summary: z.string().min(1).max(20000),
  files_changed: z.array(z.string().max(500)).max(200).default([]),
  migrations: z.array(z.string().max(2000)).max(50).default([]),
  version: z.string().max(64).nullish(),
  extra: z.record(z.string(), z.unknown()).optional(),
});

const ReadSchema = z.object({
  kind: z.literal("read"),
  turn_id: z.string().max(64).nullish(),
  file_path: z.string().min(1).max(500),
  purpose: z.string().max(2000).nullish(),
  key_findings: z.string().max(20000).nullish(),
});

const ItemSchema = z.discriminatedUnion("kind", [MessageSchema, EditSchema, ReadSchema]);
const BodySchema = z.object({
  items: z.array(ItemSchema).min(1).max(250),
  client_batch_id: z.string().max(120).nullish(),
  source: z.string().max(80).nullish(),
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

function sha256(parts: Array<string | null | undefined>) {
  return createHash("sha256").update(parts.map((part) => part ?? "").join("|")).digest("hex");
}

async function insertDeduped<T extends { content_hash: string }>(
  supabaseAdmin: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"],
  table: "session_messages" | "session_edits" | "session_reads",
  rows: T[],
) {
  if (!rows.length) return { inserted: 0, duplicates: 0, error: null as string | null };
  const hashes = [...new Set(rows.map((row) => row.content_hash))];
  const { data: existingRows, error: existingError } = await supabaseAdmin
    .from(table)
    .select("content_hash")
    .in("content_hash", hashes);
  if (existingError) return { inserted: 0, duplicates: 0, error: existingError.message };

  const existing = new Set((existingRows ?? []).map((row) => row.content_hash).filter(Boolean));
  const seen = new Set<string>();
  const uniqueRows = rows.filter((row) => {
    if (existing.has(row.content_hash) || seen.has(row.content_hash)) return false;
    seen.add(row.content_hash);
    return true;
  });

  if (!uniqueRows.length) return { inserted: 0, duplicates: rows.length, error: null };
  const { error } = await supabaseAdmin.from(table).insert(uniqueRows as never);
  if (error) {
    if (error.code === "23505") return { inserted: 0, duplicates: rows.length, error: null };
    return { inserted: 0, duplicates: rows.length - uniqueRows.length, error: error.message };
  }
  return { inserted: uniqueRows.length, duplicates: rows.length - uniqueRows.length, error: null };
}

export const Route = createFileRoute("/api/public/hooks/session-log")({
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
        if (!parsed.success) {
          return json({ ok: false, error: "invalid_body", issues: parsed.error.issues.slice(0, 5) }, 400);
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const turnId = parsed.data.items.find((item) => item.turn_id)?.turn_id ?? null;
        const clientBatchId = parsed.data.client_batch_id ?? request.headers.get("x-session-log-batch-id") ?? null;
        const source = parsed.data.source ?? request.headers.get("x-session-log-source") ?? "lovable-agent";

        const messages = parsed.data.items.filter((i) => i.kind === "message").map((i) => ({
          role: i.role, content: i.content, turn_id: i.turn_id ?? null,
          content_hash: sha256(["message", i.role, i.turn_id, i.content]),
        }));
        const edits = parsed.data.items.filter((i) => i.kind === "edit").map((i) => ({
          turn_id: i.turn_id ?? null,
          summary: i.summary,
          files_changed: i.files_changed,
          migrations: i.migrations,
          version: i.version ?? null,
          extra: (i.extra ?? {}) as never,
          content_hash: sha256(["edit", i.turn_id, i.summary, i.files_changed.join(","), i.migrations.join(","), i.version]),
        }));
        const reads = parsed.data.items.filter((i) => i.kind === "read").map((i) => ({
          turn_id: i.turn_id ?? null,
          file_path: i.file_path,
          purpose: i.purpose ?? null,
          key_findings: i.key_findings ?? null,
          content_hash: sha256(["read", i.turn_id, i.file_path, i.purpose, i.key_findings]),
        }));

        const messageResult = await insertDeduped(supabaseAdmin, "session_messages", messages);
        const editResult = await insertDeduped(supabaseAdmin, "session_edits", edits);
        const readResult = await insertDeduped(supabaseAdmin, "session_reads", reads);

        const stageError = messageResult.error ? ["messages", messageResult.error] as const
          : editResult.error ? ["edits", editResult.error] as const
            : readResult.error ? ["reads", readResult.error] as const
              : null;
        const inserted = {
          messages: messageResult.inserted,
          edits: editResult.inserted,
          reads: readResult.inserted,
        };
        const duplicateCount = messageResult.duplicates + editResult.duplicates + readResult.duplicates;
        const audit = {
          turn_id: turnId,
          client_batch_id: clientBatchId,
          source,
          items_total: parsed.data.items.length,
          messages_count: inserted.messages,
          edits_count: inserted.edits,
          reads_count: inserted.reads,
          duplicate_count: duplicateCount,
          ok: !stageError,
          error_stage: stageError?.[0] ?? null,
          error_message: stageError?.[1] ?? null,
        };
        await supabaseAdmin.from("session_ingest_audit").insert(audit);

        if (stageError) return json({ ok: false, stage: stageError[0], error: stageError[1], inserted, duplicateCount }, 500);
        return json({ ok: true, inserted, duplicateCount, clientBatchId });
      },
    },
  },
});