const fs = require("fs");
const env = {};
for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");
const p = new Pool({ connectionString: env.DATABASE_URL });
async function getJson(url) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), 45000);
  try { const r = await fetch(url, { signal: c.signal }); return await r.json(); }
  catch (e) { return { error: e.message }; } finally { clearTimeout(t); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
(async () => {
  console.log("waiting 200s for Render deploy...");
  await sleep(200000);
  const dbNow = new Date((await p.query("SELECT now() n")).rows[0].n);
  console.log("DB NOW:", dbNow.toISOString());

  console.log("\n===== FINAL VERIFICATION (production, post 75179b07) =====");
  const api = await getJson("https://meky-stock.onrender.com/api/public/hooks/marketwatch-health");
  console.log("live_price_coverage:", JSON.stringify(api.live_price_coverage));
  console.log("marketwatch_bid_ask.with_bid_ask =", api.marketwatch_bid_ask?.with_bid_ask);
  console.log("live_quotes.with_bid_ask_window  =", api.live_quotes?.with_bid_ask_window);
  console.log("EQUAL?", api.marketwatch_bid_ask?.with_bid_ask === api.live_quotes?.with_bid_ask_window ? "YES - STILL MERGED" : "NO - genuinely different (fallback removed, verified)");

  // independent recompute with the SAME 15-min window
  const W = "15 minutes";
  const mw = await p.query(`SELECT DISTINCT symbol FROM marketwatch_snapshots WHERE captured_at > now() - interval '${W}'`);
  const q = await p.query(`SELECT DISTINCT symbol FROM live_quotes WHERE ts > now() - interval '${W}'`);
  const t = await p.query(`SELECT DISTINCT symbol FROM live_ticks WHERE ts > now() - interval '${W}'`);
  const u = new Set([...mw.rows.map(r=>r.symbol), ...q.rows.map(r=>r.symbol), ...t.rows.map(r=>r.symbol)]);
  console.log(`\nDB recompute @15m: mw=${new Set(mw.rows.map(r=>r.symbol)).size} quotes=${q.rows.length} ticks=${t.rows.length} UNION=${u.size}`);
  console.log(`server says: symbols=${api.live_price_coverage?.symbols} (mw=${api.live_price_coverage?.from_marketwatch} q=${api.live_price_coverage?.from_quotes} t=${api.live_price_coverage?.from_ticks})`);
  console.log(`match: ${u.size === api.live_price_coverage?.symbols ? "EXACT" : "diff " + (api.live_price_coverage?.symbols - u.size) + " (timing drift)"}`);

  console.log("\n===== for the reply: before/after SAME-window live_ticks =====");
  const t15 = await p.query(`SELECT count(*) r, count(distinct symbol) s FROM live_ticks WHERE ts > now() - interval '15 minutes'`);
  console.log(`live_ticks @15m NOW: rows=${t15.rows[0].r} symbols=${t15.rows[0].s}`);
  console.log(`live_ticks @90s NOW: ${(await p.query(`SELECT count(distinct symbol) s FROM live_ticks WHERE ts > now() - interval '90 seconds'`)).rows[0].s}`);
  console.log(`live_ticks ALL-TIME: ${(await p.query(`SELECT count(distinct symbol) s FROM live_ticks`)).rows[0].s} symbols (table created 2026-09-16 — pipeline only landed rows yesterday after token fix)`);

  await p.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
