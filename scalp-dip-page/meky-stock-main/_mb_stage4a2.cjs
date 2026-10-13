/** STAGE 4a-2 — merged daily OHLC: thunder_tick_archive days take PRIORITY per symbol/date;
 * TradingView CSV (D:/egx_daily_prices_tradingview.csv) fills every other day.
 * TV usable rule (same spirit as tick FULL_SESSION_RELIABLE, adapted to what a daily bar exposes):
 *   open_minute <= 610  (first bar within 10 min of 10:00 open  -> open price is real)
 *   close_minute >= 855 (last bar at/after 14:15 -> close print not stale)
 *   n_bars >= 20        (liquidity proxy replacing the tick maxGap<=15 rule)
 * Writes _mb_days.json (SAME shape as before: {days, dates}) so stage 4b runs unchanged. */
const fs = require('fs');
const HHMM = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
const ticksOnly = JSON.parse(fs.readFileSync('_mb_days_ticksonly.json', 'utf8')); // backup of the previous tick-only build
const lines = fs.readFileSync('D:/egx_daily_prices_tradingview.csv', 'utf8').split(/\r?\n/).filter((l) => l.trim());
const rows = lines.slice(1).map((l) => l.split(','));
const tvDays = {};
let pass = 0, failOpen = 0, failClose = 0, failBars = 0, both = 0, bothTickUsable = 0;
for (const r of rows) {
  const sym = r[0], date = r[1], open = +r[2], close = +r[3], nBars = +r[6], openMin = +r[7], closeMin = +r[8];
  const uOpen = openMin <= 610, uClose = closeMin >= 855, uBars = nBars >= 20;
  if (!uOpen) failOpen++;
  if (!uClose) failClose++;
  if (!uBars) failBars++;
  const usable = uOpen && uClose && uBars;
  if (usable) pass++;
  (tvDays[sym] = tvDays[sym] || []).push({ date, open, close, n: nBars, usable, firstC: HHMM(openMin), lastC: HHMM(closeMin), maxGap: null, src: 'tv' });
}
const days = {};
for (const sym of new Set([...Object.keys(ticksOnly.days), ...Object.keys(tvDays)])) {
  const byDate = new Map();
  for (const d of (ticksOnly.days[sym] || [])) byDate.set(d.date, { ...d, src: 'tick' });
  for (const d of (tvDays[sym] || [])) {
    if (byDate.has(d.date)) { both++; if (byDate.get(d.date).usable) bothTickUsable++; } // tick wins per priority rule
    else byDate.set(d.date, d);
  }
  days[sym] = [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}
const allDates = [...new Set(Object.values(days).flat().map((d) => d.date))].sort();
const stats = Object.entries(days).map(([s, a]) => s + ':' + a.length + 'd/' + a.filter((x) => x.usable).length + 'u(t' + a.filter((x) => x.src === 'tick').length + ')');
fs.writeFileSync('_mb_days.json', JSON.stringify({ days, dates: allDates }), 'utf8');
const out = [
  'tv rows=' + rows.length + ' symbols=' + Object.keys(tvDays).length + ' unique_dates=' + [...new Set(rows.map((r) => r[1]))].length,
  'tv usable pass=' + pass + ' | failOpen=' + failOpen + ' failClose=' + failClose + ' failBars(n<20)=' + failBars + ' (conditions overlap)',
  'overlap (sym,date) both sources=' + both + ' | tick kept per priority; of those tick-usable=' + bothTickUsable,
  'merged: symbols=' + Object.keys(days).length + ' | calendar ' + allDates[0] + '..' + allDates[allDates.length - 1] + ' (' + allDates.length + ' days)',
  'total merged (sym,date)=' + Object.values(days).reduce((a, x) => a + x.length, 0) + ' | usable=' + Object.values(days).reduce((a, x) => a + x.filter((d) => d.usable).length, 0),
  'per-symbol (days/usable(tickdays)): ' + stats.join(' '),
];
fs.writeFileSync('_mb_stage4a2.out', out.join('\n') + '\n', 'utf8');
console.log('STAGE4a2: merged ' + Object.keys(days).length + ' symbols, calendar ' + allDates[0] + '..' + allDates[allDates.length - 1] + ' (' + allDates.length + ' days)');
