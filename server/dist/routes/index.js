"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const usuario_routes_1 = __importDefault(require("./usuario.routes"));
const tecnico_routes_1 = require("./tecnico.routes");
const categoria_routes_1 = require("./categoria.routes");
const ticket_routes_1 = require("./ticket.routes");
const autotriage_routes_1 = require("./autotriage.routes");
const especialidad_routes_1 = require("./especialidad.routes");
const tag_routes_1 = require("./tag.routes");
const sla_routes_1 = require("./sla.routes");
const notification_routes_1 = __importDefault(require("./notification.routes"));
const valuation_routes_1 = __importDefault(require("./valuation.routes"));
const dashboard_routes_1 = __importDefault(require("./dashboard.routes"));
const router = (0, express_1.Router)();
// Rutas de autenticación
router.use('/auth', auth_routes_1.default); // POST /api/auth/login
// Rutas de usuarios
router.use('/usuarios', usuario_routes_1.default);
// Resto de rutas
router.use('/tecnicos', tecnico_routes_1.TecnicoRoutes.routes);
router.use('/categorias', categoria_routes_1.CategoriaRoutes.routes);
router.use('/tickets', ticket_routes_1.TicketRoutes.routes);
router.use('/autotriage', autotriage_routes_1.AutoTriageRoutes.routes);
router.use('/especialidades', especialidad_routes_1.EspecialidadRoutes.routes);
router.use('/tags', tag_routes_1.TagRoutes.routes);
router.use('/slas', sla_routes_1.SlaRoutes.routes);
router.use('/notifications', notification_routes_1.default);
// Valoraciones y dashboard
router.use('/', valuation_routes_1.default);
router.use('/', dashboard_routes_1.default);
exports.default = router;
