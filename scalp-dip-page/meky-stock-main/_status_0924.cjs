// READ-ONLY live status check - 2026-09-24 (Thursday evening)
// 1) decision_audit_log since 9/21: BUG C compliance (scans only on Sundays)
// 2) latest weekly batch (scan_date 2026-09-20): picks + entry prices
// 3) open-week mark through Thursday 24/9 close (daily_candles, scanner prices)
// ASCII ONLY. Run: node _status_0924.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const COST = 0.0005;
const DEPLOYED = 184617; // paper capital at 20/9 entry (from ledger: 100k compounded)

(async () => {
  // 1) decision audit log since Monday 21/9
  const { rows: audit } = await p.query(
    "SELECT id, event_type, created_at::text AS ts, symbol, LEFT(COALESCE(details::text, ''), 140) AS info " +
    "FROM decision_audit_log WHERE created_at >= '2026-09-21' ORDER BY id ASC"
  );
  console.log('=== decision_audit_log since 2026-09-21: ' + audit.length + ' rows ===');
  for (const r of audit) {
    const ts = (r.ts || '').replace('T', ' ').slice(0, 16);
    console.log('  #' + r.id + ' | ' + ts + ' UTC | ' + r.event_type + ' | ' + (r.symbol || '-') + ' | ' + String(r.info || '').replace(/\s+/g, ' '));
  }
  const scans = audit.filter(r => /SCAN/i.test(r.event_type || ''));
  const badDay = scans.filter(r => { const d = new Date(r.ts); return d.getUTCDay() !== 0; }); // Sunday=0 in UTC; EGX dates are dates not tz-critical here
  console.log('SCAN events: ' + scans.length + ' | non-Sunday scans (BUG C check, UTC day): ' + badDay.length);

  // 2) latest weekly batch
  const { rows: sigs } = await p.query(
    "SELECT * FROM scalp_dip_signals WHERE scan_date >= '2026-09-19' ORDER BY scan_date DESC, symbol ASC LIMIT 40"
  );
  console.log('\n=== scalp_dip_signals since 9/19: ' + sigs.length + ' rows ===');
  if (sigs.length) console.log('columns: ' + Object.keys(sigs[0]).join(', '));
  const byDate = {};
  for (const s of sigs) { const d = String(s.scan_date).slice(0, 10); (byDate[d] = byDate[d] || []).push(s); }
  for (const d of Object.keys(byDate).sort()) console.log('  scan_date ' + d + ': ' + byDate[d].length + ' rows');

  // 3) open-week mark: entry 20/9 open -> latest close (24/9 expected)
  const picks = (byDate['2026-09-20'] || []).map(s => ({
    symbol: String(s.symbol).toUpperCase(),
    entry: Number(s.entry_price || s.entryPrice || 0),
    raw: s
  }));
  console.log('\n=== 20/9 batch picks: ' + picks.length + ' ===');
  if (!picks.length) { console.log('NO 20/9 BATCH FOUND - dumping last 8 rows raw:'); for (const s of sigs.slice(0, 8)) console.log(JSON.stringify(s).slice(0, 300)); }

  if (picks.length) {
    const syms = picks.map(x => x.symbol);
    const { rows: cnd } = await p.query(
      "SELECT symbol, date::text AS date, open, close, volume FROM daily_candles WHERE symbol = ANY($1) AND date >= '2026-09-18' ORDER BY symbol, date",
      [syms]
    );
    const by = {};
    for (const r of cnd) { const s = String(r.symbol).toUpperCase(); (by[s] = by[s] || []).push({ d: r.date, o: Number(r.open), c: Number(r.close), v: Number(r.volume) }); }
    let sum = 0, n = 0, worst = null;
    console.log('\n--- open week mark (entry Sun 20/9 open -> Thu 24/9 close, cost 0.05%) ---');
    for (const pk of picks) {
      const g = by[pk.symbol] || [];
      const entryRow = g.find(x => x.d === '2026-09-20');
      const entry = pk.entry > 0 ? pk.entry : (entryRow ? entryRow.o : 0);
      const last = g.length ? g[g.length - 1] : null;
      const entrySrc = pk.entry > 0 ? 'signal' : (entryRow ? 'candle' : 'NONE');
      if (!(entry > 0) || !last) { console.log('  ' + pk.symbol + ': MISSING DATA (entry=' + entry + ', lastDate=' + (last ? last.d : 'none') + ')'); continue; }
      const ret = (last.c / entry - 1) - COST;
      sum += ret; n++;
      if (!worst || ret < worst.r) worst = { s: pk.symbol, r: ret };
      console.log('  ' + pk.symbol.padEnd(6) + ' entry ' + entry.toFixed(3) + ' (' + entrySrc + ') -> ' + last.d + ' close ' + last.c.toFixed(3) + '  = ' + (ret * 100).toFixed(2) + '%');
      console.log('         week path: ' + g.map(x => x.d.slice(5) + ':' + x.c.toFixed(2)).join(' | '));
    }
    if (n) {
      const avg = sum / n;
      console.log('\n  equal-weight open-week P&L: ' + (avg * 100).toFixed(2) + '%  = ' + Math.round(avg * DEPLOYED).toLocaleString('en-US') + ' EGP on ' + DEPLOYED.toLocaleString('en-US') + ' deployed (' + n + ' slots)');
      console.log('  worst slot: ' + (worst ? worst.s + ' ' + (worst.r * 100).toFixed(2) + '%' : '-'));
      console.log('  exit: Sunday 27/9 at open (no action needed before)');
    }
  }

  // 4) any signals newer than the Sunday batch? (mid-week gate check)
  const { rows: newer } = await p.query(
    "SELECT DISTINCT scan_date::text AS d FROM scalp_dip_signals WHERE scan_date > '2026-09-20' LIMIT 10"
  );
  console.log('\nscan_dates AFTER 20/9 (should be empty until Sun 27/9): ' + (newer.length ? newer.map(r => r.d).join(', ') : 'NONE - OK'));

  await p.end();
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
