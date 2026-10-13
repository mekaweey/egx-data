import { createFileRoute } from "@tanstack/react-router";

/**
 * Scalp signal logger — READ-ONLY observer.
 * Records EVERY decision into scalp_signal_log.
 * NEVER opens trades, NEVER touches paper_trades, NEVER enqueues Thunder orders.
 * The only authoritative Thunder order bridge is the visible /scalp signal in
 * paper-scalp.ts, so extension tabs can never be opened from hidden logger-only
 * candidates.
 */

const WARMUP_MIN = 30;
const LOOKBACK_SEC = 180;
const TRIG_PCT = 0.012;
const MAX_TRADES_PER_DAY = 10;

function cairoNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Cairo" }));
}
function isInSession(d: Date): boolean {
  const dow = d.getDay();
  if (dow < 0 || dow > 4) return false;
  const m = d.getHours() * 60 + d.getMinutes();
  return m >= 10 * 60 && m <= 14 * 60 + 30;
}

export const Route = createFileRoute("/api/public/hooks/scalp-signal-logger")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const now = cairoNow();
          if (!isInSession(now)) return Response.json({ ok: true, skipped: "out_of_session" });

          const today = now.toISOString().slice(0, 10);
          const dayStart = `${today}T07:00:00Z`;
          const warmupCutoff = new Date(`${today}T07:${String(WARMUP_MIN).padStart(2, "0")}:00Z`).getTime();
          const nowMs = Date.now();

          const { data: existing } = await supabaseAdmin
            .from("paper_trades")
            .select("symbol")
            .eq("trade_date", today)
            .eq("strategy", "scalp-mr15");
          const taken = new Set((existing || []).map((e) => e.symbol));
          const slotsLeft = MAX_TRADES_PER_DAY - taken.size;

          const { data: stocks } = await supabaseAdmin
            .from("stocks").select("symbol")
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

          type LogRow = {
            trade_date: string;
            symbol: string;
            ts: string;
            decision: string;
            last_price?: number;
            day_open?: number;
            ret_180s?: number;
            last_tick_age_sec?: number;
          };
          const rows: LogRow[] = [];
          for (const s of stocks || []) {
            const ticks = ticksBySymbol.get(s.symbol);
            const base = { trade_date: today, symbol: s.symbol, ts: new Date(nowMs).toISOString() };

            if (taken.has(s.symbol)) { rows.push({ ...base, decision: "skipped_already_taken" }); continue; }
            if (!ticks || ticks.length < 3) { rows.push({ ...base, decision: "skipped_no_ticks" }); continue; }
            const dayOpen = ticks[0].price;
            if (dayOpen <= 0) { rows.push({ ...base, decision: "skipped_bad_open", day_open: dayOpen }); continue; }
            const last = ticks[ticks.length - 1];
            const ageSec = Math.floor((nowMs - last.ts) / 1000);
            if (last.ts < warmupCutoff) {
              rows.push({ ...base, decision: "skipped_warmup", last_price: last.price, day_open: dayOpen, last_tick_age_sec: ageSec });
              continue;
            }
            if (nowMs - last.ts > 5 * 60_000) {
              rows.push({ ...base, decision: "skipped_stale", last_price: last.price, day_open: dayOpen, last_tick_age_sec: ageSec });
              continue;
            }
            const cutoff = last.ts - LOOKBACK_SEC * 1000;
            let past = last.price;
            for (const t of ticks) { if (t.ts >= cutoff) { past = t.price; break; } }
            const ret = past > 0 ? (last.price - past) / past : 0;

            if (!(ret <= -TRIG_PCT)) {
              rows.push({ ...base, decision: "skipped_no_drop", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            if (last.price < dayOpen) {
              rows.push({ ...base, decision: "skipped_below_open", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            if (slotsLeft <= 0) {
              rows.push({ ...base, decision: "skipped_cap", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
              continue;
            }
            rows.push({ ...base, decision: "would_open", last_price: last.price, day_open: dayOpen, ret_180s: ret, last_tick_age_sec: ageSec });
          }

          // Batch insert (chunks of 500)
          for (let i = 0; i < rows.length; i += 500) {
            try {
              await supabaseAdmin.from("scalp_signal_log").insert(rows.slice(i, i + 500));
            } catch (e) {
              console.error("logger insert failed", e);
            }
          }

          return Response.json({
            ok: true,
            logged: rows.length,
            slots_left: slotsLeft,
            enqueued: 0,
            enqueue_source: "disabled_logger_is_read_only_visible_scalp_owns_orders",
          });
        } catch (e) {
          // Logger NEVER throws — strategy must continue regardless
          console.error("scalp-signal-logger error", e);
          return Response.json({ ok: false, error: String(e) }, { status: 200 });
        }
      },
    },
  },
});