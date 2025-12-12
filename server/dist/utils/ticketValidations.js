"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateImagesRequired = exports.validateCommentRequired = exports.validateTechnicianRequired = exports.validateStatusTransition = void 0;
const custom_error_1 = require("../errors/custom.error");
/**
 * Mapa de transiciones válidas de estado
 * Cada clave representa un estado actual, y su valor es un array de estados válidos siguientes
 */
const VALID_TRANSITIONS = {
    Pendiente: ["Asignado"],
    Asignado: ["En_Proceso"],
    "En_Proceso": ["Resuelto"],
    Resuelto: ["Cerrado"],
    Cerrado: [], // Estado final, no permite transiciones
};
/**
 * Valida si una transición de estado es válida según las reglas de negocio
 * Flujo estrictamente lineal: Pendiente → Asignado → En_Proceso → Resuelto → Cerrado
 * No se permiten retrocesos ni saltos de etapas
 *
 * @param currentStatus - Estado actual del ticket
 * @param newStatus - Nuevo estado al que se quiere transicionar
 * @throws AppError.badRequest si la transición no es válida
 */
const validateStatusTransition = (currentStatus, newStatus) => {
    // Si el estado no cambia, no hay nada que validar
    if (currentStatus === newStatus) {
        return;
    }
    // Obtener estados válidos desde el estado actual
    const validNextStates = VALID_TRANSITIONS[currentStatus];
    // Verificar si la transición es válida
    if (!validNextStates.includes(newStatus)) {
        // Estado Cerrado no permite ninguna transición
        if (currentStatus === "Cerrado") {
            throw custom_error_1.AppError.badRequest(`No se puede cambiar el estado de un ticket cerrado. Estado actual: ${currentStatus}`);
        }
        // Generar mensaje de error descriptivo
        const validStatesText = validNextStates.length > 0
            ? validNextStates.join(", ")
            : "ninguno (estado final)";
        throw custom_error_1.AppError.badRequest(`Transición de estado inválida: no se puede pasar de "${currentStatus}" a "${newStatus}". ` +
            `Estados válidos desde "${currentStatus}": ${validStatesText}. ` +
            `Flujo correcto: Pendiente → Asignado → En Proceso → Resuelto → Cerrado`);
    }
};
exports.validateStatusTransition = validateStatusTransition;
/**
 * Valida que un ticket tenga técnico asignado cuando se requiere
 *
 * @param newStatus - Nuevo estado al que se quiere transicionar
 * @param assignedTechnicianId - ID del técnico asignado (puede ser null)
 * @throws AppError.badRequest si se requiere técnico y no está asignado
 */
const validateTechnicianRequired = (newStatus, assignedTechnicianId) => {
    // Estados que requieren técnico asignado
    const statesRequiringTechnician = [
        "Asignado",
        "En_Proceso",
        "Resuelto",
        "Cerrado",
    ];
    if (statesRequiringTechnician.includes(newStatus) &&
        !assignedTechnicianId) {
        throw custom_error_1.AppError.badRequest(`El estado "${newStatus}" requiere que el ticket tenga un técnico asignado. ` +
            `Por favor, asigne un técnico antes de cambiar el estado.`);
    }
};
exports.validateTechnicianRequired = validateTechnicianRequired;
/**
 * Valida que se proporcione un comentario al cambiar de estado
 *
 * @param comment - Comentario proporcionado
 * @throws AppError.badRequest si el comentario está vacío o es undefined
 */
const validateCommentRequired = (comment) => {
    if (!comment || comment.trim().length === 0) {
        throw custom_error_1.AppError.badRequest("Se requiere un comentario obligatorio al cambiar el estado del ticket. " +
            "Por favor, proporcione una observación que justifique el cambio.");
    }
};
exports.validateCommentRequired = validateCommentRequired;
/**
 * Valida que se proporcione exactamente UNA imagen al cambiar de estado
 * Requisito: Una imagen como evidencia por cada cambio de estado
 *
 * @param images - Array de imágenes (base64) proporcionadas
 * @throws AppError.badRequest si no hay exactamente 1 imagen
 */
const validateImagesRequired = (images) => {
    if (!images || !Array.isArray(images)) {
        throw custom_error_1.AppError.badRequest("Se requiere una imagen como evidencia visual al cambiar el estado del ticket. " +
            "Por favor, adjunte una imagen.");
    }
    if (images.length === 0) {
        throw custom_error_1.AppError.badRequest("Se requiere una imagen como evidencia visual al cambiar el estado del ticket. " +
            "Por favor, adjunte una imagen.");
    }
    if (images.length > 1) {
        throw custom_error_1.AppError.badRequest(`Solo se permite adjuntar UNA imagen por cambio de estado. ` +
            `Se recibieron ${images.length} imágenes. Por favor, adjunte solo una imagen.`);
    }
    // Validar que la imagen sea un string no vacío
    const imagen = images[0];
    if (typeof imagen !== "string" || imagen.trim().length === 0) {
        throw custom_error_1.AppError.badRequest("La imagen proporcionada no es válida. " +
            "Debe ser un string base64 válido.");
    }
};
exports.validateImagesRequired = validateImagesRequired;
