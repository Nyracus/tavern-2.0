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
import escrowRoutes from "./escrow.routes";


const router = Router();

router.get("/ping", (req, res) => {
  res.json({ message: "🏰 Tavern backend is alive!" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/", adventurerProfileRoutes);
router.use("/", questRoutes);
router.use("/", workloadRoutes);
router.use("/", leaderboardRoutes);
router.use("/chat", chatRoutes);
router.use("/admin", adminRoutes);
router.use("/", notificationRoutes);
router.use("/", skillShopRoutes);
router.use("/", escrowRoutes);


export default router;
