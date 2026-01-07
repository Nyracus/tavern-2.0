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
  
  // Verify MongoDB connection before starting deadline checker
  const mongoose = await import('mongoose');
  const isMongoConnected = mongoose.default.connection.readyState === 1;
  
  if (!isMongoConnected) {
    console.error('❌ MongoDB not connected! Please set MONGO_URI environment variable.');
    console.error('⚠️  Server will start but database operations will fail.');
  }
  
  // Connect to Redis (non-blocking)
  try {
    // For lazy connect, explicitly connect only in production
    // In dev, Redis will connect on first use
    if (process.env.NODE_ENV === 'production') {
      await redisClient.connect().catch(() => {
        // Ignore connection errors in production startup
      });
    }
    
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
    // Start deadline checker only if MongoDB is connected
    if (isMongoConnected) {
      deadlineCheckerService.startChecking(60);
    } else {
      console.warn('⚠️  Deadline checker not started (MongoDB not connected)');
    }
  });
};

start();
