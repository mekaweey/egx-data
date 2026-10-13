/** STAGE 4b — join mapped+tagged news with usable days: session classification, day1/2/3 returns, per-tag x period stats, NO_NEWS baseline, both CSVs. ASCII -> _mb_stage4b.out. */
const fs = require('fs');
const esc = (s) => String(s).replace(/[^\x20-\x7E]/g, (c) => '\\u' + c.codePointAt(0).toString(16).padStart(4, '0'));
const symMap = JSON.parse(fs.readFileSync('_mb_symbol_map.json', 'utf8'));
const { tagMap } = JSON.parse(fs.readFileSync('_mb_tags.json', 'utf8'));
const { days, dates } = JSON.parse(fs.readFileSync('_mb_days.json', 'utf8'));
const news = fs.readFileSync('_mb_archive_cache.jsonl', 'utf8').split('\n').filter((l) => l.trim()).map((l) => JSON.parse(l));
function cairoOffset(d) { const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Cairo', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(d); const g = (t) => +parts.find((p) => p.type === t).value; return (Date.UTC(g('year'), g('month') - 1, g('day'), g('hour') % 24, g('minute')) - d.getTime()) / 60000; }

const results = [];
const skip = { no_sym: 0, no_tag: 0, no_next: 0, entry_unusable: 0, ok: 0 };
for (const n of news) {
  const sym = symMap[n.id]; const tg = tagMap[n.id];
  if (!sym) { skip.no_sym++; continue; }
  if (!tg || !tg.tags || tg.tags.length === 0) { skip.no_tag++; continue; }
  const lc = new Date(new Date(n.published_at).getTime() + cairoOffset(new Date(n.published_at)) * 60000);
  const dstr = lc.toISOString().slice(0, 10);
  // lc's UTC fields carry Cairo wall time — read with getUTC* (getHours() re-applies machine TZ)
  const mins = lc.getUTCHours() * 60 + lc.getUTCMinutes();
  const symDays = days[sym] || [];
  const idx = symDays.findIndex((d) => d.date === dstr);
  let status, entryIdx;
  if (idx >= 0 && mins < 10 * 60) { status = 'pre_open'; entryIdx = idx; }
  else if (idx >= 0 && mins <= 14 * 60 + 30) { status = 'during_session'; entryIdx = idx + 1; }
  else if (idx >= 0 && mins > 14 * 60 + 30) { status = 'after_close'; entryIdx = idx + 1; }
  else { status = 'non_trading_day'; const firstAhead = symDays.findIndex((d) => d.date > dstr); if (firstAhead < 0) { skip.no_next++; continue; } const gapDays = (new Date(symDays[firstAhead].date + 'T00:00:00Z') - new Date(dstr + 'T00:00:00Z')) / 864e5; if (gapDays > 4) { skip.no_price_data = (skip.no_price_data || 0) + 1; continue; } entryIdx = firstAhead; }
  if (entryIdx < 0 || !symDays[entryIdx]) { skip.no_next++; continue; }
  const d1 = symDays[entryIdx];
  if (!d1.usable) { skip.entry_unusable++; continue; }
  const d2 = symDays[entryIdx + 1], d3 = symDays[entryIdx + 2];
  const r1 = (d1.close / d1.open - 1) * 100;
  const r2 = d2 && d2.usable ? (d2.close / d1.open - 1) * 100 : null;
  const r3 = d3 && d3.usable ? (d3.close / d1.open - 1) * 100 : null;
  results.push({ symbol: sym, headline: n.title, pub_cairo: lc.toISOString().replace('T', ' ').slice(0, 16), session: status, tags: tg.tags.join('|'), d1: d1.date, open: d1.open, c1: d1.close, c2: d2 && d2.usable ? d2.close : '', c3: d3 && d3.usable ? d3.close : '', r1, r2, r3 });
  skip.ok++;
}
const newsBySymDate = new Map();
for (const n of news) { const s = symMap[n.id]; if (!s) continue; const lc = new Date(new Date(n.published_at).getTime() + cairoOffset(new Date(n.published_at)) * 60000); const k = s + '|' + lc.toISOString().slice(0, 10); newsBySymDate.set(k, true); }
const base = [];
for (const [s, arr] of Object.entries(days)) for (const d of arr) { if (!d.usable || newsBySymDate.has(s + '|' + d.date)) continue; base.push((d.close / d.open - 1) * 100); }
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
const wr = (a) => (a.length ? 100 * a.filter((x) => x > 0).length / a.length : null);
// NOTE (this pass): MID was hardcoded '2026-09-01' — meaningful for the old 20-day window only.
// With the widened ~90-day window that constant would push ~everything into first_half.
// Chronological half-split intent preserved by using the MEDIAN entry date of actual test cases.
const d1sorted = results.map((r) => r.d1).sort();
const MID = d1sorted.length ? d1sorted[Math.floor(d1sorted.length / 2)] : '2026-09-01';
const baseFirst = [], baseSecond = [];
for (const b of base) { } // (kept for structure)
const baseSplit = { first: [], second: [] };
for (const [s, arr] of Object.entries(days)) for (const d of arr) { if (!d.usable || newsBySymDate.has(s + '|' + d.date)) continue; (d.date < MID ? baseSplit.first : baseSplit.second).push((d.close / d.open - 1) * 100); }
const fmt = (v) => (v === null || v === undefined || v === '' ? '' : typeof v === 'number' ? +v.toFixed(3) : v);
const sumRows = [['keyword_tag', 'period', 'n_observations', 'avg_return_day1_pct', 'avg_return_day3_pct', 'win_rate_pct']];
for (const tag of ['profit_positive', 'profit_negative', 'dividends', 'dividends_bonus', 'capital_increase', 'share_listing', 'ma_deal', 'contract_win', 'stake_change', 'treasury_shares', 'ipo']) {
  for (const p of ['first_half', 'second_half', 'full']) {
    const s = results.filter((r) => r.tags.split('|').includes(tag) && (p === 'full' || (p === 'first_half' ? r.d1 < MID : r.d1 >= MID)));
    sumRows.push([tag, p, s.length, avg(s.map((x) => x.r1)), avg(s.map((x) => x.r3).filter((x) => x !== null)), wr(s.map((x) => x.r1))]);
  }
}
sumRows.push(['NO_NEWS_BASELINE', 'full', base.length, avg(base), null, wr(base)]);
sumRows.push(['NO_NEWS_BASELINE', 'first_half', baseSplit.first.length, avg(baseSplit.first), null, wr(baseSplit.first)]);
sumRows.push(['NO_NEWS_BASELINE', 'second_half', baseSplit.second.length, avg(baseSplit.second), null, wr(baseSplit.second)]);
fs.writeFileSync('news_signal_summary.csv', '\uFEFF' + sumRows.map((r) => r.map(fmt).join(',')).join('\n') + '\n', 'utf8');
const hdr = 'symbol,headline,published_at_cairo,market_session_status,keyword_tags,next_trading_day,entry_open,close_day1,close_day2,close_day3,return_day1_pct,return_day2_pct,return_day3_pct';
const qq = (s) => '"' + String(s).replace(/"/g, '""') + '"';
fs.writeFileSync('news_signal_test_results.csv', '\uFEFF' + hdr + '\n' + results.map((r) => [r.symbol, qq(r.headline), r.pub_cairo, r.session, r.tags, r.d1, r.open, r.c1, r.c2, r.c3, fmt(r.r1), fmt(r.r2), fmt(r.r3)].join(',')).join('\n') + '\n', 'utf8');
const out = [
  'test cases ok=' + skip.ok + ' | skipped: no_sym=' + skip.no_sym + ' no_tag=' + skip.no_tag + ' no_next=' + skip.no_next + ' entry_unusable=' + skip.entry_unusable,
  'baseline (no-news usable symbol-days): n=' + base.length,
  '--- summary (tag | period | n | avg_d1% | avg_d3% | win%) ---',
  ...sumRows.map((r) => r.map(fmt).join(' | ')),
  '--- results detail (first 12) ---',
  ...results.slice(0, 12).map((r) => r.symbol + ' | ' + r.pub_cairo + ' | ' + r.session + ' | ' + r.tags + ' | d1=' + r.d1 + ' open=' + r.open + ' r1=' + fmt(r.r1) + ' r3=' + fmt(r.r3) + ' | ' + esc(r.headline.slice(0, 60))),
];
fs.writeFileSync('_mb_stage4b.out', out.join('\n') + '\n', 'utf8');
console.log('STAGE4b: ok=' + skip.ok + ' base=' + base.length);