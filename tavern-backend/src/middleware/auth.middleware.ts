import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/jwt.config";
import { AppError } from "./error.middleware";
import type { Role } from "../models/user.model";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: Role;
  user?: {
    _id: string;
    username: string;
    displayName: string;
    role: Role;
  };
}

interface JwtPayload extends jwt.JwtPayload {
  sub?: string;
  role?: Role;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return next(new AppError(401, "Unauthenticated"));
  }

  const token = header.split(" ")[1];

  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!payload.sub) {
      return next(new AppError(401, "Invalid token"));
    }

    (req as AuthRequest).userId = payload.sub;
    (req as AuthRequest).userRole = payload.role;
    next();
  } catch {
    return next(new AppError(401, "Invalid token"));
  }
};

export const authorizeRole =
  (...allowed: Role[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { userRole } = req as AuthRequest;
    if (!userRole || !allowed.includes(userRole)) {
      return next(new AppError(403, "Forbidden"));
    }
    next();
  };
