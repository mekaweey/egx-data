import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * EXPERIMENT clone of paper-scalp.ts — strategy id: "scalp-mr15-fresh".
 *
 * Identical to the original EXCEPT for the entry step:
 *   1) Pick the best candidate from cached ticks (same logic).
 *   2) Fetch a FRESH real-time price for that single symbol RIGHT NOW.
 *   3) Safety guards:
 *        - If fresh fetch fails    → fallback to cached price (open as before).
 *        - If |fresh - cached| > 1% → REJECT (price drifted too much; the
 *          notification would be wrong by the time the user opens Thunder).
 *        - If the trigger condition no longer holds at the fresh price
 *          (fresh < cached * (1 - 0.005))  → REJECT (entry already gone).
 *   4) Use the fresh price as entry_price so TP/SL are computed off the
 *      price the user will actually see in Thunder seconds later.
 *
 * Original strategy + page are UNTOUCHED. This runs in parallel so we can
 * compare win-rate and slippage at end of day.
 */

const STRATEGY = "scalp-mr15-fresh";
const CAPITAL_PER_TRADE = 20000;
const MAX_TRADES_PER_DAY = Number.POSITIVE_INFINITY;
const WARMUP_MIN = 30;
const LOOKBACK_SEC = 180;
// SOFT TRIG config (validated 16 Jun 2026 backtest)
const TRIG_PCT = 0.012;
// v4.1.50 — ARM 0.6% / TRAIL 0.4% (matches extension + 15d backtest winner).
const TP_PCT = 0.020;
const SL_PCT = 0.005;
// v4.1.69 — tuned on 82 real trades (14d) with Trade-Through+slippage:
//   ARM 0.6% / GAP 0.2% / TIME 10min → 100% exit rate, ~384-593 EGP/day.
const TRAIL_ARM = 0.006;
const TRAIL_GAP = 0.002;
const TIME_STOP_MIN = 10;
const MAX_FRESH_DRIFT_PCT = 0.01; // reject if fresh price drifted >1% from cached

function cairoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function isInSession(d: Date): boolean {
  const dow = d.getDay();
  if (dow < 0 || dow > 4) return false;
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 10 * 60 && m <= 14 * 60 + 30;
}
function isEOD(d: Date): boolean {
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 14 * 60 + 25;
}

export const Route = createFileRoute("/api/public/hooks/paper-scalp-fresh")({
  server: {
    handlers: {
      POST: async () => {
        // ⛔ موقوفة يدويًا بناءً على طلب المستخدم — لا تفتح أو تقفل أي صفقات حتى يُعاد تشغيلها.
        return Response.json({ ok: true, skipped: "strategy_paused", opened: 0, closed: 0 });
        // eslint-disable-next-line no-unreachable
        const SUB_RUNS = 3;
        const SLEEP_MS = 15_000;
        let totalOpened = 0;
        let totalClosed = 0;
        let lastBody: Record<string, unknown> = {};
        for (let i = 0; i < SUB_RUNS; i++) {
          const res = await runOnce();
          lastBody = res;
          totalOpened += (res.opened as number) ?? 0;
          totalClosed += (res.closed as number) ?? 0;
          if (i < SUB_RUNS - 1) await new Promise(r => setTimeout(r, SLEEP_MS));
        }
        return Response.json({ ...lastBody, opened: totalOpened, closed: totalClosed, sub_runs: SUB_RUNS });
      },
    },
  },
});

