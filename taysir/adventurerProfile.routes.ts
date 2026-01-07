// src/routes/adventurerProfile.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { adventurerProfileController } from "../controllers/adventurerProfile.controller";

const router = Router();

// 🔒 Feature 1: Adventurer-only
router.use(requireAuth, requireRole("ADVENTURER"));

router.get("/me", (req, res, next) =>
  adventurerProfileController.getMyProfile(req, res, next)
);

router.post("/me", (req, res, next) =>
  adventurerProfileController.createMyProfile(req, res, next)
);

router.patch("/me", (req, res, next) =>
  adventurerProfileController.updateMyProfile(req, res, next)
);

// Skills
router.post("/me/skills", (req, res, next) =>
  adventurerProfileController.addSkill(req, res, next)
);

router.patch("/me/skills/:skillId", (req, res, next) =>
  adventurerProfileController.updateSkill(req, res, next)
);

router.delete("/me/skills/:skillId", (req, res, next) =>
  adventurerProfileController.deleteSkill(req, res, next)
);

export default router;

