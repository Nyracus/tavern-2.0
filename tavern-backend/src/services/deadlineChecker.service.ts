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
      const anomalies = await anomalyService.scanDeadlineAnomalies();
      if (anomalies.length > 0) {
        console.log(`⚠️  Found ${anomalies.length} deadline anomalies`);
      }
    } catch (err) {
      console.error("Error checking deadlines:", err);
    }
  }
}

export const deadlineCheckerService = new DeadlineCheckerService();

