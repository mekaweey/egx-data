// PER-SYMBOL NEWS REFRESHER (2026-10-06): page 1 of each symbol page,
// keeps items newer than the max known published_at per symbol.
// New files only. Politeness: 5.5s between requests, stop on 403/429.
const fs = require("fs");
const { parseArticles } = require("D:/meky-stock-main/meky-stock-main/_mb_archive_pull.cjs");
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const SLEEP_MS = 5500;
const OUT = "D:/meky-stock-main/meky-stock-main/_mb_symbol_refresh_20261006.jsonl";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const syms = [...new Set(
  require("fs").readFileSync("D:/meky-stock-main/meky-stock-main/halal-symbols.txt", "utf8")
    .split(/\r?\n/).map((s) => s.trim().toUpperCase()).filter(Boolean)
)];
const knownMax = {};
try {
  for (const line of fs.readFileSync("D:/meky-stock-main/meky-stock-main/_mb_symbol_news.jsonl", "utf8").split("\n").filter(Boolean)) {
    const r = JSON.parse(line);
    if (r && r.sym && r.published_at && (!knownMax[r.sym] || r.published_at > knownMax[r.sym])) knownMax[r.sym] = r.published_at;
  }
} catch (e) {}
console.log("symbols: " + syms.length);
(async () => {
  let totalNew = 0;
  for (const sym of syms) {
    const url = "https://www.mubasher.info/markets/EGX/stocks/" + sym + "/news/";
    let res;
    try {
      res = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html", "accept-language": "ar-EG,ar;q=0.9" } });
    } catch (e) { console.log(sym + ": fetch FAIL " + e.message); break; }
    if (res.status === 403 || res.status === 429) { console.log(sym + ": BLOCKED " + res.status); break; }
    if (res.status === 404) { continue; }
    if (res.status !== 200) { console.log(sym + ": HTTP " + res.status + " skip"); await sleep(SLEEP_MS); continue; }
    let items = [];
    try { items = parseArticles(await res.text()); } catch (e) { console.log(sym + ": parse FAIL"); }
    const cut = knownMax[sym] || "";
    const fresh = items.filter((i) => i.published_at && (!cut || i.published_at > cut));
    for (const it of fresh) {
      fs.appendFileSync(OUT, JSON.stringify({ sym, id: it.id, dateRaw: it.dateRaw, title: it.title, url: it.url, published_at: it.published_at, category_id: it.category_id, category_name: it.category_name }) + "\n");
    }
    totalNew += fresh.length;
    if (fresh.length) console.log(sym + ": +" + fresh.length);
    await sleep(SLEEP_MS);
  }
  console.log("REFRESH DONE, new=" + totalNew);
})().catch((e) => { console.error("FATAL " + e.message); process.exit(1); });
