"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCurrentUser = exports.login = exports.register = void 0;
const http_status_codes_1 = require("http-status-codes");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../prisma"));
const notificationHelper_1 = require("../utils/notificationHelper");
// Validar complejidad de contraseña
const validatePasswordStrength = (password) => {
    const errors = [];
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
const register = async (req, res, next) => {
    try {
        const { email, firstName, lastName, password, phone } = req.body;
        // Validaciones de campos obligatorios
        if (!email || !firstName || !lastName || !password) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
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
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Formato de email inválido',
                errors: {
                    email: 'Por favor ingrese un email válido'
                }
            });
        }
        // Validar que el email no exista (email único en BD)
        const usuarioExistente = await prisma_1.default.user.findUnique({
            where: { email: email.toLowerCase() }
        });
        if (usuarioExistente) {
            return res.status(http_status_codes_1.StatusCodes.CONFLICT).json({
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
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'La contraseña no cumple con los requisitos de seguridad',
                errors: {
                    password: passwordValidation.errors
                }
            });
        }
        // Obtener el rol de cliente por defecto
        const roleCliente = await prisma_1.default.role.findUnique({
            where: { name: 'cliente' }
        });
        if (!roleCliente) {
            return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
                success: false,
                message: 'Error de configuración: Rol cliente no encontrado'
            });
        }
        // Encriptar contraseña con bcrypt (10 rounds)
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Crear el usuario
        const nuevoUsuario = await prisma_1.default.user.create({
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
        const secretKey = process.env.SECRET_KEY || 'default-secret-key';
        const payload = {
            userId: nuevoUsuario.id,
            email: nuevoUsuario.email,
            roleId: nuevoUsuario.role.id,
            roleName: nuevoUsuario.role.name
        };
        const options = {
            expiresIn: '1h'
        };
        const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
        return res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: nuevoUsuario,
                token,
                expiresIn: '1h'
            }
        });
    }
    catch (error) {
        console.error('Error en register:', error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al registrar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.register = register;
/**
 * Login de usuario con validación de credenciales
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Validar campos obligatorios
        if (!email || !password) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Email y contraseña son obligatorios',
                errors: {
                    email: !email ? 'El email es obligatorio' : undefined,
                    password: !password ? 'La contraseña es obligatoria' : undefined,
                }
            });
        }
        // Buscar usuario por email
        const usuario = await prisma_1.default.user.findUnique({
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
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Credenciales inválidas',
                errors: {
                    general: 'Email o contraseña incorrectos. Por favor verifique sus credenciales.'
                }
            });
        }
        // Verificar contraseña
        const passwordMatch = await bcryptjs_1.default.compare(password, usuario.passwordHash);
        if (!passwordMatch) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'Credenciales inválidas',
                errors: {
                    general: 'Email o contraseña incorrectos. Por favor verifique sus credenciales.'
                }
            });
        }
        // Actualizar último inicio de sesión
        await prisma_1.default.user.update({
            where: { id: usuario.id },
            data: { lastLogin: new Date() }
        });
        // Crear notificación de inicio de sesión
        await (0, notificationHelper_1.createLoginNotification)(usuario.id);
        // Generar JWT token
        const secretKey = process.env.SECRET_KEY || 'default-secret-key';
        const payload = {
            userId: usuario.id,
            email: usuario.email,
            roleId: usuario.role.id,
            roleName: usuario.role.name
        };
        const options = {
            expiresIn: '1h'
        };
        const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
        // Remover passwordHash de la respuesta
        const { passwordHash, ...usuarioSinPassword } = usuario;
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: usuarioSinPassword,
                token,
                expiresIn: '1h'
            }
        });
    }
    catch (error) {
        console.error('Error en login:', error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al iniciar sesión',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.login = login;
/**
 * Obtener información del usuario actual (autenticado)
 */
const getCurrentUser = async (req, res, next) => {
    try {
        // @ts-ignore - userId es agregado por el middleware de autenticación
        const userId = req.userId;
        if (!userId) {
            return res.status(http_status_codes_1.StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'No autenticado'
            });
        }
        const usuario = await prisma_1.default.user.findUnique({
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
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: usuario
        });
    }
    catch (error) {
        console.error('Error en getCurrentUser:', error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al obtener información del usuario',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.getCurrentUser = getCurrentUser;
/**
 * Logout (opcional - principalmente para limpieza del lado del cliente)
 */
const logout = async (req, res, next) => {
    try {
        return res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
    }
    catch (error) {
        console.error('Error en logout:', error);
        return res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al cerrar sesión',
            error: error instanceof Error ? error.message : 'Error desconocido'
        });
    }
};
exports.logout = logout;
