/**
 * STAGE 2 — mubasher EG pulse/stocks news archiver (REAL, polite).
 *
 * MECHANISM (verified in Stage 1): SSR path pagination /news/eg/pulse/stocks/N
 * returns 25 DIFFERENT full articles per page (date + title + url + category).
 *
 * POLICY (Stage 0, honored): Crawl-delay 5 → sleep 5.5s; never touch /api/
 * (robots Disallow); realistic UA; hard stop on 403/429 or 3 consecutive
 * failures; no bypass. ToS has no anti-scraping clause (keywords checked);
 * we store source + url per article (attribution respected).
 *
 * MODES: --pages=N (default 3) | --dry (parse+print only, no cache write)
 */
const fs = require('fs');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const BASE = 'https://www.mubasher.info/news/eg/pulse/stocks';
const SLEEP_MS = 5500;
const CACHE = '_mb_archive_cache.jsonl';

const AR_MONTHS = {
  'يناير': 1, 'فبراير': 2, 'مارس': 3, 'أبريل': 4, 'ابريل': 4, 'مايو': 5, 'يونيو': 6,
  'يوليو': 7, 'أغسطس': 8, 'اغسطس': 8, 'سبتمبر': 9, 'أكتوبر': 10, 'نوفمبر': 11, 'ديسمبر': 12,
};

function decodeEntities(s) {
  return s.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

// Cairo offset (minutes) at a given wall-clock moment — DST-aware via Intl.
function cairoOffsetMinutes(wallIsoLike) {
  const d = new Date(wallIsoLike + 'Z');
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Cairo', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(d);
  const g = (t) => parts.find((p) => p.type === t).value;
  const asUTC = Date.UTC(+g('year'), +g('month') - 1, +g('day'), +g('hour') % 24, +g('minute'), +g('second'));
  return (asUTC - d.getTime()) / 60000;
}

// Parse "10 سبتمبر 04:28 م" (year inferred), explicit-year forms
// "10 سبتمبر 2025 04:28 م" / "10 سبتمبر 04:28 م 2025", or time-only "11:44 ص" (= today, Cairo)
// -> UTC ISO (Cairo wall time, DST-aware).
// "10 سبتمبر 2025 04:28 م" / "10 سبتمبر 04:28 م 2025" -> UTC ISO (Cairo wall time, DST-aware).
function parseArabicDate(s, refNow = new Date()) {
  // Time-only form "11:44 ص" = today (Cairo) at that wall time (future -> yesterday).
  const tOnly = s.trim().match(/^(\d{1,2}):(\d{2})\s+([صم])$/);
  if (tOnly) {
    let h = +tOnly[1]; const min = +tOnly[2];
    if (tOnly[3] === 'م' && h !== 12) h += 12;
    if (tOnly[3] === 'ص' && h === 12) h = 0;
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(refNow).split('-');
    const hm = String(h).padStart(2, '0') + ':' + String(min).padStart(2, '0');
    const mkIso = (ymd) => { const wall = ymd + 'T' + hm + ':00'; return new Date(new Date(wall + 'Z').getTime() - cairoOffsetMinutes(wall) * 60000).toISOString(); };
    let iso = mkIso(p.join('-'));
    if (new Date(iso).getTime() - refNow.getTime() > 5 * 60000) {
      const yst = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]) - 86400000);
      iso = mkIso(yst.toISOString().slice(0, 10));
    }
    return iso;
  }
  const m = s.trim().match(/^(\d{1,2})\s+([\u0600-\u06FF]+)(?:\s+(\d{4}))?\s+(\d{1,2}):(\d{2})\s+([صم])(?:\s+(\d{4}))?$/);
  if (!m) return null;
  const day = +m[1], month = AR_MONTHS[m[2]];
  if (!month) return null;
  let hour = +m[4]; const minute = +m[5];
  if (m[6] === 'م' && hour !== 12) hour += 12;
  if (m[6] === 'ص' && hour === 12) hour = 0;
  const explicitYear = m[3] || m[7] || null;
  const yr = explicitYear || new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Cairo', year: 'numeric' }).format(refNow);
  const mk = (y) => {
    const wall = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    const off = cairoOffsetMinutes(wall);
    return new Date(new Date(wall + 'Z').getTime() - off * 60000).toISOString();
  };
  let iso = mk(yr);
  if (!explicitYear && new Date(iso).getTime() - refNow.getTime() > 45 * 864e5) iso = mk(String(+yr - 1));
  return iso;
}

async function fetchPage(n) {
  const url = n === 1 ? BASE : BASE + '/' + n;
  const res = await fetch(url, {
    headers: { 'user-agent': UA, 'accept': 'text/html', 'accept-language': 'ar-EG,ar;q=0.9,en;q=0.8' },
  });
  const html = await res.text();
  return { status: res.status, html };
}

