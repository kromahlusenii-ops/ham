/**
 * Lightweight in-memory cache with TTL and prefix-based invalidation.
 * Runs on the server — one instance per Node.js process.
 */

const MAX_ENTRIES = 500;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

function evictIfFull() {
  if (store.size < MAX_ENTRIES) return;
  // Delete the oldest entry (first inserted)
  const firstKey = store.keys().next().value;
  if (firstKey) store.delete(firstKey);
}

export const serverCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttlSeconds: number): void {
    evictIfFull();
    store.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
  },

  /** Delete all keys that start with the given prefix. */
  invalidate(prefix: string): void {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  },

  /** Check if key exists and is not expired. */
  has(key: string): boolean {
    return this.get(key) !== null;
  },
};
