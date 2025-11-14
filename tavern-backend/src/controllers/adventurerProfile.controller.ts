// src/controllers/adventurerProfile.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  addSkillSchema,
  createAdventurerProfileSchema,
  updateAdventurerProfileSchema,
  updateSkillSchema,
} from '../schemas/adventurerProfile.schema';
import { adventurerProfileService } from '../services/adventurerProfile.service';
import { AppError } from '../middleware/error.middleware';

export class AdventurerProfileController {
  async getMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const profile = await adventurerProfileService.getMyProfile(req.user.id);
      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'No adventurer profile found for this user',
        });
      }

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async createMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const parsed = createAdventurerProfileSchema.parse(req.body);
      const profile = await adventurerProfileService.createProfileForUser(
        req.user.id,
        parsed
      );

      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateMyProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const parsed = updateAdventurerProfileSchema.parse(req.body);
      const profile = await adventurerProfileService.updateProfileForUser(
        req.user.id,
        parsed
      );

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async addSkill(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const parsed = addSkillSchema.parse(req.body);
      const profile = await adventurerProfileService.addSkill(
        req.user.id,
        parsed
      );

      res.status(201).json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async updateSkill(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const { skillId } = req.params;
      const parsed = updateSkillSchema.parse(req.body);

      const profile = await adventurerProfileService.updateSkill(
        req.user.id,
        skillId,
        parsed
      );

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }

  async deleteSkill(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, 'Not authenticated');
      }

      const { skillId } = req.params;
      const profile = await adventurerProfileService.deleteSkill(
        req.user.id,
        skillId
      );

      res.json({ success: true, data: profile });
    } catch (err) {
      next(err);
    }
  }
}

export const adventurerProfileController = new AdventurerProfileController();
