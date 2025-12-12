"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eliminarUsuario = exports.actualizarUsuario = exports.crearUsuario = exports.obtenerUsuarioPorId = exports.obtenerUsuarios = void 0;
const http_status_codes_1 = require("http-status-codes");
const prisma_1 = __importDefault(require("../prisma"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Obtener todos los usuarios con filtro opcional por rol
const obtenerUsuarios = async (req, res) => {
    try {
        const { roleName } = req.query;
        // Construir el where clause
        const whereClause = {};
        // Si se especifica un rol, filtrar por ese rol
        if (roleName) {
            const role = await prisma_1.default.role.findUnique({
                where: { name: roleName },
            });
            if (role) {
                whereClause.roleId = role.id;
            }
        }
        const usuarios = await prisma_1.default.user.findMany({
            where: whereClause,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                workload: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: usuarios,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.obtenerUsuarios = obtenerUsuarios;
// Obtener un usuario por ID con sus tickets y especialidades
const obtenerUsuarioPorId = async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = await prisma_1.default.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                status: true,
                workload: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
                lastLogin: true,
                // Tickets creados por el usuario (para clientes)
                ticketsCreated: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        createdAt: true,
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                // Tickets asignados al técnico (para técnicos)
                ticketsAssigned: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        createdAt: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                        category: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                // Especialidades (para técnicos)
                specialties: {
                    select: {
                        specialty: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                },
            },
        });
        if (!usuario) {
            return res.status(http_status_codes_1.StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'Usuario no encontrado',
            });
        }
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            data: usuario,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.obtenerUsuarioPorId = obtenerUsuarioPorId;
// Crear un nuevo usuario
const crearUsuario = async (req, res) => {
    try {
        const { email, firstName, lastName, password, phone, roleName } = req.body;
        // Validar que el email no exista
        const usuarioExistente = await prisma_1.default.user.findUnique({
            where: { email },
        });
        if (usuarioExistente) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'El email ya está registrado',
            });
        }
        // Obtener el rol
        const role = await prisma_1.default.role.findUnique({
            where: { name: roleName || 'cliente' },
        });
        if (!role) {
            return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Rol no encontrado',
            });
        }
        // Hashear la contraseña
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Crear el usuario
        const nuevoUsuario = await prisma_1.default.user.create({
            data: {
                email,
                firstName,
                lastName,
                phone,
                passwordHash: hashedPassword,
                roleId: role.id,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                createdAt: true,
            },
        });
        res.status(http_status_codes_1.StatusCodes.CREATED).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: nuevoUsuario,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al crear usuario',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.crearUsuario = crearUsuario;
// Actualizar un usuario
const actualizarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        const { email, firstName, lastName, phone } = req.body;
        const usuarioActualizado = await prisma_1.default.user.update({
            where: { id: parseInt(id) },
            data: {
                ...(email && { email }),
                ...(firstName && { firstName }),
                ...(lastName && { lastName }),
                ...(phone !== undefined && { phone }),
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: usuarioActualizado,
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al actualizar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.actualizarUsuario = actualizarUsuario;
// Eliminar un usuario
const eliminarUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.user.delete({
            where: { id: parseInt(id) },
        });
        res.status(http_status_codes_1.StatusCodes.OK).json({
            success: true,
            message: 'Usuario eliminado exitosamente',
        });
    }
    catch (error) {
        res.status(http_status_codes_1.StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Error al eliminar usuario',
            error: error instanceof Error ? error.message : 'Error desconocido',
        });
    }
};
exports.eliminarUsuario = eliminarUsuario;
