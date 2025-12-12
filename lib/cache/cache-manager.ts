import { kv } from '@vercel/kv';
import type { CacheEntry } from '../utils/types.js';

// Cache TTLs in seconds (optimized for cost)
export const CACHE_TTL = {
  RESORT_CONDITIONS: 45 * 60,  // 45 minutes
  FORECAST: 3 * 60 * 60,       // 3 hours
  FIND_BEST: 2 * 60 * 60,      // 2 hours
} as const;

export class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>>;

  constructor() {
    // In-memory cache for serverless instance (ephemeral but fast)
    this.memoryCache = new Map();
  }

  async get<T>(key: string): Promise<T | null> {
    // Check memory cache first (ultra-fast for popular queries within same instance)
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      console.log(`[Cache] Memory HIT: ${key}`);
      return memEntry.data as T;
    }

    // Check distributed cache (Vercel KV)
    try {
      const kvEntry = await kv.get<CacheEntry<T>>(key);
      if (kvEntry && !this.isExpired(kvEntry)) {
        console.log(`[Cache] KV HIT: ${key}`);
        // Store in memory for future requests in this instance
        this.memoryCache.set(key, kvEntry);
        return kvEntry.data;
      }
    } catch (error) {
      console.error(`[Cache] KV error for ${key}:`, error);
      // Fall through to return null
    }

    console.log(`[Cache] MISS: ${key}`);
    return null;
  }

  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in distributed cache
    try {
      await kv.set(key, entry, { ex: ttl });
      console.log(`[Cache] SET: ${key} (TTL: ${ttl}s)`);
    } catch (error) {
      console.error(`[Cache] Failed to set ${key}:`, error);
      // Don't throw - memory cache will work for this instance
    }
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    try {
      await kv.del(key);
      console.log(`[Cache] DELETE: ${key}`);
    } catch (error) {
      console.error(`[Cache] Failed to delete ${key}:`, error);
    }
  }

  async getOrFetch<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    // Try cache first
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Cache miss - fetch fresh data
    console.log(`[Cache] Fetching fresh data for: ${key}`);
    const data = await fetchFn();

    // Store in cache
    await this.set(key, data, ttl);

    return data;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    const age = Date.now() - entry.timestamp;
    return age > entry.ttl * 1000;
  }

  clearMemoryCache(): void {
    this.memoryCache.clear();
    console.log('[Cache] Memory cache cleared');
  }

  // Generate cache keys
  static resortKey(resortName: string): string {
    const slug = resortName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `resort:${slug}:conditions`;
  }

  static forecastKey(location: string | { lat: number; lon: number }): string {
    if (typeof location === 'string') {
      const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `forecast:${slug}`;
    }
    return `forecast:${location.lat.toFixed(2)},${location.lon.toFixed(2)}`;
  }

  static findBestKey(region?: string, radius?: { center: { lat: number; lon: number }; miles: number }): string {
    if (radius) {
      return `best:${radius.center.lat.toFixed(2)},${radius.center.lon.toFixed(2)}:${radius.miles}mi`;
    }
    if (region) {
      const slug = region.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return `best:${slug}`;
    }
    return 'best:world';
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}
