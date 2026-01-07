// src/models/chatMessage.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ChatMessageDocument extends Document {
  questId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: "NPC" | "ADVENTURER" | "GUILD_MASTER";
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessageDocument>(
  {
    questId: {
      type: Schema.Types.ObjectId,
      ref: "Quest",
      required: true,
      // Note: index is handled by compound index below (questId + createdAt)
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderRole: {
      type: String,
      enum: ["NPC", "ADVENTURER", "GUILD_MASTER"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

// Index for efficient querying by quest
ChatMessageSchema.index({ questId: 1, createdAt: -1 });

export const ChatMessageModel = model<ChatMessageDocument>(
  "ChatMessage",
  ChatMessageSchema
);

