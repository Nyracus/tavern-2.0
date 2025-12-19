import { Request, Response, NextFunction } from "express";
import { anomalyService } from "../services/anomaly.service";
import { AnomalyStatus } from "../models/anomaly.model";
import { Quest } from "../models/quest.model";
import { ChatMessage } from "../models/chat.model";

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
   * Get all quest chats with message counts and latest message (for Guild Master oversight)
   */
  async getAllChats(req: Request, res: Response, next: NextFunction) {
    try {
      // Find all quests that have assigned adventurers (active quests with chats)
      const quests = await Quest.find({
        adventurerId: { $exists: true, $ne: null },
      })
        .populate("npcId", "username displayName")
        .populate("adventurerId", "username displayName")
        .lean();

      const chatSummaries = await Promise.all(
        quests.map(async (quest: any) => {
          const messageCount = await ChatMessage.countDocuments({
            questId: quest._id,
          });

          const lastMessage = await ChatMessage.findOne({
            questId: quest._id,
          })
            .sort({ createdAt: -1 })
            .lean();

          return {
            quest: {
              _id: quest._id,
              title: quest.title,
              status: quest.status,
              npcName: quest.npcId?.displayName || quest.npcId?.username,
              adventurerName:
                quest.adventurerId?.displayName ||
                quest.adventurerId?.username,
            },
            messageCount,
            lastMessage: lastMessage
              ? {
                  _id: lastMessage._id,
                  content: lastMessage.message,
                  senderId: lastMessage.userId,
                  createdAt: lastMessage.createdAt,
                }
              : null,
          };
        })
      );

      res.json({ success: true, data: chatSummaries });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all escrows for admin oversight
   */
  async getAllEscrows(req: Request, res: Response, next: NextFunction) {
    try {
      const { EscrowModel } = await import("../models/escrow.model");
      
      const escrows = await EscrowModel.find()
        .populate("questId", "title status")
        .populate("npcId", "username displayName")
        .populate("adventurerId", "username displayName")
        .sort({ createdAt: -1 })
        .lean();

      res.json({ success: true, data: escrows });
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();


