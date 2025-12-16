// src/services/chat.service.ts
import { AppError } from "../middleware/error.middleware";
import { ChatMessage, ChatMessageDocument } from "../models/chat.model";
import { Quest } from "../models/quest.model";
import { UserModel } from "../models/user.model";
import { SendMessageInput } from "../schemas/chat.schema";

class ChatService {
  async sendMessage(
    userId: string,
    data: SendMessageInput
  ): Promise<ChatMessageDocument> {
    // Verify quest exists
    const quest = await Quest.findById(data.questId);
    if (!quest) {
      throw new AppError(404, "Quest not found");
    }

    // Verify user is involved in the quest (either NPC owner or assigned adventurer)
    const isNpc = quest.npcId.toString() === userId;
    const isAdventurer = quest.adventurerId?.toString() === userId;

    if (!isNpc && !isAdventurer) {
      throw new AppError(403, "You are not authorized to access this quest chat");
    }

    // Get username
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    // Create message
    const message = await ChatMessage.create({
      questId: data.questId,
      userId,
      username: user.username,
      message: data.message,
    });

    return message;
  }

  async getQuestMessages(
    userId: string,
    questId: string,
    limit: number = 50
  ): Promise<ChatMessageDocument[]> {
    // Verify quest exists
    const quest = await Quest.findById(questId);
    if (!quest) {
      throw new AppError(404, "Quest not found");
    }

    // Verify user is involved in the quest
    const isNpc = quest.npcId.toString() === userId;
    const isAdventurer = quest.adventurerId?.toString() === userId;

    if (!isNpc && !isAdventurer) {
      throw new AppError(403, "You are not authorized to access this quest chat");
    }

    // Fetch messages
    const messages = await ChatMessage.find({ questId })
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    return messages as unknown as ChatMessageDocument[];
  }
}

export const chatService = new ChatService();
