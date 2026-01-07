// src/controllers/npcProfile.controller.ts
import { Response, NextFunction } from "express";
import { createNPCProfileSchema, updateNPCProfileSchema } from "../schemas/npcProfile.schema";
import { npcProfileService } from "../services/npcProfile.service";
import { AppError } from "../middleware/error.middleware";
import { AuthRequest } from "../middleware/auth.middleware";
import { AnomalyModel } from "../models/anomaly.model";
import { Types } from "mongoose";

export class NPCProfileController {
  async getMyProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const profile = await npcProfileService.getMyProfile(req.userId);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: "No NPC profile found for this user",
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

      const parsed = createNPCProfileSchema.parse(req.body);
      const profile = await npcProfileService.createProfileForUser(
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

      const parsed = updateNPCProfileSchema.parse(req.body);
      
      // Get old profile to detect changes
      const oldProfile = await npcProfileService.getMyProfile(req.userId);
      
      const profile = await npcProfileService.updateProfileForUser(
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
        if (parsed.organization !== undefined && parsed.organization !== oldProfile.organization) {
          changes.push("organization");
        }
        if (parsed.location !== undefined && parsed.location !== oldProfile.location) {
          changes.push("location");
        }

        if (changes.length > 0) {
          await AnomalyModel.create({
            subjectUserId: new Types.ObjectId(req.userId),
            subjectRole: "NPC",
            type: "PROFILE_EDITED",
            severity: "MEDIUM",
            summary: `NPC ${req.userId} edited their profile. Changed fields: ${changes.join(", ")}.`,
            details: `Profile changes detected: ${changes.join(", ")}. Original values may have been modified.`,
          });
        }
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
}

export const npcProfileController = new NPCProfileController();

