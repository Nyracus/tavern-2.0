// src/schemas/user.schema.ts
import { z } from 'zod';

export const userRoleSchema = z.enum(['ADVENTURER', 'NPC', 'GUILD_MASTER']);

export const createUserSchema = z.object({
  // Supabase user id
  id: z.string().min(1, 'User id is required'),
  email: z.string().email(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  displayName: z.string().min(1, 'Display name is required'),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  role: userRoleSchema.optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const updateUserSchema = z.object({
  username: z.string().min(3).optional(),
  displayName: z.string().min(1).optional(),
  avatarUrl: z.string().url().optional(),
  role: userRoleSchema.optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
