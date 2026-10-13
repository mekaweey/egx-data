import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
// momentum_weekly_signals is not in the generated Database types yet —
// same escape hatch the codebase uses for decision_audit_log.
const supabaseAdmin = _supabaseAdmin as any;
import { logEvent } from "@/lib/trade-ledger.server";
import {
  STRATEGY_ID,
  MW_PARAMS,
  BACKTEST_DISCLAIMER_AR,
  REGIME_DEF,
  scanWeeklyCandidates,
  computeSizing,
  cairoNow,
  cairoDateISO,
  isSessionDay,
  sessionsBetween,
  formatTelegramPreviewLine,
} from "@/lib/scalp-dip/momentum-weekly.server";
import { logDecisionEvent } from "@/lib/scalp-dip/scalp-dip-signals.server";
import { sendTelegram } from "@/lib/scalp-dip/telegram.server";
import { syncMarketSnapshot, fillMissingTodayCandles } from "@/lib/scalp-dip/market-sync.server";

/**
 * MOMENTUM-WEEKLY auto-runner (one daily call, fully idempotent).
 * GET /api/public/hooks/momentum-weekly-run  (optionally ?phase=candles|scan|exit|auto)
 *
 * PHASE 1 candles (every session, after ~14:35 Cairo): upsert today's candle
 *   per symbol from marketwatch_snapshots (o=first, c=last, h/l=max/min) and
 *   volume from live_ticks sum. Idempotent upsert on (symbol,date).
 * PHASE 2 scan (once per week — the first session day after the signal):
 *   calls scanWeeklyCandidates(), persists candidates to
 *   momentum_weekly_signals (unique scan_date+symbol), marks the top-N as
 *   selected, writes audit events. If regime is off → audit "REGIME_CASH".
 * PHASE 3 fill (session days): paper-gate buy fill — selected signals whose
 *   entry_date is today get bought=true at today's true open, only if the
 *   live gap is inside [-3%, +2%] (else MW_WEEKLY_GAP_SKIP, stays unbought).
 * PHASE 4 exit (first session of a new week): marks sell_signal on last
 *   week's selected open signals (WEEKLY_TIME_EXIT) — exit at the open.
 * User capital: strategy_settings key momentum_weekly_user_capital.
 */

async function upsertTodayCandles(todayISO: string): Promise<number> {
  // per-symbol first/last/max/min of last_price + tick volume sum
  const snaps: any[] = [];
  let from = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("symbol, last_price, captured_at")
      .gte("captured_at", `${todayISO}T00:00:00Z`)
      .order("captured_at", { ascending: true })
      .range(from, from + 999);
    if (!data?.length) break;
    snaps.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  const agg = new Map<string, { o: number; c: number; h: number; l: number; ts: string }>();
  for (const r of snaps) {
    const sym = String(r.symbol).toUpperCase();
    const px = Number(r.last_price);
    if (!(px > 0)) continue;
    const cur = agg.get(sym);
    if (!cur) agg.set(sym, { o: px, c: px, h: px, l: px, ts: String(r.captured_at) });
    else { cur.c = px; cur.h = Math.max(cur.h, px); cur.l = Math.min(cur.l, px); }
  }
  // volume: sum of live_ticks volumes today (may be 0 if feed lacks volume)
  const vol = new Map<string, number>();
  let vf = 0;
  while (true) {
    const { data } = await supabaseAdmin
      .from("live_ticks")
      .select("symbol, volume, ts")
      .gte("ts", `${todayISO}T00:00:00Z`)
      .order("ts", { ascending: true })
      .range(vf, vf + 999);
    if (!data?.length) break;
    for (const r of data) {
      const sym = String(r.symbol).toUpperCase();
      const v = Number(r.volume) || 0;
      vol.set(sym, (vol.get(sym) ?? 0) + v);
    }
    if (data.length < 1000) break;
    vf += 1000;
  }
  let written = 0;
  const rows: any[] = [];
  for (const [sym, a] of agg) {
    rows.push({
      symbol: sym, date: todayISO,
      open: a.o, high: a.h, low: a.l, close: a.c,
      volume: vol.get(sym) ?? 0,
    });
  }
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await supabaseAdmin
      .from("daily_candles")
      .upsert(batch, { onConflict: "symbol,date" });
    if (!error) written += batch.length;
    else console.error("[momentum-weekly] candle upsert error:", error.message);
  }
  return written;
}

