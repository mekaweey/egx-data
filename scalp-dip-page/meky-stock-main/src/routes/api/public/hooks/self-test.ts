import { createFileRoute } from "@tanstack/react-router";
import { getMarketStatus } from "@/lib/market-hours";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Comprehensive self-test for the whole collection + automation pipeline.
 * Read-only. يجيب حالة كل مصدر بيانات + كل cron job مهم.
 *
 * يستدعى من:
 *  - صفحة /health-check (يدوي، polling كل 30ث)
 *  - cron جدولة 10:15 و 14:45 القاهرة → لو overall=red يبعت تليجرام
 *
 * URL: GET or POST /api/public/hooks/self-test
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

type Level = "green" | "yellow" | "red" | "idle";
type Check = {
  key: string;
  label: string;
  category: "data" | "cron" | "output";
  status: Level;
  evidence: string;
  expected: string;
  detail: string;
};

async function runSelfTest(now: Date) {
  const market = getMarketStatus(now);
  const marketOpen = market.isOpen;
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const since5m = new Date(now.getTime() - 5 * 60_000).toISOString();
  const since24h = new Date(now.getTime() - 24 * 60 * 60_000).toISOString();
  const today = new Date(now.getTime()); today.setUTCHours(0, 0, 0, 0);
  const todayIso = today.toISOString().slice(0, 10);

  // ============ Data source checks ============
  const [
    tickLatest, tick5m,
    obLatest, obMarketHours, obDiversity,
    wlLatest,
    feasLatest, feasFillL2,
    signalsToday,
  ] = await Promise.all([
    supabaseAdmin.from("live_ticks").select("ts").eq("source", "thunder_ext")
      .order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("live_ticks").select("symbol", { count: "exact", head: true })
      .eq("source", "thunder_ext").gte("ts", since5m),
    supabaseAdmin.from("orderbook_snapshots").select("ts")
      .order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("orderbook_snapshots").select("symbol", { count: "exact", head: true })
      .gte("ts", since24h),
    supabaseAdmin.from("orderbook_snapshots").select("symbol").gte("ts", since24h).limit(2000),
    supabaseAdmin.from("thunder_watchlist_snapshots").select("ts")
      .order("ts", { ascending: false }).limit(1).maybeSingle(),
    supabaseAdmin.from("scalp_feasibility_report").select("computed_at, l2_at_signal_ts")
      .order("computed_at", { ascending: false }).limit(50),
    supabaseAdmin.from("scalp_feasibility_report").select("l2_at_signal_ts", { count: "exact", head: true })
      .not("l2_at_signal_ts", "is", null).gte("computed_at", since24h),
    supabaseAdmin.from("scalp_signal_log").select("id", { count: "exact", head: true })
      .eq("trade_date", todayIso),
  ]);

  const ageSec = (iso: string | null | undefined) =>
    iso ? Math.max(0, Math.round((now.getTime() - new Date(iso).getTime()) / 1000)) : null;

  const tickAge = ageSec(tickLatest.data?.ts);
  const obAge = ageSec(obLatest.data?.ts);
  const wlAge = ageSec(wlLatest.data?.ts);
  const obDistinct = new Set((obDiversity.data ?? []).map((r: { symbol: string }) => r.symbol)).size;
  const feasLastAge = ageSec(feasLatest.data?.[0]?.computed_at);
  const feasTotal = feasLatest.data?.length ?? 0;
  const feasFilled = feasFillL2.count ?? 0;

  const checks: Check[] = [];

  // 1) live_ticks
  checks.push({
    key: "ticks",
    label: "💹 Live ticks",
    category: "data",
    status: !marketOpen ? "idle" : tickAge == null ? "red" : tickAge >= 180 ? "red" : tickAge >= 90 ? "yellow" : "green",
    evidence: tickAge == null ? "لا يوجد أي tick" : `آخر tick من ${tickAge}s · ${tick5m.count ?? 0} في آخر 5د`,
    expected: marketOpen ? "tick كل ~2ث" : "السوق مغلق",
    detail: "قراءة من live_ticks حيث source=thunder_ext",
  });

  // 2) L2 orderbook — count + diversity in market hours
  const l2Ok = obMarketHours.count != null && obMarketHours.count >= 200 && obDistinct >= 30;
  const l2Warn = obMarketHours.count != null && obMarketHours.count >= 80 && obDistinct >= 15;
  checks.push({
    key: "l2",
    label: "📚 L2 Orderbook",
    category: "data",
    status: !marketOpen && obAge != null && obAge > 3600 ? "idle"
      : l2Ok ? "green" : l2Warn ? "yellow" : "red",
    evidence: `${obMarketHours.count ?? 0} snapshot / ${obDistinct} رمز في آخر 24س · آخر: ${obAge != null ? Math.round(obAge/60)+"د" : "—"}`,
    expected: "≥200 snapshot و ≥30 رمز في آخر 24س",
    detail: "لو 14 رمز فقط = هي المشكلة اللي حصلت النهاردة",
  });

  // 3) watchlist
  checks.push({
    key: "watchlist",
    label: "👁️ Watchlist",
    category: "data",
    status: !marketOpen ? "idle" : wlAge == null ? "red" : wlAge >= 900 ? "red" : wlAge >= 400 ? "yellow" : "green",
    evidence: wlAge == null ? "لا يوجد" : `آخر تحديث من ${Math.round(wlAge/60)}د`,
    expected: "تحديث كل ~دقيقة",
    detail: "thunder_watchlist_snapshots",
  });

  // ============ Cron job checks ============
  const cronRuns = await supabaseAdmin.rpc("get_cron_runs", { p_limit: 500 });
  type Run = { jobid: number; jobname: string | null; status: string; return_message: string | null; start_time: string };
  const runs = (cronRuns.data ?? []) as Run[];
  const latestPerJob = new Map<string, Run>();
  for (const r of runs) {
    if (!r.jobname) continue;
    if (!latestPerJob.has(r.jobname)) latestPerJob.set(r.jobname, r);
  }

  function cronCheck(key: string, label: string, jobname: string, maxAgeSec: number, warnAgeSec: number) {
    const r = latestPerJob.get(jobname);
    if (!r) {
      checks.push({ key, label, category: "cron", status: marketOpen ? "red" : "idle",
        evidence: "لم يشتغل نهائياً في آخر 500 تشغيل", expected: `كل ≤${Math.round(maxAgeSec/60)}د`, detail: jobname });
      return;
    }
    const age = ageSec(r.start_time) ?? 999999;
    const failed = r.status !== "succeeded";
    // خارج ساعات السوق كتير من الـ crons بتاعتنا معطلة عمداً — منديش أحمر
    const status: Level = !marketOpen && age > maxAgeSec ? "idle"
      : failed ? "red"
      : age >= maxAgeSec ? "red"
      : age >= warnAgeSec ? "yellow"
      : "green";
    checks.push({
      key, label, category: "cron", status,
      evidence: `آخر تشغيل من ${Math.round(age/60)}د · ${r.status}${r.return_message ? " — " + r.return_message.slice(0, 60) : ""}`,
      expected: `كل ≤${Math.round(maxAgeSec/60)}د بنجاح`,
      detail: jobname,
    });
  }

  cronCheck("cron_feas", "⚙️ compute-scalp-feasibility-15m", "compute-scalp-feasibility-15m", 30*60, 20*60);
  cronCheck("cron_paper", "⚙️ paper-scalp-runner", "paper-scalp-runner", 180, 120);
  cronCheck("cron_signals", "⚙️ scalp-signal-logger", "scalp-signal-logger", 180, 120);
  cronCheck("cron_sniper", "⚙️ sniper-orb-poll", "sniper-orb-poll", 30*60, 20*60);

  // ============ Output/quality checks ============
  checks.push({
    key: "feas_recent",
    label: "📊 تقرير الجدوى محدث",
    category: "output",
    status: !marketOpen ? "idle"
      : feasLastAge == null ? "red" : feasLastAge >= 3600 ? "red" : feasLastAge >= 1800 ? "yellow" : "green",
    evidence: feasLastAge == null ? "لا يوجد" : `آخر حساب من ${Math.round(feasLastAge/60)}د · ${feasTotal} صف`,
    expected: "≤30د",
    detail: "scalp_feasibility_report.computed_at",
  });

  const l2Pct = feasTotal > 0 ? (feasFilled / feasTotal) * 100 : 0;
  checks.push({
    key: "feas_l2_fill",
    label: "📊 L2 موجود في تقرير الجدوى",
    category: "output",
    status: !marketOpen ? "idle" : feasTotal === 0 ? "idle" : l2Pct >= 50 ? "green" : l2Pct >= 20 ? "yellow" : "red",
    evidence: `${feasFilled}/${feasTotal} صف عنده l2_at_signal_ts (${l2Pct.toFixed(0)}%)`,
    expected: "≥50% في ساعات السوق",
    detail: "لو المصدر 2 (L2) متعطل، الرقم ده هيسقط",
  });

  checks.push({
    key: "signals_today",
    label: "🎯 إشارات النهارده",
    category: "output",
    status: !marketOpen && (signalsToday.count ?? 0) === 0 ? "idle"
      : (signalsToday.count ?? 0) > 0 ? "green" : "yellow",
    evidence: `${signalsToday.count ?? 0} إشارة في scalp_signal_log للنهارده`,
    expected: "≥1 إشارة في يوم تداول عادي",
    detail: "قد يكون طبيعي في السوق الهادئ",
  });

  const overall: Level = checks.some(c => c.status === "red") ? "red"
    : checks.some(c => c.status === "yellow") ? "yellow"
    : !marketOpen ? "idle" : "green";

  return { now: now.toISOString(), marketOpen, marketLabel: market.label, overall, checks };
}

