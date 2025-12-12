"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post('/register', auth_controller_1.register);
/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', auth_controller_1.login);
/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario actual
 * @access  Private (requiere token)
 */
router.get('/me', auth_middleware_1.authenticateToken, auth_controller_1.getCurrentUser);
/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión
 * @access  Private (requiere token)
 */
router.post('/logout', auth_middleware_1.authenticateToken, auth_controller_1.logout);
exports.default = router;