async function persistWeeklyScan(opts?: { dryRun?: boolean }): Promise<any> {
  const dryRun = opts?.dryRun === true;
  const status = await scanWeeklyCandidates({ dryRun });
  const sizing = computeSizing(null); // default 100k; user capital override lands next
  const { data: capRow } = await supabaseAdmin
    .from("strategy_settings")
    .select("numeric_value")
    .eq("key", "momentum_weekly_user_capital")
    .maybeSingle();
  const cap = Number((capRow as any)?.numeric_value) || MW_PARAMS.TOTAL_CAPITAL;
  Object.assign(sizing, computeSizing(cap));

  if (status.status === "regime_off") {
    await logDecisionEvent({
      event_type: "MW_REGIME_CASH",
      symbol: "-",
      details: { regime_cum10: status.regimeCum10, signal_date: status.signalDate },
    });
    return { ok: true, status: status.status, label: status.statusLabelAr };
  }
  if (status.status !== "ready") {
    return { ok: true, status: status.status, label: status.statusLabelAr };
  }

  const selectedSymbols = new Set(status.selected.map((c) => c.symbol));
  // apply the same live risk overlays the page uses (vol-target × crash-cut)
  const slotCapital = Math.round(sizing.slot_capital * (status.protectionScale ?? 1));
  if (dryRun) {
    return {
      ok: true,
      dryRun: true,
      status: status.status,
      selected: [...selectedSymbols],
      wouldPersist: status.candidates.map((c) => c.symbol),
      sizing,
    };
  }
  let written = 0;
  for (const c of status.candidates) {
    const selected = selectedSymbols.has(c.symbol);
    const posValue = selected ? slotCapital : 0;
    const { error } = await supabaseAdmin
      .from("momentum_weekly_signals")
      .upsert(
        {
          scan_date: status.signalDate,
          entry_date: status.entryDate,
          exit_date: status.exitDate,
          symbol: c.symbol,
          last_close: c.last_close,
          mom5: c.mom5,
          v20_money: c.v20_money,
          near_high: c.near_high,
          fresh_high: c.fresh_high,
          position_value: posValue,
          shares: selected && c.last_close > 0 ? Math.floor(posValue / c.last_close) : 0,
          selected,
          regime_on: true,
        },
        { onConflict: "scan_date,symbol", ignoreDuplicates: true },
      );
    if (!error) written++;
  }
  await logDecisionEvent({
    event_type: "MW_WEEKLY_SCAN",
    symbol: "-",
    details: {
      signal_date: status.signalDate,
      entry_date: status.entryDate,
      exit_date: status.exitDate,
      selected: [...selectedSymbols],
      sizing,
      // audit Oct-4 (task 5): regime value + definition logged every scan.
      regime_cum10: status.regimeCum10,
      regime_def: status.regimeDef,
      reject_count: (status.rejectReasons ?? []).length,
      disclaimer: BACKTEST_DISCLAIMER_AR,
    },
  });
  return { ok: true, status: "ready", written, selected: [...selectedSymbols], sizing };
}

