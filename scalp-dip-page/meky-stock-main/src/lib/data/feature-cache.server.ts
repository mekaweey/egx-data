// In-memory feature cache (per request)
type CacheEntry = { value: unknown; expiresAt: number };
const cache = new Map<string, CacheEntry>();

export function cacheGet<T>(key: string): T | null {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() > e.expiresAt) { cache.delete(key); return null; }
  return e.value as T;
}

export function cacheSet<T>(key: string, value: T, ttlSec = 300): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlSec * 1000 });
}

export function cacheClear(prefix?: string): void {
  if (!prefix) { cache.clear(); return; }
  for (const k of cache.keys()) if (k.startsWith(prefix)) cache.delete(k);
}

export async function memoizeFeature<T>(key: string, ttlSec: number, fn: () => Promise<T>): Promise<T> {
  const hit = cacheGet<T>(key);
  if (hit !== null) return hit;
  const v = await fn();
  cacheSet(key, v, ttlSec);
  return v;
}
