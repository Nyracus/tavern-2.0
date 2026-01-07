// src/services/quest.service.ts
import { AppError } from "../middleware/error.middleware";
import { QuestModel, IQuest, QuestStatus } from "../models/quest.model";
import { UserModel } from "../models/user.model";
import type {
  CreateQuestInput,
  UpdateQuestInput,
  UpdateQuestStatusInput,
} from "../schemas/quest.schema";

function canEditQuest(status: QuestStatus) {
  // MVP: NPC can edit while DRAFT or POSTED (until "accepted" exists)
  return status === "DRAFT" || status === "POSTED";
}

function canDeleteQuest(status: QuestStatus) {
  // ✅ realistic: NPC can delete only while DRAFT (private)
  return status === "DRAFT";
}

/**
 * MVP transitions (realistic + future-proof):
 * - NPC creates: DRAFT or POSTED
 * - NPC can publish: DRAFT -> POSTED
 * - NPC can cancel: DRAFT/POSTED -> CANCELLED
 * - POSTED -> DRAFT is not allowed (no "unpublish")
 * - COMPLETED is not used in MVP (reserved for future approval flow)
 * - IN_PROGRESS is reserved for future "Adventurer accepts quest"
 */
function assertNpcStatusTransition(from: QuestStatus, to: QuestStatus) {
  if (from === to) return;

  if (from === "COMPLETED" || from === "CANCELLED") {
    throw new AppError(400, `Cannot change status from ${from} to ${to}`);
  }

  if (to === "IN_PROGRESS") {
    throw new AppError(
      400,
      "IN_PROGRESS is reserved for Adventurer acceptance (not implemented yet)"
    );
  }

  if (to === "COMPLETED") {
    throw new AppError(
      400,
      "COMPLETED is reserved for future completion approval flow (not implemented yet)"
    );
  }

  const allowed: Record<QuestStatus, QuestStatus[]> = {
    DRAFT: ["POSTED", "CANCELLED"],
    POSTED: ["CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"], // future only
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!allowed[from]?.includes(to)) {
    throw new AppError(400, `Cannot change status from ${from} to ${to}`);
  }
}

class QuestService {
  async createQuestForNpc(npcUserId: string, data: CreateQuestInput): Promise<IQuest> {
    const user = await UserModel.findById(npcUserId).exec();
    if (!user) throw new AppError(404, "User not found");
    if (user.role !== "NPC") throw new AppError(403, "Only NPC users can create quests");

    const status: QuestStatus = (data.status ?? "DRAFT") as QuestStatus;

    const quest = await QuestModel.create({
      title: data.title,
      description: data.description,
      createdBy: npcUserId,
      status,
      rewardGold: data.rewardGold,
      requiredLevel: data.requiredLevel,
      requiredClasses: data.requiredClasses ?? [],
      tags: data.tags ?? [],
      deadline: data.deadline,
    });

    return quest;
  }

  async listQuestsForNpc(npcUserId: string): Promise<IQuest[]> {
    return QuestModel.find({ createdBy: npcUserId }).sort({ createdAt: -1 }).exec();
  }

  async getQuestForNpc(npcUserId: string, questId: string): Promise<IQuest> {
    const quest = await QuestModel.findOne({ _id: questId, createdBy: npcUserId }).exec();
    if (!quest) throw new AppError(404, "Quest not found");
    return quest;
  }

  async updateQuestForNpc(
    npcUserId: string,
    questId: string,
    data: UpdateQuestInput
  ): Promise<IQuest> {
    const quest = await this.getQuestForNpc(npcUserId, questId);

    if (!canEditQuest(quest.status)) {
      throw new AppError(400, "Quest can only be edited while DRAFT or POSTED");
    }

    const updated = await QuestModel.findOneAndUpdate(
      { _id: questId, createdBy: npcUserId },
      { $set: data },
      { new: true }
    ).exec();

    if (!updated) throw new AppError(404, "Quest not found");
    return updated;
  }

  async deleteQuestForNpc(npcUserId: string, questId: string): Promise<void> {
    const quest = await this.getQuestForNpc(npcUserId, questId);

    if (!canDeleteQuest(quest.status)) {
      throw new AppError(400, "Quest can only be deleted while DRAFT");
    }

    await QuestModel.deleteOne({ _id: questId, createdBy: npcUserId }).exec();
  }

  // ✅ IMPORTANT: accept the parsed object { status } (matches controller)
  async updateStatusForNpc(
    npcUserId: string,
    questId: string,
    input: UpdateQuestStatusInput
  ): Promise<IQuest> {
    const quest = await this.getQuestForNpc(npcUserId, questId);
    const nextStatus = input.status as QuestStatus;

    assertNpcStatusTransition(quest.status, nextStatus);

    const updated = await QuestModel.findOneAndUpdate(
      { _id: questId, createdBy: npcUserId },
      { $set: { status: nextStatus } },
      { new: true }
    ).exec();

    if (!updated) throw new AppError(404, "Quest not found");
    return updated;
  }
}

export const questService = new QuestService();

