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

    // Create quest without escrow (NPCs don't need to escrow upfront)
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
    // Note: NPC name search will be done after populating npcId
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
    
    // Transform quests to include npcName and filter by NPC name if search includes it
    let transformed = quests.map((quest: any) => {
      const questObj = quest.toObject();
      const npcName = questObj.npcId?.displayName || questObj.npcId?.username || "Unknown NPC";
      return {
        ...questObj,
        npcName,
      };
    });
    
    // Filter by NPC name if search is provided (post-population filtering)
    if (search) {
      const searchLower = String(search).toLowerCase();
      transformed = transformed.filter((quest: any) => {
        // Check title, description, and NPC name
        const titleMatch = quest.title?.toLowerCase().includes(searchLower);
        const descMatch = quest.description?.toLowerCase().includes(searchLower);
        const npcNameMatch = quest.npcName?.toLowerCase().includes(searchLower);
        const npcUsernameMatch = quest.npcId?.username?.toLowerCase().includes(searchLower);
        const npcDisplayNameMatch = quest.npcId?.displayName?.toLowerCase().includes(searchLower);
        
        return titleMatch || descMatch || npcNameMatch || npcUsernameMatch || npcDisplayNameMatch;
      });
    }
    
    return res.json({ success: true, data: transformed });
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
      .populate("npcId", "username displayName")
      .sort({ createdAt: -1 })
      .exec();

    // Transform to include npcName
    const transformed = quests.map((quest: any) => {
      const questObj = quest.toObject();
      const npcName = questObj.npcId?.displayName || questObj.npcId?.username || "Unknown NPC";
      return {
        ...questObj,
        npcName,
      };
    });

    return res.json({ success: true, data: transformed });
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

    // Allow editing Open quests normally (no applicants = no anomaly)
    if (quest.status === "Open") {
      const hasApplicants = quest.applications && quest.applications.length > 0;
      
      if (title !== undefined) quest.title = title;
      if (description !== undefined) quest.description = description;
      if (difficulty !== undefined) quest.difficulty = difficulty;
      if (rewardGold !== undefined) quest.rewardGold = rewardGold;
      if (deadline !== undefined) quest.deadline = deadline ? new Date(deadline) : undefined;

      await quest.save();

      // If quest has applicants, create anomaly
      if (hasApplicants) {
        const changes: string[] = [];
        if (title !== undefined) changes.push("title");
        if (description !== undefined) changes.push("description");
        if (difficulty !== undefined) changes.push("difficulty");
        if (rewardGold !== undefined) changes.push("rewardGold");
        if (deadline !== undefined) changes.push("deadline");

        if (changes.length > 0) {
          await createQuestAnomaly({
            subjectUserId: quest.npcId as Types.ObjectId,
            subjectRole: "NPC",
            type: "QUEST_EDITED_WITH_APPLICANTS",
            severity: "HIGH",
            summary: `NPC edited quest "${quest.title}" while it has ${quest.applications.length} applicant(s). Changed fields: ${changes.join(", ")}.`,
            details: `Quest ID: ${quest._id}. Changes: ${changes.join(", ")}. This may affect applicants who have already applied.`,
            questId: quest._id as Types.ObjectId,
          });
        }
      }

      return res.json({ success: true, data: quest });
    }

    // Allow editing Applied quests (has applicants = trigger anomaly)
    if (quest.status === "Applied") {
      const changes: string[] = [];
      
      if (title !== undefined) {
        quest.title = title;
        changes.push("title");
      }
      if (description !== undefined) {
        quest.description = description;
        changes.push("description");
      }
      if (difficulty !== undefined) {
        quest.difficulty = difficulty;
        changes.push("difficulty");
      }
      if (rewardGold !== undefined) {
        quest.rewardGold = rewardGold;
        changes.push("rewardGold");
      }
      if (deadline !== undefined) {
        quest.deadline = deadline ? new Date(deadline) : undefined;
        changes.push("deadline");
      }

      await quest.save();

      // Always create anomaly for Applied quests (they have applicants)
      if (changes.length > 0) {
        await createQuestAnomaly({
          subjectUserId: quest.npcId as Types.ObjectId,
          subjectRole: "NPC",
          type: "QUEST_EDITED_WITH_APPLICANTS",
          severity: "HIGH",
          summary: `NPC edited quest "${quest.title}" while it has ${quest.applications.length} applicant(s). Changed fields: ${changes.join(", ")}.`,
          details: `Quest ID: ${quest._id}. Changes: ${changes.join(", ")}. This may affect applicants who have already applied.`,
          questId: quest._id as Types.ObjectId,
        });
      }

      return res.json({ success: true, data: quest });
    }

    // For Accepted quests, track changes (adventurer can raise conflict if changed)
    if (quest.status === "Accepted") {
      const changesDetected: string[] = [];

      if (description !== undefined && description !== quest.originalDescription) {
        quest.description = description;
        changesDetected.push("description");
      }
      if (deadline !== undefined) {
        const newDeadline = deadline ? new Date(deadline) : undefined;
        if (newDeadline?.getTime() !== quest.originalDeadline?.getTime()) {
          quest.deadline = newDeadline;
          changesDetected.push("deadline");
        }
      }

      // Note: Title, difficulty, and rewardGold changes are not allowed after acceptance
      if (title !== undefined || difficulty !== undefined || rewardGold !== undefined) {
        return res.status(400).json({
          success: false,
          message: "Cannot change title, difficulty, or reward after quest acceptance",
        });
      }

      await quest.save();

      return res.json({
        success: true,
        data: quest,
        changesDetected: changesDetected.length > 0 ? changesDetected : undefined,
      });
    }

    return res.status(400).json({
      success: false,
      message: "Can only edit quests with status 'Open', 'Applied', or 'Accepted'",
    });
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
        data: easyQuests.map((q: any) => {
          const questObj = q.toObject();
          const npcName = questObj.npcId?.displayName || questObj.npcId?.username || "Unknown NPC";
          return {
            ...questObj,
            npcName,
            recommendationRank: "F",
            recommendationScore: 0.5,
          };
        }),
      });
    }

    const adventurerRank = profile.rank || "F";
    const adventurerXP = profile.xp || 0;
    const adventurerClass = (profile.class || "").toLowerCase();

    // Get all open quests
    const allQuests = await Quest.find({ status: "Open" })
      .populate("npcId", "username displayName")
      .exec();

    // Class-based quest category mapping (D&D inspired)
    const classQuestMapping: Record<string, string[]> = {
      "archer": ["ranged", "scouting", "hunting", "tracking", "stealth"],
      "ranger": ["ranged", "scouting", "hunting", "tracking", "stealth", "survival"],
      "mage": ["magic", "arcane", "enchanting", "research", "spellcasting"],
      "wizard": ["magic", "arcane", "enchanting", "research", "spellcasting", "alchemy"],
      "sorcerer": ["magic", "arcane", "spellcasting", "elemental"],
      "fighter": ["combat", "melee", "defense", "guard", "warfare"],
      "warrior": ["combat", "melee", "defense", "guard", "warfare", "tactics"],
      "paladin": ["combat", "defense", "holy", "protection", "healing"],
      "rogue": ["stealth", "thievery", "assassination", "lockpicking", "trap"],
      "thief": ["stealth", "thievery", "lockpicking", "trap", "pickpocket"],
      "cleric": ["healing", "holy", "protection", "support", "divine"],
      "bard": ["performance", "diplomacy", "entertainment", "information", "support"],
      "druid": ["nature", "healing", "survival", "animal", "elemental"],
      "monk": ["combat", "martial", "meditation", "discipline", "speed"],
      "barbarian": ["combat", "melee", "rage", "strength", "endurance"],
    };

    // Normalize class name and get quest categories
    const normalizedClass = adventurerClass.replace(/\s+/g, "").toLowerCase();
    const preferredCategories = classQuestMapping[normalizedClass] || [];

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

        // XP-based bonus (higher XP = better match for harder quests)
        if (quest.difficulty === "Epic" && adventurerXP >= 1000) score += 0.1;
        if (quest.difficulty === "Hard" && adventurerXP >= 700) score += 0.05;
        if (quest.difficulty === "Medium" && adventurerXP >= 400) score += 0.05;
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

      // Class-based bonus: check if quest title/description matches class preferences
      if (preferredCategories.length > 0) {
        const questText = `${quest.title} ${quest.description}`.toLowerCase();
        const classMatch = preferredCategories.some(cat => questText.includes(cat));
        if (classMatch) {
          score += 0.15; // Significant bonus for class-matched quests
        }
      }

      // Reward gold bonus (higher rewards = slightly better match)
      if (quest.rewardGold) {
        const goldBonus = Math.min(quest.rewardGold / 1000, 0.1);
        score += goldBonus;
      }

      const npcName = questObj.npcId?.displayName || questObj.npcId?.username || "Unknown NPC";
      return {
        ...questObj,
        npcName,
        recommendationScore: Math.min(score, 1.0),
        recommendationRank: matchRank,
        recommendedForClass: preferredCategories.length > 0 && preferredCategories.some(cat => 
          `${quest.title} ${quest.description}`.toLowerCase().includes(cat)
        ),
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

    const application = (quest.applications as any).id(applicationId);
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

    // Store original quest details for change detection (for conflict system)
    quest.originalDescription = quest.description;
    quest.originalDeadline = quest.deadline || undefined;

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

    // Check if deadline has passed - prevent submission after deadline
    const now = new Date();
    if (quest.deadline && now > quest.deadline) {
      return res.status(400).json({
        success: false,
        message: `Cannot submit completion after deadline. Deadline was ${quest.deadline.toLocaleString()}.`,
      });
    }

    quest.status = "Completed";
    quest.completionSubmittedAt = now;
    quest.completionReportUrl = reportUrl;

    // Note: Deadline check is done above - if deadline passed, submission is blocked
    // So we don't need to check for deadline anomalies here anymore

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

// Helper: Get XP reward based on quest difficulty
const getXPForDifficulty = (difficulty: string): number => {
  switch (difficulty) {
    case "Easy":
      return 100; // F rank quests
    case "Medium":
      return 200; // E rank quests
    case "Hard":
      return 400; // D rank quests
    case "Epic":
      return 800; // C+ rank quests
    default:
      return 100; // Default to Easy
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

    // Check if quest has conflict
    if (quest.hasConflict) {
      return res.status(400).json({
        success: false,
        message: "Cannot pay quest with active conflict. Please resolve conflict first.",
      });
    }

    const now = new Date();
    const paymentAmount =
      typeof amount === "number" && !Number.isNaN(amount)
        ? amount
        : quest.rewardGold || 0;

    // Pay adventurer directly (no escrow system for NPCs)
    quest.status = "Paid";
    quest.paidAt = now;
    quest.paidGold = paymentAmount;

    // Award gold to adventurer
    if (quest.adventurerId) {
      const { UserModel } = await import("../models/user.model");
      const adventurer = await UserModel.findById(quest.adventurerId).exec();
      if (adventurer) {
        const previousGold = adventurer.gold || 0;
        adventurer.gold = previousGold + paymentAmount;
        await adventurer.save();
        console.log(`[PAYMENT] Awarded ${paymentAmount} gold to adventurer ${quest.adventurerId}. Previous: ${previousGold}, New: ${adventurer.gold}`);

        // Create transaction record for payment
        const { transactionService } = await import("../services/transaction.service");
        await transactionService.createTransaction(
          String(quest._id),
          "ESCROW_RELEASE", // Keep transaction type for consistency, but it's just a payment now
          paymentAmount,
          String(quest.npcId),
          String(quest.adventurerId),
          `Payment for quest: ${quest.title}`,
          {}
        );

        // Send payment notification to adventurer
        const { notificationService } = await import("../services/notification.service");
        await notificationService.notifyQuestPaymentReceived(
          String(quest.adventurerId),
          String(quest._id),
          quest.title,
          paymentAmount
        );

        // Award XP based on quest difficulty and update rank
        const { addXP } = await import("./adventurerProfile.controller");
        const xpReward = getXPForDifficulty(quest.difficulty);
        try {
          await addXP(String(quest.adventurerId), xpReward);
          console.log(`[XP] Awarded ${xpReward} XP to adventurer ${quest.adventurerId} for completing ${quest.difficulty} quest: ${quest.title}`);
        } catch (xpError) {
          // Log error but don't fail the payment if XP award fails
          console.error(`[XP] Failed to award XP to adventurer ${quest.adventurerId}:`, xpError);
        }
      } else {
        console.error(`[PAYMENT] Adventurer not found: ${quest.adventurerId}`);
      }
    } else {
      console.error(`[PAYMENT] Quest ${quest._id} has no adventurerId assigned`);
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
          questId: quest._id as Types.ObjectId,
        });
      }
    }

    await quest.save();

    return res.json({ success: true, data: quest });
  } catch (err) {
    next(err);
  }
};

