// src/routes/notification.routes.ts
import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { notificationController } from "../controllers/notification.controller";

const router = Router();

router.get("/notifications", verifyToken, notificationController.getNotifications.bind(notificationController));
router.patch("/notifications/:id/read", verifyToken, notificationController.markAsRead.bind(notificationController));
router.patch("/notifications/read-all", verifyToken, notificationController.markAllAsRead.bind(notificationController));
router.delete("/notifications/:id", verifyToken, notificationController.deleteNotification.bind(notificationController));

export default router;

