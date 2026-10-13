/**
 * Module Health Tracker
 * --------------------------------------------------------------------------
 * Tracks success / failure / skip for every module called by the auto
 * orchestrator so we can immediately see what's broken without digging
 * through logs. Use `runModule(name, fn)` instead of bare try/catch.
 */

export type ModuleStatus = "ok" | "error" | "skipped" | "unknown";

export interface ModuleHealth {
  name: string;
  status: ModuleStatus;
  lastRunAt: number;
  lastDurationMs: number;
  totalRuns: number;
  successCount: number;
  errorCount: number;
  skipCount: number;
  consecutiveErrors: number;
  lastError?: string;
  lastErrorAt?: number;
  disabled: boolean;
}

const registry = new Map<string, ModuleHealth>();
/** Auto-disable a module after this many consecutive failures. */
const DISABLE_THRESHOLD = 5;

function ensure(name: string): ModuleHealth {
  let h = registry.get(name);
  if (!h) {
    h = {
      name,
      status: "unknown",
      lastRunAt: 0,
      lastDurationMs: 0,
      totalRuns: 0,
      successCount: 0,
      errorCount: 0,
      skipCount: 0,
      consecutiveErrors: 0,
      disabled: false,
    };
    registry.set(name, h);
  }
  return h;
}

/**
 * Wrap a module call. If `fn` returns `undefined` the module is treated as
 * skipped (preconditions not met). Any thrown error is recorded but never
 * re-thrown — the scan must never break.
 */
export function runModule<T>(name: string, fn: () => T | undefined): T | undefined {
  const h = ensure(name);
  if (h.disabled) {
    h.skipCount++;
    h.totalRuns++;
    h.status = "skipped";
    h.lastRunAt = Date.now();
    return undefined;
  }
  const start = Date.now();
  try {
    const result = fn();
    h.lastDurationMs = Date.now() - start;
    h.lastRunAt = Date.now();
    h.totalRuns++;
    if (result === undefined) {
      h.skipCount++;
      h.status = "skipped";
    } else {
      h.successCount++;
      h.consecutiveErrors = 0;
      h.status = "ok";
    }
    return result;
  } catch (err) {
    h.lastDurationMs = Date.now() - start;
    h.lastRunAt = Date.now();
    h.totalRuns++;
    h.errorCount++;
    h.consecutiveErrors++;
    h.status = "error";
    h.lastError = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    h.lastErrorAt = Date.now();
    if (h.consecutiveErrors >= DISABLE_THRESHOLD) {
      h.disabled = true;
    }
    // eslint-disable-next-line no-console
    console.error(`[module-health] ${name} failed:`, h.lastError);
    return undefined;
  }
}

export function getAllHealth(): ModuleHealth[] {
  return Array.from(registry.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getHealthSummary() {
  const all = getAllHealth();
  return {
    total: all.length,
    ok: all.filter((h) => h.status === "ok").length,
    error: all.filter((h) => h.status === "error").length,
    skipped: all.filter((h) => h.status === "skipped").length,
    disabled: all.filter((h) => h.disabled).length,
    modules: all,
  };
}

/** Manually re-enable a module that was auto-disabled. */
export function resetModule(name: string): boolean {
  const h = registry.get(name);
  if (!h) return false;
  h.disabled = false;
  h.consecutiveErrors = 0;
  h.lastError = undefined;
  h.lastErrorAt = undefined;
  h.status = "unknown";
  return true;
}

export function resetAllModules(): number {
  let n = 0;
  for (const h of registry.values()) {
    if (h.disabled || h.errorCount > 0) {
      h.disabled = false;
      h.consecutiveErrors = 0;
      h.lastError = undefined;
      h.lastErrorAt = undefined;
      h.status = "unknown";
      n++;
    }
  }
  return n;
}