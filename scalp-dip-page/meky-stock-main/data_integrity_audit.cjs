// DATA INTEGRITY AUDIT - weekly (Sun 09:00 via Task Scheduler) + runnable anytime
// =====================================================================
// Watches the DATA LAYER itself (not the strategy numbers) so that any
// corruption like BUG F (ghost rows) is caught automatically and telegrammed.
// Checks:
//   1. ghost rows: volume=0 AND open=high=low=close          -> must be 0
//   2. weekend candles (Fri/Sat)                              -> must be 0
//   3. sparse days since 2026-04-14 (count < 100 symbols)     -> flag
//   4. DB vs user-file mismatches (shared window <= 2026-09-09) -> must be 0
//   5. absurd daily moves: |ret| > 30% on tiny volume          -> flag
//   6. freshness: latest candle within 4 days                  -> warn
// Exit code 0 = PASS, 1 = FAIL (findings). Telegram alert on FAIL.
// ASCII ONLY. Run: node data_integrity_audit.cjs
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('.env', 'utf8').split('\n')) { const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/); if (m) env[m[1]] = m[2].replace(/"/g, ''); }
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
const findings = [];
const warn = [];

(async () => {
  // 1) ghosts
  const { rows: g } = await p.query("SELECT count(*)::int AS n FROM daily_candles WHERE volume=0 AND open=high AND high=low AND low=close");
  if (g[0].n > 0) findings.push(`GHOST ROWS: ${g[0].n} rows with volume=0 and flat price (BUG F returned)`);
  else console.log('PASS 1: zero ghost rows');

  // 2) weekend candles
  const { rows: w } = await p.query("SELECT count(*)::int AS n, min(date::text) AS mn, max(date::text) AS mx FROM daily_candles WHERE EXTRACT(DOW FROM date) IN (5,6)");
  if (w[0].n > 0) findings.push(`WEEKEND CANDLES: ${w[0].n} rows dated Fri/Sat (${w[0].mn}..${w[0].mx})`);
  else console.log('PASS 2: zero Friday/Saturday candles');

  // 3) sparse days (recent era)
  const { rows: sp } = await p.query("SELECT date::text AS d, count(*)::int AS n FROM daily_candles WHERE date >= '2026-04-14' GROUP BY date HAVING count(*) < 100 ORDER BY date");
  if (sp.length) findings.push(`SPARSE DAYS: ${sp.map(r => r.d + '=' + r.n).join(', ')} (possible holiday leftovers)`);
  else console.log('PASS 3: no sparse days since 2026-04-14');

  // 4) DB vs user file (shared window)
  const HALAL = new Set(fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/halal_symbols.txt', 'utf8').split('\n').map(s => s.trim().toUpperCase()).filter(Boolean));
  const user = new Map();
  {
    const lines = fs.readFileSync('C:/Users/Mekawey/.zcode/workspace/default/bt/daily.csv', 'utf8').split('\n').filter(Boolean);
    for (const l of lines.slice(1)) {
      const c0 = l.split(',');
      const sym = c0[0].trim().toUpperCase();
      if (!HALAL.has(sym)) continue;
      const di = parseInt(c0[1]);
      const d = new Date(Date.UTC(1970, 0, 1) + di * 86400000).toISOString().slice(0, 10);
      user.set(sym + '|' + d, { o: Number(c0[2]), c: Number(c0[5]) });
    }
  }
  const { rows: db } = await p.query("SELECT symbol, date::text AS d, open, close FROM daily_candles WHERE date <= '2026-09-09' AND EXTRACT(DOW FROM date) NOT IN (5,6)");
  let mismatch = 0, checked = 0;
  const samples = [];
  for (const r of db) {
    const sym = String(r.symbol).toUpperCase();
    if (!HALAL.has(sym)) continue;
    const u = user.get(sym + '|' + r.d);
    if (!u) continue;
    checked++;
    const o = Number(r.open), c = Number(r.close);
    if (!(o > 0) || !(c > 0)) continue;
    if (Math.abs(o - u.o) / u.o > 1e-6 || Math.abs(c - u.c) / u.c > 1e-6) {
      mismatch++;
      if (samples.length < 5) samples.push(`${sym} ${r.d} DB o=${o.toFixed(3)} c=${c.toFixed(3)} vs USER o=${u.o.toFixed(3)} c=${u.c.toFixed(3)}`);
    }
  }
  if (mismatch > 0) findings.push(`DB-vs-USER MISMATCH: ${mismatch}/${checked} halal rows differ (${samples.join(' ; ')})`);
  else console.log(`PASS 4: DB = user file exactly (${checked} rows checked)`);

  // 5) absurd daily moves on tiny volume
  const { rows: am } = await p.query(`
    SELECT symbol, date::text AS d, open, close, volume FROM daily_candles
    WHERE date >= '2026-04-14' AND volume < 1000 AND ABS(close / NULLIF(open,0) - 1) > 0.30
    ORDER BY date DESC LIMIT 20`);
  if (am.length) findings.push(`ABSURD MOVES: ${am.length} rows with |move|>30% on volume<1000 (${am.slice(0, 3).map(r => r.symbol + ' ' + r.d).join(', ')}...)`);
  else console.log('PASS 5: no absurd moves on tiny volume');

  // 6) freshness
  const { rows: f } = await p.query("SELECT max(date::text) AS mx, count(DISTINCT date)::int AS days FROM daily_candles");
  const ageDays = Math.round((Date.now() - new Date(f[0].mx + 'T00:00:00Z')) / 86400000);
  if (ageDays > 4) warn.push(`DATA STALE: last candle ${f[0].mx} (${ageDays} days old)`);
  else console.log(`PASS 6: data fresh (last candle ${f[0].mx})`);

  console.log('');
  console.log(`=== AUDIT RESULT: ${findings.length ? 'FAIL (' + findings.length + ' findings)' : 'PASS'} ===`);
  for (const x of findings) console.log('  FAIL: ' + x);
  for (const x of warn) console.log('  WARN: ' + x);

  if (findings.length) {
    const token = env.TELEGRAM_BOT_TOKEN;
    const chat = env.TELEGRAM_CHAT_ID || env.TELELEGRAM_CHAT_ID;
    if (token && chat) {
      const text = `🚨 فحص سلامة بيانات EGX: مشاكل لقينا\n` + findings.map(x => '• ' + x).join('\n') + `\n(تشغيل تلقائي الأحد 9 صباحاً — راجع قبل مسح السوق)`;
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text })
        });
        console.log('telegram alert sent: ' + res.status);
      } catch (e) { console.log('telegram alert failed: ' + e.message); }
    } else console.log('(telegram keys missing - alert not sent)');
  }
  await p.end();
  process.exit(findings.length ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
