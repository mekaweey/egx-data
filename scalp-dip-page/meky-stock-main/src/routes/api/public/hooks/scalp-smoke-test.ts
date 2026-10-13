import { createFileRoute } from "@tanstack/react-router";

/**
 * Pre-market smoke test — runs the real pre-buy L2 gate against the most
 * active symbol from live_ticks today. Verifies end-to-end that:
 *   1) runPreBuyL2Gate is callable
 *   2) pre_buy_gate_log receives a row
 *   3) The decision path returns without throwing
 *
 * Sends Telegram alert on failure so the user notices before the market opens.
 * Uses source='smoke_test' so rows are separable from real paper-scalp rows.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
} as const;

async function handler() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { runPreBuyL2Gate } = await import("@/lib/scalp-feasibility/pre-buy-gate.server");
  const { sendTelegram } = await import("@/lib/notifications/telegram.server");

  const start = Date.now();
  const errors: string[] = [];
  let symbol = "COMI";
  let gateReason = "";
  let gateOk = false;
  let rowWritten = false;

  try {
    // Pick most recent symbol with a snapshot in last 24h; fall back to COMI.
    const { data: latest } = await supabaseAdmin
      .from("orderbook_snapshots")
      .select("symbol")
      .order("ts", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latest?.symbol) symbol = String(latest.symbol);

    // Read a plausible entry_price from the latest thunder tick.
    const { data: tick } = await supabaseAdmin
      .from("live_ticks").select("price").eq("symbol", symbol)
      .eq("source", "thunder_ext").order("ts", { ascending: false }).limit(1).maybeSingle();
    const entry_price = Number(tick?.price ?? 10);
    const qty = Math.max(1, Math.floor(10_000 / Math.max(0.01, entry_price)));

    const beforeCount = await supabaseAdmin
      .from("pre_buy_gate_log")
      .select("id", { count: "exact", head: true })
      .eq("source", "smoke_test");

    const gate = await runPreBuyL2Gate({
      symbol, entry_price, qty,
      tp_pct: 0.005, fee_pct: 0.0012,
      source: "smoke_test",
    });
    gateOk = gate.ok;
    gateReason = gate.reason;

    const afterCount = await supabaseAdmin
      .from("pre_buy_gate_log")
      .select("id", { count: "exact", head: true })
      .eq("source", "smoke_test");

    rowWritten = (afterCount.count ?? 0) > (beforeCount.count ?? 0);
    if (!rowWritten) errors.push("row_not_written_to_pre_buy_gate_log");
  } catch (e) {
    errors.push(`throw:${(e as Error).message?.slice(0, 120) ?? "unknown"}`);
  }

  const passed = errors.length === 0;
  const elapsed = Date.now() - start;
  const emoji = passed ? "✅" : "🔴";
  const status = passed ? "الاختبار نجح" : "الاختبار فشل";

  const text =
    `<b>${emoji} Smoke Test — البوابة قبل السوق</b>\n` +
    `الحالة: <b>${status}</b>\n\n` +
    `العملة: <b>${symbol}</b>\n` +
    `قرار البوابة: <code>${gateOk ? "accept" : "reject"} — ${gateReason || "n/a"}</code>\n` +
    `الصف اتكتب في pre_buy_gate_log: <b>${rowWritten ? "نعم" : "لأ"}</b>\n` +
    `المدة: ${elapsed}ms\n` +
    (errors.length ? `\n<b>الأخطاء:</b>\n${errors.map(e => `• <code>${e}</code>`).join("\n")}` : "") +
    (passed
      ? "\n\nكل حاجة تمام. البوابة جاهزة."
      : "\n\n🔴 <b>لا تشتري اليوم بدون مراجعة</b> — فيه خطأ في البوابة.");

  await sendTelegram(text);

  return Response.json({
    ok: passed, symbol, gate_ok: gateOk, gate_reason: gateReason,
    row_written: rowWritten, elapsed_ms: elapsed, errors,
  }, { headers: CORS });
}

export const Route = createFileRoute("/api/public/hooks/scalp-smoke-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
