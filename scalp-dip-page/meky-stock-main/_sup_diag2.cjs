'use strict';
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  const rows = await p.query(`SELECT date_trunc('minute', captured_at) m, count(*) c FROM marketwatch_snapshots WHERE captured_at > now() - interval '4 hours' GROUP BY 1 ORDER BY 1 DESC LIMIT 10`);
  console.log('marketwatch last 4h by minute:');
  for (const r of rows.rows) console.log(' ', r.m.toISOString(), r.c);
  const ticks = await p.query(`SELECT max(ts) t FROM live_ticks`).catch(() => null);
  console.log('live_ticks max:', ticks ? ticks.rows[0].t : 'n/a');
  const open = await p.query(`SELECT symbol, entry_price, sl_price, trade_date FROM paper_trades WHERE strategy='scalp-dip' AND status='open' ORDER BY symbol`);
  console.log('open positions:', open.rows.length);
  for (const r of open.rows) console.log(' ', r.symbol, 'entry', r.entry_price, 'sl', r.sl_price, 'date', r.trade_date);
  const sigs = await p.query(`SELECT count(*) c FROM scalp_dip_signals WHERE scan_date = CURRENT_DATE`);
  console.log('today signals:', sigs.rows[0].c);
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
