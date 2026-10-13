import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ping")({
  server: {
    handlers: {
      GET: async () =>
        new Response("OK", {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Access-Control-Allow-Origin": "*",
          },
        }),
      HEAD: async () =>
        new Response(null, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          },
        }),
    },
  },
});
