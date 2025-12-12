import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { AppError } from "../errors/custom.error";

export class TagController {
  prisma = prisma;

  // Listado de tags con sus categorías asociadas
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const tags = await this.prisma.tag.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          categories: {
            select: {
              category: {
                select: {
                  id: true,
                  name: true,
                  description: true,
                  sla: {
                    select: {
                      id: true,
                      name: true,
                      responseTimeMinutes: true,
                      resolutionTimeMinutes: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: "asc",
        },
      });

      // Transformar respuesta para incluir categorías directamente
      const tagsConCategorias = tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        description: tag.description,
        categories: tag.categories.map((ct) => ct.category),
      }));

      response.json(tagsConCategorias);
    } catch (error) {
      next(error);
    }
  };

  // Obtener tag por ID con sus categorías
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

      const tag = await this.prisma.tag.findUnique({
        where: { id },
        include: {
          categories: {
            select: {
              category: {
                include: {
                  sla: true,
                },
              },
            },
          },
        },
      });

      if (!tag) {
        return next(AppError.notFound("Tag no encontrado"));
      }

      // Transformar respuesta
      const tagConCategorias = {
        id: tag.id,
        name: tag.name,
        description: tag.description,
        categories: tag.categories.map((ct) => ct.category),
      };

      response.json(tagConCategorias);
    } catch (error) {
      next(error);
    }
  };

  // Crear tag
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { name, description } = request.body;

      if (!name) {
        return next(AppError.badRequest("El nombre es requerido"));
      }

      const tagExistente = await this.prisma.tag.findUnique({
        where: { name },
      });

      if (tagExistente) {
        return next(AppError.badRequest("Ya existe un tag con ese nombre"));
      }

      const nuevoTag = await this.prisma.tag.create({
        data: {
          name,
          description,
        },
      });

      response.status(201).json(nuevoTag);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar tag
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const { name, description } = request.body;

      const tagExistente = await this.prisma.tag.findUnique({
        where: { id },
      });

      if (!tagExistente) {
        return next(AppError.notFound("Tag no encontrado"));
      }

      const tagActualizado = await this.prisma.tag.update({
        where: { id },
        data: {
          ...(name && { name }),
          ...(description !== undefined && { description }),
        },
      });

      response.json(tagActualizado);
    } catch (error) {
      next(error);
    }
  };

  // Eliminar tag
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      // Verificar si hay categorías asociadas
      const categoriasAsociadas = await this.prisma.categoryTag.count({
        where: {
          tagId: id,
        },
      });

      if (categoriasAsociadas > 0) {
        return next(
          AppError.badRequest(
            `No se puede eliminar el tag porque tiene ${categoriasAsociadas} categoría(s) asociada(s)`
          )
        );
      }

      await this.prisma.tag.delete({
        where: { id },
      });

      response.json({ message: "Tag eliminado exitosamente" });
    } catch (error) {
      next(error);
    }
  };
}
