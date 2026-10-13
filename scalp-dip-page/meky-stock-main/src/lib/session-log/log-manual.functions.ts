import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";
import { z } from "zod";

// Manual session-log ingest triggered by the "تحديث ذكي" button.
// Accepts pasted user + assistant messages, dedupes by content_hash,
// and inserts via supabaseAdmin (bypassing RLS on session_messages).

const MessageInput = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(200000),
  turn_id: z.string().max(120).nullish(),
});

const InputSchema = z.object({
  messages: z.array(MessageInput).min(1).max(200),
  source: z.string().max(80).default("manual-refresh-button"),
});

function sha256(parts: Array<string | null | undefined>) {
  return createHash("sha256").update(parts.map((p) => p ?? "").join("|")).digest("hex");
}

export const logMessagesManual = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const rows = data.messages.map((m) => ({
      role: m.role,
      content: m.content,
      turn_id: m.turn_id ?? null,
      content_hash: sha256(["message", m.role, m.turn_id ?? null, m.content]),
    }));

    const hashes = [...new Set(rows.map((r) => r.content_hash))];
    const { data: existing, error: existingErr } = await supabaseAdmin
      .from("session_messages")
      .select("content_hash")
      .in("content_hash", hashes);
    if (existingErr) throw new Error(`lookup failed: ${existingErr.message}`);
    const seen = new Set((existing ?? []).map((r) => r.content_hash));

    const localSeen = new Set<string>();
    const toInsert = rows.filter((r) => {
      if (seen.has(r.content_hash) || localSeen.has(r.content_hash)) return false;
      localSeen.add(r.content_hash);
      return true;
    });

    let inserted = 0;
    if (toInsert.length) {
      const { error: insErr } = await supabaseAdmin.from("session_messages").insert(toInsert);
      if (insErr && insErr.code !== "23505") throw new Error(`insert failed: ${insErr.message}`);
      inserted = toInsert.length;
    }

    // audit trail
    await supabaseAdmin.from("session_ingest_audit").insert({
      turn_id: data.messages[0]?.turn_id ?? null,
      client_batch_id: `manual-${Date.now()}`,
      source: data.source,
      items_total: rows.length,
      messages_count: inserted,
      edits_count: 0,
      reads_count: 0,
      duplicate_count: rows.length - inserted,
      ok: true,
      error_stage: null,
      error_message: null,
    });

    return {
      ok: true,
      total: rows.length,
      inserted,
      duplicates: rows.length - inserted,
    };
  });