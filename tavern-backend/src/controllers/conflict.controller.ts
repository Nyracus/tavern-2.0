// src/controllers/conflict.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { conflictService } from "../services/conflict.service";
import { Quest } from "../models/quest.model";
import { UserModel } from "../models/user.model";
import { AppError } from "../middleware/error.middleware";
import { transactionService } from "../services/transaction.service";

export class ConflictController {
  /**
   * Adventurer raises conflict: Report rejected or quest details changed
   */
  async raiseConflictByAdventurer(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "ADVENTURER") {
        return res.status(403).json({ success: false, message: "Only adventurers can raise this type of conflict" });
      }

      const { questId } = req.params;
      const { type, description } = req.body as { type: "REPORT_REJECTED" | "QUEST_CHANGED"; description: string };

      if (!type || !description) {
        return res.status(400).json({ success: false, message: "Type and description are required" });
      }

      if (type !== "REPORT_REJECTED" && type !== "QUEST_CHANGED") {
        return res.status(400).json({ success: false, message: "Invalid conflict type for adventurer" });
      }

      const quest = await Quest.findById(questId).exec();
      if (!quest) {
        return res.status(404).json({ success: false, message: "Quest not found" });
      }

      if (!quest.adventurerId || quest.adventurerId.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: "You can only raise conflicts for your own quests" });
      }

      // Check if conflict already exists
      if (quest.hasConflict) {
        return res.status(400).json({ success: false, message: "A conflict already exists for this quest" });
      }

      // Validate conflict type scenarios
      if (type === "REPORT_REJECTED" && quest.status !== "Completed") {
        return res.status(400).json({ success: false, message: "Cannot raise report rejected conflict for non-completed quest" });
      }

      if (type === "QUEST_CHANGED" && quest.status !== "Accepted") {
        return res.status(400).json({ success: false, message: "Cannot raise quest changed conflict for non-accepted quest" });
      }

      const rewardGold = quest.rewardGold || 0;
      const escrowAmount = rewardGold * 0.5; // 50% of quest reward

      // Check if adventurer has enough gold to escrow
      const adventurer = await UserModel.findById(req.userId).exec();
      if (!adventurer) {
        throw new AppError(404, "Adventurer not found");
      }

      const adventurerGold = adventurer.gold || 0;
      if (adventurerGold < escrowAmount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient gold. You need ${escrowAmount} gold to raise a conflict (50% of quest reward).`,
        });
      }

      // Deduct gold from adventurer (escrow)
      adventurer.gold = adventurerGold - escrowAmount;
      await adventurer.save();

      // Create conflict
      const conflict = await conflictService.createConflict(
        questId,
        type,
        req.userId,
        "ADVENTURER",
        description,
        escrowAmount
      );

      // Create transaction record
      await transactionService.createTransaction(
        questId,
        "CONFLICT_ESCROW",
        escrowAmount,
        req.userId,
        undefined,
        `Conflict escrow: ${type} - ${description}`,
        { conflictId: String(conflict._id) }
      );

      return res.status(201).json({ success: true, data: conflict });
    } catch (err) {
      next(err);
    }
  }

  /**
   * NPC raises conflict: Deadline missed
   */
  async raiseConflictByNPC(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "NPC") {
        return res.status(403).json({ success: false, message: "Only NPCs can raise deadline missed conflicts" });
      }

      const { questId } = req.params;
      const { description } = req.body as { description?: string };

      const quest = await Quest.findById(questId).exec();
      if (!quest) {
        return res.status(404).json({ success: false, message: "Quest not found" });
      }

      if (quest.npcId.toString() !== req.userId) {
        return res.status(403).json({ success: false, message: "You can only raise conflicts for your own quests" });
      }

      // Check if conflict already exists
      if (quest.hasConflict) {
        return res.status(400).json({ success: false, message: "A conflict already exists for this quest" });
      }

      // Verify deadline was missed and completion is NOT submitted
      if (!quest.deadline) {
        return res.status(400).json({
          success: false,
          message: "Quest has no deadline set",
        });
      }

      const now = new Date();
      if (quest.deadline > now) {
        return res.status(400).json({ success: false, message: "Deadline has not passed yet" });
      }

      // If completion is already submitted, NPC cannot raise deadline conflict
      if (quest.completionSubmittedAt) {
        return res.status(400).json({
          success: false,
          message: "Cannot raise deadline conflict: Adventurer has already submitted completion. Deadline passed but submission was made.",
        });
      }

      // NPC doesn't need to escrow for deadline missed conflicts
      const conflict = await conflictService.createConflict(
        questId,
        "DEADLINE_MISSED",
        req.userId,
        "NPC",
        description || `Deadline missed: ${quest.deadline.toISOString()}`,
        0 // No escrow for NPC conflicts
      );

      return res.status(201).json({ success: true, data: conflict });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Guild Master: Get all open conflicts
   */
  async getOpenConflicts(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "GUILD_MASTER") {
        return res.status(403).json({ success: false, message: "Guild Master access required" });
      }

      const conflicts = await conflictService.getOpenConflicts();
      return res.json({ success: true, data: conflicts });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Guild Master: Get conflict by quest ID
   */
  async getConflictByQuest(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }

      const { questId } = req.params;
      const conflict = await conflictService.getConflictByQuest(questId);

      if (!conflict) {
        return res.status(404).json({ success: false, message: "Conflict not found" });
      }

      // Allow access if user is involved in the conflict or is Guild Master
      const isInvolved =
        req.userRole === "GUILD_MASTER" ||
        conflict.raisedBy.toString() === req.userId ||
        conflict.npcId.toString() === req.userId ||
        conflict.adventurerId.toString() === req.userId;

      if (!isInvolved) {
        return res.status(403).json({ success: false, message: "Not authorized to view this conflict" });
      }

      return res.json({ success: true, data: conflict });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Guild Master: Resolve conflict
   */
  async resolveConflict(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "GUILD_MASTER") {
        return res.status(403).json({ success: false, message: "Guild Master access required" });
      }

      const { conflictId } = req.params;
      const { resolution, resolutionNotes } = req.body as {
        resolution: "ADVENTURER_WIN" | "NPC_WIN";
        resolutionNotes?: string;
      };

      if (!resolution || (resolution !== "ADVENTURER_WIN" && resolution !== "NPC_WIN")) {
        return res.status(400).json({ success: false, message: "Valid resolution required: ADVENTURER_WIN or NPC_WIN" });
      }

      const conflict = await conflictService.resolveConflict(conflictId, resolution, req.userId, resolutionNotes);
      return res.json({ success: true, data: conflict });
    } catch (err) {
      next(err);
    }
  }
}

export const conflictController = new ConflictController();


