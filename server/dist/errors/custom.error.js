"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
const http_status_codes_1 = require("http-status-codes");
class AppError extends Error {
    constructor(args) {
        const { message, name, statusCode, isOperational, validationErrors } = args;
        super(message);
        this.isOperational = true;
        Object.setPrototypeOf(this, new.target.prototype);
        this.name = name ?? "Error en la aplicacion";
        this.statusCode = statusCode;
        if (isOperational !== undefined)
            this.isOperational = isOperational;
        this.validationErrors = validationErrors;
        Error.captureStackTrace(this);
    }
    static badRequest(message, validationErrors) {
        return new AppError({
            name: "BadRequestError",
            message,
            statusCode: http_status_codes_1.StatusCodes.BAD_REQUEST,
            validationErrors,
        });
    }
    static unauthorized(message) {
        return new AppError({
            name: "UnauthorizedError",
            message,
            statusCode: http_status_codes_1.StatusCodes.UNAUTHORIZED,
        });
    }
    static forbidden(message) {
        return new AppError({
            name: "ForbiddenError",
            message,
            statusCode: http_status_codes_1.StatusCodes.FORBIDDEN,
        });
    }
    static notFound(message) {
        return new AppError({
            name: "NotFoundError",
            message,
            statusCode: http_status_codes_1.StatusCodes.NOT_FOUND,
        });
    }
    static internalServer(message) {
        return new AppError({
            name: "InternalServerError",
            message,
            statusCode: http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR,
        });
    }
}
exports.AppError = AppError;