function parseArticles(html) {
  const items = [];
  const re = /<span class="mi-article-media-block__date">([^<]+)<\/span>\s*<a class="mi-article-media-block__title" href="(\/news\/(\d+)\/[^"]*)"\s*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    items.push({
      id: m[3],
      dateRaw: m[1].trim(),
      url: 'https://www.mubasher.info' + m[2],
      title: decodeEntities(m[4]).trim().replace(/\s+/g, ' '),
      published_at: parseArabicDate(m[1].trim()),
      pulled_at: new Date().toISOString(),
    });
  }
  const catRe = /class="label global__section-label[^"]*"\s+ng-hide="hideNewsTags"\s+href="\/news\/category\/(\d+)\/[^"]*"\s*>\s*([^<]+?)\s*<\/a>/g;
  const cats = [];
  let cm;
  while ((cm = catRe.exec(html)) !== null) cats.push({ id: cm[1], name: decodeEntities(cm[2]).trim() });
  items.forEach((it, i) => {
    it.category_id = cats[i] ? cats[i].id : null;
    it.category_name = cats[i] ? cats[i].name : null;
  });
  return items;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const pagesArg = args.find((a) => a.startsWith('--pages='));
  const maxPages = pagesArg ? parseInt(pagesArg.split('=')[1], 10) : 3;
  const dry = args.includes('--dry');
  const startArg = args.find((a) => a.startsWith('--start='));
  const floorArg = args.find((a) => a.startsWith('--floor='));
  const resume = args.includes('--resume');
  const PROGRESS = '_mb_pull_progress.json';
  let startPage = startArg ? parseInt(startArg.split('=')[1], 10) : 1;
  if (resume) { try { const pr = JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); startPage = Math.max(startPage, (pr.lastPage || 0) + 1); } catch (e) {} }
  const floor = floorArg ? floorArg.split('=')[1] : null;
  if (floor) console.log('FLOOR: keep only articles with published_at >= ' + floor);
  console.log('STARTING at page ' + startPage + ', up to ' + maxPages + ' pages this run');
  console.log('MODE: ' + (dry ? 'DRY (no cache write)' : 'LIVE cache write') + ' | maxPages=' + maxPages + ' | rate=' + SLEEP_MS + 'ms');
  const all = [];
  let fails = 0;
  for (let n = startPage; n < startPage + maxPages; n++) {
    let r;
    try {
      r = await fetchPage(n);
    } catch (e) {
      console.log('p' + n + ': fetch FAILED: ' + e.message);
      if (++fails >= 3) { console.log('3 consecutive failures -> STOP (no bypass attempts).'); break; }
      continue;
    }
    fails = 0;
    if (r.status === 403 || r.status === 429) { console.log('p' + n + ': HTTP ' + r.status + ' -> BLOCKED/RATE-LIMITED -> STOP immediately.'); break; }
    if (r.status !== 200) { console.log('p' + n + ': HTTP ' + r.status + ' -> skip'); continue; }
    const items = parseArticles(r.html);
    console.log('p' + n + ': 200 OK | ' + items.length + ' articles | ' + (items[0] ? items[0].dateRaw : '?') + ' -> ' + (items[items.length - 1] ? items[items.length - 1].dateRaw : '?'));
    const keep = floor ? items.filter((i) => !i.published_at || i.published_at >= floor) : items;
    if (keep.length) {
      all.push(...keep);
      if (!dry) fs.appendFileSync(CACHE, keep.map((i) => JSON.stringify(i)).join('\n') + '\n');
    }
    if (!items.length) { console.log('p' + n + ': 0 articles -> END OF ARCHIVE -> STOP.'); break; }
    if (floor && items.every((i) => i.published_at && i.published_at < floor)) { console.log('p' + n + ': all articles below floor -> boundary reached -> STOP.'); break; }
    fs.writeFileSync(PROGRESS, JSON.stringify({ lastPage: n, at: new Date().toISOString() }), 'utf8');
    await sleep(SLEEP_MS);
  }
  console.log('\n=== TOTAL parsed: ' + all.length + ' ===');
  console.log('--- first 5 ---');
  for (const it of all.slice(0, 5)) console.log(JSON.stringify(it));
  console.log('--- last 2 ---');
  for (const it of all.slice(-2)) console.log(JSON.stringify(it));
  const unparsed = all.filter((x) => !x.published_at);
  console.log('\ndates parsed: ' + (all.length - unparsed.length) + '/' + all.length);
  if (unparsed.length) console.log('unparsed examples:', JSON.stringify(unparsed.slice(0, 3).map((x) => x.dateRaw)));
  fs.writeFileSync('_mb_last_run_summary.json', JSON.stringify({ pages: maxPages, total: all.length }, null, 1));
  console.log('=== done ===');
}

if (require.main === module) {
  main().catch((e) => { console.log('FATAL:', e.message); process.exit(1); });
}

module.exports = { parseArabicDate, parseArticles, AR_MONTHS, cairoOffsetMinutes };

