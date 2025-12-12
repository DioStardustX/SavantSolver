"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
exports.createTicketStatusNotification = createTicketStatusNotification;
exports.createTicketAssignmentNotification = createTicketAssignmentNotification;
exports.createLoginNotification = createLoginNotification;
const prisma_1 = __importDefault(require("../prisma"));
/**
 * Crea una notificación en la base de datos
 */
async function createNotification(params) {
    try {
        await prisma_1.default.notification.create({
            data: {
                recipientUserId: params.recipientUserId,
                senderUserId: params.senderUserId || null,
                ticketId: params.ticketId || null,
                type: params.type,
                message: params.message,
                systemGenerated: params.systemGenerated !== undefined ? params.systemGenerated : false,
                isRead: false,
            },
        });
        console.log(`Notificación creada: ${params.type} para usuario ${params.recipientUserId}`);
    }
    catch (error) {
        console.error('Error al crear notificación:', error);
        // No lanzar error para no interrumpir el flujo principal
    }
}
/**
 * Crea una notificación de cambio de estado de ticket
 */
async function createTicketStatusNotification(ticketId, recipientUserId, previousStatus, newStatus, ticketTitle, changedByUserId) {
    const message = `El ticket "${ticketTitle}" cambió de estado de ${previousStatus} a ${newStatus}`;
    await createNotification({
        recipientUserId,
        senderUserId: changedByUserId,
        ticketId,
        type: 'CambioEstado',
        message,
        systemGenerated: false,
    });
}
/**
 * Crea una notificación de asignación de ticket
 */
async function createTicketAssignmentNotification(ticketId, technicianId, ticketTitle, assignedByUserId) {
    const message = `Se te ha asignado el ticket "${ticketTitle}"`;
    await createNotification({
        recipientUserId: technicianId,
        senderUserId: assignedByUserId || null,
        ticketId,
        type: 'Asignacion',
        message,
        systemGenerated: assignedByUserId ? false : true,
    });
}
/**
 * Crea una notificación de inicio de sesión
 */
async function createLoginNotification(userId) {
    const ahora = new Date();
    const fechaFormateada = ahora.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
    const message = `Has iniciado sesión en el sistema el ${fechaFormateada}`;
    await createNotification({
        recipientUserId: userId,
        senderUserId: null,
        ticketId: null,
        type: 'InicioSesion',
        message,
        systemGenerated: true,
    });
}
