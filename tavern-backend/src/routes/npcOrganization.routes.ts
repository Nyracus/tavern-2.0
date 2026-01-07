// src/routes/npcOrganization.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { npcOrganizationController } from "../controllers/npcOrganization.controller";

const router = Router();

// NPC self routes
router.get(
  "/me",
  verifyToken,
  authorizeRole("NPC"),
  npcOrganizationController.getMyOrganization.bind(npcOrganizationController)
);

router.post(
  "/me",
  verifyToken,
  authorizeRole("NPC"),
  npcOrganizationController.createMyOrganization.bind(npcOrganizationController)
);

router.patch(
  "/me",
  verifyToken,
  authorizeRole("NPC"),
  npcOrganizationController.updateMyOrganization.bind(npcOrganizationController)
);

router.get(
  "/me/trust",
  verifyToken,
  authorizeRole("NPC"),
  npcOrganizationController.getMyTrustOverview.bind(npcOrganizationController)
);

// Guild master routes
router.get(
  "/",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  npcOrganizationController.listOrganizations.bind(npcOrganizationController)
);

router.get(
  "/:id",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  npcOrganizationController.getOrganizationById.bind(npcOrganizationController)
);

router.patch(
  "/:id",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  npcOrganizationController.updateOrganizationById.bind(npcOrganizationController)
);

export default router;


