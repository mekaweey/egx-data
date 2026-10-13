import { createFileRoute } from "@tanstack/react-router";

/**
 * Test hook for l2-coverage-alert.
 * GET /api/public/hooks/l2-coverage-test?symbol=SYM&dry=1
 * Returns JSON only (no Telegram) when dry=1.
 */

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, apikey",
} as const;

async function handler({ request }: { request: Request }) {
  const url = new URL(request.url);
  const symbol = url.searchParams.get("symbol") ?? "";
  const dry = url.searchParams.get("dry") === "1";
  if (!symbol) {
    return Response.json({ ok: false, error: "missing_symbol" }, { status: 400, headers: CORS });
  }
  const { checkL2CoverageAndAlert } = await import("@/lib/scan/l2-coverage-alert.server");
  const result = await checkL2CoverageAndAlert(symbol, { dry });
  return Response.json({ ok: true, dry, result }, { headers: CORS });
}

export const Route = createFileRoute("/api/public/hooks/l2-coverage-test")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      GET: handler,
      POST: handler,
    },
  },
});
