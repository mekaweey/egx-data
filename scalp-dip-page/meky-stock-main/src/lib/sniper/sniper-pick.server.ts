import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getNewsSentiment } from "@/lib/today/news-sentiment.server";

/**
 * V3 STACK filter — picks ONE stock per day with the highest composite score.
 * Mirrors scripts/sniper-v3.ts but trimmed to production essentials.
 */

type Candle = { date: string; o: number; h: number; l: number; c: number; v: number };

function sma(a: Candle[], e: number, n: number) {
  if (e + 1 < n) return null;
  let s = 0; for (let i = e - n + 1; i <= e; i++) s += a[i].c; return s / n;
}
function avgV(a: Candle[], e: number, n: number) {
  if (e + 1 < n) return null;
  let s = 0; for (let i = e - n + 1; i <= e; i++) s += a[i].v; return s / n;
}
function rsi(a: Candle[], e: number, n = 14) {
  if (e < n) return null;
  let g = 0, l = 0;
  for (let i = e - n + 1; i <= e; i++) { const d = a[i].c - a[i - 1].c; if (d > 0) g += d; else l -= d; }
  if (l === 0) return 100; return 100 - 100 / (1 + (g / n) / (l / n));
}

export type SniperPick = {
  symbol: string;
  name_ar: string | null;
  investing_slug: string | null;
  yahoo_symbol: string;
  prev_close: number;
  score: number;
  reasons: string[];
  confidence: number;
  negative_reasons: string[];
};

