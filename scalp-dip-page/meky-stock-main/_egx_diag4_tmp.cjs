'use strict';
const fs = require('fs');
const env = {};
for (const l of fs.readFileSync('D:/meky-stock-main/meky-stock-main/.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^"|"$/g, '');
}
const { Pool } = require('pg');
const p = new Pool({ connectionString: env.DATABASE_URL });
(async () => {
  console.log('=== thunder_auth_events last 30h ===');
  const q1 = await p.query(`SELECT ts AT TIME ZONE 'Africa/Cairo' t, kind, url, message, client_id FROM thunder_auth_events WHERE ts > now() - interval '30 hours' ORDER BY ts DESC LIMIT 15`);
  for (const r of q1.rows) console.log(' ', r.t.toISOString?.() || r.t, '|', r.kind, '|', (r.message||'').slice(0,80), '|', (r.client_id||'').slice(0,12));

  console.log('\n=== extension_diag last rows today ===');
  const q2 = await p.query(`SELECT ts AT TIME ZONE 'Africa/Cairo' t, client_id, symbol, visibility_state, audio_paused, depth_count_30s, last_depth_age_ms FROM extension_diag WHERE ts > now() - interval '30 hours' ORDER BY ts DESC LIMIT 10`);
  for (const r of q2.rows) console.log(' ', r.t.toISOString?.() || r.t, r.client_id?.slice(0,10), r.symbol, 'vis=' + r.visibility_state, 'muted=' + r.audio_paused, 'depth30s=' + r.depth_count_30s, 'depthAge=' + r.last_depth_age_ms);

  console.log('\n=== extension_tab_telemetry last rows today ===');
  const q3 = await p.query(`SELECT ts AT TIME ZONE 'Africa/Cairo' t, client_id, symbol, visibility_state, panel_state, panel_reason, ac_state, ac_resume_attempts, ac_resume_ok, snapshots_sent, last_snapshot_age_sec FROM extension_tab_telemetry WHERE ts > now() - interval '30 hours' ORDER BY ts DESC LIMIT 10`);
  for (const r of q3.rows) console.log(' ', r.t.toISOString?.() || r.t, r.symbol, 'vis=' + r.visibility_state, 'panel=' + r.panel_state + '/' + r.panel_reason, 'ac=' + r.ac_state + '(' + r.ac_resume_attempts + '/' + r.ac_resume_ok + ')', 'snaps=' + r.snapshots_sent, 'snapAge=' + r.last_snapshot_age_sec);

  console.log('\n=== thunder_auth_events by kind today ===');
  const q4 = await p.query(`SELECT kind, count(*) c, max(ts) AT TIME ZONE 'Africa/Cairo' last FROM thunder_auth_events WHERE ts > now() - interval '30 hours' GROUP BY 1 ORDER BY c DESC`);
  for (const r of q4.rows) console.log(' ', r.kind, r.c, r.last?.toISOString?.() || r.last);
  await p.end();
})().catch(e => { console.error('FATAL', e.message); process.exit(1); });
