// src/services/transaction.service.ts
import { Types } from "mongoose";
import { TransactionModel, TransactionDocument, TransactionType, TransactionStatus } from "../models/transaction.model";

export class TransactionService {
  /**
   * Create a transaction record
   */
  async createTransaction(
    questId: string,
    type: TransactionType,
    amount: number,
    fromUserId?: string,
    toUserId?: string,
    description?: string,
    metadata?: Record<string, any>,
    status: TransactionStatus = "COMPLETED"
  ): Promise<TransactionDocument> {
    return TransactionModel.create({
      questId: new Types.ObjectId(questId),
      type,
      amount,
      fromUserId: fromUserId ? new Types.ObjectId(fromUserId) : undefined,
      toUserId: toUserId ? new Types.ObjectId(toUserId) : undefined,
      description,
      metadata,
      status,
    });
  }

  /**
   * Get all transactions for a quest
   */
  async getTransactionsByQuest(questId: string): Promise<TransactionDocument[]> {
    return TransactionModel.find({ questId: new Types.ObjectId(questId) })
      .sort({ createdAt: -1 })
      .populate("fromUserId", "username displayName")
      .populate("toUserId", "username displayName")
      .exec();
  }

  /**
   * Get all transactions for a user (as sender or receiver)
   */
  async getTransactionsByUser(userId: string, limit: number = 50): Promise<TransactionDocument[]> {
    return TransactionModel.find({
      $or: [
        { fromUserId: new Types.ObjectId(userId) },
        { toUserId: new Types.ObjectId(userId) },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("questId", "title")
      .populate("fromUserId", "username displayName")
      .populate("toUserId", "username displayName")
      .exec();
  }

  /**
   * Get all transactions (Guild Master ledger view)
   */
  async getAllTransactions(limit: number = 100, skip: number = 0): Promise<TransactionDocument[]> {
    return TransactionModel.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .populate("questId", "title")
      .populate("fromUserId", "username displayName role")
      .populate("toUserId", "username displayName role")
      .exec();
  }

  /**
   * Get transaction count (for pagination)
   */
  async getTransactionCount(): Promise<number> {
    return TransactionModel.countDocuments().exec();
  }

  /**
   * Get escrow balance for a quest
   */
  async getQuestEscrowBalance(questId: string): Promise<number> {
    const transactions = await TransactionModel.find({
      questId: new Types.ObjectId(questId),
      type: { $in: ["ESCROW_DEPOSIT", "ESCROW_RELEASE", "ESCROW_REFUND", "CONFLICT_ESCROW", "CONFLICT_PAYOUT"] },
      status: "COMPLETED",
    }).exec();

    let balance = 0;
    for (const tx of transactions) {
      if (tx.type === "ESCROW_DEPOSIT" || tx.type === "CONFLICT_ESCROW") {
        balance += tx.amount;
      } else if (tx.type === "ESCROW_RELEASE" || tx.type === "ESCROW_REFUND" || tx.type === "CONFLICT_PAYOUT") {
        balance -= tx.amount;
      }
    }

    return balance;
  }
}

export const transactionService = new TransactionService();



