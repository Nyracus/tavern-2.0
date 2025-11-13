"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = void 0;
const user_schema_1 = require("../schemas/user.schema");
const user_service_1 = require("../services/user.service");
class UserController {
    async createUser(req, res, next) {
        try {
            const parsed = user_schema_1.createUserSchema.parse(req.body);
            const user = await user_service_1.userService.createUser(parsed);
            res.status(201).json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async getUsers(req, res, next) {
        try {
            const users = await user_service_1.userService.getUsers();
            res.json({ success: true, data: users });
        }
        catch (err) {
            next(err);
        }
    }
    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            const user = await user_service_1.userService.getUserById(id);
            res.json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const parsed = user_schema_1.updateUserSchema.parse(req.body);
            const user = await user_service_1.userService.updateUser(id, parsed);
            res.json({ success: true, data: user });
        }
        catch (err) {
            next(err);
        }
    }
    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            await user_service_1.userService.deleteUser(id);
            res.status(204).send();
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
