// Cache layer with in-memory fallback and optional Upstash Redis
// Works on Vercel Edge Runtime and Node.js

import { Redis } from '@upstash/redis';

export interface CacheOptions {
  ttl?: number; // seconds
  keyPrefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

// In-memory cache (fallback for edge/local)
class MemoryCache {
  private store = new Map<string, CacheEntry<any>>();
  private maxSize = 1000;
  private defaultTtl = 300; // 5 minutes

  set<T>(key: string, data: T, ttl = this.defaultTtl): void {
    if (this.store.size >= this.maxSize) {
      // Remove oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey) this.store.delete(firstKey);
    }
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
    // Auto-expire
    setTimeout(() => this.store.delete(key), ttl * 1000);
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    // Check TTL
    if (Date.now() - entry.timestamp > this.defaultTtl * 1000) {
      this.store.delete(key);
      return null;
    }
    
    entry.hits++;
    return entry.data;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  stats() {
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      keys: Array.from(this.store.keys())
    };
  }
}

// Redis cache (for production/Vercel)
class RedisCache {
  private client: Redis | null = null;
  private defaultTtl = 300;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (url && token) {
      this.client = new Redis({ url, token });
    }
  }

  async set<T>(key: string, data: T, ttl = this.defaultTtl): Promise<void> {
    if (!this.client) return;
    await this.client.setex(key, ttl, JSON.stringify(data));
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    const data = await this.client.get(key);
    return data ? JSON.parse(data as string) : null;
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    if (!this.client) return;
    // Note: Upstash doesn't support FLUSHDB directly
  }

  isAvailable(): boolean {
    return this.client !== null;
  }
}

// Unified cache interface
class UnifiedCache {
  private memory = new MemoryCache();
  private redis = new RedisCache();
  private useRedis = false;

  constructor() {
    this.useRedis = this.redis.isAvailable();
    if (this.useRedis) {
      console.log('[Cache] Using Upstash Redis');
    } else {
      console.log('[Cache] Using in-memory cache (set UPSTASH_REDIS_REST_URL/TOKEN for Redis)');
    }
  }

  private getKey(key: string, prefix = 'qa'): string {
    return `${prefix}:${key}`;
  }

  async set<T>(key: string, data: T, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.getKey(key, options.keyPrefix);
    const ttl = options.ttl || 300;
    
    // Always set in memory (fast)
    this.memory.set(fullKey, data, ttl);
    
    // Also set in Redis if available
    if (this.useRedis) {
      try {
        await this.redis.set(fullKey, data, ttl);
      } catch (e) {
        console.warn('[Cache] Redis set failed, using memory only:', e);
      }
    }
  }

  async get<T>(key: string, options: CacheOptions = {}): Promise<T | null> {
    const fullKey = this.getKey(key, options.keyPrefix);
    
    // Try memory first (fastest)
    const memResult = this.memory.get<T>(fullKey);
    if (memResult !== null) return memResult;
    
    // Fallback to Redis
    if (this.useRedis) {
      try {
        const redisResult = await this.redis.get<T>(fullKey);
        if (redisResult !== null) {
          // Populate memory for next time
          this.memory.set(fullKey, redisResult, options.ttl || 300);
          return redisResult;
        }
      } catch (e) {
        console.warn('[Cache] Redis get failed:', e);
      }
    }
    
    return null;
  }

  async delete(key: string, options: CacheOptions = {}): Promise<void> {
    const fullKey = this.getKey(key, options.keyPrefix);
    this.memory.delete(fullKey);
    if (this.useRedis) {
      try {
        await this.redis.delete(fullKey);
      } catch (e) {
        console.warn('[Cache] Redis delete failed:', e);
      }
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    // Memory: delete matching keys
    const prefix = pattern.split('*')[0];
    this.memory.stats().keys.forEach(k => {
      if (k.startsWith(prefix)) this.memory.delete(k);
    });
    
    // Redis: would need SCAN + DEL (not implemented in Upstash easily)
  }

  getStats() {
    return {
      memory: this.memory.stats(),
      redis: this.useRedis ? 'connected' : 'not configured'
    };
  }
}

// Singleton
export const cache = new UnifiedCache();

// Helper: Generate cache key from request
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sorted = Object.keys(params).sort().map(k => `${k}:${params[k]}`).join('|');
  return `${prefix}:${Buffer.from(sorted).toString('base64url')}`;
}

// Helper: Cache wrapper for async functions
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const cached = await cache.get<T>(key, options);
  if (cached !== null) return cached;
  
  const result = await fn();
  await cache.set(key, result, options);
  return result;
}