async function fillWeeklyBuys(todayISO: string, opts?: { dryRun?: boolean }): Promise<any> {
  // Paper-gate buy fill (gap fix 2026-09-24): selected nominations whose
  // entry_date is TODAY are bought at today's TRUE session open (written by
  // the candles phase from the scanner) — only if the live gap stays inside
  // the band ([-3%, +2%] vs the signal-session close). Runs once per signal
  // (bought flag + update guard = idempotent); a missed entry day is never
  // filled late, and opens outside the band are skipped (no chasing).
  // Audit Oct-4 (task 10): dryRun computes without writing or alerting.
  const dryRun = opts?.dryRun === true;
  const { data: due, error } = await supabaseAdmin
    .from("momentum_weekly_signals")
    .select("*")
    .eq("selected", true)
    .eq("bought", false)
    .eq("entry_date", todayISO);
  if (error) {
    return { ok: true, skipped: "weekly table missing" };
  }
  const out: any[] = [];
  for (const sig of due ?? []) {
    const { data: todayCandle } = await supabaseAdmin
      .from("daily_candles")
      .select("open")
      .eq("symbol", sig.symbol)
      .eq("date", todayISO)
      .maybeSingle();
    const open = Number(todayCandle?.open);
    if (!(open > 0)) continue; // no open price yet — candles phase fills it first
    const lastClose = Number(sig.last_close);
    const gap = lastClose > 0 ? open / lastClose - 1 : 0;
    if (gap < MW_PARAMS.GAP_MIN || gap > MW_PARAMS.GAP_MAX) {
      if (!dryRun) {
        await logDecisionEvent({
          event_type: "MW_WEEKLY_GAP_SKIP",
          symbol: sig.symbol,
          details: { gap_pct: gap, open, last_close: lastClose, entry_date: todayISO },
        });
      } else {
        out.push({ symbol: sig.symbol, would: "GAP_SKIP", gap_pct: gap, open });
      }
      continue; // stays unbought — the slot is idle (telegram mentions idle slots)
    }
    const shares = Math.max(1, Math.floor(Number(sig.position_value) / open));
    if (dryRun) {
      out.push({ symbol: sig.symbol, would: "BUY", buy_price: open, gap_pct: gap, shares });
      continue;
    }
    const { error: upErr } = await supabaseAdmin
      .from("momentum_weekly_signals")
      .update({
        bought: true,
        actual_buy_price: open,
        buy_timestamp: new Date().toISOString(),
        shares,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sig.id)
      .eq("bought", false);
    if (!upErr) {
      out.push({ symbol: sig.symbol, buy_price: open, gap_pct: gap, shares });
      await logDecisionEvent({
        event_type: "MW_WEEKLY_BUY",
        symbol: sig.symbol,
        trigger_price: open,
        reference_price: lastClose,
        details: { gap_pct: gap, position_value: sig.position_value, shares, entry_date: todayISO },
        user_action: "AUTO",
        action_ts: new Date().toISOString(),
      });
    }
  }
  return { ok: true, buys: out };
}

async function markWeeklyExits(todayISO: string, opts?: { dryRun?: boolean }): Promise<any> {
  // Audit Oct-4 (task 10): dryRun computes without writing or alerting.
  const dryRun = opts?.dryRun === true;
  // open = last week's selected & bought-but-unsold signals whose exit_date <= today
  const { data: due, error } = await supabaseAdmin
    .from("momentum_weekly_signals")
    .select("*")
    .eq("selected", true)
    .eq("bought", true)
    .eq("sold", false)
    .lte("exit_date", todayISO);
  if (error) {
    // fail-soft: the primary exit tracking lives in scalp_dip_signals via the
    // main runner; this table is the optional detailed weekly log.
    return { ok: true, skipped: "optional table missing — run migration SQL to enable" };
  }
  const out: any[] = [];
  for (const sig of due ?? []) {
    // exit price priority (bug fix 2026-09-22): (1) TODAY's scanner-synced
    // open from daily_candles (written by phase candles earlier in this call),
    // (2) marketwatch snapshot, (3) last_close fallback. The old code read
    // ONLY marketwatch (empty by design) and silently recorded the stale
    // signal-session close as the exit price.
    const { data: todayCandle } = await supabaseAdmin
      .from("daily_candles")
      .select("open")
      .eq("symbol", sig.symbol)
      .eq("date", todayISO)
      .maybeSingle();
    const { data: mw } = await supabaseAdmin
      .from("marketwatch_snapshots")
      .select("last_price, captured_at")
      .eq("symbol", sig.symbol)
      .gte("captured_at", `${todayISO}T00:00:00Z`)
      .order("captured_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    const exitPrice = Number(todayCandle?.open) || Number(mw?.last_price) || Number(sig.last_close);
    const entry = Number(sig.actual_buy_price) || Number(sig.last_close);
    const shares = Math.max(1, Math.floor(Number(sig.position_value) / entry));
    const gross = (exitPrice - entry) * shares;
    const costs = (entry + exitPrice) * shares * MW_PARAMS.COST_RT / 2;
    const pnl = gross - costs;
    if (dryRun) {
      const pnlPct = pnl / (Number(sig.position_value) || 1);
      out.push({ symbol: sig.symbol, would: "EXIT", exit_price: exitPrice, pnl, pnl_pct: pnlPct, pos: Number(sig.position_value) || 0 });
      continue;
    }
    const { error } = await supabaseAdmin
      .from("momentum_weekly_signals")
      .update({
        sold: true,
        actual_sell_price: exitPrice,
        sell_timestamp: new Date().toISOString(),
        exit_reason: "WEEKLY_TIME_EXIT",
        realized_pnl: pnl,
        realized_pnl_pct: pnl / (Number(sig.position_value) || 1),
        updated_at: new Date().toISOString(),
      })
      .eq("id", sig.id);
    if (!error) {
      const pnlPct = pnl / (Number(sig.position_value) || 1);
      out.push({ symbol: sig.symbol, exit_price: exitPrice, pnl, pnl_pct: pnlPct, pos: Number(sig.position_value) || 0 });
      await logDecisionEvent({
        event_type: "MW_WEEKLY_EXIT",
        symbol: sig.symbol,
        trigger_price: exitPrice,
        reference_price: entry,
        pnl_pct: pnlPct,
        details: { exit_reason: "WEEKLY_TIME_EXIT" },
        user_action: "AUTO",
        action_ts: new Date().toISOString(),
      });
    }
  }
  // Weekly exit telegram (2026-09-27): per-signal % + EGP on the configured
  // capital + the week total. Fires once - sold rows never re-qualify.
  // Audit Oct-4 (task 10): skipped entirely in dryRun.
  if (out.length && !dryRun) {
    try {
      const capRow = await supabaseAdmin
        .from("strategy_settings")
        .select("numeric_value")
        .eq("key", "momentum_weekly_user_capital")
        .maybeSingle();
      const cap = Number((capRow as any)?.numeric_value) || MW_PARAMS.TOTAL_CAPITAL;
      const lines = out.map(
        (x) =>
          `• ${x.symbol}: بيع @ ${Number(x.exit_price).toFixed(2)} → ${x.pnl_pct >= 0 ? "+" : ""}${(100 * x.pnl_pct).toFixed(2)}% (${x.pnl >= 0 ? "+" : ""}${Math.round(x.pnl).toLocaleString("en-US")} ج.م)`,
      );
      const total = out.reduce((a, x) => a + x.pnl, 0);
      const deployed = out.reduce((a, x) => a + x.pos, 0);
      const msg =
        `📤 خروج أسبوعي — إغلاق الدفعة\n` +
        `${lines.join("\n")}\n` +
        `الإجمالي: ${total >= 0 ? "+" : ""}${Math.round(total).toLocaleString("en-US")} ج.م على مراكز منفذة ${Math.round(deployed).toLocaleString("en-US")} ج.م (رأس المال المحدد ${cap.toLocaleString("en-US")} ج.م)`;
      await sendTelegram(msg);
    } catch (e: any) {
      console.error("[momentum-weekly] exit telegram failed:", e?.message ?? e);
    }
  }
  return { ok: true, exits: out };
}

async function handleGet(url: URL): Promise<Response> {
  try {
    const phase = url.searchParams.get("phase") ?? "auto";
    // Audit Oct-4 (task 10): dry_run computes everything without ANY write
    // (no persist/fill/exit writes, no audit logs, no Telegram). preview=1
    // returns the task-7 alert text instead of sending it.
    const dryRun = url.searchParams.get("dry_run") === "1";
    const preview = url.searchParams.get("preview") === "1" || dryRun;
    const now = cairoNow();
    const todayISO = cairoDateISO(now);
    const result: any = { strategy: STRATEGY_ID, date: todayISO, session_day: isSessionDay(now), dry_run: dryRun };

    if (phase === "candles" || phase === "auto") {
      if (isSessionDay(now)) {
        // Layer 1: scanner snapshot (whole market, one call, true session open)
        try {
          result.scanner = await syncMarketSnapshot(todayISO);
        } catch (e: any) {
          result.scanner = { error: e?.message ?? "scanner failed" };
        }
        // Layer 2: extension data fills only symbols the scanner missed
        result.candles = await upsertTodayCandles(todayISO);
        result.filled = await fillMissingTodayCandles(todayISO);
      }
    }
    if (phase === "scan" || phase === "auto") {
      // WEEKLY CADENCE GATE (bug fix 2026-09-22): nominations, persistence and
      // telegram alerts ONLY on the week's first session (Sunday). Without this
      // gate the runner nominated and alerted mid-week on every fresh session.
      const isEntryDay = now.getDay() === 0; // Sunday = EGX week start
      if (!isEntryDay) {
        result.scan = {
          status: "skipped_not_entry_day",
          label: "نظام أسبوعي: الترشيح يوم الأحد فقط",
        };
      } else {
      // scan once per week: only when a fresh signal session exists and no
      // signals persisted for it yet (idempotent via unique constraint)
      const status = await scanWeeklyCandidates({ dryRun });
      result.scan = {
        status: status.status,
        label: status.statusLabelAr,
        signal_date: status.signalDate,
        entry_date: status.entryDate,
        exit_date: status.exitDate,
        regime_on: status.regimeOn,
        regime_cum10: status.regimeCum10,
        regime_def: REGIME_DEF,
        band_count: status.bandCount,
        shortened_hold: status.shortenedHold ?? false,
        held_sessions: status.heldSessions ?? [],
      };
      if (status.signalDate && !dryRun) {
        const { data: existing } = await supabaseAdmin
          .from("momentum_weekly_signals")
          .select("id")
          .eq("scan_date", status.signalDate)
          .limit(1);
        if (!existing?.length) result.persist = await persistWeeklyScan();
        // Telegram alert — dedup via the decision audit log (exists always):
        // at most ONE buy alert per calendar day.
        const sendReady = status.status === "ready" && result.persist?.status === "ready";
        // BUG H fix (2026-09-27): the old dedup counted ANY MW_WEEKLY_SCAN event
  // today - including the one persistWeeklyScan logs moments earlier - so the
  // first scan of the day always self-blocked its own telegram alert. Dedup
  // now keys on the telegram_sent marker only.
  const { data: sentToday } = await supabaseAdmin
          .from("decision_audit_log")
          .select("id")
          .eq("event_type", "MW_WEEKLY_SCAN")
          .contains("details", { telegram_sent: true })
          .gte("created_at", `${todayISO}T00:00:00Z`)
          .limit(1);
        // Audit Oct-4 (task 7+10): preview/dry-run builds the task-7 alert
        // text with zero sends and zero writes.
        if ((dryRun || preview) && status.signalDate) {
          const slot = Math.round(status.sizing.slot_capital);
          const lines = status.selected.map((c: any) =>
            formatTelegramPreviewLine({
              symbol: c.symbol,
              mom5: c.mom5,
              momSessions: c.mom_sessions ?? "?/6",
              liqSessions: c.liq_sessions ?? "?/20",
              v20: c.v20_money,
              signalClose: c.last_close,
              verdict: "مقبول",
            }),
          );
          const rej = (status.rejectReasons ?? []).slice(0, 8).map((r: any) => `• ${r.symbol}: ${r.reason}`).join("\n");
          result.telegramPreview =
            `🔔 [PREVIEW — لم يُرسل] إشعار شراء أسبوعي — ${status.entryDate}\n` +
            `النظام: ${status.regimeOn ? "ON" : "OFF"} (تراكم ${((status.regimeCum10 ?? 0) * 100).toFixed(2)}% / ${REGIME_DEF})\n` +
            `الخروج: ${status.exitDate}${status.shortenedHold ? " (فترة حمل مختصرة!)" : ""}\n` +
            (lines.length ? lines.join("\n") + "\n" : "لا مرشحين\n") +
            (rej ? `مرفوضون (عينة):\n${rej}` : "");
        }
        if (!dryRun && !preview && sendReady && !sentToday?.length) {
          const slot = Math.round(result.persist.sizing.slot_capital);
          const picked = status.selected
            .map((c) => {
              const lo = (c.last_close * (1 + MW_PARAMS.GAP_MIN)).toFixed(2);
              const hi = (c.last_close * (1 + MW_PARAMS.GAP_MAX)).toFixed(2);
              const sh = c.last_close > 0 ? Math.floor(slot / c.last_close) : 0;
              return `• ${c.symbol}${(c as any).halal ? " ✅" : ""} — إغلاق الإشارة ${c.last_close} — اشترِ بين ${lo} و ${hi} فقط (~${sh} سهم)`;
            })
            .join("\n");
          const idleSlots = result.persist.sizing.top_n - status.selected.length;
          const idleNote = idleSlots > 0
            ? `
💰 ${idleSlots} مركز فاضي (${(idleSlots * slot).toLocaleString("en-US")} ج.م) → حطهم أذون/صندوق نقدي`
            : "";
          await sendTelegram(
            `🔔 إشعار شراء أسبوعي — ${status.entryDate}
` +
            `⏰ اشترِ في افتتاح السوق (10:00-10:15 صباحاً) وفي حدود السعر المكتوبة تحت فقط — لو السعر طلع بره الحدود متشتريش وسيب المركز فاضي
` +
            `${picked}
` +
            `💵 ${slot.toLocaleString("en-US")} ج.م لكل سهم (رأس المال ${result.persist.sizing.total_capital.toLocaleString("en-US")} ج.م ÷ ${result.persist.sizing.top_n})
` +
            `📅 الخروج: افتتاح أول جلسة الأسبوع القادم — والبيع قبل الشراء عشان الفلوس تتحرر` +
            idleNote,
          );
          await logDecisionEvent({
            event_type: "MW_WEEKLY_SCAN",
            symbol: "-",
            details: { signal_date: status.signalDate, entry_date: status.entryDate, telegram_sent: true, regime_cum10: status.regimeCum10, regime_def: REGIME_DEF },
          });
        } else if (!dryRun && !preview && status.status === "regime_off" && !sentToday?.length) {
          await sendTelegram(`⚠️ فلتر النظام: كاش هذا الأسبوع (تراكم 10 أسابيع سالب) — لا مرشحين
💰 إجراء أسبوع الكاش: حوّل رأس المال لأذون خزانة/صندوق نقدي (~0.46%/أسبوع مضمون) حتى إشعار الأحد القادم`);
          await logDecisionEvent({ event_type: "MW_WEEKLY_SCAN", symbol: "-", details: { regime_cash: true, signal_date: status.signalDate } });
        } else if (!dryRun && !preview && status.status === "no_candidates" && !sentToday?.length) {
          await sendTelegram(`ℹ️ لا مرشحين داخل نطاق الزخم (8%-45%) هذا الأسبوع — كاش
💰 إجراء أسبوع الكاش: حوّل رأس المال لأذون خزانة/صندوق نقدي (~0.46%/أسبوع مضمون) حتى إشعار الأحد القادم`);
          await logDecisionEvent({ event_type: "MW_WEEKLY_SCAN", symbol: "-", details: { no_candidates: true, signal_date: status.signalDate } });
        } else if (!dryRun && !preview && status.status === "bad_signal" && !sentToday?.length) {
          // Audit Oct-4 (task 3d): missing market-wide session = hard stop + Telegram alert.
          await sendTelegram(
            `⛔ توقف صارم — ${status.statusLabelAr}\nلا ترشيح ولا تعبئة ولا خروج حتى تُفحص البيانات (تاريخ الإشارة ${status.signalDate})`,
          );
          await logDecisionEvent({ event_type: "MW_WEEKLY_SCAN", symbol: "-", details: { bad_signal: true, signal_date: status.signalDate } });
        } else if ((dryRun || preview) && status.status === "bad_signal") {
          result.telegramPreview =
            `⛔ [PREVIEW — لم يُرسل] توقف صارم — ${status.statusLabelAr}\nلا ترشيح ولا تعبئة ولا خروج حتى تُفحص البيانات`;
        }
      }
      }
    }
    if (phase === "fill" || phase === "auto") {
      // paper buys land AFTER the candles phase wrote today's true opens
      if (isSessionDay(now)) result.fill = await fillWeeklyBuys(todayISO, { dryRun });
    }
    if (phase === "exit" || phase === "auto") {
      if (isSessionDay(now)) result.exit = await markWeeklyExits(todayISO, { dryRun });
    }
    void sessionsBetween;
    return Response.json({ ok: true, ...result });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "runner failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/momentum-weekly-run")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleGet(new URL(request.url)),
      POST: ({ request }: { request: Request }) => handleGet(new URL(request.url)),
    },
  },
});
