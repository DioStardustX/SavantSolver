"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TecnicoRoutes = void 0;
const express_1 = require("express");
const tecnico_controller_1 = require("../controllers/tecnico.controller");
class TecnicoRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new tecnico_controller_1.TecnicoController();
        // Listado de técnicos
        router.get("/", controller.get);
        // Obtener técnico por ID
        router.get("/:id", controller.getById);
        // Crear técnico
        router.post("/", controller.create);
        // Actualizar técnico
        router.put("/:id", controller.update);
        // Eliminar técnico
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.TecnicoRoutes = TecnicoRoutes;
