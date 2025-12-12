import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { AppError } from "../errors/custom.error";

export class EspecialidadController {
  prisma = prisma;

  // Listado de especialidades
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const especialidades = await this.prisma.specialty.findMany({
        select: {
          id: true,
          name: true,
          description: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      response.json(especialidades);
    } catch (error) {
      next(error);
    }
  };

  // Obtener especialidad por ID
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

      const especialidad = await this.prisma.specialty.findUnique({
        where: { id },
        include: {
          technicians: {
            select: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  status: true,
                },
              },
            },
          },
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                },
              },
            },
          },
        },
      });

      if (!especialidad) {
        return next(AppError.notFound("Especialidad no encontrada"));
      }

      response.json(especialidad);
    } catch (error) {
      next(error);
    }
  };

  // Crear especialidad
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { name, description } = request.body;

      if (!name) {
        return next(AppError.badRequest("El nombre es requerido"));
      }

      const especialidadExistente = await this.prisma.specialty.findUnique({
        where: { name },
      });

      if (especialidadExistente) {
        return next(
          AppError.badRequest("Ya existe una especialidad con ese nombre")
        );
      }

      const nuevaEspecialidad = await this.prisma.specialty.create({
        data: {
          name,
          description,
        },
      });

      response.status(201).json(nuevaEspecialidad);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar especialidad
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const { name, description } = request.body;

      const especialidadExistente = await this.prisma.specialty.findUnique({
        where: { id },
      });

      if (!especialidadExistente) {
        return next(AppError.notFound("Especialidad no encontrada"));
      }

      const especialidadActualizada = await this.prisma.specialty.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      response.json(especialidadActualizada);
    } catch (error) {
      next(error);
    }
  };

  // Eliminar especialidad
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      // Verificar si hay técnicos asociados
      const tecnicosAsociados = await this.prisma.technicianSpecialty.count({
        where: {
          specialtyId: id,
        },
      });

      if (tecnicosAsociados > 0) {
        return next(
          AppError.badRequest(
            `No se puede eliminar la especialidad porque tiene ${tecnicosAsociados} técnico(s) asociado(s)`
          )
        );
      }

      await this.prisma.specialty.delete({
        where: { id },
      });

      response.json({ message: "Especialidad eliminada exitosamente" });
    } catch (error) {
      next(error);
    }
  };
}
