import { Router } from "express";
import { AutoTriageController } from "../controllers/autotriage.controller";

export class AutoTriageRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new AutoTriageController();

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
