import { createFileRoute } from "@tanstack/react-router";
import { exec } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin as _supabaseAdmin } from "@/integrations/supabase/client.server";

const supabaseAdmin = _supabaseAdmin as any;

/**
 * Local archive utilities (the site runs on the user's machine, so local
 * filesystem access is safe and bound to ONE fixed folder).
 * GET /api/public/hooks/archive-folder?action=catchup  → write missing day
 *   CSVs from daily_candles into egx-archive (PC-off recovery)
 * GET /api/public/hooks/archive-folder?action=open     → catchup, then open
 *   the archive folder in Windows Explorer
 */

const ARCHIVE_DIR = path.join(process.cwd(), "egx-archive");

function listArchivedDates(): string[] {
  const out: string[] = [];
  if (!fs.existsSync(ARCHIVE_DIR)) return out;
  const walk = (dir: string) => {
    for (const f of fs.readdirSync(dir)) {
      const p = path.join(dir, f);
      if (fs.statSync(p).isDirectory()) walk(p);
      else {
        const m = f.match(/^EGX_DAILY_(\d{4}-\d{2}-\d{2})\.csv$/);
        if (m) out.push(m[1]);
      }
    }
  };
  walk(ARCHIVE_DIR);
  return out.sort();
}

async function catchupArchive(): Promise<{ written: number; dates: string[]; lastLocal: string | null }> {
  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });
  const local = listArchivedDates();
  const lastLocal = local.length ? local[local.length - 1] : null;
  // distinct missing dates from daily_candles (strategy's own cloud copy)
  const { data: dateRows } = await supabaseAdmin
    .from("daily_candles")
    .select("date")
    .order("date", { ascending: false })
    .limit(400);
  const allDates = ([...new Set((dateRows ?? []).map((r: any) => String(r.date)))] as string[]).sort();
  const missing = allDates.filter((d) => (!lastLocal || d > lastLocal) && d <= new Date().toISOString().slice(0, 10));
  const writtenDates: string[] = [];
  for (const d of missing) {
    const { data: rows } = await supabaseAdmin
      .from("daily_candles")
      .select("symbol, date, open, high, low, close, volume")
      .eq("date", d);
    if (!rows?.length) continue;
    const yyyy = d.slice(0, 4), mm = d.slice(5, 7);
    const dir = path.join(ARCHIVE_DIR, yyyy, mm);
    fs.mkdirSync(dir, { recursive: true });
    const csv = "symbol,date,open,high,low,close,volume\n" +
      rows.map((r: any) => `${r.symbol},${r.date},${r.open},${r.high},${r.low},${r.close},${r.volume}`).join("\n") + "\n";
    fs.writeFileSync(path.join(dir, `EGX_DAILY_${d}.csv`), csv, "utf8");
    writtenDates.push(d);
  }
  return { written: writtenDates.length, dates: writtenDates, lastLocal: lastLocal ?? "none" };
}

function openFolder(): Promise<void> {
  return new Promise((resolve) => {
    exec(`explorer.exe "${ARCHIVE_DIR}"`, () => resolve());
    setTimeout(resolve, 800);
  });
}

async function handleGet(url: URL): Promise<Response> {
  const action = url.searchParams.get("action") ?? "open";
  try {
    if (action === "catchup") {
      const r = await catchupArchive();
      return Response.json({ ok: true, ...r });
    }
    // default: catch up first, then open the folder
    const r = await catchupArchive();
    await openFolder();
    return Response.json({ ok: true, folder: ARCHIVE_DIR, catchup: r });
  } catch (e: any) {
    return Response.json({ ok: false, error: e?.message ?? "archive action failed" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/hooks/archive-folder")({
  server: {
    handlers: {
      GET: ({ request }: { request: Request }) => handleGet(new URL(request.url)),
      POST: ({ request }: { request: Request }) => handleGet(new URL(request.url)),
    },
  },
});
