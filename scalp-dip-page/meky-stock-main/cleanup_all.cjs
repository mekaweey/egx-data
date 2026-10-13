#!/usr/bin/env node
/**
 * cleanup_all.cjs — full storage reclamation:
 * 1) discover ALL tables with rows (via PostgREST OpenAPI)
 * 2) keep-list: tables the live system uses (untouched)
 * 3) everything else: export to legacy-archive\<table>.jsonl (verified count),
 *    then delete all rows. Safe: verified export precedes every delete.
 * Usage: node cleanup_all.cjs
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

const KEEP = new Set([
  "daily_candles", "stocks", "symbol_profile", "strategy_settings",
  "scalp_dip_signals", "paper_trades", "decision_audit_log",
  "marketwatch_snapshots", "live_ticks", "news_symbol_map", "concentration_blocks",
  "ingest_tokens", "momentum_weekly_signals",
]);

(async () => {
  const res = await fetch(env.SUPABASE_URL + "/rest/v1/", { headers: { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: "Bearer " + env.SUPABASE_SERVICE_ROLE_KEY, "X-Client-Info": "supabase-js/2.0" } });
  const spec = await res.json();
  const tables = Object.keys(spec.definitions || {}).filter((t) => !KEEP.has(t));
  console.log(`tables to inspect: ${tables.length} (excluded keep-list: ${KEEP.size})`);
  let freed = 0;
  for (const t of tables) {
    const { count, error } = await sb.from(t).select("*", { count: "exact", head: true });
    if (error) { console.log(`${t}: skip (ERR ${error.message.slice(0, 30)})`); continue; }
    if (!count) { console.log(`${t}: empty`); continue; }
    // export
    const outFile = path.join(outDir, `${t}.jsonl`);
    const ws = fs.createWriteStream(outFile, { flags: "w" });
    let exported = 0;
    for (let from = 0; from < count; from += 1000) {
      const { data, error: e2 } = await sb.from(t).select("*").range(from, from + 999);
      if (e2) { console.error(`${t}: export page error — SKIPPING DELETE for safety`); process.exit(1); }
      for (const r of data) ws.write(JSON.stringify(r) + "\n");
      exported += data.length;
      if (data.length < 1000) break;
    }
    await new Promise((r) => ws.end(r));
    if (exported !== count) { console.error(`${t}: MISMATCH ${exported}/${count} — skipping delete`); continue; }
    // delete (paginate by first column)
    const { data: sample } = await sb.from(t).select("*").limit(1);
    const idCol = Object.keys(sample[0]).includes("id") ? "id" : Object.keys(sample[0])[0];
    let rounds = 0;
    for (let round = 0; round < 500; round++) {
      const { data: batch } = await sb.from(t).select(idCol).range(0, 999);
      if (!batch?.length) break;
      const vals = batch.map((r) => r[idCol]);
      const { error: e3 } = await sb.from(t).delete().in(idCol, vals);
      if (e3) { console.error(`${t}: delete error ${e3.message} — stopping`); break; }
      rounds++;
    }
    const { count: after } = await sb.from(t).select("*", { count: "exact", head: true });
    console.log(`${t}: exported+deleted ${exported} rows (${rounds} rounds) | remaining: ${after} | file ${(fs.statSync(outFile).size / 1e6).toFixed(1)}MB`);
    if (after === 0) fs.writeFileSync(path.join(outDir, `${t}_VERIFIED.txt`), `deleted ${exported} rows, ${new Date().toISOString()}`);
    freed += exported;
  }
  console.log(`\nCLEANUP COMPLETE — rows freed: ${freed}`);
})();
