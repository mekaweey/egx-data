/**
 * Post-scan Telegram summary: lists the top buy recommendations for the
 * next session, with the actual reasoning + news headlines used to pick them.
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

export async function notifyScanSummary(scanId: string): Promise<{ sent: boolean; picks: number }> {
  const { data: recs } = await supabaseAdmin
    .from("recommendations")
    .select(
      "symbol, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, expected_gain_pct, expected_next_day_pct, technical_score, sentiment_score, market_trend, signal, rejected_by_rules",
    )
    .eq("scan_id", scanId)
    .eq("signal", "buy")
    .eq("rejected_by_rules", false)
    .order("confidence", { ascending: false })
    .limit(5);

  if (!recs || recs.length === 0) {
    await sendTelegram(
      `<b>🔍 خلص التحديث</b>\nمفيش ترشيحات شراء قويه دلوقتي — السوق مش معطي إشارات واضحه.\nهنحاول تاني في التحديث الجاي.`,
    );
    return { sent: true, picks: 0 };
  }

  const symbols = recs.map((r) => String(r.symbol));
  const [{ data: stocks }, { data: news }] = await Promise.all([
    supabaseAdmin.from("stocks").select("symbol, name_ar").in("symbol", symbols),
    supabaseAdmin
      .from("news_sentiment")
      .select("symbol, headline, sentiment, impact_level, published_at")
      .in("symbol", symbols)
      .gte("published_at", new Date(Date.now() - 48 * 3600 * 1000).toISOString())
      .order("published_at", { ascending: false }),
  ]);

  const nameMap = new Map((stocks ?? []).map((s) => [String(s.symbol), String(s.name_ar)]));
  const newsBySym = new Map<string, Array<{ headline: string; sentiment: string; impact: string }>>();
  for (const n of news ?? []) {
    const sym = String(n.symbol);
    const arr = newsBySym.get(sym) ?? [];
    if (arr.length < 2) {
      arr.push({
        headline: String(n.headline ?? ""),
        sentiment: String(n.sentiment ?? "neutral"),
        impact: String(n.impact_level ?? "low"),
      });
      newsBySym.set(sym, arr);
    }
  }

  const blocks = recs.map((r, i) => {
    const sym = String(r.symbol);
    const name = escapeHtml(nameMap.get(sym) ?? sym);
    const reasons = Array.isArray(r.reasons_ar) ? (r.reasons_ar as unknown[]).map(String) : [];
    const reasonsText = reasons.slice(0, 4).map((x) => `   • ${escapeHtml(x)}`).join("\n");
    const entry = r.entry_min != null && r.entry_max != null
      ? `${Number(r.entry_min).toFixed(2)}–${Number(r.entry_max).toFixed(2)}`
      : "—";
    const tgt = r.target != null ? Number(r.target).toFixed(2) : "—";
    const stp = r.stop_loss != null ? Number(r.stop_loss).toFixed(2) : "—";
    const expDay = r.expected_next_day_pct != null ? `${Number(r.expected_next_day_pct).toFixed(1)}%` : null;
    const expTotal = r.expected_gain_pct != null ? `${Number(r.expected_gain_pct).toFixed(1)}%` : null;
    const tech = r.technical_score != null ? Number(r.technical_score).toFixed(0) : null;
    const sent = r.sentiment_score != null ? Number(r.sentiment_score).toFixed(2) : null;

    const newsArr = newsBySym.get(sym) ?? [];
    const newsLines = newsArr.length
      ? "\n   <i>📰 من الأخبار اللي اتحللت:</i>\n" +
        newsArr.map((n) => {
          const icon = n.sentiment === "positive" ? "📈" : n.sentiment === "negative" ? "⚠️" : "📰";
          return `   ${icon} ${escapeHtml(n.headline.slice(0, 110))}`;
        }).join("\n")
      : "";

    const scoresParts: string[] = [];
    if (tech) scoresParts.push(`فني ${tech}/100`);
    if (sent) scoresParts.push(`أخبار ${sent}`);
    const scoresLine = scoresParts.length ? `\n   <i>📊 ${scoresParts.join(" · ")}</i>` : "";

    const expLine = expDay || expTotal
      ? `\n   <i>📈 توقع: ${expDay ? `بكرا ${expDay}` : ""}${expDay && expTotal ? " · " : ""}${expTotal ? `إجمالي ${expTotal}` : ""}</i>`
      : "";

    return (
      `<b>${i + 1}. ${name}</b> (<code>${escapeHtml(sym)}</code>) — ثقة ${r.confidence}%\n` +
      `   💵 دخول: <b>${entry}</b> · 🎯 ${tgt} · 🛑 ${stp}` +
      expLine +
      scoresLine +
      (reasonsText ? `\n   <i>💡 ليه اترشح:</i>\n${reasonsText}` : "") +
      newsLines
    );
  });

  const header = `<b>🤖 خلص التحديث — ${recs.length} ترشيح لجلسة الغد</b>\n` +
    `<i>التوقيت: ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "short", timeStyle: "short" })}</i>\n`;

  const message = [header, ...blocks, `\n<i>⚠️ راجع الأسعار قبل الشراء وادخل بحجم مناسب لرأس مالك.</i>`].join("\n\n");

  // Telegram limit is 4096 chars; split if needed
  const MAX = 3900;
  if (message.length <= MAX) {
    await sendTelegram(message);
  } else {
    let buf = header;
    for (const b of blocks) {
      if ((buf + "\n\n" + b).length > MAX) {
        await sendTelegram(buf);
        buf = "";
      }
      buf += (buf ? "\n\n" : "") + b;
    }
    if (buf) await sendTelegram(buf);
  }

  return { sent: true, picks: recs.length };
}