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

async function verifyLiveArrival() {
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  // Fetch up to 1000 latest snapshots from the last 5 minutes
  const url = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?captured_at=gte.${fiveMinAgo}&order=captured_at.desc&limit=1000`;
  const res = await fetch(url, { headers });
  const rows = await res.json();
  
  console.log(`\n=== LIVE CHECK (LAST 5 MINUTES: ${fiveMinAgo}) ===`);
  console.log(`Total snapshots captured: ${rows.length}`);
  
  const symbolMap = new Map();
  for (const r of rows) {
    if (!symbolMap.has(r.symbol)) {
      symbolMap.set(r.symbol, r);
    }
  }
  
  console.log(`Distinct symbols actively streaming: ${symbolMap.size}`);
  
  const sorted = [...symbolMap.values()].sort((a, b) => a.symbol.localeCompare(b.symbol));
  
  console.log("\n--- Sample of 25 distinct symbols streamed live right now ---");
  const sample = sorted.slice(0, 25).map(r => ({
    Symbol: r.symbol,
    Price: r.last_price,
    Bid: `${r.highest_bid} (${r.highest_bid_qty})`,
    Ask: `${r.lowest_ask} (${r.lowest_ask_qty})`,
    TotalVol: r.total_volume,
    CapturedAt: r.captured_at
  }));
  console.table(sample);
  
  console.log("\n--- Active Egyptian Blue-Chips & Popular Stocks Check ---");
  const checkSymbols = ['COMI', 'FWRY', 'TMGH', 'SWDY', 'HRHO', 'EKHO', 'ETEL', 'ISPH', 'MASR', 'PHAR', 'EGAL'];
  const blueChips = checkSymbols.map(sym => {
    const r = symbolMap.get(sym);
    if (!r) return { Symbol: sym, Status: 'NOT_SEEN_IN_LAST_5M' };
    return {
      Symbol: sym,
      Price: r.last_price,
      Bid: `${r.highest_bid} x ${r.highest_bid_qty}`,
      Ask: `${r.lowest_ask} x ${r.lowest_ask_qty}`,
      Volume: r.total_volume,
      AgeSec: Math.round((Date.now() - new Date(r.captured_at).getTime()) / 1000)
    };
  });
  console.table(blueChips);
}

verifyLiveArrival();
