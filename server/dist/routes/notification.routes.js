"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("../controllers/notification.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
const notificationController = new notification_controller_1.NotificationController();
// Todas las rutas requieren autenticación
router.use(auth_middleware_1.authenticateToken);
// GET /api/notifications - Obtener todas las notificaciones del usuario
router.get('/', notificationController.get);
// GET /api/notifications/unread-count - Obtener contador de no leídas
router.get('/unread-count', notificationController.getUnreadCount);
// PUT /api/notifications/:id/read - Marcar una notificación como leída
router.put('/:id/read', notificationController.markAsRead);
// PUT /api/notifications/mark-all-read - Marcar todas como leídas
router.put('/mark-all-read', notificationController.markAllAsRead);
exports.default = router;
