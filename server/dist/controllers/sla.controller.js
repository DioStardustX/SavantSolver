"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaController = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const custom_error_1 = require("../errors/custom.error");
class SlaController {
    constructor() {
        this.prisma = prisma_1.default;
        // Listado de SLAs
        this.get = async (request, response, next) => {
            try {
                const slas = await this.prisma.sla.findMany({
                    select: {
                        id: true,
                        name: true,
                        responseTimeMinutes: true,
                        resolutionTimeMinutes: true,
                    },
                    orderBy: {
                        name: "asc",
                    },
                });
                response.json(slas);
            }
            catch (error) {
                next(error);
            }
        };
        // Obtener SLA por ID
        this.getById = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const sla = await this.prisma.sla.findUnique({
                    where: { id },
                    include: {
                        categories: {
                            select: {
                                id: true,
                                name: true,
                                description: true,
                            },
                        },
                    },
                });
                if (!sla) {
                    return next(custom_error_1.AppError.notFound("SLA no encontrado"));
                }
                response.json(sla);
            }
            catch (error) {
                next(error);
            }
        };
        // Crear SLA
        this.create = async (request, response, next) => {
            try {
                const { name, responseTimeMinutes, resolutionTimeMinutes } = request.body;
                // Validaciones
                if (!name) {
                    return next(custom_error_1.AppError.badRequest("El nombre es requerido"));
                }
                if (!responseTimeMinutes || responseTimeMinutes <= 0) {
                    return next(custom_error_1.AppError.badRequest("El tiempo de respuesta debe ser mayor a cero"));
                }
                if (!resolutionTimeMinutes || resolutionTimeMinutes <= responseTimeMinutes) {
                    return next(custom_error_1.AppError.badRequest("El tiempo de resolución debe ser mayor que el tiempo de respuesta"));
                }
                const slaExistente = await this.prisma.sla.findUnique({
                    where: { name },
                });
                if (slaExistente) {
                    return next(custom_error_1.AppError.badRequest("Ya existe un SLA con ese nombre"));
                }
                const nuevoSla = await this.prisma.sla.create({
                    data: {
                        name,
                        responseTimeMinutes,
                        resolutionTimeMinutes,
                    },
                });
                response.status(201).json(nuevoSla);
            }
            catch (error) {
                next(error);
            }
        };
        // Actualizar SLA
        this.update = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const { name, responseTimeMinutes, resolutionTimeMinutes } = request.body;
                const slaExistente = await this.prisma.sla.findUnique({
                    where: { id },
                });
                if (!slaExistente) {
                    return next(custom_error_1.AppError.notFound("SLA no encontrado"));
                }
                // Validaciones solo si se proporcionan los valores
                if (responseTimeMinutes !== undefined && responseTimeMinutes <= 0) {
                    return next(custom_error_1.AppError.badRequest("El tiempo de respuesta debe ser mayor a cero"));
                }
                const finalResponseTime = responseTimeMinutes !== undefined
                    ? responseTimeMinutes
                    : slaExistente.responseTimeMinutes;
                const finalResolutionTime = resolutionTimeMinutes !== undefined
                    ? resolutionTimeMinutes
                    : slaExistente.resolutionTimeMinutes;
                if (finalResolutionTime <= finalResponseTime) {
                    return next(custom_error_1.AppError.badRequest("El tiempo de resolución debe ser mayor que el tiempo de respuesta"));
                }
                const slaActualizado = await this.prisma.sla.update({
                    where: { id },
                    data: {
                        ...(name && { name }),
                        ...(responseTimeMinutes !== undefined && { responseTimeMinutes }),
                        ...(resolutionTimeMinutes !== undefined && { resolutionTimeMinutes }),
                    },
                });
                response.json(slaActualizado);
            }
            catch (error) {
                next(error);
            }
        };
        // Eliminar SLA
        this.delete = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                // Verificar si hay categorías asociadas
                const categoriasAsociadas = await this.prisma.category.count({
                    where: {
                        slaId: id,
                    },
                });
                if (categoriasAsociadas > 0) {
                    return next(custom_error_1.AppError.badRequest(`No se puede eliminar el SLA porque tiene ${categoriasAsociadas} categoría(s) asociada(s)`));
                }
                await this.prisma.sla.delete({
                    where: { id },
                });
                response.json({ message: "SLA eliminado exitosamente" });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.SlaController = SlaController;
