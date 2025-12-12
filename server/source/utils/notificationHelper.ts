import prisma from '../prisma';
import { NotificationType } from '../../generated/prisma';

/**
 * Helper para crear notificaciones en el sistema
 */

interface CreateNotificationParams {
  recipientUserId: number;
  senderUserId?: number | null;
  ticketId?: number | null;
  type: NotificationType;
  message: string;
  systemGenerated?: boolean;
}

/**
 * Crea una notificación en la base de datos
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
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
  } catch (error) {
    console.error('Error al crear notificación:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

/**
 * Crea una notificación de cambio de estado de ticket
 */
export async function createTicketStatusNotification(
  ticketId: number,
  recipientUserId: number,
  previousStatus: string,
  newStatus: string,
  ticketTitle: string,
  changedByUserId: number
): Promise<void> {
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
export async function createTicketAssignmentNotification(
  ticketId: number,
  technicianId: number,
  ticketTitle: string,
  assignedByUserId?: number
): Promise<void> {
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
export async function createLoginNotification(userId: number): Promise<void> {
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
