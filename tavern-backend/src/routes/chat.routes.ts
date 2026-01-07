// src/routes/chat.routes.ts
import { Router } from "express";
import { verifyToken, authorizeRole } from "../middleware/auth.middleware";
import { chatController } from "../controllers/chat.controller";

const router = Router();

// Get messages for a quest (NPC, Adventurer, or Guildmaster)
router.get(
  "/quests/:questId/messages",
  verifyToken,
  chatController.getQuestMessages.bind(chatController)
);

// Send message in quest chat (NPC, Adventurer, or Guildmaster)
router.post(
  "/quests/:questId/messages",
  verifyToken,
  chatController.sendQuestMessage.bind(chatController)
);

// Guildmaster: Get all quest chats for moderation
router.get(
  "/admin/chats",
  verifyToken,
  authorizeRole("GUILD_MASTER"),
  chatController.getAllQuestChats.bind(chatController)
);

// Adventurer: Get all quest chats for the adventurer
router.get(
  "/adventurer/chats",
  verifyToken,
  authorizeRole("ADVENTURER"),
  chatController.getAdventurerQuestChats.bind(chatController)
);

// NPC: Get all quest chats for the NPC
router.get(
  "/npc/chats",
  verifyToken,
  authorizeRole("NPC"),
  chatController.getNPCQuestChats.bind(chatController)
);

export default router;

