// PIPELINE: wait for scraper to finish (writes "=== done ==="), then:
// 1) bulk-insert new articles  2) map symbols  3) dump news_with_titles_v2.json
// 4) notify via a marker file. The Python master test runs after marker exists.
const fs = require("fs");
const env = {};
for (const l of fs.readFileSync(".env", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
}
const { Pool } = require("pg");
const p = new Pool({ connectionString: env.DATABASE_URL });
const OUT_FILE = "C:/Users/Mekawey/.openclaw-autoclaw/workspace/.openclaw/tmp/pull_output.txt";
const MARKER = "C:/Users/Mekawey/.openclaw-autoclaw/workspace/.openclaw/tmp/NEWS_PIPELINE_DONE.txt";

function scraperDone() {
  try {
    return fs.readFileSync(OUT_FILE, "utf8").includes("=== done ===");
  } catch { return false; }
}

(async () => {
  // 1. wait for scraper
  let waited = 0;
  while (!scraperDone() && waited < 30 * 60 * 1000) {
    await new Promise((r) => setTimeout(r, 30000));
    waited += 30000;
    console.log(`waiting for scraper... ${Math.round(waited / 60000)}min`);
  }
  if (!scraperDone()) { console.error("TIMEOUT waiting for scraper"); process.exit(1); }
  console.log("scraper done ✓");

  // 2. bulk insert new articles
  const lines = fs.readFileSync("_mb_archive_cache.jsonl", "utf8").split("\n").filter(Boolean);
  const recs = lines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const allIds = recs.map((r) => String(r.id));
  const existing = new Set(
    (await p.query("SELECT id::text id FROM mubasher_news WHERE id::text = ANY($1)", [allIds])).rows.map((r) => r.id)
  );
  const fresh = recs.filter((r) => !existing.has(String(r.id)));
  console.log(`cache ${recs.length} | new to insert: ${fresh.length}`);
  for (let i = 0; i < fresh.length; i += 100) {
    const batch = fresh.slice(i, i + 100);
    const values = [];
    const params = [];
    batch.forEach((r, j) => {
      const b = j * 7;
      values.push(`($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7})`);
      const pub = r.published_at || r.pulled_at;
      params.push(String(r.id), r.title, r.url, pub, r.pulled_at, r.category_id, r.category_name);
    });
    await p.query(
      `INSERT INTO mubasher_news (id, headline, url, published_at, pulled_at, category_id, category_name)
       VALUES ${values.join(",")} ON CONFLICT (id) DO NOTHING`,
      params
    );
  }
  const cnt = await p.query("SELECT count(*) c, max(published_at) mx FROM mubasher_news");
  console.log(`archive now: ${cnt.rows[0].c} articles | latest: ${cnt.rows[0].mx}`);

  // 3. symbol mapping (existing + name-based for new)
  const mapped = await p.query("SELECT article_id, symbol FROM news_symbol_map");
  const map = new Map(mapped.rows.map((r) => [String(r.article_id), r.symbol]));
  const stocks = await p.query("SELECT symbol, name_ar FROM stocks").catch(() => ({ rows: [] }));
  const nameIndex = stocks.rows.filter((s) => s.name_ar).map((s) => ({ sym: s.symbol, name: s.name_ar.replace(/["«»]/g, "").trim() }));
  const all = await p.query("SELECT id::text id, headline FROM mubasher_news");
  const newPairs = [];
  for (const a of all.rows) {
    if (map.has(a.id)) continue;
    const title = (a.headline || "").replace(/["«»]/g, "");
    for (const ni of nameIndex) {
      if (ni.name.length >= 6 && title.includes(ni.name)) {
        map.set(a.id, ni.sym);
        newPairs.push({ article_id: a.id, symbol: ni.sym });
        break;
      }
    }
  }
  console.log(`newly mapped by name: ${newPairs.length}`);
  for (let i = 0; i < newPairs.length; i += 200) {
    const batch = newPairs.slice(i, i + 200);
    const vals = batch.map((_, j) => `($${j * 2 + 1},$${j * 2 + 2})`).join(",");
    const params = batch.flatMap((r) => [r.article_id, r.symbol]);
    await p.query(
      `INSERT INTO news_symbol_map (article_id, symbol) VALUES ${vals} ON CONFLICT (article_id) DO NOTHING`,
      params
    );
  }

  // 4. dump enriched news
  const out = [];
  for (const a of all.rows) {
    const sym = map.get(a.id);
    if (!sym) continue;
    out.push({ symbol: sym, article_id: a.id, title: a.headline, published_at: a.published_at });
  }
  fs.writeFileSync("C:/Users/Mekawey/.openclaw-autoclaw/workspace/.openclaw/tmp/news_with_titles_v2.json", JSON.stringify(out, null, 1));
  console.log(`dumped mapped news: ${out.length}`);

  fs.writeFileSync(MARKER, new Date().toISOString());
  console.log("PIPELINE COMPLETE ✓");
  await p.end();
})().catch((e) => { console.error("ERR:", e.message); process.exit(1); });
