// src/controllers/quest.controller.ts
import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { Quest } from "../models/quest.model";
import { AuthRequest } from "../middleware/auth.middleware";
import { AnomalyModel } from "../models/anomaly.model";
import type { Role } from "../models/user.model";

// Helper to create a quest-related anomaly
async function createQuestAnomaly(options: {
  subjectUserId: Types.ObjectId;
  subjectRole: Role;
  type: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  details?: string;
  questId: Types.ObjectId;
}) {
  await AnomalyModel.create({
    subjectUserId: options.subjectUserId,
    subjectRole: options.subjectRole,
    type: options.type,
    severity: options.severity,
    summary: options.summary,
    details: options.details,
    questId: options.questId,
  });
}

// NPC creates a new quest
export const createQuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { title, description, difficulty, rewardGold, deadline } = req.body;

    const quest = await Quest.create({
      title,
      description,
      difficulty,
      rewardGold,
      deadline,
      npcId: new Types.ObjectId(req.userId),
      status: "Open",
    });

    return res.status(201).json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// Adventurer / NPC browse quests with search and filtering
export const listQuests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      status,
      difficulty,
      minReward,
      maxReward,
      search,
      sortBy,
      sortOrder,
      limit,
    } = req.query;

    const filter: any = {};

    // Status filter
    if (status) {
      filter.status = status;
    }

    // Difficulty filter (can be comma-separated)
    if (difficulty) {
      const difficulties = String(difficulty).split(",");
      filter.difficulty = { $in: difficulties };
    }

    // Reward range filter
    if (minReward || maxReward) {
      filter.rewardGold = {};
      if (minReward) {
        filter.rewardGold.$gte = Number(minReward);
      }
      if (maxReward) {
        filter.rewardGold.$lte = Number(maxReward);
      }
    }

    // Search filter (title or description)
    if (search) {
      const searchRegex = { $regex: String(search), $options: "i" };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // Build query
    let query = Quest.find(filter).populate("npcId", "username displayName");

    // Sorting
    const sortField = sortBy || "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;
    query = query.sort({ [String(sortField)]: sortDirection });

    // Limit
    if (limit) {
      query = query.limit(Number(limit));
    }

    const quests = await query.exec();
    return res.json({ success: true, data: quests });
  } catch (err) {
    next(err);
  }
};

// Adventurer applies to an open quest
export const applyToQuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId } = req.params;
    const { note } = req.body as { note?: string };

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (quest.status !== "Open" && quest.status !== "Applied") {
      return res.status(400).json({
        success: false,
        message: "You can only apply to quests that are open for applications.",
      });
    }

    const alreadyApplied = quest.applications.some(
      (app) => app.adventurerId.toString() === req.userId
    );
    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: "You have already applied to this quest.",
      });
    }

    quest.applications.push({
      _id: new Types.ObjectId(),
      adventurerId: new Types.ObjectId(req.userId),
      note,
      status: "PENDING",
      createdAt: new Date(),
    });

    quest.status = "Applied";

    await quest.save();

    // Notify NPC about new application
    const { notificationService } = await import("../services/notification.service");
    const { UserModel } = await import("../models/user.model");
    const adventurer = await UserModel.findById(req.userId).exec();
    if (adventurer && quest.npcId) {
      const newApp = quest.applications[quest.applications.length - 1];
      await notificationService.notifyQuestApplicationReceived(
        String(quest.npcId),
        String(quest._id),
        String(newApp._id),
        adventurer.displayName || adventurer.username,
        quest.title
      );
    }

    return res.status(201).json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// NPC lists their own posted quests
export const listMyPostedQuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const quests = await Quest.find({ npcId: req.userId })
      .populate("applications.adventurerId", "username displayName")
      .populate("adventurerId", "username displayName")
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ success: true, data: quests });
  } catch (err) {
    next(err);
  }
};

// NPC updates their quest (only if status is Open)
export const updateQuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId } = req.params;
    const { title, description, difficulty, rewardGold, deadline } = req.body;

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (quest.npcId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (quest.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Can only edit quests with status 'Open'",
      });
    }

    if (title !== undefined) quest.title = title;
    if (description !== undefined) quest.description = description;
    if (difficulty !== undefined) quest.difficulty = difficulty;
    if (rewardGold !== undefined) quest.rewardGold = rewardGold;
    if (deadline !== undefined) quest.deadline = deadline ? new Date(deadline) : undefined;

    await quest.save();

    return res.json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// NPC deletes their quest (only if status is Open)
