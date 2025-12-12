import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

// Extender la interfaz Request para incluir userId y userRole
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      userEmail?: string;
      userRole?: string;
      userRoleId?: number;
    }
  }
}

interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
}

/**
 * Middleware para verificar JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Acceso denegado. No se proporcionó token de autenticación.',
        code: 'NO_TOKEN'
      });
    }

    // Verificar token
    const secretKey = process.env.SECRET_KEY || 'default-secret-key';

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Token expirado o inválido
        if (err.name === 'TokenExpiredError') {
          return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'Token expirado. Por favor inicie sesión nuevamente.',
            code: 'TOKEN_EXPIRED'
          });
        }

        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'Token inválido o mal formado.',
          code: 'INVALID_TOKEN'
        });
      }

      // Token válido - agregar información al request
      const payload = decoded as JwtPayload;
      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.userRole = payload.roleName;
      req.userRoleId = payload.roleId;

      next();
    });

  } catch (error) {
    console.error('Error en authenticateToken:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al verificar autenticación'
    });
  }
};

/**
 * Middleware para verificar rol del usuario
 * @param allowedRoles - Array de roles permitidos
 */
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userRole) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'No autenticado. Por favor inicie sesión.',
          code: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar si el rol del usuario está en los roles permitidos (case-insensitive)
      const normalizedUserRole = req.userRole.toLowerCase();
      const normalizedAllowed = allowedRoles.map(r => r.toLowerCase());

      if (!normalizedAllowed.includes(normalizedUserRole)) {
        return res.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: `Acceso denegado. Esta acción requiere rol: ${allowedRoles.join(' o ')}`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requiredRoles: allowedRoles,
          userRole: req.userRole
        });
      }

      next();

    } catch (error) {
      console.error('Error en authorizeRoles:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al verificar permisos'
      });
    }
  };
};

/**
 * Middleware opcional - permite acceso sin token pero agrega info si existe
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Sin token, continuar sin autenticación
      return next();
    }

    const secretKey = process.env.SECRET_KEY || 'default-secret-key';

    jwt.verify(token, secretKey, (err, decoded) => {
      if (!err && decoded) {
        const payload = decoded as JwtPayload;
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.userRole = payload.roleName;
        req.userRoleId = payload.roleId;
      }
      next();
    });

  } catch (error) {
    // En caso de error, simplemente continuar sin autenticación
    next();
  }
};
