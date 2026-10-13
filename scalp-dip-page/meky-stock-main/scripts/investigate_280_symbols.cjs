const fs = require('fs');

const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const t = line.trim();
  if (t && !t.startsWith('#') && t.includes('=')) {
    const idx = t.indexOf('=');
    env[t.slice(0, idx).trim()] = t.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
  }
});

const headers = {
  'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': 'Bearer ' + env.SUPABASE_SERVICE_ROLE_KEY
};

async function investigateSources() {
  console.log("=== INVESTIGATING WHERE 280 SYMBOLS ARE COMING FROM ===");
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  
  // 1. Check client_id / sender in extension_diag
  const diagUrl = `${env.SUPABASE_URL}/rest/v1/extension_diag?ts=gte.${tenMinAgo}&order=ts.desc&limit=10`;
  const diagRes = await fetch(diagUrl, { headers });
  const diags = await diagRes.json();
  console.log(`\n1. Extension Diag entries in last 10m: ${diags.length}`);
  const clientIds = new Set(diags.map(d => d.client_id));
  console.log(`   Client IDs:`, [...clientIds]);
  if (diags.length > 0) {
    console.log(`   Sample Diag Extra:`, JSON.stringify(diags[0].extra));
  }

  // 2. Check live_ticks sources
  const ticksUrl = `${env.SUPABASE_URL}/rest/v1/live_ticks?ts=gte.${tenMinAgo}&order=ts.desc&limit=100`;
  const ticksRes = await fetch(ticksUrl, { headers });
  const ticks = await ticksRes.json();
  const tickSources = new Set(ticks.map(t => t.source));
  console.log(`\n2. Live Ticks sources:`, [...tickSources]);
  const tickSymbols = new Set(ticks.map(t => t.symbol));
  console.log(`   Tick symbols count (last 10m): ${tickSymbols.size}`);

  // 3. Check marketwatch_snapshots count and distinct symbols in the LAST 2 MINUTES
  const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const mwUrl = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?captured_at=gte.${twoMinAgo}&order=captured_at.desc&limit=1000`;
  const mwRes = await fetch(mwUrl, { headers });
  const mwRows = await mwRes.json();
  console.log(`\n3. Marketwatch Snapshots in the last 2 MINUTES: ${mwRows.length} rows`);
  const mwSyms = new Set(mwRows.map(r => r.symbol));
  console.log(`   Distinct symbols in last 2 minutes: ${mwSyms.size}`);
  
  // How many total distinct symbols in marketwatch_snapshots over 15 minutes?
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const mw15Url = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?select=symbol&captured_at=gte.${fifteenMinAgo}&limit=2000`;
  const mw15Res = await fetch(mw15Url, { headers });
  const mw15Rows = await mw15Res.json();
  const mw15Syms = new Set(mw15Rows.map(r => r.symbol));
  console.log(`   Distinct symbols in last 15 minutes (covMw): ${mw15Syms.size}`);

  // 4. Check what Thndr API call sent these!
  // In extension/cdp-module.js, what is the length of assets sent per batch?
  // Let's see if there are indices or mutual funds or US stocks (SPY, QQQ, DIA)
  const indices = [...mw15Syms].filter(s => /^(EGX|SHARIAH|EGGOLD|FADG|SPY|QQQ|DIA|EGX35-LV)/.test(s));
  console.log(`   Indices/ETFs included:`, indices);
  
  // What are the remaining stocks?
  const regularStocks = [...mw15Syms].filter(s => !/^(EGX|SHARIAH|EGGOLD|FADG|SPY|QQQ|DIA|EGX35-LV)/.test(s));
  console.log(`   Regular Egyptian stocks in marketwatch: ${regularStocks.length}`);
}

investigateSources();
