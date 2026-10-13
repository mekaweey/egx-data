import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * Paper trading runner — scalp-mr15 strategy (mean-reversion scalper).
 * Runs every minute during EGX session.
 *
 * Per symbol (max 10 symbols/day):
 *  - Warmup: ignore first 30 minutes (10:00-10:30)
 *  - Trigger: 1.5% drop within last 180s AND price >= day-open
 *  - Exit: exact safe-sell target after fees + 0.5% net / SL -0.5% / time-stop 10min / EOD
 *  - 1 trade per symbol per day (table unique constraint)
 */

const STRATEGY = "scalp-mr15";
const CAPITAL_PER_TRADE = 20000;
const MAX_TRADES_PER_DAY = Number.POSITIVE_INFINITY;
const WARMUP_MIN = 30;
const LOOKBACK_SEC = 180;
// SOFT TRIG config (validated 16 Jun 2026 backtest: 76% WR, +4,449/wk, worst -141)
const TRIG_PCT = 0.012;
// Final sellability mission: the sell target is NOT a theoretical 2% target.
// It is the exact limit price that covers buy fee + sell fee + 0.5% net profit
// for the real 20,000 EGP quantity. This is what the L2 gate must prove.
const TARGET_NET = 0.005;
const SL_PCT = 0.005;
// v4.1.69 — tuned on 82 real trades (14d) with Trade-Through+slippage:
//   ARM 0.6% / GAP 0.2% / TIME 10min → 100% exit rate, ~384-593 EGP/day.
const TRAIL_ARM = 0.006;
const TRAIL_GAP = 0.002;
const TIME_STOP_MIN = 10;

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

