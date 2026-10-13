const fs = require('fs');
const readline = require('readline');

async function analyzeCsv(filename) {
  const filePath = `D:\\1All Data\\marketwatch_snapshots\\${filename}`;
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let count = 0;
  let minTs = null;
  let maxTs = null;
  const symbols = new Set();
  const hourly = {};

  for await (const line of rl) {
    count++;
    if (count === 1) continue; // header
    const parts = line.split(',');
    // let's check column format
    // usually captured_at is in one of the columns
    const ts = parts[parts.length - 1] || parts[parts.length - 2];
    const sym = parts[1];
    symbols.add(sym);
    if (!minTs || ts < minTs) minTs = ts;
    if (!maxTs || ts > maxTs) maxTs = ts;

    // extract hour
    const hourMatch = line.match(/\d{4}-\d{2}-\d{2}T(\d{2}):/);
    if (hourMatch) {
      const h = hourMatch[1];
      hourly[h] = (hourly[h] || 0) + 1;
    }
  }

  console.log(`=== ${filename} ===`);
  console.log(`Total rows: ${count - 1}, Unique symbols: ${symbols.size}`);
  console.log(`Earliest ts: ${minTs}, Latest ts: ${maxTs}`);
  console.log('Hourly distribution (UTC):', hourly);
}

async function run() {
  await analyzeCsv('2026-09-16.csv');
  await analyzeCsv('2026-09-17.csv');
}

run().catch(console.error);
