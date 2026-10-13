import { createFileRoute } from "@tanstack/react-router";

/**
 * End-of-day scalp gate report — runs after the market closes.
 * Summarises: signals count, gate decisions, L2 coverage,
 * paper-trade outcomes, and cron success rate for paper-scalp-runner.
 * Sends the full report to Telegram so the user can decide whether
 * to flip PRE_BUY_L2_ENFORCE=1 the next trading day.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
} as const;

function cairoDateISO(d: Date) {
  return new Date(d.toLocaleString("en-US", { timeZone: "Africa/Cairo" }))
    .toISOString().slice(0, 10);
}

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const dry = url.searchParams.get("dry") === "1";
  const dateOverride = url.searchParams.get("date"); // YYYY-MM-DD
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { sendTelegram } = await import("@/lib/notifications/telegram.server");

  const now = new Date();
  const today = dateOverride ?? cairoDateISO(now);
  const dayStart = `${today}T07:00:00Z`;   // 10:00 Cairo
  const dayEnd = `${today}T13:00:00Z`;     // 16:00 Cairo

  const [gateRows, tradeRows, cronRows] = await Promise.all([
    supabaseAdmin
      .from("pre_buy_gate_log")
      .select("decision, reason, snapshot_ts, symbol, ts")
      .gte("ts", dayStart).lte("ts", dayEnd)
      .eq("source", "paper-scalp"),
    supabaseAdmin
      .from("paper_trades")
      .select("symbol, entry_ts, exit_reason, pnl, pnl_pct")
      .eq("trade_date", today).eq("strategy", "scalp-mr15"),
    supabaseAdmin.rpc("get_cron_runs", { p_limit: 500 }),
  ]);

  const gates = gateRows.data ?? [];
  const trades = (tradeRows.data ?? []) as Array<{ symbol: string; entry_ts: string; exit_reason: string | null; pnl: number | null; pnl_pct: number | null }>;
  const cronAll = (cronRows.data ?? []) as Array<{ jobname: string; status: string; start_time: string }>;

  // Real L2 pre-entry coverage: for each trade, does a snapshot exist in
  // [entry_ts - 5min, entry_ts]? This is the metric that actually matters —
  // the extension being "generally healthy" is not enough.
  let tradesWithL2 = 0;
  const missing: string[] = [];
  for (const t of trades) {
    const et = new Date(t.entry_ts).getTime();
    const from = new Date(et - 5 * 60_000).toISOString();
    const to = new Date(et).toISOString();
    const { count } = await supabaseAdmin
      .from("orderbook_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("symbol", t.symbol)
      .gte("ts", from).lte("ts", to);
    if ((count ?? 0) > 0) tradesWithL2++;
    else missing.push(t.symbol);
  }
  const preEntryL2Pct = trades.length > 0 ? Math.round((tradesWithL2 / trades.length) * 100) : 0;

  // Enforcement readiness: need ≥70% pre-entry L2 for 3 consecutive trading days.
  // Query the last 2 EOD reports (stored in pre_buy_gate_log via source? we don't
  // have a dedicated table, so we recompute for the previous 2 trading days).
  async function preEntryPctFor(day: string): Promise<{ pct: number; total: number }> {
    const { data: dTr } = await supabaseAdmin
      .from("paper_trades")
      .select("symbol, entry_ts")
      .eq("trade_date", day).eq("strategy", "scalp-mr15");
    const rows = (dTr ?? []) as Array<{ symbol: string; entry_ts: string }>;
    if (rows.length === 0) return { pct: 0, total: 0 };
    let w = 0;
    for (const t of rows) {
      const et = new Date(t.entry_ts).getTime();
      const { count } = await supabaseAdmin
        .from("orderbook_snapshots")
        .select("id", { count: "exact", head: true })
        .eq("symbol", t.symbol)
        .gte("ts", new Date(et - 5 * 60_000).toISOString())
        .lte("ts", new Date(et).toISOString());
      if ((count ?? 0) > 0) w++;
    }
    return { pct: Math.round((w / rows.length) * 100), total: rows.length };
  }

  // Compute previous 2 trading days (skip Fri=5 and Sat=6)
  function prevTradingDay(iso: string, back: number): string {
    let d = new Date(iso + "T00:00:00Z");
    let count = 0;
    while (count < back) {
      d = new Date(d.getTime() - 86400_000);
      const dow = d.getUTCDay();
      if (dow !== 5 && dow !== 6) count++;
    }
    return d.toISOString().slice(0, 10);
  }
  const dayMinus1 = prevTradingDay(today, 1);
  const dayMinus2 = prevTradingDay(today, 2);
  const [p1, p2] = await Promise.all([preEntryPctFor(dayMinus1), preEntryPctFor(dayMinus2)]);
  const consecutive3d = preEntryL2Pct >= 70 && p1.pct >= 70 && p2.pct >= 70
    && trades.length >= 3 && p1.total >= 3 && p2.total >= 3;

  const gateCount = gates.length;
  const accept = gates.filter(g => g.decision === "accept").length;
  const reject = gateCount - accept;
  const hasL2 = gates.filter(g => g.snapshot_ts != null).length;
  const l2Pct = gateCount > 0 ? Math.round((hasL2 / gateCount) * 100) : 0;

  const rejReasons = new Map<string, number>();
  for (const g of gates.filter(g => g.decision === "reject")) {
    const key = String(g.reason ?? "").split(":")[0] || "unknown";
    rejReasons.set(key, (rejReasons.get(key) ?? 0) + 1);
  }
  const topReasons = [...rejReasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const tp = trades.filter(t => t.exit_reason === "TP" || t.exit_reason === "TRAIL").length;
  const sl = trades.filter(t => t.exit_reason === "SL").length;
  const time = trades.filter(t => t.exit_reason === "TIME").length;
  const eod = trades.filter(t => t.exit_reason === "EOD").length;
  const pnlTotal = trades.reduce((s, t) => s + Number(t.pnl ?? 0), 0);

  const cronToday = cronAll.filter(r => r.jobname === "paper-scalp-runner"
    && new Date(r.start_time) >= new Date(dayStart)
    && new Date(r.start_time) <= new Date(dayEnd));
  const cronSuccess = cronToday.filter(r => r.status === "succeeded").length;
  const cronTotal = cronToday.length;
  const cronPct = cronTotal > 0 ? Math.round((cronSuccess / cronTotal) * 100) : 0;

  // Success criteria per plan
  const check1 = gateCount >= 5;
  const check2 = gateCount > 0 && gateCount === trades.length + reject; // best-effort: signals with gate
  const check3 = preEntryL2Pct >= 70;
  const check4 = cronPct >= 90;
  const allPassed = check1 && check3 && check4;
  const enforcementReady = consecutive3d && check4;

  const reasonsText = topReasons.length
    ? topReasons.map(([k, v]) => `  • <code>${k}</code>: ${v}`).join("\n")
    : "  —";

  const text =
    `<b>📊 تقرير آخر اليوم — بوابة Scalp</b>\n` +
    `التاريخ: <b>${today}</b>\n\n` +
    `<b>1) الإشارات</b>\n` +
    `عدد الإشارات: <b>${gateCount}</b> (${check1 ? "✅ ≥5" : "⚠️ <5"})\n\n` +
    `<b>2) قرار البوابة</b>\n` +
    `قبول: <b>${accept}</b> | رفض: <b>${reject}</b>\n` +
    `أسباب الرفض:\n${reasonsText}\n\n` +
    `<b>3) تغطية L2 قبل الدخول (5 دقايق)</b>\n` +
    `صفقات عندها L2: <b>${tradesWithL2}/${trades.length}</b> (${preEntryL2Pct}%) ${check3 ? "✅" : "⚠️ <70%"}\n` +
    `اليوم-1: ${p1.pct}% (${p1.total}) | اليوم-2: ${p2.pct}% (${p2.total})\n\n` +
    `<b>4) نتائج الصفقات (paper)</b>\n` +
    `TP/TRAIL: ${tp} | SL: ${sl} | TIME: ${time} | EOD: ${eod}\n` +
    `صافي PnL: <b>${pnlTotal.toFixed(2)} ج</b>\n\n` +
    `<b>5) صحة الـ Cron</b>\n` +
    `paper-scalp-runner: <b>${cronSuccess}/${cronTotal}</b> (${cronPct}%) ${check4 ? "✅" : "⚠️ <90%"}\n\n` +
    `<b>${enforcementReady ? "✅ جاهز للـ enforce (3 أيام متتالية ≥70%)" : allPassed ? "⚠️ اليوم كويس بس لسه محتاج أيام متتالية" : "⚠️ فيه معيار ما اتحققش"}</b>\n` +
    (enforcementReady
      ? "تقدر تفعّل يدويًا PRE_BUY_L2_ENFORCE=1 بثقة."
      : "لسه ما نلمسش enforce. راجع الأرقام فوق.");

  if (!dry) await sendTelegram(text);

  return Response.json({
    ok: true, today,
    dry,
    gate_count: gateCount, accept, reject, l2_pct: l2Pct,
    pre_entry_l2: { covered: tradesWithL2, total: trades.length, pct: preEntryL2Pct, missing },
    prev_days: { [dayMinus1]: p1, [dayMinus2]: p2 },
    enforcement_ready: enforcementReady,
    reject_reasons: Object.fromEntries(rejReasons),
    trades: { tp, sl, time, eod, pnl_total: pnlTotal, total: trades.length },
    cron: { success: cronSuccess, total: cronTotal, pct: cronPct },
    checks: { signals_ge_5: check1, l2_ge_70pct: check3, cron_ge_90pct: check4, all_passed: allPassed },
  }, { headers: CORS });
}

export const Route = createFileRoute("/api/public/hooks/scalp-eod-report")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
