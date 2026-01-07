// src/services/deadlineChecker.service.ts
import { anomalyService } from "./anomaly.service";

/**
 * Service to periodically check for deadline anomalies
 * This should be called by a scheduled job or on server startup
 */
export class DeadlineCheckerService {
  private intervalId: NodeJS.Timeout | null = null;

  /**
   * Start checking for deadline anomalies every hour
   */
  startChecking(intervalMinutes: number = 60) {
    // Check immediately on start
    this.checkDeadlines();

    // Then check periodically
    this.intervalId = setInterval(() => {
      this.checkDeadlines();
    }, intervalMinutes * 60 * 1000);

    console.log(`✅ Deadline checker started (checking every ${intervalMinutes} minutes)`);
  }

  /**
   * Stop checking for deadline anomalies
   */
  stopChecking() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("⏹️  Deadline checker stopped");
    }
  }

  /**
   * Check for deadline anomalies
   */
  async checkDeadlines() {
    try {
      // Check if MongoDB is connected before attempting to query
      const mongoose = await import('mongoose');
      if (mongoose.default.connection.readyState !== 1) {
        console.warn("⚠️  MongoDB not connected, skipping deadline check");
        return;
      }

      const anomalies = await anomalyService.scanDeadlineAnomalies();
      if (anomalies.length > 0) {
        console.log(`⚠️  Found ${anomalies.length} deadline anomalies`);
      }
    } catch (err) {
      // Only log non-MongoDB-connection errors
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (!errorMessage.includes('buffering timed out') && !errorMessage.includes('MongooseError')) {
        console.error("Error checking deadlines:", err);
      } else {
        console.warn("⚠️  MongoDB connection issue, deadline check skipped");
      }
    }
  }
}

export const deadlineCheckerService = new DeadlineCheckerService();

