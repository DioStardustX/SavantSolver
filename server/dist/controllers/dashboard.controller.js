"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const prisma_1 = require("../../generated/prisma");
const prisma_2 = __importDefault(require("../prisma"));
class DashboardController {
    constructor() {
        /**
         * GET /api/dashboard/stats
         * Obtener todas las estadísticas para el dashboard administrativo
         * Solo para administradores
         */
        this.getStats = async (req, res, next) => {
            try {
                // 1. Tickets por estado
                const ticketsPorEstado = await prisma_2.default.ticket.groupBy({
                    by: ['status'],
                    _count: { id: true }
                });
                const estadosFormateados = ticketsPorEstado.map(item => ({
                    estado: item.status,
                    cantidad: typeof item._count === 'object' ? item._count.id ?? 0 : 0
                }));
                // 2. Tickets creados por mes (últimos 6 meses)
                const seisMesesAtras = new Date();
                seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);
                const ticketsPorMes = await prisma_2.default.ticket.groupBy({
                    by: ['createdAt'],
                    where: {
                        createdAt: { gte: seisMesesAtras }
                    },
                    _count: { id: true }
                });
                // Agrupar por mes
                const mesesMap = new Map();
                ticketsPorMes.forEach(item => {
                    const fecha = new Date(item.createdAt);
                    const mesKey = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                    const count = typeof item._count === 'object' ? item._count.id ?? 0 : 0;
                    mesesMap.set(mesKey, (mesesMap.get(mesKey) || 0) + count);
                });
                const ticketsPorMesFormateados = Array.from(mesesMap.entries()).map(([mes, cantidad]) => ({
                    mes,
                    cantidad
                })).sort((a, b) => a.mes.localeCompare(b.mes));
                // 3. Promedio de valoraciones general
                const promedioValoraciones = await prisma_2.default.valuation.aggregate({
                    _avg: { rating: true },
                    _count: { id: true }
                });
                // 4. Cumplimiento SLA - Respuesta
                const ticketsConAsignacion = await prisma_2.default.ticket.findMany({
                    where: {
                        status: { not: prisma_1.TicketStatus.Pendiente }
                    },
                    include: {
                        category: {
                            include: { sla: true }
                        },
                        assignments: {
                            orderBy: { assignedAt: 'asc' }
                        }
                    }
                });
                let cumpleSLARespuesta = 0;
                let totalSLARespuesta = 0;
                ticketsConAsignacion.forEach(ticket => {
                    const primerAssignment = ticket.assignments[0];
                    const fechaRespuesta = ticket.firstResponseAt ?? primerAssignment?.assignedAt;
                    if (fechaRespuesta && ticket.category?.sla) {
                        const tiempoRespuestaMs = ticket.category.sla.responseTimeMinutes * 60 * 1000;
                        const tiempoTranscurrido = fechaRespuesta.getTime() - ticket.createdAt.getTime();
                        totalSLARespuesta++;
                        if (tiempoTranscurrido <= tiempoRespuestaMs) {
                            cumpleSLARespuesta++;
                        }
                    }
                });
                const porcentajeSLARespuesta = totalSLARespuesta > 0
                    ? Number(((cumpleSLARespuesta / totalSLARespuesta) * 100).toFixed(2))
                    : 0;
                // 5. Cumplimiento SLA - Resolución
                const ticketsResueltos = await prisma_2.default.ticket.findMany({
                    where: {
                        status: { in: [prisma_1.TicketStatus.Cerrado, prisma_1.TicketStatus.Resuelto] },
                        closedAt: { not: null }
                    },
                    include: {
                        category: {
                            include: { sla: true }
                        }
                    }
                });
                let cumpleSLAResolucion = 0;
                let totalSLAResolucion = 0;
                ticketsResueltos.forEach(ticket => {
                    if (ticket.closedAt && ticket.category?.sla) {
                        const tiempoResolucionMs = ticket.category.sla.resolutionTimeMinutes * 60 * 1000;
                        const tiempoTranscurrido = ticket.closedAt.getTime() - ticket.createdAt.getTime();
                        totalSLAResolucion++;
                        if (tiempoTranscurrido <= tiempoResolucionMs) {
                            cumpleSLAResolucion++;
                        }
                    }
                });
                const porcentajeSLAResolucion = totalSLAResolucion > 0
                    ? Number(((cumpleSLAResolucion / totalSLAResolucion) * 100).toFixed(2))
                    : 0;
                // 6. Ranking de técnicos por valoración promedio
                const tecnicos = await prisma_2.default.user.findMany({
                    where: { roleId: 2 }, // 2 = TECNICO
                    include: {
                        ticketsAssigned: {
                            where: { status: prisma_1.TicketStatus.Cerrado },
                            include: { valuations: true }
                        }
                    }
                });
                const ranking = tecnicos.map(tecnico => {
                    const valoraciones = tecnico.ticketsAssigned.flatMap(t => t.valuations);
                    const promedio = valoraciones.length > 0
                        ? Number((valoraciones.reduce((sum, v) => sum + v.rating, 0) / valoraciones.length).toFixed(2))
                        : 0;
                    return {
                        id: tecnico.id,
                        nombre: `${tecnico.firstName} ${tecnico.lastName}`,
                        promedioValoracion: promedio,
                        ticketsResueltos: tecnico.ticketsAssigned.length,
                        totalValoraciones: valoraciones.length
                    };
                }).sort((a, b) => b.promedioValoracion - a.promedioValoracion)
                    .slice(0, 10); // Top 10
                // 7. Categorías con más incumplimientos de SLA
                const categorias = await prisma_2.default.category.findMany({
                    include: {
                        tickets: {
                            where: {
                                status: { in: [prisma_1.TicketStatus.Cerrado, prisma_1.TicketStatus.Resuelto] },
                                closedAt: { not: null }
                            }
                        },
                        sla: true
                    }
                });
                const incumplimientos = categorias.map(cat => {
                    let totalIncumplimientos = 0;
                    let totalTickets = cat.tickets.length;
                    if (cat.sla) {
                        const tiempoResolucionMs = cat.sla.resolutionTimeMinutes * 60 * 1000;
                        cat.tickets.forEach(ticket => {
                            if (ticket.closedAt) {
                                const tiempoTranscurrido = ticket.closedAt.getTime() - ticket.createdAt.getTime();
                                if (tiempoTranscurrido > tiempoResolucionMs) {
                                    totalIncumplimientos++;
                                }
                            }
                        });
                    }
                    return {
                        categoria: cat.name,
                        incumplimientos: totalIncumplimientos,
                        totalTickets,
                        porcentajeIncumplimiento: totalTickets > 0
                            ? Number(((totalIncumplimientos / totalTickets) * 100).toFixed(2))
                            : 0
                    };
                }).sort((a, b) => b.incumplimientos - a.incumplimientos)
                    .slice(0, 5); // Top 5
                // 8. Estadísticas adicionales
                const totalTecnicos = await prisma_2.default.user.count({
                    where: { roleId: 2 } // 2 = TECNICO
                });
                const tecnicosDisponibles = await prisma_2.default.user.count({
                    where: {
                        roleId: 2, // 2 = TECNICO
                        status: 'Disponible'
                    }
                });
                const ticketsActivos = await prisma_2.default.ticket.count({
                    where: {
                        status: { notIn: [prisma_1.TicketStatus.Cerrado] }
                    }
                });
                // Calcular tiempo promedio de resolución
                const tiemposResolucion = [];
                ticketsResueltos.forEach(ticket => {
                    if (ticket.closedAt) {
                        const tiempoMs = ticket.closedAt.getTime() - ticket.createdAt.getTime();
                        const tiempoHoras = tiempoMs / (1000 * 60 * 60);
                        tiemposResolucion.push(tiempoHoras);
                    }
                });
                const tiempoPromedioResolucion = tiemposResolucion.length > 0
                    ? Number((tiemposResolucion.reduce((a, b) => a + b, 0) / tiemposResolucion.length).toFixed(2))
                    : 0;
                // Respuesta final
                res.json({
                    success: true,
                    data: {
                        // Estadísticas generales
                        estadisticasGenerales: {
                            ticketsActivos,
                            totalTecnicos,
                            tecnicosDisponibles,
                            tiempoPromedioResolucion,
                            promedioValoracionesGeneral: promedioValoraciones._avg.rating
                                ? Number(promedioValoraciones._avg.rating.toFixed(2))
                                : 0,
                            totalValoraciones: promedioValoraciones._count.id
                        },
                        // Tickets por estado
                        ticketsPorEstado: estadosFormateados,
                        // Tickets por mes
                        ticketsPorMes: ticketsPorMesFormateados,
                        // Cumplimiento SLA
                        cumplimientoSLA: {
                            respuesta: {
                                porcentaje: porcentajeSLARespuesta,
                                cumplidos: cumpleSLARespuesta,
                                total: totalSLARespuesta
                            },
                            resolucion: {
                                porcentaje: porcentajeSLAResolucion,
                                cumplidos: cumpleSLAResolucion,
                                total: totalSLAResolucion
                            }
                        },
                        // Ranking de técnicos
                        rankingTecnicos: ranking,
                        // Categorías con incumplimientos
                        categoriasIncumplimiento: incumplimientos
                    }
                });
            }
            catch (error) {
                console.error('Error al obtener estadísticas del dashboard:', error);
                next(error);
            }
        };
    }
}
exports.DashboardController = DashboardController;
