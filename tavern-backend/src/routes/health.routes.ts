// src/routes/health.routes.ts
import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { isRedisAvailable } from '../config/redis.config';
import { cacheService } from '../services/cache.service';

const router = Router();

/**
 * Basic health check endpoint
 * Used by load balancer to check if instance is healthy
 */
router.get('/health', async (req: Request, res: Response) => {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    instance: process.env.INSTANCE_ID || 'unknown',
    uptime: process.uptime(),
  };

  // Check MongoDB connection
  const mongoStatus = mongoose.connection.readyState === 1;
  checks.mongodb = mongoStatus;

  // Check Redis connection
  const redisStatus = await isRedisAvailable();
  checks.redis = redisStatus;

  // Get cache stats if Redis is available
  if (redisStatus) {
    const stats = await cacheService.getStats();
    checks.cache = stats;
  }

  const allHealthy = mongoStatus; // Redis is optional

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    ...checks,
  });
});

/**
 * Readiness probe - checks if service is ready to accept traffic
 */
router.get('/health/ready', async (req: Request, res: Response) => {
  const mongoReady = mongoose.connection.readyState === 1;
  
  if (mongoReady) {
    res.status(200).json({
      success: true,
      ready: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(503).json({
      success: false,
      ready: false,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * Liveness probe - checks if service is alive
 */
router.get('/health/live', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    alive: true,
    timestamp: new Date().toISOString(),
    instance: process.env.INSTANCE_ID || 'unknown',
  });
});

export default router;

