// src/models/quest.model.ts
import { Schema, model, Document } from "mongoose";

export type QuestStatus =
  | "DRAFT"
  | "POSTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface IQuest extends Document {
  title: string;
  description: string;
  createdBy: string; // NPC user id (User._id)
  status: QuestStatus;

  requiredLevel?: number;
  requiredClasses?: string[];
  tags: string[];

  rewardGold: number;
  deadline?: Date;

  // --- FUTURE EXTENSION (not used in MVP, but safe to keep) ---
  assignedTo?: string | null; // Adventurer user id
  acceptedAt?: Date | null;
  completedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const QuestSchema = new Schema<IQuest>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },

    createdBy: { type: String, required: true, ref: "User" },

    status: {
      type: String,
      enum: ["DRAFT", "POSTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"],
      // ✅ IMPORTANT: default should be DRAFT (not POSTED)
      default: "DRAFT",
    },

    requiredLevel: { type: Number, min: 1 },
    requiredClasses: [{ type: String }],
    tags: [{ type: String }],

    rewardGold: { type: Number, required: true, min: 0 },
    deadline: { type: Date },

    // future fields
    assignedTo: { type: String, default: null },
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const QuestModel = model<IQuest>("Quest", QuestSchema);

