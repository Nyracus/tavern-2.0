// src/schemas/quest.schema.ts

import { z } from "zod";

export const questStatusSchema = z.enum([
  "DRAFT",
  "POSTED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// ✅ MVP rule: NPC can only create quests as DRAFT or POSTED
export const createQuestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  rewardGold: z.number().min(0),

  status: z.enum(["DRAFT", "POSTED"]).optional(), // ✅ NEW

  requiredLevel: z.number().int().min(1).optional(),
  requiredClasses: z.array(z.string().min(1)).optional(),
  tags: z.array(z.string().min(1)).optional(),
  deadline: z.coerce.date().optional(),
});

export const updateQuestSchema = createQuestSchema
  .omit({ status: true })
  .partial();

// status updates (separate endpoint)
export const updateQuestStatusSchema = z.object({
  status: questStatusSchema,
});

export type CreateQuestInput = z.infer<typeof createQuestSchema>;
export type UpdateQuestInput = z.infer<typeof updateQuestSchema>;
export type UpdateQuestStatusInput = z.infer<typeof updateQuestStatusSchema>;
