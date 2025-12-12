import { Router } from "express";
import { TagController } from "../controllers/tag.controller";

export class TagRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new TagController();

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
