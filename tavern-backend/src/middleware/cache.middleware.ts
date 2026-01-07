// src/middleware/cache.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import crypto from 'crypto';

export interface CacheMiddlewareOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Cache key prefix
  tags?: string[]; // Cache tags for invalidation
  varyBy?: string[]; // Request properties to vary cache by (e.g., ['headers.authorization'])
  skipCache?: (req: Request) => boolean; // Function to skip caching for specific requests
  keyGenerator?: (req: Request) => string; // Custom key generator
}

/**
 * Express middleware for caching HTTP responses
 * 
 * Usage:
 * router.get('/users', cacheMiddleware({ ttl: 300, prefix: 'users' }), controller.getUsers);
 */
export const cacheMiddleware = (options: CacheMiddlewareOptions = {}) => {
  const {
    ttl = 300, // 5 minutes default
    prefix = 'http',
    tags = [],
    varyBy = [],
    skipCache,
    keyGenerator,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests by default
    if (req.method !== 'GET') {
      return next();
    }

    // Check if cache should be skipped
    if (skipCache && skipCache(req)) {
      return next();
    }

    // Generate cache key
    let cacheKey: string;
    if (keyGenerator) {
      cacheKey = keyGenerator(req);
    } else {
      const keyParts = [
        req.method,
        req.originalUrl || req.url,
      ];

      // Add vary-by properties to key
      for (const vary of varyBy) {
        const parts = vary.split('.');
        let value: any = req;
        for (const part of parts) {
          value = value?.[part];
        }
        if (value) {
          keyParts.push(`${vary}:${value}`);
        }
      }

      // Create hash of key parts for shorter keys
      const keyString = keyParts.join('|');
      const hash = crypto.createHash('md5').update(keyString).digest('hex');
      cacheKey = hash;
    }

    // Try to get from cache
    const cached = await cacheService.get<any>(cacheKey, prefix);
    
    if (cached) {
      // Set cache headers
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      
      // Restore response headers if cached
      if (cached.headers) {
        Object.entries(cached.headers).forEach(([key, value]) => {
          res.setHeader(key, value as string);
        });
      }

      return res.status(cached.status || 200).json(cached.body);
    }

    // Cache miss - intercept response
    res.setHeader('X-Cache', 'MISS');
    res.setHeader('X-Cache-Key', cacheKey);

    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);

    res.json = function (body: any) {
      // Store in cache
      cacheService.set(
        cacheKey,
        {
          status: res.statusCode,
          headers: res.getHeaders(),
          body,
        },
        {
          ttl,
          prefix,
          tags,
        }
      ).catch((err) => {
        console.error('Cache set error in middleware:', err);
      });

      return originalJson(body);
    };

    res.send = function (body: any) {
      // Store in cache
      cacheService.set(
        cacheKey,
        {
          status: res.statusCode,
          headers: res.getHeaders(),
          body,
        },
        {
          ttl,
          prefix,
          tags,
        }
      ).catch((err) => {
        console.error('Cache set error in middleware:', err);
      });

      return originalSend(body);
    };

    next();
  };
};

/**
 * Middleware to skip cache for authenticated requests
 */
export const skipCacheForAuth = (req: Request): boolean => {
  return !!req.headers.authorization;
};

/**
 * Middleware to cache only public endpoints
 */
export const publicCacheMiddleware = cacheMiddleware({
  ttl: 600, // 10 minutes for public data
  prefix: 'public',
  skipCache: skipCacheForAuth,
});

/**
 * Middleware for user-specific caching
 */
export const userCacheMiddleware = (ttl: number = 300) => {
  return cacheMiddleware({
    ttl,
    prefix: 'user',
    varyBy: ['headers.authorization'],
  });
};


