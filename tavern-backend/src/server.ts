// src/server.ts
import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/db.config";
import { redisClient, isRedisAvailable } from "./config/redis.config";
import { deadlineCheckerService } from "./services/deadlineChecker.service";

// Render requires PORT to be used from environment, defaults to 3000 for local
const PORT = Number(process.env.PORT) || 3000;
const INSTANCE_ID = process.env.INSTANCE_ID || `instance-${Date.now()}`;

const start = async () => {
  // Connect to MongoDB
  await connectDB();
  
  // Connect to Redis (non-blocking)
  try {
    // Redis connects automatically with lazyConnect: false
    // Just verify connection
    const available = await isRedisAvailable();
    if (available) {
      console.log(`✅ Redis connected (Instance: ${INSTANCE_ID})`);
    } else {
      console.warn('⚠️ Redis not available, caching disabled');
    }
  } catch (err) {
    console.warn('⚠️ Redis connection failed, caching disabled:', err instanceof Error ? err.message : err);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Tavern backend running on port ${PORT} (Instance: ${INSTANCE_ID})`);
    // Start deadline checker (checks every hour)
    deadlineCheckerService.startChecking(60);
  });
};

start();
