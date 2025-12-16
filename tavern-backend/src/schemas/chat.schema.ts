// src/schemas/chat.schema.ts
import { z } from "zod";

export const sendMessageSchema = z.object({
  questId: z.string().min(1, "Quest ID is required"),
  message: z.string().min(1, "Message cannot be empty").max(1000, "Message too long"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
