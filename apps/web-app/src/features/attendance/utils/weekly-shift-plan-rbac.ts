import { SYSTEM_ADMIN_ROLES, canWriteTurnoAssignments } from '@/config/rbac.config';

/** Admin sede / supervisor: enviar planeación (mismos roles de escritura de asignación). */
export function canSubmitWeeklyShiftPlan(roleCode: string | null | undefined): boolean {
  return canWriteTurnoAssignments(roleCode);
}

/** Gerente de operaciones (+ admins): aprobar / rechazar. SUPERVISOR no aprueba. */
export function canApproveWeeklyShiftPlan(roleCode: string | null | undefined): boolean {
  if (!roleCode) return false;
  return (SYSTEM_ADMIN_ROLES as readonly string[]).includes(roleCode) || roleCode === 'MANAGER';
}
