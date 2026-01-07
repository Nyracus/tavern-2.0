// src/models/escrow.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type EscrowStatus = "ACTIVE" | "RELEASED" | "REFUNDED" | "CANCELLED";

export interface EscrowDocument extends Document {
  questId: Types.ObjectId;
  npcId: Types.ObjectId;
  adventurerId?: Types.ObjectId;
  amount: number;
  status: EscrowStatus;
  createdAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  notes?: string;
}

const EscrowSchema = new Schema<EscrowDocument>(
  {
    questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true, unique: true },
    npcId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adventurerId: { type: Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED", "REFUNDED", "CANCELLED"],
      default: "ACTIVE",
      required: true,
    },
    releasedAt: { type: Date },
    refundedAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

// Index for faster lookups
EscrowSchema.index({ questId: 1 });
EscrowSchema.index({ npcId: 1, status: 1 });

export const EscrowModel = model<EscrowDocument>("Escrow", EscrowSchema);
