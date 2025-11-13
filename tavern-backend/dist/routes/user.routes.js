"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
// Adventurers / NPCs / Guild Masters
router.post('/', (req, res, next) => user_controller_1.userController.createUser(req, res, next));
router.get('/', (req, res, next) => user_controller_1.userController.getUsers(req, res, next));
router.get('/:id', (req, res, next) => user_controller_1.userController.getUserById(req, res, next));
router.patch('/:id', (req, res, next) => user_controller_1.userController.updateUser(req, res, next));
router.delete('/:id', (req, res, next) => user_controller_1.userController.deleteUser(req, res, next));
exports.default = router;