export const deleteQuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId } = req.params;

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (quest.npcId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (quest.status !== "Open") {
      return res.status(400).json({
        success: false,
        message: "Can only delete quests with status 'Open'",
      });
    }

    await Quest.findByIdAndDelete(questId).exec();

    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// Adventurer lists quests they have applied to
export const listMyApplications = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const quests = await Quest.find({
      "applications.adventurerId": req.userId,
    })
      .populate("npcId", "username displayName")
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ success: true, data: quests });
  } catch (err) {
    next(err);
  }
};

// Quest recommendation engine: matches quests to adventurer rank (SSS to F)
export const getRecommendedQuests = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    // Get adventurer profile to determine rank
    const { AdventurerProfileModel } = await import("../models/adventurerProfile.model");
    const profile = await AdventurerProfileModel.findOne({ userId: req.userId }).lean<any>();
    
    if (!profile) {
      // No profile = rank F, can only do Easy quests
      const easyQuests = await Quest.find({ status: "Open", difficulty: "Easy" })
        .populate("npcId", "username displayName")
        .sort({ createdAt: -1 })
        .limit(10)
        .exec();
      
      return res.json({
        success: true,
        data: easyQuests.map((q: any) => ({
          ...q.toObject(),
          recommendationRank: "F",
          recommendationScore: 0.5,
        })),
      });
    }

    const adventurerRank = profile.rank || "F";
    const adventurerXP = profile.xp || 0;
    const adventurerLevel = profile.level || 1;

    // Get all open quests
    const allQuests = await Quest.find({ status: "Open" })
      .populate("npcId", "username displayName")
      .exec();

    // Rank to difficulty mapping and scoring
    const rankDifficultyMap: Record<string, { difficulties: string[]; baseScore: number }> = {
      F: { difficulties: ["Easy"], baseScore: 0.6 },
      E: { difficulties: ["Easy"], baseScore: 0.7 },
      D: { difficulties: ["Easy", "Medium"], baseScore: 0.75 },
      C: { difficulties: ["Easy", "Medium"], baseScore: 0.8 },
      B: { difficulties: ["Medium", "Hard"], baseScore: 0.85 },
      A: { difficulties: ["Hard"], baseScore: 0.9 },
      S: { difficulties: ["Hard", "Epic"], baseScore: 0.95 },
      SS: { difficulties: ["Epic"], baseScore: 0.98 },
      SSS: { difficulties: ["Epic"], baseScore: 1.0 },
    };

    const rankConfig = rankDifficultyMap[adventurerRank] || rankDifficultyMap.F;

    // Score each quest
    const scoredQuests = allQuests.map((quest: any) => {
      const questObj = quest.toObject();
      let score = 0;
      let matchRank = "F";

      // Check if quest difficulty matches adventurer rank
      if (rankConfig.difficulties.includes(quest.difficulty)) {
        score = rankConfig.baseScore;
        matchRank = adventurerRank;

        // Bonus for perfect match
        if (quest.difficulty === "Easy" && adventurerRank === "F") score += 0.2;
        if (quest.difficulty === "Medium" && ["D", "C"].includes(adventurerRank)) score += 0.15;
        if (quest.difficulty === "Hard" && ["B", "A", "S"].includes(adventurerRank)) score += 0.1;
        if (quest.difficulty === "Epic" && ["S", "SS", "SSS"].includes(adventurerRank)) score += 0.1;

        // Level-based bonus (higher level = better match for harder quests)
        if (quest.difficulty === "Epic" && adventurerLevel >= 10) score += 0.1;
        if (quest.difficulty === "Hard" && adventurerLevel >= 7) score += 0.05;
        if (quest.difficulty === "Medium" && adventurerLevel >= 5) score += 0.05;
      } else {
        // Quest is too easy or too hard
        const difficultyOrder = ["Easy", "Medium", "Hard", "Epic"];
        const rankOrder = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
        
        const questDiffIndex = difficultyOrder.indexOf(quest.difficulty);
        const rankDiffIndex = rankOrder.indexOf(adventurerRank);
        
        // Too easy: lower score
        if (questDiffIndex < rankDiffIndex / 2) {
          score = 0.3;
          matchRank = "F";
        }
        // Too hard: very low score
        else if (questDiffIndex > rankDiffIndex + 1) {
          score = 0.1;
          matchRank = "F";
        }
        // Close but not perfect
        else {
          score = 0.4;
          matchRank = adventurerRank;
        }
      }

      // Reward gold bonus (higher rewards = slightly better match)
      if (quest.rewardGold) {
        const goldBonus = Math.min(quest.rewardGold / 1000, 0.1);
        score += goldBonus;
      }

      return {
        ...questObj,
        recommendationScore: Math.min(score, 1.0),
        recommendationRank: matchRank,
      };
    });

    // Sort by recommendation score (highest first)
    scoredQuests.sort((a, b) => b.recommendationScore - a.recommendationScore);

    // Return top 20 recommendations
    return res.json({
      success: true,
      data: scoredQuests.slice(0, 20),
    });
  } catch (err) {
    next(err);
  }
};

