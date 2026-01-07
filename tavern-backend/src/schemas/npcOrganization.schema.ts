// src/schemas/npcOrganization.schema.ts
import { z } from "zod";

export const trustTierSchema = z.enum(["LOW", "MEDIUM", "HIGH"]);

const optionalUrl = z.preprocess(
  (val) => {
    if (typeof val !== "string") return val;
    const trimmed = val.trim();
    return trimmed === "" ? undefined : trimmed;
  },
  z.string().url("Website must be a valid URL (example: https://site.com)").optional()
);

export const createNpcOrganizationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  domain: z.string().optional(),
  website: optionalUrl,
});

export const updateNpcOrganizationSelfSchema = createNpcOrganizationSchema.partial();

export const updateNpcOrganizationAdminSchema = updateNpcOrganizationSelfSchema.extend({
  verified: z.boolean().optional(),
  trustScore: z.number().min(0).max(100).optional(),
  trustTier: trustTierSchema.optional(),
  isFlagged: z.boolean().optional(),
  totalQuestsPosted: z.number().int().min(0).optional(),
  totalGoldSpent: z.number().min(0).optional(),
  completionRate: z.number().min(0).max(100).optional(),
  disputeRate: z.number().min(0).max(100).optional(),
});

export type CreateNpcOrganizationInput = z.infer<typeof createNpcOrganizationSchema>;
export type UpdateNpcOrganizationSelfInput = z.infer<typeof updateNpcOrganizationSelfSchema>;
export type UpdateNpcOrganizationAdminInput = z.infer<typeof updateNpcOrganizationAdminSchema>;


