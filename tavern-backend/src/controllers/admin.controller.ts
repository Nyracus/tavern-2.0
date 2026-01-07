import { Request, Response, NextFunction } from "express";
import { anomalyService } from "../services/anomaly.service";
import { AnomalyStatus } from "../models/anomaly.model";

export class AdminController {
  /**
   * Trigger a full anomaly scan.
   */
  async scanAnomalies(req: Request, res: Response, next: NextFunction) {
    try {
      const generalAnomalies = await anomalyService.scanAll();
      const deadlineAnomalies = await anomalyService.scanDeadlineAnomalies();
      const allAnomalies = [...generalAnomalies, ...deadlineAnomalies];
      res.status(201).json({ success: true, data: allAnomalies });
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

  /**
   * Delete a user (NPC or Adventurer) by ID. Guild Master only.
   * This will also delete associated profiles, quests, etc.
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const { userService } = await import("../services/user.service");
      const { AdventurerProfileModel } = await import("../models/adventurerProfile.model");
      const { Quest } = await import("../models/quest.model");
      const { ChatMessageModel } = await import("../models/chatMessage.model");
      const { NotificationModel } = await import("../models/notification.model");
      const { ConflictModel } = await import("../models/conflict.model");
      const { TransactionModel } = await import("../models/transaction.model");

      // Delete user and all associated data
      await userService.deleteUser(id);
      
      // Delete adventurer profile if exists
      await AdventurerProfileModel.deleteOne({ userId: id });
      
      // Delete quests posted by this user (if NPC) or assigned to this user (if Adventurer)
      await Quest.deleteMany({ 
        $or: [
          { npcId: id },
          { adventurerId: id }
        ]
      });
      
      // Delete chat messages
      await ChatMessageModel.deleteMany({ senderId: id });
      
      // Delete notifications
      await NotificationModel.deleteMany({ userId: id });
      
      // Delete conflicts
      await ConflictModel.deleteMany({
        $or: [
          { npcId: id },
          { adventurerId: id },
          { raisedBy: id }
        ]
      });
      
      // Delete transactions
      await TransactionModel.deleteMany({
        $or: [
          { senderId: id },
          { receiverId: id }
        ]
      });

      res.json({ 
        success: true, 
        message: `User ${id} and all associated data have been deleted.`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();


