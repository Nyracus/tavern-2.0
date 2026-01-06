// src/routes/user.routes.ts
import { Router } from 'express';
import { userController } from '../controllers/user.controller';

const router = Router();

// Adventurers / NPCs / Guild Masters
router.post('/', (req, res, next) => userController.createUser(req, res, next));
router.get('/', (req, res, next) => userController.getUsers(req, res, next));
router.get('/:id', (req, res, next) => userController.getUserById(req, res, next));
router.patch('/:id', (req, res, next) => userController.updateUser(req, res, next));
router.delete('/:id', (req, res, next) => userController.deleteUser(req, res, next));

export default router;
