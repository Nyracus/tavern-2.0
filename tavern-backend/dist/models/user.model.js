"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
// src/models/user.model.ts
const mongoose_1 = require("mongoose");
const UserSchema = new mongoose_1.Schema({
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    avatarUrl: { type: String },
    role: {
        type: String,
        enum: ['ADVENTURER', 'NPC', 'GUILD_MASTER'],
        default: 'ADVENTURER',
    },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)('User', UserSchema);
