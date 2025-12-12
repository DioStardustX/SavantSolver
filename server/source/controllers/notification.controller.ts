import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';

export class NotificationController {
  prisma = prisma;

  /**
   * Obtiene todas las notificaciones del usuario autenticado
   * Query params: onlyUnread (opcional) - filtrar solo no leídas
   */
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // @ts-ignore - userId es agregado por el middleware de autenticación
      const userId = request.userId;

      if (!userId) {
        return response.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const onlyUnread = request.query.onlyUnread === 'true';

      // Construir filtro
      const whereClause: any = {
        recipientUserId: userId,
      };

      if (onlyUnread) {
        whereClause.isRead = false;
      }

      // Obtener notificaciones
      const notificaciones = await this.prisma.notification.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      response.json({
        success: true,
        data: notificaciones,
      });
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener notificaciones',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Obtiene el contador de notificaciones no leídas del usuario autenticado
   */
  getUnreadCount = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // @ts-ignore - userId es agregado por el middleware de autenticación
      const userId = request.userId;

      if (!userId) {
        return response.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const count = await this.prisma.notification.count({
        where: {
          recipientUserId: userId,
          isRead: false,
        },
      });

      response.json({
        success: true,
        data: { count },
      });
    } catch (error) {
      console.error('Error al obtener contador de notificaciones:', error);
      return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al obtener contador',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Marca una notificación como leída
   * IMPORTANTE: Solo el destinatario puede marcar su notificación como leída
   */
  markAsRead = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // @ts-ignore - userId es agregado por el middleware de autenticación
      const userId = request.userId;

      if (!userId) {
        return response.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const id = parseInt(request.params.id);

      if (isNaN(id)) {
        return response.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'ID de notificación inválido',
        });
      }

      // Verificar que la notificación existe y pertenece al usuario
      const notificacion = await this.prisma.notification.findUnique({
        where: { id },
      });

      if (!notificacion) {
        return response.status(StatusCodes.NOT_FOUND).json({
          success: false,
          message: 'Notificación no encontrada',
        });
      }

      // VALIDACIÓN CRÍTICA: Solo el destinatario puede marcarla como leída
      if (notificacion.recipientUserId !== userId) {
        return response.status(StatusCodes.FORBIDDEN).json({
          success: false,
          message: 'No tienes permiso para marcar esta notificación',
        });
      }

      // Si ya está leída, no hacer nada
      if (notificacion.isRead) {
        return response.json({
          success: true,
          message: 'Notificación ya estaba marcada como leída',
          data: notificacion,
        });
      }

      // Marcar como leída
      const notificacionActualizada = await this.prisma.notification.update({
        where: { id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });

      response.json({
        success: true,
        message: 'Notificación marcada como leída',
        data: notificacionActualizada,
      });
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al marcar notificación como leída',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };

  /**
   * Marca todas las notificaciones del usuario como leídas
   */
  markAllAsRead = async (request: Request, response: Response, next: NextFunction) => {
    try {
      // @ts-ignore - userId es agregado por el middleware de autenticación
      const userId = request.userId;

      if (!userId) {
        return response.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      // Actualizar todas las notificaciones no leídas del usuario
      const result = await this.prisma.notification.updateMany({
        where: {
          recipientUserId: userId,
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      response.json({
        success: true,
        message: `${result.count} notificaciones marcadas como leídas`,
        data: { count: result.count },
      });
    } catch (error) {
      console.error('Error al marcar todas las notificaciones como leídas:', error);
      return response.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al marcar todas las notificaciones como leídas',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  };
}
