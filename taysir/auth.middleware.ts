// src/middleware/auth.middleware.ts
import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../config/jwt.config';
import { AppError } from './error.middleware';
import type { UserRole } from '../models/user.model';

interface JwtPayload {
  sub: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

/**
 * Require that the user is authenticated via Bearer token.
 * Attaches { id, role } to req.user.
 */
export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;

  if (!token) {
    return next(new AppError(401, 'Missing Authorization header'));
  }

  try {
    const payload = verifyJwt(token) as JwtPayload;
    if (!payload?.sub || !payload?.role) {
      return next(new AppError(401, 'Invalid token payload'));
    }

    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
};

/**
 * Require that the authenticated user has at least one of the given roles.
 */
export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden'));
    }

    return next();
  };
