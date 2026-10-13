import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type MarketPulse = {
  date: string;
  ready: boolean;        // 10:30 Cairo عدّت أم لا
  active: number;
  avgMovePct: number;    // متوسط حركة أول 30د (%)
  pctUp: number;         // % رموز صاعدة
  pctDip: number;        // % رموز هبطت ≥1.5%
  label: "ممتازة" | "جيدة جداً" | "مقبولة" | "سيئة" | "—";
  labelColor: "bull" | "warn" | "muted" | "bear" | "neutral";
  expectedPnl: number;   // متوسط متوقع بالجنيه بناءً على أيام مشابهة
  expectedRange: string; // مدى تقديري
  expectedSignals: string; // توقع عدد إشارات Scalp Live حسب جودة اليوم
  note: string;          // شرح صريح
};

/**
 * يحسب نبض السوق في أول 30 دقيقة من جلسة اليوم (10:00–10:30 توقيت القاهرة)
 * بناءً على live_ticks، ويرجّع تصنيف + توقع PnL مبني على أيام 07–11/06 المرجعية.
 * (5 أيام بس متاحة دلوقتي — التوقع تقريبي وهيتحسّن لما البيانات تكبر)
 */
export const getMarketPulse = createServerFn({ method: "GET" }).handler(async (): Promise<MarketPulse> => {
  const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
  const dateStr = cairoNow.toISOString().slice(0, 10);
  // احسب إزاحة القاهرة عن UTC ديناميكياً (UTC+2 شتاءً / UTC+3 صيفاً)
  const probe = new Date(`${dateStr}T12:00:00Z`);
  const cairoMs = new Date(probe.toLocaleString("en-US", { timeZone: "Africa/Cairo" })).getTime();
  const utcMs = new Date(probe.toLocaleString("en-US", { timeZone: "UTC" })).getTime();
  const offsetHours = Math.round((cairoMs - utcMs) / 3_600_000); // 2 أو 3
  const sh = String(10 - offsetHours).padStart(2, "0");
  const startUtc = `${dateStr}T${sh}:00:00Z`;
  const endUtc = `${dateStr}T${sh}:30:00Z`;

  const ticksBySym = new Map<string, { p: number; t: number }[]>();
  
  // Optimizing query by avoiding redundant order by symbol and using a more efficient range approach
  const { data, error } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol,price,ts")
    .gte("ts", startUtc)
    .lt("ts", endUtc)
    .order("ts", { ascending: true })
    .limit(20000); // Limit to avoid massive memory usage/timeout while getting enough for pulse

  if (error) throw error;
  
  for (const r of (data ?? []) as any[]) {
    const arr = ticksBySym.get(r.symbol) ?? [];
    if (arr.length < 50) { // Keep only early ticks to measure move from open
      arr.push({ p: +r.price, t: new Date(r.ts).getTime() });
      ticksBySym.set(r.symbol, arr);
    }
  }

  // ready لو الساعة عدّت 10:30 صباحاً بتوقيت القاهرة
  const ready = cairoNow.getHours() > 10 || (cairoNow.getHours() === 10 && cairoNow.getMinutes() >= 30);

  if (ticksBySym.size === 0) {
    return {
      date: dateStr, ready, active: 0,
      avgMovePct: 0, pctUp: 0, pctDip: 0,
      label: "—", labelColor: "neutral",
      expectedPnl: 0, expectedRange: "—",
      expectedSignals: "—",
      note: ready
        ? "مفيش بيانات لحظية للنهاردة. السوق غالباً مقفول أو الـ feed متوقف."
        : "نستنى لحد 10:30 ص عشان نقيس نبض السوق.",
    };
  }

  let upCount = 0, dipCount = 0, total = 0;
  const moves: number[] = [];
  for (const ts of ticksBySym.values()) {
    if (ts.length < 2) continue;
    total++;
    const op = ts[0].p, last = ts[ts.length - 1].p;
    const mv = (last - op) / op;
    moves.push(mv);
    if (mv > 0) upCount++;
    let mx = ts[0].p;
    for (const t of ts) { if (t.p > mx) mx = t.p; if ((t.p - mx) / mx <= -0.015) { dipCount++; break; } }
  }
  const avg = moves.reduce((a, b) => a + b, 0) / Math.max(1, moves.length);
  const avgPct = +(avg * 100).toFixed(2);
  const pctUp = +(upCount / Math.max(1, total) * 100).toFixed(0);
  const pctDip = +(dipCount / Math.max(1, total) * 100).toFixed(0);

  // تصنيف مبني على بيانات 07–11/06 الفعلية:
  // 09/6: avg +0.46, up 68 → +975  | 10/6: +0.22, 48 → +200
  // 07/6: -0.16, 16 → +520 (شاذ)   | 08/6: -0.39, 22 → +300 (شاذ)
  // 11/6: -0.96, 11 → -700
  let label: MarketPulse["label"] = "مقبولة";
  let labelColor: MarketPulse["labelColor"] = "muted";
  let expectedPnl = 0, expectedRange = "−200 إلى +200";
  let expectedSignals = "5–15 إشارة";
  let note = "";

  if (avgPct >= 0.3 && pctUp >= 60) {
    label = "ممتازة"; labelColor = "bull";
    expectedPnl = 800; expectedRange = "+500 إلى +1,000";
    expectedSignals = "25–40 إشارة";
    note = "السوق صاعد بقوة من أول الجلسة — أعلى احتمال ربح زي يوم 09/6.";
  } else if (avgPct >= 0 && pctUp >= 40) {
    label = "جيدة جداً"; labelColor = "bull";
    expectedPnl = 300; expectedRange = "+100 إلى +500";
    expectedSignals = "15–25 إشارة";
    note = "اتجاه إيجابي مع اتساع مقبول — ربح متوسط محتمل.";
  } else if (avgPct >= -0.3 && pctUp >= 25) {
    label = "مقبولة"; labelColor = "warn";
    expectedPnl = 0; expectedRange = "−300 إلى +300";
    expectedSignals = "8–15 إشارة";
    note = "السوق متذبذب — النتيجة غير مضمونة، ممكن نخسر الرسوم.";
  } else if (avgPct > -0.15 && pctDip < 20) {
    // حركة شبه صفر + مفيش هبوط فعلي → السوق هادئ، مش سيئ
    label = "مقبولة"; labelColor = "muted";
    expectedPnl = 0; expectedRange = "−200 إلى +200";
    expectedSignals = "3–8 إشارات";
    note = "السوق هادئ من غير اتجاه واضح — لسه بدري للحكم، استنى شوية.";
  } else {
    label = "سيئة"; labelColor = "bear";
    expectedPnl = -600; expectedRange = "−800 إلى −300";
    expectedSignals = "0–5 إشارات";
    note = "السوق هابط واتساع ضعيف — أعلى احتمال خسارة زي يوم 11/6.";
  }

  return {
    date: dateStr, ready, active: total,
    avgMovePct: avgPct, pctUp, pctDip,
    label, labelColor, expectedPnl, expectedRange, expectedSignals, note,
  };
});