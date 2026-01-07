// src/middleware/error.middleware.ts
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// 404 handler
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(404, `Route ${req.originalUrl} not found`));
};

// Global error handler
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) return next(err);

  // ✅ Zod validation errors -> 400 with field details
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));

    if (process.env.NODE_ENV !== "production") {
      console.error("ZodError:", issues);
    }

    return res.status(400).json({
      success: false,
      message: "Validation error",
      issues,
    });
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const message = isAppError
    ? err.message
    : "Something went wrong, please try again later";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
  });
};


