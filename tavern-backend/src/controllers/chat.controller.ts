// src/controllers/chat.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { ChatMessageModel } from "../models/chatMessage.model";
import { Quest } from "../models/quest.model";
import { AppError } from "../middleware/error.middleware";

export class ChatController {
  // Get messages for a specific quest (NPC, Adventurer, or Guildmaster)
  async getQuestMessages(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { questId } = req.params;

      // Verify quest exists and user has access
      const quest = await Quest.findById(questId).exec();
      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Quest not found",
        });
      }

      // Check access: NPC, assigned adventurer, or guildmaster (only if conflict exists)
      const isNPC = quest.npcId.toString() === req.userId;
      const isAdventurer = quest.adventurerId?.toString() === req.userId;
      const isGuildmaster = req.userRole === "GUILD_MASTER" && quest.hasConflict === true; // GM only if conflict exists

      if (!isNPC && !isAdventurer && !isGuildmaster) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to view this quest's chat",
        });
      }

      const messages = await ChatMessageModel.find({ questId })
        .populate("senderId", "username displayName")
        .sort({ createdAt: 1 })
        .exec();

      return res.json({ success: true, data: messages });
    } catch (err) {
      next(err);
    }
  }

  // Send a message in a quest chat
  async sendQuestMessage(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || !req.userRole) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const { questId } = req.params;
      const { content } = req.body as { content: string };

      if (!content || !content.trim()) {
        return res.status(400).json({
          success: false,
          message: "Message content is required",
        });
      }

      // Verify quest exists and user has access
      const quest = await Quest.findById(questId).exec();
      if (!quest) {
        return res.status(404).json({
          success: false,
          message: "Quest not found",
        });
      }

      // Check access: NPC, assigned adventurer, or guildmaster (only if conflict exists)
      const isNPC = quest.npcId.toString() === req.userId;
      const isAdventurer = quest.adventurerId?.toString() === req.userId;
      const isGuildmaster = req.userRole === "GUILD_MASTER" && quest.hasConflict === true; // GM only if conflict exists

      if (!isNPC && !isAdventurer && !isGuildmaster) {
        return res.status(403).json({
          success: false,
          message: "Not authorized to send messages in this quest's chat",
        });
      }

      const message = await ChatMessageModel.create({
        questId,
        senderId: req.userId,
        senderRole: req.userRole,
        content: content.trim(),
      });

      await message.populate("senderId", "username displayName");

      // Notify other participants (get user info for notification)
      const { notificationService } = await import("../services/notification.service");
      const { UserModel } = await import("../models/user.model");
      const sender = await UserModel.findById(req.userId).exec();
      const senderName = sender?.displayName || sender?.username || "Unknown";

      if (isNPC && quest.adventurerId) {
        await notificationService.notifyChatMessage(
          String(quest.adventurerId),
          String(quest._id),
          quest.title,
          senderName
        );
      } else if (isAdventurer && quest.npcId) {
        await notificationService.notifyChatMessage(
          String(quest.npcId),
          String(quest._id),
          quest.title,
          senderName
        );
      }

      return res.status(201).json({ success: true, data: message });
    } catch (err) {
      next(err);
    }
  }

  // Guildmaster: Get all quest chats
  async getAllQuestChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "GUILD_MASTER") {
        return res
          .status(403)
          .json({ success: false, message: "Guildmaster access required" });
      }

      // Get all quests with chat messages
      const questsWithChats = await Quest.find({
        status: { $in: ["Accepted", "Completed", "Paid"] },
      })
        .populate("npcId", "username displayName")
        .populate("adventurerId", "username displayName")
        .sort({ updatedAt: -1 })
        .exec();

      // Get message counts and latest message for each quest
      const chats = await Promise.all(
        questsWithChats.map(async (quest) => {
          const messages = await ChatMessageModel.find({
            questId: quest._id,
          })
            .sort({ createdAt: -1 })
            .limit(1)
            .exec();

          const messageCount = await ChatMessageModel.countDocuments({
            questId: quest._id,
          }).exec();

          let lastMessage = null;
          if (messages[0]) {
            await messages[0].populate("senderId", "username displayName");
            const msg: any = messages[0];
            lastMessage = {
              _id: msg._id.toString(),
              content: msg.content,
              senderId: msg.senderId,
              createdAt: msg.createdAt.toISOString(),
            };
          }

          const questData: any = quest;
          return {
            quest: {
              _id: questData._id.toString(),
              title: questData.title,
              status: questData.status,
              npcName:
                typeof questData.npcId === "object"
                  ? questData.npcId.displayName || questData.npcId.username
                  : null,
              adventurerName:
                questData.adventurerId && typeof questData.adventurerId === "object"
                  ? questData.adventurerId.displayName || questData.adventurerId.username
                  : null,
            },
            messageCount,
            lastMessage,
          };
        })
      );

      return res.json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  }

  // Adventurer: Get all quest chats for the adventurer
  async getAdventurerQuestChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "ADVENTURER") {
        return res
          .status(403)
          .json({ success: false, message: "Adventurer access required" });
      }

      // Get all quests where this adventurer is assigned (including all statuses for historical chats)
      const questsWithChats = await Quest.find({
        adventurerId: req.userId,
      })
        .populate("npcId", "username displayName")
        .sort({ updatedAt: -1 })
        .exec();

      // Get message counts and latest message for each quest
      const chats = await Promise.all(
        questsWithChats.map(async (quest) => {
          const messages = await ChatMessageModel.find({
            questId: quest._id,
          })
            .sort({ createdAt: -1 })
            .limit(1)
            .exec();

          const messageCount = await ChatMessageModel.countDocuments({
            questId: quest._id,
          }).exec();

          let lastMessage = null;
          if (messages[0]) {
            await messages[0].populate("senderId", "username displayName");
            const msg: any = messages[0];
            lastMessage = {
              _id: msg._id.toString(),
              content: msg.content,
              senderId: msg.senderId,
              createdAt: msg.createdAt.toISOString(),
            };
          }

          const questData: any = quest;
          return {
            quest: {
              _id: questData._id.toString(),
              title: questData.title,
              status: questData.status,
              npcName:
                typeof questData.npcId === "object"
                  ? questData.npcId.displayName || questData.npcId.username
                  : null,
            },
            messageCount,
            lastMessage,
          };
        })
      );

      return res.json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  }

  // NPC: Get all quest chats for the NPC
  async getNPCQuestChats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId || req.userRole !== "NPC") {
        return res
          .status(403)
          .json({ success: false, message: "NPC access required" });
      }

      // Get all quests posted by this NPC
      const questsWithChats = await Quest.find({
        npcId: req.userId,
        status: { $in: ["Accepted", "Completed", "Paid"] },
      })
        .populate("adventurerId", "username displayName")
        .sort({ updatedAt: -1 })
        .exec();

      // Get message counts and latest message for each quest
      const chats = await Promise.all(
        questsWithChats.map(async (quest) => {
          const messages = await ChatMessageModel.find({
            questId: quest._id,
          })
            .sort({ createdAt: -1 })
            .limit(1)
            .exec();

          const messageCount = await ChatMessageModel.countDocuments({
            questId: quest._id,
          }).exec();

          let lastMessage = null;
          if (messages[0]) {
            await messages[0].populate("senderId", "username displayName");
            const msg: any = messages[0];
            lastMessage = {
              _id: msg._id.toString(),
              content: msg.content,
              senderId: msg.senderId,
              createdAt: msg.createdAt.toISOString(),
            };
          }

          const questData: any = quest;
          return {
            quest: {
              _id: questData._id.toString(),
              title: questData.title,
              status: questData.status,
              adventurerName:
                questData.adventurerId && typeof questData.adventurerId === "object"
                  ? questData.adventurerId.displayName || questData.adventurerId.username
                  : null,
            },
            messageCount,
            lastMessage,
          };
        })
      );

      return res.json({ success: true, data: chats });
    } catch (err) {
      next(err);
    }
  }
}

export const chatController = new ChatController();
