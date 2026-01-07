import { Response, NextFunction } from "express";
import { authService } from "../services/auth.service";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { AuthRequest } from "../middleware/auth.middleware";

class AuthController {
  async register(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = req.body as RegisterInput;
      const result = await authService.register(input);
      return res.status(201).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async login(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = req.body as LoginInput;
      const result = await authService.login(input);
      return res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }

  async me(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      const user = await authService.me(req.userId);
      return res.json({ success: true, user });
    } catch (err) {
      next(err);
    }
  }

  async verifyEmail(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        return res
          .status(401)
          .json({ success: false, message: "Unauthenticated" });
      }

      await authService.verifyEmail(req.userId);
      return res.json({ success: true, message: "Email verified successfully" });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
