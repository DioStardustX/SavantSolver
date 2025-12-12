import { Router } from "express";
import { CategoriaController } from "../controllers/categoria.controller";

export class CategoriaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new CategoriaController();

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
