import { Request, Response, NextFunction } from 'express';
import { registerSchema, loginSchema } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      res.status(201).json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      res.json({ success: true, ...result });
    } catch (err) { next(err); }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.me(req.user!.id);
      res.json({ success: true, user: result });
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
