// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

const windowMs =
  Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
const max = Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 500; // Increased from 100 to 500

export const apiRateLimiter = rateLimit({
  windowMs,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for polling endpoints (notifications, quests/mine, etc.)
    // These are expected to be called frequently
    const pollingPaths = ['/notifications', '/quests/mine', '/quests/applications/mine', '/auth/me'];
    const path = req.path.replace('/api', ''); // Remove /api prefix if present
    return pollingPaths.some(pollingPath => path.includes(pollingPath));
  },
});

// More lenient rate limiter for polling endpoints
export const pollingRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 60, // 60 requests per minute (1 per second)
  standardHeaders: true,
  legacyHeaders: false,
});
