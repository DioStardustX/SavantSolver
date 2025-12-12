import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { AppError } from "../errors/custom.error";
import {
  validateStatusTransition,
  validateTechnicianRequired,
  validateCommentRequired,
  validateImagesRequired,
} from "../utils/ticketValidations";
import {
  createTicketStatusNotification,
  createTicketAssignmentNotification,
} from "../utils/notificationHelper";

export class TicketController {
  prisma = prisma;

  /**
   * Actualiza automáticamente el workload y disponibilidad de un técnico
   * basado en sus tickets activos
   */
  private async actualizarDisponibilidadTecnico(tecnicoId: number): Promise<void> {
    // Contar tickets activos (no cerrados) asignados al técnico
    const ticketsActivos = await this.prisma.ticket.count({
      where: {
        assignedTechnicianId: tecnicoId,
        status: {
          not: "Cerrado",
        },
      },
    });

    // Determinar nuevo status basado en carga de trabajo
    const nuevoStatus = ticketsActivos > 5 ? "No_Disponible" : "Disponible";

    // Actualizar técnico
    await this.prisma.user.update({
      where: { id: tecnicoId },
      data: {
        workload: ticketsActivos,
        status: nuevoStatus,
      },
    });

    console.log(
      `Técnico ${tecnicoId} actualizado: ${ticketsActivos} tickets activos, status: ${nuevoStatus}`
    );
  }

  /**
   * Obtiene el rango de una semana (lunes a domingo) para una fecha dada
   */
  private obtenerRangoSemana(fecha: Date): { inicio: Date; fin: Date } {
    const dia = fecha.getDay();
    const diff = fecha.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(fecha);
    lunes.setDate(diff);
    lunes.setHours(0, 0, 0, 0);

    const domingo = new Date(lunes);
    domingo.setDate(domingo.getDate() + 6);
    domingo.setHours(23, 59, 59, 999);

    return { inicio: lunes, fin: domingo };
  }

  /**
   * Calcula el nivel de urgencia y color según SLA restante
   */
  private calcularUrgencia(slaRestanteMinutos: number): { nivel: string; color: string } {
    if (slaRestanteMinutos < 0) return { nivel: "vencido", color: "#333333" };
    if (slaRestanteMinutos < 30) return { nivel: "critico", color: "#ff4444" };
    if (slaRestanteMinutos < 60) return { nivel: "alto", color: "#ffaa00" };
    if (slaRestanteMinutos < 120) return { nivel: "medio", color: "#ff8800" };
    return { nivel: "bajo", color: "#44ff44" };
  }

  /**
   * Calcula el porcentaje de SLA consumido
   */
  private calcularPorcentajeConsumido(slaTotalMinutos: number, slaRestanteMinutos: number): number {
    if (slaTotalMinutos <= 0) return 0;
    const consumido = slaTotalMinutos - slaRestanteMinutos;
    const porcentaje = (consumido / slaTotalMinutos) * 100;
    return Math.max(0, Math.min(100, porcentaje));
  }

  /**
   * Convierte una fecha a formato YYYY-MM-DD en zona horaria local
   * (evita problemas de desfase de día con toISOString que usa UTC)
   */
  private obtenerFechaLocal(fecha: Date): string {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Listado de tickets según rol
  // Query params: userId (requerido), roleId (requerido)
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const userId = parseInt(request.query.userId as string);
      const roleId = parseInt(request.query.roleId as string);

      if (isNaN(userId) || isNaN(roleId)) {
        return next(
          AppError.badRequest("userId y roleId son requeridos y deben ser números")
        );
      }

      // Obtener el nombre del rol
      const role = await this.prisma.role.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        return next(AppError.notFound("Rol no encontrado"));
      }

      let whereClause: any = {};

