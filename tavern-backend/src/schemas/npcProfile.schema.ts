// src/schemas/npcProfile.schema.ts
import { z } from "zod";

export const createNPCProfileSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  organization: z.string().optional(),
  location: z.string().optional(),
});

export const updateNPCProfileSchema = createNPCProfileSchema.partial();

