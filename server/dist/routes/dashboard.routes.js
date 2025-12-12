"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const dashboardController = new dashboard_controller_1.DashboardController();
/**
 * GET /api/dashboard/stats
 * Obtener todas las estadísticas para el dashboard
 * Solo para administradores
 */
router.get('/dashboard/stats', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRoles)('Admin', 'Administrador'), dashboardController.getStats);
exports.default = router;
