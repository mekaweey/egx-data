/**
 * Server-only helpers that send Telegram alerts for new daily picks
 * and news shocks on active picks, with de-duplication via the
 * `pick_notifications` table (one row per pick_date+symbol+kind).
 */
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";
import { explainNewsBaladi, formatBaladiBlock } from "@/lib/notifications/baladi-explain.server";

async function alreadySent(pick_date: string, symbol: string, kind: string) {
  const { data } = await supabaseAdmin
    .from("pick_notifications")
    .select("id")
    .eq("pick_date", pick_date)
    .eq("symbol", symbol)
    .eq("kind", kind)
    .maybeSingle();
  return !!data;
}

async function markSent(pick_date: string, symbol: string, kind: string, payload?: unknown) {
  await supabaseAdmin
    .from("pick_notifications")
    .insert({
      pick_date,
      symbol,
      kind,
      payload: payload == null ? null : (JSON.parse(JSON.stringify(payload)) as never),
    })
    .select("id")
    .maybeSingle();
}

export type NewPickInfo = {
  pick_date: string;
  symbol: string;
  name_ar?: string | null;
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  reasons?: string[];
  newsScore?: number;
  source: "today" | "tomorrow" | "morning_brief";
};

export async function notifyNewPick(p: NewPickInfo): Promise<void> {
  const kind = `new_pick_${p.source}`;
  if (await alreadySent(p.pick_date, p.symbol, kind)) return;

  const sourceLabel =
    p.source === "today" ? "🎯 ترشيح اليوم"
    : p.source === "morning_brief" ? "🌅 صفقة الصباح"
    : "📅 ترشيح بكرا";

  const reasons = (p.reasons ?? []).slice(0, 4).map((r) => `• ${escapeHtml(r)}`).join("\n");
  const text =
    `<b>${sourceLabel}: ${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>)\n` +
    `💵 الدخول: <b>${p.entry.toFixed(2)}</b>\n` +
    `🎯 الهدف: <b>${p.target.toFixed(2)}</b>\n` +
    `🛑 وقف الخسارة: <b>${p.stop.toFixed(2)}</b>\n` +
    `📊 الثقة: <b>${p.confidence.toFixed(0)}%</b>` +
    (p.newsScore != null ? ` · أخبار: ${p.newsScore.toFixed(1)}` : "") +
    (reasons ? `\n\n<b>الأسباب:</b>\n${reasons}` : "");

  const res = await sendTelegram(text);
  if (res.ok) await markSent(p.pick_date, p.symbol, kind, p);
}

/**
 * Re-check news for today's open daily_picks and active positions.
 * Sends one alert per (symbol, headline) per day.
 */
export async function notifyNewsShocksForActive(): Promise<{ alerts: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: picks } = await supabaseAdmin
    .from("daily_picks")
    .select("symbol, name_ar")
    .eq("status", "open");

  const { data: positions } = await supabaseAdmin
    .from("positions")
    .select("symbol")
    .eq("status", "open");

  const symbols = Array.from(
    new Set([...(picks ?? []).map((p) => p.symbol), ...(positions ?? []).map((p) => p.symbol)]),
  );
  if (symbols.length === 0) return { alerts: 0 };

  const nameMap = new Map<string, string | null>(
    (picks ?? []).map((p) => [p.symbol, p.name_ar ?? null]),
  );

  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  const { data: news } = await supabaseAdmin
    .from("news_sentiment")
    .select("symbol, headline, sentiment, impact_level, sentiment_score, published_at")
    .in("symbol", symbols)
    .gte("published_at", since)
    .in("impact_level", ["high", "medium"])
    .order("published_at", { ascending: false });

  let alerts = 0;
  for (const n of news ?? []) {
    const kind = `news:${(n.headline ?? "").slice(0, 80)}`;
    if (await alreadySent(today, n.symbol, kind)) continue;

    const icon =
      n.sentiment === "negative" ? "⚠️"
      : n.sentiment === "positive" ? "📈"
      : "📰";
    const name = escapeHtml(nameMap.get(n.symbol) ?? n.symbol);
    let text =
      `<b>${icon} خبر جديد على ${name}</b> (<code>${n.symbol}</code>)\n` +
      `${escapeHtml(n.headline ?? "")}\n` +
      `الأثر: <b>${n.impact_level}</b> · المشاعر: <b>${n.sentiment}</b>` +
      (n.sentiment_score != null ? ` (${Number(n.sentiment_score).toFixed(2)})` : "");

    const baladi = await explainNewsBaladi({
      symbol: n.symbol,
      name: nameMap.get(n.symbol) ?? null,
      headline: n.headline ?? "",
      sentiment: n.sentiment,
      impact_level: n.impact_level,
      sentiment_score: n.sentiment_score,
    });
    if (baladi) text += formatBaladiBlock(baladi);

    const res = await sendTelegram(text);
    if (res.ok) {
      await markSent(today, n.symbol, kind, n);
      alerts++;
    }
  }
  return { alerts };
}