#!/usr/bin/env node
/**
 * Kill the Vite dev server that was launched by dev-server.cjs / dev-safe.bat.
 *
 * Strategy:
 *   1. Find the wrapper process (node.exe running dev-server.cjs)
 *   2. Send SIGTERM to the wrapper — the wrapper's SIGTERM handler sets
 *      shuttingDown=true, kills its child shell, and exits gracefully.
 *   3. Fall back to killing the Vite process directly on PORT if no
 *      wrapper was found.
 *
 * This avoids the race where the health monitor (or the exit handler)
 * restarts Vite after dev:stop kills only the Vite process.
 *
 * USAGE:    node scripts/dev-stop.cjs   (or `npm run dev:stop`)
 */
'use strict';

const { execSync } = require('child_process');
const PORT = process.env.PORT || 8080;

let killed = false;

/**
 * Find PIDs of node.exe processes whose command line contains 'dev-server.cjs'.
 * Uses PowerShell Get-CimInstance (wmic is deprecated on Windows 10+).
 */
function findWrapperPids() {
  try {
    const out = execSync(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like '*dev-server.cjs*' } | ForEach-Object { $_.ProcessId }"`,
      { encoding: 'utf8', timeout: 5000 },
    );
    return out
      .trim()
      .split('\n')
      .map((p) => p.trim())
      .filter((p) => /^\d+$/.test(p))
      .map((p) => parseInt(p, 10));
  } catch {
    return [];
  }
}

/**
 * Find PIDs listening on the given port (returns the raw PID list).
 */
function findPidsOnPort(port) {
  try {
    // `netstat -ano` shows PID in the last column
    const out = execSync(
      `netstat -ano -p tcp | findstr ":${port} " | findstr "LISTENING"`,
      { encoding: 'utf8', timeout: 5000 },
    );
    // Each line: TCP  0.0.0.0:8080  0.0.0.0:0  LISTENING  1234
    return out
      .split('\n')
      .map((l) => l.trim().split(/\s+/).pop())
      .filter((p) => p && /^\d+$/.test(p))
      .map((p) => parseInt(p, 10));
  } catch {
    return [];
  }
}

function killPid(pid, signal) {
  try {
    process.kill(pid, signal);
    return true;
  } catch (e) {
    // already dead or access denied
    return false;
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const wrapperPids = findWrapperPids();
  const portPids = findPidsOnPort(PORT);
  const allPids = [...new Set([...wrapperPids, ...portPids])];

  if (allPids.length === 0) {
    console.log(`[dev-stop] No process found on port ${PORT} or dev-server.cjs wrapper.`);
    process.exit(0);
  }

  // 1. Kill wrapper first (preferred) — the wrapper's SIGTERM handler
  //    sets shuttingDown=true, kills its child shell, and exits cleanly.
  //    This prevents the health monitor from restarting Vite.
  for (const pid of wrapperPids) {
    console.log(`[dev-stop] Sending SIGTERM to wrapper PID ${pid}`);
    if (killPid(pid, 'SIGTERM')) killed = true;
  }

  // 2. Also SIGTERM any lingering Vite process on the port
  //    (in case there's no wrapper, or the wrapper already died).
  for (const pid of portPids) {
    if (wrapperPids.includes(pid)) continue;
    console.log(`[dev-stop] Sending SIGTERM to Vite PID ${pid} (port ${PORT})`);
    if (killPid(pid, 'SIGTERM')) killed = true;
  }

  // 3. Wait up to 5 s for graceful shutdown, then force-kill.
  await sleep(5000);

  for (const pid of allPids) {
    try {
      process.kill(pid, 'SIGKILL');
      console.log(`[dev-stop] Force-killed PID ${pid}`);
    } catch {
      /* already dead */
    }
  }

  if (killed) console.log('[dev-stop] Done.');
  process.exit(0);
}

main();
