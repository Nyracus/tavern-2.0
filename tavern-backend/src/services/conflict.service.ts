// src/services/conflict.service.ts
import { Types } from "mongoose";
import { ConflictModel, ConflictDocument, ConflictType, ConflictStatus, ConflictResolution } from "../models/conflict.model";
import { Quest } from "../models/quest.model";
import { UserModel } from "../models/user.model";
import { AdventurerProfileModel } from "../models/adventurerProfile.model";
import { transactionService } from "./transaction.service";

export class ConflictService {
  /**
   * Create a conflict
   */
  async createConflict(
    questId: string,
    type: ConflictType,
    raisedBy: string,
    raisedByRole: "ADVENTURER" | "NPC",
    description: string,
    escrowedAmount: number
  ): Promise<ConflictDocument> {
    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      throw new Error("Quest not found");
    }

    // Verify quest has adventurer and NPC
    if (!quest.adventurerId || !quest.npcId) {
      throw new Error("Quest must have both NPC and Adventurer assigned");
    }

    const conflict = await ConflictModel.create({
      questId: new Types.ObjectId(questId),
      type,
      raisedBy: new Types.ObjectId(raisedBy),
      raisedByRole,
      npcId: quest.npcId,
      adventurerId: quest.adventurerId,
      description,
      escrowedAmount,
      status: "OPEN",
    });

    // Update quest to reference conflict
    quest.conflictId = conflict._id;
    quest.hasConflict = true;
    await quest.save();

    return conflict;
  }

  /**
   * Get conflict by quest ID
   */
  async getConflictByQuest(questId: string): Promise<ConflictDocument | null> {
    return ConflictModel.findOne({ questId: new Types.ObjectId(questId) })
      .populate("questId", "title rewardGold")
      .populate("raisedBy", "username displayName")
      .populate("npcId", "username displayName")
      .populate("adventurerId", "username displayName")
      .exec();
  }

  /**
   * Get all open conflicts
   */
  async getOpenConflicts(): Promise<ConflictDocument[]> {
    return ConflictModel.find({ status: "OPEN" })
      .sort({ createdAt: -1 })
      .populate("questId", "title rewardGold status")
      .populate("raisedBy", "username displayName")
      .populate("npcId", "username displayName")
      .populate("adventurerId", "username displayName")
      .exec();
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(
    conflictId: string,
    resolution: ConflictResolution,
    resolvedBy: string,
    resolutionNotes?: string
  ): Promise<ConflictDocument> {
    const conflict = await ConflictModel.findById(conflictId)
      .populate("questId")
      .exec();

    if (!conflict) {
      throw new Error("Conflict not found");
    }

    if (conflict.status !== "OPEN") {
      throw new Error("Conflict is already resolved or cancelled");
    }

    const quest = conflict.questId as any;
    const rewardGold = quest.rewardGold || 0;

    // Update conflict
    conflict.resolution = resolution;
    conflict.resolvedBy = new Types.ObjectId(resolvedBy);
    conflict.resolvedAt = new Date();
    conflict.status = "RESOLVED";
    conflict.resolutionNotes = resolutionNotes;

    await conflict.save();

    if (resolution === "ADVENTURER_WIN") {
      // Adventurer wins: 150% payment + their escrow returned
      const paymentAmount = rewardGold * 1.5; // 150%
      const escrowReturn = conflict.escrowedAmount; // Adventurer's escrow returned

      // Pay adventurer bonus + return their escrow
      if (quest.adventurerId) {
        const adventurer = await UserModel.findById(quest.adventurerId).exec();
        if (adventurer) {
          // Payment: 150% of reward + escrow returned
          adventurer.gold = (adventurer.gold || 0) + paymentAmount + escrowReturn;
          await adventurer.save();
        }

        // Create transaction records
        await transactionService.createTransaction(
          String(quest._id),
          "CONFLICT_PAYOUT",
          paymentAmount,
          String(quest.npcId),
          String(quest.adventurerId),
          `Conflict resolution: Adventurer win - 150% payment`,
          { conflictId: String(conflict._id), resolution: "ADVENTURER_WIN" }
        );

        if (escrowReturn > 0) {
          await transactionService.createTransaction(
            String(quest._id),
            "CONFLICT_PAYOUT",
            escrowReturn,
            undefined,
            String(quest.adventurerId),
            `Conflict resolution: Escrowed amount returned to adventurer`,
            { conflictId: String(conflict._id), resolution: "ADVENTURER_WIN" }
          );
        }
      }

      // Demote NPC: Increase priority (lower priority = lower in job posting queue)
      const npc = await UserModel.findById(quest.npcId).exec();
      if (npc) {
        npc.npcPriority = (npc.npcPriority || 0) + 10; // Increase by 10 (higher number = lower priority)
        await npc.save();
      }

      // Update quest status
      quest.status = "Paid";
      quest.paidGold = paymentAmount;
      quest.paidAt = new Date();
      quest.hasConflict = false;
      await quest.save();
    } else if (resolution === "NPC_WIN") {
      // NPC wins: Escrow forfeited, adventurer demoted
      
      // Escrow is forfeited (not returned)
      // Create transaction record for forfeiture
      await transactionService.createTransaction(
        String(quest._id),
        "CONFLICT_PAYOUT",
        conflict.escrowedAmount,
        String(quest.adventurerId),
        undefined, // Escrow goes to system/guild (not returned)
        `Conflict resolution: NPC win - Escrow forfeited`,
        { conflictId: String(conflict._id), resolution: "NPC_WIN", forfeited: true }
      );

      // Demote Adventurer: Lower rank by one level
      const profile = await AdventurerProfileModel.findOne({ userId: String(quest.adventurerId) }).exec();
      if (profile) {
        const rankOrder = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
        const currentRankIndex = rankOrder.indexOf(profile.rank || "F");
        if (currentRankIndex > 0) {
          profile.rank = rankOrder[currentRankIndex - 1]; // Demote by one rank
          await profile.save();
        }
      }

      // Update quest status to Cancelled (NPC won, no payment)
      quest.status = "Cancelled";
      quest.hasConflict = false;
      await quest.save();
    }

    return conflict;
  }

  /**
   * Helper: Calculate rank from XP
   */
  calculateRankFromXP(xp: number): string {
    if (xp >= 5000) return "SSS";
    if (xp >= 3000) return "SS";
    if (xp >= 2000) return "S";
    if (xp >= 1500) return "A";
    if (xp >= 1000) return "B";
    if (xp >= 700) return "C";
    if (xp >= 400) return "D";
    if (xp >= 200) return "E";
    return "F";
  }
}

export const conflictService = new ConflictService();

