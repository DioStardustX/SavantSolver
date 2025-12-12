"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authorizeRoles = exports.authenticateToken = void 0;
const http_status_codes_1 = require("http-status-codes");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Middleware para verificar JWT token
 */
const authenticateToken = (req, res, next) => {
    try {
        // Obtener token del header Authorization
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Acceso denegado. No se proporcionó token de autenticación.',
                code: 'NO_TOKEN'
            });
        }
        // Verificar token
        const secretKey = process.env.SECRET_KEY || 'default-secret-key';
        jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
            if (err) {
                // Token expirado o inválido
                if (err.name === 'TokenExpiredError') {
                    return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                        success: false,
                        message: 'Token expirado. Por favor inicie sesión nuevamente.',
                        code: 'TOKEN_EXPIRED'
                    });
                }
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    message: 'Token inválido o mal formado.',
                    code: 'INVALID_TOKEN'
                });
            }
            // Token válido - agregar información al request
            const payload = decoded;
            req.userId = payload.userId;
            req.userEmail = payload.email;
            req.userRole = payload.roleName;
            req.userRoleId = payload.roleId;
            next();
        });
    }
    catch (error) {
        console.error('Error en authenticateToken:', error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al verificar autenticación'
        });
    }
};
exports.authenticateToken = authenticateToken;
/**
 * Middleware para verificar rol del usuario
 * @param allowedRoles - Array de roles permitidos
 */
const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        try {
            if (!req.userRole) {
                return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                    success: false,
                    message: 'No autenticado. Por favor inicie sesión.',
                    code: 'NOT_AUTHENTICATED'
                });
            }
            // Verificar si el rol del usuario está en los roles permitidos (case-insensitive)
            const normalizedUserRole = req.userRole.toLowerCase();
            const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());
            if (!normalizedAllowed.includes(normalizedUserRole)) {
                return res.status(http_status_codes_1.StatusCodes.FORBIDDEN).json({
                    success: false,
                    message: `Acceso denegado. Esta acción requiere rol: ${allowedRoles.join(' o ')}`,
                    code: 'INSUFFICIENT_PERMISSIONS',
                    requiredRoles: allowedRoles,
                    userRole: req.userRole
                });
            }
            next();
        }
        catch (error) {
            console.error('Error en authorizeRoles:', error);
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error al verificar permisos'
            });
        }
    };
};
exports.authorizeRoles = authorizeRoles;
/**
 * Middleware opcional - permite acceso sin token pero agrega info si existe
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            // Sin token, continuar sin autenticación
            return next();
        }
        const secretKey = process.env.SECRET_KEY || 'default-secret-key';
        jsonwebtoken_1.default.verify(token, secretKey, (err, decoded) => {
            if (!err && decoded) {
                const payload = decoded;
                req.userId = payload.userId;
                req.userEmail = payload.email;
                req.userRole = payload.roleName;
                req.userRoleId = payload.roleId;
            }
            next();
        });
    }
    catch (error) {
        // En caso de error, simplemente continuar sin autenticación
        next();
    }
};
exports.optionalAuth = optionalAuth;
