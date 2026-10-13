import { createFileRoute } from "@tanstack/react-router";
import { createPendingScan, runScanForId } from "@/lib/scan/run-scan.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { notifyScanSummary } from "@/lib/notifications/scan-summary.server";

const SCAN_HARD_TIMEOUT_MS = 280 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeout!: ReturnType<typeof setTimeout>;
  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}

/**
 * Daily EGX scan endpoint — triggered by pg_cron at 14:30 Cairo time, Mon–Thu.
 * Public route (auth bypassed). Throttled to prevent abuse: no more than one
 * scan per 3 minutes.
 */
export const Route = createFileRoute("/api/public/hooks/daily-scan")({
  server: {
    handlers: {
      POST: async () => {
        // Throttle by checking the most recent scan
        const { data: latest } = await supabaseAdmin
          .from("scans")
          .select("id, started_at, status")
          .order("started_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (latest?.status === "running") {
          const age = Date.now() - new Date(latest.started_at).getTime();
          // Auto-fail scans that have been "running" for >6 min — Cloudflare
          // Workers time out well before that, so anything longer is a ghost row.
          if (age > 6 * 60 * 1000) {
            await supabaseAdmin
              .from("scans")
              .update({
                status: "failed",
                finished_at: new Date().toISOString(),
                error_message: "auto-failed: stuck >6min (worker timeout)",
              })
              .eq("id", latest.id);
          } else {
            return Response.json(
              { ok: false, message: "scan already running", scanId: latest.id, ageMs: age },
              { status: 200 },
            );
          }
        }
        if (latest) {
          const lastTime = latest.status === "completed" ? latest.started_at : null;
          const age = lastTime ? Date.now() - new Date(lastTime).getTime() : Number.POSITIVE_INFINITY;
          if (latest.status === "completed" && age < 3 * 60 * 1000) {
            return Response.json(
              { ok: false, message: "throttled", lastScanId: latest.id, ageMs: age },
              { status: 200 },
            );
          }
        }

        try {
          const scanId = await createPendingScan();
          // Run synchronously: Cloudflare Workers can terminate background
          // promises after the response is sent, leaving the scan stuck at
          // stocks_count=0 which the dashboard watchdog then auto-fails.
          try {
            const result = await withTimeout(
              runScanForId(scanId),
              SCAN_HARD_TIMEOUT_MS,
              "انتهت مهلة المسح قبل الاكتمال — تم إيقافه بأمان بدون تعليق",
            );
            if (result?.scanId) {
              await notifyScanSummary(result.scanId).catch((e) =>
                console.error("[daily-scan] notifyScanSummary failed", e),
              );
            }
            return Response.json(
              { ok: true, completed: true, scanId, stocks: result?.stocks ?? 0 },
              { status: 200 },
            );
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            console.error("daily-scan run failed:", msg);
            await supabaseAdmin
              .from("scans")
              .update({ status: "failed", finished_at: new Date().toISOString(), error_message: msg })
              .eq("id", scanId);
            return Response.json({ ok: false, scanId, error: msg }, { status: 200 });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error("daily-scan failed:", msg);
          return Response.json({ ok: false, error: msg }, { status: 200 });
        }
      },
    },
  },
});