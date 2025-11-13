"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = exports.createUserSchema = exports.userRoleSchema = void 0;
// src/schemas/user.schema.ts
const zod_1 = require("zod");
exports.userRoleSchema = zod_1.z.enum(['ADVENTURER', 'NPC', 'GUILD_MASTER']);
exports.createUserSchema = zod_1.z.object({
    // Supabase user id
    id: zod_1.z.string().min(1, 'User id is required'),
    email: zod_1.z.string().email(),
    username: zod_1.z.string().min(3, 'Username must be at least 3 characters'),
    displayName: zod_1.z.string().min(1, 'Display name is required'),
    avatarUrl: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    role: exports.userRoleSchema.optional(),
});
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z.string().min(3).optional(),
    displayName: zod_1.z.string().min(1).optional(),
    avatarUrl: zod_1.z.string().url().optional(),
    role: exports.userRoleSchema.optional(),
});
