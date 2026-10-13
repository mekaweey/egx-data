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

async function auditMarketwatch() {
  console.log("=== DEEP AUDIT: MARKETWATCH SNAPSHOTS TODAY ===");
  
  // Query rows captured in the last 20 minutes
  const since = new Date(Date.now() - 25 * 60 * 1000).toISOString();
  console.log("Checking records since:", since);
  
  const url = `${env.SUPABASE_URL}/rest/v1/marketwatch_snapshots?captured_at=gte.${since}&order=captured_at.desc&limit=500`;
  const res = await fetch(url, { headers });
  const data = await res.json();
  
  console.log(`Total snapshots returned in last 25 min: ${data.length}`);
  if (data.length === 0) {
    console.log("⚠️ No marketwatch snapshots in the last 25 minutes!");
    return;
  }
  
  const uniqueSymbols = new Set();
  let withRealPrice = 0;
  let withRealBid = 0;
  let withRealAsk = 0;
  let withRealVol = 0;
  
  const sampleNonZero = [];
  
  for (const r of data) {
    uniqueSymbols.add(r.symbol);
    const lp = Number(r.last_price) || 0;
    const bid = Number(r.highest_bid) || 0;
    const ask = Number(r.lowest_ask) || 0;
    const vol = Number(r.total_volume) || Number(r.volume_traded) || 0;
    
    if (lp > 0) withRealPrice++;
    if (bid > 0) withRealBid++;
    if (ask > 0) withRealAsk++;
    if (vol > 0) withRealVol++;
    
    if ((lp > 0 || bid > 0 || vol > 0) && sampleNonZero.length < 10) {
      sampleNonZero.push({
        symbol: r.symbol,
        last_price: lp,
        highest_bid: bid,
        highest_bid_qty: r.highest_bid_qty,
        lowest_ask: ask,
        lowest_ask_qty: r.lowest_ask_qty,
        volume: vol,
        time: r.captured_at
      });
    }
  }
  
  console.log(`Unique symbols captured: ${uniqueSymbols.size}`);
  console.log(`Snapshots with last_price > 0: ${withRealPrice} / ${data.length}`);
  console.log(`Snapshots with highest_bid > 0: ${withRealBid} / ${data.length}`);
  console.log(`Snapshots with lowest_ask > 0: ${withRealAsk} / ${data.length}`);
  console.log(`Snapshots with volume > 0: ${withRealVol} / ${data.length}`);
  
  console.log("\nSample real active rows:");
  console.table(sampleNonZero);
}

auditMarketwatch();
