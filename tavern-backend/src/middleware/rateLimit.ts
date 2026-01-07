// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';
import { redisClient, isRedisAvailable } from '../config/redis.config';

const windowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
// Significantly increased limit to prevent "too many requests" errors
// In development, use a very high limit; in production, use a reasonable limit
const isDevelopment = process.env.NODE_ENV !== 'production';
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDevelopment ? 10000 : 2000);

export const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
  skip: (req) => {
    // Skip rate limiting for polling endpoints (notifications, quests/mine, etc.)
    // These are expected to be called frequently
    const path = req.path.replace('/api', '').split('?')[0]; // Remove /api prefix and query params
    
    // List of polling endpoints that should never be rate limited
    const pollingEndpoints = [
      '/notifications',
      '/quests/mine',
      '/quests/applications/mine',
      '/auth/me',
      '/adventurers/me',
      '/quests/recommended',
    ];
    
    // Check if this is a polling endpoint
    if (pollingEndpoints.some(endpoint => path === endpoint || path.startsWith(endpoint + '/'))) {
      return true;
    }
    
    // Skip GET requests to frequently polled endpoints
    if (req.method === 'GET') {
      // Quest board queries (with filters)
      if (path === '/quests' || path.startsWith('/quests/')) {
        return true;
      }
      // Notifications
      if (path.startsWith('/notifications')) {
        return true;
      }
      // User profile/me endpoints
      if (path === '/auth/me' || path === '/adventurers/me') {
        return true;
      }
    }
    
    return false;
  },
});

// More lenient rate limiter for polling endpoints
export const pollingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute (1 per second)
  standardHeaders: true,
  legacyHeaders: false,
});
