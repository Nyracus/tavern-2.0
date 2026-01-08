// src/models/user.model.ts
import { Schema, model, Document } from "mongoose";

export type Role = "ADVENTURER" | "NPC" | "GUILD_MASTER";

export interface UserDocument extends Document {
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: Role;
  password: string;       // <-- merged from JS model
  gold?: number;          // Gold currency for adventurers
  needsProfileSetup?: boolean; // Only true for newly registered NPC/Adventurer until they create a profile
  emailVerified?: boolean; // Email verification status
  // NPC-specific fields
  npcPriority?: number;   // Job posting priority (lower = higher priority, used for demotion)
  createdAt: Date;
  updatedAt: Date;
}

export type IUser = UserDocument;


const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
      type: String,
      enum: ["ADVENTURER", "NPC", "GUILD_MASTER"],
      default: "ADVENTURER",
    },
    password: {
      type: String,
      required: true,
      select: false, // common in auth: exclude by default
    },
    gold: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Onboarding gate: only set true for newly registered NPC/Adventurer accounts.
    // Existing users won't have this field and will NOT be forced through onboarding.
    needsProfileSetup: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    // NPC-specific: job posting priority (lower = higher priority)
    // Default: 0 (highest priority), can be increased for demotion
    npcPriority: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", UserSchema);
