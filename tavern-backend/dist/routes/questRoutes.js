import express from "express";
import { completeQuest } from "../controllers/questController.js";
import { verifyToken, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// NPC marks a quest as completed
router.post(
  "/quest/:questId/complete",
  verifyToken,
  authorizeRole("NPC"),
  completeQuest
);

export default router;