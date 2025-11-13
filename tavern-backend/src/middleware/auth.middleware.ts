import { NextFunction, Request, Response } from 'express';
import { verifyJwt } from '../config/jwt.config';
import { AppError } from './error.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: 'ADVENTURER' | 'NPC' | 'GUILD_MASTER' };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.substring(7) : null;
  if (!token) return next(new AppError(401, 'Missing Authorization header'));

  try {
    const payload = verifyJwt(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return next(new AppError(401, 'Invalid or expired token'));
  }
};

export const requireRole = (...roles: Array<'ADVENTURER' | 'NPC' | 'GUILD_MASTER'>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(401, 'Not authenticated'));
    if (!roles.includes(req.user.role)) return next(new AppError(403, 'Forbidden'));
    next();
  };
