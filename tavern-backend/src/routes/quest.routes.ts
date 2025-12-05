import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { completeQuest } from "../controllers/quest.controller";

const router = Router();

// NPC completes a quest → awards XP + certificate
router.post(
  "/quests/:questId/complete",
  verifyToken,
  authorizeRole("NPC"),
  completeQuest
);

export default router;
