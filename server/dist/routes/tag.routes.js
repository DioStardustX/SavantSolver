"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagRoutes = void 0;
const express_1 = require("express");
const tag_controller_1 = require("../controllers/tag.controller");
class TagRoutes {
    static get routes() {
        const router = (0, express_1.Router)();
        const controller = new tag_controller_1.TagController();
        // Listado de tags
        router.get("/", controller.get);
        // Obtener tag por ID
        router.get("/:id", controller.getById);
        // Crear tag
        router.post("/", controller.create);
        // Actualizar tag
        router.put("/:id", controller.update);
        // Eliminar tag
        router.delete("/:id", controller.delete);
        return router;
    }
}
exports.TagRoutes = TagRoutes;
