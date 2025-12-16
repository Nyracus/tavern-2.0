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

// Adventurer / NPC browse quests (optionally filter by status)
export const listQuests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.query;
    const filter: any = {};
    if (status) {
      filter.status = status;
    }
    const quests = await Quest.find(filter).sort({ createdAt: -1 }).exec();
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
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ success: true, data: quests });
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
      .sort({ createdAt: -1 })
      .exec();

    return res.json({ success: true, data: quests });
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
    quest.status = "Paid";
    quest.paidAt = now;
    quest.paidGold =
      typeof amount === "number" && !Number.isNaN(amount)
        ? amount
        : quest.rewardGold;

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


