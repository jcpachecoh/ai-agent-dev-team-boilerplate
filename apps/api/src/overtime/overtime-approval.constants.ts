import { OvertimeApprovalLevel, OvertimeStatus } from '@prisma/client';

/** D4 — cargos aprobadores (Palos de Leña seed). */
export const OVERTIME_APPROVER_POSITION_IDS: Record<OvertimeApprovalLevel, readonly string[]> = {
  [OvertimeApprovalLevel.ADMINISTRADOR]: ['pos-pdl-001'],
  [OvertimeApprovalLevel.GERENCIA_OPERACIONES]: ['pos-pdl-003'],
  [OvertimeApprovalLevel.GERENCIA_GENERAL]: ['pos-pdl-007'],
};

export const OVERTIME_STATUS_TO_LEVEL: Partial<Record<OvertimeStatus, OvertimeApprovalLevel>> = {
  [OvertimeStatus.PENDIENTE_ADMIN]: OvertimeApprovalLevel.ADMINISTRADOR,
  [OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES]: OvertimeApprovalLevel.GERENCIA_OPERACIONES,
  [OvertimeStatus.PENDIENTE_GERENCIA_GENERAL]: OvertimeApprovalLevel.GERENCIA_GENERAL,
};

export const OVERTIME_NEXT_STATUS_AFTER_APPROVE: Partial<Record<OvertimeStatus, OvertimeStatus>> = {
  [OvertimeStatus.PENDIENTE_ADMIN]: OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
  [OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES]: OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
  [OvertimeStatus.PENDIENTE_GERENCIA_GENERAL]: OvertimeStatus.APROBADA,
};

export const OVERTIME_PENDING_STATUSES: readonly OvertimeStatus[] = [
  OvertimeStatus.PENDIENTE_ADMIN,
  OvertimeStatus.PENDIENTE_GERENCIA_OPERACIONES,
  OvertimeStatus.PENDIENTE_GERENCIA_GENERAL,
];

/** Bandeja histórica completa sin filtro por cargo activo. */
export const OVERTIME_INBOX_HISTORIC_ROLES = new Set(['OWNER', 'SUPER_ADMIN', 'NOMINA']);

/** Roles que no participan en la cascada de aprobación por cargo. */
export const OVERTIME_APPROVAL_BLOCKED_ROLES = new Set(['OWNER', 'SUPER_ADMIN']);

/** RRHH (NOMINA) puede aprobar/objetar en el nivel activo sin validar cargo. */
export const OVERTIME_RRHH_APPROVER_ROLES = new Set(['NOMINA']);

/** @deprecated Use OVERTIME_INBOX_HISTORIC_ROLES */
export const OVERTIME_READ_ONLY_ROLES = OVERTIME_INBOX_HISTORIC_ROLES;

export function resolveActiveApprovalLevel(status: OvertimeStatus): OvertimeApprovalLevel | null {
  return OVERTIME_STATUS_TO_LEVEL[status] ?? null;
}

export function resolveApproverPositionIds(level: OvertimeApprovalLevel): readonly string[] {
  return OVERTIME_APPROVER_POSITION_IDS[level];
}