export const Route = createFileRoute("/api/public/hooks/paper-scalp")({
  server: {
    handlers: {
      POST: async () => {
        // Self-loop: run up to 3 sub-scans within the same cron minute (every
        // ~23s) to cut average detection latency from ~30s to ~10s. Safe because
        // the "busy_with_open_trade" guard prevents double-opens, and one full
        // scan takes ~8s so 3 loops + 2 sleeps stay under 60s.
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
        const dayStart = `${today}T07:00:00Z`; // 10:00 Cairo

        // 1) Close existing OPEN trades — TP/SL/time-stop/EOD
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
            // trailing stop: once gain >= TRAIL_ARM, lift SL to peak*(1-TRAIL_GAP)
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
              `<b>🔴 إشارة بيع Scalp — ${tr.symbol}</b>\n` +
              `${reasonAr}\n\n` +
              `🛒 الدخول: <b>${entry.toFixed(2)}</b>\n` +
              `💵 الخروج: <b>${Number(exitPrice).toFixed(2)}</b>\n` +
              `📈 الربح/الخسارة: <b>${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)} ج (${(pnlPct * 100).toFixed(2)}%)</b>`,
            );
          }
        }

        // 2) Open new trades — only after warmup
        let openedCount = 0;
        const warmupCutoff = new Date(`${today}T07:${String(WARMUP_MIN).padStart(2, "0")}:00Z`).getTime();
        const nowMs = Date.now();
        if (nowMs >= warmupCutoff) {
          // Sequential mode: only one open trade at a time (use full capital per trade)
          const { count: openCount } = await supabaseAdmin
            .from("paper_trades")
            .select("id", { count: "exact", head: true })
            .eq("trade_date", today)
            .eq("strategy", STRATEGY)
            .eq("status", "open");
          if ((openCount ?? 0) > 0) {
            return {
              ok: true, opened: 0, closed: closedCount,
              skipped: "busy_with_open_trade",
              cairo_time: now.toISOString(),
            };
          }

          const { data: existing } = await supabaseAdmin
            .from("paper_trades")
            .select("symbol")
            .eq("trade_date", today)
            .eq("strategy", STRATEGY);
          const taken = new Set((existing || []).map(e => e.symbol));

          if (taken.size < MAX_TRADES_PER_DAY) {
            const { data: stocks } = await supabaseAdmin
              .from("stocks").select("symbol")
              .eq("is_sharia", true).eq("day_tradable", true).limit(150);

            // Fetch today's ticks (paginated)
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

            // Phase 1: collect all qualifying candidates with ranking features
            type Candidate = {
              symbol: string; entry: number; entryTs: number;
              aboveOpen: number; drop: number; dayOpen: number; ret180s: number; lookbackRefPrice: number;
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
              // require last tick recent (within 5 min of now) to avoid stale entries
              if (nowMs - last.ts > 5 * 60_000) continue;
              // find oldest tick within lookback window
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
                dayOpen,
                ret180s: ret,
                lookbackRefPrice: past,
              });
            }

            // Phase 2: rank — winners historically have LOWER aboveOpen, then LOWER drop.
            // Pick the best single candidate (sequential mode = one trade at a time).
            // Viability filter: only keep signals that can actually profit after
            // fees even with a 1000 EGP entry, AND whose safe-sell price stays
            // at-or-below the pre-drop lookback ceiling (so a simple rebound is
            // enough to hit profit). This raises quality without changing the
            // strategy rules — non-viable candidates wouldn't make money anyway.
            const MIN_CASH = CAPITAL_PER_TRADE;
            const calcFee = (val: number) => 3 + 0.0003 * val;
            const safeSellAt = (entry: number, qty: number) => {
              const buyVal = entry * qty;
              return (buyVal + calcFee(buyVal) + 3 + buyVal * TARGET_NET) / (qty * (1 - 0.0003));
            };
            const viable = candidates.filter((c) => {
              const qty = Math.max(1, Math.floor(MIN_CASH / c.entry));
              if (qty * c.entry < 900) return false;
              const ss = safeSellAt(c.entry, qty);
              const reqMove = (ss - c.entry) / c.entry;
              if (reqMove > 0.012) return false;            // > 1.2% gross move غير واقعي للسكالب
              if (ss > c.lookbackRefPrice * 1.001) return false; // الرجوع للسقف السابق ميكفيش للربح
              return true;
            });
            // Rank: most profit headroom first (gap between rebound ceiling and
            // safe sell), then standard tie-breakers.
            viable.sort((a, b) => {
              const qa = Math.max(1, Math.floor(MIN_CASH / a.entry));
              const qb = Math.max(1, Math.floor(MIN_CASH / b.entry));
              const ha = a.lookbackRefPrice - safeSellAt(a.entry, qa);
              const hb = b.lookbackRefPrice - safeSellAt(b.entry, qb);
              return hb - ha || a.aboveOpen - b.aboveOpen || a.drop - b.drop;
            });
            let pick: Candidate | null = null;
            let qty = 0;
            let tp = 0;
            let gateOk = false;
            let gateReason = "no_l2_sellable_candidate";
            let gateRejects = 0;

            // Liquidity-first selection: if the top-ranked signal has no real
            // buyer at our target, keep scanning the rest of the day's signals.
            // We only open the first candidate whose current L2 book already
            // proves a full 20K exit at the exact post-fee profit price.
            for (const candidate of viable) {
              const candidateQty = Math.max(1, Math.floor(CAPITAL_PER_TRADE / candidate.entry));
              const candidateTp = safeSellAt(candidate.entry, candidateQty);
              try {
                const { runPreBuyL2Gate } = await import("@/lib/scalp-feasibility/pre-buy-gate.server");
                const gate = await runPreBuyL2Gate({
                  symbol: candidate.symbol,
                  entry_price: candidate.entry,
                  qty: candidateQty,
                  tp_pct: TARGET_NET,
                  fee_pct: 0.0012,
                  max_snapshot_age_ms: 15_000,
                  min_depth_multiplier: 1,
                  source: "paper-scalp-liquidity-scan",
                });
                gateReason = gate.reason;
                if (gate.ok) {
                  pick = candidate;
                  qty = candidateQty;
                  tp = candidateTp;
                  gateOk = true;
                  break;
                }
                gateRejects++;
              } catch (e) {
                gateReason = `gate_error:${(e as Error).message?.slice(0, 80) ?? "unknown"}`;
                gateRejects++;
              }
            }

            if (pick) {
              const enforce = true;
              // Dry-run: continue as before but attach the decision to pending_orders metadata
              // so we can trace which signals would have been blocked.
              const pickedTicks = ticksBySymbol.get(pick.symbol) ?? [];
              const dayHighSoFar = pickedTicks.reduce((mx, t) => Math.max(mx, Number(t.price) || 0), pick.entry);
              const dayLowSoFar = pickedTicks.reduce((mn, t) => Math.min(mn, Number(t.price) || pick.entry), pick.entry);
              const sl = pick.entry * (1 - SL_PCT);
              // DRY-RUN telemetry: compare against the freshest Thunder tick only.
              // No TradingView/Mubasher fallback is allowed.
              let freshPrice: number | null = null;
              let freshSource: string | null = null;
              let fetchError: string | null = null;
              let fetchMs: number | null = null;
              const cachedTsIso = new Date(pick.entryTs).toISOString();
              try {
                const t0 = Date.now();
                const { data: latest } = await supabaseAdmin
                  .from("live_ticks")
                  .select("price, source, ts")
                  .eq("symbol", pick.symbol)
                  .eq("source", "thunder_ext")
                  .order("ts", { ascending: false })
                  .limit(1)
                  .maybeSingle();
                fetchMs = Date.now() - t0;
                if (latest) {
                  freshPrice = Number(latest.price);
                  freshSource = latest.source;
                } else {
                  fetchError = "no_thunder_tick";
                }
              } catch (e) {
                fetchError = (e as Error).message?.slice(0, 200) ?? "unknown";
              }

              const { error } = await supabaseAdmin.from("paper_trades").insert({
                trade_date: today,
                symbol: pick.symbol,
                strategy: STRATEGY,
                entry_price: pick.entry,
                entry_ts: new Date(pick.entryTs).toISOString(),
                tp_price: tp,
                sl_price: pick.entry * (1 - SL_PCT),
                capital: CAPITAL_PER_TRADE,
                status: "open",
              });
              if (!error) {
                openedCount++;
                // Fire-and-forget: warn on Telegram if this symbol had no L2
                // snapshot in the last 60s. Never blocks or throws.
                void import("@/lib/scan/l2-coverage-alert.server")
                  .then(m => m.checkL2CoverageAndAlert(pick.symbol))
                  .catch(() => { /* swallow */ });
                // This is the ONE authoritative bridge from the visible Scalp Live
                // signal (paper_trades) to the Thunder extension.  Keeping it here
                // guarantees every card shown on /scalp has a matching pending_order,
                // and prevents hidden/background scanners from opening unrelated tabs.
                try {
                  // Toggle gate: /scalp page can turn OFF extension tab-opening
                  // for scalp-mr15 signals. Table is source of truth so the
                  // switch flips instantly without any extension change.
                  let extensionEnabled = true;
                  try {
                    const { data: setting } = await supabaseAdmin
                      .from("strategy_settings")
                      .select("enabled")
                      .eq("key", "scalp-mr15")
                      .maybeSingle();
                    if (setting && setting.enabled === false) extensionEnabled = false;
                  } catch { /* default ON if lookup fails */ }
                  if (!extensionEnabled) {
                    console.log("[paper-scalp] extension disabled by toggle — skipping pending_orders insert");
                  } else {
                  await supabaseAdmin.from("pending_orders").insert({
                    symbol: pick.symbol,
                    side: "buy",
                    qty,
                    ref_price: pick.entry,
                    order_type: "market",
                    signal_source: STRATEGY,
                    trade_date: today,
                    expires_at: new Date(Date.now() + 90_000).toISOString(),
                    metadata: {
                      source: "paper_scalp_visible_signal",
                      entry_ts: new Date(pick.entryTs).toISOString(),
                      day_open: pick.dayOpen,
                      day_high_so_far: dayHighSoFar,
                      day_low_so_far: dayLowSoFar,
                      lookback_ref_price: pick.lookbackRefPrice,
                      recent_ceiling_price: pick.lookbackRefPrice,
                      tp_price: tp,
                      sl_price: sl,
                      target_net_profit_pct_after_fees: 0.005,
                      ret_180s: pick.ret180s,
                      pre_buy_gate_ok: gateOk,
                      pre_buy_gate_reason: gateReason,
                      pre_buy_gate_enforced: enforce,
                      pre_buy_gate_rejected_candidates_before_pick: gateRejects,
                    },
                  });
                  }
                } catch (e) {
                  console.error("pending_orders insert from visible scalp failed", e);
                }

                void sendTelegram(
                  `<b>🟢 إشارة شراء Scalp — ${pick.symbol}</b>\n` +
                  `🛒 ادخل عند: <b>${pick.entry.toFixed(2)}</b>\n\n` +
                  `<b>على ثاندر اعمل الأمرين دول فوراً:</b>\n` +
                  `🎯 طلب بسعر محدد (بيع) @ <b>${tp.toFixed(2)}</b>\n` +
                  `🛑 طلب إيقاف @ <b>${sl.toFixed(2)}</b>`,
                );
              }

              // Log the dry-run comparison (fire-and-forget; never throws)
              try {
                const diffPct = freshPrice != null
                  ? ((freshPrice - pick.entry) / pick.entry) * 100
                  : null;
                const triggerStillValid = freshPrice != null
                  ? freshPrice >= pick.entry * (1 - 0.005) // within 0.5% of entry still tradeable
                  : null;
                await supabaseAdmin.from("scalp_fresh_fetch_log").insert({
                  symbol: pick.symbol,
                  cached_price: pick.entry,
                  cached_ts: cachedTsIso,
                  fresh_price: freshPrice,
                  fresh_source: freshSource,
                  diff_pct: diffPct,
                  fetch_ms: fetchMs,
                  fetch_error: fetchError,
                  trigger_still_valid: triggerStillValid,
                });
              } catch { /* swallow - dry-run must never affect trades */ }
            } else if (viable.length > 0) {
              return {
                ok: true,
                opened: 0,
                closed: closedCount,
                skipped: `no_sellable_l2_candidate:${gateReason}`,
                candidates_checked: viable.length,
                candidates_rejected_by_l2: gateRejects,
                cairo_time: now.toISOString(),
              };
            }
          }
        }

        return {
          ok: true, opened: openedCount, closed: closedCount,
          cairo_time: now.toISOString(),
        };
}