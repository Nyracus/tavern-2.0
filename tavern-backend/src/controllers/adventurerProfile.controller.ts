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

  // use `any` so TS doesn’t complain about xp/rank not being in the interface yet
  const p: any = profile;
  const currentXp = p.xp ?? 0;
  const newXp = currentXp + earnedXP;

  p.xp = newXp;
  p.rank = calculateRank(newXp);

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
      const profile = await adventurerProfileService.updateProfileForUser(
        req.userId,
        parsed
      );

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
}

export const adventurerProfileController = new AdventurerProfileController();
