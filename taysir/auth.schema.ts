import { z } from 'zod';

export const registerSchema = z.object({
  id: z.string().min(1, 'id is required').optional(),     // maps to _id, optional for auto-generation
  email: z.string().email(),
  username: z.string().min(3),
  displayName: z.string().min(1),
  avatarUrl: z.string().url().optional(),
  role: z.enum(['ADVENTURER', 'NPC', 'GUILD_MASTER']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
