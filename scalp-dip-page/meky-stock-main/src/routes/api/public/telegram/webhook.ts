import { createFileRoute } from "@tanstack/react-router";
import { createHash, timingSafeEqual } from "crypto";
import { generateText } from "ai";
import { getAiGateway, AI_MODEL } from "@/lib/ai/gateway.server";
import { sendTelegramTo } from "@/lib/notifications/telegram.server";
import { buildBotContext, detectMentionedSymbol } from "@/lib/notifications/bot-context.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Telegram inbound webhook — يخلّيك تتكلم مع البوت في أي وقت.
 * يدعم:
 *  - أوامر سريعة: /start /help /status /picks /positions /news /perf
 *  - أسئلة حرّة بالعربي/الإنجليزي يردّ عليها AI بناءً على بيانات النظام الحيّة.
 * الأمان: secret_token مشتقّ من TELEGRAM_API_KEY (مطابق لطريقة التسجيل).
 */

function deriveWebhookSecret(apiKey: string): string {
  return createHash("sha256").update(`telegram-webhook:${apiKey}`).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

function isAuthorizedChat(chatId: number | string): boolean {
  const allowed = process.env.TELEGRAM_CHAT_ID;
  if (!allowed) return true; // إن لم يُعرَّف، نسمح (للتطوير) — في الإنتاج يفضّل تعيينه
  return String(chatId) === String(allowed);
}

/**
 * لوحة أزرار ثابتة تظهر تحت مربع الكتابة دائمًا — تختصر كتابة الأوامر.
 * الأزرار بتبعت نص الأمر نفسه فيشتغل مع handleSlash بدون أي تغيير إضافي.
 */
const PERSISTENT_KEYBOARD = {
  keyboard: [
    [{ text: "⭐ /picks" }, { text: "💼 /positions" }],
    [{ text: "📊 /status" }, { text: "📈 /perf" }],
    [{ text: "📰 /news" }, { text: "❓ /help" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "اكتب سؤالك أو اختر أمر…",
};

/** يستخرج /command من أي زر مكتوب بصيغة "إيموجي /command". */
function normalizeButtonText(text: string): string {
  const m = text.match(/\/[a-zA-Z_]+/);
  return m ? m[0] : text;
}

async function handleSlash(cmd: string, ctx: Awaited<ReturnType<typeof buildBotContext>>): Promise<string> {
  const c = cmd.toLowerCase().split(/\s+/)[0];
  if (c === "/start" || c === "/help") {
    return [
      "👋 <b>أهلًا بك في مساعد تحليل البورصة</b>",
      "",
      "اسألني أي حاجة بالعربي عن:",
      "• الترشيحات اليومية",
      "• المراكز المفتوحة",
      "• حالة السوق",
      "• أداء الأسبوع",
      "• خبر عن سهم معين",
      "",
      "أوامر سريعة:",
      "• /status — حالة النظام",
      "• /picks — ترشيحات اليوم",
      "• /positions — مراكزي المفتوحة",
      "• /news — آخر الأخبار",
      "• /perf — أداء آخر 7 أيام",
    ].join("\n");
  }
  if (c === "/status") {
    const m = ctx.market as null | { index_symbol?: string; close?: number; change_pct?: number; trend?: string };
    const parts = ["📊 <b>حالة النظام:</b>"];
    if (m) parts.push(`• المؤشر ${escapeHtml(m.index_symbol ?? "—")}: ${m.close?.toFixed(2) ?? "—"} (${m.change_pct?.toFixed(2) ?? "0"}%)`);
    parts.push(`• ترشيحات اليوم: ${ctx.picks.length}`);
    parts.push(`• توصيات شراء حديثة: ${ctx.recommendations.length}`);
    parts.push(`• مراكز مفتوحة: ${ctx.positions.length}`);
    parts.push(`• أخبار آخر 24س: ${ctx.news.length}`);
    parts.push(`• تنبيهات بيع: ${ctx.alerts.length}`);
    return parts.join("\n");
  }
  if (c === "/picks") {
    if (!ctx.picks.length) return "لا توجد ترشيحات لهذا اليوم بعد.";
    const lines = ["⭐ <b>ترشيحات اليوم:</b>"];
    for (const p of ctx.picks as Array<{ symbol: string; confidence: number; entry_price: number; target_price: number; stop_price: number; target_pct: number | null }>) {
      lines.push(`• ${escapeHtml(p.symbol)} — ثقة ${p.confidence}% · هدف +${Number(p.target_pct ?? 0).toFixed(1)}%`);
      lines.push(`  دخول ${Number(p.entry_price).toFixed(2)} · هدف ${Number(p.target_price).toFixed(2)} · وقف ${Number(p.stop_price).toFixed(2)}`);
    }
    return lines.join("\n");
  }
  if (c === "/positions") {
    if (!ctx.positions.length) return "لا توجد مراكز مفتوحة حاليًا.";
    const lines = ["💼 <b>المراكز المفتوحة:</b>"];
    for (const p of ctx.positions as Array<{ symbol: string; entry_price: number; current_price: number | null; pnl_pct: number | null; target_price: number | null; stop_loss: number | null }>) {
      const arrow = (p.pnl_pct ?? 0) >= 0 ? "🟢" : "🔴";
      lines.push(`${arrow} ${escapeHtml(p.symbol)} — PnL ${p.pnl_pct?.toFixed(2) ?? "—"}%`);
      lines.push(`  دخول ${Number(p.entry_price).toFixed(2)}${p.current_price ? ` · حالي ${Number(p.current_price).toFixed(2)}` : ""}${p.target_price ? ` · هدف ${Number(p.target_price).toFixed(2)}` : ""}`);
    }
    return lines.join("\n");
  }
  if (c === "/news") {
    if (!ctx.news.length) return "لا توجد أخبار جديدة آخر 24 ساعة.";
    const lines = ["📰 <b>آخر الأخبار:</b>"];
    for (const n of (ctx.news as Array<{ symbol: string; headline: string; sentiment_score: number }>).slice(0, 8)) {
      const e = n.sentiment_score > 0.15 ? "📈" : n.sentiment_score < -0.15 ? "📉" : "•";
      lines.push(`${e} ${escapeHtml(n.symbol)}: ${escapeHtml((n.headline ?? "").slice(0, 120))}`);
    }
    return lines.join("\n");
  }
  if (c === "/perf") {
    const s = ctx.weekStats;
    if (!s.total) return "لا توجد توصيات مكتملة خلال آخر 7 أيام بعد.";
    const acc = ((s.wins / s.total) * 100).toFixed(1);
    return `📈 <b>أداء آخر 7 أيام:</b>\n• مكتملة: ${s.total}\n• ناجحة: ${s.wins}\n• الدقة: ${acc}%\n• متوسط العائد: ${s.avgReturnPct}%`;
  }
  return "أمر غير معروف. ابعت /help للأوامر المتاحة.";
}

function buildAiSystemPrompt(ctx: Awaited<ReturnType<typeof buildBotContext>>): string {
  const m = ctx.market as null | { index_symbol?: string; close?: number; change_pct?: number; change_5d_pct?: number; trend?: string };
  const picks = (ctx.picks as Array<{ symbol: string; confidence: number; target_pct: number | null; entry_price: number; target_price: number; stop_price: number }>)
    .map((p) => `${p.symbol}: ثقة ${p.confidence}%، دخول ${p.entry_price}، هدف ${p.target_price} (+${p.target_pct ?? 0}%)، وقف ${p.stop_price}`)
    .join(" | ");
  const recs = (ctx.recommendations as Array<{ symbol: string; signal: string; confidence: number; expected_next_day_pct: number | null }>)
    .slice(0, 8).map((r) => `${r.symbol}(${r.signal} ${r.confidence}%${r.expected_next_day_pct != null ? `، متوقع +${r.expected_next_day_pct}%` : ""})`).join(", ");
  const positions = (ctx.positions as Array<{ symbol: string; entry_price: number; current_price: number | null; pnl_pct: number | null; target_price: number | null }>)
    .map((p) => `${p.symbol}: PnL ${p.pnl_pct ?? "—"}%، دخول ${p.entry_price}، حالي ${p.current_price ?? "—"}، هدف ${p.target_price ?? "—"}`)
    .join(" | ");
  const news = (ctx.news as Array<{ symbol: string; headline: string; sentiment_score: number }>)
    .slice(0, 6).map((n) => `[${n.symbol} ${n.sentiment_score?.toFixed(2)}] ${n.headline}`).join("\n");
  const snap = ctx.symbolSnapshot as null | { symbol: string; close: number; change_pct: number; rsi14: number; macd_hist: number; vol_ratio: number; support: number; resistance: number };

  return [
    "أنت مساعد ذكي لنظام تحليل أسهم البورصة المصرية (EGX).",
    "ردّ بالعربية الفصحى أو العامية المصرية المختصرة. كن دقيقًا، ابن إجابتك على البيانات المتاحة فقط.",
    "لا تخترع أرقامًا أو أحداثًا غير موجودة. لو البيانات ناقصة قُل ذلك صراحة.",
    "نسّق الأرقام بفاصلة عشرية واحدة أو اثنين. استخدم HTML بسيط (<b>) عند اللزوم. لا تستخدم Markdown.",
    "تنبيه قانوني: لا تقدّم نصيحة استثمارية قاطعة — وضّح أن البيانات للاسترشاد.",
    "",
    "=== بيانات النظام الحالية ===",
    `التاريخ: ${ctx.today}`,
    m ? `السوق: ${m.index_symbol} ${m.close} (تغير اليوم ${m.change_pct ?? 0}%، 5 أيام ${m.change_5d_pct ?? 0}%، اتجاه ${m.trend ?? "—"})` : "السوق: لا توجد بيانات",
    "",
    `ترشيحات اليوم (${ctx.picks.length}): ${picks || "لا يوجد"}`,
    "",
    `توصيات شراء حديثة: ${recs || "لا يوجد"}`,
    "",
    `المراكز المفتوحة (${ctx.positions.length}): ${positions || "لا يوجد"}`,
    "",
    `إحصاء آخر 7 أيام: ${ctx.weekStats.total} توصية مكتملة، ${ctx.weekStats.wins} ناجحة، متوسط العائد ${ctx.weekStats.avgReturnPct}%`,
    "",
    "أحدث الأخبار:",
    news || "(لا يوجد)",
    snap ? `\nبيانات السهم المذكور ${snap.symbol}: سعر ${snap.close}، تغير ${snap.change_pct}%، RSI ${snap.rsi14}، MACDhist ${snap.macd_hist}، نسبة الحجم ${snap.vol_ratio}، دعم ${snap.support}، مقاومة ${snap.resistance}` : "",
  ].join("\n");
}

async function answerWithAi(userText: string, ctx: Awaited<ReturnType<typeof buildBotContext>>): Promise<string> {
  try {
    const gateway = getAiGateway();
    const { text } = await generateText({
      model: gateway(AI_MODEL),
      system: buildAiSystemPrompt(ctx),
      prompt: userText.slice(0, 800),
      maxOutputTokens: 600,
      temperature: 0.4,
    });
    const cleaned = (text ?? "").trim();
    return cleaned || "معذرة، مفيش رد متاح دلوقتي. حاول تاني بعد دقيقة.";
  } catch (e) {
    console.error("[telegram-webhook] ai error", e);
    return "حدث خطأ مؤقت في المحلل الذكي. حاول مرة أخرى أو استخدم /status للحصول على ملخص.";
  }
}

export const Route = createFileRoute("/api/public/telegram/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const apiKey = process.env.TELEGRAM_API_KEY;
          if (!apiKey) return new Response("not configured", { status: 503 });

          const expected = deriveWebhookSecret(apiKey);
          const actual = request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
          if (!safeEqual(actual, expected)) {
            return new Response("Unauthorized", { status: 401 });
          }

          const update = await request.json().catch(() => null) as null | {
            message?: { chat?: { id: number }; text?: string; from?: { id: number } };
            edited_message?: { chat?: { id: number }; text?: string };
          };
          const msg = update?.message ?? update?.edited_message;
          const chatId = msg?.chat?.id;
          const rawText = (msg?.text ?? "").trim();
          const text = rawText.startsWith("/") || /\/[a-zA-Z_]+/.test(rawText)
            ? normalizeButtonText(rawText)
            : rawText;

          if (!chatId || !text) return Response.json({ ok: true, ignored: true });

          if (!isAuthorizedChat(chatId)) {
            await sendTelegramTo(chatId, "هذا البوت مخصّص لمستخدم محدد. عذرًا.");
            return Response.json({ ok: true, unauthorized: true });
          }

          // Build context (with optional symbol detection)
          const symbol = await detectMentionedSymbol(text).catch(() => null);
          const ctx = await buildBotContext({ symbol: symbol ?? undefined });

          let reply: string;
          if (text.startsWith("/")) {
            reply = await handleSlash(text, ctx);
          } else {
            reply = await answerWithAi(text, ctx);
          }

          // Telegram caps at 4096 chars
          if (reply.length > 3900) reply = reply.slice(0, 3900) + "\n…";

          await sendTelegramTo(chatId, reply, { reply_markup: PERSISTENT_KEYBOARD });
          return Response.json({ ok: true });
        } catch (e) {
          console.error("[telegram-webhook] error", e);
          return Response.json({ ok: false, error: (e as Error).message }, { status: 200 });
        }
      },
    },
  },
});