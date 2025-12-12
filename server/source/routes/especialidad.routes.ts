import { Router } from "express";
import { EspecialidadController } from "../controllers/especialidad.controller";

export class EspecialidadRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new EspecialidadController();

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
