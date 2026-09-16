/**
 * Lightweight in-memory client-side data cache and in-flight request deduplicator.
 * Prevents duplicate simultaneous requests and eliminates redundant network round-trips
 * during tab switches and component remounts.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inflightRequests = new Map<string, Promise<unknown>>();

export async function cachedFetch<T = any>(
  url: string,
  options?: RequestInit,
  ttlMs = 15000
): Promise<T> {
  // Only cache GET requests (or calls without method specified)
  const isGet = !options?.method || options.method.toUpperCase() === 'GET';
  if (!isGet) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP error ${res.status} for ${url}`);
    return res.json() as Promise<T>;
  }

  const cacheKey = url;
  const now = Date.now();

  // Check valid cache entry
  const cached = memoryCache.get(cacheKey);
  if (cached && now - cached.timestamp < ttlMs) {
    return cached.data as T;
  }

  // Check if an identical request is already in-flight
  if (inflightRequests.has(cacheKey)) {
    return inflightRequests.get(cacheKey) as Promise<T>;
  }

  // Create new request promise with deduplication
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP error ${res.status} for ${url}`);
      const data = (await res.json()) as T;
      memoryCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      inflightRequests.delete(cacheKey);
    }
  })();

  inflightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

export function invalidateCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}

export function clearCache(): void {
  memoryCache.clear();
  inflightRequests.clear();
}
