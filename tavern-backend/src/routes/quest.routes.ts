import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import {
  createQuest,
  listQuests,
  applyToQuest,
  listMyPostedQuests,
  listMyApplications,
  decideApplication,
  submitCompletion,
  payQuest,
} from "../controllers/quest.controller";
import { enforceWorkloadLimit } from "../controllers/workload.controller";

const router = Router();

// Public / shared quest browsing
router.get("/quests", verifyToken, listQuests);

// NPC employer: create and manage quests
router.post(
  "/quests",
  verifyToken,
  authorizeRole("NPC"),
  createQuest
);
router.get(
  "/quests/mine",
  verifyToken,
  authorizeRole("NPC"),
  listMyPostedQuests
);
router.post(
  "/quests/:questId/applications/:applicationId/decision",
  verifyToken,
  authorizeRole("NPC"),
  decideApplication
);
router.post(
  "/quests/:questId/pay",
  verifyToken,
  authorizeRole("NPC"),
  payQuest
);

// Adventurer: apply and submit completion
router.get(
  "/quests/applications/mine",
  verifyToken,
  authorizeRole("ADVENTURER"),
  listMyApplications
);
router.post(
  "/quests/:questId/apply",
  verifyToken,
  authorizeRole("ADVENTURER"),
  enforceWorkloadLimit,
  applyToQuest
);
router.post(
  "/quests/:questId/submit-completion",
  verifyToken,
  authorizeRole("ADVENTURER"),
  submitCompletion
);

export default router;
