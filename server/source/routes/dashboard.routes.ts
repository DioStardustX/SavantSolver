import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * GET /api/dashboard/stats
 * Obtener todas las estadísticas para el dashboard
 * Solo para administradores
 */
router.get(
  '/dashboard/stats',
  authenticateToken,
  authorizeRoles('Admin', 'Administrador'),
  dashboardController.getStats
);

export default router;
