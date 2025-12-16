// src/controllers/chat.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { chatService } from "../services/chat.service";
import { sendMessageSchema } from "../schemas/chat.schema";
import { AppError } from "../middleware/error.middleware";

class ChatController {
  async sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const parsed = sendMessageSchema.parse(req.body);
      const message = await chatService.sendMessage(req.userId, parsed);

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  async getQuestMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError(401, "Not authenticated");
      }

      const { questId } = req.params;
      const limit = Math.min(Number(req.query.limit) || 50, 100);

      const messages = await chatService.getQuestMessages(
        req.userId,
        questId,
        limit
      );

      return res.json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
