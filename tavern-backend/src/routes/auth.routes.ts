import { Router } from "express";
import { validateRequest } from "../middleware/validation.middleware";
import { loginSchema, registerSchema } from "../schemas/auth.schema";
import { verifyToken } from "../middleware/auth.middleware";
import { authController } from "../controllers/auth.controller";

const router = Router();

router.post(
  "/register",
  validateRequest(registerSchema),
  authController.register
);

router.post(
  "/login",
  validateRequest(loginSchema),
  authController.login
);

router.get("/me", verifyToken, authController.me);

export default router;
