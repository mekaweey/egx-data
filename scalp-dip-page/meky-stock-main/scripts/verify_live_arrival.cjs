const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    env[t.substring(0, idx).trim()] = t.substring(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyLiveArrival() {
  console.log('=== Checking data arrived in the last 3 minutes ===');
  const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
  console.log('Cutoff time (UTC):', threeMinAgo);

  // 1. Marketwatch
  const { data: mwLatest } = await sb.from('marketwatch_snapshots')
    .select('symbol, last_price, total_volume, captured_at')
    .order('captured_at', { ascending: false })
    .limit(1);
  console.log('Latest overall Marketwatch snapshot in DB was at:', mwLatest?.[0]?.captured_at);

  const { data: mw, error: mwErr } = await sb.from('marketwatch_snapshots')
    .select('symbol, last_price, total_volume, captured_at')
    .gte('captured_at', threeMinAgo);
  if (mwErr) console.error('MW error:', mwErr);
  else {
    const syms = [...new Set(mw.map(r => r.symbol))];
    console.log(`Marketwatch in last 3m: ${mw.length} rows, ${syms.length} distinct symbols.`);
  }

  // 2. Live Ticks
  const { data: ticks, error: tErr } = await sb.from('live_ticks')
    .select('symbol, price, volume, ts')
    .gte('ts', threeMinAgo);
  if (tErr) console.error('Ticks error:', tErr);
  else {
    const syms = [...new Set(ticks.map(r => r.symbol))];
    console.log(`Live Ticks: ${ticks.length} rows, symbols: ${syms.join(', ')}`);
  }

  // 3. Live Quotes
  const { data: quotes, error: qErr } = await sb.from('live_quotes')
    .select('symbol, bid, ask, ts')
    .gte('ts', threeMinAgo);
  if (qErr) console.error('Quotes error:', qErr);
  else {
    const syms = [...new Set(quotes.map(r => r.symbol))];
    console.log(`Live Quotes: ${quotes.length} rows, symbols: ${syms.join(', ')}`);
  }

  // 4. Orderbook Snapshots (L2)
  const { data: ob, error: obErr } = await sb.from('orderbook_snapshots')
    .select('symbol, best_bid, best_ask, ts')
    .gte('ts', threeMinAgo);
  if (obErr) console.error('Orderbook error:', obErr);
  else {
    const syms = [...new Set(ob.map(r => r.symbol))];
    console.log(`Orderbook (L2): ${ob.length} rows, symbols: ${syms.join(', ')}`);
  }

  // 5. Tape
  const { data: tape, error: tapeErr } = await sb.from('thunder_tape')
    .select('symbol, price, volume, created_at')
    .gte('created_at', threeMinAgo);
  if (tapeErr) console.error('Tape error:', tapeErr);
  else {
    const syms = [...new Set(tape.map(r => r.symbol))];
    console.log(`Tape: ${tape.length} rows, symbols: ${syms.join(', ')}`);
  }
}

verifyLiveArrival().catch(console.error);
