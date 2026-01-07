import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import adventurerProfileRoutes from "./adventurerProfile.routes";
import questRoutes from "./quest.routes";
import workloadRoutes from "./workload.routes";
import leaderboardRoutes from "./leaderboard.routes";
import chatRoutes from "./chat.routes";
import adminRoutes from "./admin.routes";
import notificationRoutes from "./notification.routes";
import skillShopRoutes from "./skillShop.routes";
import conflictRoutes from "./conflict.routes";
import transactionRoutes from "./transaction.routes";
import npcProfileRoutes from "./npcProfile.routes";
import npcOrganizationRoutes from "./npcOrganization.routes";
import healthRoutes from "./health.routes";


const router = Router();

// Health check routes (no auth, no rate limiting)
router.use(healthRoutes);

router.get("/ping", (req, res) => {
  res.json({ message: "🏰 Tavern backend is alive!" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", adventurerProfileRoutes);
router.use("/", questRoutes);
router.use("/", workloadRoutes);
router.use("/", leaderboardRoutes);
router.use("/admin", adminRoutes);
router.use("/", chatRoutes);
router.use("/", notificationRoutes);
router.use("/", skillShopRoutes);
router.use("/", conflictRoutes);
router.use("/", transactionRoutes);
router.use("/", npcProfileRoutes);
router.use("/npc-organizations", npcOrganizationRoutes);


export default router;
