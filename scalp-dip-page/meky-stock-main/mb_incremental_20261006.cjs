// INCREMENTAL MUBASHER PULL (2026-10-06): pages 1..N until known IDs dominate.
// New files only; canonical D:\ files untouched pending approval.
const fs = require("fs");
const path = require("path");
const { parseArticles } = require("D:/meky-stock-main/meky-stock-main/_mb_archive_pull.cjs");
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const BASE = 'https://www.mubasher.info/news/eg/pulse/stocks';
const SLEEP_MS = 5500;
const MAX_PAGES = 60;
const OUT = "D:/meky-stock-main/meky-stock-main/_mb_fresh_20261006.jsonl";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const known = new Set();
for (const line of fs.readFileSync("D:/mubasher_all_news.jsonl", "utf8").split("\n").filter(Boolean)) {
  try { const r = JSON.parse(line); if (r && r.id) known.add(String(r.id)); } catch (e) {}
}
console.log("known ids: " + known.size);
(async () => {
  let totalNew = 0;
  for (let n = 1; n <= MAX_PAGES; n++) {
    const url = n === 1 ? BASE : BASE + "/" + n;
    let res;
    try {
      res = await fetch(url, { headers: { "user-agent": UA, "accept": "text/html", "accept-language": "ar-EG,ar;q=0.9,en;q=0.8" } });
    } catch (e) { console.log("p" + n + " fetch FAIL: " + e.message); break; }
    if (res.status === 403 || res.status === 429) { console.log("p" + n + " BLOCKED " + res.status); break; }
    if (res.status !== 200) { console.log("p" + n + " HTTP " + res.status + " skip"); await sleep(SLEEP_MS); continue; }
    const items = parseArticles(await res.text());
    if (!items.length) { console.log("p" + n + " empty -> END"); break; }
    const fresh = items.filter((i) => !known.has(String(i.id)));
    if (fresh.length) fs.appendFileSync(OUT, fresh.map((i) => JSON.stringify(i)).join("\n") + "\n");
    totalNew += fresh.length;
    console.log("p" + n + ": " + items.length + " items, " + fresh.length + " new (total new " + totalNew + ")");
    if (fresh.length < items.length * 0.2) { console.log("overlap -> CAUGHT UP, stop"); break; }
    await sleep(SLEEP_MS);
  }
  console.log("INCREMENTAL DONE, new=" + totalNew);
})().catch((e) => { console.error("FATAL " + e.message); process.exit(1); });
