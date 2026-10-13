import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";
import { applyConfidenceDecay } from "@/lib/scan/confidence-decay.server";

/**
 * Stale Position Alert — runs once daily after market close (15:00 Cairo).
 * For each open recommendation, applies confidence-decay. If age ≥ 5 days
 * AND price moved < 2%, alerts the user to exit the "dead" trade and free
 * up capital. Marks rec with raw_ai_response.stale_alerted to avoid spam.
 */
export const Route = createFileRoute("/api/public/hooks/stale-position-alert")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { data: recs } = await supabaseAdmin
            .from("recommendations")
            .select("id, symbol, confidence, price_at_reco, created_at, raw_ai_response")
            .is("outcome", null)
            .eq("rejected_by_rules", false)
            .gte("created_at", cutoff);

          if (!recs || recs.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }

          const symbols = [...new Set(recs.map((r) => String(r.symbol)))];
          const { data: snaps } = await supabaseAdmin
            .from("stock_snapshots")
            .select("symbol, close")
            .in("symbol", symbols)
            .order("snapshot_date", { ascending: false });
          const priceMap = new Map<string, number>();
          for (const s of snaps ?? []) {
            const sym = String(s.symbol);
            if (!priceMap.has(sym)) priceMap.set(sym, Number(s.close ?? 0));
          }

          const { data: stocks } = await supabaseAdmin
            .from("stocks").select("symbol, name_ar").in("symbol", symbols);
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);

          const lines: string[] = [];
          let count = 0;
          for (const r of recs) {
            const raw = (r.raw_ai_response ?? {}) as Record<string, unknown>;
            if (raw.stale_alerted) continue;

            const decay = applyConfidenceDecay(Number(r.confidence ?? 70), String(r.created_at));
            if (decay.ageDays < 5) continue;

            const px = priceMap.get(String(r.symbol));
            const entry = Number(r.price_at_reco ?? 0);
            if (!px || entry <= 0) continue;

            const movePct = ((px - entry) / entry) * 100;
            if (Math.abs(movePct) >= 2) continue; // moved meaningfully — skip

            const name = escapeHtml(nameMap.get(String(r.symbol)) || r.symbol);
            lines.push(`⚠️ <b>${name}</b> (${r.symbol}) — ${decay.ageDays} يوم بدون حركة (${movePct.toFixed(1)}%)`);
            lines.push(`   ↳ الثقة هبطت لـ ${decay.decayed}%. <b>اقتراح: اخرج وحرّر رأس المال</b>`);

            await supabaseAdmin
              .from("recommendations")
              .update({ raw_ai_response: { ...raw, stale_alerted: true, stale_at: new Date().toISOString() } })
              .eq("id", r.id);
            count++;
          }

          if (lines.length > 0) {
            await sendTelegram(["💤 <b>صفقات راكدة — انسحاب مقترح</b>", "", ...lines].join("\n"));
          }
          return Response.json({ ok: true, alerts: count, checked: recs.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("stale-position-alert failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});