/**
 * Feature Store: cache computed features keyed by (entity, feature, version, timestamp bucket).
 */

export interface FeatureKey {
  entity: string; // e.g. symbol
  feature: string; // e.g. "rsi_14"
  version: string; // schema version
  bucket: string; // time bucket, e.g. "2026-06-02T12:00"
}

export interface CachedFeature {
  value: number | number[] | Record<string, number>;
  computedAt: number;
  ttlMs: number;
}

function keyToString(k: FeatureKey): string {
  return `${k.entity}::${k.feature}::${k.version}::${k.bucket}`;
}

export class FeatureStore {
  private store = new Map<string, CachedFeature>();
  private hits = 0;
  private misses = 0;
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  get(key: FeatureKey): CachedFeature["value"] | null {
    const k = keyToString(key);
    const cached = this.store.get(k);
    if (!cached) {
      this.misses++;
      return null;
    }
    if (Date.now() - cached.computedAt > cached.ttlMs) {
      this.store.delete(k);
      this.misses++;
      return null;
    }
    this.hits++;
    return cached.value;
  }

  set(key: FeatureKey, value: CachedFeature["value"], ttlMs: number = 300000): void {
    if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value as string | undefined;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(keyToString(key), { value, computedAt: Date.now(), ttlMs });
  }

  async getOrCompute(
    key: FeatureKey,
    compute: () => Promise<CachedFeature["value"]>,
    ttlMs: number = 300000,
  ): Promise<CachedFeature["value"]> {
    const cached = this.get(key);
    if (cached !== null) return cached;
    const value = await compute();
    this.set(key, value, ttlMs);
    return value;
  }

  stats() {
    const total = this.hits + this.misses;
    return { hits: this.hits, misses: this.misses, hitRate: total === 0 ? 0 : this.hits / total, size: this.store.size };
  }

  invalidate(prefix?: string): number {
    if (!prefix) {
      const size = this.store.size;
      this.store.clear();
      return size;
    }
    let count = 0;
    for (const k of Array.from(this.store.keys())) {
      if (k.startsWith(prefix)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }
}

export const globalFeatureStore = new FeatureStore(10000);