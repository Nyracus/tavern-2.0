"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.notFoundHandler = exports.AppError = void 0;
class AppError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        Object.setPrototypeOf(this, AppError.prototype);
    }
}
exports.AppError = AppError;
// Not found handler
const notFoundHandler = (req, res, next) => {
    next(new AppError(404, `Route ${req.originalUrl} not found`));
};
exports.notFoundHandler = notFoundHandler;
// Global error handler
const errorHandler = (err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    const statusCode = err instanceof AppError ? err.statusCode : 500;
    const message = err instanceof AppError
        ? err.message
        : 'Something went wrong, please try again later';
    if (process.env.NODE_ENV !== 'production') {
        console.error(err);
    }
    res.status(statusCode).json({
        success: false,
        message,
    });
};
exports.errorHandler = errorHandler;
