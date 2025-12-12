"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoTriageRoutes = void 0;
const express_1 = require("express");
const autotriage_controller_1 = require("../controllers/autotriage.controller");
class AutoTriageRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new autotriage_controller_1.AutoTriageController();
        // Listar todas las reglas (con filtro opcional ?active=true/false)
        router.get("/", controller.get);
        // Ejecutar AutoTriage - Asignar automáticamente tickets pendientes
        router.post("/ejecutar", controller.execute);
        // Obtener regla por ID
        router.get("/:id", controller.getById);
        // Crear nueva regla (admin only - middleware can be added later)
        router.post("/", controller.create);
        // Actualizar regla existente (admin only - middleware can be added later)
        router.put("/:id", controller.update);
        // Desactivar regla (eliminación lógica) (admin only - middleware can be added later)
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.AutoTriageRoutes = AutoTriageRoutes;
