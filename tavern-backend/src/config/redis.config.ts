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
// Use lazyConnect: true to avoid blocking startup, but actively connect on first use
const isProduction = process.env.NODE_ENV === 'production';
const redisOptions = {
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 2 seconds
    const delay = Math.min(times * 50, 2000);
    // Retry up to 10 times
    if (times > 10) {
      return null; // Stop retrying
    }
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true, // Always lazy connect, we'll connect explicitly when needed
  connectTimeout: 5000, // 5 second timeout
  enableOfflineQueue: false, // Don't queue commands when offline
  showFriendlyErrorStack: !isProduction,
};

export const redisClient = REDIS_CONNECTION_STRING
  ? new Redis(REDIS_CONNECTION_STRING, redisOptions)
  : new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD || undefined,
      db: REDIS_DB,
      ...redisOptions,
    });

// Handle connection events
let connectionAttempted = false;

redisClient.on('connect', () => {
  connectionAttempted = true;
  // Only log if we actually attempted connection
  if (connectionAttempted) {
    // Don't log here, wait for 'ready' event
  }
});

redisClient.on('ready', () => {
  if (connectionAttempted) {
    console.log('✅ Redis client ready');
  }
});

redisClient.on('error', (err) => {
  // Only log errors if we attempted connection
  // Suppress initial connection errors in dev (expected if Redis isn't running)
  if (connectionAttempted && isProduction) {
    console.error('❌ Redis client error:', err.message);
  }
  // Don't crash the app if Redis is unavailable
});

redisClient.on('close', () => {
  if (connectionAttempted && isProduction) {
    console.log('⚠️ Redis client connection closed');
  }
});

// Track when we attempt connection
export const attemptRedisConnection = () => {
  connectionAttempted = true;
};

// Helper to check if Redis is available
export const isRedisAvailable = async (): Promise<boolean> => {
  try {
    const status = redisClient.status;
    
    // If connection was explicitly closed, don't try to reconnect
    if (status === 'end') {
      return false;
    }
    
    // If already ready, just ping to verify
    if (status === 'ready') {
      await redisClient.ping();
      return true;
    }
    
    // If connecting, wait a bit and check again
    if (status === 'connecting') {
      // Wait up to 2 seconds for connection
      for (let i = 0; i < 20; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (redisClient.status === 'ready') {
          await redisClient.ping();
          return true;
        }
        if (redisClient.status === 'end' || redisClient.status === 'close') {
          return false;
        }
      }
      return false;
    }
    
    // If in wait state (lazy connect) or not connected, try to connect
    if (status === 'wait' || status === 'close' || !status) {
      connectionAttempted = true; // Mark that we're attempting
      try {
        // Attempt to connect (will do nothing if already connecting)
        if (status === 'wait') {
          await redisClient.connect();
        } else {
          // Try to reconnect if closed
          await redisClient.connect();
        }
        
        // Wait for connection with timeout
        const timeout = 3000; // 3 seconds
        const start = Date.now();
        while (redisClient.status !== 'ready' && redisClient.status !== 'end') {
          if (Date.now() - start > timeout) {
            return false;
          }
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        if (redisClient.status === 'ready') {
          await redisClient.ping();
          return true;
        }
      } catch (connectErr) {
        // Connection failed
        return false;
      }
    }
    
    // Fallback: try ping (will attempt connection in lazy mode)
    connectionAttempted = true;
    try {
      await redisClient.ping();
      return true;
    } catch (pingErr) {
      return false;
    }
  } catch (err) {
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