// Adventurer cancels an accepted quest (50% gold penalty)
export const cancelQuest = async (
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

    // Verify the adventurer is the one who accepted this quest
    if (!quest.adventurerId || quest.adventurerId.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: "Only the assigned adventurer can cancel this quest.",
      });
    }

    // Only allow cancellation of accepted quests
    if (quest.status !== "Accepted") {
      return res.status(400).json({
        success: false,
        message: "Only accepted quests can be cancelled.",
      });
    }

    // Calculate 50% penalty
    const rewardGold = quest.rewardGold || 0;
    const penaltyAmount = Math.floor(rewardGold * 0.5);

    // Get adventurer and deduct gold
    const { UserModel } = await import("../models/user.model");
    const adventurer = await UserModel.findById(req.userId).exec();
    if (!adventurer) {
      return res.status(404).json({
        success: false,
        message: "Adventurer not found",
      });
    }

    const currentGold = adventurer.gold || 0;
    
    // Check if adventurer has enough gold (or allow negative balance)
    // We'll allow negative balance but warn the user
    const newGold = currentGold - penaltyAmount;
    adventurer.gold = Math.max(0, newGold); // Don't allow negative gold, set to 0 if insufficient
    await adventurer.save();

    // Create transaction record for the penalty
    const { transactionService } = await import("../services/transaction.service");
    await transactionService.createTransaction(
      String(quest._id),
      "QUEST_CANCELLATION_PENALTY",
      penaltyAmount,
      String(req.userId), // fromUserId: adventurer
      undefined, // toUserId: no one receives this gold
      `Cancellation penalty for quest: ${quest.title} (50% of ${rewardGold} gold)`,
      { originalReward: rewardGold, penaltyPercentage: 50 }
    );

    // Update quest status to Cancelled
    quest.status = "Cancelled";
    quest.adventurerId = undefined; // Remove adventurer assignment
    await quest.save();

    // Notify NPC about cancellation
    const { notificationService } = await import("../services/notification.service");
    if (quest.npcId) {
      await notificationService.createNotification(
        String(quest.npcId),
        "QUEST_CANCELLED",
        "Quest Cancelled",
        `Adventurer ${adventurer.displayName || adventurer.username} cancelled quest "${quest.title}".`,
        { questId: String(quest._id) }
      );
    }

    // Create anomaly for quest cancellation
    await createQuestAnomaly({
      subjectUserId: new Types.ObjectId(req.userId),
      subjectRole: "ADVENTURER",
      type: "QUEST_CANCELLED_BY_ADVENTURER",
      severity: "MEDIUM",
      summary: `Adventurer ${adventurer.username} cancelled accepted quest "${quest.title}". Penalty: ${penaltyAmount} gold (50% of ${rewardGold} gold reward).`,
      details: `Quest was cancelled after being accepted. ${penaltyAmount} gold was deducted from adventurer's account. Adventurer's gold balance: ${adventurer.gold}.`,
      questId: quest._id as Types.ObjectId,
    });

    console.log(`[QUEST CANCELLATION] Adventurer ${req.userId} cancelled quest ${questId}. Penalty: ${penaltyAmount} gold. New balance: ${adventurer.gold}`);

    return res.json({
      success: true,
      data: quest,
      penalty: penaltyAmount,
      newGoldBalance: adventurer.gold,
      message: `Quest cancelled. ${penaltyAmount} gold (50% of reward) has been deducted from your account.`,
    });
  } catch (err) {
    next(err);
  }
};

// NPC rejects quest completion (allows adventurer to raise conflict)
export const rejectCompletion = async (
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
    const { reason } = req.body as { reason?: string };

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
        message: "Can only reject quests with status 'Completed'",
      });
    }

    // Revert quest status back to "Accepted" so adventurer can resubmit or raise conflict
    quest.status = "Accepted";
    quest.completionSubmittedAt = undefined;
    quest.completionReportUrl = undefined;
    await quest.save();

    // Notify adventurer about rejection
    const { notificationService } = await import("../services/notification.service");
    if (quest.adventurerId) {
      await notificationService.createNotification(
        String(quest.adventurerId),
        "QUEST_COMPLETION_REJECTED",
        "Quest Completion Rejected",
        `Your completion submission for "${quest.title}" was rejected. ${reason ? `Reason: ${reason}` : "You can resubmit or raise a conflict."}`,
        { questId: String(quest._id) }
      );
    }

    return res.json({ success: true, data: quest, message: "Completion rejected. Adventurer can resubmit or raise a conflict." });
  } catch (err) {
    next(err);
  }
};
