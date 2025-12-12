import { Router } from "express";
import { TecnicoController } from "../controllers/tecnico.controller";

export class TecnicoRoutes {
  static get routes(): Router {
    const router = Router();
    const controller = new TecnicoController();

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
