// src/routes/npcProfile.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { npcProfileController } from "../controllers/npcProfile.controller";

const router = Router();

router.get(
  "/npcs/me",
  verifyToken,
  authorizeRole("NPC"),
  npcProfileController.getMyProfile.bind(npcProfileController)
);

router.post(
  "/npcs/me",
  verifyToken,
  authorizeRole("NPC"),
  npcProfileController.createMyProfile.bind(npcProfileController)
);

router.patch(
  "/npcs/me",
  verifyToken,
  authorizeRole("NPC"),
  npcProfileController.updateMyProfile.bind(npcProfileController)
);

export default router;

