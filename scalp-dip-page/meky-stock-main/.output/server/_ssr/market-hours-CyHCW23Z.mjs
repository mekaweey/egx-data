import { i as index_default } from "../_libs/mendable__firecrawl-js.mjs";
import { supabaseAdmin } from "./client.server-D5ro3rAQ.mjs";
import { e as escapeHtml, s as sendTelegram, a as explainNewsBaladi, f as formatBaladiBlock } from "./telegram.server-D6g8flro.mjs";
async function getNewsSentiment(symbol, nameAr) {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const lovableKey = process.env.LOVABLE_API_KEY;
  if (!apiKey || !lovableKey) {
    return { score: 0, count: 0, headlines: [], blocked: false };
  }
  try {
    const fc = new index_default({ apiKey });
    const query = nameAr ? `${nameAr} سهم البورصة المصرية` : `${symbol} EGX stock`;
    const res = await fc.search(query, { limit: 5, tbs: "qdr:d" });
    const items = res?.web ?? res?.data ?? [];
    const headlines = items.map((r) => `${r.title ?? ""} — ${r.description ?? ""}`.trim()).filter((h) => h.length > 5).slice(0, 5);
    if (!headlines.length) return { score: 0, count: 0, headlines: [], blocked: false };
    const prompt = `حلّل أخبار سهم ${nameAr ?? symbol} ده وأرجع JSON فقط بهذا الشكل:
{"score": <رقم من -1 إلى +1>, "reason": "<سبب مختصر>"}

score = +1 خبر ممتاز جدا (نتائج قوية، عقود ضخمة، توزيعات)
score = +0.5 خبر إيجابي
score = 0 محايد أو لا علاقة بالسهم
score = -0.5 خبر سلبي
score = -1 خبر سلبي جدا (خسائر، شُبهات، تعليق تداول، تحقيقات)

الأخبار:
${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}`;
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }]
      })
    });
    if (!aiRes.ok) return { score: 0, count: headlines.length, headlines, blocked: false };
    const aiData = await aiRes.json();
    const text = aiData?.choices?.[0]?.message?.content ?? "";
    const m = text.match(/\{[\s\S]*?\}/);
    if (!m) return { score: 0, count: headlines.length, headlines, blocked: false };
    const parsed = JSON.parse(m[0]);
    const score = Math.max(-1, Math.min(1, Number(parsed.score) || 0));
    return {
      score,
      count: headlines.length,
      headlines,
      blocked: score <= -0.5
      // hard block on strongly negative news
    };
  } catch (err) {
    console.error("News sentiment failed for", symbol, err);
    return { score: 0, count: 0, headlines: [], blocked: false };
  }
}
async function alreadySent(pick_date, symbol, kind) {
  const { data } = await supabaseAdmin.from("pick_notifications").select("id").eq("pick_date", pick_date).eq("symbol", symbol).eq("kind", kind).maybeSingle();
  return !!data;
}
async function markSent(pick_date, symbol, kind, payload) {
  await supabaseAdmin.from("pick_notifications").insert({
    pick_date,
    symbol,
    kind,
    payload: payload == null ? null : JSON.parse(JSON.stringify(payload))
  }).select("id").maybeSingle();
}
async function notifyNewPick(p) {
  const kind = `new_pick_${p.source}`;
  if (await alreadySent(p.pick_date, p.symbol, kind)) return;
  const sourceLabel = p.source === "today" ? "🎯 ترشيح اليوم" : p.source === "morning_brief" ? "🌅 صفقة الصباح" : "📅 ترشيح بكرا";
  const reasons = (p.reasons ?? []).slice(0, 4).map((r) => `• ${escapeHtml(r)}`).join("\n");
  const text = `<b>${sourceLabel}: ${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>)
💵 الدخول: <b>${p.entry.toFixed(2)}</b>
🎯 الهدف: <b>${p.target.toFixed(2)}</b>
🛑 وقف الخسارة: <b>${p.stop.toFixed(2)}</b>
📊 الثقة: <b>${p.confidence.toFixed(0)}%</b>` + (p.newsScore != null ? ` · أخبار: ${p.newsScore.toFixed(1)}` : "") + (reasons ? `

<b>الأسباب:</b>
${reasons}` : "");
  const res = await sendTelegram(text);
  if (res.ok) await markSent(p.pick_date, p.symbol, kind, p);
}
async function notifyNewsShocksForActive() {
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const { data: picks } = await supabaseAdmin.from("daily_picks").select("symbol, name_ar").eq("status", "open");
  const { data: positions } = await supabaseAdmin.from("positions").select("symbol").eq("status", "open");
  const symbols = Array.from(
    /* @__PURE__ */ new Set([...(picks ?? []).map((p) => p.symbol), ...(positions ?? []).map((p) => p.symbol)])
  );
  if (symbols.length === 0) return { alerts: 0 };
  const nameMap = new Map(
    (picks ?? []).map((p) => [p.symbol, p.name_ar ?? null])
  );
  const since = new Date(Date.now() - 6 * 3600 * 1e3).toISOString();
  const { data: news } = await supabaseAdmin.from("news_sentiment").select("symbol, headline, sentiment, impact_level, sentiment_score, published_at").in("symbol", symbols).gte("published_at", since).in("impact_level", ["high", "medium"]).order("published_at", { ascending: false });
  let alerts = 0;
  for (const n of news ?? []) {
    const kind = `news:${(n.headline ?? "").slice(0, 80)}`;
    if (await alreadySent(today, n.symbol, kind)) continue;
    const icon = n.sentiment === "negative" ? "⚠️" : n.sentiment === "positive" ? "📈" : "📰";
    const name = escapeHtml(nameMap.get(n.symbol) ?? n.symbol);
    let text = `<b>${icon} خبر جديد على ${name}</b> (<code>${n.symbol}</code>)
${escapeHtml(n.headline ?? "")}
الأثر: <b>${n.impact_level}</b> · المشاعر: <b>${n.sentiment}</b>` + (n.sentiment_score != null ? ` (${Number(n.sentiment_score).toFixed(2)})` : "");
    const baladi = await explainNewsBaladi({
      symbol: n.symbol,
      name: nameMap.get(n.symbol) ?? null,
      headline: n.headline ?? "",
      sentiment: n.sentiment,
      impact_level: n.impact_level,
      sentiment_score: n.sentiment_score
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
const AR_DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر"
];
function getCairoNow(now = /* @__PURE__ */ new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).formatToParts(now);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return new Date(Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second")
  ));
}
function getMarketStatus(now = /* @__PURE__ */ new Date()) {
  const c = getCairoNow(now);
  const day = c.getUTCDay();
  const h = c.getUTCHours();
  const m = c.getUTCMinutes();
  const s = c.getUTCSeconds();
  const minutes = h * 60 + m;
  const isWeekday = day >= 0 && day <= 4;
  const OPEN = 10 * 60;
  const CLOSE = 14 * 60 + 30;
  let isOpen = false;
  let label = "";
  if (isWeekday && minutes >= OPEN && minutes < CLOSE) {
    isOpen = true;
    const left = CLOSE - minutes;
    label = left > 60 ? `السوق مفتوح · باقي ${Math.floor(left / 60)}س ${left % 60}د` : `السوق مفتوح · باقي ${left} دقيقة`;
  } else if (isWeekday && minutes < OPEN) {
    const left = OPEN - minutes;
    label = `مغلق · يفتح بعد ${Math.floor(left / 60)}س ${left % 60}د`;
  } else {
    label = "السوق مغلق";
  }
  const pad = (n) => String(n).padStart(2, "0");
  return {
    isOpen,
    cairoTime: c,
    label,
    hhmmss: `${pad(h)}:${pad(m)}:${pad(s)}`,
    dateLabel: `${AR_DAYS[day]} ${c.getUTCDate()} ${AR_MONTHS[c.getUTCMonth()]}`
  };
}
export {
  getNewsSentiment as a,
  notifyNewsShocksForActive as b,
  getCairoNow as c,
  getMarketStatus as g,
  notifyNewPick as n
};
