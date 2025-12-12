"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TecnicoController = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const custom_error_1 = require("../errors/custom.error");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
class TecnicoController {
    constructor() {
        this.prisma = prisma_1.default;
        // Listado de técnicos
        this.get = async (request, response, next) => {
            try {
                const roleTecnico = await this.prisma.role.findUnique({
                    where: { name: "tecnico" },
                });
                if (!roleTecnico) {
                    return next(custom_error_1.AppError.notFound("Rol de técnico no encontrado"));
                }
                const tecnicos = await this.prisma.user.findMany({
                    where: {
                        roleId: roleTecnico.id,
                    },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        status: true,
                    },
                    orderBy: {
                        firstName: "asc",
                    },
                });
                response.json(tecnicos);
            }
            catch (error) {
                next(error);
            }
        };
        // Obtener técnico por ID
        this.getById = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const roleTecnico = await this.prisma.role.findUnique({
                    where: { name: "tecnico" },
                });
                if (!roleTecnico) {
                    return next(custom_error_1.AppError.notFound("Rol de técnico no encontrado"));
                }
                const tecnico = await this.prisma.user.findFirst({
                    where: {
                        id: id,
                        roleId: roleTecnico.id,
                    },
                    include: {
                        role: true,
                        specialties: {
                            select: {
                                specialty: true,
                            },
                        },
                        ticketsAssigned: {
                            where: {
                                status: {
                                    in: ["Asignado", "En_Proceso"],
                                },
                            },
                            select: {
                                id: true,
                                title: true,
                                status: true,
                                priority: true,
                                createdAt: true,
                            },
                        },
                    },
                });
                if (!tecnico) {
                    return next(custom_error_1.AppError.notFound("Técnico no encontrado"));
                }
                response.json(tecnico);
            }
            catch (error) {
                next(error);
            }
        };
        // Crear técnico
        this.create = async (request, response, next) => {
            try {
                const { email, firstName, lastName, phone, documentId, password, specialtyIds, status, workload } = request.body;
                if (!email || !firstName || !lastName || !password || !documentId) {
                    return next(custom_error_1.AppError.badRequest("Email, nombre, apellido, documento de identidad y contraseña son requeridos"));
                }
                const usuarioExistente = await this.prisma.user.findUnique({
                    where: { email },
                });
                if (usuarioExistente) {
                    return next(custom_error_1.AppError.badRequest("El email ya está registrado"));
                }
                const roleTecnico = await this.prisma.role.findUnique({
                    where: { name: "tecnico" },
                });
                if (!roleTecnico) {
                    return next(custom_error_1.AppError.notFound("Rol de técnico no encontrado"));
                }
                const salt = await bcryptjs_1.default.genSalt(10);
                const hash = await bcryptjs_1.default.hash(password, salt);
                const nuevoTecnico = await this.prisma.user.create({
                    data: {
                        roleId: roleTecnico.id,
                        email,
                        passwordHash: hash,
                        firstName,
                        lastName,
                        phone,
                        documentId,
                        workload: workload !== undefined ? workload : 0,
                        status: status || "Disponible",
                        specialties: specialtyIds && specialtyIds.length > 0
                            ? {
                                create: specialtyIds.map((specialtyId) => ({
                                    specialtyId,
                                })),
                            }
                            : undefined,
                    },
                    include: {
                        specialties: {
                            select: {
                                specialty: true,
                            },
                        },
                    },
                });
                response.status(201).json(nuevoTecnico);
            }
            catch (error) {
                next(error);
            }
        };
        // Actualizar técnico
        this.update = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const { email, firstName, lastName, phone, documentId, password, status, specialtyIds, workload } = request.body;
                const tecnicoExistente = await this.prisma.user.findUnique({
                    where: { id },
                });
                if (!tecnicoExistente) {
                    return next(custom_error_1.AppError.notFound("Técnico no encontrado"));
                }
                // Si se proporciona una nueva contraseña, hashearla
                let passwordHash;
                if (password) {
                    const salt = await bcryptjs_1.default.genSalt(10);
                    passwordHash = await bcryptjs_1.default.hash(password, salt);
                }
                // Si se proporcionan specialtyIds, actualizar las especialidades
                if (specialtyIds !== undefined) {
                    await this.prisma.technicianSpecialty.deleteMany({
                        where: { userId: id },
                    });
                    if (specialtyIds.length > 0) {
                        await this.prisma.technicianSpecialty.createMany({
                            data: specialtyIds.map((specialtyId) => ({
                                userId: id,
                                specialtyId,
                            })),
                        });
                    }
                }
                const tecnicoActualizado = await this.prisma.user.update({
                    where: { id },
                    data: {
                        ...(email && { email }),
                        ...(firstName && { firstName }),
                        ...(lastName && { lastName }),
                        ...(phone !== undefined && { phone }),
                        ...(documentId !== undefined && { documentId }),
                        ...(passwordHash && { passwordHash }),
                        ...(status && { status }),
                        ...(workload !== undefined && { workload }),
                    },
                    include: {
                        specialties: {
                            select: {
                                specialty: true,
                            },
                        },
                    },
                });
                response.json(tecnicoActualizado);
            }
            catch (error) {
                next(error);
            }
        };
        // Eliminar técnico
        this.delete = async (request, response, next) => {
            try {
                const id = parseInt(request.params.id);
                if (isNaN(id)) {
                    return next(custom_error_1.AppError.badRequest("El ID no es válido"));
                }
                const ticketsActivos = await this.prisma.ticket.count({
                    where: {
                        assignedTechnicianId: id,
                        status: {
                            in: ["Pendiente", "Asignado", "En_Proceso"],
                        },
                    },
                });
                if (ticketsActivos > 0) {
                    return next(custom_error_1.AppError.badRequest(`No se puede eliminar el técnico porque tiene ${ticketsActivos} ticket(s) activo(s)`));
                }
                await this.prisma.user.delete({
                    where: { id },
                });
                response.json({ message: "Técnico eliminado exitosamente" });
            }
            catch (error) {
                next(error);
            }
        };
    }
}
exports.TecnicoController = TecnicoController;
