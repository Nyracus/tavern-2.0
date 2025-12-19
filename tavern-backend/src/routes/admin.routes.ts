import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { adminController } from "../controllers/admin.controller";

const router = Router();

// Only guild masters act as admins in this world
const adminGuard = [verifyToken, authorizeRole("GUILD_MASTER") as any];

router.post("/anomalies/scan", ...adminGuard, adminController.scanAnomalies.bind(adminController));
router.get("/anomalies", ...adminGuard, adminController.listAnomalies.bind(adminController));
router.patch(
  "/anomalies/:id/status",
  ...adminGuard,
  adminController.updateAnomalyStatus.bind(adminController)
);
router.get("/chats", ...adminGuard, adminController.getAllChats.bind(adminController));
router.get("/escrows", ...adminGuard, adminController.getAllEscrows.bind(adminController));

export default router;


