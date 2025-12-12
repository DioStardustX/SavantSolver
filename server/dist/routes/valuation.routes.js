"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const valuation_controller_1 = require("../controllers/valuation.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const valuationController = new valuation_controller_1.ValuationController();
/**
 * POST /api/tickets/:ticketId/valuations
 * Crear una nueva valoración
 * Solo clientes pueden crear valoraciones
 */
router.post('/tickets/:ticketId/valuations', auth_middleware_1.authenticateToken, (0, auth_middleware_1.authorizeRoles)('Cliente'), valuationController.create);
/**
 * GET /api/tickets/:ticketId/valuations
 * Obtener todas las valoraciones de un ticket
 * Requiere autenticación
 */
router.get('/tickets/:ticketId/valuations', auth_middleware_1.authenticateToken, valuationController.getByTicket);
/**
 * GET /api/tecnicos/:tecnicoId/promedio-valoraciones
 * Obtener el promedio de valoraciones de un técnico
 * Requiere autenticación
 */
router.get('/tecnicos/:tecnicoId/promedio-valoraciones', auth_middleware_1.authenticateToken, valuationController.getAverageByTechnician);
/**
 * GET /api/valoraciones
 * Obtener listado de valoraciones según rol
 * - Cliente: solo sus valoraciones
 * - Técnico: valoraciones de sus tickets
 * - Admin: todas las valoraciones
 */
router.get('/valoraciones', auth_middleware_1.authenticateToken, valuationController.getAll);
exports.default = router;
