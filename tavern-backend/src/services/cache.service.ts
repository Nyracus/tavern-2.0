// src/services/cache.service.ts
import { redisClient, isRedisAvailable } from '../config/redis.config';

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
  tags?: string[]; // Cache tags for invalidation
}

export class CacheService {
  private readonly DEFAULT_TTL = 300; // 5 minutes default
  private readonly TAG_PREFIX = 'tag:';
  private readonly KEY_PREFIX = 'cache:';

  /**
   * Generate a cache key with optional prefix
   */
  private generateKey(key: string, prefix?: string): string {
    const baseKey = prefix ? `${this.KEY_PREFIX}${prefix}:${key}` : `${this.KEY_PREFIX}${key}`;
    return baseKey.replace(/[^a-zA-Z0-9:_-]/g, '_');
  }

  /**
   * Store tags for a cache key
   */
  private async storeTags(key: string, tags: string[]): Promise<void> {
    if (!tags.length) return;
    
    const available = await isRedisAvailable();
    if (!available) return;

    try {
      const pipeline = redisClient.pipeline();
      for (const tag of tags) {
        const tagKey = `${this.TAG_PREFIX}${tag}`;
        pipeline.sadd(tagKey, key);
        pipeline.expire(tagKey, 86400); // Tag expires in 24 hours
      }
      await pipeline.exec();
    } catch (err) {
      console.error('Cache tag storage error:', err);
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string, prefix?: string): Promise<T | null> {
    const available = await isRedisAvailable();
    if (!available) return null;

    try {
      const cacheKey = this.generateKey(key, prefix);
      const data = await redisClient.get(cacheKey);
      
      if (!data) return null;
      
      return JSON.parse(data) as T;
    } catch (err) {
      console.error('Cache get error:', err);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<boolean> {
    const available = await isRedisAvailable();
    if (!available) return false;

    try {
      const cacheKey = this.generateKey(key, options.prefix);
      const ttl = options.ttl || this.DEFAULT_TTL;
      const serialized = JSON.stringify(value);

      await redisClient.setex(cacheKey, ttl, serialized);

      // Store tags if provided
      if (options.tags && options.tags.length > 0) {
        await this.storeTags(cacheKey, options.tags);
      }

      return true;
    } catch (err) {
      console.error('Cache set error:', err);
      return false;
    }
  }

  /**
   * Delete a specific cache key
   */
  async delete(key: string, prefix?: string): Promise<boolean> {
    const available = await isRedisAvailable();
    if (!available) return false;

    try {
      const cacheKey = this.generateKey(key, prefix);
      await redisClient.del(cacheKey);
      return true;
    } catch (err) {
      console.error('Cache delete error:', err);
      return false;
    }
  }

  /**
   * Delete multiple keys by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const available = await isRedisAvailable();
    if (!available) return 0;

    try {
      const fullPattern = `${this.KEY_PREFIX}${pattern}*`;
      const keys = await redisClient.keys(fullPattern);
      
      if (keys.length === 0) return 0;

      return await redisClient.del(...keys);
    } catch (err) {
      console.error('Cache delete pattern error:', err);
      return 0;
    }
  }

  /**
   * Invalidate cache by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    const available = await isRedisAvailable();
    if (!available) return 0;

    try {
      let deleted = 0;
      const pipeline = redisClient.pipeline();

      for (const tag of tags) {
        const tagKey = `${this.TAG_PREFIX}${tag}`;
        const keys = await redisClient.smembers(tagKey);
        
        if (keys.length > 0) {
          pipeline.del(...keys);
          pipeline.del(tagKey);
          deleted += keys.length;
        }
      }

      await pipeline.exec();
      return deleted;
    } catch (err) {
      console.error('Cache tag invalidation error:', err);
      return 0;
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<boolean> {
    const available = await isRedisAvailable();
    if (!available) return false;

    try {
      await redisClient.flushdb();
      return true;
    } catch (err) {
      console.error('Cache clear all error:', err);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    keys: number;
    memory: string;
    connected: boolean;
  }> {
    const available = await isRedisAvailable();
    if (!available) {
      return { keys: 0, memory: '0', connected: false };
    }

    try {
      const info = await redisClient.info('memory');
      const keyspace = await redisClient.info('keyspace');
      
      const memoryMatch = info.match(/used_memory_human:(.+)/);
      const keysMatch = keyspace.match(/keys=(\d+)/);
      
      return {
        keys: keysMatch ? parseInt(keysMatch[1], 10) : 0,
        memory: memoryMatch ? memoryMatch[1].trim() : '0',
        connected: true,
      };
    } catch (err) {
      console.error('Cache stats error:', err);
      return { keys: 0, memory: '0', connected: false };
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string, prefix?: string): Promise<boolean> {
    const available = await isRedisAvailable();
    if (!available) return false;

    try {
      const cacheKey = this.generateKey(key, prefix);
      const result = await redisClient.exists(cacheKey);
      return result === 1;
    } catch (err) {
      console.error('Cache exists check error:', err);
      return false;
    }
  }

  /**
   * Increment a cached counter
   */
  async increment(key: string, prefix?: string, by: number = 1): Promise<number> {
    const available = await isRedisAvailable();
    if (!available) return 0;

    try {
      const cacheKey = this.generateKey(key, prefix);
      return await redisClient.incrby(cacheKey, by);
    } catch (err) {
      console.error('Cache increment error:', err);
      return 0;
    }
  }

  /**
   * Set expiration on existing key
   */
  async expire(key: string, ttl: number, prefix?: string): Promise<boolean> {
    const available = await isRedisAvailable();
    if (!available) return false;

    try {
      const cacheKey = this.generateKey(key, prefix);
      await redisClient.expire(cacheKey, ttl);
      return true;
    } catch (err) {
      console.error('Cache expire error:', err);
      return false;
    }
  }
}

export const cacheService = new CacheService();


