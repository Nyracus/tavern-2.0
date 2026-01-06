// src/routes/transaction.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { transactionController } from "../controllers/transaction.controller";

const router = Router();

// Guild Master: Get all transactions (ledger view)
router.get(
  "/admin/transactions",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  transactionController.getAllTransactions.bind(transactionController)
);

// Get transactions for a specific quest
router.get(
  "/quests/:questId/transactions",
  verifyToken,
  transactionController.getQuestTransactions.bind(transactionController)
);

// Get user's own transactions
router.get(
  "/transactions/me",
  verifyToken,
  transactionController.getMyTransactions.bind(transactionController)
);

export default router;


