"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMiddleware = void 0;
const http_status_codes_1 = require("http-status-codes");
const winston = __importStar(require("winston"));
const os_1 = __importDefault(require("os"));
require("winston-daily-rotate-file");
const custom_error_1 = require("../errors/custom.error");
const myFormat = winston.format.printf((info) => {
    if (info.meta && info.meta instanceof Error) {
        return `${info.timestamp} ${info.level} ${info.message} : ${info.meta.stack}`;
    }
    return `${info.timestamp} ${info.level}: ${info.message}`;
});
const logFormat = winston.format.combine(winston.format.colorize(), winston.format.uncolorize(), winston.format.splat(), winston.format.errors({ stack: true }), winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }), winston.format.align(), winston.format.prettyPrint({ depth: 5 }), myFormat);
const consoleFormat = winston.format.combine(winston.format.colorize(), winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss',
}), winston.format.align(), 
/* winston.format.prettyPrint({
    depth: 5
}), */
myFormat);
var fileTransport = new winston.transports.DailyRotateFile({
    level: "info",
    filename: "%DATE%-app-log.log",
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    dirname: 'log',
    maxSize: '20m',
    json: true,
    format: logFormat,
});
var consoleTransport = new winston.transports.Console({
    level: "debug",
    format: consoleFormat,
    handleExceptions: true,
});
class ErrorMiddleware {
}
exports.ErrorMiddleware = ErrorMiddleware;
ErrorMiddleware.handleError = (error, request, res, next) => {
    const userInfo = os_1.default.userInfo();
    const userName = userInfo.username;
    //Winston Logger
    const logger = winston.createLogger({
        transports: [
            consoleTransport,
            fileTransport
        ],
        exitOnError: false, // no salir en caso de excepciones controladas
    });
    if (error instanceof custom_error_1.AppError) {
        const { message, name, stack, validationErrors } = error;
        const statusCode = error.statusCode;
        logger.error(`${userName}--${message}`, error);
        res.status(statusCode).json({ name, message, validationErrors });
    }
    else {
        const rError = custom_error_1.AppError.internalServer("Se produjo un error interno del servidor");
        logger.error(`${userName}--${rError.message}`, error);
        const statusCode = http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(statusCode).json(rError);
    }
    next();
};
