// scalp-dip dashboard data + actions (2026-09-27).
// Replaces the page's createServerFn layer (which broke in the vite dev
// server-fn registry after repeated edits) with a PLAIN API route - the same
// proven pattern as momentum-weekly-run and data-freshness.
// GET  -> the full dashboard payload (plan, weekly batch, live tracking,
//         open positions, history, audit log)
// POST -> { action: "bought" | "sold" | "capital", ... }
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";
const supabaseAdmin = _supabaseAdmin as any;
import { scanDailyCandidates, tradingDaysElapsed, liveSymbolState } from "@/lib/scalp-dip/momentum-weekly.server";
import { getHalalSet } from "@/lib/scalp-dip/halal-list.server";
import { markWeeklyBought, markWeeklySold } from "@/lib/scalp-dip/scalp-dip-signals.server";
import { buildDashboard } from "@/lib/scalp-dip/dashboard-builder";
import { setUserCapital, getUserCapital, computeSizing } from "@/lib/scalp-dip/gap-fade-3d.server";
import type { SignalRow } from "@/lib/scalp-dip/scalp-dip-signals.server";

export const Route = createFileRoute("/api/public/hooks/scalp-dip-dashboard")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await buildDashboard();
          return Response.json({ ok: true, ...data });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "dashboard failed" }, { status: 500 });
        }
      },
      POST: async ({ request }: { request: Request }) => {
        const body: any = await request.json().catch(() => ({}));
        try {
          if (body.action === "bought") {
            const signal = await markWeeklyBought(Number(body.signal_id), body.price != null ? Number(body.price) : undefined);
            return Response.json({ ok: true, signal });
          }
          if (body.action === "sold") {
            const signal = await markWeeklySold(Number(body.signal_id), body.price != null ? Number(body.price) : undefined);
            return Response.json({ ok: true, signal });
          }
          if (body.action === "capital") {
            const cap = Number(body.capital);
            if (!Number.isFinite(cap) || cap <= 0) return Response.json({ ok: false, error: "أدخل مبلغًا صحيحًا أكبر من صفر" });
            await setUserCapital(cap);
            const sizing = computeSizing(await getUserCapital());
            return Response.json({ ok: true, sizing });
          }
          return Response.json({ ok: false, error: "unknown action" }, { status: 400 });
        } catch (e: any) {
          return Response.json({ ok: false, error: e?.message ?? "action failed" });
        }
      },
    },
  },
});
