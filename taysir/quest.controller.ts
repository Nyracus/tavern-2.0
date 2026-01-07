// src/controllers/quest.controller.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error.middleware';
import {
  createQuestSchema,
  updateQuestSchema,
  updateQuestStatusSchema,
} from '../schemas/quest.schema';
import { questService } from '../services/quest.service';

export class QuestController {
  // NPC: POST /quests/me
  async createMyQuest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const parsed = createQuestSchema.parse(req.body);
      const quest = await questService.createQuestForNpc(req.user.id, parsed);

      res.status(201).json({ success: true, data: quest });
    } catch (err) {
      next(err);
    }
  }

  // NPC: GET /quests/me
  async listMyQuests(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const quests = await questService.listQuestsForNpc(req.user.id);
      res.json({ success: true, data: quests });
    } catch (err) {
      next(err);
    }
  }

  // NPC: GET /quests/me/:id
  async getMyQuestById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const { id } = req.params;
      const quest = await questService.getQuestForNpc(req.user.id, id);
      res.json({ success: true, data: quest });
    } catch (err) {
      next(err);
    }
  }

  // NPC: PATCH /quests/me/:id
  async updateMyQuest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const { id } = req.params;
      const parsed = updateQuestSchema.parse(req.body);
      const quest = await questService.updateQuestForNpc(
        req.user.id,
        id,
        parsed
      );

      res.json({ success: true, data: quest });
    } catch (err) {
      next(err);
    }
  }

  // NPC: DELETE /quests/me/:id
  async deleteMyQuest(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const { id } = req.params;
      await questService.deleteQuestForNpc(req.user.id, id);

      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  // NPC: PATCH /quests/me/:id/status
  async updateMyQuestStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError(401, 'Not authenticated');

      const { id } = req.params;
      const parsed = updateQuestStatusSchema.parse(req.body);

      const quest = await questService.updateStatusForNpc(
        req.user.id,
        id,
        parsed
      );

      res.json({ success: true, data: quest });
    } catch (err) {
      next(err);
    }
  }
}

export const questController = new QuestController();
