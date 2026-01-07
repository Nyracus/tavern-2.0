// src/routes/quest.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { questController } from "../controllers/quest.controller";

const router = Router();

// 🔒 Feature 3: NPC-only
router.use(requireAuth, requireRole("NPC"));

router.post("/me", (req, res, next) =>
  questController.createMyQuest(req, res, next)
);

router.get("/me", (req, res, next) =>
  questController.listMyQuests(req, res, next)
);

router.get("/me/:id", (req, res, next) =>
  questController.getMyQuestById(req, res, next)
);

router.patch("/me/:id", (req, res, next) =>
  questController.updateMyQuest(req, res, next)
);

router.delete("/me/:id", (req, res, next) =>
  questController.deleteMyQuest(req, res, next)
);

router.patch("/me/:id/status", (req, res, next) =>
  questController.updateMyQuestStatus(req, res, next)
);

export default router;
