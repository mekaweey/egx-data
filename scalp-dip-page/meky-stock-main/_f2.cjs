const fs = require("fs");
const env = {};
for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function health() {
  try {
    const r = await fetch("https://meky-stock.onrender.com/api/public/hooks/marketwatch-health");
    const j = await r.json();
    return {
      mw_age: j.age_seconds, mw_rows60: j.last_60s?.rows, mw_syms60: j.last_60s?.distinct_symbols,
      tick_age: j.live_ticks?.age_seconds, tick_rows60: j.live_ticks?.rows_60s, tick_syms60: j.live_ticks?.distinct_symbols_60s,
      coverage: j.universe?.coverage_pct, covered: j.universe?.covered, total: j.universe?.total_sharia,
      stale: j.stale,
    };
  } catch (e) { return { err: e.message }; }
}

(async () => {
  const p = new Pool({ connectionString: env.DATABASE_URL });
  console.log("waiting 170s for Render deploy...");
  await sleep(170000);
  console.log("FINAL:", JSON.stringify(await health()));
  const t = await p.query("SELECT count(*) c, count(DISTINCT symbol) s FROM live_ticks WHERE ts > now() - interval '10 minutes'");
  console.log("ticks last 10m:", JSON.stringify(t.rows[0]));
  const w = await p.query("SELECT count(*) c FROM marketwatch_snapshots WHERE captured_at > now() - interval '60 seconds'");
  console.log("marketwatch last 60s rows:", w.rows[0].c);
  await p.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
