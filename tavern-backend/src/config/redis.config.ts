// src/config/redis.config.ts
import 'dotenv/config';
import Redis from 'ioredis';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = Number(process.env.REDIS_PORT) || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = Number(process.env.REDIS_DB) || 0;

// Create Redis client with connection pooling
export const redisClient = new Redis({
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD || undefined, // Only set if provided
  db: REDIS_DB,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false, // Connect immediately
  connectTimeout: 10000, // 10 second connection timeout
});

// Handle connection events
redisClient.on('connect', () => {
  console.log('✅ Redis client connecting...');
});

redisClient.on('ready', () => {
  console.log('✅ Redis client ready');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis client error:', err.message);
  // Don't crash the app if Redis is unavailable
});

redisClient.on('close', () => {
  console.log('⚠️ Redis client connection closed');
});

// Helper to check if Redis is available
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    await redisClient.ping();
    return true;
  } catch {
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

