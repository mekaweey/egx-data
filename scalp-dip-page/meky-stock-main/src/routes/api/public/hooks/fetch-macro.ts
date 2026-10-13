import { createFileRoute } from "@tanstack/react-router";
import { fetchMacroSnapshot, saveMacro } from "@/lib/market-data/macro.server";

/** Daily macro indicators refresh — 7:30 AM Cairo time. */
export const Route = createFileRoute("/api/public/hooks/fetch-macro")({
  server: {
    handlers: {
      POST: async () => {
        const snap = await fetchMacroSnapshot();
        if (!snap) return Response.json({ ok: false, error: "macro fetch failed" });
        await saveMacro(snap);
        return Response.json({ ok: true, snap });
      },
    },
  },
});