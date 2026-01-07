// src/services/notification.service.ts
import { Types } from "mongoose";
import { NotificationModel, NotificationDocument, NotificationType } from "../models/notification.model";
import { emailService } from "./email.service";

export class NotificationService {
  /**
   * Create a notification for a user
   */
  async createNotification(
    userId: string | Types.ObjectId,
    type: NotificationType,
    title: string,
    message: string,
    data?: any
  ): Promise<NotificationDocument> {
    return NotificationModel.create({
      userId: new Types.ObjectId(userId),
      type,
      title,
      message,
      data,
      read: false,
    });
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(
    userId: string,
    options?: { limit?: number; unreadOnly?: boolean }
  ): Promise<{ notifications: NotificationDocument[]; unreadCount: number }> {
    const filter: any = { userId: new Types.ObjectId(userId) };
    if (options?.unreadOnly) {
      filter.read = false;
    }

    const limit = options?.limit || 50;

    const notifications = await NotificationModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    const unreadCount = await NotificationModel.countDocuments({
      userId: new Types.ObjectId(userId),
      read: false,
    }).exec();

    return { notifications, unreadCount };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDocument | null> {
    return NotificationModel.findOneAndUpdate(
      {
        _id: notificationId,
        userId: new Types.ObjectId(userId),
      },
      { $set: { read: true } },
      { new: true }
    ).exec();
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await NotificationModel.updateMany(
      { userId: new Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    ).exec();
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await NotificationModel.findOneAndDelete({
      _id: notificationId,
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  /**
   * Create quest-related notifications
   */
  async notifyQuestApplicationReceived(
    npcId: string,
    questId: string,
    applicationId: string,
    adventurerName: string,
    questTitle: string
  ): Promise<void> {
    await this.createNotification(
      npcId,
      "QUEST_APPLICATION_RECEIVED",
      "New Quest Application",
      `${adventurerName} has applied to your quest: "${questTitle}"`,
      { questId, applicationId }
    );
    // Send email notification
    await emailService.sendQuestApplicationReceived(npcId, questId, questTitle, adventurerName);
  }

  async notifyQuestApplicationAccepted(
    adventurerId: string,
    questId: string,
    questTitle: string,
    deadline?: Date
  ): Promise<void> {
    const deadlineText = deadline
      ? ` Deadline: ${deadline.toLocaleString()}`
      : "";
    await this.createNotification(
      adventurerId,
      "QUEST_APPLICATION_ACCEPTED",
      "Quest Application Accepted",
      `Your application for "${questTitle}" has been accepted!${deadlineText}`,
      { questId }
    );
    // Send email notification
    await emailService.sendQuestApplicationAccepted(adventurerId, questId, questTitle, deadline);
  }

  async notifyQuestApplicationRejected(
    adventurerId: string,
    questId: string,
    questTitle: string
  ): Promise<void> {
    await this.createNotification(
      adventurerId,
      "QUEST_APPLICATION_REJECTED",
      "Quest Application Rejected",
      `Your application for "${questTitle}" has been rejected.`,
      { questId }
    );
    // Send email notification
    await emailService.sendNotificationEmail(
      adventurerId,
      "Quest Application Rejected",
      `Your application for "${questTitle}" has been rejected.`,
      "QUEST_APPLICATION_REJECTED",
      { questId }
    );
  }

  async notifyQuestCompletionSubmitted(
    npcId: string,
    questId: string,
    adventurerName: string,
    questTitle: string
  ): Promise<void> {
    await this.createNotification(
      npcId,
      "QUEST_COMPLETION_SUBMITTED",
      "Quest Completion Submitted",
      `${adventurerName} has submitted completion for "${questTitle}". Please review.`,
      { questId }
    );
    // Send email notification
    await emailService.sendNotificationEmail(
      npcId,
      "Quest Completion Submitted",
      `${adventurerName} has submitted completion for "${questTitle}". Please review.`,
      "QUEST_COMPLETION_SUBMITTED",
      { questId }
    );
  }

  async notifyQuestPaymentReceived(
    adventurerId: string,
    questId: string,
    questTitle: string,
    amount: number
  ): Promise<void> {
    await this.createNotification(
      adventurerId,
      "QUEST_PAYMENT_RECEIVED",
      "Payment Received",
      `You have received ${amount} gold for completing "${questTitle}"!`,
      { questId, amount }
    );
    // Send email notification
    await emailService.sendPaymentReceived(adventurerId, questId, questTitle, amount);
  }

  async notifyQuestDeadlineApproaching(
    adventurerId: string,
    questId: string,
    questTitle: string,
    hoursRemaining: number
  ): Promise<void> {
    await this.createNotification(
      adventurerId,
      "QUEST_DEADLINE_APPROACHING",
      "Quest Deadline Approaching",
      `Quest "${questTitle}" deadline is in ${hoursRemaining} hour(s).`,
      { questId, hoursRemaining }
    );
  }

  async notifyChatMessage(
    userId: string,
    questId: string,
    questTitle: string,
    senderName: string
  ): Promise<void> {
    await this.createNotification(
      userId,
      "CHAT_MESSAGE",
      "New Chat Message",
      `${senderName} sent a message in quest "${questTitle}"`,
      { questId }
    );
  }
}

export const notificationService = new NotificationService();

