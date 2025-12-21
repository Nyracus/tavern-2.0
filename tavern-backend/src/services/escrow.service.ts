// src/services/escrow.service.ts
import { Types } from "mongoose";
import { EscrowModel, EscrowStatus } from "../models/escrow.model";
import { UserModel } from "../models/user.model";
import { Quest } from "../models/quest.model";

export class EscrowService {
  /**
   * Create escrow and lock NPC's gold for a quest
   */
  async createEscrow(
    questId: string | Types.ObjectId,
    npcId: string | Types.ObjectId,
    amount: number,
    adventurerId?: string | Types.ObjectId
  ) {
    // Validate NPC has sufficient gold
    const npc = await UserModel.findById(npcId);
    if (!npc) {
      throw new Error("NPC not found");
    }

    const npcGold = npc.gold || 0;
    if (npcGold < amount) {
      throw new Error(
        `Insufficient gold. You have ${npcGold} gold, but need ${amount} gold for this quest reward.`
      );
    }

    // Check if escrow already exists
    const existing = await EscrowModel.findOne({ questId });
    if (existing) {
      throw new Error("Escrow already exists for this quest");
    }

    // Deduct gold from NPC
    npc.gold = npcGold - amount;
    await npc.save();

    // Create escrow
    const escrow = await EscrowModel.create({
      questId: new Types.ObjectId(questId),
      npcId: new Types.ObjectId(npcId),
      adventurerId: adventurerId ? new Types.ObjectId(adventurerId) : undefined,
      amount,
      status: "ACTIVE",
    });

    return escrow;
  }

  /**
   * Update escrow with adventurer when quest is accepted
   */
  async updateEscrowAdventurer(questId: string, adventurerId: string) {
    const escrow = await EscrowModel.findOne({ questId: new Types.ObjectId(questId) });
    if (!escrow) {
      throw new Error("Escrow not found for this quest");
    }

    if (escrow.status !== "ACTIVE") {
      throw new Error("Escrow is not active");
    }

    escrow.adventurerId = new Types.ObjectId(adventurerId);
    await escrow.save();

    return escrow;
  }

  /**
   * Release escrow funds to adventurer (called on quest payment)
   */
  async releaseEscrow(questId: string, actualAmount?: number) {
    const escrow = await EscrowModel.findOne({ questId: new Types.ObjectId(questId) });
    if (!escrow) {
      throw new Error("Escrow not found for this quest");
    }

    if (escrow.status !== "ACTIVE") {
      throw new Error("Escrow is not active");
    }

    if (!escrow.adventurerId) {
      throw new Error("No adventurer assigned to this escrow");
    }

    const releaseAmount = actualAmount ?? escrow.amount;

    // Transfer funds to adventurer
    const adventurer = await UserModel.findById(escrow.adventurerId);
    if (!adventurer) {
      throw new Error("Adventurer not found");
    }

    adventurer.gold = (adventurer.gold || 0) + releaseAmount;
    await adventurer.save();

    // If actualAmount is less than escrowed amount, refund difference to NPC
    if (actualAmount !== undefined && actualAmount < escrow.amount) {
      const refundAmount = escrow.amount - actualAmount;
      const npc = await UserModel.findById(escrow.npcId);
      if (npc) {
        npc.gold = (npc.gold || 0) + refundAmount;
        await npc.save();
      }
    }

    // Mark escrow as released
    escrow.status = "RELEASED";
    escrow.releasedAt = new Date();
    await escrow.save();

    return { escrow, releasedAmount: releaseAmount };
  }

  /**
   * Refund escrow to NPC (called on quest cancellation)
   */
  async refundEscrow(questId: string, reason?: string) {
    const escrow = await EscrowModel.findOne({ questId: new Types.ObjectId(questId) });
    if (!escrow) {
      throw new Error("Escrow not found for this quest");
    }

    if (escrow.status !== "ACTIVE") {
      throw new Error("Escrow is not active");
    }

    // Refund gold to NPC
    const npc = await UserModel.findById(escrow.npcId);
    if (!npc) {
      throw new Error("NPC not found");
    }

    npc.gold = (npc.gold || 0) + escrow.amount;
    await npc.save();

    // Mark escrow as refunded
    escrow.status = "REFUNDED";
    escrow.refundedAt = new Date();
    if (reason) {
      escrow.notes = reason;
    }
    await escrow.save();

    return escrow;
  }

  /**
   * Get escrow by quest ID
   */
  async getEscrowByQuest(questId: string) {
    return await EscrowModel.findOne({ questId: new Types.ObjectId(questId) })
      .populate("npcId", "username displayName")
      .populate("adventurerId", "username displayName");
  }

  /**
   * Get all active escrows for an NPC
   */
  async getNpcActiveEscrows(npcId: string) {
    return await EscrowModel.find({
      npcId: new Types.ObjectId(npcId),
      status: "ACTIVE",
    }).populate("questId");
  }

  /**
   * Get escrow statistics for an NPC
   */
  async getNpcEscrowStats(npcId: string) {
    const activeEscrows = await EscrowModel.find({
      npcId: new Types.ObjectId(npcId),
      status: "ACTIVE",
    });

    const totalLocked = activeEscrows.reduce((sum, e) => sum + e.amount, 0);
    const count = activeEscrows.length;

    return {
      totalLocked,
      count,
      escrows: activeEscrows,
    };
  }

  /**
   * Check if NPC can afford to create escrow
   */
  async canAffordEscrow(npcId: string, amount: number): Promise<boolean> {
    const npc = await UserModel.findById(npcId);
    if (!npc) {
      return false;
    }

    const npcGold = npc.gold || 0;
    return npcGold >= amount;
  }
}

export const escrowService = new EscrowService();
