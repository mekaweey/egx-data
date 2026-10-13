// Load newly scraped news (from _mb_archive_cache.jsonl tail) into mubasher_news,
// then re-run symbol mapping for SPMD & co, then verify.
const fs = require("fs");
const env = {};
for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  const lines = fs.readFileSync("_mb_archive_cache.jsonl", "utf8").split("\n").filter(Boolean);
  let inserted = 0, skipped = 0;
  for (const line of lines) {
    try {
      const rec = JSON.parse(line);
      // only the NEW run (this morning) has recent ids; insert anything not already in DB
      const pub = rec.published_at; // may be null for "3 ساعات مضت" style
      const { rows } = await p.query(
        "SELECT 1 FROM mubasher_news WHERE id = $1",
        [String(rec.id)]
      );
      if (rows.length) { skipped++; continue; }
      await p.query(
        `INSERT INTO mubasher_news (id, headline, url, published_at, pulled_at, category_id, category_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [String(rec.id), rec.title, rec.url, pub, rec.pulled_at, rec.category_id, rec.category_name]
      );
      inserted++;
    } catch (e) {
      console.log("row err:", e.message);
    }
  }
  console.log(`inserted: ${inserted} | already-existed: ${skipped}`);

  // verify SPMD Sep-14 news now present
  const spmd = await p.query(`
    SELECT id, headline, published_at FROM mubasher_news
    WHERE (headline LIKE '%سبيد ميديكال%' OR headline LIKE '%ميديكال%')
      AND published_at >= '2026-09-13'
    ORDER BY published_at DESC`);
  console.log("=== SPMD Sep13+ news now in DB ===");
  spmd.rows.forEach((r) => console.log(`  ${r.published_at} | ${(r.headline || "").slice(0, 90)}`));

  const cnt = await p.query("SELECT count(*) c, max(published_at) mx FROM mubasher_news");
  console.log(`archive now: ${cnt.rows[0].c} articles | latest: ${cnt.rows[0].mx}`);
  await p.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
