"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SlaRoutes = void 0;
const express_1 = require("express");
const sla_controller_1 = require("../controllers/sla.controller");
class SlaRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new sla_controller_1.SlaController();
        // Listado de SLAs
        router.get("/", controller.get);
        // Obtener SLA por ID
        router.get("/:id", controller.getById);
        // Crear SLA
        router.post("/", controller.create);
        // Actualizar SLA
        router.put("/:id", controller.update);
        // Eliminar SLA
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.SlaRoutes = SlaRoutes;
