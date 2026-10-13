import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { decideORB } from "@/lib/sniper/orb-decision.server";

/** Compute ATR(14) from last 15+ daily candles for the symbol. */
async function getATR(symbol: string, entry: number): Promise<number> {
  const { data } = await supabaseAdmin
    .from("daily_candles").select("high,low,close")
    .eq("symbol", symbol).order("date", { ascending: false }).limit(15);
  if (!data || data.length < 2) return entry * 0.02;
  const rows = data.slice().reverse();
  let sum = 0, n = 0;
  for (let i = 1; i < rows.length; i++) {
    const h = +rows[i].high, l = +rows[i].low, pc = +rows[i - 1].close;
    sum += Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)); n++;
  }
  return n ? sum / n : entry * 0.02;
}

/** Runs at 10:30 Cairo → computes ORB decision, persists, notifies via Telegram. */
export const Route = createFileRoute("/api/public/hooks/sniper-decide")({
  server: {
    handlers: {
      POST: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { data: pick } = await supabaseAdmin
          .from("sniper_picks").select("*").eq("pick_date", today).maybeSingle();
        if (!pick) return Response.json({ ok: false, reason: "no pick" });

        const orb = await decideORB(pick.symbol);
        const entry = orb.currentPrice ?? (pick.entry_price ? +pick.entry_price : 0);
        if (!entry) return Response.json({ ok: false, reason: "no entry price available" });
        // Dynamic ATR-based trailing stop plan
        const atr = await getATR(pick.symbol, entry);
        const trailingPlan = {
          initial_stop: +(entry - 1.5 * atr).toFixed(2),
          activation_price: +(entry + 1.0 * atr).toFixed(2),
          trail_atr_mult: 2,
          step_pct: +((atr / entry) * 100).toFixed(2),
          atr: +atr.toFixed(3),
          description_ar: `وقف ابتدائي عند ${(entry - 1.5 * atr).toFixed(2)}. بعد ${(entry + 1.0 * atr).toFixed(2)} يبدأ التحريك خلف القمة بمسافة ${(2 * atr).toFixed(2)}.`,
        };
        await supabaseAdmin.from("sniper_picks").update({
          orb_high: orb.orbHigh, orb_low: orb.orbLow,
          orb_decision: orb.decision, orb_confidence: orb.confidence,
          position_pct: orb.positionPct,
          entry_price: entry,
          target_price: entry * 1.04,
          stop_price: trailingPlan.initial_stop,
          trailing_plan: trailingPlan as never,
          status: orb.decision === "SKIP" ? "skipped" : "active",
          notified_at: new Date().toISOString(),
        }).eq("id", pick.id);

        const tgKey = process.env.TELEGRAM_API_KEY;
        const tgChat = process.env.TELEGRAM_CHAT_ID;
        if (tgKey && tgChat) {
          const emoji = orb.decision === "BUY" ? "🟢" : orb.decision === "BUY_LIGHT" ? "🟡" : "🔴";
          const msg = `${emoji} *Sniper ${orb.decision}*\nسهم: *${pick.symbol}* (${pick.name_ar ?? ""})\nسعر: ${entry.toFixed(2)} ج.م\nORB: ${orb.orbLow?.toFixed(2)}-${orb.orbHigh?.toFixed(2)}\nنسبة الدخول: ${orb.positionPct}%\nثقة: ${orb.confidence.toFixed(0)}%\n${orb.reason}\n\n🛡️ ${trailingPlan.description_ar}`;
          await fetch(`https://api.telegram.org/bot${tgKey}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: tgChat, text: msg, parse_mode: "Markdown" }),
          }).catch(() => null);
        }
        return Response.json({ ok: true, orb });
      },
    },
  },
});