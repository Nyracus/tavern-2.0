// src/controllers/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import {
  createUserSchema,
  updateUserSchema,
} from '../schemas/user.schema';
import { userService } from '../services/user.service';

export class UserController {
  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createUserSchema.parse(req.body);
      const user = await userService.createUser(parsed);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await userService.getUsers();
      res.json({ success: true, data: users });
    } catch (err) {
      next(err);
    }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async updateUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const parsed = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(id, parsed);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await userService.deleteUser(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
