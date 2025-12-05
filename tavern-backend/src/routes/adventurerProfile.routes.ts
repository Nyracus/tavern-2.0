// src/routes/adventurerProfile.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { adventurerProfileController } from "../controllers/adventurerProfile.controller";

const router = Router();

// NOTE: plural "adventurers" to match frontend: /api/adventurers/me
router.get(
  "/adventurers/me",
  verifyToken,
  authorizeRole("ADVENTURER"),
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

export default router;
