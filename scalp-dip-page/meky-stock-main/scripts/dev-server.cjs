#!/usr/bin/env node
/**
 * Auto-restart + health-monitor wrapper for the Vite dev server.
 *
 * PROBLEM:  `vite dev` occasionally crashes — SSR errors, OOM on large
 *           exports, HMR instability, or file-watch issues. When it dies
 *           the browser shows "This site can't be reached · localhost
 *           refused to connect" and the dev must manually re-run the
 *           dev script.
 *
 * SOLUTION: Spawn the Vite binary directly and restart it on crash.
 *           A health-check monitor also kills + restarts the child if
 *           it is running but not responding (deadlock / port conflict).
 *
 * KEY IMPROVEMENTS (v2):
 *   - `detached: true` + piped stdio → Vite survives the parent terminal
 *     closing (no more "localhost refused to connect" just because a PS /
 *     VS Code terminal was closed).
 *   - Health-check monitor polls marketwatch-health every 5 s.
 *   - Startup readiness check waits for the server to respond before
 *     announcing "ready".
 *   - Last-N-lines-of-stderr capture before a crash for debugging.
 *
 * USAGE:    node scripts/dev-server.cjs  (or `npm run dev:safe`)
 *
 * ZERO DOWNSIDES vs. plain `vite dev`:
 *   - Same Vite binary, same config, same port, same HMR.
 *   - Only kicks in when the old process dies.
 *   - --max-old-space-size=4096 raises the memory ceiling to stop OOM
 *     crashes that the history-export (176 k+ rows) can trigger.
 */
'use strict';

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const VITE_BIN = path.join(
  PROJECT_ROOT,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'vite.cmd' : 'vite',
);

const RESTART_DELAY_MS = 1000;
const MAX_RESTARTS = 200;
const HEALTH_CHECK_INTERVAL_MS = 30_000;
const STARTUP_TIMEOUT_MS = 60_000;
// Use a lightweight HEAD / request instead of a heavy Supabase-querying
// route. The previous /api/public/hooks/marketwatch-health path runs
// real database queries on every hit, so under concurrent load (the
// 176k-row export + health monitor + browser polls) it could respond
// slowly enough to be mistaken for a hang, causing the wrapper to
// kill and restart Vite mid-request, which dropped in-flight
// export requests with ECONNRESET. HEAD / is constant-time.
const HEALTH_PATH = '/';
const HEALTH_METHOD = 'HEAD';
const PORT = process.env.PORT || 8090;

let restartCount = 0;
let child = null;
let shuttingDown = false;
let healthRestart = false; // set true by health monitor before kill() → exit handler restarts instead of quitting
let lastStderrLines = [];
let healthMonitor = null;
let healthFailures = 0; // consecutive missed health probes; 3 in a row (~90s) triggers restart

function log(msg) {
  process.stdout.write('[dev-safe] ' + msg + '\n');
}

