import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

/**
 * Volume Spike Detector — runs every hour during market hours.
 * Scans latest snapshots for unusual activity: vol_ratio ≥ 3x avg AND
 * change_pct ≥ +1.5% (smart money likely entering). Sends one Telegram
 * alert per session per symbol (de-dup via stocks.symbol + date in a
 * lightweight memo on pick_notifications-style filtering using ts).
 */
export const Route = createFileRoute("/api/public/hooks/volume-spike")({
  server: {
    handlers: {
      POST: async () => {
        try {
          const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

          const { data: snaps } = await supabaseAdmin
            .from("stock_snapshots")
            .select("symbol, close, change_pct, vol_ratio, volume, ts")
            .gte("ts", todayStart.toISOString())
            .order("ts", { ascending: false })
            .limit(2000);

          if (!snaps || snaps.length === 0) {
            return Response.json({ ok: true, alerts: 0, reason: "no snapshots today" });
          }

          // Keep latest snapshot per symbol
          const latest = new Map<string, typeof snaps[0]>();
          for (const s of snaps) {
            const sym = String(s.symbol);
            if (!latest.has(sym)) latest.set(sym, s);
          }

          // Filter spikes
          const spikes = [...latest.values()].filter((s) => {
            const vr = Number(s.vol_ratio ?? 0);
            const ch = Number(s.change_pct ?? 0);
            return vr >= 3.0 && ch >= 1.5;
          });

          if (spikes.length === 0) {
            return Response.json({ ok: true, alerts: 0 });
          }

          // De-dup: check pick_notifications for today
          const symbols = spikes.map((s) => String(s.symbol));
          const todayDate = todayStart.toISOString().slice(0, 10);
          const { data: alerted } = await supabaseAdmin
            .from("pick_notifications")
            .select("symbol, kind, pick_date")
            .eq("kind", "volume_spike")
            .eq("pick_date", todayDate)
            .in("symbol", symbols);
          const alreadyAlerted = new Set((alerted ?? []).map((a) => String(a.symbol)));

          const fresh = spikes.filter((s) => !alreadyAlerted.has(String(s.symbol)));
          if (fresh.length === 0) return Response.json({ ok: true, alerts: 0, reason: "all already alerted" });

          // Get names
          const { data: stocks } = await supabaseAdmin
            .from("stocks").select("symbol, name_ar").in("symbol", fresh.map((s) => String(s.symbol)));
          const nameMap = new Map(stocks?.map((s) => [String(s.symbol), String(s.name_ar)]) ?? []);

          const lines: string[] = ["🚨 <b>دخول مؤسسات محتمل — انفجار حجم تداول</b>", ""];
          for (const s of fresh.slice(0, 8)) {
            const sym = String(s.symbol);
            const name = escapeHtml(nameMap.get(sym) || sym);
            lines.push(`⚡ <b>${name}</b> (${sym})`);
            lines.push(`   حجم: ${Number(s.vol_ratio).toFixed(1)}× المتوسط | سعر: +${Number(s.change_pct).toFixed(1)}%`);
          }
          lines.push("");
          lines.push("💡 غالباً مؤسسة كبيرة بتدخل — راقب عن قرب");

          await sendTelegram(lines.join("\n"));

          // Mark as alerted
          const rows = fresh.map((s) => ({
            symbol: String(s.symbol),
            kind: "volume_spike",
            pick_date: todayDate,
            payload: { vol_ratio: Number(s.vol_ratio), change_pct: Number(s.change_pct) },
          }));
          await supabaseAdmin.from("pick_notifications").insert(rows);

          return Response.json({ ok: true, alerts: fresh.length });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("volume-spike failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});