// src/config/db.config.ts
import "dotenv/config";
import mongoose from "mongoose";

const mongoUri = process.env.MONGO_URI as string | undefined;

export const connectDB = async () => {
  try {
    if (!mongoUri) {
      console.warn("⚠️  MONGO_URI is not set in .env");
      console.warn(
        "⚠️  Server will start without database. Please configure MongoDB URI."
      );
      return;
    }

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.warn(
      "⚠️  MongoDB connection failed:",
      err instanceof Error ? err.message : err
    );
    console.warn(
      "⚠️  Server will start without database. Please start MongoDB or configure Atlas."
    );
    // IMPORTANT: do NOT process.exit(1); – match teammate's JS behavior
  }
};
