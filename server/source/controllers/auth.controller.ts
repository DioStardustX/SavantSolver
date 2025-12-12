import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import prisma from '../prisma';
import { createLoginNotification } from '../utils/notificationHelper';

// Interfaz para el payload del JWT
interface JwtPayload {
  userId: number;
  email: string;
  roleId: number;
  roleName: string;
}

// Validar complejidad de contraseña
const validatePasswordStrength = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe contener al menos un carácter especial (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Registro de nuevo usuario con validaciones completas
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, firstName, lastName, password, phone } = req.body;

    // Validaciones de campos obligatorios
    if (!email || !firstName || !lastName || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Todos los campos obligatorios deben ser proporcionados',
        errors: {
          email: !email ? 'El email es obligatorio' : undefined,
          firstName: !firstName ? 'El nombre es obligatorio' : undefined,
          lastName: !lastName ? 'El apellido es obligatorio' : undefined,
          password: !password ? 'La contraseña es obligatoria' : undefined,
        }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Formato de email inválido',
        errors: {
          email: 'Por favor ingrese un email válido'
        }
      });
    }

    // Validar que el email no exista (email único en BD)
    const usuarioExistente = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (usuarioExistente) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'El email ya está registrado',
        errors: {
          email: 'Este email ya está en uso. Por favor use otro email o inicie sesión.'
        }
      });
    }

    // Validar complejidad de contraseña
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'La contraseña no cumple con los requisitos de seguridad',
        errors: {
          password: passwordValidation.errors
        }
      });
    }

    // Obtener el rol de cliente por defecto
    const roleCliente = await prisma.role.findUnique({
      where: { name: 'cliente' }
    });

    if (!roleCliente) {
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error de configuración: Rol cliente no encontrado'
      });
    }

    // Encriptar contraseña con bcrypt (10 rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const nuevoUsuario = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        firstName,
        lastName,
        phone: phone || null,
        passwordHash: hashedPassword,
        roleId: roleCliente.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    // Generar JWT token
    const secretKey: string = process.env.SECRET_KEY || 'default-secret-key';

    const payload = {
      userId: nuevoUsuario.id,
      email: nuevoUsuario.email,
      roleId: nuevoUsuario.role.id,
      roleName: nuevoUsuario.role.name
    };

    const options: SignOptions = {
      expiresIn: '1h'
    };

    const token = jwt.sign(payload, secretKey, options);

    return res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        user: nuevoUsuario,
        token,
        expiresIn: '1h'
      }
    });

  } catch (error) {
    console.error('Error en register:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Login de usuario con validación de credenciales
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // Validar campos obligatorios
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Email y contraseña son obligatorios',
        errors: {
          email: !email ? 'El email es obligatorio' : undefined,
          password: !password ? 'La contraseña es obligatoria' : undefined,
        }
      });
    }

    // Buscar usuario por email
    const usuario = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        passwordHash: true,
        status: true,
        workload: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        specialties: {
          select: {
            specialty: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    });

    // Usuario no encontrado
    if (!usuario) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: {
          general: 'Email o contraseña incorrectos. Por favor verifique sus credenciales.'
        }
      });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordMatch) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Credenciales inválidas',
        errors: {
          general: 'Email o contraseña incorrectos. Por favor verifique sus credenciales.'
        }
      });
    }

    // Actualizar último inicio de sesión
    await prisma.user.update({
      where: { id: usuario.id },
      data: { lastLogin: new Date() }
    });

    // Crear notificación de inicio de sesión
    await createLoginNotification(usuario.id);

    // Generar JWT token
    const secretKey: string = process.env.SECRET_KEY || 'default-secret-key';

    const payload = {
      userId: usuario.id,
      email: usuario.email,
      roleId: usuario.role.id,
      roleName: usuario.role.name
    };

    const options: SignOptions = {
      expiresIn: '1h'
    };

    const token = jwt.sign(payload, secretKey, options);

    // Remover passwordHash de la respuesta
    const { passwordHash, ...usuarioSinPassword } = usuario;

    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: usuarioSinPassword,
        token,
        expiresIn: '1h'
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Obtener información del usuario actual (autenticado)
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // @ts-ignore - userId es agregado por el middleware de autenticación
    const userId = req.userId;

    if (!userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'No autenticado'
      });
    }

    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        workload: true,
        lastLogin: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
          }
        },
        specialties: {
          select: {
            specialty: {
              select: {
                id: true,
                name: true,
                description: true,
              }
            }
          }
        }
      }
    });

    if (!usuario) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    return res.status(StatusCodes.OK).json({
      success: true,
      data: usuario
    });

  } catch (error) {
    console.error('Error en getCurrentUser:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al obtener información del usuario',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};

/**
 * Logout (opcional - principalmente para limpieza del lado del cliente)
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(StatusCodes.OK).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al cerrar sesión',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
};
