#!/usr/bin/env node
/**
 * export_legacy.cjs — exports the heavy legacy tables (old daily-strategy
 * system) to local JSONL files under legacy-archive\ so their Supabase rows
 * can then be safely deleted (freeing the 334MB usage).
 * Tables: thunder_tick_archive, thunder_tape, thunder_watchlist_snapshots,
 * mubasher_news. VERIFICATION: exported count must equal table count —
 * a _VERIFIED marker file is written per table only when counts match.
 * Usage: node export_legacy.cjs
 */
const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const root = __dirname;
const env = {};
for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
  if (m) env[m[1]] = m[2];
}
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const outDir = path.join(root, "legacy-archive");
fs.mkdirSync(outDir, { recursive: true });

const TABLES = ["thunder_tick_archive", "thunder_tape", "thunder_watchlist_snapshots", "mubasher_news"];

(async () => {
  for (const t of TABLES) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (error) { console.error(`${t}: count error ${error.message}`); continue; }
    const total = count ?? 0;
    if (total === 0) { console.log(`${t}: 0 rows — skip`); continue; }
    const outFile = path.join(outDir, `${t}.jsonl`);
    const ws = fs.createWriteStream(outFile, { flags: "w" });
    let exported = 0;
    for (let from = 0; from < total; from += 1000) {
      const { data, error: e2 } = await sb.from(t).select("*").range(from, from + 999);
      if (e2) { console.error(`${t}: page error at ${from}: ${e2.message}`); process.exit(1); }
      for (const r of data) ws.write(JSON.stringify(r) + "\n");
      exported += data.length;
    }
    await new Promise((r) => ws.end(r));
    if (exported === total) {
      fs.writeFileSync(path.join(outDir, `${t}_VERIFIED.txt`), `exported=${exported}/${total} at ${new Date().toISOString()}`);
      console.log(`${t}: VERIFIED ${exported}/${total} -> ${outFile} (${(fs.statSync(outFile).size / 1e6).toFixed(1)} MB)`);
    } else {
      console.error(`${t}: MISMATCH exported=${exported} expected=${total} — DO NOT DELETE`);
    }
  }
  console.log("EXPORT COMPLETE — verify _VERIFIED files before deleting any Supabase rows");
})();
