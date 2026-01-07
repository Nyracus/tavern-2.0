// src/models/conflict.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type ConflictStatus = "OPEN" | "RESOLVED" | "CANCELLED";
export type ConflictType = "REPORT_REJECTED" | "QUEST_CHANGED" | "DEADLINE_MISSED";
export type ConflictResolution = "ADVENTURER_WIN" | "NPC_WIN" | null;

export interface ConflictDocument extends Document {
  questId: Types.ObjectId;
  type: ConflictType;
  status: ConflictStatus;
  raisedBy: Types.ObjectId; // User who raised the conflict (ADVENTURER or NPC)
  raisedByRole: "ADVENTURER" | "NPC";
  npcId: Types.ObjectId;
  adventurerId: Types.ObjectId;
  description: string; // Reason for conflict
  escrowedAmount: number; // Amount escrowed (50% of quest reward when raised by adventurer)
  resolution?: ConflictResolution;
  resolvedBy?: Types.ObjectId; // Guild Master who resolved
  resolvedAt?: Date;
  resolutionNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConflictSchema = new Schema<ConflictDocument>(
  {
    questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true, unique: true },
    type: {
      type: String,
      enum: ["REPORT_REJECTED", "QUEST_CHANGED", "DEADLINE_MISSED"],
      required: true,
    },
    status: {
      type: String,
      enum: ["OPEN", "RESOLVED", "CANCELLED"],
      default: "OPEN",
    },
    raisedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    raisedByRole: {
      type: String,
      enum: ["ADVENTURER", "NPC"],
      required: true,
    },
    npcId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adventurerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    description: { type: String, required: true },
    escrowedAmount: { type: Number, required: true, min: 0 },
    resolution: {
      type: String,
      enum: ["ADVENTURER_WIN", "NPC_WIN", null],
      default: null,
    },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolvedAt: { type: Date },
    resolutionNotes: { type: String },
  },
  { timestamps: true }
);

// Indexes
ConflictSchema.index({ questId: 1 });
ConflictSchema.index({ status: 1, createdAt: -1 });
ConflictSchema.index({ raisedBy: 1 });

export const ConflictModel = model<ConflictDocument>("Conflict", ConflictSchema);




