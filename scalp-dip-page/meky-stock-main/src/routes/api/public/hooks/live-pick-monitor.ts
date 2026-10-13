import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";
import { fetchEgxSnapshots } from "@/lib/market-data/tradingview.server";
import { isBlocked } from "@/lib/scan/blocklist";

/**
 * Live pick monitor — runs every minute during EGX session.
 * For each open daily_pick today: pulls latest tick, computes pct vs entry,
 * sends Telegram updates with HOLD / SELL / TRAIL advice. Throttled to
 * one alert per 5-minute bucket, plus instant alerts on TARGET / STOP hits
 * or major threshold crossings (±2%, +5%). De-duped via pick_notifications.
 */

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
    .insert({ pick_date, symbol, kind, payload: payload == null ? null : (JSON.parse(JSON.stringify(payload)) as never) });
}

function cairoDateString() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Cairo" });
}

function pct(now: number, base: number) {
  return base > 0 ? ((now - base) / base) * 100 : 0;
}

type Replacement = {
  symbol: string;
  name_ar: string | null;
  entry: number;
  target: number;
  stop: number;
  confidence: number;
  score: number;
  reasons: string[];
  livePnl: number;
  remainingUpside: number;
};

async function findBetterReplacement(args: {
  today: string;
  current: { symbol: string; confidence: number; entry_price: number; stop_price: number };
  currentPrice: number;
  currentTrendPct: number;
}): Promise<Replacement | null> {
  const currentPnl = pct(args.currentPrice, Number(args.current.entry_price));
  const closeToStop = args.currentPrice <= Number(args.current.stop_price) * 1.01;
  const losingNow = currentPnl <= -0.75 || args.currentTrendPct <= -0.6 || closeToStop;
  if (!losingNow) return null;

  const { count: switchesToday } = await supabaseAdmin
    .from("pick_notifications")
    .select("id", { count: "exact", head: true })
    .eq("pick_date", args.today)
    .or("kind.ilike.monitor:auto_switch:%,kind.ilike.monitor:reopen_after_loss:%");
  if ((switchesToday ?? 0) >= 1) return null;

  // Fix A: never pick a symbol that already appeared as a daily_pick today
  // (open/closed/win/loss). Prevents re-entering the same losing name (the
  // ATQA-4×-in-one-day pattern from 2026-06-07).
  const { data: usedToday } = await supabaseAdmin
    .from("daily_picks")
    .select("symbol")
    .eq("pick_date", args.today);
  const usedSymbolSet = new Set((usedToday ?? []).map((r) => r.symbol));

  const { data: recs } = await supabaseAdmin
    .from("recommendations")
    .select("symbol, signal, confidence, reasons_ar, entry_min, entry_max, target, stop_loss, price_at_reco, expected_gain_pct, created_at")
    .eq("outcome", "pending")
    .in("signal", ["buy", "strong_buy"])
    .gte("created_at", `${args.today}T00:00:00.000Z`)
    .order("confidence", { ascending: false })
    .limit(80);

  const symbols = Array.from(
    new Set(
      (recs ?? [])
        .map((r) => r.symbol)
        .filter((s) => s && s !== args.current.symbol && !isBlocked(s) && !usedSymbolSet.has(s)),
    ),
  );
  if (!symbols.length) return null;

  const snaps = await fetchEgxSnapshots(symbols).catch(() => new Map());
  const { data: tickRows } = await supabaseAdmin
    .from("live_ticks")
    .select("symbol, price, ts")
    .in("symbol", symbols)
    .gte("ts", `${args.today}T07:00:00.000Z`)
    .order("ts", { ascending: false })
    .limit(500);
  const latestTick = new Map<string, number>();
  for (const t of tickRows ?? []) if (!latestTick.has(t.symbol)) latestTick.set(t.symbol, Number(t.price));

  const { data: stocks } = await supabaseAdmin
    .from("stocks")
    .select("symbol, name_ar")
    .in("symbol", symbols);
  const nameMap = new Map((stocks ?? []).map((s) => [s.symbol, s.name_ar ?? s.symbol]));

  const currentScore = Number(args.current.confidence) + currentPnl * 14 + args.currentTrendPct * 12;
  let best: Replacement | null = null;

  for (const r of recs ?? []) {
    if (r.symbol === args.current.symbol) continue;
    if (isBlocked(r.symbol)) continue;
    const snap = snaps.get(r.symbol);
    const livePrice = snap?.close ?? latestTick.get(r.symbol) ?? 0;
    const recoPrice = Number(r.price_at_reco ?? r.entry_min ?? 0);
    const target = Number(r.target);
    const stop = Number(r.stop_loss);
    const confidence = Number(r.confidence ?? 0);
    if (!(livePrice > 0) || !(target > livePrice) || !(stop > 0) || livePrice <= stop) continue;

    const livePnl = pct(livePrice, recoPrice);
    const remainingUpside = pct(target, livePrice);
    const expectedGain = Number(r.expected_gain_pct ?? remainingUpside);
    const signalBonus = String(r.signal) === "strong_buy" ? 10 : 6;
    const candidateScore = confidence + livePnl * 8 + remainingUpside * 2 + expectedGain + signalBonus;

    if (confidence < 85) continue;
    // Fix B: enforce 78-floor as a hard minimum (85 is stricter for replacements).
    if (livePnl < 1) continue;
    if (remainingUpside < 1.2) continue;
    if (expectedGain < 1.2) continue;
    if (candidateScore < currentScore + 15) continue;

    // Fix C: refuse replacements with a stop tighter than 2% from entry —
    // a 1% stop gets clipped in the first minute of noise. Widen if needed.
    const safeStop = +Math.min(stop, livePrice * 0.98).toFixed(4);
    const stopPctFromEntry = ((livePrice - safeStop) / livePrice) * 100;
    if (stopPctFromEntry < 2 || stopPctFromEntry > 4) continue;

    const reasons = [
      `تبديل تلقائي: الترشيح الحالي بقى ${currentPnl.toFixed(2)}%`,
      `البديل صاعد لحظياً +${livePnl.toFixed(2)}% ولسه قدامه +${remainingUpside.toFixed(2)}% للهدف`,
      ...(((r.reasons_ar as string[]) ?? []).slice(0, 2)),
    ];

    const candidate: Replacement = {
      symbol: r.symbol,
      name_ar: nameMap.get(r.symbol) ?? r.symbol,
      entry: +livePrice.toFixed(4),
      target: +target.toFixed(4),
      stop: safeStop,
      confidence,
      score: +candidateScore.toFixed(2),
      reasons,
      livePnl,
      remainingUpside,
    };
    if (!best || candidate.score > best.score) best = candidate;
  }

  return best;
}

