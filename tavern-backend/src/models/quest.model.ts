// src/models/quest.model.ts
import mongoose, { Schema, Document, Types } from "mongoose";

export type QuestDifficulty = "Easy" | "Medium" | "Hard" | "Epic";

export type QuestStatus =
  | "Open"
  | "Accepted"
  | "Completed"
  | "Paid"
  | "Cancelled";

export interface QuestDocument extends Document {
  title: string;
  description: string;
  difficulty: QuestDifficulty;
  status: QuestStatus;
  npcId: Types.ObjectId;          // NPC (employer) who posted the quest
  adventurerId?: Types.ObjectId;  // Adventurer who accepted/completed it
  rewardGold?: number;
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
      enum: ["Open", "Accepted", "Completed", "Paid", "Cancelled"],
      default: "Open",
    },
    npcId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    adventurerId: { type: Schema.Types.ObjectId, ref: "Adventurer" },
    rewardGold: { type: Number },
    deadline: { type: Date },
  },
  { timestamps: true }
);

export const Quest = mongoose.model<QuestDocument>("Quest", QuestSchema);
