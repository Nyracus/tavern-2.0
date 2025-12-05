import { NextFunction, Request, Response } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './error.middleware';

export const validateRequest = (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      return next(new AppError(400, err.errors?.[0]?.message || 'Validation failed'));
    }
  };