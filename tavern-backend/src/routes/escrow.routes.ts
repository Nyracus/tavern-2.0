// src/routes/escrow.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { escrowController } from "../controllers/escrow.controller";

const router = Router();

// NPC routes - view escrow info
router.get(
  "/escrows/mine",
  verifyToken,
  authorizeRole("NPC"),
  escrowController.getMyEscrows
);

router.get(
  "/escrows/stats",
  verifyToken,
  authorizeRole("NPC"),
  escrowController.getMyEscrowStats
);

router.post(
  "/escrows/check-affordability",
  verifyToken,
  authorizeRole("NPC"),
  escrowController.checkAffordability
);

// Get escrow for specific quest (NPC or Adventurer can view)
router.get(
  "/escrows/quest/:questId",
  verifyToken,
  escrowController.getQuestEscrow
);

export default router;
