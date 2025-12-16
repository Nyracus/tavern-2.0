// src/routes/chat.routes.ts
import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// Send a message to a quest chat channel
router.post("/messages", verifyToken, (req, res, next) =>
  chatController.sendMessage(req, res, next)
);

// Get messages for a specific quest
router.get("/quests/:questId/messages", verifyToken, (req, res, next) =>
  chatController.getQuestMessages(req, res, next)
);

export default router;
