export type OvertimeStatus =
  | 'PENDIENTE_ADMIN'
  | 'PENDIENTE_GERENCIA_OPERACIONES'
  | 'PENDIENTE_GERENCIA_GENERAL'
  | 'APROBADA'
  | 'OBJETADA';

export type OvertimeRequestType = 'DETECCION_AUTOMATICA' | 'SOLICITUD_ADMINISTRATIVA';

export interface OvertimeRequestItem {
  id: string;
  employeeId: string;
  employeeName: string;
  locationId: string;
  locationName: string;
  type: OvertimeRequestType;
  /** Null on SOLICITUD_ADMINISTRATIVA. */
  accumulatedMinutes: number | null;
  /** Null on SOLICITUD_ADMINISTRATIVA. */
  shiftEndTime: string | null;
  /** Null on SOLICITUD_ADMINISTRATIVA. */
  actualEndTime: string | null;
  status: OvertimeStatus;
  payrollPeriod: string | null;
  workDate?: string | null;
  proposedStartTime?: string | null;
  proposedEndTime?: string | null;
  proposedMinutes?: number | null;
  reasonOptionId?: string | null;
  requestedByUserId?: string | null;
  batchId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OvertimeInboxResult {
  items: OvertimeRequestItem[];
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
}

export interface OvertimePeriodSummary {
  payrollPeriod: string;
  pendingCount: number;
  approvedCount: number;
  objectedCount: number;
}

export interface OvertimeInboxFilters {
  payrollPeriod?: string;
  locationId?: string;
  employeeId?: string;
  status?: OvertimeStatus[];
  cursor?: string;
  take?: number;
}

export interface CreateAdministrativeOvertimeRequestInput {
  employeeIds: string[];
  locationId: string;
  workDate: string;
  proposedStartTime: string;
  proposedEndTime: string;
  reasonOptionId: string;
}

export interface AdministrativeOvertimeCreatedItem {
  id: string;
  employeeId: string;
  locationId: string;
  type: OvertimeRequestType;
  status: OvertimeStatus;
  workDate: string | null;
  proposedStartTime: string | null;
  proposedEndTime: string | null;
  proposedMinutes: number | null;
  reasonOptionId: string | null;
  requestedByUserId: string | null;
  batchId: string | null;
  payrollPeriod: string | null;
  accumulatedMinutes: number | null;
  shiftEndTime: string | null;
  actualEndTime: string | null;
}

export interface CreateAdministrativeOvertimeBatchResult {
  batchId: string;
  createdCount: number;
  items: AdministrativeOvertimeCreatedItem[];
}

export const OVERTIME_STATUS_LABELS: Record<OvertimeStatus, string> = {
  PENDIENTE_ADMIN: 'Pendiente administrador',
  PENDIENTE_GERENCIA_OPERACIONES: 'Pendiente gerencia operaciones',
  PENDIENTE_GERENCIA_GENERAL: 'Pendiente gerencia general',
  APROBADA: 'Aprobada',
  OBJETADA: 'Objetada',
};

export const OVERTIME_TYPE_LABELS: Record<OvertimeRequestType, string> = {
  DETECCION_AUTOMATICA: 'Detección automática',
  SOLICITUD_ADMINISTRATIVA: 'Solicitud administrativa',
};

export const OVERTIME_APPROVER_POSITION_IDS = {
  ADMINISTRADOR: 'pos-pdl-001',
  GERENCIA_OPERACIONES: 'pos-pdl-003',
  GERENCIA_GENERAL: 'pos-pdl-007',
} as const;

/** Código de permiso efectivo (seed ROLE_PERMISSION_MATRIX / PermissionsGuard). */
export const OVERTIME_REQUEST_PERMISSION = 'attendance.overtime.request';
export const OVERTIME_READ_PERMISSION = 'attendance.overtime.read';

export function formatOvertimeApprovalIndicator(
  status: OvertimeStatus | null | undefined,
  accumulatedMinutes?: number | null,
): string {
  if (!status) return '—';
  if (status === 'APROBADA') return 'Aprobada';
  if (status === 'OBJETADA') return 'Objetada';
  const minutes = accumulatedMinutes ? ` (${accumulatedMinutes} min)` : '';
  return `Pendiente${minutes}`;
}
