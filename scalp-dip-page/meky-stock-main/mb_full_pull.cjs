// FULL MUBASHER PULL (user request 2026-09-22): every page of the EG pulse
// feed, merged with the previous cache into ONE complete local file.
// Reuses the VERIFIED parser from _mb_archive_pull.cjs (module.exports).
// Politeness: crawl-delay 5.5s honored, realistic UA, stop on 403/429,
// stop when a page returns 0 articles (end of archive).
// Output: _mb_fresh_20260922.jsonl (this pull) + mubasher_all_news.jsonl/.csv
// (complete merged, deduped by article id, fresh wins).
const fs = require('fs');
const path = require('path');
const { parseArticles } = require(path.join(__dirname, '_mb_archive_pull.cjs'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const BASE = 'https://www.mubasher.info/news/eg/pulse/stocks';
const SLEEP_MS = 5500;
const MAX_PAGES = 240;          // user says ~228; early-stop handles the end
const FRESH = '_mb_fresh_20260922.jsonl';
const OLD_CACHE = '_mb_archive_cache.jsonl';
const OUT_JSONL = 'C:/Users/Mekawey/.zcode/workspace/default/bt/mubasher_all_news.jsonl';
const OUT_CSV = 'C:/Users/Mekawey/.zcode/workspace/default/bt/mubasher_all_news.csv';
const PROGRESS = '_mb_full_pull_progress.json';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(n) {
  const url = n === 1 ? BASE : BASE + '/' + n;
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept': 'text/html', 'accept-language': 'ar-EG,ar;q=0.9,en;q=0.8' },
  });
  return { status: res.status, html: await res.text() };
}

async function main() {
  // resume support
  let startPage = 1;
  try {
    const pr = JSON.parse(fs.readFileSync(PROGRESS, 'utf8'));
    startPage = Math.max(1, (pr.lastPage || 0) + 1);
  } catch (e) {}
  console.log('starting at page ' + startPage + ' up to ' + MAX_PAGES + ' (sleep ' + SLEEP_MS + 'ms)');

  let fails = 0;
  let endReached = false;
  for (let n = startPage; n <= MAX_PAGES; n++) {
    let r;
    try { r = await fetchPage(n); }
    catch (e) {
      console.log('p' + n + ': fetch FAILED: ' + e.message);
      if (++fails >= 3) { console.log('3 consecutive failures -> STOP'); break; }
      continue;
    }
    fails = 0;
    if (r.status === 403 || r.status === 429) { console.log('p' + n + ': HTTP ' + r.status + ' -> BLOCKED -> STOP'); break; }
    if (r.status !== 200) { console.log('p' + n + ': HTTP ' + r.status + ' -> skip'); fs.writeFileSync(PROGRESS, JSON.stringify({ lastPage: n, at: new Date().toISOString() })); await sleep(SLEEP_MS); continue; }
    const items = parseArticles(r.html);
    if (!items.length) { console.log('p' + n + ': 0 articles -> END OF ARCHIVE'); endReached = true; fs.writeFileSync(PROGRESS, JSON.stringify({ lastPage: n, endReached: true, at: new Date().toISOString() })); break; }
    fs.appendFileSync(FRESH, items.map((i) => JSON.stringify(i)).join('\n') + '\n');
    if (n % 10 === 0 || n === startPage) {
      console.log('p' + n + ': ' + items.length + ' articles | ' + (items[0] ? items[0].dateRaw : '?') + ' .. ' + (items[items.length - 1] ? items[items.length - 1].dateRaw : '?'));
    }
    fs.writeFileSync(PROGRESS, JSON.stringify({ lastPage: n, at: new Date().toISOString() }));
    await sleep(SLEEP_MS);
  }
  console.log('PULL PHASE DONE | endReached=' + endReached);

  // merge: old cache + fresh, dedupe by id (fresh wins)
  const byId = new Map();
  let oldCount = 0;
  if (fs.existsSync(OLD_CACHE)) {
    for (const line of fs.readFileSync(OLD_CACHE, 'utf8').split('\n').filter(Boolean)) {
      try { const r = JSON.parse(line); if (r && r.id) { byId.set(String(r.id), r); oldCount++; } } catch (e) {}
    }
  }
  let freshCount = 0;
  if (fs.existsSync(FRESH)) {
    for (const line of fs.readFileSync(FRESH, 'utf8').split('\n').filter(Boolean)) {
      try { const r = JSON.parse(line); if (r && r.id) { byId.set(String(r.id), r); freshCount++; } } catch (e) {}
    }
  }
  const all = [...byId.values()].sort((a, b) => (b.published_at || '').localeCompare(a.published_at || ''));
  fs.writeFileSync(OUT_JSONL, all.map((r) => JSON.stringify(r)).join('\n') + '\n');
  // CSV (Excel-friendly; strip commas/quotes safely)
  const csvEsc = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  const csv = ['id,published_at,dateRaw,category_id,category_name,title,url']
    .concat(all.map((r) => [r.id, r.published_at, r.dateRaw, r.category_id, r.category_name, r.title, r.url].map(csvEsc).join(',')))
    .join('\n');
  fs.writeFileSync(OUT_CSV, '\uFEFF' + csv);  // BOM so Excel opens Arabic correctly
  const unparsed = all.filter((x) => !x.published_at).length;
  console.log('MERGE DONE: old ' + oldCount + ' + fresh ' + freshCount + ' -> unique ' + all.length);
  console.log('unparsed dates: ' + unparsed + ' / ' + all.length);
  console.log('files: ' + OUT_JSONL + ' | ' + OUT_CSV);
  console.log('=== FULL PULL DONE ===');
}

main().catch((e) => { console.log('FATAL:', e.message); process.exit(1); });
