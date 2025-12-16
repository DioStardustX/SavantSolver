import { Router } from "express";

import authRoutes from "./auth.routes";
import usuarioRoutes from "./usuario.routes";

import { TecnicoRoutes } from "./tecnico.routes";
import { CategoriaRoutes } from "./categoria.routes";
import { TicketRoutes } from "./ticket.routes";
import { AutoTriageRoutes } from "./autotriage.routes";
import { EspecialidadRoutes } from "./especialidad.routes";
import { TagRoutes } from "./tag.routes";
import { SlaRoutes } from "./sla.routes";

import notificationRoutes from "./notification.routes";
import valuationRoutes from "./valuation.routes";
import dashboardRoutes from "./dashboard.routes";

const router = Router();

// ========= RUTAS BASE =========
router.use("/auth", authRoutes);
router.use("/usuarios", usuarioRoutes);

// ========= RUTAS CON CLASES =========
router.use("/tecnicos", TecnicoRoutes.routes);
router.use("/categorias", CategoriaRoutes.routes);
router.use("/tickets", TicketRoutes.routes);
router.use("/autotriage", AutoTriageRoutes.routes);
router.use("/especialidades", EspecialidadRoutes.routes);
router.use("/tags", TagRoutes.routes);
router.use("/slas", SlaRoutes.routes);

// ========= OTRAS RUTAS =========
router.use("/notificaciones", notificationRoutes);
router.use("/valoraciones", valuationRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;
