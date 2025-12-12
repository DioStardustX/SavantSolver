"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoTriageExecutor = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const prisma_2 = require("../../generated/prisma");
const priorityScoreCalculator_1 = require("./priorityScoreCalculator");
class AutoTriageExecutor {
    constructor() {
        this.prisma = prisma_1.default;
        // Constructor vacío, usa la instancia global de prisma
    }
    /**
     * Ejecuta el proceso de AutoTriage
     * Busca tickets pendientes y los asigna automáticamente
     *
     * @param userId - ID del usuario que ejecuta el autotriage (para logging)
     * @returns Resultado de la ejecución
     */
    async execute(userId) {
        const result = {
            success: true,
            ticketsProcessed: 0,
            ticketsAssigned: 0,
            assignments: [],
            errors: [],
        };
        try {
            // 1. Obtener todas las reglas activas de AutoTriage
            const activeRules = await this.prisma.autoTriageRule.findMany({
                where: { active: true },
                include: {
                    specialty: true,
                },
                orderBy: {
                    remainingTimeMinutes: "asc", // Procesar primero las más urgentes
                },
            });
            if (activeRules.length === 0) {
                result.errors.push("No hay reglas de AutoTriage activas en el sistema");
                return result;
            }
            // 2. Obtener todos los tickets pendientes
            const pendingTickets = await this.prisma.ticket.findMany({
                where: {
                    status: "Pendiente",
                },
                include: {
                    category: {
                        include: {
                            sla: true,
                            specialties: true, // INCLUIR ESPECIALIDADES DE LA CATEGORÍA
                        },
                    },
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: "asc", // Procesar primero los más antiguos
                },
            });
            result.ticketsProcessed = pendingTickets.length;
            if (pendingTickets.length === 0) {
                result.errors.push("No hay tickets pendientes para asignar");
                return result;
            }
            // 3. Procesar cada ticket
            for (const ticket of pendingTickets) {
                try {
                    const assignmentResult = await this.assignTicket(ticket, activeRules, userId);
                    if (assignmentResult) {
                        result.ticketsAssigned++;
                        result.assignments.push(assignmentResult);
                    }
                    else {
                        result.errors.push(`Ticket #${ticket.id}: No se encontró técnico disponible`);
                    }
                }
                catch (error) {
                    result.success = false;
                    result.errors.push(`Ticket #${ticket.id}: ${error.message || "Error desconocido"}`);
                }
            }
            return result;
        }
        catch (error) {
            result.success = false;
            result.errors.push(`Error general: ${error.message || "Error desconocido"}`);
            return result;
        }
        finally {
            await this.prisma.$disconnect();
        }
    }
    /**
     * Asigna un ticket específico al mejor técnico disponible
     *
     * @param ticket - Ticket a asignar
     * @param rules - Reglas de AutoTriage activas
     * @param userId - Usuario que ejecuta el autotriage
     * @returns Detalle de la asignación o null si no se pudo asignar
     */
    async assignTicket(ticket, rules, userId) {
        // 1. Calcular puntaje de prioridad del ticket
        const scoreResult = (0, priorityScoreCalculator_1.calculatePriorityScore)(ticket);
        // 2. Encontrar la regla aplicable para este ticket
        const applicableRule = rules.find((rule) => {
            // Verificar si la especialidad coincide (si se requiere)
            if (rule.specialtyId) {
                // La categoría tiene una relación muchos-a-muchos con especialidades
                const hasMatchingSpecialty = ticket.category?.specialties?.some((cs) => cs.specialtyId === rule.specialtyId);
                if (!hasMatchingSpecialty) {
                    return false;
                }
            }
            // Verificar si el tiempo restante está dentro del límite de la regla
            if (scoreResult.remainingMinutes > rule.remainingTimeMinutes) {
                return false;
            }
            return true;
        });
        if (!applicableRule) {
            // No hay regla aplicable, usar regla por defecto
            return await this.assignWithDefaultRule(ticket, scoreResult, userId);
        }
        // 3. Obtener técnicos elegibles según la regla
        const technicians = await this.prisma.user.findMany({
            where: {
                role: {
                    name: "tecnico",
                },
                status: "Disponible",
                workload: {
                    lt: applicableRule.workloadLimit,
                },
                ...(applicableRule.specialtyId && {
                    specialties: {
                        some: {
                            specialtyId: applicableRule.specialtyId,
                        },
                    },
                }),
            },
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
            },
        });
        if (technicians.length === 0) {
            return null;
        }
        // 4. Transformar datos de técnicos para el selector
        const techniciansForSelection = technicians.map((t) => ({
            id: t.id,
            workload: t.workload || 0,
            status: t.status || "Disponible",
            specialties: t.specialties.map((s) => ({
                id: s.specialty.id,
                name: s.specialty.name,
            })),
        }));
        // 5. Seleccionar el mejor técnico (menor carga)
        const selectedTechnician = (0, priorityScoreCalculator_1.selectBestTechnician)(techniciansForSelection);
        if (!selectedTechnician) {
            return null;
        }
        // 6. Obtener datos completos del técnico seleccionado
        const technicianFull = technicians.find((t) => t.id === selectedTechnician.id);
        if (!technicianFull) {
            return null;
        }
        // 7. Generar justificación
        const justification = (0, priorityScoreCalculator_1.generateAssignmentJustification)(ticket, selectedTechnician, scoreResult, applicableRule.name);
        // 8. Ejecutar asignación en transacción
        await this.performAssignment(ticket, technicianFull, applicableRule, scoreResult, justification, userId);
        // 9. Retornar detalle de la asignación
        return {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            technicianId: technicianFull.id,
            technicianName: `${technicianFull.firstName} ${technicianFull.lastName}`,
            priorityScore: scoreResult.score,
            remainingMinutes: scoreResult.remainingMinutes,
            ruleApplied: applicableRule.name,
            justification,
        };
    }
    /**
     * Asigna un ticket usando regla por defecto (cuando no hay regla aplicable)
     */
    async assignWithDefaultRule(ticket, scoreResult, userId) {
        // Buscar técnicos disponibles con la especialidad requerida
        // Construir filtro de especialidades si la categoría las tiene
        const specialtyFilter = ticket.category?.specialties && ticket.category.specialties.length > 0
            ? {
                specialties: {
                    some: {
                        specialtyId: {
                            in: ticket.category.specialties.map((cs) => cs.specialtyId),
                        },
                    },
                },
            }
            : {};
        const technicians = await this.prisma.user.findMany({
            where: {
                role: {
                    name: "tecnico",
                },
                status: "Disponible",
                workload: {
                    lt: 10, // Límite por defecto
                },
                ...specialtyFilter,
            },
            include: {
                specialties: {
                    include: {
                        specialty: true,
                    },
                },
            },
        });
        if (technicians.length === 0) {
            return null;
        }
        const techniciansForSelection = technicians.map((t) => ({
            id: t.id,
            workload: t.workload || 0,
            status: t.status || "Disponible",
            specialties: t.specialties.map((s) => ({
                id: s.specialty.id,
                name: s.specialty.name,
            })),
        }));
        const selectedTechnician = (0, priorityScoreCalculator_1.selectBestTechnician)(techniciansForSelection);
        if (!selectedTechnician) {
            return null;
        }
        const technicianFull = technicians.find((t) => t.id === selectedTechnician.id);
        if (!technicianFull) {
            return null;
        }
        const justification = (0, priorityScoreCalculator_1.generateAssignmentJustification)(ticket, selectedTechnician, scoreResult, "Regla por defecto (sin regla específica aplicable)");
        await this.performAssignment(ticket, technicianFull, null, scoreResult, justification, userId);
        return {
            ticketId: ticket.id,
            ticketTitle: ticket.title,
            technicianId: technicianFull.id,
            technicianName: `${technicianFull.firstName} ${technicianFull.lastName}`,
            priorityScore: scoreResult.score,
            remainingMinutes: scoreResult.remainingMinutes,
            ruleApplied: "Regla por defecto",
            justification,
        };
    }
    /**
     * Ejecuta la asignación del ticket en una transacción
     */
    async performAssignment(ticket, technician, rule, scoreResult, justification, userId) {
        await this.prisma.$transaction(async (tx) => {
            // 1. Actualizar el ticket
            await tx.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: "Asignado",
                    assignedTechnicianId: technician.id,
                },
            });
            // 2. Registrar en el historial
            await tx.ticketHistory.create({
                data: {
                    ticketId: ticket.id,
                    previousStatus: "Pendiente",
                    newStatus: "Asignado",
                    userId: userId,
                    comment: `Asignación automática mediante AutoTriage`,
                    justification: justification,
                },
            });
            // 3. Crear registro de Assignment
            await tx.assignment.create({
                data: {
                    ticketId: ticket.id,
                    technicianId: technician.id,
                    method: prisma_2.AssignmentMethod.Automatico,
                    assignedAt: new Date(),
                    autoTriageRuleId: rule?.id || null,
                    priorityScore: scoreResult.score,
                },
            });
            // 4. Actualizar workload del técnico
            await tx.user.update({
                where: { id: technician.id },
                data: {
                    workload: {
                        increment: 1,
                    },
                    // Actualizar estado si excede el límite
                    ...(technician.workload + 1 >= 5 && {
                        status: "No_Disponible",
                    }),
                },
            });
            // 5. Crear notificación para el técnico
            await tx.notification.create({
                data: {
                    recipientUserId: technician.id,
                    ticketId: ticket.id,
                    type: prisma_2.NotificationType.Asignacion,
                    message: `Nuevo ticket asignado: Se te ha asignado el ticket #${ticket.id}: "${ticket.title}"`,
                    systemGenerated: true,
                    isRead: false,
                },
            });
            // 6. Crear notificación para el usuario creador del ticket
            await tx.notification.create({
                data: {
                    recipientUserId: ticket.userId,
                    ticketId: ticket.id,
                    type: prisma_2.NotificationType.CambioEstado,
                    message: `Tu ticket ha sido asignado: El ticket #${ticket.id} ha sido asignado a ${technician.firstName} ${technician.lastName}`,
                    systemGenerated: true,
                    isRead: false,
                },
            });
        });
    }
}
exports.AutoTriageExecutor = AutoTriageExecutor;
