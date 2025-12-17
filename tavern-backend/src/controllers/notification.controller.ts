// src/controllers/notification.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { notificationService } from "../services/notification.service";

export class NotificationController {
  async getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const limit = Number(req.query.limit) || 50;
      const unreadOnly = req.query.unreadOnly === "true";

      const result = await notificationService.getUserNotifications(req.userId, {
        limit,
        unreadOnly,
      });

      return res.json({
        success: true,
        notifications: result.notifications,
        unreadCount: result.unreadCount,
      });
    } catch (err) {
      next(err);
    }
  }

  async markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { id } = req.params;
      const notification = await notificationService.markAsRead(id, req.userId);

      if (!notification) {
        return res
          .status(404)
          .json({ success: false, message: "Notification not found" });
      }

      return res.json({ success: true, data: notification });
    } catch (err) {
      next(err);
    }
  }

  async markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      await notificationService.markAllAsRead(req.userId);
      return res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }

  async deleteNotification(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { id } = req.params;
      await notificationService.deleteNotification(id, req.userId);
      return res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();

