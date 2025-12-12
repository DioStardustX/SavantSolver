import { Router } from 'express';
import { ValuationController } from '../controllers/valuation.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const valuationController = new ValuationController();

/**
 * POST /api/tickets/:ticketId/valuations
 * Crear una nueva valoración
 * Solo clientes pueden crear valoraciones
 */
router.post(
  '/tickets/:ticketId/valuations',
  authenticateToken,
  authorizeRoles('Cliente'),
  valuationController.create
);

/**
 * GET /api/tickets/:ticketId/valuations
 * Obtener todas las valoraciones de un ticket
 * Requiere autenticación
 */
router.get(
  '/tickets/:ticketId/valuations',
  authenticateToken,
  valuationController.getByTicket
);

/**
 * GET /api/tecnicos/:tecnicoId/promedio-valoraciones
 * Obtener el promedio de valoraciones de un técnico
 * Requiere autenticación
 */
router.get(
  '/tecnicos/:tecnicoId/promedio-valoraciones',
  authenticateToken,
  valuationController.getAverageByTechnician
);

/**
 * GET /api/valoraciones
 * Obtener listado de valoraciones según rol
 * - Cliente: solo sus valoraciones
 * - Técnico: valoraciones de sus tickets
 * - Admin: todas las valoraciones
 */
router.get(
  '/valoraciones',
  authenticateToken,
  valuationController.getAll
);

export default router;
