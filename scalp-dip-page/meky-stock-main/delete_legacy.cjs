#!/usr/bin/env node
/**
 * delete_legacy.cjs — deletes the exported+verified legacy rows from Supabase
 * (data preserved locally in legacy-archive\*.jsonl with _VERIFIED markers).
 * Refuses to run for any table whose local _VERIFIED marker is missing.
 * Usage: node delete_legacy.cjs
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
const TABLES = ["thunder_tick_archive", "thunder_tape", "thunder_watchlist_snapshots", "mubasher_news"];

(async () => {
  for (const t of TABLES) {
    if (!fs.existsSync(path.join(outDir, `${t}_VERIFIED.txt`))) {
      console.error(`${t}: NO VERIFIED LOCAL EXPORT — skipping (safety)`);
      continue;
    }
    // find the primary/numeric id column from a sample row
    const { data: sample } = await sb.from(t).select("*").limit(1);
    const keys = sample?.[0] ? Object.keys(sample[0]) : [];
    const idCol = keys.includes("id") ? "id" : keys.find((k) => k.endsWith("_id")) || keys[0];
    console.log(`${t}: deleting via column '${idCol}'...`);
    let deleted = 0;
    for (let round = 0; round < 200; round++) {
      const { data: batch, error: e1 } = await sb.from(t).select(idCol).range(0, 4999);
      if (e1) { console.error(`  select error: ${e1.message}`); break; }
      if (!batch?.length) break;
      const vals = batch.map((r) => r[idCol]);
      const { error: e2 } = await sb.from(t).delete().in(idCol, vals);
      if (e2) { console.error(`  delete error: ${e2.message}`); break; }
      deleted += vals.length;
    }
    const { count } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: deleted ~${deleted} | remaining now: ${count}`);
  }
  console.log("DELETE PASS COMPLETE");
})();