export const Route = createFileRoute("/api/public/hooks/self-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: async () => {
        const result = await runSelfTest(new Date());
        return new Response(JSON.stringify({ ok: true, ...result }), {
          status: 200, headers: { "Content-Type": "application/json", ...CORS },
        });
      },
      POST: async () => {
        // POST يستخدمه cron: لو overall=red يبعت تليجرام
        const result = await runSelfTest(new Date());
        let telegramSent = false;
        if (result.overall === "red") {
          const failing = result.checks.filter(c => c.status === "red");
          const lines = failing.map(c => `• <b>${escapeHtml(c.label)}</b>\n  ${escapeHtml(c.evidence)}\n  <i>متوقع: ${escapeHtml(c.expected)}</i>`);
          const text = `⚠️ <b>فحص التجميع الشامل — فيه مشاكل</b>\n\n${lines.join("\n\n")}\n\n🕐 ${new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" })}`;
          try { await sendTelegram(text); telegramSent = true; } catch (e) { console.error("telegram", e); }
        } else if (result.overall === "yellow") {
          const failing = result.checks.filter(c => c.status === "yellow");
          const lines = failing.map(c => `• ${escapeHtml(c.label)}: ${escapeHtml(c.evidence)}`);
          try {
            await sendTelegram(`🟡 <b>فحص التجميع — بطء</b>\n\n${lines.join("\n")}`);
            telegramSent = true;
          } catch (e) { console.error("telegram", e); }
        }
        return new Response(JSON.stringify({ ok: true, telegramSent, ...result }), {
          status: 200, headers: { "Content-Type": "application/json", ...CORS },
        });
      },
    },
  },
});