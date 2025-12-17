import { Schema, model, Document, Types } from "mongoose";
import type { Role } from "./user.model";

export type AnomalyStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "IGNORED";

export interface AnomalyDocument extends Document {
  subjectUserId: Types.ObjectId; // NPC or Adventurer being flagged
  subjectRole: Role;
  type: string; // e.g. "NPC_NO_QUESTS", "ADVENTURER_OVERWORKED", "QUEST_DEADLINE_MISSED"
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  details?: string;
  questId?: Types.ObjectId;
  status: AnomalyStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AnomalySchema = new Schema<AnomalyDocument>(
  {
    subjectUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjectRole: {
      type: String,
      enum: ["ADVENTURER", "NPC", "GUILD_MASTER"],
      required: true,
    },
    type: { type: String, required: true },
    severity: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      default: "LOW",
      required: true,
    },
    summary: { type: String, required: true },
    details: { type: String },
    questId: { type: Schema.Types.ObjectId, ref: "Quest" },
    status: {
      type: String,
      enum: ["OPEN", "ACKNOWLEDGED", "RESOLVED", "IGNORED"],
      default: "OPEN",
      required: true,
    },
  },
  { timestamps: true }
);

export const AnomalyModel = model<AnomalyDocument>("Anomaly", AnomalySchema);


