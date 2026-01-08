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
  
  // Connect to Redis (with aggressive retry logic)
  attemptRedisConnection(); // Mark that we're attempting connection
  
  let redisConnected = false;
  const maxRetries = 5;
  
  // Wait a bit for Redis to be ready (in case it's starting up)
  await new Promise(resolve => setTimeout(resolve, 500));
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Check current status
      const status = redisClient.status;
      
      // If already ready, verify with ping
      if (status === 'ready') {
        try {
          await redisClient.ping();
          redisConnected = true;
          console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
          break;
        } catch {
          // Ping failed, continue to reconnect
        }
      }
      
      // If connecting, wait for it
      if (status === 'connecting') {
        for (let i = 0; i < 30; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (redisClient.status === 'ready') {
            try {
              await redisClient.ping();
              redisConnected = true;
              console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
              break;
            } catch {
              // Continue
            }
          }
        }
        if (redisConnected) break;
      }
      
      // Try to connect if not connected
      if (status === 'wait' || status === 'close' || status === undefined || status === 'end') {
        try {
          // Create new connection if ended
          if (status === 'end') {
            // Can't reconnect ended client, but try ping anyway
            await redisClient.ping();
          } else {
            await redisClient.connect();
          }
          
          // Wait for connection
          for (let i = 0; i < 50; i++) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (redisClient.status === 'ready') {
              try {
                await redisClient.ping();
                redisConnected = true;
                console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
                break;
              } catch {
                // Continue waiting
              }
            }
            if (redisClient.status === 'end') {
              break; // Connection failed
            }
          }
          if (redisConnected) break;
        } catch (connectErr) {
          // Connection failed, will retry
          if (attempt === maxRetries) {
            const errorMsg = connectErr instanceof Error ? connectErr.message : String(connectErr);
            if (errorMsg.includes('ECONNREFUSED')) {
              console.warn('⚠️ Redis not available, caching disabled');
              console.warn('   Redis server is not running.');
              console.warn('   Quick start: docker run -d --name tavern-redis -p 6379:6379 redis:7-alpine');
              console.warn('   Or run: cd tavern-backend && .\\start-redis.ps1');
            } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
              console.warn('⚠️ Redis not available, caching disabled');
              console.warn('   Cannot resolve Redis host. Check REDIS_HOST or REDIS_CONNECTION_STRING');
            } else {
              console.warn('⚠️ Redis not available, caching disabled');
              console.warn(`   Connection error: ${errorMsg}`);
            }
          }
        }
      }
      
      // Final check with ping
      if (!redisConnected && attempt === maxRetries) {
        try {
          await redisClient.ping();
          redisConnected = true;
          console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
        } catch {
          // Final attempt failed
        }
      }
      
    } catch (err) {
      // Error in check, continue to retry
      if (attempt === maxRetries) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn('⚠️ Redis connection failed, caching disabled');
        console.warn(`   Error: ${errorMsg}`);
      }
    }
    
    // Wait before retry (except on last attempt)
    if (attempt < maxRetries && !redisConnected) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  if (!redisConnected) {
    console.warn('⚠️ Redis not available, caching disabled');
    console.warn('   The app will continue without caching. Install/start Redis for better performance.');
    console.warn('   See: tavern-backend/start-redis.ps1 for help starting Redis');
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
