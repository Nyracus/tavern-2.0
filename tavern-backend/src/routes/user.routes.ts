// src/routes/user.routes.ts
import { Router } from 'express';
import { verifyToken, authorizeRole } from '../middleware/auth.middleware';
import { userController } from '../controllers/user.controller';

const router = Router();

// Adventurers / NPCs / Guild Masters
router.post('/', (req, res, next) => userController.createUser(req, res, next));
// Only Guild Masters can list users
router.get('/', verifyToken, authorizeRole("GUILD_MASTER"), (req, res, next) => userController.getUsers(req, res, next));
router.get('/:id', verifyToken, authorizeRole("GUILD_MASTER"), (req, res, next) => userController.getUserById(req, res, next));
router.patch('/:id', verifyToken, authorizeRole("GUILD_MASTER"), (req, res, next) => userController.updateUser(req, res, next));
// Delete is handled by admin routes, but keeping this for backward compatibility
router.delete('/:id', verifyToken, authorizeRole("GUILD_MASTER"), (req, res, next) => userController.deleteUser(req, res, next));

export default router;
