"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = exports.UserService = void 0;
// src/services/user.service.ts
const error_middleware_1 = require("../middleware/error.middleware");
const user_model_1 = require("../models/user.model");
class UserService {
    async createUser(data) {
        // Check if user already exists by Supabase id or email
        const existing = await user_model_1.UserModel.findOne({
            $or: [{ _id: data.id }, { email: data.email }],
        }).exec();
        if (existing) {
            throw new error_middleware_1.AppError(409, 'User with this id or email already exists');
        }
        const user = await user_model_1.UserModel.create({
            _id: data.id, // store Supabase id as Mongo _id
            email: data.email,
            username: data.username,
            displayName: data.displayName,
            avatarUrl: data.avatarUrl || undefined,
            role: data.role || 'ADVENTURER',
        });
        return user;
    }
    async getUsers() {
        const users = await user_model_1.UserModel.find().exec();
        return users;
    }
    async getUserById(id) {
        const user = await user_model_1.UserModel.findById(id).exec();
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        return user;
    }
    async updateUser(id, data) {
        const user = await user_model_1.UserModel.findByIdAndUpdate(id, { ...data }, { new: true }).exec();
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
        return user;
    }
    async deleteUser(id) {
        const user = await user_model_1.UserModel.findByIdAndDelete(id).exec();
        if (!user) {
            throw new error_middleware_1.AppError(404, 'User not found');
        }
    }
}
exports.UserService = UserService;
exports.userService = new UserService();
