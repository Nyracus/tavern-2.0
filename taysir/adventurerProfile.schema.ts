// src/schemas/adventurerProfile.schema.ts
import { z } from 'zod';

const attributesSchema = z.object({
  strength: z.number().int().min(1).max(20),
  dexterity: z.number().int().min(1).max(20),
  intelligence: z.number().int().min(1).max(20),
  charisma: z.number().int().min(1).max(20),
  vitality: z.number().int().min(1).max(20),
  luck: z.number().int().min(1).max(20),
});

export const adventurerSkillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  level: z.number().int().min(1).max(10),
  category: z.string().optional(),
  cooldown: z.string().optional(),
});

export const createAdventurerProfileSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  class: z.string().min(1),
  level: z.number().int().min(1),

  race: z.string().optional(),
  background: z.string().optional(),

  attributes: attributesSchema,
  skills: z.array(adventurerSkillSchema).optional(),
});

export const updateAdventurerProfileSchema =
  createAdventurerProfileSchema.partial();

export const addSkillSchema = adventurerSkillSchema;
export const updateSkillSchema = adventurerSkillSchema.partial();

export type CreateAdventurerProfileInput = z.infer<
  typeof createAdventurerProfileSchema
>;
export type UpdateAdventurerProfileInput = z.infer<
  typeof updateAdventurerProfileSchema
>;
export type AddSkillInput = z.infer<typeof addSkillSchema>;
export type UpdateSkillInput = z.infer<typeof updateSkillSchema>;
