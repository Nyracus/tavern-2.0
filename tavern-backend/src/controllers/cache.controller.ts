// src/controllers/cache.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { cacheService } from '../services/cache.service';
import { AppError } from '../middleware/error.middleware';

export class CacheController {
  /**
   * GET /admin/cache/stats
   * Get cache statistics (Guild Master only)
   */
  async getCacheStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const stats = await cacheService.getStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /admin/cache/clear
   * Clear all cache (Guild Master only)
   */
  async clearCache(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const cleared = await cacheService.clearAll();
      res.json({
        success: cleared,
        message: cleared ? 'Cache cleared successfully' : 'Failed to clear cache',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /admin/cache/invalidate
   * Invalidate cache by tags or patterns
   */
  async invalidateCache(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { tags, patterns } = req.body;

      if (!tags && !patterns) {
        throw new AppError(400, 'Either tags or patterns must be provided');
      }

      let deleted = 0;

      if (tags && Array.isArray(tags)) {
        deleted += await cacheService.invalidateByTags(tags);
      }

      if (patterns && Array.isArray(patterns)) {
        for (const pattern of patterns) {
          deleted += await cacheService.deletePattern(pattern);
        }
      }

      res.json({
        success: true,
        message: `Invalidated ${deleted} cache entries`,
        deleted,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const cacheController = new CacheController();


