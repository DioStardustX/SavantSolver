import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import prisma from '../prisma';
import bcrypt from 'bcryptjs';

// Obtener todos los usuarios con filtro opcional por rol
export const obtenerUsuarios = async (req: Request, res: Response) => {
  try {
    const { roleName } = req.query;

    // Construir el where clause
    const whereClause: any = {};

    // Si se especifica un rol, filtrar por ese rol
    if (roleName) {
      const role = await prisma.role.findUnique({
        where: { name: roleName as string },
      });

      if (role) {
        whereClause.roleId = role.id;
      }
    }

    const usuarios = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        workload: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: usuarios,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

// Obtener un usuario por ID con sus tickets y especialidades
export const obtenerUsuarioPorId = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const usuario = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        status: true,
        workload: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
        lastLogin: true,
        // Tickets creados por el usuario (para clientes)
        ticketsCreated: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            createdAt: true,
            category: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        // Tickets asignados al técnico (para técnicos)
        ticketsAssigned: {
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
            createdAt: 'desc',
          },
        },
        // Especialidades (para técnicos)
        specialties: {
          select: {
            specialty: {
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

    if (!usuario) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: usuario,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

// Crear un nuevo usuario
export const crearUsuario = async (req: Request, res: Response) => {
  try {
    const { email, firstName, lastName, password, phone, roleName } = req.body;

    // Validar que el email no exista
    const usuarioExistente = await prisma.user.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    // Obtener el rol
    const role = await prisma.role.findUnique({
      where: { name: roleName || 'cliente' },
    });

    if (!role) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Rol no encontrado',
      });
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear el usuario
    const nuevoUsuario = await prisma.user.create({
      data: {
        email,
        firstName,
        lastName,
        phone,
        passwordHash: hashedPassword,
        roleId: role.id,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: nuevoUsuario,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al crear usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone } = req.body;

    const usuarioActualizado = await prisma.user.update({
      where: { id: parseInt(id) },
      data: {
        ...(email && { email }),
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone !== undefined && { phone }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: usuarioActualizado,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Usuario eliminado exitosamente',
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
