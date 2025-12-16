import { Types } from "mongoose";
import { AnomalyModel, AnomalyDocument, AnomalyStatus } from "../models/anomaly.model";
import { UserModel } from "../models/user.model";
import { Quest } from "../models/quest.model";

export class AnomalyService {
  /**
   * Scan the world for anomalies in NPC/Adventurer behavior.
   * This is intentionally simple and heuristic-based for now.
   */
  async scanAll(): Promise<AnomalyDocument[]> {
    const anomalies: AnomalyDocument[] = [];

    // Example heuristic 1: NPCs with no quests posted in a long time
    const npcs = await UserModel.find({ role: "NPC" }).exec();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    for (const npc of npcs) {
      const recentQuest = await Quest.findOne({
        npcId: npc._id,
        createdAt: { $gte: oneWeekAgo },
      }).exec();

      if (!recentQuest) {
        const doc = await AnomalyModel.create({
          subjectUserId: npc._id as Types.ObjectId,
          subjectRole: npc.role,
          type: "NPC_INACTIVE",
          severity: "MEDIUM",
          summary: `NPC ${npc.username} has not posted any quests in over a week.`,
          details: `No quests found for NPC ${npc.username} since ${oneWeekAgo.toISOString()}.`,
        });
        anomalies.push(doc);
      }
    }

    // Example heuristic 2: Adventurers with many active quests (possible burnout)
    const adventurers = await UserModel.find({ role: "ADVENTURER" }).exec();

    for (const adv of adventurers) {
      const activeQuestsCount = await Quest.countDocuments({
        adventurerId: adv._id,
        status: { $in: ["Open", "Accepted"] },
      }).exec();

      if (activeQuestsCount >= 5) {
        const doc = await AnomalyModel.create({
          subjectUserId: adv._id as Types.ObjectId,
          subjectRole: adv.role,
          type: "ADVENTURER_OVERWORKED",
          severity: activeQuestsCount >= 8 ? "CRITICAL" : "HIGH",
          summary: `Adventurer ${adv.username} has ${activeQuestsCount} active quests.`,
          details: `Adventurer ${adv.username} currently has ${activeQuestsCount} quests with status Open/Accepted.`,
        });
        anomalies.push(doc);
      }
    }

    return anomalies;
  }

  /**
   * Scan for quests with passed deadlines that haven't been completed
   */
  async scanDeadlineAnomalies(): Promise<AnomalyDocument[]> {
    const anomalies: AnomalyDocument[] = [];
    const now = new Date();

    // Find all accepted quests with deadlines that have passed
    const overdueQuests = await Quest.find({
      status: "Accepted",
      deadline: { $exists: true, $lt: now },
    })
      .populate("adventurerId", "username displayName")
      .exec();

    for (const quest of overdueQuests) {
      // Check if anomaly already exists for this quest
      const existingAnomaly = await AnomalyModel.findOne({
        questId: quest._id,
        type: "QUEST_DEADLINE_PASSED",
        status: { $in: ["OPEN", "ACKNOWLEDGED"] },
      }).exec();

      if (!existingAnomaly && quest.adventurerId) {
        const doc = await AnomalyModel.create({
          subjectUserId: quest.adventurerId._id as Types.ObjectId,
          subjectRole: "ADVENTURER",
          type: "QUEST_DEADLINE_PASSED",
          severity: "HIGH",
          summary: `Quest "${quest.title}" deadline has passed without completion.`,
          details: `Quest deadline was ${quest.deadline?.toISOString()}, but quest is still not completed.`,
          questId: quest._id,
        });
        anomalies.push(doc);
      }
    }

    return anomalies;
  }

  async listAll(): Promise<AnomalyDocument[]> {
    return AnomalyModel.find().sort({ createdAt: -1 }).populate("subjectUserId").exec();
  }

  async updateStatus(id: string, status: AnomalyStatus): Promise<AnomalyDocument | null> {
    return AnomalyModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    )
      .populate("subjectUserId")
      .exec();
  }
}

export const anomalyService = new AnomalyService();


