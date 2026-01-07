// src/routes/conflict.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { conflictController } from "../controllers/conflict.controller";

const router = Router();

// Adventurer raises conflict (report rejected or quest changed)
router.post(
  "/quests/:questId/conflicts/raise",
  verifyToken,
  authorizeRole("ADVENTURER"),
  conflictController.raiseConflictByAdventurer.bind(conflictController)
);

// NPC raises conflict (deadline missed)
router.post(
  "/quests/:questId/conflicts/raise-deadline",
  verifyToken,
  authorizeRole("NPC"),
  conflictController.raiseConflictByNPC.bind(conflictController)
);

// Get conflict by quest ID (accessible to involved parties and Guild Master)
router.get(
  "/quests/:questId/conflicts",
  verifyToken,
  conflictController.getConflictByQuest.bind(conflictController)
);

// Guild Master: Get all open conflicts
router.get(
  "/admin/conflicts",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  conflictController.getOpenConflicts.bind(conflictController)
);

// Guild Master: Resolve conflict
router.post(
  "/admin/conflicts/:conflictId/resolve",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  conflictController.resolveConflict.bind(conflictController)
);

export default router;




