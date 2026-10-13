#!/usr/bin/env node
// prod-server.cjs — LIGHT production runner for the built site.
// Runs `.output/server/index.mjs` (nitro) on PORT 8090 with:
//   - .env loaded into process.env (parity with `vite dev`)
//   - duplicate-server guard (exit if the port is already served)
//   - restart-on-crash + 3-strikes health monitor (same as dev-server.cjs)
// Replaces the heavy `vite dev` (≈600MB RAM, ~20% CPU) for always-on use.
// ASCII ONLY.
'use strict';

const { spawn, execFile } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 8090;
const SERVER_ENTRY = path.join(PROJECT_ROOT, '.output', 'server', 'index.mjs');
const RESTART_DELAY_MS = 2000;
const MAX_RESTARTS = 200;
const HEALTH_INTERVAL_MS = 30000;
const STARTUP_TIMEOUT_MS = 60000;

let child = null;
let healthMonitor = null;
let healthFailures = 0;
let restartCount = 0;
let shuttingDown = false;

function log(msg) {
  try { console.log(new Date().toISOString() + ' [prod-safe] ' + msg); } catch (e) {}
}

function loadEnv() {
  try {
    const text = fs.readFileSync(path.join(PROJECT_ROOT, '.env'), 'utf8');
    for (const l of text.split('\n')) {
      const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
      if (m && process.env[m[1]] === undefined) {
        process.env[m[1]] = m[2].replace(/^"(.*)"$/, '$1');
      }
    }
  } catch (e) { log('no .env loaded: ' + e.message); }
}

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.request({ host: 'localhost', port: PORT, path: '/', method: 'HEAD', timeout: 30000 }, (r) => { r.resume(); resolve(true); });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
    req.end();
  });
}

function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try { execSync('taskkill /PID ' + pid + ' /T /F', { stdio: 'ignore' }); return; } catch (e) {}
  }
  try { child && child.kill(); } catch (e) {}
}

function start() {
  restartCount++;
  if (restartCount > MAX_RESTARTS) { log('max restarts reached — giving up'); process.exit(1); }
  log('starting production server … (attempt ' + restartCount + ')');
  if (healthMonitor) clearInterval(healthMonitor);
  healthMonitor = null;
  healthFailures = 0;

  // child stdio -> FILE: if this wrapper ever dies, a pipe full of logs
  // would deadlock the detached child (listens but never responds).
  const logDir = path.join(PROJECT_ROOT, 'logs');
  try { fs.mkdirSync(logDir, { recursive: true }); } catch (e) {}
  const logFd = fs.openSync(path.join(logDir, 'prod-server-child.log'), 'a');
  child = spawn(process.execPath, [SERVER_ENTRY], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', logFd, logFd],
    shell: false,
    detached: true,
    env: { ...process.env, PORT: String(PORT) },
  });

  waitForServerReady().then((ready) => {
    if (ready && !shuttingDown) {
      log('✓ production server ready on http://localhost:' + PORT + '/');
      startHealthMonitor();
    } else if (!shuttingDown) {
      log('not responding within ' + (STARTUP_TIMEOUT_MS / 1000) + 's — health monitor will retry');
      startHealthMonitor();
    }
  });

  child.on('exit', (code) => {
    if (child === null) return;
    child = null;
    if (shuttingDown) process.exit(code ?? 0);
    log('server exited (code ' + code + ') — restarting in ' + RESTART_DELAY_MS + 'ms');
    setTimeout(() => { if (!shuttingDown) start(); }, RESTART_DELAY_MS);
  });
}

async function waitForServerReady() {
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  while (Date.now() < deadline && !shuttingDown) {
    await new Promise((r) => setTimeout(r, 1000));
    if (await checkHealth()) return true;
  }
  return false;
}

function startHealthMonitor() {
  healthMonitor = setInterval(async () => {
    if (shuttingDown) return;
    const ok = await checkHealth();
    if (ok) { healthFailures = 0; return; }
    healthFailures++;
    log('health check missed (' + healthFailures + '/3) on port ' + PORT);
    if (healthFailures >= 3) {
      log('killing unresponsive tree and restarting');
      killTree(child && child.pid);
    }
  }, HEALTH_INTERVAL_MS);
}

const execSync = require('child_process').execSync;

(async () => {
  loadEnv();
  // duplicate-server guard: if something already serves the port, exit —
  // the watchdog re-invokes this wrapper when the port frees up.
  if (await checkHealth()) {
    log('Port ' + PORT + ' is already served — NOT spawning a duplicate server. Exiting.');
    process.exit(0);
  }
  if (!fs.existsSync(SERVER_ENTRY)) {
    log('MISSING ' + SERVER_ENTRY + ' — run `npm run build` first.');
    process.exit(1);
  }
  process.on('SIGINT', () => { shuttingDown = true; killTree(child && child.pid); process.exit(0); });
  process.on('SIGTERM', () => { shuttingDown = true; killTree(child && child.pid); process.exit(0); });
  start();
})();
