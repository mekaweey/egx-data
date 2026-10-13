import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * telegram.server.ts — free Telegram alerts for the weekly system.
 *
 * Config (audit Oct-4 batch 3 A5 — corrected): the bot TOKEN comes ONLY from
 * .env (TELEGRAM_BOT_TOKEN). The strategy_settings table has NO text_value
 * column, so a DB token fallback is impossible — the old comment claiming
 * one was false and is removed. Only the chat id falls back to
 * strategy_settings.telegram_chat_id (numeric_value).
 *
 * Render env check (operator): TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID must
 * exist in the Render dashboard environment, otherwise every alert silently
 * no-ops (getTelegramConfig returns null). Verify after every redeploy.
 */

export async function getTelegramConfig(): Promise<{ token: string; chatId: string } | null> {
  // token: .env only (no text_value column exists in strategy_settings)
  const envToken = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const envChat = process.env.TELEGRAM_CHAT_ID ?? "";
  if (envToken && envChat) return { token: envToken, chatId: envChat };
  // chat id may fall back to the numeric settings row
  const { data } = await supabaseAdmin
    .from("strategy_settings")
    .select("key, numeric_value")
    .in("key", ["telegram_chat_id"]);
  let chatId = envChat;
  for (const r of data ?? []) {
    if (r.key === "telegram_chat_id" && !chatId) chatId = String((r as any).numeric_value ?? "");
  }
  if (!envToken || !chatId) return null;
  return { token: envToken, chatId };
}

export type TelegramResult = { ok: boolean; message_id: number | null; attempts: number };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Audit Oct-4 batch 3 (A5): returns message_id/ok and retries (bounded)
 * until a delivered marker exists. Honors 429 retry_after (capped 60s) and
 * splits messages over 4096 chars. NEVER throws — callers log the result. */
export async function sendTelegram(text: string, maxAttempts = 3): Promise<TelegramResult> {
  const fail: TelegramResult = { ok: false, message_id: null, attempts: 0 };
  let cfg;
  try {
    cfg = await getTelegramConfig();
  } catch {
    return fail;
  }
  if (!cfg) return fail;
  // Telegram caps messages at 4096 chars — split long alerts into parts.
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += 4000) parts.push(text.slice(i, i + 4000));
  let attempts = 0;
  let firstId: number | null = null;
  for (const part of parts) {
    let sent = false;
    for (let attempt = 1; attempt <= maxAttempts && !sent; attempt++) {
      attempts++;
      try {
        const res = await fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: cfg.chatId, text: part }),
        });
        if (res.status === 429) {
          let waitS = attempt * 2;
          try {
            const j429: any = await res.json();
            if (Number(j429?.parameters?.retry_after) > 0) waitS = Math.min(60, Number(j429.parameters.retry_after));
          } catch {
            // keep backoff
          }
          await sleep(waitS * 1000);
          continue;
        }
        const j: any = await res.json();
        if (j.ok === true) {
          sent = true;
          if (firstId === null) firstId = Number(j.result?.message_id) || null;
        }
      } catch {
        // fall through to retry
      }
      if (!sent && attempt < maxAttempts) await sleep(attempt * 1000);
    }
    if (!sent) return { ok: false, message_id: firstId, attempts };
  }
  return { ok: true, message_id: firstId, attempts };
}
