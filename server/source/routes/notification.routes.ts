import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const notificationController = new NotificationController();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/notifications - Obtener todas las notificaciones del usuario
router.get('/', notificationController.get);

// GET /api/notifications/unread-count - Obtener contador de no leídas
router.get('/unread-count', notificationController.getUnreadCount);

// PUT /api/notifications/:id/read - Marcar una notificación como leída
router.put('/:id/read', notificationController.markAsRead);

// PUT /api/notifications/mark-all-read - Marcar todas como leídas
router.put('/mark-all-read', notificationController.markAllAsRead);

export default router;
