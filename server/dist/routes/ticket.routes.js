"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketRoutes = void 0;
const express_1 = require("express");
const ticket_controller_1 = require("../controllers/ticket.controller");
class TicketRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new ticket_controller_1.TicketController();
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
exports.TicketRoutes = TicketRoutes;
