import { Request, Response, NextFunction } from "express";
import { anomalyService } from "../services/anomaly.service";
import { AnomalyStatus } from "../models/anomaly.model";

export class AdminController {
  /**
   * Trigger a full anomaly scan.
   */
  async scanAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const anomalies = await anomalyService.scanAll();
      res.status(201).json({ success: true, data: anomalies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * List all anomalies (optionally filter by status later).
   */
  async listAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const anomalies = await anomalyService.listAll();
      res.json({ success: true, data: anomalies });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update anomaly status (ACKNOWLEDGED, RESOLVED, IGNORED, etc.).
   */
  async updateAnomalyStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as { status: AnomalyStatus };

      if (!status) {
        return res.status(400).json({ success: false, message: "Status is required" });
      }

      const updated = await anomalyService.updateStatus(id, status);
      if (!updated) {
        return res.status(404).json({ success: false, message: "Anomaly not found" });
      }

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();


