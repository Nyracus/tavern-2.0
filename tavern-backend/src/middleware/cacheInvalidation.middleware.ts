// src/middleware/cacheInvalidation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';

export interface InvalidationOptions {
  tags?: string[]; // Tags to invalidate
  patterns?: string[]; // Key patterns to invalidate
  prefix?: string; // Prefix to clear
}

/**
 * Middleware to invalidate cache after mutations
 * 
 * Usage:
 * router.post('/users', invalidateCache({ tags: ['users'], patterns: ['users:*'] }), controller.createUser);
 */
export const invalidateCache = (options: InvalidationOptions = {}) => {
  const { tags = [], patterns = [], prefix } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original end function
    const originalEnd = res.end.bind(res);

    res.end = function (chunk?: any, encoding?: any) {
      // Invalidate cache after successful response
      if (res.statusCode >= 200 && res.statusCode < 300) {
        // Invalidate by tags
        if (tags.length > 0) {
          cacheService.invalidateByTags(tags).catch((err) => {
            console.error('Cache invalidation error (tags):', err);
          });
        }

        // Invalidate by patterns
        for (const pattern of patterns) {
          cacheService.deletePattern(pattern).catch((err) => {
            console.error('Cache invalidation error (pattern):', err);
          });
        }

        // Invalidate by prefix
        if (prefix) {
          cacheService.deletePattern(prefix).catch((err) => {
            console.error('Cache invalidation error (prefix):', err);
          });
        }
      }

      return originalEnd(chunk, encoding);
    };

    next();
  };
};

/**
 * Helper to invalidate user-specific cache
 */
export const invalidateUserCache = (userId: string) => {
  return invalidateCache({
    tags: [`user:${userId}`],
    patterns: [`user:${userId}:*`],
  });
};

/**
 * Helper to invalidate quest-related cache
 */
export const invalidateQuestCache = () => {
  return invalidateCache({
    tags: ['quests', 'leaderboard'],
    patterns: ['quests:*', 'leaderboard:*', 'recommended:*'],
  });
};

/**
 * Helper to invalidate profile cache
 */
export const invalidateProfileCache = (userId: string) => {
  return invalidateCache({
    tags: [`profile:${userId}`, 'profiles'],
    patterns: [`profile:${userId}:*`, 'profiles:*'],
  });
};


