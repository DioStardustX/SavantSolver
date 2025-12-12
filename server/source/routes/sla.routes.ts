import { Router } from "express";
import { SlaController } from "../controllers/sla.controller";

export class SlaRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new SlaController();

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
