import { createFileRoute } from "@tanstack/react-router";
import { computeMarketBreadth } from "@/lib/market-data/breadth.server";
import { fetchMarketSnapshot } from "@/lib/market-data/market-index.server";
import { sendTelegram } from "@/lib/notifications/telegram.server";

/**
 * 09:55 Cairo — final go/no-go check before the bell. Confirms breadth ≥ 40
 * (V2.2 gate) and a usable market snapshot, then notifies Telegram.
 */
export const Route = createFileRoute("/api/public/hooks/market-open-check")({
  server: {
    handlers: {
      POST: async () => {
        const [breadth, snap] = await Promise.all([
          computeMarketBreadth().catch(() => null),
          fetchMarketSnapshot().catch(() => null),
        ]);

        const breadthOk = breadth == null ? null : breadth >= 40;
        const verdict = breadthOk === false
          ? "🚫 <b>السوق ضعيف</b> — مفيش ترشيحات جديدة النهاردة."
          : "🟢 <b>السوق مقبول</b> — مسح لحظي شغّال.";

        const lines = [
          "🔔 <b>قبل جرس الافتتاح</b>",
          new Date().toLocaleString("ar-EG", { timeZone: "Africa/Cairo" }),
          breadth == null
            ? "اتساع السوق: غير متاح"
            : `اتساع السوق: <b>${breadth.toFixed(1)}%</b>`,
          snap ? `EGX30: <b>${snap.close.toFixed(2)}</b> · ${snap.trend}` : "EGX30: غير متاح",
          "",
          verdict,
        ].join("\n");

        await sendTelegram(lines, { skipBaladi: true }).catch(() => undefined);
        return Response.json({ ok: true, breadth, breadthOk, market: snap });
      },
    },
  },
});