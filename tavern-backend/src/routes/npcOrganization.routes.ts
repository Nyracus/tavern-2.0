// src/routes/npcOrganization.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { npcOrganizationController } from "../controllers/npcOrganization.controller";
import { uploadImageMiddleware } from "../controllers/storage.controller";
import { cacheMiddleware } from "../middleware/cache.middleware";
import { invalidateCache } from "../middleware/cacheInvalidation.middleware";

const router = Router();

// NPC self routes
router.get(
  "/me",
  verifyToken,
  authorizeRole("NPC"),
  cacheMiddleware({
    ttl: 60, // 1 minute
    prefix: 'npc-org',
    tags: ['npc-org'],
    varyBy: ['headers.authorization'],
  }),
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
  invalidateCache({
    tags: ['npc-org'],
    patterns: ['npc-org:*'],
  }),
  npcOrganizationController.updateMyOrganization.bind(npcOrganizationController)
);

router.get(
  "/me/trust",
  verifyToken,
  authorizeRole("NPC"),
  npcOrganizationController.getMyTrustOverview.bind(npcOrganizationController)
);

router.post(
  "/me/logo",
  verifyToken,
  authorizeRole("NPC"),
  uploadImageMiddleware,
  npcOrganizationController.uploadLogo.bind(npcOrganizationController)
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


