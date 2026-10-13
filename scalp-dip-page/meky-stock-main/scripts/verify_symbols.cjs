const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(l => {
  if (l.includes('=') && !l.startsWith('#')) {
    const i = l.indexOf('=');
    env[l.slice(0, i).trim()] = l.slice(i + 1).trim().replace(/^["']|["']$/g, '');
  }
});
const headers = { 'apikey': env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY };

async function countSymbols() {
  const r1 = await fetch(env.SUPABASE_URL + '/rest/v1/marketwatch_snapshots?select=symbol&limit=1000', { headers });
  const d1 = await r1.json();
  const set1 = new Set(d1.map(x => x.symbol));
  console.log('Distinct symbols in marketwatch_snapshots (sample 1000):', set1.size);

  const r2 = await fetch(env.SUPABASE_URL + '/rest/v1/live_ticks?select=symbol&limit=500&order=id.desc', { headers });
  const d2 = await r2.json();
  const set2 = new Set(d2.map(x => x.symbol));
  console.log('Distinct symbols in live_ticks (recent 500):', [...set2]);

  const r3 = await fetch(env.SUPABASE_URL + '/rest/v1/live_quotes?select=symbol&limit=500&order=id.desc', { headers });
  const d3 = await r3.json();
  const set3 = new Set(d3.map(x => x.symbol));
  console.log('Distinct symbols in live_quotes (recent 500):', [...set3]);

  const r4 = await fetch(env.SUPABASE_URL + '/rest/v1/orderbook_snapshots?select=symbol&limit=500&order=id.desc', { headers });
  const d4 = await r4.json();
  const set4 = new Set(d4.map(x => x.symbol));
  console.log('Distinct symbols in orderbook_snapshots (recent 500):', [...set4]);
}

countSymbols();
