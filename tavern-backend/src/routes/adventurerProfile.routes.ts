// src/routes/adventurerProfile.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { adventurerProfileController } from "../controllers/adventurerProfile.controller";
import { uploadImageMiddleware } from "../controllers/storage.controller";
import { cacheMiddleware } from "../middleware/cache.middleware";
import { invalidateCache, invalidateProfileCache } from "../middleware/cacheInvalidation.middleware";

const router = Router();

// NOTE: plural "adventurers" to match frontend: /api/adventurers/me
// Cache profile for 1 minute (user-specific)
router.get(
  "/adventurers/me",
  verifyToken,
  authorizeRole("ADVENTURER"),
  cacheMiddleware({
    ttl: 60, // 1 minute
    prefix: 'profile',
    tags: ['profiles'],
    varyBy: ['headers.authorization'], // Cache per user
  }),
  adventurerProfileController.getMyProfile.bind(adventurerProfileController)
);

router.post(
  "/adventurers/me",
  verifyToken,
  authorizeRole("ADVENTURER"),
  adventurerProfileController.createMyProfile.bind(adventurerProfileController)
);

router.patch(
  "/adventurers/me",
  verifyToken,
  authorizeRole("ADVENTURER"),
  invalidateCache({
    tags: ['profiles'],
    patterns: ['profile:*'],
  }),
  adventurerProfileController.updateMyProfile.bind(adventurerProfileController)
);

// Skills
router.post(
  "/adventurers/me/skills",
  verifyToken,
  authorizeRole("ADVENTURER"),
  adventurerProfileController.addSkill.bind(adventurerProfileController)
);

router.patch(
  "/adventurers/me/skills/:skillId",
  verifyToken,
  authorizeRole("ADVENTURER"),
  adventurerProfileController.updateSkill.bind(adventurerProfileController)
);

router.delete(
  "/adventurers/me/skills/:skillId",
  verifyToken,
  authorizeRole("ADVENTURER"),
  adventurerProfileController.deleteSkill.bind(adventurerProfileController)
);

// Stat point allocation
router.post(
  "/adventurers/me/allocate-stat",
  verifyToken,
  authorizeRole("ADVENTURER"),
  adventurerProfileController.allocateStatPoint.bind(adventurerProfileController)
);

// Logo upload
router.post(
  "/adventurers/me/logo",
  verifyToken,
  authorizeRole("ADVENTURER"),
  uploadImageMiddleware,
  adventurerProfileController.uploadLogo.bind(adventurerProfileController)
);

export default router;
