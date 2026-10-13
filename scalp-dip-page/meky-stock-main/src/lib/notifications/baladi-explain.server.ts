/**
 * Generates a short Egyptian-colloquial ("baladi") explanation of a news
 * headline: what it means, what it affects, and the likely impact on the
 * stock price. Used at the end of news Telegram alerts. Fail-open: returns
 * null if no AI provider is available so the alert is still sent.
 */
import { chatWithFallback } from "@/lib/ai/chat-fallback.server";
import { escapeHtml } from "@/lib/utils/html-escape";

export interface BaladiInput {
  symbol: string;
  name?: string | null;
  headline: string;
  sentiment?: string | null;
  impact_level?: string | null;
  sentiment_score?: number | null;
}

export async function explainNewsBaladi(n: BaladiInput): Promise<string | null> {
  const sys =
    "انت محلل بورصة مصرية بتشرح للناس البسطاء. اشرح الخبر ب اللهجة المصرية البلدية " +
    "السهلة، من غير مصطلحات صعبة. لازم تجاوب على 3 حاجات بإختصار شديد: " +
    "1) الخبر ده يعني إيه ب البلدي. 2) هيأثر على إيه. 3) السهم متوقع يتحرك إزاي " +
    "(يطلع كتير / يطلع شويه / تقريباً مفيش تأثير / ينزل شويه / ينزل كتير) و ليه. " +
    "خلي الرد كله أقل من 60 كلمة، جمل قصيرة، من غير عناوين أو رموز markdown.";

  const user =
    `السهم: ${n.name ?? n.symbol} (${n.symbol})\n` +
    `الخبر: ${n.headline}\n` +
    (n.sentiment ? `تصنيف المشاعر: ${n.sentiment}\n` : "") +
    (n.impact_level ? `قوة الأثر: ${n.impact_level}\n` : "") +
    (n.sentiment_score != null ? `درجة المشاعر: ${Number(n.sentiment_score).toFixed(2)}\n` : "");

  const out = await chatWithFallback({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    temperature: 0.3,
    timeoutMs: 9000,
  });
  if (!out) return null;
  const cleaned = out.trim().replace(/^["'`*_>#\s-]+|["'`*_\s]+$/g, "");
  return cleaned || null;
}

export function formatBaladiBlock(text: string): string {
  return `\n\n<b>🗣️ ب البلدي كده:</b>\n${escapeHtml(text)}`;
}

/**
 * يلخّص رسالة تليجرام كاملة في سطرين باللهجة المصرية البلدية.
 * بيتنادى تلقائياً من sendTelegram عشان كل اشعار يكون في آخره خلاصة مفهومة.
 * Fail-open: لو الـ AI مش متاح يرجّع null و الرسالة بتتبعت من غير خلاصة.
 */
export async function summarizeMessageBaladi(htmlText: string): Promise<string | null> {
  const plain = htmlText
    .replace(/<[^>]+>/g, "")
    .replace(/━+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (plain.length < 60) return null;

  const sys =
    "انت محلل بورصة مصرية. هتقرا اشعار طويل و تلخّصه في سطرين بحد أقصى ب اللهجة " +
    "المصرية البلدية السهلة. لازم توضح: 1) الاشعار ده يعني إيه ب اختصار. " +
    "2) إيه أهم حاجة المستخدم يعملها أو يركز عليها. " +
    "ممنوع مصطلحات صعبة، ممنوع markdown، ممنوع عناوين، سطرين بس و خلاص.";

  const out = await chatWithFallback({
    messages: [
      { role: "system", content: sys },
      { role: "user", content: plain.slice(0, 2500) },
    ],
    temperature: 0.3,
    timeoutMs: 7000,
  });
  if (!out) return null;
  const cleaned = out.trim().replace(/^["'`*_>#\s-]+|["'`*_\s]+$/g, "");
  return cleaned || null;
}

export function formatBaladiSummary(text: string): string {
  return `\n\n━━━━━━━━━━━━━━━\n<b>🗣️ خلاصة ب البلدي:</b>\n${escapeHtml(text)}`;
}