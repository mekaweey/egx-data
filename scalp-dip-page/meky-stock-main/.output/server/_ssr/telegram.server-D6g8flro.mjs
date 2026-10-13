import { c as chatWithFallback } from "./chat-fallback.server-HMcdWJQs.mjs";
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
async function explainNewsBaladi(n) {
  const sys = "انت محلل بورصة مصرية بتشرح للناس البسطاء. اشرح الخبر ب اللهجة المصرية البلدية السهلة، من غير مصطلحات صعبة. لازم تجاوب على 3 حاجات بإختصار شديد: 1) الخبر ده يعني إيه ب البلدي. 2) هيأثر على إيه. 3) السهم متوقع يتحرك إزاي (يطلع كتير / يطلع شويه / تقريباً مفيش تأثير / ينزل شويه / ينزل كتير) و ليه. خلي الرد كله أقل من 60 كلمة، جمل قصيرة، من غير عناوين أو رموز markdown.";
  const user = `السهم: ${n.name ?? n.symbol} (${n.symbol})
الخبر: ${n.headline}
` + (n.sentiment ? `تصنيف المشاعر: ${n.sentiment}
` : "") + (n.impact_level ? `قوة الأثر: ${n.impact_level}
` : "") + (n.sentiment_score != null ? `درجة المشاعر: ${Number(n.sentiment_score).toFixed(2)}
` : "");
  const out = await chatWithFallback({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ],
    temperature: 0.3,
    timeoutMs: 9e3
  });
  if (!out) return null;
  const cleaned = out.trim().replace(/^["'`*_>#\s-]+|["'`*_\s]+$/g, "");
  return cleaned || null;
}
function formatBaladiBlock(text) {
  return `

<b>🗣️ ب البلدي كده:</b>
${escapeHtml(text)}`;
}
async function summarizeMessageBaladi(htmlText) {
  const plain = htmlText.replace(/<[^>]+>/g, "").replace(/━+/g, "").replace(/\s+/g, " ").trim();
  if (plain.length < 60) return null;
  const sys = "انت محلل بورصة مصرية. هتقرا اشعار طويل و تلخّصه في سطرين بحد أقصى ب اللهجة المصرية البلدية السهلة. لازم توضح: 1) الاشعار ده يعني إيه ب اختصار. 2) إيه أهم حاجة المستخدم يعملها أو يركز عليها. ممنوع مصطلحات صعبة، ممنوع markdown، ممنوع عناوين، سطرين بس و خلاص.";
  const out = await chatWithFallback({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: plain.slice(0, 2500) }
    ],
    temperature: 0.3,
    timeoutMs: 7e3
  });
  if (!out) return null;
  const cleaned = out.trim().replace(/^["'`*_>#\s-]+|["'`*_\s]+$/g, "");
  return cleaned || null;
}
function formatBaladiSummary(text) {
  return `

━━━━━━━━━━━━━━━
<b>🗣️ خلاصة ب البلدي:</b>
${escapeHtml(text)}`;
}
const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";
async function appendBaladiSummary(text) {
  try {
    if (text.includes("🗣️ خلاصة ب البلدي") || text.includes("🗣️ ب البلدي كده")) return text;
    const summary = await summarizeMessageBaladi(text);
    if (!summary) return text;
    const withSummary = text + formatBaladiSummary(summary);
    if (withSummary.length <= 4e3) return withSummary;
    const summaryBlock = formatBaladiSummary(summary);
    const keep = 4e3 - summaryBlock.length - 10;
    return text.slice(0, Math.max(200, keep)) + "\n…" + summaryBlock;
  } catch {
    return text;
  }
}
async function sendTelegramTo(chatId, text, extra) {
  if (!text || text.trim().length === 0) return { ok: false, error: "empty_message" };
  const lovableKey = process.env.LOVABLE_API_KEY;
  const tgKey = process.env.TELEGRAM_API_KEY;
  if (!lovableKey || !tgKey) return { ok: false, error: "missing_telegram_config" };
  try {
    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": tgKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        ...extra ?? {}
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] sendTo failed", res.status, body);
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
async function sendTelegram(text, opts) {
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
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: finalText,
        parse_mode: "HTML",
        disable_web_page_preview: true
      })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[telegram] send failed", res.status, body, "text sent:", finalText.slice(0, 100));
      return { ok: false, error: `http_${res.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[telegram] send error", e);
    return { ok: false, error: e.message };
  }
}
const telegram_server = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  sendTelegram,
  sendTelegramTo
}, Symbol.toStringTag, { value: "Module" }));
export {
  explainNewsBaladi as a,
  sendTelegramTo as b,
  escapeHtml as e,
  formatBaladiBlock as f,
  sendTelegram as s,
  telegram_server as t
};
