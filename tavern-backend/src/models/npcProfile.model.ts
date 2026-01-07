// src/models/npcProfile.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface INPCProfile extends Document {
  userId: string; // references User._id
  title: string;  // e.g. "Merchant", "Town Mayor"
  summary: string;
  organization?: string; // e.g. "Royal Guild", "Merchant's Association"
  location?: string; // e.g. "Capital City", "Northern Outpost"
  createdAt: Date;
  updatedAt: Date;
}

const NPCProfileSchema = new Schema<INPCProfile>(
  {
    userId: { type: String, required: true, ref: 'User', unique: true },
    title: { type: String, required: true },
    summary: { type: String, required: true },
    organization: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);

export const NPCProfileModel = mongoose.model<INPCProfile>("NPCProfile", NPCProfileSchema);

