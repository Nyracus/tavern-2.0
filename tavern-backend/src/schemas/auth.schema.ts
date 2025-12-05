import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  displayName: z.string().min(1),
  password: z.string().min(6),
  role: z.enum(["ADVENTURER", "NPC", "GUILD_MASTER"]).optional(),
  avatarUrl: z.string().url().optional(),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1),
  password: z.string().min(6),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
