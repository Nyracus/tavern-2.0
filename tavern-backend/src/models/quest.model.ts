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
  },
  { timestamps: true }
);

export const Quest = mongoose.model<QuestDocument>("Quest", QuestSchema);