      // Filtrar según el rol
      if (role.name.toLowerCase() === "admin" || role.name.toLowerCase() === "administrador") {
        // Admin ve todos los tickets
        whereClause = {};
      } else if (role.name.toLowerCase() === "tecnico" || role.name.toLowerCase() === "técnico") {
        // Técnico ve solo tickets asignados a él
        whereClause = {
          assignedTechnicianId: userId,
        };
      } else {
        // Cliente (o cualquier otro rol) ve solo sus tickets
        whereClause = {
          userId: userId,
        };
      }

      const tickets = await this.prisma.ticket.findMany({
        where: whereClause,
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
          createdAt: "desc",
        },
      });

      response.json(tickets);
    } catch (error) {
      next(error);
    }
  };

  // Obtener detalle completo del ticket
  getById = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: id,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            include: {
              sla: {
                select: {
                  name: true,
                  responseTimeMinutes: true,
                  resolutionTimeMinutes: true,
                },
              },
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          history: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              images: {
                select: {
                  id: true,
                  imagePath: true,
                  uploadedAt: true,
                },
              },
            },
            orderBy: {
              changedAt: "asc",
            },
          },
          valuations: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          images: {
            select: {
              id: true,
              imagePath: true,
              uploadedAt: true,
            },
          },
        },
      });

      if (!ticket) {
        return next(AppError.notFound("Ticket no encontrado"));
      }

      // Calcular días de resolución
      let resolutionDays = null;
      if (ticket.closedAt) {
        const diffTime = ticket.closedAt.getTime() - ticket.createdAt.getTime();
        resolutionDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }

      // Agregar días de resolución al objeto de respuesta
      const ticketWithCalculations = {
        ...ticket,
        resolutionDays,
      };

      response.json(ticketWithCalculations);
    } catch (error) {
      next(error);
    }
  };

  // Crear ticket
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const {
        title,
        description,
        priority,
        userId,
        categoryId,
        images,
      } = request.body;

      if (!title || !userId || !categoryId) {
        return next(
          AppError.badRequest("El título, usuario y categoría son requeridos")
        );
      }

      // Obtener el SLA de la categoría para calcular deadlines
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId },
        include: { sla: true },
      });

      if (!category) {
        return next(AppError.notFound("Categoría no encontrada"));
      }

      const now = new Date();
      let responseDeadline = null;
      let resolutionDeadline = null;

      if (category.sla) {
        responseDeadline = new Date(
          now.getTime() + category.sla.responseTimeMinutes * 60000
        );
        resolutionDeadline = new Date(
          now.getTime() + category.sla.resolutionTimeMinutes * 60000
        );
      }

      const nuevoTicket = await this.prisma.ticket.create({
        data: {
          title,
          description,
          priority: priority || "Media",
          userId,
          categoryId,
          responseDeadline,
          resolutionDeadline,
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            include: {
              sla: true,
            },
          },
        },
      });

      // Crear entrada en el historial
      await this.prisma.ticketHistory.create({
        data: {
          ticketId: nuevoTicket.id,
          previousStatus: null,
          newStatus: "Pendiente",
          userId,
          comment: "Ticket creado",
        },
      });

      // Guardar imágenes si fueron enviadas
      if (images && Array.isArray(images) && images.length > 0) {
        await this.prisma.ticketImage.createMany({
          data: images.map((imageBase64: string) => ({
            ticketId: nuevoTicket.id,
            imagePath: imageBase64,
          })),
        });
      }

      // Obtener el ticket completo con las imágenes
      const ticketCompleto = await this.prisma.ticket.findUnique({
        where: { id: nuevoTicket.id },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          category: {
            include: {
              sla: true,
            },
          },
          images: {
            select: {
              id: true,
              imagePath: true,
              uploadedAt: true,
            },
          },
        },
      });

      response.status(201).json(ticketCompleto);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar ticket
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const {
        title,
        description,
        status,
        priority,
        assignedTechnicianId,
        userId,
        comment,
        justification,
        images, // Array de imágenes en base64
      } = request.body;

      const ticketExistente = await this.prisma.ticket.findUnique({
        where: { id },
      });

      if (!ticketExistente) {
        return next(AppError.notFound("Ticket no encontrado"));
      }

      // ============================================================
      // VALIDACIONES DE CAMBIO DE ESTADO
      // ============================================================
      if (status !== undefined && status !== ticketExistente.status) {
        // 1. VALIDAR FLUJO DE ESTADO (no saltear etapas, no retroceder)
        validateStatusTransition(ticketExistente.status, status);

        // 2. VALIDAR TÉCNICO ASIGNADO
        // Determinar el ID del técnico que se usará (el nuevo o el actual)
        const technicianToValidate =
          assignedTechnicianId !== undefined
            ? assignedTechnicianId
            : ticketExistente.assignedTechnicianId;
        validateTechnicianRequired(status, technicianToValidate);

        // 3. VALIDAR COMENTARIO OBLIGATORIO
        validateCommentRequired(comment);

        // 4. VALIDAR IMÁGENES OBLIGATORIAS
        // EXCEPCIÓN: No se requiere imagen para asignación manual (Pendiente → Asignado)
        const esAsignacionManual =
          ticketExistente.status === "Pendiente" &&
          status === "Asignado";

        if (!esAsignacionManual) {
          validateImagesRequired(images);
        }

        // 5. VALIDAR QUE userId ESTÉ PRESENTE
        if (!userId) {
          return next(
            AppError.badRequest(
              "Se requiere el userId para registrar el cambio de estado en el historial"
            )
          );
        }
      }

      // ============================================================
      // PREPARAR DATOS DE ACTUALIZACIÓN
      // ============================================================
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority !== undefined) updateData.priority = priority;
      if (assignedTechnicianId !== undefined)
        updateData.assignedTechnicianId = assignedTechnicianId;

      // ============================================================
      // MANEJAR CAMBIO DE ESTADO CON TRANSACCIÓN
      // ============================================================
      let ticketActualizado;

      if (status !== undefined && status !== ticketExistente.status) {
        // Usar transacción para garantizar atomicidad
        ticketActualizado = await this.prisma.$transaction(async (tx) => {
          // Preparar datos de actualización de estado
          updateData.status = status;

          // Registrar primera respuesta
          if (status === "En_Proceso" && !ticketExistente.firstResponseAt) {
            updateData.firstResponseAt = new Date();

            // Calcular cumplimiento de respuesta
            if (ticketExistente.responseDeadline) {
              updateData.responseCompliance =
                new Date() <= ticketExistente.responseDeadline;
            }
          }

          // Registrar cierre
          if (status === "Cerrado" && !ticketExistente.closedAt) {
            updateData.closedAt = new Date();

            // Calcular cumplimiento de resolución
            if (ticketExistente.resolutionDeadline) {
              updateData.resolutionCompliance =
                new Date() <= ticketExistente.resolutionDeadline;
            }
          }

          // 1. Actualizar el ticket
          const ticketUpdated = await tx.ticket.update({
            where: { id },
            data: updateData,
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              category: {
                include: {
                  sla: true,
                },
              },
              assignedTechnician: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          });

          // 2. Crear entrada en el historial
          const historialCreado = await tx.ticketHistory.create({
            data: {
              ticketId: id,
              previousStatus: ticketExistente.status,
              newStatus: status,
              userId,
              comment,
              justification,
            },
          });

          // 3. Guardar imágenes asociadas al historial
          if (images && Array.isArray(images) && images.length > 0) {
            await tx.historyStateImage.createMany({
              data: images.map((imageBase64: string) => ({
                historyStateId: historialCreado.id,
                imagePath: imageBase64,
              })),
            });
          }

          // 4. Registrar asignación manual si el ticket pasa a estado Asignado
          // y tiene técnico asignado (asignación manual)
          if (
            status === "Asignado" &&
            ticketExistente.status === "Pendiente" &&
            assignedTechnicianId !== undefined
          ) {
            await tx.assignment.create({
              data: {
                ticketId: id,
                technicianId: assignedTechnicianId,
                method: "Manual", // Método manual
                assignedAt: new Date(),
                autoTriageRuleId: null, // No hay regla para manual
                priorityScore: 0, // No se calcula para manual
                observation: justification || comment, // Usar justificación o comentario
              },
            });
          }

          return ticketUpdated;
        });

        // ============================================================
        // CREAR NOTIFICACIONES PARA CAMBIO DE ESTADO
        // ============================================================
        // Notificar al creador del ticket (si no es el mismo que hizo el cambio)
        if (ticketActualizado.user.id !== userId) {
          await createTicketStatusNotification(
            id,
            ticketActualizado.user.id,
            ticketExistente.status,
            status,
            ticketActualizado.title,
            userId
          );
        }

        // Si se asignó un técnico, notificarlo
        if (
          status === "Asignado" &&
          ticketActualizado.assignedTechnician &&
          ticketActualizado.assignedTechnician.id !== userId
        ) {
          await createTicketAssignmentNotification(
            id,
            ticketActualizado.assignedTechnician.id,
            ticketActualizado.title,
            userId
          );
        }

        // Si el ticket está en proceso o resuelto, notificar al técnico asignado
        if (
          (status === "En_Proceso" || status === "Resuelto") &&
          ticketActualizado.assignedTechnician &&
          ticketActualizado.assignedTechnician.id !== userId
        ) {
          await createTicketStatusNotification(
            id,
            ticketActualizado.assignedTechnician.id,
            ticketExistente.status,
            status,
            ticketActualizado.title,
            userId
          );
        }
      } else {
        // Si NO hay cambio de estado, actualizar normalmente
        ticketActualizado = await this.prisma.ticket.update({
          where: { id },
          data: updateData,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            category: {
              include: {
                sla: true,
              },
            },
            assignedTechnician: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        });
      }

      // ============================================================
      // ACTUALIZAR DISPONIBILIDAD DE TÉCNICOS
      // ============================================================
      // 1. Si cambió la asignación de técnico
      if (assignedTechnicianId !== undefined) {
        // Actualizar técnico anterior (si había uno y cambió)
        if (
          ticketExistente.assignedTechnicianId &&
          ticketExistente.assignedTechnicianId !== assignedTechnicianId
        ) {
          await this.actualizarDisponibilidadTecnico(
            ticketExistente.assignedTechnicianId
          );
        }

        // Actualizar nuevo técnico (si se asignó uno)
        if (assignedTechnicianId) {
          await this.actualizarDisponibilidadTecnico(assignedTechnicianId);
        }
      }

      // 2. Si se cerró el ticket, actualizar técnico asignado
      if (
        status === "Cerrado" &&
        ticketExistente.status !== "Cerrado" &&
        ticketActualizado.assignedTechnicianId
      ) {
        await this.actualizarDisponibilidadTecnico(
          ticketActualizado.assignedTechnicianId
        );
      }

      response.json(ticketActualizado);
    } catch (error) {
      next(error);
    }
  };

  // Eliminar ticket
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const ticketExistente = await this.prisma.ticket.findUnique({
        where: { id },
      });

      if (!ticketExistente) {
        return next(AppError.notFound("Ticket no encontrado"));
      }

      await this.prisma.ticket.delete({
        where: { id },
      });

      response.json({ message: "Ticket eliminado exitosamente" });
    } catch (error) {
      next(error);
    }
  };

  // Vista de asignaciones por semana
  // Query params: fecha (opcional, default: hoy), tecnicoId (opcional, filtra por técnico)
  getAsignacionesSemana = async (
    request: Request,
    response: Response,
    next: NextFunction
  ) => {
    try {
      // Obtener fecha de referencia (query param o fecha actual)
      const fechaParam = request.query.fecha as string;
      const tecnicoIdParam = request.query.tecnicoId as string;
      const fechaReferencia = fechaParam ? new Date(fechaParam) : new Date();

      if (isNaN(fechaReferencia.getTime())) {
        return next(AppError.badRequest("Fecha inválida. Usar formato YYYY-MM-DD"));
      }

      // Calcular rango de la semana
      const { inicio, fin } = this.obtenerRangoSemana(fechaReferencia);

      // Preparar filtro de tickets
      const whereClause: any = {
        createdAt: {
          gte: inicio,
          lte: fin,
        },
      };

      // Si se especifica tecnicoId, filtrar solo tickets asignados a ese técnico
      if (tecnicoIdParam) {
        const tecnicoId = parseInt(tecnicoIdParam);
        if (!isNaN(tecnicoId)) {
          whereClause.assignedTechnicianId = tecnicoId;
        }
      }

      // Obtener tickets de la semana
      const tickets = await this.prisma.ticket.findMany({
        where: whereClause,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              sla: {
                select: {
                  responseTimeMinutes: true,
                  resolutionTimeMinutes: true,
                },
              },
            },
          },
          assignedTechnician: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Procesar tickets y calcular datos de SLA
      const ahora = new Date();
      const ticketsProcesados = tickets.map((ticket) => {
        // Determinar SLA deadline según estado
        let slaDeadline = ticket.responseDeadline;
        if (ticket.status === "En_Proceso" || ticket.status === "Resuelto") {
          slaDeadline = ticket.resolutionDeadline;
        }

        // Calcular minutos restantes de SLA
        let slaRestanteMinutos = 0;
        let slaTotalMinutos = 0;

        if (slaDeadline) {
          const diffMs = slaDeadline.getTime() - ahora.getTime();
          slaRestanteMinutos = Math.floor(diffMs / 60000);

          // Calcular SLA total
          if (ticket.category?.sla) {
            slaTotalMinutos =
              ticket.status === "Pendiente" || ticket.status === "Asignado"
                ? ticket.category.sla.responseTimeMinutes
                : ticket.category.sla.resolutionTimeMinutes;
          }
        }

        // Calcular urgencia y porcentaje
        const urgencia = this.calcularUrgencia(slaRestanteMinutos);
        const porcentajeConsumido = this.calcularPorcentajeConsumido(
          slaTotalMinutos,
          slaRestanteMinutos
        );

        return {
          id: ticket.id,
          titulo: ticket.title,
          descripcion: ticket.description,
          estado: ticket.status,
          prioridad: ticket.priority,
          categoria: {
            id: ticket.category?.id,
            name: ticket.category?.name,
          },
          tecnicoAsignado: ticket.assignedTechnician
            ? {
                id: ticket.assignedTechnician.id,
                nombre: `${ticket.assignedTechnician.firstName} ${ticket.assignedTechnician.lastName}`,
              }
            : null,
          slaRestanteMinutos,
          slaTotalMinutos,
          porcentajeConsumido: Math.round(porcentajeConsumido),
          nivelUrgencia: urgencia.nivel,
          colorUrgencia: urgencia.color,
          createdAt: ticket.createdAt,
        };
      });

      // Agrupar tickets por día (usando fecha local, no UTC)
      const ticketsPorDia: { [key: string]: any[] } = {};
      ticketsProcesados.forEach((ticket) => {
        const fecha = this.obtenerFechaLocal(ticket.createdAt);
        if (!ticketsPorDia[fecha]) {
          ticketsPorDia[fecha] = [];
        }
        ticketsPorDia[fecha].push(ticket);
      });

      // Estadísticas
      const estadisticas = {
        totalTickets: tickets.length,
        porEstado: {
          Pendiente: tickets.filter((t) => t.status === "Pendiente").length,
          Asignado: tickets.filter((t) => t.status === "Asignado").length,
          En_Proceso: tickets.filter((t) => t.status === "En_Proceso").length,
          Resuelto: tickets.filter((t) => t.status === "Resuelto").length,
          Cerrado: tickets.filter((t) => t.status === "Cerrado").length,
        },
      };

      response.json({
        success: true,
        data: {
          semana: {
            inicio: this.obtenerFechaLocal(inicio),
            fin: this.obtenerFechaLocal(fin),
          },
          ticketsPorDia,
          estadisticas,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
