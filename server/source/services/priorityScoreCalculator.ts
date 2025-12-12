import { TicketPriority, TicketStatus } from "../../generated/prisma";

/**
 * Servicio para calcular el puntaje de prioridad de tickets
 * Fórmula: puntaje = (prioridad * 1000) - tiempoRestanteSLA
 */

interface TicketForScore {
  id: number;
  priority: TicketPriority;
  createdAt: Date;
  responseDeadline?: Date | null;
  resolutionDeadline?: Date | null;
  status: TicketStatus;
}

interface TechnicianForScore {
  id: number;
  workload: number;
  status: string;
  specialties?: Array<{ id: number; name: string }>;
}

interface ScoreResult {
  score: number;
  priorityValue: number;
  remainingMinutes: number;
  explanation: string;
}

/**
 * Convierte la prioridad del ticket a valor numérico
 */
export function getPriorityValue(priority: TicketPriority): number {
  const priorityMap: Record<TicketPriority, number> = {
    Alta: 3,
    Media: 2,
    Baja: 1,
  };
  return priorityMap[priority] || 1;
}

/**
 * Calcula los minutos restantes hasta el deadline del SLA
 * Usa responseDeadline si el ticket está en Pendiente/Asignado
 * Usa resolutionDeadline si el ticket está en proceso
 */
export function calculateRemainingMinutes(ticket: TicketForScore): number {
  const now = new Date();

  // Determinar qué deadline usar según el estado
  let deadline: Date | null | undefined;

  if (ticket.status === "Pendiente" || ticket.status === "Asignado") {
    deadline = ticket.responseDeadline;
  } else {
    deadline = ticket.resolutionDeadline;
  }

  // Si no hay deadline, usar un valor alto (baja prioridad)
  if (!deadline) {
    return 10000; // 10000 minutos = ~7 días
  }

  const deadlineDate = new Date(deadline);
  const diffMs = deadlineDate.getTime() - now.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Si el deadline ya pasó, retornar 0 (urgente)
  return Math.max(0, diffMinutes);
}

/**
 * Calcula el puntaje de prioridad del ticket
 * Fórmula: puntaje = (prioridad * 1000) - tiempoRestanteSLA
 *
 * Interpretación:
 * - Puntaje alto = más urgente (necesita atención inmediata)
 * - Puntaje bajo = menos urgente
 *
 * Ejemplos:
 * - Prioridad Alta (3), 30 min restantes: 3000 - 30 = 2970 (muy urgente)
 * - Prioridad Media (2), 120 min restantes: 2000 - 120 = 1880
 * - Prioridad Baja (1), 500 min restantes: 1000 - 500 = 500
 */
export function calculatePriorityScore(ticket: TicketForScore): ScoreResult {
  const priorityValue = getPriorityValue(ticket.priority);
  const remainingMinutes = calculateRemainingMinutes(ticket);

  const score = priorityValue * 1000 - remainingMinutes;

  const explanation = `Prioridad: ${ticket.priority} (${priorityValue}) × 1000 = ${
    priorityValue * 1000
  } | Tiempo restante: ${remainingMinutes} minutos | Puntaje: ${score}`;

  return {
    score,
    priorityValue,
    remainingMinutes,
    explanation,
  };
}

/**
 * Evalúa si un técnico es elegible para un ticket según las reglas de AutoTriage
 *
 * @param technician - Técnico a evaluar
 * @param requiredSpecialtyId - ID de especialidad requerida (opcional)
 * @param workloadLimit - Límite máximo de carga de trabajo
 * @returns true si el técnico es elegible
 */
export function isTechnicianEligible(
  technician: TechnicianForScore,
  requiredSpecialtyId: number | null | undefined,
  workloadLimit: number
): { eligible: boolean; reason?: string } {
  // 1. Verificar disponibilidad
  if (technician.status !== "Disponible") {
    return {
      eligible: false,
      reason: `Técnico no disponible (estado: ${technician.status})`,
    };
  }

  // 2. Verificar carga de trabajo
  if (technician.workload >= workloadLimit) {
    return {
      eligible: false,
      reason: `Carga de trabajo excedida (${technician.workload}/${workloadLimit})`,
    };
  }

  // 3. Verificar especialidad (si se requiere)
  if (requiredSpecialtyId) {
    const hasSpecialty = technician.specialties?.some(
      (s) => s.id === requiredSpecialtyId
    );

    if (!hasSpecialty) {
      return {
        eligible: false,
        reason: "No tiene la especialidad requerida",
      };
    }
  }

  return { eligible: true };
}

/**
 * Selecciona el mejor técnico de una lista según su carga de trabajo
 * En caso de empate, selecciona el que tenga menor workload
 *
 * @param technicians - Lista de técnicos elegibles
 * @returns Técnico con menor carga de trabajo
 */
export function selectBestTechnician(
  technicians: TechnicianForScore[]
): TechnicianForScore | null {
  if (technicians.length === 0) {
    return null;
  }

  // Ordenar por workload ascendente
  const sorted = [...technicians].sort((a, b) => a.workload - b.workload);

  return sorted[0];
}

/**
 * Genera una justificación detallada para la asignación
 */
export function generateAssignmentJustification(
  ticket: TicketForScore,
  technician: TechnicianForScore,
  scoreResult: ScoreResult,
  ruleName?: string
): string {
  const parts: string[] = [];

  if (ruleName) {
    parts.push(`Regla aplicada: "${ruleName}"`);
  }

  parts.push(
    `Ticket #${ticket.id} - Prioridad: ${ticket.priority} (${scoreResult.priorityValue})`
  );
  parts.push(
    `Tiempo restante SLA: ${scoreResult.remainingMinutes} minutos`
  );
  parts.push(`Puntaje calculado: ${scoreResult.score}`);
  parts.push(
    `Técnico seleccionado: ID ${technician.id} con carga de ${technician.workload} tickets`
  );

  if (technician.specialties && technician.specialties.length > 0) {
    const specialtyNames = technician.specialties.map((s) => s.name).join(", ");
    parts.push(`Especialidades: ${specialtyNames}`);
  }

  return parts.join(" | ");
}
