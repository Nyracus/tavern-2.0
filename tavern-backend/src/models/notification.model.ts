// src/models/notification.model.ts
import { Schema, model, Document, Types } from "mongoose";

export type NotificationType =
  | "QUEST_APPLICATION_RECEIVED"
  | "QUEST_APPLICATION_ACCEPTED"
  | "QUEST_APPLICATION_REJECTED"
  | "QUEST_COMPLETION_SUBMITTED"
  | "QUEST_PAYMENT_RECEIVED"
  | "QUEST_DEADLINE_APPROACHING"
  | "QUEST_DEADLINE_PASSED"
  | "CHAT_MESSAGE"
  | "ANOMALY_DETECTED"
  | "SYSTEM";

export interface NotificationDocument extends Document {
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    questId?: string;
    applicationId?: string;
    chatMessageId?: string;
    anomalyId?: string;
    [key: string]: any;
  };
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "QUEST_APPLICATION_RECEIVED",
        "QUEST_APPLICATION_ACCEPTED",
        "QUEST_APPLICATION_REJECTED",
        "QUEST_COMPLETION_SUBMITTED",
        "QUEST_PAYMENT_RECEIVED",
        "QUEST_DEADLINE_APPROACHING",
        "QUEST_DEADLINE_PASSED",
        "CHAT_MESSAGE",
        "ANOMALY_DETECTED",
        "SYSTEM",
      ],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    data: { type: Schema.Types.Mixed },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

// Index for efficient querying
NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const NotificationModel = model<NotificationDocument>(
  "Notification",
  NotificationSchema
);