export const Route = createFileRoute("/api/public/hooks/live-pick-monitor")({
  server: {
    handlers: {
      POST: async () => {
        const cairoNow = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
        const dow = cairoNow.getDay();
        const hh = cairoNow.getHours();
        const mm = cairoNow.getMinutes();
        const inSession = dow >= 0 && dow <= 4 && hh >= 10 && (hh < 14 || (hh === 14 && mm <= 30));
        if (!inSession) return Response.json({ ok: true, skipped: "out_of_session" });

        const today = cairoDateString();
        const { data: picks } = await supabaseAdmin
          .from("daily_picks")
          .select("id, symbol, name_ar, entry_price, target_price, stop_price, status, confidence")
          .eq("pick_date", today)
          .eq("status", "open");

        if (!picks?.length) {
          const { data: lastToday } = await supabaseAdmin
            .from("daily_picks")
            .select("id, symbol, name_ar, entry_price, target_price, stop_price, status, confidence, exit_price, pnl_pct")
            .eq("pick_date", today)
            .order("updated_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!lastToday || !["loss", "closed", "win", "expired"].includes(String(lastToday.status))) {
            return Response.json({ ok: true, picks: 0 });
          }

          const { data: lastTick } = await supabaseAdmin
            .from("live_ticks")
            .select("price")
            .eq("symbol", lastToday.symbol)
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle();
          const currentPrice = Number(lastTick?.price ?? lastToday.exit_price ?? lastToday.entry_price);
          const replacement = await findBetterReplacement({
            today,
            current: {
              symbol: lastToday.symbol,
              confidence: Number(lastToday.confidence ?? 0),
              entry_price: Number(lastToday.entry_price),
              stop_price: Number(lastToday.stop_price),
            },
            currentPrice,
            currentTrendPct: -1,
          });

          if (!replacement) return Response.json({ ok: true, picks: 0, action: "no_replacement" });

          const { data: newPick } = await supabaseAdmin
            .from("daily_picks")
            .insert({
              pick_date: today,
              symbol: replacement.symbol,
              name_ar: replacement.name_ar,
              entry_price: replacement.entry,
              target_price: replacement.target,
              stop_price: replacement.stop,
              target_pct: +(((replacement.target - replacement.entry) / replacement.entry) * 100).toFixed(2),
              stop_pct: +(((replacement.entry - replacement.stop) / replacement.entry) * 100).toFixed(2),
              confidence: replacement.confidence,
              kelly_pct: Math.max(0.08, Math.min(0.25, replacement.confidence / 400)),
              score: replacement.score,
              reasons: replacement.reasons as never,
              status: "open",
            })
            .select("id")
            .maybeSingle();
          if (!newPick) return Response.json({ ok: false, action: "insert_replacement_failed" }, { status: 500 });

          const kind = `monitor:reopen_after_loss:${lastToday.symbol}->${replacement.symbol}`;
          if (!(await alreadySent(today, lastToday.symbol, kind))) {
            const sent = await sendTelegram(
              `<b>🔁 بديل تلقائي بعد فشل الصفقة</b>\n` +
              `الصفقة السابقة: <b>${escapeHtml(lastToday.name_ar ?? lastToday.symbol)}</b> (<code>${lastToday.symbol}</code>)\n\n` +
              `البديل الحالي: <b>${escapeHtml(replacement.name_ar ?? replacement.symbol)}</b> (<code>${replacement.symbol}</code>)\n` +
              `💵 دخول: <b>${replacement.entry.toFixed(2)}</b> · 🎯 ${replacement.target.toFixed(2)} · 🛑 ${replacement.stop.toFixed(2)}\n` +
              `📊 ثقة: <b>${replacement.confidence.toFixed(0)}%</b>`,
            );
            if (sent.ok) await markSent(today, lastToday.symbol, kind, { from: lastToday.symbol, to: replacement.symbol, replacement });
          }

          return Response.json({ ok: true, picks: 0, action: "reopened_with_replacement", to: replacement.symbol });
        }

        const bucket = Math.floor(mm / 5); // 0..5
        const results: Array<Record<string, unknown>> = [];

        for (const p of picks) {
          const { data: tickRow } = await supabaseAdmin
            .from("live_ticks")
            .select("price, volume, ts")
            .eq("symbol", p.symbol)
            .gte("ts", `${today}T07:00:00.000Z`)
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!tickRow) {
            results.push({ symbol: p.symbol, skipped: "no_tick_today" });
            continue;
          }

          // SAFETY: ignore stale ticks (>10 min old). Prevents false
          // stop/target hits from a frozen feed at session open.
          const tickAgeSec = (Date.now() - new Date(tickRow.ts).getTime()) / 1000;
          if (tickAgeSec > 600) {
            results.push({ symbol: p.symbol, skipped: "stale_tick", age_sec: Math.round(tickAgeSec) });
            continue;
          }

          const price = Number(tickRow.price);
          const entry = Number(p.entry_price);
          const target = Number(p.target_price);
          const stop = Number(p.stop_price);
          const pnlPct = ((price - entry) / entry) * 100;

          // Compare vs previous tick (5 min ago) for direction
          const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
          const { data: prevRow } = await supabaseAdmin
            .from("live_ticks")
            .select("price")
            .eq("symbol", p.symbol)
            .lte("ts", fiveMinAgo)
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle();
          const prevPrice = prevRow ? Number(prevRow.price) : price;
          const trendPct = prevPrice ? ((price - prevPrice) / prevPrice) * 100 : 0;
          const trend = trendPct > 0.2 ? "📈 صاعد" : trendPct < -0.2 ? "📉 هابط" : "➡️ ثابت";

          const replacement = await findBetterReplacement({
            today,
            current: {
              symbol: p.symbol,
              confidence: Number(p.confidence ?? 0),
              entry_price: entry,
              stop_price: stop,
            },
            currentPrice: price,
            currentTrendPct: trendPct,
          });

          if (replacement) {
            const switchKind = `monitor:auto_switch:${p.symbol}->${replacement.symbol}`;
            const currentPnL = pct(price, entry);
            const { error: closeError } = await supabaseAdmin
              .from("daily_picks")
              .update({
                status: "closed",
                exit_price: price,
                exit_date: today,
                pnl_pct: currentPnL,
              })
              .eq("id", p.id);

            const { error } = closeError
              ? { error: closeError }
              : await supabaseAdmin
              .from("daily_picks")
              .insert({
                pick_date: today,
                symbol: replacement.symbol,
                name_ar: replacement.name_ar,
                entry_price: replacement.entry,
                target_price: replacement.target,
                stop_price: replacement.stop,
                target_pct: +(((replacement.target - replacement.entry) / replacement.entry) * 100).toFixed(2),
                stop_pct: +(((replacement.entry - replacement.stop) / replacement.entry) * 100).toFixed(2),
                confidence: replacement.confidence,
                kelly_pct: Math.max(0.08, Math.min(0.25, replacement.confidence / 400)),
                score: replacement.score,
                reasons: replacement.reasons as never,
                status: "open",
              });

            if (!error && !(await alreadySent(today, p.symbol, switchKind))) {
              const text =
                `<b>🔁 تبديل تلقائي لصفقة اليوم</b>\n` +
                `خرجنا من <b>${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>) لأن الأداء اللحظي بقى <b>${currentPnL.toFixed(2)}%</b> ${trend}\n\n` +
                `البديل الأفضل: <b>${escapeHtml(replacement.name_ar ?? replacement.symbol)}</b> (<code>${replacement.symbol}</code>)\n` +
                `💵 دخول جديد: <b>${replacement.entry.toFixed(2)}</b>\n` +
                `🎯 هدف: <b>${replacement.target.toFixed(2)}</b> · 🛑 ستوب: <b>${replacement.stop.toFixed(2)}</b>\n` +
                `📊 ثقة: <b>${replacement.confidence.toFixed(0)}%</b> · صعود لحظي: <b>+${replacement.livePnl.toFixed(2)}%</b>\n\n` +
                `<b>السبب:</b> ${escapeHtml(replacement.reasons.slice(0, 2).join(" — "))}`;
              const sent = await sendTelegram(text);
              if (sent.ok) await markSent(today, p.symbol, switchKind, { from: p.symbol, to: replacement.symbol, price, replacement });
            }

            results.push({ symbol: p.symbol, action: "auto_switched", to: replacement.symbol, price, replacementScore: replacement.score });
            continue;
          }

          // 1) TARGET / STOP — instant, dedup once per day
          let alertKind: string | null = null;
          let advice = "";
          let header = "";

          if (price >= target) {
            alertKind = "monitor:target_hit";
            header = `🎯 وصل الهدف — بيع فوراً`;
            advice = `الهدف ${target.toFixed(2)} تحقق · اخرج بربح +${pnlPct.toFixed(2)}%`;
          } else if (price <= stop) {
            alertKind = "monitor:stop_hit";
            header = `🛑 ضرب الستوب — اخرج فوراً`;
            advice = `الستوب ${stop.toFixed(2)} ضُرب · احمي رأس المال (${pnlPct.toFixed(2)}%)`;
          } else if (pnlPct >= 5) {
            alertKind = `monitor:trail_5_${today}`;
            const newStop = +(price * 0.97).toFixed(2);
            header = `📈 ربح +${pnlPct.toFixed(2)}% — حرّك الستوب`;
            advice = `حرّك الستوب لـ ${newStop.toFixed(2)} (3% تحت السعر) واحتفظ`;
          } else if (pnlPct >= 2) {
            alertKind = `monitor:up2_${today}`;
            header = `✅ السهم في الربح +${pnlPct.toFixed(2)}%`;
            advice = `خليك — السهم بيتحرك صح. الستوب ${stop.toFixed(2)}، الهدف ${target.toFixed(2)}`;
          } else if (pnlPct <= -1.5) {
            alertKind = `monitor:down15_${today}`;
            header = `⚠️ السهم في خسارة ${pnlPct.toFixed(2)}%`;
            advice = `استنى — الستوب لسه ${stop.toFixed(2)}. ابيع بس لو وصل الستوب`;
          } else {
            // Periodic heartbeat (every 5-min bucket)
            alertKind = `monitor:hb_${today}_${bucket}_${hh}`;
            header = `🔄 متابعة لحظية ${trend}`;
            advice = `السعر ${price.toFixed(2)} · P/L ${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}% · احتفظ`;
          }

          if (await alreadySent(today, p.symbol, alertKind)) {
            results.push({ symbol: p.symbol, skipped: "dedup", kind: alertKind });
            continue;
          }

          const text =
            `<b>${header}</b>\n` +
            `<b>${escapeHtml(p.name_ar ?? p.symbol)}</b> (<code>${p.symbol}</code>)\n` +
            `💵 السعر اللحظي: <b>${price.toFixed(2)}</b> ${trend}\n` +
            `📊 من الدخول ${entry.toFixed(2)}: <b>${pnlPct >= 0 ? "+" : ""}${pnlPct.toFixed(2)}%</b>\n` +
            `🎯 هدف ${target.toFixed(2)} · 🛑 ستوب ${stop.toFixed(2)}\n\n` +
            `<b>توصية:</b> ${escapeHtml(advice)}`;

          const res = await sendTelegram(text);
          if (res.ok) {
            await markSent(today, p.symbol, alertKind, { price, pnlPct, trendPct });
          }

          // Auto-close pick on target/stop
          if (price >= target || price <= stop) {
            const finalStatus = price >= target ? "win" : "loss";
            await supabaseAdmin
              .from("daily_picks")
              .update({
                status: finalStatus,
                exit_price: price,
                exit_date: today,
                pnl_pct: pnlPct,
              })
              .eq("id", p.id);
          }

          results.push({ symbol: p.symbol, price, pct: +pnlPct.toFixed(2), kind: alertKind, sent: res.ok });
        }

        return Response.json({ ok: true, picks: picks.length, results });
      },
    },
  },
});