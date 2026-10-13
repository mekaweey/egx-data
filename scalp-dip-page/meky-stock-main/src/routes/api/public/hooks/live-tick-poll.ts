import { createFileRoute } from "@tanstack/react-router";

/** Thunder-only mode: this endpoint no longer writes TradingView/Mubasher ticks. */

export const Route = createFileRoute("/api/public/hooks/live-tick-poll")({
  server: {
    handlers: {
      POST: async () => {
        return Response.json({ ok: true, skipped: "thunder_only_mode", fetched: 0 });
      },
    },
  },
});