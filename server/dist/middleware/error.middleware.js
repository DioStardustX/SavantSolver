"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const custom_error_1 = require("../errors/custom.error");
class ErrorMiddleware {
}
exports.ErrorMiddleware = ErrorMiddleware;
ErrorMiddleware.handleError = (error, request, res, next) => {
    if (error instanceof custom_error_1.AppError) {
        const { message, name, validationErrors } = error;
        const statusCode = error.statusCode;
        console.error(`[ERROR] ${name}: ${message}`);
        res.status(statusCode).json({ name, message, validationErrors });
    }
    else {
        const rError = custom_error_1.AppError.internalServer("Se produjo un error interno del servidor");
        console.error(`[ERROR] Internal Server Error:`, error);
        const statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(statusCode).json(rError);
    }
};