// NPC accepts or rejects an adventurer application
export const decideApplication = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId, applicationId } = req.params;
    const { decision, deadline } = req.body as {
      decision: "ACCEPT" | "REJECT";
      deadline?: string;
    };

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (quest.npcId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const application = quest.applications.id(applicationId as any);
    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found",
      });
    }

    if (decision === "REJECT") {
      application.status = "REJECTED";
      await quest.save();
      return res.json({ success: true, data: quest });
    }

    // ACCEPT
    application.status = "ACCEPTED";
    quest.adventurerId = application.adventurerId;
    quest.status = "Accepted";
    if (deadline) {
      quest.deadline = new Date(deadline);
    }

    // Reject all other applications
    quest.applications.forEach((app) => {
      if (app._id.toString() !== applicationId) {
        app.status = "REJECTED";
      }
    });

    await quest.save();

    // Notify adventurer about decision
    const { notificationService } = await import("../services/notification.service");
    if (decision === "ACCEPT") {
      await notificationService.notifyQuestApplicationAccepted(
        String(application.adventurerId),
        String(quest._id),
        quest.title,
        quest.deadline
      );
    } else {
      await notificationService.notifyQuestApplicationRejected(
        String(application.adventurerId),
        String(quest._id),
        quest.title
      );
    }

    return res.json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// Adventurer submits quest completion with optional report URL (PDF link)
export const submitCompletion = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId } = req.params;
    const { reportUrl } = req.body as { reportUrl?: string };

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (!quest.adventurerId || quest.adventurerId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned adventurer can submit completion.",
      });
    }

    if (quest.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted quests can be marked as completed.",
      });
    }

    const now = new Date();
    quest.status = "Completed";
    quest.completionSubmittedAt = now;
    quest.completionReportUrl = reportUrl;

    // Deadline anomaly: completion after deadline
    if (quest.deadline && now > quest.deadline) {
      await createQuestAnomaly({
        subjectUserId: quest.adventurerId!,
        subjectRole: "ADVENTURER",
        type: "QUEST_DEADLINE_MISSED",
        severity: "HIGH",
        summary: "Quest completed after the agreed deadline.",
        details: `Quest ${quest.title} was submitted on ${now.toISOString()} after deadline ${quest.deadline.toISOString()}.`,
        questId: quest._id,
      });
    }

    await quest.save();

    // Notify NPC about completion submission
    const { notificationService } = await import("../services/notification.service");
    const { UserModel } = await import("../models/user.model");
    const adventurer = await UserModel.findById(req.userId).exec();
    if (adventurer && quest.npcId) {
      await notificationService.notifyQuestCompletionSubmitted(
        String(quest.npcId),
        String(quest._id),
        adventurer.displayName || adventurer.username,
        quest.title
      );
    }

    return res.json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// NPC marks quest as paid and optionally triggers delayed-payment anomaly
export const payQuest = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthenticated" });
    }

    const { questId } = req.params;
    const { amount } = req.body as { amount?: number };

    const quest = await Quest.findById(questId).exec();
    if (!quest) {
      return res
        .status(404)
        .json({ success: false, message: "Quest not found" });
    }

    if (quest.npcId.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    if (quest.status !== "Completed") {
      return res.status(400).json({
        success: false,
        message: "Only completed quests can be paid out.",
      });
    }

    const now = new Date();
    const paymentAmount =
      typeof amount === "number" && !Number.isNaN(amount)
        ? amount
        : quest.rewardGold || 0;
    
    quest.status = "Paid";
    quest.paidAt = now;
    quest.paidGold = paymentAmount;

    // Award gold to adventurer
    if (quest.adventurerId) {
      const { UserModel } = await import("../models/user.model");
      const adventurer = await UserModel.findById(quest.adventurerId).exec();
      if (adventurer) {
        adventurer.gold = (adventurer.gold || 0) + paymentAmount;
        await adventurer.save();
      }
    }

    // Delayed payment anomaly: payment more than 24h after completion
    if (quest.completionSubmittedAt) {
      const diffMs = now.getTime() - quest.completionSubmittedAt.getTime();
      const dayMs = 24 * 60 * 60 * 1000;
      if (diffMs > dayMs) {
        await createQuestAnomaly({
          subjectUserId: quest.npcId,
          subjectRole: "NPC",
          type: "QUEST_PAYMENT_DELAYED",
          severity: "MEDIUM",
          summary: "Quest payment was delayed beyond 24 hours.",
          details: `Quest ${quest.title} was paid on ${now.toISOString()}, more than 24h after completion.`,
          questId: quest._id,
        });
      }
    }

    await quest.save();

    return res.json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};


