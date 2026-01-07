// src/routes/npcOrganization.routes.ts
import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { npcOrganizationController } from "../controllers/npcOrganization.controller";

const router = Router();

// 🔒 All routes require auth
router.use(requireAuth);

// =====================
// NPC Self routes
// =====================
router.get(
  "/me",
  requireRole("NPC"),
  (req, res, next) => npcOrganizationController.getMyOrganization(req, res, next)
);

router.post(
  "/me",
  requireRole("NPC"),
  (req, res, next) => npcOrganizationController.createMyOrganization(req, res, next)
);

router.patch(
  "/me",
  requireRole("NPC"),
  (req, res, next) => npcOrganizationController.updateMyOrganization(req, res, next)
);

router.get(
  "/me/trust",
  requireRole("NPC"),
  (req, res, next) => npcOrganizationController.getMyTrustOverview(req, res, next)
);

// =====================
// Guild Master admin routes (optional; keep if you want GM feature later)
// =====================
router.get(
  "/",
  requireRole("GUILD_MASTER"),
  (req, res, next) => npcOrganizationController.listOrganizations(req, res, next)
);

router.get(
  "/:id",
  requireRole("GUILD_MASTER"),
  (req, res, next) => npcOrganizationController.getOrganizationById(req, res, next)
);

router.patch(
  "/:id",
  requireRole("GUILD_MASTER"),
  (req, res, next) => npcOrganizationController.updateOrganizationById(req, res, next)
);

export default router;

