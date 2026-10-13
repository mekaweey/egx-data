import fs from "node:fs";
import path from "node:path";

/**
 * halal-list.server.ts — the Shariah-compliant whitelist (EGX).
 * Source: user-provided list from the islamicly screening (97 symbols),
 * stored in halal-symbols.txt at the project root. Update that file to
 * refresh the list (EGX re-rebalances its Shariah index twice a year).
 *
 * Audit Oct-4 batch 3 (A1): the old `catch {}` swallowed file errors into an
 * EMPTY set, which made isHalal() false for everything and the engine print
 * silent "no candidates". The file MUST be committed to git or production
 * (Render) scans blind. getHalalStatus() exposes path+count; the engine hard
 * stops below HALAL_MIN_COUNT.
 */

export const HALAL_EXPECTED_COUNT = 97;
export const HALAL_MIN_COUNT = 90;

let cached: Set<string> | null = null;
let cachedAt = 0;
let lastPath = "";
let lastError = "";

export function getHalalSet(): Set<string> {
  return getHalalStatus().set;
}

export function getHalalStatus(): { set: Set<string>; path: string; count: number; error: string } {
  const now = Date.now();
  if (cached && now - cachedAt < 5 * 60_000) {
    return { set: cached, path: lastPath, count: cached.size, error: lastError };
  }
  const set = new Set<string>();
  lastPath = path.join(process.cwd(), "halal-symbols.txt");
  lastError = "";
  try {
    const text = fs.readFileSync(lastPath, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim().toUpperCase();
      if (s) set.add(s);
    }
  } catch (e: any) {
    lastError = e?.message ?? "read failed";
  }
  cached = set;
  cachedAt = now;
  return { set, path: lastPath, count: set.size, error: lastError };
}

/** Audit Oct-4 batch 3 (A1): fail-closed whitelist validation. */
export function assertHalalSet(status: { count: number; error: string }): { ok: boolean; reason: string } {
  if (status.error) return { ok: false, reason: `halal-file-unreadable:${status.error}` };
  if (status.count < HALAL_MIN_COUNT) {
    return { ok: false, reason: `halal-too-small:${status.count}/${HALAL_EXPECTED_COUNT}` };
  }
  return { ok: true, reason: "ok" };
}

export function isHalal(symbol: string): boolean {
  return getHalalSet().has(String(symbol).trim().toUpperCase());
}
