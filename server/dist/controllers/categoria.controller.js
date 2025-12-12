"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriaController = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const custom_error_1 = require("../errors/custom.error");
class CategoriaController {
    constructor() {
        this.prisma = prisma_1.default;
        // Listado de categorías
        this.get = async (request, response, next) => {
            try {
                const categorias = await this.prisma.category.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        sla: {
                            select: {
                                name: true,
                            },
                        },
                    },
                    orderBy: {
                        name: "asc",
                    },
                });
                response.json(categorias);
            }
            catch (error) {
                next(error);
            }
        };
        // Obtener categoría por ID
        this.getById = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const categoria = await this.prisma.category.findFirst({
                    where: {
                        id: id,
                    },
                    include: {
                        sla: {
                            select: {
                                id: true,
                                name: true,
                                responseTimeMinutes: true,
                                resolutionTimeMinutes: true,
                            },
                        },
                        tags: {
                            select: {
                                tag: {
                                    select: {
                                        id: true,
                                        name: true,
                                        description: true,
                                    },
                                },
                            },
                        },
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
                if (!categoria) {
                    return next(custom_error_1.AppError.notFound("Categoría no encontrada"));
                }
                response.json(categoria);
            }
            catch (error) {
                next(error);
            }
        };
        // Crear categoría
        this.create = async (request, response, next) => {
            try {
                const { name, description, slaId, slaName, responseTimeMinutes, resolutionTimeMinutes, tagIds, specialtyIds } = request.body;
                if (!name) {
                    return next(custom_error_1.AppError.badRequest("El nombre es requerido"));
                }
                const categoriaExistente = await this.prisma.category.findUnique({
                    where: { name },
                });
                if (categoriaExistente) {
                    return next(custom_error_1.AppError.badRequest("Ya existe una categoría con ese nombre"));
                }
                // Convertir slaId a número si es string, o null si no existe
                let finalSlaId = null;
                if (slaId) {
                    const parsedSlaId = typeof slaId === 'string' ? parseInt(slaId) : slaId;
                    if (isNaN(parsedSlaId)) {
                        return next(custom_error_1.AppError.badRequest("El ID del SLA no es válido"));
                    }
                    finalSlaId = parsedSlaId;
                }
                // Si no se proporcionó un slaId pero sí tiempos de respuesta/resolución, crear SLA
                if (!finalSlaId && responseTimeMinutes && resolutionTimeMinutes) {
                    // Convertir a números
                    const respTime = typeof responseTimeMinutes === 'string'
                        ? parseInt(responseTimeMinutes)
                        : responseTimeMinutes;
                    const resolTime = typeof resolutionTimeMinutes === 'string'
                        ? parseInt(resolutionTimeMinutes)
                        : resolutionTimeMinutes;
                    // Validaciones de SLA
                    if (respTime <= 0) {
                        return next(custom_error_1.AppError.badRequest("El tiempo de respuesta debe ser mayor a cero"));
                    }
                    if (resolTime <= respTime) {
                        return next(custom_error_1.AppError.badRequest("El tiempo de resolución debe ser mayor que el tiempo de respuesta"));
                    }
                    // Crear nombre automático si no se proporcionó
                    const autoSlaName = slaName || `SLA_${name}_${Date.now()}`;
                    // Crear el SLA
                    const nuevoSla = await this.prisma.sla.create({
                        data: {
                            name: autoSlaName,
                            responseTimeMinutes: respTime,
                            resolutionTimeMinutes: resolTime,
                        },
                    });
                    finalSlaId = nuevoSla.id;
                }
                // Convertir arrays de IDs a números
                const parsedTagIds = tagIds && Array.isArray(tagIds)
                    ? tagIds.map((id) => typeof id === 'string' ? parseInt(id) : id)
                    : [];
                const parsedSpecialtyIds = specialtyIds && Array.isArray(specialtyIds)
                    ? specialtyIds.map((id) => typeof id === 'string' ? parseInt(id) : id)
                    : [];
                const nuevaCategoria = await this.prisma.category.create({
                    data: {
                        name,
                        description,
                        slaId: finalSlaId,
                        tags: parsedTagIds.length > 0 ? {
                            create: parsedTagIds.map((tagId) => ({
                                tagId,
                            })),
                        } : undefined,
                        specialties: parsedSpecialtyIds.length > 0 ? {
                            create: parsedSpecialtyIds.map((specialtyId) => ({
                                specialtyId,
                            })),
                        } : undefined,
                    },
                    include: {
                        sla: true,
                        tags: {
                            select: {
                                tag: true,
                            },
                        },
                        specialties: {
                            select: {
                                specialty: true,
                            },
                        },
                    },
                });
                response.status(201).json(nuevaCategoria);
            }
            catch (error) {
                next(error);
            }
        };
        // Actualizar categoría
        this.update = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const { name, description, slaId, slaName, responseTimeMinutes, resolutionTimeMinutes, tagIds, specialtyIds } = request.body;
                const categoriaExistente = await this.prisma.category.findUnique({
                    where: { id },
                });
                if (!categoriaExistente) {
                    return next(custom_error_1.AppError.notFound("Categoría no encontrada"));
                }
                // Determinar si se debe crear un nuevo SLA o usar uno existente
                let finalSlaId = undefined;
                if (slaId !== undefined) {
                    // Si slaId es null o vacío, establecer como null
                    if (slaId === null || slaId === '') {
                        finalSlaId = null;
                    }
                    else {
                        // Convertir a número
                        const parsedSlaId = typeof slaId === 'string' ? parseInt(slaId) : slaId;
                        if (isNaN(parsedSlaId)) {
                            return next(custom_error_1.AppError.badRequest("El ID del SLA no es válido"));
                        }
                        finalSlaId = parsedSlaId;
                    }
                }
                // Si no se proporcionó un slaId pero sí tiempos de respuesta/resolución, crear SLA
                if (finalSlaId === undefined && responseTimeMinutes && resolutionTimeMinutes) {
                    // Convertir a números
                    const respTime = typeof responseTimeMinutes === 'string'
                        ? parseInt(responseTimeMinutes)
                        : responseTimeMinutes;
                    const resolTime = typeof resolutionTimeMinutes === 'string'
                        ? parseInt(resolutionTimeMinutes)
                        : resolutionTimeMinutes;
                    // Validaciones de SLA
                    if (respTime <= 0) {
                        return next(custom_error_1.AppError.badRequest("El tiempo de respuesta debe ser mayor a cero"));
                    }
                    if (resolTime <= respTime) {
                        return next(custom_error_1.AppError.badRequest("El tiempo de resolución debe ser mayor que el tiempo de respuesta"));
                    }
                    // Crear nombre automático si no se proporcionó
                    const autoSlaName = slaName || `SLA_${name || categoriaExistente.name}_${Date.now()}`;
                    // Crear el SLA
                    const nuevoSla = await this.prisma.sla.create({
                        data: {
                            name: autoSlaName,
                            responseTimeMinutes: respTime,
                            resolutionTimeMinutes: resolTime,
                        },
                    });
                    finalSlaId = nuevoSla.id;
                }
                // Si se proporcionan tagIds, actualizar las etiquetas
                if (tagIds !== undefined) {
                    await this.prisma.categoryTag.deleteMany({
                        where: { categoryId: id },
                    });
                    if (Array.isArray(tagIds) && tagIds.length > 0) {
                        // Convertir IDs a números
                        const parsedTagIds = tagIds.map((tagId) => typeof tagId === 'string' ? parseInt(tagId) : tagId);
                        await this.prisma.categoryTag.createMany({
                            data: parsedTagIds.map((tagId) => ({
                                categoryId: id,
                                tagId,
                            })),
                        });
                    }
                }
                // Si se proporcionan specialtyIds, actualizar las especialidades
                if (specialtyIds !== undefined) {
                    await this.prisma.categorySpecialty.deleteMany({
                        where: { categoryId: id },
                    });
                    if (Array.isArray(specialtyIds) && specialtyIds.length > 0) {
                        // Convertir IDs a números
                        const parsedSpecialtyIds = specialtyIds.map((specialtyId) => typeof specialtyId === 'string' ? parseInt(specialtyId) : specialtyId);
                        await this.prisma.categorySpecialty.createMany({
                            data: parsedSpecialtyIds.map((specialtyId) => ({
                                categoryId: id,
                                specialtyId,
                            })),
                        });
                    }
                }
                const categoriaActualizada = await this.prisma.category.update({
                    where: { id },
                    data: {
                        ...(name && { name }),
                        ...(description !== undefined && { description }),
                        ...(finalSlaId !== undefined && { slaId: finalSlaId }),
                    },
                    include: {
                        sla: true,
                        tags: {
                            select: {
                                tag: true,
                            },
                        },
                        specialties: {
                            select: {
                                specialty: true,
                            },
                        },
                    },
                });
                response.json(categoriaActualizada);
            }
            catch (error) {
                next(error);
            }
        };
        // Eliminar categoría
        this.delete = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                // Verificar si la categoría tiene tickets asociados
                const ticketsAsociados = await this.prisma.ticket.count({
                    where: {
                        categoryId: id,
                    },
                });
                if (ticketsAsociados > 0) {
                    return next(custom_error_1.AppError.badRequest(`No se puede eliminar la categoría porque tiene ${ticketsAsociados} ticket(s) asociado(s)`));
                }
                await this.prisma.category.delete({
                    where: { id },
                });
                response.json({ message: "Categoría eliminada exitosamente" });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.CategoriaController = CategoriaController;
