import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createPendingScan, runScanForId } from "./run-scan.server";

// Throttle: only allow a new manual scan if the last one is older than 3 minutes
const MIN_INTERVAL_MS = 3 * 60 * 1000;
const STUCK_START_MS = 90 * 1000;
const STUCK_TOTAL_MS = 6 * 60 * 1000;
const MANUAL_SCAN_TIMEOUT_MS = 280 * 1000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeout!: ReturnType<typeof setTimeout>;
  const timer = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(label)), ms);
  });
  return Promise.race([promise, timer]).finally(() => clearTimeout(timeout));
}

function staleScanMessage(scan: { started_at: string; stocks_count?: number | null }) {
  const age = Date.now() - new Date(scan.started_at).getTime();
  if ((scan.stocks_count ?? 0) === 0 && age > STUCK_START_MS) {
    return "تم إيقاف مسح عالق تلقائياً: لم يبدأ جلب الأسهم خلال 90 ثانية";
  }
  if (age > STUCK_TOTAL_MS) {
    return "تم إيقاف مسح عالق تلقائياً بعد 6 دقائق";
  }
  return null;
}

export const triggerScan = createServerFn({ method: "POST" }).handler(async () => {
  const { data: latest } = await supabaseAdmin
    .from("scans")
    .select("id, started_at, status, stocks_count")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latest && latest.status === "running") {
    const staleMessage = staleScanMessage(latest);
    if (staleMessage) {
      await supabaseAdmin
        .from("scans")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: staleMessage,
        })
        .eq("id", latest.id);
    } else {
      return { ok: false, message: "يوجد مسح قيد التنفيذ بالفعل", scanId: latest.id };
    }
  }

  if (latest?.status === "completed") {
    const age = Date.now() - new Date(latest.started_at).getTime();
    if (age < MIN_INTERVAL_MS) {
      const mins = Math.ceil((MIN_INTERVAL_MS - age) / 60000);
      return {
        ok: false,
        message: `يمكن إعادة المسح بعد ${mins} دقيقة`,
        scanId: latest.id,
      };
    }
  }

  // Run the scan in the request instead of fire-and-forget. The previous
  // background path could be killed before the first DB progress update,
  // leaving scans stuck at stocks_count=0.
  const scanId = await createPendingScan();
  try {
    const result = await withTimeout(
      runScanForId(scanId),
      MANUAL_SCAN_TIMEOUT_MS,
      "انتهت مهلة المسح قبل الاكتمال — تم إيقافه بأمان بدون تعليق",
    );
    return {
      ok: true,
      started: true,
      completed: true,
      scanId,
      message: `اكتمل المسح: تم تجهيز وتحليل ${result.stocks} سهم`,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("manual scan failed:", message);
    try {
      await supabaseAdmin
        .from("scans")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error_message: message,
        })
        .eq("id", scanId);
    } catch {
      // ignore secondary failure
    }
    return { ok: false, started: false, scanId, message };
  }
});

export const cancelScan = createServerFn({ method: "POST" }).handler(async () => {
  const { data: latest } = await supabaseAdmin
    .from("scans")
    .select("id, status")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latest || latest.status !== "running") {
    return { ok: false, message: "لا يوجد مسح قيد التنفيذ" };
  }

  await supabaseAdmin
    .from("scans")
    .update({
      status: "failed",
      finished_at: new Date().toISOString(),
      error_message: "تم الإلغاء بواسطة المستخدم",
    })
    .eq("id", latest.id);

  return { ok: true, message: "تم إلغاء المسح", scanId: latest.id };
});
