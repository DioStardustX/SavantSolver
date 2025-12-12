import { Request, Response, NextFunction } from 'express';
import { TicketStatus } from '../../generated/prisma';
import prisma from '../prisma';
import { AppError } from '../errors/custom.error';

export class ValuationController {

  /**
   * POST /api/tickets/:ticketId/valuations
   * Crear una nueva valoración para un ticket
   * Solo el creador del ticket puede valorar
   * Solo tickets cerrados pueden ser valorados
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticketId } = req.params;
      const { rating, comment } = req.body;
      const userId = req.userId!;

      // Validar que ticketId es un número
      const ticketIdNum = parseInt(ticketId);
      if (isNaN(ticketIdNum)) {
        return next(AppError.badRequest('ID de ticket inválido'));
      }

      // Validar que rating está presente
      if (!rating) {
        return next(AppError.badRequest('El rating es obligatorio'));
      }

      // Validar rango de rating (1-5)
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return next(AppError.badRequest('El rating debe estar entre 1 y 5'));
      }

      // 1. Verificar que el ticket existe
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketIdNum },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true }
          },
          assignedTechnician: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      });

      if (!ticket) {
        return next(AppError.notFound('Ticket no encontrado'));
      }

      // 2. Validar que el ticket está cerrado
      if (ticket.status !== TicketStatus.Cerrado) {
        return next(AppError.badRequest('Solo se pueden valorar tickets cerrados'));
      }

      // 3. Validar que el usuario es el creador del ticket
      if (ticket.userId !== userId) {
        return next(AppError.forbidden('Solo el creador del ticket puede valorarlo'));
      }

      // 4. Verificar que no existe una valoración previa
      const existingValuation = await prisma.valuation.findUnique({
        where: {
          ticketId_userId: {
            ticketId: ticketIdNum,
            userId: userId
          }
        }
      });

      if (existingValuation) {
        return next(AppError.badRequest('Ya has valorado este ticket'));
      }

      // 5. Crear la valoración
      const valuation = await prisma.valuation.create({
        data: {
          ticketId: ticketIdNum,
          userId: userId,
          rating: ratingNum,
          comment: comment || null
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          ticket: {
            select: {
              id: true,
              title: true,
              assignedTechnicianId: true
            }
          }
        }
      });

      // 6. Crear notificación al técnico asignado
      if (ticket.assignedTechnicianId) {
        await prisma.notification.create({
          data: {
            recipientUserId: ticket.assignedTechnicianId,
            senderUserId: userId,
            ticketId: ticket.id,
            type: 'Otro',
            message: `Tu ticket #${ticket.id} recibió una valoración de ${ratingNum} estrellas`,
            systemGenerated: true
          }
        });
      }

      res.status(201).json({
        success: true,
        message: 'Valoración registrada correctamente',
        data: valuation
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tickets/:ticketId/valuations
   * Obtener todas las valoraciones de un ticket específico
   */
  getByTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ticketId } = req.params;

      const ticketIdNum = parseInt(ticketId);
      if (isNaN(ticketIdNum)) {
        return next(AppError.badRequest('ID de ticket inválido'));
      }

      const valuations = await prisma.valuation.findMany({
        where: { ticketId: ticketIdNum },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: valuations
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/tecnicos/:tecnicoId/promedio-valoraciones
   * Obtener el promedio de valoraciones de un técnico
   */
  getAverageByTechnician = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tecnicoId } = req.params;

      const tecnicoIdNum = parseInt(tecnicoId);
      if (isNaN(tecnicoIdNum)) {
        return next(AppError.badRequest('ID de técnico inválido'));
      }

      // Verificar que el técnico existe
      const technician = await prisma.user.findUnique({
        where: { id: tecnicoIdNum }
      });

      if (!technician) {
        return next(AppError.notFound('Técnico no encontrado'));
      }

      // Calcular promedio de valoraciones de tickets asignados al técnico
      const result = await prisma.valuation.aggregate({
        where: {
          ticket: {
            assignedTechnicianId: tecnicoIdNum,
            status: TicketStatus.Cerrado
          }
        },
        _avg: { rating: true },
        _count: true
      });

      res.json({
        success: true,
        data: {
          tecnicoId: tecnicoIdNum,
          tecnicoNombre: `${technician.firstName} ${technician.lastName}`,
          averageRating: result._avg?.rating ? Number(result._avg.rating.toFixed(2)) : 0,
          totalValuations: result._count || 0
        }
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /api/valoraciones
   * Obtener listado de valoraciones según el rol del usuario
   * - Cliente: solo sus valoraciones
   * - Técnico: valoraciones de sus tickets asignados
   * - Admin: todas las valoraciones
   */
  getAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.userId!;
      const roleId = req.userRoleId!;

      let whereCondition: any = {};

      // Filtrar según el rol (roleId: 1=Admin, 2=Tecnico, 3=Cliente)
      if (roleId === 3) {  // Cliente
        whereCondition = { userId: userId };
      } else if (roleId === 2) {  // Técnico
        whereCondition = {
          ticket: {
            assignedTechnicianId: userId
          }
        };
      }
      // Admin (roleId === 1): sin filtro (ve todas)

      const valuations = await prisma.valuation.findMany({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
              assignedTechnician: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      res.json({
        success: true,
        data: valuations,
        count: valuations.length
      });

    } catch (error) {
      next(error);
    }
  };
}
