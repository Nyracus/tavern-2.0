// src/controllers/adventurerProfile.controller.ts
import { Response, NextFunction } from "express";
import {
  addSkillSchema,
  createAdventurerProfileSchema,
  updateAdventurerProfileSchema,
  updateSkillSchema,
} from "../schemas/adventurerProfile.schema";
import { adventurerProfileService } from "../services/adventurerProfile.service";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { AdventurerProfileModel } from "../models/adventurerProfile.model";
import { AnomalyModel } from "../models/anomaly.model";
import { Types } from "mongoose";

// Helper: compute rank from xp
const calculateRank = (xp: number): string => {
  if (xp >= 5000) return "SSS";
  if (xp >= 3000) return "SS";
  if (xp >= 2000) return "S";
  if (xp >= 1500) return "A";
  if (xp >= 1000) return "B";
  if (xp >= 700) return "C";
  if (xp >= 400) return "D";
  if (xp >= 200) return "E";
  return "F";
};

// Helper used by quest.controller to award XP
export const addXP = async (userId: string, earnedXP: number) => {
  const profile = await AdventurerProfileModel.findOne({ userId });
  if (!profile) {
    throw new Error("Adventurer profile not found");
  }

  // use `any` so TS doesn't complain about xp/rank not being in the interface yet
  const p: any = profile;
  const currentXp = p.xp ?? 0;
  const currentRank = p.rank ?? "F";
  const newXp = currentXp + earnedXP;
  const newRank = calculateRank(newXp);

  p.xp = newXp;
  p.rank = newRank;

  // Grant stat points for rank ups (1 point per rank gained)
  const rankOrder = ["F", "E", "D", "C", "B", "A", "S", "SS", "SSS"];
  const currentRankIndex = rankOrder.indexOf(currentRank);
  const newRankIndex = rankOrder.indexOf(newRank);
  const ranksGained = newRankIndex - currentRankIndex;
  
  if (ranksGained > 0) {
    p.availableStatPoints = (p.availableStatPoints ?? 0) + ranksGained;
  }

  await profile.save();
  return profile;
};

export class AdventurerProfileController {
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const profile = await adventurerProfileService.getMyProfile(req.userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "No adventurer profile found for this user",
        });
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async createMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const parsed = createAdventurerProfileSchema.parse(req.body);
      const profile = await adventurerProfileService.createProfileForUser(
        req.userId,
        parsed
      );

      // Mark onboarding complete for newly registered users
      const { UserModel } = await import("../models/user.model");
      await UserModel.findByIdAndUpdate(req.userId, { $set: { needsProfileSetup: false } }).exec();

      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const parsed = updateAdventurerProfileSchema.parse(req.body);
      
      // Get old profile to detect changes
      const oldProfile = await adventurerProfileService.getMyProfile(req.userId);
      
      const profile = await adventurerProfileService.updateProfileForUser(
        req.userId,
        parsed
      );

      // Create anomaly if profile was edited
      if (oldProfile) {
        const changes: string[] = [];
        if (parsed.title !== undefined && parsed.title !== oldProfile.title) {
          changes.push("title");
        }
        if (parsed.summary !== undefined && parsed.summary !== oldProfile.summary) {
          changes.push("summary");
        }
        if (parsed.race !== undefined && parsed.race !== oldProfile.race) {
          changes.push("race");
        }
        if (parsed.background !== undefined && parsed.background !== oldProfile.background) {
          changes.push("background");
        }
        if (parsed.attributes !== undefined) {
          const attrChanges: string[] = [];
          if (parsed.attributes.strength !== undefined && parsed.attributes.strength !== oldProfile.attributes.strength) {
            attrChanges.push("strength");
          }
          if (parsed.attributes.dexterity !== undefined && parsed.attributes.dexterity !== oldProfile.attributes.dexterity) {
            attrChanges.push("dexterity");
          }
          if (parsed.attributes.intelligence !== undefined && parsed.attributes.intelligence !== oldProfile.attributes.intelligence) {
            attrChanges.push("intelligence");
          }
          if (parsed.attributes.charisma !== undefined && parsed.attributes.charisma !== oldProfile.attributes.charisma) {
            attrChanges.push("charisma");
          }
          if (parsed.attributes.vitality !== undefined && parsed.attributes.vitality !== oldProfile.attributes.vitality) {
            attrChanges.push("vitality");
          }
          if (parsed.attributes.luck !== undefined && parsed.attributes.luck !== oldProfile.attributes.luck) {
            attrChanges.push("luck");
          }
          if (attrChanges.length > 0) {
            changes.push(`attributes (${attrChanges.join(", ")})`);
          }
        }

        if (changes.length > 0) {
          await AnomalyModel.create({
            subjectUserId: new Types.ObjectId(req.userId),
            subjectRole: "ADVENTURER",
            type: "PROFILE_EDITED",
            severity: "MEDIUM",
            summary: `Adventurer ${req.userId} edited their profile. Changed fields: ${changes.join(", ")}.`,
            details: `Profile changes detected: ${changes.join(", ")}. Original values may have been modified.`,
          });
        }
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async addSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const parsed = addSkillSchema.parse(req.body);
      const profile = await adventurerProfileService.addSkill(
        req.userId,
        parsed
      );

      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const { skillId } = req.params;
      const parsed = updateSkillSchema.parse(req.body);

      const profile = await adventurerProfileService.updateSkill(
        req.userId,
        skillId,
        parsed
      );

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async deleteSkill(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const { skillId } = req.params;
      const profile = await adventurerProfileService.deleteSkill(
        req.userId,
        skillId
      );

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  // Allocate stat point to strength, dexterity, or intelligence
  async allocateStatPoint(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const { stat } = req.body as { stat: "strength" | "dexterity" | "intelligence" };
      
      if (!stat || !["strength", "dexterity", "intelligence"].includes(stat)) {
        throw new AppError(400, "Invalid stat. Must be 'strength', 'dexterity', or 'intelligence'");
      }

      const profile = await AdventurerProfileModel.findOne({ userId: req.userId });
      if (!profile) {
        throw new AppError(404, "Adventurer profile not found");
      }

      const p: any = profile;
      const availablePoints = p.availableStatPoints ?? 0;

      if (availablePoints < 1) {
        throw new AppError(400, "No available stat points to allocate");
      }

      // Check if stat is at max (20)
      const currentStatValue = p.attributes[stat];
      if (currentStatValue >= 20) {
        throw new AppError(400, `${stat} is already at maximum (20)`);
      }

      // Allocate the stat point
      p.attributes[stat] = currentStatValue + 1;
      p.availableStatPoints = availablePoints - 1;

      await profile.save();

      res.json({ 
        success: true, 
        data: profile,
        message: `+1 ${stat} allocated! ${p.availableStatPoints} stat point(s) remaining.`
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adventurerProfileController = new AdventurerProfileController();