async function runOnce(): Promise<Record<string, unknown>> {
  const now = cairoNow();
  if (!isInSession(now)) return { ok: true, skipped: "out_of_session" };

  const today = now.toISOString().slice(0, 10);
  const dayStart = `${today}T07:00:00Z`;

  // 1) Close open trades — same logic as original
  const { data: openTrades } = await supabaseAdmin
    .from("paper_trades")
    .select("*")
    .eq("trade_date", today)
    .eq("strategy", STRATEGY)
    .eq("status", "open");

  let closedCount = 0;
  for (const tr of openTrades || []) {
    const { data: ticks } = await supabaseAdmin
      .from("live_ticks")
      .select("price, ts")
      .eq("symbol", tr.symbol)
      .eq("source", "thunder_ext")
      .gt("ts", tr.entry_ts)
      .order("ts", { ascending: true });
    if (!ticks?.length) continue;

    const deadline = new Date(tr.entry_ts).getTime() + TIME_STOP_MIN * 60_000;
    const entryPx = Number(tr.entry_price);
    let peak = entryPx;
    let dynSl = Number(tr.sl_price);
    let exitPrice: number | null = null;
    let exitTs: string | null = null;
    let reason: string | null = null;
    for (const t of ticks) {
      const p = Number(t.price);
      const ts = new Date(t.ts).getTime();
      if (p > peak) peak = p;
      if ((peak - entryPx) / entryPx >= TRAIL_ARM) {
        const trailSl = peak * (1 - TRAIL_GAP);
        if (trailSl > dynSl) dynSl = trailSl;
      }
      if (p >= Number(tr.tp_price)) { exitPrice = Number(tr.tp_price); exitTs = t.ts; reason = "TP"; break; }
      if (p <= dynSl) { exitPrice = dynSl; exitTs = t.ts; reason = dynSl > Number(tr.sl_price) ? "TRAIL" : "SL"; break; }
      if (ts >= deadline) { exitPrice = p; exitTs = t.ts; reason = "TIME"; break; }
    }
    if (!exitPrice && isEOD(now)) {
      const last = ticks[ticks.length - 1];
      exitPrice = Number(last.price); exitTs = last.ts; reason = "EOD";
    }
    if (exitPrice && exitTs && reason) {
      const entry = Number(tr.entry_price);
      const pnlPct = (exitPrice - entry) / entry;
      const pnl = Number(tr.capital) * pnlPct;
      await supabaseAdmin.from("paper_trades").update({
        exit_price: exitPrice, exit_ts: exitTs, exit_reason: reason,
        pnl, pnl_pct: pnlPct, status: "closed",
      }).eq("id", tr.id);
      closedCount++;
      const reasonAr = reason === "TP" ? "🎯 وصل الهدف" : reason === "SL" ? "🛑 وقف الخسارة" : reason === "TRAIL" ? "🪤 Trailing Stop" : reason === "TIME" ? "⏰ انتهى الوقت" : "🔔 إقفال آخر اليوم";
      void sendTelegram(
        `<b>🔴 [FRESH] إشارة بيع Scalp — ${tr.symbol}</b>\n` +
        `${reasonAr}\n\n` +
        `🛒 الدخول: <b>${entry.toFixed(2)}</b>\n` +
        `💵 الخروج: <b>${Number(exitPrice).toFixed(2)}</b>\n` +
        `📈 الربح/الخسارة: <b>${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ج (${(pnlPct * 100).toFixed(2)}%)</b>`,
      );
    }
  }

  // 2) Open new trades — Plan B logic
  let openedCount = 0;
  const warmupCutoff = new Date(`${today}T07:${String(WARMUP_MIN).padStart(2, "0")}:00Z`).getTime();
  const nowMs = Date.now();
  if (nowMs >= warmupCutoff) {
    const { count: openCount } = await supabaseAdmin
      .from("paper_trades")
      .select("id", { count: "exact", head: true })
      .eq("trade_date", today)
      .eq("strategy", STRATEGY)
      .eq("status", "open");
    if ((openCount ?? 0) > 0) {
      return { ok: true, opened: 0, closed: closedCount, skipped: "busy_with_open_trade", cairo_time: now.toISOString() };
    }

    const { data: existing } = await supabaseAdmin
      .from("paper_trades")
      .select("symbol")
      .eq("trade_date", today)
      .eq("strategy", STRATEGY);
    const taken = new Set((existing || []).map(e => e.symbol));

    if (taken.size < MAX_TRADES_PER_DAY) {
      const { data: stocks } = await supabaseAdmin
        .from("stocks").select("symbol, yahoo_symbol, investing_slug")
        .eq("is_sharia", true).eq("day_tradable", true).limit(150);

      const ticksBySymbol = new Map<string, { price: number; ts: number }[]>();
      let from = 0;
      while (true) {
        const { data } = await supabaseAdmin
          .from("live_ticks")
          .select("symbol, price, ts")
          .gte("ts", dayStart)
          .eq("source", "thunder_ext")
          .order("symbol").order("ts")
          .range(from, from + 999);
        if (!data?.length) break;
        for (const t of data) {
          if (!ticksBySymbol.has(t.symbol)) ticksBySymbol.set(t.symbol, []);
          ticksBySymbol.get(t.symbol)!.push({ price: Number(t.price), ts: new Date(t.ts).getTime() });
        }
        if (data.length < 1000) break;
        from += 1000;
      }

      type Candidate = {
        symbol: string; entry: number; entryTs: number;
        aboveOpen: number; drop: number;
        yahoo_symbol: string | null; investing_slug: string | null;
      };
      const candidates: Candidate[] = [];
      for (const s of stocks || []) {
        if (taken.has(s.symbol)) continue;
        const ticks = ticksBySymbol.get(s.symbol);
        if (!ticks || ticks.length < 3) continue;
        const dayOpen = ticks[0].price;
        if (dayOpen <= 0) continue;
        const last = ticks[ticks.length - 1];
        if (last.ts < warmupCutoff) continue;
        if (nowMs - last.ts > 5 * 60_000) continue;
        const cutoff = last.ts - LOOKBACK_SEC * 1000;
        let past = last.price;
        for (const t of ticks) { if (t.ts >= cutoff) { past = t.price; break; } }
        if (past <= 0) continue;
        const ret = (last.price - past) / past;
        if (!(ret <= -TRIG_PCT && last.price >= dayOpen)) continue;
        candidates.push({
          symbol: s.symbol,
          entry: last.price,
          entryTs: last.ts,
          aboveOpen: (last.price - dayOpen) / dayOpen,
          drop: Math.abs(ret),
          yahoo_symbol: (s as { yahoo_symbol: string | null }).yahoo_symbol ?? null,
          investing_slug: (s as { investing_slug: string | null }).investing_slug ?? null,
        });
      }

      candidates.sort((a, b) => a.aboveOpen - b.aboveOpen || a.drop - b.drop);
      const pick = candidates[0];
      if (pick) {
        // === Plan B: fetch FRESH Thunder tick RIGHT NOW (locked to thunder_ext) ===
        let freshPrice: number | null = null;
        let freshSource: string | null = null;
        let fetchError: string | null = null;
        let fetchMs: number | null = null;
        let rejectReason: string | null = null;
        try {
          const t0 = Date.now();
          const { data: latest } = await supabaseAdmin
            .from("live_ticks")
            .select("price, ts, source")
            .eq("symbol", pick.symbol)
            .eq("source", "thunder_ext")
            .order("ts", { ascending: false })
            .limit(1)
            .maybeSingle();
          fetchMs = Date.now() - t0;
          if (latest) {
            const ageSec = (Date.now() - new Date(latest.ts).getTime()) / 1000;
            if (ageSec > 15) {
              fetchError = `thunder_stale_${ageSec.toFixed(0)}s`;
            } else {
              freshPrice = Number(latest.price);
              freshSource = latest.source;
            }
          } else {
            fetchError = "no_thunder_tick";
          }
        } catch (e) {
          fetchError = (e as Error).message?.slice(0, 200) ?? "unknown";
        }

        // Decide entry price — REQUIRE fresh Thunder tick (no fallback to other sources)
        let entryPrice = pick.entry;
        let entryTsIso = new Date(pick.entryTs).toISOString();
        if (freshPrice == null) {
          // No fresh Thunder tick → reject. Thunder is the only allowed source.
          rejectReason = fetchError ?? "no_thunder_fresh";
        } else {
          const driftPct = Math.abs(freshPrice - pick.entry) / pick.entry;
          if (driftPct > MAX_FRESH_DRIFT_PCT) {
            rejectReason = `fresh_drift_${(driftPct * 100).toFixed(2)}pct`;
          } else if (freshPrice < pick.entry * (1 - 0.005)) {
            rejectReason = "entry_below_band";
          } else {
            entryPrice = freshPrice;
            entryTsIso = new Date().toISOString();
          }
        }

        // Always log the comparison
        try {
          const diffPct = freshPrice != null ? ((freshPrice - pick.entry) / pick.entry) * 100 : null;
          await supabaseAdmin.from("scalp_fresh_fetch_log").insert({
            symbol: pick.symbol,
            cached_price: pick.entry,
            cached_ts: new Date(pick.entryTs).toISOString(),
            fresh_price: freshPrice,
            fresh_source: freshSource,
            diff_pct: diffPct,
            fetch_ms: fetchMs,
            fetch_error: fetchError ?? rejectReason,
            trigger_still_valid: rejectReason == null,
          });
        } catch { /* swallow */ }

        if (rejectReason) {
          return { ok: true, opened: 0, closed: closedCount, skipped: rejectReason, cairo_time: now.toISOString() };
        }

        const { error } = await supabaseAdmin.from("paper_trades").insert({
          trade_date: today,
          symbol: pick.symbol,
          strategy: STRATEGY,
          entry_price: entryPrice,
          entry_ts: entryTsIso,
          tp_price: entryPrice * (1 + TP_PCT),
          sl_price: entryPrice * (1 - SL_PCT),
          capital: CAPITAL_PER_TRADE,
          status: "open",
        });
        if (!error) {
          openedCount++;
          const tp = entryPrice * (1 + TP_PCT);
          const sl = entryPrice * (1 - SL_PCT);
          void sendTelegram(
            `<b>🟢 إشارة شراء Scalp — ${pick.symbol}</b>\n` +
            `🛒 ادخل عند: <b>${entryPrice.toFixed(2)}</b>\n` +
            `\n<b>على ثاندر اعمل الأمرين دول فوراً:</b>\n` +
            `🎯 طلب بسعر محدد (بيع) @ <b>${tp.toFixed(2)}</b>\n` +
            `🛑 طلب إيقاف @ <b>${sl.toFixed(2)}</b>\n` +
            (freshPrice != null ? `🔴 سعر لحظي (${freshSource})` : `⚠️ fallback cached`),
          );
        }
      }
    }
  }

  return { ok: true, opened: openedCount, closed: closedCount, cairo_time: now.toISOString() };
}