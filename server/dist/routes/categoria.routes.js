"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoriaRoutes = void 0;
const express_1 = require("express");
const categoria_controller_1 = require("../controllers/categoria.controller");
class CategoriaRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new categoria_controller_1.CategoriaController();
        // Listado de categorías
        router.get("/", controller.get);
        // Obtener categoría por ID
        router.get("/:id", controller.getById);
        // Crear categoría
        router.post("/", controller.create);
        // Actualizar categoría
        router.put("/:id", controller.update);
        // Eliminar categoría
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.CategoriaRoutes = CategoriaRoutes;
