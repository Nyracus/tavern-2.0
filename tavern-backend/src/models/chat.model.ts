// src/models/chat.model.ts
import { Schema, model, Document, Types } from "mongoose";

export interface ChatMessageDocument extends Document {
  questId: Types.ObjectId;
  userId: string;
  username: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<ChatMessageDocument>(
  {
    questId: { type: Schema.Types.ObjectId, ref: "Quest", required: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    message: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// Index for efficient querying by questId
ChatMessageSchema.index({ questId: 1, createdAt: -1 });

export const ChatMessage = model<ChatMessageDocument>(
  "ChatMessage",
  ChatMessageSchema
);
