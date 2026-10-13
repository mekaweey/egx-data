/**
 * Telegram notification sender via Lovable connector gateway.
 * Reads TELEGRAM_API_KEY (connector key), LOVABLE_API_KEY, TELEGRAM_CHAT_ID
 * from process.env. Fire-and-forget: never throws.
 */
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

import { summarizeMessageBaladi, formatBaladiSummary } from "@/lib/notifications/baladi-explain.server";

/** يضيف خلاصة بلدي لآخر النص (لو طويل بما يكفي) — fail-open. */
async function appendBaladiSummary(text: string): Promise<string> {
  try {
    // متجبش خلاصة لو فيها أصلاً (كان متضاف يدوياً)
    if (text.includes("🗣️ خلاصة ب البلدي") || text.includes("🗣️ ب البلدي كده")) return text;
    const summary = await summarizeMessageBaladi(text);
    if (!summary) return text;
    const withSummary = text + formatBaladiSummary(summary);
    // تليجرام بيقبل 4096 حرف — لو طالعنا، نقطع الأصل و نسيب الخلاصة
    if (withSummary.length <= 4000) return withSummary;
    const summaryBlock = formatBaladiSummary(summary);
    const keep = 4000 - summaryBlock.length - 10;
    return text.slice(0, Math.max(200, keep)) + "\n…" + summaryBlock;
  } catch {
    return text;
  }
}

/** Sends a Telegram message to a specific chat_id (used by the inbound bot). */
export async function sendTelegramTo(
  chatId: number | string,
  text: string,
  extra?: Record<string, unknown>,
): Promise<{ ok: boolean; error?: string }> {
  if (!text || text.trim().length === 0) return { ok: false, error: "empty_message" };
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey || !tgKey) return { ok: false, error: "missing_telegram_config" };
  // ردود البوت التفاعلية ما بنضيفش عليها خلاصة — هي قصيرة أصلاً و الرد جواب مباشر
  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...(extra ?? {}),
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendTo failed", res.status, body);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/**
 * يبعت رسالة لتليجرام. افتراضياً بيضيف "🗣️ خلاصة ب البلدي" في آخر الرسالة لو طويلة
 * كفاية، عشان كل اشعار يكون مفهوم بسهولة. مرر { skipBaladi: true } للرسائل النظامية الصغيرة.
 */
export async function sendTelegram(
  text: string,
  opts?: { skipBaladi?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  if (!text || text.trim().length === 0) {
    return { ok: false, error: "empty_message" };
  }

  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!lovableKey || !tgKey || !chatId) {
    console.error("[telegram] missing config", { hasLovable: !!lovableKey, hasTg: !!tgKey, hasChatId: !!chatId });
    return { ok: false, error: "missing_telegram_config" };
  }

  const finalText = opts?.skipBaladi ? text : await appendBaladiSummary(text);

  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: finalText,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] send failed", res.status, body, "text sent:", finalText.slice(0, 100));
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[telegram] send error", e);
    return { ok: false, error: (e as Error).message };
  }
}
