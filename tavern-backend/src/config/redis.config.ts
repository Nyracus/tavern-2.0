// src/config/redis.config.ts
import 'dotenv/config';
import Redis from 'ioredis';

// Support both connection string (Render) and individual config (local/Docker)
const REDIS_CONNECTION_STRING = process.env.REDIS_CONNECTION_STRING;
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = Number(process.env.REDIS_DB) || 0;

// Create Redis client with connection pooling
// If connection string is provided (Render), use it; otherwise use individual config
// Use lazyConnect: true for local dev to avoid connection errors when Redis isn't running
const isProduction = process.env.NODE_ENV === 'production';
export const redisClient = REDIS_CONNECTION_STRING
  ? new Redis(REDIS_CONNECTION_STRING, {
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: !isProduction, // Lazy connect in dev, eager in production
      connectTimeout: 10000,
    })
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      db: REDIS_DB,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: !isProduction, // Lazy connect in dev, eager in production
      connectTimeout: 10000,
    });

// Handle connection events (only log in production or when actually connected)
redisClient.on('connect', () => {
  if (isProduction) {
    console.log('✅ Redis client connecting...');
  }
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  // Only log errors in production
  // In dev, suppress connection errors (expected if Redis isn't running)
  if (isProduction) {
    console.error('❌ Redis client error:', err.message);
  }
  // Don't crash the app if Redis is unavailable
});

redisClient.on('close', () => {
  // Only log in production
  if (isProduction) {
    console.log('⚠️ Redis client connection closed');
  }
});

// Helper to check if Redis is available
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    // In lazy mode, connect if not already connected
    if (redisClient.status === 'end' || redisClient.status === 'close') {
      // Don't try to reconnect if connection was closed
      return false;
    }
    
    // If not connected yet in lazy mode, try to connect
    if (redisClient.status === 'wait' || redisClient.status === 'ready') {
      await redisClient.ping();
      return true;
    }
    
    // Try to ping (will connect if needed in lazy mode)
    await redisClient.ping();
    return true;
  } catch (err) {
    // Suppress errors in dev mode
    if (!isProduction) {
      return false;
    }
    // In production, log but still return false
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
});

process.on('SIGTERM', async () => {
  await redisClient.quit();
});

