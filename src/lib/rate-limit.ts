// Rate limiting middleware with in-memory store and Upstash Redis support
// Compatible with Vercel Edge Runtime

import { Redis } from '@upstash/redis';
import { cache } from './cache';

export interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyPrefix?: string;      // Prefix for rate limit keys
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  handler?: (req: Request) => Promise<Response> | Response;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export interface RateLimitResult {
  success: boolean;
  info: RateLimitInfo;
  headers: Record<string, string>;
}

// In-memory rate limit store (for edge/local)
class MemoryRateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || entry.resetTime < now) {
      const newEntry = { count: 1, resetTime: now + windowMs };
      this.store.set(key, newEntry);
      return newEntry;
    }
    
    entry.count++;
    return entry;
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key);
    if (!entry || entry.resetTime < Date.now()) {
      return null;
    }
    return entry;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Redis rate limit store (for production)
class RedisRateLimitStore {
  private client: Redis | null = null;

  constructor() {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    
    if (url && token) {
      this.client = new Redis({ url, token });
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    if (!this.client) throw new Error('Redis not configured');
    
    const now = Date.now();
    const resetTime = now + windowMs;
    const windowSec = Math.ceil(windowMs / 1000);
    
    // Use INCR with EXPIRE for atomic increment
    const count = await this.client.incr(key);
    
    if (count === 1) {
      await this.client.expire(key, windowSec);
    }
    
    return { count, resetTime };
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    if (!this.client) return null;
    
    const count = await this.client.get(key);
    if (!count) return null;
    
    // We can't get TTL easily in Upstash, estimate
    return { count: parseInt(count as string), resetTime: Date.now() + 60000 };
  }

  async reset(key: string): Promise<void> {
    if (!this.client) return;
    await this.client.del(key);
  }

  isAvailable(): boolean {
    return this.client !== null;
  }
}

// Unified rate limiter
export class RateLimiter {
  private memory = new MemoryRateLimitStore();
  private redis = new RedisRateLimitStore();
  private useRedis = false;
  private defaultConfig: Required<RateLimitConfig>;

  constructor(defaultConfig: Partial<RateLimitConfig> = {}) {
    this.defaultConfig = {
      windowMs: defaultConfig.windowMs || 60000,        // 1 minute
      maxRequests: defaultConfig.maxRequests || 100,    // 100 requests
      keyPrefix: defaultConfig.keyPrefix || 'rl',
      skipSuccessfulRequests: defaultConfig.skipSuccessfulRequests || false,
      skipFailedRequests: defaultConfig.skipFailedRequests || false,
      handler: defaultConfig.handler
    };
    
    this.useRedis = this.redis.isAvailable();
    if (this.useRedis) {
      console.log('[RateLimit] Using Upstash Redis');
    } else {
      console.log('[RateLimit] Using in-memory store');
    }
  }

  private getKey(identifier: string, prefix?: string): string {
    return `${prefix || this.defaultConfig.keyPrefix}:${identifier}`;
  }

  async check(identifier: string, config?: Partial<RateLimitConfig>): Promise<RateLimitResult> {
    const mergedConfig = { ...this.defaultConfig, ...config };
    const key = this.getKey(identifier, mergedConfig.keyPrefix);
    
    try {
      // Try memory first (fastest)
      let result = await this.memory.increment(key, mergedConfig.windowMs);
      
      // Also check Redis if available
      if (this.useRedis) {
        try {
          const redisResult = await this.redis.increment(key, mergedConfig.windowMs);
          // Use the higher count (more accurate)
          if (redisResult.count > result.count) {
            result = redisResult;
          }
        } catch (e) {
          console.warn('[RateLimit] Redis increment failed:', e);
        }
      }
      
      const remaining = Math.max(0, mergedConfig.maxRequests - result.count);
      const resetTime = result.resetTime;
      const retryAfter = remaining === 0 ? Math.ceil((resetTime - Date.now()) / 1000) : undefined;
      
      const headers: Record<string, string> = {
        'X-RateLimit-Limit': String(mergedConfig.maxRequests),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(Math.ceil(resetTime / 1000))
      };
      
      if (retryAfter !== undefined) {
        headers['Retry-After'] = String(retryAfter);
      }
      
      return {
        success: remaining > 0,
        info: {
          limit: mergedConfig.maxRequests,
          remaining,
          resetTime,
          retryAfter
        },
        headers
      };
    } catch (e) {
      console.error('[RateLimit] Check failed:', e);
      // Fail open - allow request if rate limiter fails
      return {
        success: true,
        info: {
          limit: mergedConfig.maxRequests,
          remaining: mergedConfig.maxRequests,
          resetTime: Date.now() + mergedConfig.windowMs
        },
        headers: {}
      };
    }
  }

  async reset(identifier: string, prefix?: string): Promise<void> {
    const key = this.getKey(identifier, prefix);
    await this.memory.reset(key);
    if (this.useRedis) {
      try {
        await this.redis.reset(key);
      } catch (e) {
        console.warn('[RateLimit] Redis reset failed:', e);
      }
    }
  }

  getConfig(): Required<RateLimitConfig> {
    return { ...this.defaultConfig };
  }
}

// Pre-configured limiters for different endpoint types
export const limiters = {
  // Strict: 10 requests/minute for AI generation
  aiGeneration: new RateLimiter({
    windowMs: 60000,
    maxRequests: 10,
    keyPrefix: 'rl:ai'
  }),
  
  // Moderate: 30 requests/minute for analysis
  analysis: new RateLimiter({
    windowMs: 60000,
    maxRequests: 30,
    keyPrefix: 'rl:analysis'
  }),
  
  // Lenient: 100 requests/minute for reads
  read: new RateLimiter({
    windowMs: 60000,
    maxRequests: 100,
    keyPrefix: 'rl:read'
  }),
  
  // Strict: 5 requests/minute for security scans
  security: new RateLimiter({
    windowMs: 60000,
    maxRequests: 5,
    keyPrefix: 'rl:security'
  }),
  
  // Webhook: 20 requests/minute
  webhook: new RateLimiter({
    windowMs: 60000,
    maxRequests: 20,
    keyPrefix: 'rl:webhook'
  })
};

// Middleware helper for Next.js API routes
export function createRateLimitMiddleware(limiter: RateLimiter) {
  return async (req: Request): Promise<{ success: boolean; headers: Record<string, string>; info: RateLimitInfo } | null> => {
    // Extract identifier (IP + User-Agent for better granularity)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const identifier = `${ip}:${Buffer.from(userAgent).toString('base64url').slice(0, 16)}`;
    
    const result = await limiter.check(identifier);
    
    if (!result.success) {
      return result;
    }
    
    return null; // Continue
  };
}

// Helper to add rate limit headers to response
export function addRateLimitHeaders(response: Response, result: RateLimitResult): Response {
  const headers = new Headers(response.headers);
  Object.entries(result.headers).forEach(([key, value]) => {
    headers.set(key, value);
  });
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}