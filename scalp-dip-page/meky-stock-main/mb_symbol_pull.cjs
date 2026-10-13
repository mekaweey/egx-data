// PER-SYMBOL NEWS PULL (complete, precise mapping): for each of the user's
// price tickers, pull /markets/EGX/stocks/{sym}/news/{page} until the price
// window floor (2026-04-12) or end. Zero symbol-mapping guesswork - every
// article comes from ITS OWN symbol's page.
// Politeness: 5.5s sleep, realistic UA, stop on 403/429. Resume via progress.
const fs = require('fs');
const path = require('path');
const { parseArticles } = require(path.join(__dirname, '_mb_archive_pull.cjs'));

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36';
const SLEEP_MS = 5500;
const FLOOR_ISO = '2026-04-12T00:00:00.000Z'; // price window starts 2026-04-14
const MAX_PAGES_PER_SYM = 30;
const OUT = '_mb_symbol_news.jsonl';
const PROGRESS = '_mb_symbol_pull_progress.json';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const tickers = [];
  const lines = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(Boolean);
  for (const l of lines.slice(1)) { const t = l.split(',')[0]; if (t) tickers.push(t.trim().toUpperCase()); }
  const uniq = [...new Set(tickers)];
  console.log('tickers: ' + uniq.length);

  // resume: skip symbols already fully pulled
  let done = {};
  try { done = JSON.parse(fs.readFileSync(PROGRESS, 'utf8')); } catch (e) {}

  let fails = 0;
  let symIndex = 0;
  for (const sym of uniq) {
    symIndex++;
    if (done[sym] === 'complete' || done[sym] === 'not-found') { continue; }
    let totalPages = 0;
    let notFound = false;
    let httpErrs = 0;
    for (let pg = 1; pg <= MAX_PAGES_PER_SYM; pg++) {
      const url = 'https://www.mubasher.info/markets/EGX/stocks/' + sym + '/news/' + (pg === 1 ? '' : pg);
      let res;
      try { res = await fetch(url, { headers: { 'user-agent': UA, 'accept': 'text/html', 'accept-language': 'ar-EG,ar;q=0.9' } }); }
      // httpErrs: consecutive HTTP error counter (reset on 200)
      catch (e) {
        console.log(sym + ' p' + pg + ': fetch FAILED ' + e.message);
        if (++fails >= 3) { console.log('3 consecutive failures -> STOP'); process.exit(1); }
        await sleep(SLEEP_MS);
        pg--; // retry same page
        continue;
      }
      fails = 0;
      if (res.status === 200) httpErrs = 0;
      if (res.status === 404) { notFound = true; break; }
      if (res.status === 403 || res.status === 429) { console.log(sym + ': HTTP ' + res.status + ' -> BLOCKED -> STOP'); process.exit(1); }
      if (res.status !== 200) {
        httpErrs++;
        console.log(sym + ' p' + pg + ': HTTP ' + res.status + ' (consecutive ' + httpErrs + ')');
        if (res.status === 500 && httpErrs >= 2) { console.log(sym + ': 2 consecutive 500s -> archive end for this symbol'); break; }
        await sleep(SLEEP_MS);
        continue;
      }
      const items = parseArticles(await res.text());
      if (!items.length) { break; } // end of this symbol's archive
      const keep = items.filter((i) => !i.published_at || i.published_at >= FLOOR_ISO);
      for (const it of keep) {
        fs.appendFileSync(OUT, JSON.stringify({ sym, id: it.id, dateRaw: it.dateRaw, title: it.title, url: it.url, published_at: it.published_at, category_id: it.category_id, category_name: it.category_name }) + '\n');
      }
      totalPages = pg;
      const oldest = items[items.length - 1].published_at;
      if (oldest && oldest < FLOOR_ISO) { break; } // floor reached
      await sleep(SLEEP_MS);
    }
    done[sym] = notFound ? 'not-found' : 'complete';
    fs.writeFileSync(PROGRESS, JSON.stringify(done));
    if (symIndex % 15 === 0) console.log('[' + symIndex + '/' + uniq.length + '] last=' + sym + ' pages=' + totalPages + (notFound ? ' NOT-FOUND' : ''));
    await sleep(SLEEP_MS);
  }
  const counts = {};
  for (const s of uniq) { if (done[s]) counts[done[s]] = (counts[done[s]] || 0) + 1; }
  console.log('SUMMARY: ' + JSON.stringify(counts));
  console.log('=== SYMBOL PULL DONE ===');
}
main().catch((e) => { console.log('FATAL:', e.message); process.exit(1); });
