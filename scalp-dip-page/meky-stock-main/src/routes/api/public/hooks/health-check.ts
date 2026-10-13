import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";
import { escapeHtml } from "@/lib/utils/html-escape";

// يفحص آخر تشغيلات pg_cron — لو أي مهمة فشلت مرتين متتاليتين، يبعت تنبيه تليجرام.
export const Route = createFileRoute("/api/public/hooks/health-check")({
  server: {
    handlers: {
      POST: async () => {
        const { data, error } = await supabaseAdmin.rpc("get_cron_runs", {
          p_limit: 200,
        });
        if (error) {
          return new Response(JSON.stringify({ ok: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
        type Run = {
          jobid: number;
          jobname: string | null;
          status: string;
          return_message: string | null;
          start_time: string;
        };
        const runs = (data ?? []) as Run[];
        // اجمع آخر تشغيلين لكل مهمة
        const byJob = new Map<number, Run[]>();
        for (const r of runs) {
          const arr = byJob.get(r.jobid) ?? [];
          if (arr.length < 2) {
            arr.push(r);
            byJob.set(r.jobid, arr);
          }
        }

        const alerts: string[] = [];
        for (const [, arr] of byJob) {
          if (arr.length < 2) continue;
          const [last, prev] = arr;
          if (last.status !== "succeeded" && prev.status !== "succeeded") {
            const name = escapeHtml(last.jobname ?? `#${last.jobid}`);
            const msg = escapeHtml((last.return_message ?? "").slice(0, 120));
            alerts.push(`• ${name} — ${last.status}${msg ? ` (${msg})` : ""}`);
          }
        }

        let telegramSent = false;
        if (alerts.length > 0) {
          const text =
            `⚠️ <b>تنبيه أتمتة</b>\n` +
            `${alerts.length} مهمة فشلت مرتين متتاليتين:\n\n` +
            alerts.join("\n");
          try {
            await sendTelegram(text);
            telegramSent = true;
          } catch (e) {
            console.error("telegram send failed", e);
          }
        }

        return new Response(
          JSON.stringify({
            ok: true,
            checked: byJob.size,
            failing_jobs: alerts.length,
            telegram_sent: telegramSent,
          }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});