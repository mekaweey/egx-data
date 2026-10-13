/**
 * AI supervisor feed endpoints — read the live feed + state, receive user messages.
 * GET  /api/public/hooks/ai-supervisor-feed → { entries, alive, level, time }
 * POST /api/public/hooks/ai-supervisor-feed { text } → appends user message to feed
 */
import { createFileRoute } from "@tanstack/react-router";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const FEED = path.join(ROOT, "supervisor_feed.jsonl");
const STATE = path.join(ROOT, "supervisor_state.json");

function readFeed() {
  try {
    const raw = fs.readFileSync(FEED, "utf8").trim().split("\n").filter(Boolean);
    return raw.slice(-50).reverse().map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch {
    return [];
  }
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(STATE, "utf8"));
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/api/public/hooks/ai-supervisor-feed")({
  server: {
    handlers: {
      GET: async () => {
        const entries = readFeed();
        const state = readState();
        let alive: "yes" | "stale" | "unknown" = "unknown";
        let level: string | null = state?.level ?? null;
        if (state?.time) {
          const ageMin = (Date.now() - new Date(state.time).getTime()) / 60000;
          alive = ageMin < 35 ? "yes" : "stale";
        }
        return Response.json({ entries, alive, level, time: state?.time ?? null });
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as { text?: string };
          const text = (body?.text || "").trim().slice(0, 500);
          if (!text) return Response.json({ ok: false, error: "empty" }, { status: 400 });
          const entry = { time: new Date().toISOString(), kind: "user", text };
          fs.appendFileSync(FEED, JSON.stringify(entry) + "\n");
          return Response.json({ ok: true });
        } catch (e) {
          return Response.json({ ok: false, error: (e as Error).message }, { status: 500 });
        }
      },
    },
  },
});