// ── Health check ──────────────────────────────────────────────────
function checkHealth() {
  return new Promise((resolve) => {
    const req = http.request(
      {
        host: 'localhost',
        port: PORT,
        path: HEALTH_PATH,
        method: HEALTH_METHOD,
        timeout: 30_000, // generous: during big exports the event loop can be busy for tens of seconds
      },
      (res) => {
        // Any 2xx or 3xx means the server is alive and routing requests.
        // We accept 404 too because HEAD on `/` may not be defined as a
        // route — what matters is that the connection succeeded and the
        // server returned a real HTTP response (not a TCP hang).
        const ok = res.statusCode >= 200 && res.statusCode < 500;
        resolve(ok);
        res.resume();
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.end();
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

// Kill the WHOLE process tree, not just the shell child. Vite is spawned via
// `shell: true`, so `child` is a cmd.exe whose GRANDCHILD is the real Vite
// node process. child.kill() only killed the shell — the Vite grandchild kept
// running (zombie), grabbed port 8080, and confused every later health check
// (35+ zombies accumulated today). On Windows, `taskkill /PID <pid> /T /F`
// kills the entire tree reliably.
function killTree(pid) {
  if (!pid) return;
  if (process.platform === 'win32') {
    try {
      require('child_process').execSync(`taskkill /PID ${pid} /T /F`, { stdio: 'ignore' });
      return;
    } catch (e) { /* tree may already be dead — fall through */ }
  }
  try { child && child.kill(); } catch (e) { /* already dead */ }
}

// ── Health monitor (polls every HEALTH_CHECK_INTERVAL_MS) ─────────
function startHealthMonitor() {
  if (healthMonitor) clearInterval(healthMonitor);
  healthMonitor = setInterval(async () => {
    if (shuttingDown || !child || child.killed) return;
    const ok = await checkHealth();
    if (!ok) {
      // Do NOT kill on a single missed probe: during heavy exports the dev
      // server's event loop can be busy for tens of seconds, which is NOT a
      // hang. Require 3 consecutive failures (~90s) before restarting, so a
      // long export request is never cut in half (that ECONNRESET was exactly
      // the browser's "Failed to fetch").
      healthFailures = (healthFailures || 0) + 1;
      log('Health check missed (' + healthFailures + '/3) — server not responding on port ' + PORT + '.');
      if (healthFailures < 3) return;
      log('Health check failed 3x in a row — restarting…');
      healthRestart = true; // signal the exit handler to restart, not quit
      killTree(child.pid); // kill the FULL tree (shell + Vite grandchild) — no zombies
    } else {
      healthFailures = 0;
    }
  }, HEALTH_CHECK_INTERVAL_MS);
}

// ── Spawn Vite ────────────────────────────────────────────────────
function start() {
  restartCount++;
  const attempt = restartCount;
  log('Starting Vite dev server … (attempt ' + attempt + ')');

  // Clear any health monitor from the previous attempt to prevent it
  // from killing the new child before it has a chance to start up.
  if (healthMonitor) clearInterval(healthMonitor);
  healthMonitor = null;
  healthFailures = 0; // fresh start: no failures carried over from the previous run

  child = spawn(VITE_BIN, ['dev'], {
    cwd: PROJECT_ROOT,
    // piped stdio so we can forward output AND detach from the parent
    // terminal's console handle (critical on Windows so the child
    // survives terminal close).
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    detached: true, // ← child survives parent terminal close
    env: {
      ...process.env,
      PORT,
      NODE_OPTIONS:
        '--max-old-space-size=4096 ' + (process.env.NODE_OPTIONS || '').trim(),
    },
  });

  // Forward child stdout/stderr to our terminal.
  child.stdout.on('data', (data) => {
    lastStderrLines.push(data.toString());
    if (lastStderrLines.length > 50) lastStderrLines.shift();
    process.stdout.write(data);
  });
  child.stderr.on('data', (data) => {
    lastStderrLines.push(data.toString());
    if (lastStderrLines.length > 50) lastStderrLines.shift();
    process.stderr.write(data);
  });
  // NOTE: we deliberately do NOT call child.unref() here —
  // the child's stdio pipes keep the wrapper's event loop
  // alive so it can listen for 'exit' and restart Vite on
  // crash. `detached: true` above already puts Vite in its
  // own process group, so Vite survives when the wrapper is
  // killed (e.g. terminal closed).

  // Wait for the server to be ready.
  waitForServerReady().then((ready) => {
    if (ready && !shuttingDown) {
      log('✓ Server is ready and responding on http://localhost:' + PORT + '/');
      startHealthMonitor();
    } else if (!shuttingDown) {
      log('Server did not respond within ' + (STARTUP_TIMEOUT_MS / 1000) + 's — it may still be starting up. Health monitor will retry.');
      startHealthMonitor();
    }
  });

  child.on('exit', (code, signal) => {
    if (child === null) return;
    child = null;

        if (shuttingDown) {
      process.exit(code ?? 0);
    }

    // Health monitor initiated the kill — restart, don't exit.
    if (!healthRestart && (signal === 'SIGINT' || signal === 'SIGTERM')) {
      log('Vite stopped. Goodbye.');
      process.exit(0);
    }

    if (!healthRestart && code === 0) {
      log('Vite exited cleanly. Not restarting.');
      process.exit(0);
    }

        healthRestart = false;

    // Clear health monitor before restart — start() will create a fresh one
    // after the new child is ready.
    if (healthMonitor) clearInterval(healthMonitor);
    healthMonitor = null;

    // Print last few lines of output for debugging.
    if (lastStderrLines.length > 0) {
      log('--- last output before crash ---');
      lastStderrLines.slice(-10).forEach((l) => process.stderr.write(l));
      log('--- end ---');
    }

    if (attempt >= MAX_RESTARTS) {
      log.error('Vite has crashed ' + MAX_RESTARTS + ' times. Giving up.');
      process.exit(code ?? 1);
    }

    const reason = signal ? 'signal ' + signal : 'exit ' + code;
    log('❌ Vite crashed (' + reason + '). Restarting in ' + (RESTART_DELAY_MS / 1000) + 's …');
    setTimeout(start, RESTART_DELAY_MS);
  });
}

// ── Graceful shutdown ─────────────────────────────────────────────
process.on('SIGINT', () => {
  shuttingDown = true;
  killTree(child && child.pid);
  process.exit(0);
});
process.on('SIGTERM', () => {
  shuttingDown = true;
  killTree(child && child.pid);
  process.exit(0);
});

// Pre-spawn guard: if something else already serves the port, exit instead of
// spawning a doomed vite ("Port already in use" → 1s restart loop → window
// flood, 2026-09-29). The watchdog re-invokes this wrapper when the port
// frees up, so exiting is always safe.
async function isPortAlreadyServed() {
  return new Promise((resolve) => {
    const req = http.get({ host: 'localhost', port: PORT, path: '/', method: 'HEAD', timeout: 4000 }, (r) => { r.resume(); resolve(true); });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}
(async () => {
  if (await isPortAlreadyServed()) {
    log('Port ' + PORT + ' is already served — NOT spawning a duplicate server. Exiting.');
    process.exit(0);
  }
  start();
})();
