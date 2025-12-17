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
  },
  { timestamps: true }
);

export const UserModel = model<UserDocument>("User", UserSchema);
