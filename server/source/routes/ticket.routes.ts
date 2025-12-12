import { Router } from "express";
import { TicketController } from "../controllers/ticket.controller";

export class TicketRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new TicketController();

    // Listado de tickets (requiere userId y roleId como query params)
    router.get("/", controller.get);

    // Vista de asignaciones por semana
    router.get("/asignaciones/semana", controller.getAsignacionesSemana);

    // Obtener ticket por ID
    router.get("/:id", controller.getById);

    // Crear ticket
    router.post("/", controller.create);

    // Actualizar ticket
    router.put("/:id", controller.update);

    // Eliminar ticket
    router.delete("/:id", controller.delete);

    return router;
  }
}
