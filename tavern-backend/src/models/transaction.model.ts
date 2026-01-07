// src/models/transaction.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type TransactionType =
  | "ESCROW_DEPOSIT" // Gold deposited to escrow when quest is posted
  | "ESCROW_RELEASE" // Gold released from escrow to adventurer
  | "ESCROW_REFUND" // Gold refunded from escrow to NPC
  | "CONFLICT_ESCROW" // Gold escrowed by adventurer for conflict
  | "CONFLICT_PAYOUT" // Gold paid out during conflict resolution
  | "DIRECT_PAYMENT"; // Direct payment (legacy, before escrow)

export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";

export interface TransactionDocument extends Document {
  questId: Types.ObjectId;
  type: TransactionType;
  status: TransactionStatus;
  fromUserId?: Types.ObjectId; // User who sent gold (NPC or Adventurer)
  toUserId?: Types.ObjectId; // User who received gold (Adventurer)
  amount: number;
  description?: string;
  metadata?: Record<string, any>; // Additional data (conflict ID, etc.)
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true },
    type: {
      type: String,
      enum: [
        "ESCROW_DEPOSIT",
        "ESCROW_RELEASE",
        "ESCROW_REFUND",
        "CONFLICT_ESCROW",
        "CONFLICT_PAYOUT",
        "DIRECT_PAYMENT",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String },
    metadata: { type: Object },
  },
  { timestamps: true }
);

// Index for efficient queries
TransactionSchema.index({ questId: 1, createdAt: -1 });
TransactionSchema.index({ fromUserId: 1, createdAt: -1 });
TransactionSchema.index({ toUserId: 1, createdAt: -1 });
TransactionSchema.index({ type: 1, status: 1 });

export const TransactionModel = model<TransactionDocument>(
  "Transaction",
  TransactionSchema
);





