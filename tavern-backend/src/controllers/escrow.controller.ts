// src/controllers/escrow.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { escrowService } from "../services/escrow.service";
import { AppError } from "../middleware/error.middleware";

export class EscrowController {
  /**
   * Get escrow details for a specific quest
   */
  async getQuestEscrow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { questId } = req.params;
      const escrow = await escrowService.getEscrowByQuest(questId);

      if (!escrow) {
        return res.status(404).json({
          success: false,
          message: "No escrow found for this quest",
        });
      }

      return res.json({ success: true, data: escrow });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get NPC's active escrows
   */
  async getMyEscrows(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const escrows = await escrowService.getNpcActiveEscrows(req.userId);
      return res.json({ success: true, data: escrows });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get NPC's escrow statistics
   */
  async getMyEscrowStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const stats = await escrowService.getNpcEscrowStats(req.userId);
      return res.json({ success: true, data: stats });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Check if NPC can afford escrow amount
   */
  async checkAffordability(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { amount } = req.body;

      if (typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid amount",
        });
      }

      const canAfford = await escrowService.canAffordEscrow(
        req.userId,
        amount
      );

      return res.json({
        success: true,
        data: { canAfford, amount },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const escrowController = new EscrowController();
