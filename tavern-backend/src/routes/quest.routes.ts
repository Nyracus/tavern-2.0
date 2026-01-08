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
  rejectCompletion,
  updateQuest,
  deleteQuest,
  getRecommendedQuests,
  cancelQuest,
  getQuestEscrow,
} from "../controllers/quest.controller";
import { enforceWorkloadLimit } from "../controllers/workload.controller";
import { uploadQuestReport, uploadMiddleware } from "../controllers/storage.controller";

const router = Router();

// Public / shared quest browsing
router.get("/quests", verifyToken, listQuests);
// Quest recommendations for adventurers
router.get(
  "/quests/recommended",
  verifyToken,
  authorizeRole("ADVENTURER"),
  getRecommendedQuests
);

// Quest escrow balance (accessible to NPC, Adventurer, or Guild Master)
router.get(
  "/quests/:questId/escrow",
  verifyToken,
  getQuestEscrow
);

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
router.patch(
  "/quests/:questId",
  verifyToken,
  authorizeRole("NPC"),
  updateQuest
);
router.delete(
  "/quests/:questId",
  verifyToken,
  authorizeRole("NPC"),
  deleteQuest
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
router.post(
  "/quests/:questId/reject-completion",
  verifyToken,
  authorizeRole("NPC"),
  rejectCompletion
);
router.post(
  "/quests/:questId/reject-completion",
  verifyToken,
  authorizeRole("NPC"),
  rejectCompletion
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
router.post(
  "/quests/:questId/cancel",
  verifyToken,
  authorizeRole("ADVENTURER"),
  cancelQuest
);

// File upload endpoint for quest reports
router.post(
  "/quests/upload-report",
  verifyToken,
  authorizeRole("ADVENTURER"),
  uploadMiddleware,
  uploadQuestReport
);

export default router;
