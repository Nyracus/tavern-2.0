// src/controllers/transaction.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { transactionService } from "../services/transaction.service";

export class TransactionController {
  /**
   * Get all transactions (Guild Master ledger view)
   */
  async getAllTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "GUILD_MASTER") {
        return res.status(403).json({ success: false, message: "Guild Master access required" });
      }

      const limit = Math.min(Number(req.query.limit) || 100, 500);
      const skip = Number(req.query.skip) || 0;

      const [transactions, totalCount] = await Promise.all([
        transactionService.getAllTransactions(limit, skip),
        transactionService.getTransactionCount(),
      ]);

      return res.json({
        success: true,
        data: transactions,
        pagination: {
          total: totalCount,
          limit,
          skip,
          hasMore: skip + limit < totalCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get transactions for a specific quest
   */
  async getQuestTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }

      const { questId } = req.params;
      const transactions = await transactionService.getTransactionsByQuest(questId);

      return res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get user's transactions
   */
  async getMyTransactions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res.status(401).json({ success: false, message: "Unauthenticated" });
      }

      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const transactions = await transactionService.getTransactionsByUser(req.userId, limit);

      return res.json({ success: true, data: transactions });
    } catch (err) {
      next(err);
    }
  }
}

export const transactionController = new TransactionController();



