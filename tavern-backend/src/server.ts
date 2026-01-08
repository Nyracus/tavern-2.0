// src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db.config";
import { redisClient, isRedisAvailable, attemptRedisConnection } from "./config/redis.config";
import { deadlineCheckerService } from "./services/deadlineChecker.service";

// Render requires PORT to be used from environment, defaults to 3000 for local
const PORT = Number(process.env.PORT) || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${Date.now()}`;

const start = async () => {
  // Connect to MongoDB
  await connectDB();
  
  // Verify MongoDB connection before starting deadline checker
  const mongoose = await import('mongoose');
  const isMongoConnected = mongoose.default.connection.readyState === 1;
  
  if (!isMongoConnected) {
    console.error('❌ MongoDB not connected! Please set MONGO_URI environment variable.');
    console.error('⚠️  Server will start but database operations will fail.');
  }
  
  // Connect to Redis (with retry logic)
  attemptRedisConnection(); // Mark that we're attempting connection
  try {
    // Attempt to connect Redis (works for both lazy and eager connect)
    const redisAvailable = await isRedisAvailable();
    
    if (redisAvailable) {
      console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
    } else {
      // Try one more time with explicit connect attempt
      try {
        const status = redisClient.status;
        if (status === 'wait' || status === 'close' || !status) {
          await redisClient.connect();
          // Wait up to 2 seconds for connection
          let attempts = 0;
          while (redisClient.status !== 'ready' && redisClient.status !== 'end' && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
          }
        }
        
        if (redisClient.status === 'ready') {
          await redisClient.ping();
          console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
        } else {
          console.warn('⚠️ Redis not available, caching disabled');
          console.warn('   Make sure Redis is running on localhost:6379 or set REDIS_CONNECTION_STRING');
        }
      } catch (connectErr) {
        console.warn('⚠️ Redis not available, caching disabled');
        const errorMsg = connectErr instanceof Error ? connectErr.message : String(connectErr);
        if (errorMsg.includes('ECONNREFUSED')) {
          console.warn('   Redis server is not running. Start Redis with: redis-server');
        } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
          console.warn('   Cannot resolve Redis host. Check REDIS_HOST or REDIS_CONNECTION_STRING');
        } else {
          console.warn(`   Connection error: ${errorMsg}`);
        }
        console.warn('   To install Redis: https://redis.io/docs/getting-started/');
      }
    }
  } catch (err) {
    console.warn('⚠️ Redis connection failed, caching disabled');
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn(`   Error: ${errorMsg}`);
    console.warn('   Make sure Redis is running on localhost:6379 or set REDIS_CONNECTION_STRING');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Tavern backend running on port ${PORT} (Instance: ${INSTANCE_ID})`);
    // Start deadline checker only if MongoDB is connected
    if (isMongoConnected) {
      deadlineCheckerService.startChecking(60);
    } else {
      console.warn('⚠️  Deadline checker not started (MongoDB not connected)');
    }
  });
};

start();
