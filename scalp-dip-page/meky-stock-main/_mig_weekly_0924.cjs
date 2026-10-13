// One-time: create momentum_weekly_signals (migration 20260920000001) via direct
// pg connection (DDL is blocked via REST only) + seed capital setting + backfill
// the live open batch (signal 2026-09-20, entry 2026-09-21) so Sunday's exit
// can be marked. Idempotent. ASCII ONLY. Run: node _mig_weekly_0924.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });

(async () => {
  // 1) table (exact schema from supabase/migrations/20260920000001_momentum_weekly.sql)
  await p.query(`
    create table if not exists momentum_weekly_signals (
      id bigserial primary key,
      scan_date date not null,
      entry_date date not null,
      exit_date date not null,
      symbol text not null,
      last_close numeric not null,
      entry_price numeric,
      mom5 numeric,
      v20_money numeric,
      near_high numeric,
      fresh_high boolean default false,
      position_value numeric,
      shares integer,
      selected boolean default false,
      bought boolean default false,
      actual_buy_price numeric,
      buy_timestamp timestamptz,
      sold boolean default false,
      actual_sell_price numeric,
      sell_timestamp timestamptz,
      exit_reason text,
      realized_pnl numeric,
      realized_pnl_pct numeric,
      regime_on boolean default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      unique (scan_date, symbol)
    )
  `);
  console.log('OK: momentum_weekly_signals exists');

  // 2) capital setting (runner sizing reads this key)
  await p.query(`
    insert into strategy_settings (key, numeric_value, updated_at)
    values ('momentum_weekly_user_capital', 100000, now())
    on conflict (key) do nothing
  `);
  const { rows: cap } = await p.query("SELECT numeric_value FROM strategy_settings WHERE key='momentum_weekly_user_capital'");
  console.log('OK: momentum_weekly_user_capital =', cap[0] ? cap[0].numeric_value : 'MISSING');

  // 3) backfill the live open batch (audit id #1: selected RUBX/MPCO/INEG,
  //    signal 20/9, entry Mon 21/9 open, exit Sun 27/9, N3 slots 33,333.33)
  const BATCH = [
    { symbol: 'RUBX', pos: 33333.33 },
    { symbol: 'MPCO', pos: 33333.33 },
    { symbol: 'INEG', pos: 33333.33 },
  ];
  for (const b of BATCH) {
    const { rows: lc } = await p.query("SELECT close FROM daily_candles WHERE symbol=$1 AND date='2026-09-20'", [b.symbol]);
    const { rows: en } = await p.query("SELECT open FROM daily_candles WHERE symbol=$1 AND date='2026-09-21'", [b.symbol]);
    if (!lc.length || !en.length) { console.log('SKIP ' + b.symbol + ': missing candle rows'); continue; }
    const lastClose = Number(lc[0].close), open = Number(en[0].open);
    const gap = open / lastClose - 1;
    if (gap < -0.03 || gap > 0.02) { console.log('SKIP ' + b.symbol + ': gap ' + (gap * 100).toFixed(2) + '% outside band (honest: would not have filled)'); continue; }
    const shares = Math.max(1, Math.floor(b.pos / open));
    await p.query(`
      insert into momentum_weekly_signals
        (scan_date, entry_date, exit_date, symbol, last_close, entry_price, position_value, shares,
         selected, bought, actual_buy_price, buy_timestamp, regime_on)
      values ('2026-09-20','2026-09-21','2026-09-27',$1,$2,$3,$4,$5,true,true,$3,'2026-09-21T07:05:00Z',true)
      on conflict (scan_date, symbol) do nothing
    `, [b.symbol, lastClose, open, b.pos, shares]);
    console.log('BACKFILL ' + b.symbol.padEnd(5) + ' last_close ' + lastClose.toFixed(3) + ' entry(open) ' + open.toFixed(3) + ' gap ' + (gap * 100).toFixed(2) + '% shares ' + shares);
  }

  // 4) verify
  const { rows: fin } = await p.query("SELECT id, scan_date, entry_date, exit_date, symbol, last_close, actual_buy_price, position_value, shares, selected, bought, sold FROM momentum_weekly_signals ORDER BY symbol");
  console.log('\n--- momentum_weekly_signals now ---');
  for (const r of fin) console.log(JSON.stringify(r));
  await p.end();
})().catch(e => { console.error('ERROR: ' + e.message); process.exit(1); });
