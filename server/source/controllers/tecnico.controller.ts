import { Request, Response, NextFunction } from "express";
import prisma from "../prisma";
import { AppError } from "../errors/custom.error";
import bcrypt from "bcryptjs";

export class TecnicoController {
  prisma = prisma;

  // Listado de técnicos
  get = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const roleTecnico = await this.prisma.role.findUnique({
        where: { name: "tecnico" },
      });

      if (!roleTecnico) {
        return next(AppError.notFound("Rol de técnico no encontrado"));
      }

      const tecnicos = await this.prisma.user.findMany({
        where: {
          roleId: roleTecnico.id,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
        orderBy: {
          firstName: "asc",
        },
      });

      response.json(tecnicos);
    } catch (error) {
      next(error);
    }
  };

  // Obtener técnico por ID
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

      const roleTecnico = await this.prisma.role.findUnique({
        where: { name: "tecnico" },
      });

      if (!roleTecnico) {
        return next(AppError.notFound("Rol de técnico no encontrado"));
      }

      const tecnico = await this.prisma.user.findFirst({
        where: {
          id: id,
          roleId: roleTecnico.id,
        },
        include: {
          role: true,
          specialties: {
            select: {
              specialty: true,
            },
          },
          ticketsAssigned: {
            where: {
              status: {
                in: ["Asignado", "En_Proceso"],
              },
            },
            select: {
              id: true,
              title: true,
              status: true,
              priority: true,
              createdAt: true,
            },
          },
        },
      });

      if (!tecnico) {
        return next(AppError.notFound("Técnico no encontrado"));
      }

      response.json(tecnico);
    } catch (error) {
      next(error);
    }
  };

  // Crear técnico
  create = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const { email, firstName, lastName, phone, documentId, password, specialtyIds, status, workload } =
        request.body;

      if (!email || !firstName || !lastName || !password || !documentId) {
        return next(
          AppError.badRequest(
            "Email, nombre, apellido, documento de identidad y contraseña son requeridos"
          )
        );
      }

      const usuarioExistente = await this.prisma.user.findUnique({
        where: { email },
      });

      if (usuarioExistente) {
        return next(AppError.badRequest("El email ya está registrado"));
      }

      const roleTecnico = await this.prisma.role.findUnique({
        where: { name: "tecnico" },
      });

      if (!roleTecnico) {
        return next(AppError.notFound("Rol de técnico no encontrado"));
      }

      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const nuevoTecnico = await this.prisma.user.create({
        data: {
          roleId: roleTecnico.id,
          email,
          passwordHash: hash,
          firstName,
          lastName,
          phone,
          documentId,
          workload: workload !== undefined ? workload : 0,
          status: status || "Disponible",
          specialties:
            specialtyIds && specialtyIds.length > 0
              ? {
                  create: specialtyIds.map((specialtyId: number) => ({
                    specialtyId,
                  })),
                }
              : undefined,
        },
        include: {
          specialties: {
            select: {
              specialty: true,
            },
          },
        },
      });

      response.status(201).json(nuevoTecnico);
    } catch (error) {
      next(error);
    }
  };

  // Actualizar técnico
  update = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const { email, firstName, lastName, phone, documentId, password, status, specialtyIds, workload } =
        request.body;

      const tecnicoExistente = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!tecnicoExistente) {
        return next(AppError.notFound("Técnico no encontrado"));
      }

      // Si se proporciona una nueva contraseña, hashearla
      let passwordHash;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        passwordHash = await bcrypt.hash(password, salt);
      }

      // Si se proporcionan specialtyIds, actualizar las especialidades
      if (specialtyIds !== undefined) {
        await this.prisma.technicianSpecialty.deleteMany({
          where: { userId: id },
        });

        if (specialtyIds.length > 0) {
          await this.prisma.technicianSpecialty.createMany({
            data: specialtyIds.map((specialtyId: number) => ({
              userId: id,
              specialtyId,
            })),
          });
        }
      }

      const tecnicoActualizado = await this.prisma.user.update({
        where: { id },
        data: {
          ...(email && { email }),
          ...(firstName && { firstName }),
          ...(lastName && { lastName }),
          ...(phone !== undefined && { phone }),
          ...(documentId !== undefined && { documentId }),
          ...(passwordHash && { passwordHash }),
          ...(status && { status }),
          ...(workload !== undefined && { workload }),
        },
        include: {
          specialties: {
            select: {
              specialty: true,
            },
          },
        },
      });

      response.json(tecnicoActualizado);
    } catch (error) {
      next(error);
    }
  };

  // Eliminar técnico
  delete = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const id = parseInt(request.params.id);
      if (isNaN(id)) {
        return next(AppError.badRequest("El ID no es válido"));
      }

      const ticketsActivos = await this.prisma.ticket.count({
        where: {
          assignedTechnicianId: id,
          status: {
            in: ["Pendiente", "Asignado", "En_Proceso"],
          },
        },
      });

      if (ticketsActivos > 0) {
        return next(
          AppError.badRequest(
            `No se puede eliminar el técnico porque tiene ${ticketsActivos} ticket(s) activo(s)`
          )
        );
      }

      await this.prisma.user.delete({
        where: { id },
      });

      response.json({ message: "Técnico eliminado exitosamente" });
    } catch (error) {
      next(error);
    }
  };
}
