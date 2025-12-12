"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EspecialidadRoutes = void 0;
const express_1 = require("express");
const especialidad_controller_1 = require("../controllers/especialidad.controller");
class EspecialidadRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new especialidad_controller_1.EspecialidadController();
        // Listado de especialidades
        router.get("/", controller.get);
        // Obtener especialidad por ID
        router.get("/:id", controller.getById);
        // Crear especialidad
        router.post("/", controller.create);
        // Actualizar especialidad
        router.put("/:id", controller.update);
        // Eliminar especialidad
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.EspecialidadRoutes = EspecialidadRoutes;