export async function computeTodayPick(): Promise<SniperPick | null> {
  const { data: stocks } = await supabaseAdmin
    .from("stocks").select("symbol,name_ar,yahoo_symbol,investing_slug")
    .eq("is_sharia", true).eq("is_active", true);
  if (!stocks?.length) return null;

  // Load last 80 candles per symbol
  const symbols = stocks.map((s) => s.symbol);
  const rows: { symbol: string; date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  for (let f = 0; ; f += 1000) {
    const { data } = await supabaseAdmin
      .from("daily_candles")
      .select("symbol,date,open,high,low,close,volume")
      .in("symbol", symbols)
      .order("date", { ascending: false })
      .range(f, f + 999);
    if (!data?.length) break;
    rows.push(...data.map((r) => ({
      symbol: r.symbol, date: r.date.slice(0, 10),
      open: +r.open, high: +r.high, low: +r.low, close: +r.close, volume: +r.volume,
    })));
    if (data.length < 1000) break;
    if (rows.length > 200_000) break;
  }

  const bySym = new Map<string, Candle[]>();
  for (const r of rows) {
    const a = bySym.get(r.symbol) ?? [];
    a.push({ date: r.date, o: r.open, h: r.high, l: r.low, c: r.close, v: r.volume });
    bySym.set(r.symbol, a);
  }
  for (const a of bySym.values()) a.sort((x, y) => x.date.localeCompare(y.date));

  type Cand = {
    stock: typeof stocks[number];
    score: number;
    confidence: number;
    reasons: string[];
    negatives: string[];
    prevClose: number;
  };
  const cands: Cand[] = [];

  for (const s of stocks) {
    const a = bySym.get(s.symbol); if (!a || a.length < 60) continue;
    const i = a.length - 1; const today = a[i], yest = a[i - 1];
    const av20 = avgV(a, i, 20); if (!av20 || av20 < 5000) continue;
    if (today.c < 1 || today.c > 500) continue;
    if (today.v === 0 || yest.v === 0) continue;
    const m20 = sma(a, i, 20), m50 = sma(a, i, 50); if (!m20 || !m50) continue;
    const av3 = avgV(a, i, 3)!;
    const volR = today.v / av20;
    const cp = today.h > today.l ? (today.c - today.l) / (today.h - today.l) : 0;
    const mom5 = today.c / a[i - 5].c - 1;
    const vt = av3 / av20;
    const dayPct = today.c / yest.c - 1;
    if (dayPct > 0.12) continue; // skip extreme overnight gaps

    const r = rsi(a, i, 14);

    // ============= Confidence model (0-100) =============
    let confidence = 0;
    const reasons: string[] = [];
    const negatives: string[] = [];

    // Volume ratio (max 25)
    if (volR >= 5)      { confidence += 25; reasons.push(`🔥 حجم استثنائي ${volR.toFixed(1)}x المتوسط`); }
    else if (volR >= 3) { confidence += 18; reasons.push(`📊 حجم قوي ${volR.toFixed(1)}x المتوسط`); }
    else if (volR >= 2) { confidence += 10; reasons.push(`حجم فوق المتوسط ${volR.toFixed(1)}x`); }
    else if (volR >= 1) { confidence += 4;  negatives.push(`⚠️ حجم تداول عادي (${volR.toFixed(1)}x المتوسط فقط)`); }
    else                { negatives.push(`⚠️ حجم تداول منخفض جداً (${volR.toFixed(2)}x)`); }

    // Momentum 5d (max 20)
    if (mom5 >= 0.06)      { confidence += 20; reasons.push(`🚀 زخم قوي +${(mom5 * 100).toFixed(1)}% في 5 أيام`); }
    else if (mom5 >= 0.04) { confidence += 15; reasons.push(`📈 زخم جيد +${(mom5 * 100).toFixed(1)}% في 5 أيام`); }
    else if (mom5 >= 0.02) { confidence += 8;  reasons.push(`زخم خفيف +${(mom5 * 100).toFixed(1)}%`); }
    else if (mom5 >= 0)    { confidence += 3;  negatives.push(`⚠️ زخم ضعيف (${(mom5 * 100).toFixed(1)}% في 5 أيام)`); }
    else                   { negatives.push(`❌ السهم نازل ${(mom5 * 100).toFixed(1)}% في آخر 5 أيام`); }

    // Close position in daily range (max 15)
    if (cp >= 0.9)      { confidence += 15; reasons.push(`✅ إغلاق عند القمة (${(cp * 100).toFixed(0)}% من المدى)`); }
    else if (cp >= 0.7) { confidence += 10; reasons.push(`إغلاق قوي قرب القمة`); }
    else if (cp >= 0.5) { confidence += 5; }
    else                { negatives.push(`⚠️ إغلاق بعيد عن القمة (في ${(cp * 100).toFixed(0)}% من مدى اليوم فقط)`); }

    // Trend filters (max 20)
    if (today.c > m20) { confidence += 10; reasons.push(`فوق متوسط 20 يوم`); }
    else               { negatives.push(`❌ السعر تحت متوسط 20 يوم`); }
    if (today.c > m50) { confidence += 10; reasons.push(`فوق متوسط 50 يوم (اتجاه صاعد)`); }
    else               { negatives.push(`❌ السعر تحت متوسط 50 يوم (الاتجاه الكبير هابط)`); }

    // Volume trend (max 10)
    if (vt >= 2)        { confidence += 10; reasons.push(`📊 الحجم بيتصاعد (${vt.toFixed(1)}x)`); }
    else if (vt >= 1.5) { confidence += 7; }
    else if (vt >= 1)   { confidence += 4; }
    else                { negatives.push(`⚠️ الحجم بيقل في آخر 3 أيام`); }

    // RSI (max 10)
    if (r != null) {
      if (r >= 50 && r <= 70)      { confidence += 10; reasons.push(`RSI متوازن (${r.toFixed(0)})`); }
      else if (r > 70 && r <= 78)  { confidence += 5;  negatives.push(`⚠️ RSI مرتفع (${r.toFixed(0)}) - قرب التشبع`); }
      else if (r > 78)             { negatives.push(`🚨 تشبع شرائي خطير (RSI=${r.toFixed(0)})`); }
      else if (r >= 40)            { confidence += 5; }
      else                         { negatives.push(`⚠️ RSI ضعيف (${r.toFixed(0)})`); }
    }

    // Penalize big overnight pop (mean reversion risk)
    if (dayPct > 0.08) negatives.push(`⚠️ ارتفاع كبير أمس (+${(dayPct * 100).toFixed(1)}%) - مخاطر تصحيح`);

    const score = volR + vt + mom5 * 10 + cp * 3 + (today.c > m50 ? 1 : 0) - (r != null && r > 78 ? 5 : 0);

    cands.push({
      stock: s,
      score,
      confidence: Math.max(0, Math.min(100, Math.round(confidence))),
      reasons,
      negatives,
      prevClose: today.c,
    });
  }

  // Pick by confidence first, score as tiebreaker
  cands.sort((a, b) => (b.confidence - a.confidence) || (b.score - a.score));

  // News gate: try top 5 candidates, skip if strongly negative news, bonus if strongly positive
  let top: typeof cands[0] | null = null;
  let newsReasons: string[] = [];
  let newsNegatives: string[] = [];
  let newsBonus = 0;
  for (const c of cands.slice(0, 5)) {
    const news = await getNewsSentiment(c.stock.symbol, c.stock.name_ar);
    if (news.blocked) {
      // strongly negative news → skip this candidate, try next
      continue;
    }
    if (news.score >= 0.5) {
      newsBonus = 5;
      newsReasons = [`📰 خبر إيجابي مؤكد (${news.count} مصدر) — ثقة +5`];
    } else if (news.score >= 0.2) {
      newsReasons = [`📰 ${news.count} خبر إيجابي خفيف`];
    } else if (news.count > 0) {
      newsNegatives = [`📰 ${news.count} خبر محايد`];
    }
    top = c;
    break;
  }
  if (!top) top = cands[0]; // fallback if all blocked
  if (!top) return null;

  return {
    symbol: top.stock.symbol,
    name_ar: top.stock.name_ar,
    investing_slug: top.stock.investing_slug,
    yahoo_symbol: top.stock.yahoo_symbol,
    prev_close: top.prevClose,
    score: top.score,
    reasons: [...newsReasons, ...top.reasons],
    confidence: Math.min(100, top.confidence + newsBonus),
    negative_reasons: [...newsNegatives, ...top.negatives],
  };
}