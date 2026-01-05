// src/models/quest.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type QuestDifficulty = "Easy" | "Medium" | "Hard" | "Epic";

export type QuestStatus =
  | "Open"
  | "Applied"
  | "Accepted"
  | "Completed"
  | "Paid"
  | "Cancelled";

export interface QuestApplication {
  _id: Types.ObjectId;
  adventurerId: Types.ObjectId; // user id of the adventurer
  note?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: Date;
}

export interface QuestDocument extends Document {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  npcId: Types.ObjectId; // NPC (employer) who posted the quest
  adventurerId?: Types.ObjectId; // Adventurer who was chosen
  rewardGold?: number;
  deadline?: Date;
  applications: QuestApplication[];
  completionReportUrl?: string;
  completionSubmittedAt?: Date;
  paidGold?: number;
  paidAt?: Date;
  // Escrow fields
  escrowedGold?: number; // Amount currently in escrow
  escrowDepositedAt?: Date; // When gold was deposited to escrow
  // Conflict fields
  conflictId?: Types.ObjectId; // Reference to conflict if one exists
  hasConflict?: boolean; // Quick flag to check if conflict exists
  // Track original quest details for conflict detection
  originalDescription?: string; // Store original description to detect changes
  originalDeadline?: Date; // Store original deadline to detect changes
  createdAt: Date;
  updatedAt: Date;
}

const QuestApplicationSchema = new Schema<QuestApplication>(
  {
    adventurerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
      required: true,
    },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const QuestSchema = new Schema<QuestDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard", "Epic"],
      default: "Easy",
    },
    status: {
      type: String,
      enum: ["Open", "Applied", "Accepted", "Completed", "Paid", "Cancelled"],
      default: "Open",
    },
    npcId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adventurerId: { type: Schema.Types.ObjectId, ref: "User" },
    rewardGold: { type: Number },
    deadline: { type: Date },
    applications: { type: [QuestApplicationSchema], default: [] },
    completionReportUrl: { type: String },
    completionSubmittedAt: { type: Date },
    paidGold: { type: Number },
    paidAt: { type: Date },
    // Escrow fields
    escrowedGold: { type: Number, min: 0 },
    escrowDepositedAt: { type: Date },
    // Conflict fields
    conflictId: { type: Schema.Types.ObjectId, ref: "Conflict" },
    hasConflict: { type: Boolean, default: false },
    // Original quest details for change detection
    originalDescription: { type: String },
    originalDeadline: { type: Date },
  },
  { timestamps: true }
);

export const Quest = mongoose.model<QuestDocument>("Quest", QuestSchema);
