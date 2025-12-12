import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { AppError } from "../errors/custom.error";
import { AutoTriageExecutor } from "../services/autoTriageExecutor";

export class AutoTriageController {
  prisma = prisma;

  // GET /api/autotriage - Listar todas las reglas con filtro opcional activo/inactivo
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { active } = request.query;

      let whereClause: any = {};

      // Filtro opcional por estado activo
      if (active !== undefined) {
        whereClause.active = active === "true";
      }

      const rules = await this.prisma.autoTriageRule.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          remainingTimeMinutes: true,
          workloadLimit: true,
          priorityRule: true,
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
        orderBy: {
          id: "desc",
        },
      });

      response.status(200).json({
        success: true,
        message: "Reglas de autotriage obtenidas exitosamente",
        data: rules,
      });
    } catch (error) {
      console.error("Error al obtener reglas de autotriage:", error);
      next(AppError.internalServer("Error al obtener las reglas de autotriage"));
      return;
    }
  };

  // GET /api/autotriage/:id - Obtener detalle de una regla
  getById = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { id } = request.params;

      // Validar que el ID sea un número válido
      if (!id || isNaN(Number(id))) {
        next(AppError.badRequest("ID de regla no válido"));
        return;
      }

      const rule = await this.prisma.autoTriageRule.findUnique({
        where: {
          id: parseInt(id),
        },
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          remainingTimeMinutes: true,
          workloadLimit: true,
          priorityRule: true,
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      if (!rule) {
        next(AppError.notFound("Regla de autotriage no encontrada"));
        return;
      }

      response.status(200).json({
        success: true,
        message: "Regla de autotriage obtenida exitosamente",
        data: rule,
      });
    } catch (error) {
      console.error("Error al obtener regla de autotriage:", error);
      next(AppError.internalServer("Error al obtener la regla de autotriage"));
      return;
    }
  };

  // POST /api/autotriage - Crear nueva regla (admin only)
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const {
        name,
        description,
        remainingTimeMinutes,
        workloadLimit,
        specialtyId,
        priorityRule,
        active,
      } = request.body;

      // Validaciones de campos requeridos
      if (!name || !remainingTimeMinutes || !workloadLimit || !specialtyId) {
        next(
          AppError.badRequest(
            "Nombre, tiempo restante, límite de carga y especialidad son requeridos"
          )
        );
        return;
      }

      // Validar que specialtyId existe
      const specialty = await this.prisma.specialty.findUnique({
        where: { id: parseInt(specialtyId) },
      });

      if (!specialty) {
        next(AppError.badRequest("La especialidad especificada no existe"));
        return;
      }

      // Validar que los valores numéricos sean positivos
      if (remainingTimeMinutes < 0 || workloadLimit < 0) {
        next(
          AppError.badRequest(
            "El tiempo restante y el límite de carga deben ser valores positivos"
          )
        );
        return;
      }

      const newRule = await this.prisma.autoTriageRule.create({
        data: {
          name,
          description: description || "",
          remainingTimeMinutes: parseInt(remainingTimeMinutes),
          workloadLimit: parseInt(workloadLimit),
          specialtyId: parseInt(specialtyId),
          priorityRule: priorityRule || null,
          active: active !== undefined ? active : true,
        },
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          remainingTimeMinutes: true,
          workloadLimit: true,
          priorityRule: true,
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      response.status(201).json({
        success: true,
        message: "Regla de autotriage creada exitosamente",
        data: newRule,
      });
    } catch (error) {
      console.error("Error al crear regla de autotriage:", error);
      next(AppError.internalServer("Error al crear la regla de autotriage"));
      return;
    }
  };

  // PUT /api/autotriage/:id - Actualizar regla existente (admin only)
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { id } = request.params;
      const {
        name,
        description,
        remainingTimeMinutes,
        workloadLimit,
        specialtyId,
        priorityRule,
        active,
      } = request.body;

      // Validar que el ID sea un número válido
      if (!id || isNaN(Number(id))) {
        next(AppError.badRequest("ID de regla no válido"));
        return;
      }

      // Verificar que la regla existe
      const existingRule = await this.prisma.autoTriageRule.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingRule) {
        next(AppError.notFound("Regla de autotriage no encontrada"));
        return;
      }

      // Si se proporciona specialtyId, validar que existe
      if (specialtyId) {
        const specialty = await this.prisma.specialty.findUnique({
          where: { id: parseInt(specialtyId) },
        });

        if (!specialty) {
          next(AppError.badRequest("La especialidad especificada no existe"));
          return;
        }
      }

      // Validar valores numéricos si se proporcionan
      if (
        (remainingTimeMinutes !== undefined && remainingTimeMinutes < 0) ||
        (workloadLimit !== undefined && workloadLimit < 0)
      ) {
        next(
          AppError.badRequest(
            "El tiempo restante y el límite de carga deben ser valores positivos"
          )
        );
        return;
      }

      // Preparar datos para actualización (solo campos proporcionados)
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (remainingTimeMinutes !== undefined)
        updateData.remainingTimeMinutes = parseInt(remainingTimeMinutes);
      if (workloadLimit !== undefined)
        updateData.workloadLimit = parseInt(workloadLimit);
      if (specialtyId !== undefined)
        updateData.specialtyId = parseInt(specialtyId);
      if (priorityRule !== undefined) updateData.priorityRule = priorityRule;
      if (active !== undefined) updateData.active = active;

      const updatedRule = await this.prisma.autoTriageRule.update({
        where: { id: parseInt(id) },
        data: updateData,
        select: {
          id: true,
          name: true,
          description: true,
          active: true,
          remainingTimeMinutes: true,
          workloadLimit: true,
          priorityRule: true,
          specialty: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      });

      response.status(200).json({
        success: true,
        message: "Regla de autotriage actualizada exitosamente",
        data: updatedRule,
      });
    } catch (error) {
      console.error("Error al actualizar regla de autotriage:", error);
      next(AppError.internalServer("Error al actualizar la regla de autotriage"));
      return;
    }
  };

  // DELETE /api/autotriage/:id - Eliminación lógica (setear active = false)
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { id } = request.params;

      // Validar que el ID sea un número válido
      if (!id || isNaN(Number(id))) {
        next(AppError.badRequest("ID de regla no válido"));
        return;
      }

      // Verificar que la regla existe
      const existingRule = await this.prisma.autoTriageRule.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingRule) {
        next(AppError.notFound("Regla de autotriage no encontrada"));
        return;
      }

      // Eliminación lógica: setear active = false
      const deletedRule = await this.prisma.autoTriageRule.update({
        where: { id: parseInt(id) },
        data: { active: false },
        select: {
          id: true,
          name: true,
          active: true,
        },
      });

      response.status(200).json({
        success: true,
        message: "Regla de autotriage desactivada exitosamente",
        data: deletedRule,
      });
    } catch (error) {
      console.error("Error al desactivar regla de autotriage:", error);
      next(AppError.internalServer("Error al desactivar la regla de autotriage"));
      return;
    }
  };

  /**
   * POST /api/autotriage/ejecutar - Ejecuta el proceso de AutoTriage
   * Asigna automáticamente tickets pendientes a técnicos según reglas definidas
   */
  execute = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { userId } = request.body;

      // Validar que userId esté presente
      if (!userId) {
        return next(
          AppError.badRequest("El userId es requerido para ejecutar AutoTriage")
        );
      }

      console.log(`Ejecutando AutoTriage por usuario ${userId}...`);

      // Crear instancia del ejecutor
      const executor = new AutoTriageExecutor();

      // Ejecutar el proceso
      const result = await executor.execute(userId);

      // Determinar código de estado según el resultado
      const statusCode = result.success ? 200 : 207; // 207 Multi-Status si hay errores parciales

      response.status(statusCode).json({
        success: result.success,
        message: result.success
          ? `AutoTriage ejecutado exitosamente. ${result.ticketsAssigned} de ${result.ticketsProcessed} tickets asignados.`
          : `AutoTriage ejecutado con errores. ${result.ticketsAssigned} de ${result.ticketsProcessed} tickets asignados.`,
        data: {
          ticketsProcessed: result.ticketsProcessed,
          ticketsAssigned: result.ticketsAssigned,
          assignments: result.assignments,
          errors: result.errors,
        },
      });
    } catch (error: any) {
      console.error("Error al ejecutar AutoTriage:", error);
      next(
        AppError.internalServer(
          `Error al ejecutar AutoTriage: ${error.message || "Error desconocido"}`
        )
      );
      return;
    }
  };
}
