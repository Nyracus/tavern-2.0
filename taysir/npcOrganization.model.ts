// src/models/npcOrganization.model.ts
import { Schema, model, Document } from 'mongoose';

export type TrustTier = 'LOW' | 'MEDIUM' | 'HIGH';

export interface INpcOrganization extends Document {
  userId: string;             // NPC user id (User._id)
  name: string;
  description?: string;
  domain?: string;            // e.g. "Software", "Art", "Research"
  website?: string;
  verified: boolean;

  // Trust metrics
  trustScore: number;         // 0–100
  trustTier: TrustTier;       // derived from trustScore
  isFlagged: boolean;         // for suspicious activity

  // Basic stats (can be updated by other features later)
  totalQuestsPosted: number;
  totalGoldSpent: number;
  completionRate: number;     // 0–1
  disputeRate: number;        // 0–1

  createdAt: Date;
  updatedAt: Date;
}

const NpcOrganizationSchema = new Schema<INpcOrganization>(
  {
    userId: { type: String, required: true, ref: 'User', unique: true },
    name: { type: String, required: true },
    description: { type: String },
    domain: { type: String },
    website: { type: String },
    verified: { type: Boolean, default: false },

    trustScore: { type: Number, required: true, min: 0, max: 100, default: 50 },
    trustTier: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      required: true,
      default: 'MEDIUM',
    },
    isFlagged: { type: Boolean, default: false },

    totalQuestsPosted: { type: Number, default: 0 },
    totalGoldSpent: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    disputeRate: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const NpcOrganizationModel = model<INpcOrganization>(
  'NpcOrganization',
  NpcOrganizationSchema
);
