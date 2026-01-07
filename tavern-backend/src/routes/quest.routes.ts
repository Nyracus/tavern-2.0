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
} from "../controllers/quest.controller";
import { enforceWorkloadLimit } from "../controllers/workload.controller";
import { uploadQuestReport, uploadMiddleware } from "../controllers/storage.controller";
import { cacheMiddleware } from "../middleware/cache.middleware";
import { invalidateCache, invalidateQuestCache } from "../middleware/cacheInvalidation.middleware";

const router = Router();

// Public / shared quest browsing (cached for 2 minutes)
router.get(
  "/quests",
  verifyToken,
  cacheMiddleware({
    ttl: 120, // 2 minutes
    prefix: 'quests',
    tags: ['quests'],
    skipCache: (req) => {
      // Skip cache if there are search/filter params (dynamic queries)
      return !!(req.query.search || req.query.difficulty || req.query.minReward || req.query.maxReward);
    },
  }),
  listQuests
);

// Quest recommendations for adventurers (cached for 5 minutes, user-specific)
router.get(
  "/quests/recommended",
  verifyToken,
  authorizeRole("ADVENTURER"),
  cacheMiddleware({
    ttl: 300, // 5 minutes
    prefix: 'recommended',
    tags: ['quests', 'recommended'],
    varyBy: ['headers.authorization'], // Cache per user
  }),
  getRecommendedQuests
);

// NPC employer: create and manage quests (invalidate cache on create)
router.post(
  "/quests",
  verifyToken,
  authorizeRole("NPC"),
  invalidateQuestCache(),
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
  invalidateQuestCache(),
  updateQuest
);
router.delete(
  "/quests/:questId",
  verifyToken,
  authorizeRole("NPC"),
  invalidateQuestCache(),
  deleteQuest
);
router.post(
  "/quests/:questId/applications/:applicationId/decision",
  verifyToken,
  authorizeRole("NPC"),
  invalidateQuestCache(),
  decideApplication
);
router.post(
  "/quests/:questId/pay",
  verifyToken,
  authorizeRole("NPC"),
  invalidateQuestCache(),
  invalidateCache({ tags: ['leaderboard'] }), // Leaderboard changes when quest is paid
  payQuest
);
router.post(
  "/quests/:questId/reject-completion",
  verifyToken,
  authorizeRole("NPC"),
  invalidateQuestCache(),
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
  invalidateQuestCache(),
  applyToQuest
);
router.post(
  "/quests/:questId/submit-completion",
  verifyToken,
  authorizeRole("ADVENTURER"),
  invalidateQuestCache(),
  submitCompletion
);
router.post(
  "/quests/:questId/cancel",
  verifyToken,
  authorizeRole("ADVENTURER"),
  invalidateQuestCache(),
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
