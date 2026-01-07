// src/models/user.model.ts
import { Schema, model, Document } from "mongoose";

export type UserRole = "ADVENTURER" | "NPC" | "GUILD_MASTER";

export interface IUser extends Document {
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  role: UserRole;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
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
    password: { type: String, required: true },
  },
  { timestamps: true }
);

export const UserModel = model<IUser>("User", UserSchema);

